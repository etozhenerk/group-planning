import Foundation
import Observation

@MainActor @Observable
final class CoverSelectionOwner {
    private(set) var busy = false
    private(set) var problem: String?
    private var generation = UUID()
    @ObservationIgnored private var operation: Task<Void, Never>?

    func start(
        load: @escaping @Sendable () async throws -> PreparedCover?,
        onBusy: @escaping (Bool) -> Void,
        commit: @escaping (CoverDraft) -> Void
    ) {
        guard !busy else { return }
        busy = true
        problem = nil
        onBusy(true)
        let version = generation
        operation = Task {
            do {
                let image = try await load()
                try Task.checkCancellation()
                guard generation == version else { return }
                busy = false
                onBusy(false)
                if let image { commit(.image(image)) }
            } catch {
                guard generation == version else { return }
                busy = false
                onBusy(false)
                if !(error is CancellationError) {
                    problem = (error as? CoverIssue)?.text ?? CoverIssue.unreadable.text
                }
            }
            operation = nil
        }
    }

    func remove() { problem = nil }
    func cancel() {
        generation = UUID()
        operation?.cancel()
        operation = nil
        busy = false
    }
}
