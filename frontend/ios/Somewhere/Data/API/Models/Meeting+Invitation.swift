import Foundation

extension Meeting {
    var invitationPreview: InvitationPreview {
        InvitationPreview(
            meetingID: id, title: title, description: description,
            startsAt: startsAt, timezone: timezone, place: place, coverURL: coverURL,
            myRSVP: myRSVP, myRSVPRevision: myRSVPRevision, startsOn: startsOn)
    }
}
