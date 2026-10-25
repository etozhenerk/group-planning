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

    func image(_ request: APIRequest, credential: StoredSession? = nil) async throws -> Data {
        let data = try await load(request, credential: credential, image: true)
        guard !data.isEmpty, data.count <= 5 * 1024 * 1024 else {
            throw ClientFailure.invalidResponse
        }
        return data
    }

    func media(_ request: APIRequest, credential: StoredSession? = nil) async throws -> Data {
        let data = try await load(request, credential: credential, binary: true)
        guard !data.isEmpty, data.count <= 20 * 1024 * 1024 else {
            throw ClientFailure.invalidResponse
        }
        return data
    }

    private func load(
        _ request: APIRequest, credential: StoredSession?, image: Bool = false, binary: Bool = false
    )
        async throws -> Data
    {
        try Task.checkCancellation()
        var wire = URLRequest(url: try origin.url(for: request))
        wire.httpMethod = request.method.rawValue
        wire.httpBody = request.body
        wire.cachePolicy = .reloadIgnoringLocalCacheData
        wire.httpShouldHandleCookies = false
        wire.setValue(
            image ? "image/jpeg, image/png" : (binary ? "*/*" : "application/json"),
            forHTTPHeaderField: "Accept")
        if request.body != nil {
            wire.setValue(request.contentType, forHTTPHeaderField: "Content-Type")
        }
        if let credential {
            wire.setValue("Bearer " + credential.token, forHTTPHeaderField: "Authorization")
        }
        if let key = request.idempotencyKey {
            wire.setValue(key.uuidString.lowercased(), forHTTPHeaderField: "Idempotency-Key")
        }
        if let token = request.deletionToken {
            wire.setValue(token, forHTTPHeaderField: "X-Deletion-Token")
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
        let allowed = image ? ["image/jpeg", "image/png"] : ["application/json"]
        if !binary, response.statusCode != 204,
            !allowed.contains(response.mimeType?.lowercased() ?? "")
        {
            throw ClientFailure.invalidResponse
        }
        return data
    }
}
