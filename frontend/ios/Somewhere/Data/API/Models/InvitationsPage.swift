import Foundation

struct SavedInvitation: Decodable, Sendable, Identifiable {
    let invitationURL: URL
    let preview: InvitationPreview
    var id: UUID { preview.meetingID }

    enum CodingKeys: String, CodingKey {
        case invitationURL = "invitation_url"
        case preview
    }
}

struct InvitationsPage: Decodable, Sendable {
    let invitations: [SavedInvitation]
    let nextCursor: String?

    enum CodingKeys: String, CodingKey {
        case invitations
        case nextCursor = "next_cursor"
    }
}
