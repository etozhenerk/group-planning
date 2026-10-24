import Foundation
import Observation

@MainActor @Observable
final class PlacePollOwner {
    let meetingID: UUID
    let session: SessionStore
    let lease: PrivateData.Lease?
    var poll: PlacePoll?
    var busy = false
    var loading = false
    private var loadFailed = false
    var problem: String?
    var pending: APIRequest?
    var sendingAnswer: String?
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
                PlacePollRequests.read(meetingID, id), as: PlacePoll.self)
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

    func vote(_ answer: String) async {
        guard editable, let poll, poll.canVote, poll.closesAt.date > Date(),
            ["for", "against"].contains(answer)
        else { return }
        sendingAnswer = answer
        do { await submit(try PlacePollRequests.vote(poll, answer: answer)) } catch {
            problem = "Не удалось подготовить голос."
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
            let value = try await session.send(operation, as: PlacePoll.self)
            try Task.checkCancellation()
            guard current, stamp == version else { return }
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
                problem = PlacePollCopy.error(error)
            } else {
                problem =
                    poll == nil
                    ? "Не удалось создать опрос. Повторите отправку."
                    : "Не удалось сохранить голос."
            }
        }
    }

    func retry() async { if let pending { await submit(pending) } }

    func clear() {
        version = UUID()
        poll = nil
        sendingAnswer = nil
        pending = nil
        problem = nil
        busy = false
        loading = false
    }

    private func receive(_ value: PlacePoll) throws {
        guard value.meetingID == meetingID else { throw ClientFailure.invalidResponse }
        poll = value
    }
}
