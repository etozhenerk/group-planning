import Foundation
import Observation

@MainActor @Observable
final class CreationOwner {
    private(set) var record: DraftRecord
    private(set) var ready = false
    private(set) var busy = false
    private(set) var problem: String?
    private(set) var draftWarning: String?
    private(set) var created: CreatedMeeting?
    private(set) var dismissed = false
    private(set) var needsTimeChoice = false
    var confirmDiscard = false
    var closeFailed = false
    let session: SessionStore
    @ObservationIgnored private let initialDay: MeetingDraft.Day?
    @ObservationIgnored private let drafts: DraftRepository
    @ObservationIgnored private let sessionLease: PrivateData.Lease?
    @ObservationIgnored private var draftLease: UUID?
    @ObservationIgnored private var persistence: Task<Void, Never>?
    @ObservationIgnored private var operation: Task<Void, Never>?
    var value: MeetingDraft { record.value }
    var frozen: Bool { record.submission != nil }
    var editable: Bool { ready && !busy && !frozen }
    var current: Bool {
        session.status == .authenticated && session.profile?.id == record.ownerID
            && sessionLease.map(session.privateData.isCurrent) == true
    }

    init(
        userID: UUID, session: SessionStore, drafts: DraftRepository,
        timezone: String = TimeZone.current.identifier, initialDay: MeetingDraft.Day? = nil
    ) {
        self.session = session
        self.drafts = drafts
        self.initialDay = initialDay
        sessionLease = try? session.privateData.lease()
        record = DraftRecord(ownerID: userID, value: MeetingDraft(timezone: timezone))
    }

    func load() async {
        guard !ready, current else { return }
        do {
            let (lease, saved) = try await drafts.open(owner: record.ownerID)
            try Task.checkCancellation()
            guard current else { return }
            draftLease = lease
            if let saved { record = saved }
            if let initialDay, record.submission == nil {
                record.value.day = initialDay
                record.value.repetition = nil
                record.requestID = UUID()
                try await drafts.save(record, lease: lease)
                guard current else { return }
            }
            ready = true
            problem =
                frozen
                ? "Результат сохранения не подтверждён. Повторите запрос с теми же данными." : nil
        } catch {
            if !(error is CancellationError), current {
                problem = "Не удалось открыть черновик. Попробуйте ещё раз."
            }
        }
    }

    func change(_ update: (inout MeetingDraft) -> Void) {
        guard editable else { return }
        let previous = record.value
        var updated = previous
        update(&updated)
        record.value = updated
        if previous.day != value.day || previous.clock != value.clock {
            record.value.repetition = nil
            needsTimeChoice = false
        }
        record.requestID = UUID()
        problem = nil
        draftWarning = nil
        persistence?.cancel()
        let snapshot = record
        let lease = draftLease
        persistence = Task {
            do {
                try await Task.sleep(for: .milliseconds(200))
                guard let lease else { return }
                try await drafts.save(snapshot, lease: lease)
            } catch {
                if !(error is CancellationError), current {
                    draftWarning = "Черновик не сохранился на устройстве."
                }
            }
        }
    }

    func retryLoad() {
        guard operation == nil else { return }
        operation = Task {
            await load()
            operation = nil
        }
    }

    func startSubmit() {
        guard operation == nil, ready, !busy else { return }
        operation = Task {
            await submit()
            operation = nil
        }
    }

    func submit() async {
        guard current, ready, !busy, let draftLease else { return }
        busy = true
        problem = nil
        persistence?.cancel()
        defer { busy = false }
        do {
            if record.submission == nil { record.submission = try value.input() }
            try await drafts.save(record, lease: draftLease)
            guard current, let input = record.submission else { return }
            let result = try await session.send(
                MeetingRequests.create(input, key: record.requestID), as: CreatedMeeting.self)
            try Task.checkCancellation()
            guard current else { return }
            try await drafts.remove(owner: record.ownerID, lease: draftLease)
            guard current else { return }
            session.privateData.details[result.meeting.id] = ResourceState()
            if let token = session.privateData.details[result.meeting.id]?.begin() {
                session.privateData.details[result.meeting.id]?.succeed(
                    result.meeting, requestID: token)
            }
            created = result
        } catch let issue as DraftIssue {
            record.submission = nil
            needsTimeChoice = issue == .ambiguous
            problem = issue.text
        } catch {
            guard current else { return }
            if let status = (error as? ClientFailure)?.statusCode,
                [400, 403, 409, 422].contains(status)
            {
                record.submission = nil
                problem =
                    status == 422
                    ? "Проверьте поля встречи и попробуйте ещё раз."
                    : "Не удалось сохранить встречу. Попробуйте ещё раз."
                try? await drafts.save(record, lease: draftLease)
            } else {
                problem = "Не удалось подтвердить сохранение. Повторите запрос с теми же данными."
            }
        }
    }

    func requestClose() {
        guard !busy else { return }
        if value.isEmpty { dismissed = true } else { confirmDiscard = true }
    }

    func close() {
        guard operation == nil, let draftLease else {
            dismissed = true
            return
        }
        operation = Task {
            persistence?.cancel()
            do {
                try await drafts.save(record, lease: draftLease)
                dismissed = true
            } catch { closeFailed = true }
            operation = nil
        }
    }

    func forceClose() { dismissed = true }
    func cancel() {
        operation?.cancel()
        persistence?.cancel()
        operation = nil
    }
}
