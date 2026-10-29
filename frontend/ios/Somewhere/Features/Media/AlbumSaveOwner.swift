import Foundation
import Observation

@MainActor @Observable
final class AlbumSaveOwner {
    enum State: Equatable {
        case idle, preparing, saving, permissionRequired, preparationFailed, saveFailed
        case saved(Int)
    }

    private(set) var state = State.idle
    private(set) var working = false
    @ObservationIgnored private let makeService: @MainActor () throws -> AlbumDownloadService
    @ObservationIgnored private let current: @MainActor () -> Bool
    @ObservationIgnored private let permissionGranted: @MainActor () -> Bool
    @ObservationIgnored private var worker: Task<Void, Never>?
    @ObservationIgnored private var operation: UUID?

    init(
        makeService: @escaping @MainActor () throws -> AlbumDownloadService,
        current: @escaping @MainActor () -> Bool,
        permissionGranted: @escaping @MainActor () -> Bool = { false }
    ) {
        self.makeService = makeService
        self.current = current
        self.permissionGranted = permissionGranted
    }

    func start() {
        guard !working, current() else { return }
        let id = UUID()
        operation = id
        state = .preparing
        working = true
        worker = Task { [weak self] in
            guard let self else { return }
            defer {
                working = false
                worker = nil
            }
            do {
                let service = try makeService()
                let count = try await service.save(operationID: id) { [weak self] in
                    guard let self, operation == id, current() else { return }
                    state = .saving
                }
                guard operation == id, current() else { return }
                state = .saved(count)
            } catch {
                guard operation == id, current() else { return }
                switch error {
                case is CancellationError: state = .idle
                case AlbumSaveFailure.permissionRequired: state = .permissionRequired
                case AlbumSaveFailure.cleanup(let count) where count > 0: state = .saved(count)
                default: state = state == .saving ? .saveFailed : .preparationFailed
                }
            }
        }
    }

    func cancel() {
        guard state == .preparing else { return }
        suspend()
    }

    func suspend() {
        operation = nil
        worker?.cancel()
        state = .idle
    }

    func waitUntilFinished() async { await worker?.value }

    func permissionMayHaveChanged() {
        if state == .permissionRequired, permissionGranted() { state = .idle }
    }
}
