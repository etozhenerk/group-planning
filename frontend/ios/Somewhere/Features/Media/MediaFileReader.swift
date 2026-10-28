import Foundation

actor MediaFileReader {
    static func read(_ urls: [URL]) async throws -> [PendingMedia] {
        try await MediaFileReader().copy(urls)
    }

    private func copy(_ urls: [URL]) throws -> [PendingMedia] {
        try urls.map { url in
            try Task.checkCancellation()
            let access = url.startAccessingSecurityScopedResource()
            defer { if access { url.stopAccessingSecurityScopedResource() } }
            var coordinationError: NSError?
            var result: Result<PendingMedia, any Error>?
            NSFileCoordinator().coordinate(readingItemAt: url, error: &coordinationError) {
                source in
                result = Result { try MediaSelection.file(source) }
            }
            if let coordinationError { throw coordinationError }
            guard let result else { throw ClientFailure.invalidResponse }
            return try result.get()
        }
    }
}
