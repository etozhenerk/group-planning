import Foundation

protocol HTTPFileTransport: Sendable {
    func download(
        _ request: URLRequest, to fileURL: URL, expectedBytes: Int, contentType: String
    ) async throws
}
