import Foundation
import Observation

@MainActor @Observable
final class DatePollOwner {
    let meetingID: UUID
    let session: SessionStore
    let lease: PrivateData.Lease?
    var poll: DatePoll?
    var selection: Set<UUID> = []
    var edited = false
    var busy = false
    var loading = false
    private var loadFailed = false
    var problem: String?
    var pending: APIRequest?
    @ObservationIgnored private var version = UUID()

    init(meetingID: UUID, session: SessionStore) {
        self.meetingID = meetingID
        self.session = session
        lease = try? session.privateData.lease(for: meetingID)
    }

    var current: Bool { lease.map { session.privateData.isCurrent($0) } == true }
    var editable: Bool { current && !busy && pending == nil }

    func load(_ id: UUID) async {
        guard current, !loading, !busy else { return }
        let stamp = version
        loading = true
        defer { if stamp == version { loading = false } }
        do {
            let value = try await session.send(
                DatePollRequests.read(meetingID, id), as: DatePoll.self)
            try Task.checkCancellation()
            guard current, stamp == version else { return }
            try receive(value)
            if loadFailed { problem = nil }
            loadFailed = false
        } catch {
            guard stamp == version else { return }
            if !current {
                clear()
            } else if !(error is CancellationError) {
                loadFailed = true
                problem = "Не удалось загрузить опрос."
            }
        }
    }

    func choose(_ id: UUID) {
        guard editable, let poll, poll.canVote else { return }
        if selection.contains(id) {
            selection.remove(id)
        } else if poll.settings.multipleAnswers {
            selection.insert(id)
        } else {
            selection = [id]
        }
        edited = true
    }

    func vote(clear: Bool = false) async {
        guard let poll else { return }
        await action(
            kind: "vote",
            fields: [
                "option_ids": .array(
                    (clear ? [] : selection.sorted { $0.uuidString < $1.uuidString })
                        .map { .string($0.uuidString.lowercased()) })
            ], poll: poll)
    }

    func action(kind: String, fields: [String: JSONValue], poll: DatePoll) async {
        do { await submit(try DatePollRequests.action(poll, kind: kind, fields: fields)) } catch {
            problem = "Не удалось подготовить действие."
        }
    }

    func submit(_ request: APIRequest) async {
        guard current, !busy else { return }
        version = UUID()
        loading = false
        let stamp = version
        let operation = pending ?? request
        pending = operation
        busy = true
        problem = nil
        loadFailed = false
        defer { if stamp == version { busy = false } }
        do {
            let value = try await session.send(operation, as: DatePoll.self)
            try Task.checkCancellation()
            guard current, stamp == version else { return }
            edited = false
            try receive(value)
            pending = nil
            await MeetingRepository(session: session).loadMeeting(meetingID)
            await MeetingRepository(session: session).loadMeetings()
        } catch {
            guard stamp == version else { return }
            guard current else {
                clear()
                return
            }
            if let status = (error as? ClientFailure)?.statusCode, (400..<500).contains(status) {
                pending = nil
                if status == 409, let id = poll?.id {
                    busy = false
                    await load(id)
                }
                problem = DatePollCopy.error(error)
            } else {
                problem = "Не удалось получить ответ. Повторите отправку."
            }
        }
    }

    func retry() async { if let pending { await submit(pending) } }

    func clear() {
        version = UUID()
        poll = nil
        selection = []
        pending = nil
        problem = nil
        busy = false
        loading = false
    }

    private func receive(_ value: DatePoll) throws {
        guard value.meetingID == meetingID else { throw ClientFailure.invalidResponse }
        poll = value
        if !edited { selection = Set(value.myOptionIDs) }
    }
}
