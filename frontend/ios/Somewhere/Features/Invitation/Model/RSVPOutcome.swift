import Foundation

/// Navigation follows a confirmed response; opening a link never constructs an RSVP.
enum RSVPOutcome: Hashable, Sendable {
    case going(UUID)
    case maybe
    case declined(String)

    init(answer: RSVPAnswer, meetingID: UUID, title: String) {
        switch answer {
        case .going: self = .going(meetingID)
        case .maybe: self = .maybe
        case .notGoing: self = .declined(title)
        }
    }
}
