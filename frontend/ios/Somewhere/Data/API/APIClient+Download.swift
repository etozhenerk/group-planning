import Foundation

extension APIClient {
    func download(
        _ request: APIRequest, to fileURL: URL, expectedBytes: Int, contentType: String,
        credential: StoredSession, using transport: any HTTPFileTransport
    ) async throws {
        guard request.method == .get, request.body == nil, request.expectedStatus == 200,
            request.meetingID != nil
        else { throw ClientFailure.invalidRequest }
        var wire = URLRequest(url: try origin.url(for: request))
        wire.httpMethod = "GET"
        wire.cachePolicy = .reloadIgnoringLocalCacheData
        wire.httpShouldHandleCookies = false
        wire.setValue(contentType, forHTTPHeaderField: "Accept")
        wire.setValue("Bearer " + credential.token, forHTTPHeaderField: "Authorization")
        do {
            try await transport.download(
                wire, to: fileURL, expectedBytes: expectedBytes, contentType: contentType)
            try Task.checkCancellation()
        } catch {
            if Task.isCancelled || (error as? URLError)?.code == .cancelled {
                throw CancellationError()
            }
            throw ClientFailure.sanitized(error)
        }
    }
}
