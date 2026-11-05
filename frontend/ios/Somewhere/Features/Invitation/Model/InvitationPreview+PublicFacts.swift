import Foundation

extension InvitationPreview {
    var publicFacts: InvitationPreview {
        guard coverURL?.path.contains("/meetings/") == true else { return self }
        return InvitationPreview(
            meetingID: meetingID, title: title, description: description,
            startsAt: startsAt, timezone: timezone, place: place, coverURL: nil,
            myRSVP: myRSVP, myRSVPRevision: myRSVPRevision,
            organizer: organizer, startsOn: startsOn, joinClosesAt: joinClosesAt,
            canJoin: canJoin, joinDisabledReason: joinDisabledReason)
    }
}
