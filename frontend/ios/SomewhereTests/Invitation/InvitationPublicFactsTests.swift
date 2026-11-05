import Foundation
import Testing

@testable import Somewhere

struct InvitationPublicFactsTests {
    @Test func revokedMeetingCoverDoesNotReachPublicSurface() throws {
        let id = UUID()
        let privateURL = try #require(
            URL(string: "https://somewhere.test/api/v1/meetings/\(id)/cover"))
        let value = InvitationPreview(
            meetingID: id, title: "Публичное название", description: "Публичное описание",
            startsAt: nil, timezone: "Europe/Moscow", place: "Кафе", coverURL: privateURL,
            myRSVP: .going, myRSVPRevision: .zero, startsOn: "2099-10-24")
        let publicValue = value.publicFacts
        #expect(publicValue.coverURL == nil)
        #expect(publicValue.meetingID == id && publicValue.title == value.title)
        #expect(
            publicValue.description == value.description && publicValue.startsOn == value.startsOn)
        #expect(
            publicValue.myRSVP == value.myRSVP && publicValue.myRSVPRevision == value.myRSVPRevision
        )
        let publicURL = try #require(
            URL(string: "https://somewhere.test/api/v1/invitations/token/cover"))
        let publicPreview = InvitationPreview(
            meetingID: id, title: value.title, description: nil, startsAt: nil,
            timezone: value.timezone, place: nil, coverURL: publicURL,
            myRSVP: .maybe, myRSVPRevision: .zero)
        #expect(publicPreview.publicFacts == publicPreview)
    }
}
