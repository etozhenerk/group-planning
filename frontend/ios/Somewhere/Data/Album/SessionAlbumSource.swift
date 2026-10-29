import Foundation

@MainActor
final class SessionAlbumSource: AlbumPhotoSource {
    let meetingID: UUID
    private let session: SessionStore
    private let lease: PrivateData.Lease
    private let transport: any HTTPFileTransport

    init(
        meetingID: UUID, session: SessionStore,
        transport: (any HTTPFileTransport)? = nil
    ) throws {
        self.meetingID = meetingID
        self.session = session
        self.transport = transport ?? session.albumFileTransport
        lease = try session.privateData.lease(for: meetingID)
        try checkAccess()
    }

    func checkAccess() throws {
        guard session.status == .authenticated else { throw ClientFailure.staleSession }
        guard session.privateData.isCurrent(lease) else { throw ClientFailure.accessRevoked }
    }

    func snapshot() async throws -> MemorySnapshot {
        try checkAccess()
        let snapshot = try await session.send(
            ExperienceRequests.meeting(meetingID, ["memories", "snapshot"]), as: MemorySnapshot.self
        )
        try checkAccess()
        return snapshot
    }

    func download(_ photo: AlbumPhoto, to fileURL: URL) async throws {
        try checkAccess()
        try await session.download(
            ExperienceRequests.meeting(
                meetingID, ["media", photo.id.uuidString.lowercased(), "content"]),
            to: fileURL, expectedBytes: photo.sizeBytes, contentType: photo.contentType,
            using: transport)
        try checkAccess()
    }

    func verifyAccess() async throws {
        try checkAccess()
        let meeting = try await session.send(
            ExperienceRequests.meeting(meetingID, []), as: Meeting.self)
        try checkAccess()
        guard meeting.id == meetingID else { throw ClientFailure.invalidResponse }
    }
}
