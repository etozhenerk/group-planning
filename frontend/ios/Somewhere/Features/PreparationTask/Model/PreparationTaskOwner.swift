import Foundation
import Observation

@MainActor @Observable
final class PreparationTaskOwner {
    let meetingID: UUID
    let session: SessionStore
    let lease: PrivateData.Lease?
    var task: PreparationTask?
    var busy = false
    var loading = false
    private var loadFailed = false
    var problem: String?
    var pending: APIRequest?
    var sendingAction: PreparationAction?
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
                PreparationTaskRequests.read(meetingID, id), as: PreparationTask.self)
            try Task.checkCancellation()
            guard current, stamp == version else { return }
            guard value.id == id else { throw ClientFailure.invalidResponse }
            try receive(value)
            if loadFailed { problem = nil }
            loadFailed = false
        } catch {
            guard stamp == version else { return }
            if !current {
                clear()
            } else if !(error is CancellationError) {
                loadFailed = true
                problem = "Не удалось загрузить задачу."
            }
        }
    }

    func act(_ action: PreparationAction) async {
        guard editable, let task, action.allowed(task) else { return }
        sendingAction = action
        do { await submit(try PreparationTaskRequests.act(task, action: action)) } catch {
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
            let value = try await session.send(operation, as: PreparationTask.self)
            try Task.checkCancellation()
            guard current, stamp == version else { return }
            try receive(value)
            pending = nil

        } catch {
            guard stamp == version else { return }
            guard current else {
                clear()
                return
            }
            if let status = (error as? ClientFailure)?.statusCode, (400..<500).contains(status) {
                pending = nil
                if status == 409, let id = task?.id {
                    busy = false
                    await load(id)
                }
                problem = PreparationTaskCopy.error(error)
            } else {
                problem =
                    task == nil
                    ? "Не удалось предложить задачу. Повторите отправку."
                    : "Не удалось сохранить действие."
            }
        }
    }

    func retry() async { if let pending { await submit(pending) } }

    func clear() {
        version = UUID()
        task = nil
        sendingAction = nil
        pending = nil
        problem = nil
        busy = false
        loading = false
    }

    func receive(_ value: PreparationTask) throws {
        guard value.meetingID == meetingID, task == nil || value.id == task?.id else {
            throw ClientFailure.invalidResponse
        }
        task = value
    }
}
