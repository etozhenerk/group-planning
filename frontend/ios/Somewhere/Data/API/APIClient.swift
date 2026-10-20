import Foundation

struct APIClient: Sendable {
    let origin: APIOrigin
    let transport: any HTTPTransport

    init(origin: APIOrigin, transport: any HTTPTransport = URLSessionTransport()) {
        self.origin = origin
        self.transport = transport
    }

    func send<Value: Decodable & Sendable>(
        _ request: APIRequest, as type: Value.Type,
        credential: StoredSession? = nil
    ) async throws -> Value {
        let data = try await load(request, credential: credential)
        do { return try APICoding.decode(type, from: data) } catch {
            throw ClientFailure.invalidResponse
        }
    }

    func sendEmpty(_ request: APIRequest, credential: StoredSession? = nil) async throws {
        _ = try await load(request, credential: credential)
    }

    private func load(_ request: APIRequest, credential: StoredSession?) async throws -> Data {
        try Task.checkCancellation()
        var wire = URLRequest(url: try origin.url(for: request))
        wire.httpMethod = request.method.rawValue
        wire.httpBody = request.body
        wire.cachePolicy = .reloadIgnoringLocalCacheData
        wire.httpShouldHandleCookies = false
        wire.setValue("application/json", forHTTPHeaderField: "Accept")
        if request.body != nil {
            wire.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if let credential {
            wire.setValue("Bearer " + credential.token, forHTTPHeaderField: "Authorization")
        }
        if let key = request.idempotencyKey {
            wire.setValue(key.uuidString.lowercased(), forHTTPHeaderField: "Idempotency-Key")
        }
        let result: (Data, HTTPURLResponse)
        do { result = try await transport.data(for: wire) } catch {
            if Task.isCancelled || (error as? URLError)?.code == .cancelled {
                throw CancellationError()
            }
            throw ClientFailure.sanitized(error)
        }
        try Task.checkCancellation()
        let (data, response) = result
        guard response.statusCode == request.expectedStatus else {
            let problem = try? APICoding.decode(APIErrorEnvelope.self, from: data).error
            throw ClientFailure.http(response.statusCode, problem)
        }
        if response.statusCode != 204, response.mimeType?.lowercased() != "application/json" {
            throw ClientFailure.invalidResponse
        }
        return data
    }
}
