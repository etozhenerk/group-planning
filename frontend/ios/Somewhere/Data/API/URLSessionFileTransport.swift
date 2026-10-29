import Foundation

actor URLSessionFileTransport: HTTPFileTransport {
    private let session: URLSession

    init(configuration: URLSessionConfiguration = .ephemeral) {
        configuration.httpShouldSetCookies = false
        configuration.httpCookieStorage = nil
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        session = URLSession(
            configuration: configuration, delegate: NoRedirectDelegate(), delegateQueue: nil)
    }

    deinit { session.invalidateAndCancel() }

    func download(
        _ request: URLRequest, to fileURL: URL, expectedBytes: Int, contentType: String
    ) async throws {
        guard request.url?.scheme == "https", fileURL.isFileURL,
            (1...AlbumPhoto.maximumPhotoBytes).contains(expectedBytes)
        else { throw ClientFailure.invalidRequest }
        try Task.checkCancellation()
        let (bytes, response) = try await session.bytes(for: request)
        defer { bytes.task.cancel() }
        guard let http = response as? HTTPURLResponse else { throw ClientFailure.invalidResponse }
        guard http.statusCode == 200 else { throw ClientFailure.http(http.statusCode, nil) }
        guard http.url == request.url, http.mimeType?.lowercased() == contentType,
            http.expectedContentLength == -1 || http.expectedContentLength == Int64(expectedBytes)
        else { throw ClientFailure.invalidResponse }
        let writer = try AlbumFileBuffer(fileURL: fileURL, expectedBytes: expectedBytes)
        do {
            for try await byte in bytes { try writer.append(byte) }
            try writer.finish()
        } catch {
            do { try writer.close() } catch { throw AlbumSaveFailure.storage }
            throw error
        }
        try writer.close()
    }
}
