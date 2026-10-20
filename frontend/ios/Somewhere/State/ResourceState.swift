import Foundation

struct ResourceState<Value: Sendable>: Sendable {
    private(set) var value: Value?
    private(set) var isLoading = false
    private(set) var error: ClientFailure?
    private var requestID: UUID?

    mutating func begin() -> UUID {
        let id = UUID()
        requestID = id
        isLoading = true
        error = nil
        return id
    }

    mutating func succeed(_ value: Value, requestID: UUID) {
        guard self.requestID == requestID else { return }
        self.value = value
        isLoading = false
        error = nil
        self.requestID = nil
    }

    mutating func fail(_ error: any Error, requestID: UUID) {
        guard self.requestID == requestID else { return }
        isLoading = false
        self.requestID = nil
        if error is CancellationError { return }
        self.error = ClientFailure.sanitized(error)
    }
}
