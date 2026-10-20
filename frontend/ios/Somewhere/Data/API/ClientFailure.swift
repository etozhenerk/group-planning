import Foundation

enum ClientFailure: Error, Equatable, Sendable {
    case invalidOrigin
    case invalidRequest
    case invalidResponse
    case network(Int)
    case http(Int, APIProblem?)
    case keychain(Int32)
    case invalidStoredSession
    case staleSession
    case accessRevoked

    var statusCode: Int? {
        if case .http(let status, _) = self { return status }
        return nil
    }

    static func sanitized(_ error: any Error) -> ClientFailure {
        if let failure = error as? ClientFailure { return failure }
        if let network = error as? URLError { return .network(network.errorCode) }
        return .invalidResponse
    }
}
