import Foundation

actor AlbumTemporaryFiles {
    private let root: URL
    private var owned: Set<String> = []

    init(root: URL = URL.applicationSupportDirectory.appendingPathComponent("AlbumDownloads")) {
        self.root = root.standardizedFileURL
    }

    func create() throws -> URL {
        let manager = FileManager.default
        try manager.createDirectory(
            at: root, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
        let rootValues = try root.resourceValues(forKeys: [.isSymbolicLinkKey, .isDirectoryKey])
        guard rootValues.isSymbolicLink != true, rootValues.isDirectory == true else {
            throw AlbumSaveFailure.storage
        }
        // Only our UUID-named operation directories; never enumerate or follow their contents.
        for old in try manager.contentsOfDirectory(at: root, includingPropertiesForKeys: nil) {
            if old.lastPathComponent.hasPrefix("album-"),
                UUID(uuidString: String(old.lastPathComponent.dropFirst(6))) != nil
            {
                try manager.removeItem(at: old)
                owned.remove(old.path)
            }
        }
        var directory = root.appendingPathComponent("album-" + UUID().uuidString.lowercased())
        try manager.createDirectory(
            at: directory, withIntermediateDirectories: false,
            attributes: [.posixPermissions: 0o700, .protectionKey: FileProtectionType.complete])
        owned.insert(directory.path)
        do {
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            try directory.setResourceValues(values)
            return directory
        } catch {
            try remove(directory)
            throw error
        }
    }

    func prepare(_ photo: AlbumPhoto, in directory: URL) throws -> URL {
        guard owned.contains(directory.path),
            photo.fileName == URL(fileURLWithPath: photo.fileName).lastPathComponent
        else { throw AlbumSaveFailure.storage }
        let file = directory.appendingPathComponent(photo.fileName)
        guard
            FileManager.default.createFile(
                atPath: file.path, contents: nil,
                attributes: [.posixPermissions: 0o600, .protectionKey: FileProtectionType.complete])
        else { throw AlbumSaveFailure.storage }
        return file
    }

    func validate(_ item: AlbumPreparedPhoto) throws {
        guard owned.contains(item.fileURL.deletingLastPathComponent().path) else {
            throw AlbumSaveFailure.storage
        }
        let values = try item.fileURL.resourceValues(
            forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey])
        guard values.isRegularFile == true, values.isSymbolicLink != true,
            values.fileSize == item.photo.sizeBytes
        else { throw ClientFailure.invalidResponse }
    }

    func remove(_ directory: URL) throws {
        guard owned.contains(directory.path) else { throw AlbumSaveFailure.storage }
        if FileManager.default.fileExists(atPath: directory.path) {
            try FileManager.default.removeItem(at: directory)
        }
        owned.remove(directory.path)
    }
}
