import Foundation
import Observation

@MainActor @Observable
final class MediaTransferOwner {
    let id: UUID
    let session: SessionStore
    let purpose: String
    private let lease: PrivateData.Lease?
    var pending: [PendingMedia] = []
    var limits: MediaLimits?
    var problem: String?
    var completed: [MeetingMedia] = []
    var entries: [FeedEntry] = []
    var completedBatch = 0
    private var sendingBatch = false
    private var generation = UUID()
    @ObservationIgnored private var work: Task<Void, Never>?
    init(id: UUID, session: SessionStore, purpose: String) {
        self.id = id
        self.session = session
        self.purpose = purpose
        lease = try? session.privateData.lease(for: id)
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    var busy: Bool { sendingBatch || pending.contains { $0.stage == .uploading } }
    var canSend: Bool {
        pending.contains { $0.stage == .ready || ($0.stage == .failed && $0.problem == nil) }
    }
    func loadLimits() async {
        guard current, limits == nil else { return }
        do {
            let result = try await session.send(
                ExperienceRequests.meeting(id, ["media", "limits"]), as: MediaLimits.self)
            try Task.checkCancellation()
            if current {
                limits = result
                problem = nil
            }
        } catch {
            if current, !(error is CancellationError) {
                problem = "Не удалось проверить ограничения файлов. Повторите загрузку."
            }
        }
    }
    func add(_ files: [PendingMedia]) async {
        await loadLimits()
        guard current, let limits else { return }
        guard files.count + pending.filter({ $0.stage != .published }).count <= limits.maxFiles
        else {
            problem = "Выберите не больше \(limits.maxFiles) файлов."
            return
        }
        for var file in files {
            let photo = file.contentType.hasPrefix("image/")
            let allowed = purpose == "memory" ? limits.photoTypes : limits.fileTypes
            let maximum = photo ? limits.maxPhotoBytes : limits.maxFileBytes
            if !allowed.contains(file.contentType) || file.data.count > maximum || file.data.isEmpty
            {
                file.stage = .failed
                file.problem =
                    "Тип или размер файла не подходит. Максимум: \(maximum / 1024 / 1024) МБ."
            }
            pending.append(file)
        }
    }
    func remove(_ key: UUID) {
        guard !busy else { return }
        pending.removeAll { $0.id == key && $0.stage != .uploading }
    }
    func setCaption(_ caption: String, for key: UUID) {
        guard current, !busy, let index = pending.firstIndex(where: { $0.id == key }),
            pending[index].stage == .ready, pending[index].media == nil,
            !pending[index].contentType.hasPrefix("image/")
        else { return }
        var value = ""
        var length = 0
        for character in caption {
            let count = character.unicodeScalars.count
            guard length + count <= 2000 else { break }
            value.append(character)
            length += count
        }
        pending[index].caption = value
    }
    func send() {
        guard current, !busy else { return }
        let keys = pending.filter {
            $0.stage == .ready || ($0.stage == .failed && $0.problem == nil)
        }.map(\.id)
        guard !keys.isEmpty else { return }
        work?.cancel()
        sendingBatch = true
        let version = generation
        work = Task {
            defer {
                if generation == version {
                    sendingBatch = false
                    work = nil
                }
            }
            for key in keys {
                guard !Task.isCancelled, current, generation == version else { return }
                await upload(key)
            }
            guard current, generation == version else { return }
            if pending.allSatisfy({ $0.stage == .published }) { completedBatch += 1 }
        }
    }
    func retry(_ key: UUID) {
        guard !busy, let index = pending.firstIndex(where: { $0.id == key }),
            pending[index].problem == nil
        else { return }
        pending[index].stage = .ready
        send()
    }
    func upload(_ key: UUID) async {
        guard current, let index = pending.firstIndex(where: { $0.id == key }) else { return }
        let version = generation
        let file = pending[index]
        pending[index].stage = .uploading
        pending[index].transferFailure = nil
        pending[index].transferPhase = "prepare"
        do {
            var media: MeetingMedia
            if let prepared = file.media {
                media = prepared
            } else {
                media = try await session.send(
                    ExperienceRequests.prepare(id, file: file, purpose: purpose),
                    as: MediaEnvelope.self
                ).media
            }
            guard current, generation == version else { return }
            guard media.meetingID == id, media.purpose == purpose else {
                throw ClientFailure.invalidResponse
            }
            pending[index].media = media
            pending[index].transferPhase = "upload"
            media = try await session.send(
                ExperienceRequests.upload(media, data: file.data), as: MediaEnvelope.self
            ).media
            guard current, generation == version else { return }
            guard media.meetingID == id, media.purpose == purpose,
                media.id == pending[index].media?.id
            else { throw ClientFailure.invalidResponse }
            pending[index].transferPhase = "publish"
            let result = try await session.send(
                ExperienceRequests.publish(media, key: file.publishKey, caption: file.caption),
                as: MediaEnvelope.self)
            try Task.checkCancellation()
            guard current, generation == version else { return }
            guard result.media.meetingID == id, result.media.id == media.id,
                result.media.status == "published",
                result.entry == nil || result.entry?.meetingID == id
            else { throw ClientFailure.invalidResponse }
            pending[index].stage = .published
            pending[index].transferPhase = nil
            completed.append(result.media)
            if let entry = result.entry { entries.append(entry) }
        } catch {
            guard generation == version, current,
                let index = pending.firstIndex(where: { $0.id == key })
            else { return }
            pending[index].stage = .failed
            pending[index].transferFailure = .sanitized(error)
        }
    }
    func suspend() {
        generation = UUID()
        work?.cancel()
        work = nil
        sendingBatch = false
        for index in pending.indices where pending[index].stage == .uploading {
            pending[index].stage = .failed
        }
        if !current {
            pending = []
            completed = []
            entries = []
            limits = nil
        }
    }
}
