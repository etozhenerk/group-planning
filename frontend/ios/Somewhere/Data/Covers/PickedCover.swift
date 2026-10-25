import CoreTransferable
import UniformTypeIdentifiers

struct PickedCover: Transferable, Sendable {
    let image: PreparedCover

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(importedContentType: .image) { received in
            // The temporary file remains valid until this importing closure completes.
            let image = try await CoverImageProcessor().prepare(file: received.file)
            return PickedCover(image: image)
        }
    }
}
