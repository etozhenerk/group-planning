import Foundation

final class AlbumFileBuffer {
    static let chunkBytes = 64 * 1024
    private let handle: FileHandle
    private let expectedBytes: Int
    private var received = 0
    private var chunk = Data()

    init(fileURL: URL, expectedBytes: Int) throws {
        guard (1...AlbumPhoto.maximumPhotoBytes).contains(expectedBytes) else {
            throw ClientFailure.invalidRequest
        }
        self.expectedBytes = expectedBytes
        handle = try FileHandle(forWritingTo: fileURL)
        try handle.truncate(atOffset: 0)
        chunk.reserveCapacity(Self.chunkBytes)
    }

    func append(_ byte: UInt8) throws {
        guard received < expectedBytes else { throw ClientFailure.invalidResponse }
        received += 1
        chunk.append(byte)
        if chunk.count == Self.chunkBytes {
            try Task.checkCancellation()
            try handle.write(contentsOf: chunk)
            chunk.removeAll(keepingCapacity: true)
        }
    }

    func finish() throws {
        try Task.checkCancellation()
        guard received == expectedBytes else { throw ClientFailure.invalidResponse }
        try handle.write(contentsOf: chunk)
        chunk.removeAll(keepingCapacity: true)
    }

    func close() throws { try handle.close() }
}
