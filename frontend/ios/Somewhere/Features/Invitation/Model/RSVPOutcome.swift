import Foundation

/// Navigation follows a confirmed response; opening a link never constructs an RSVP.
enum RSVPOutcome: Hashable, Sendable {
    case going(UUID, publicToken: String? = nil)
    case maybe
    case declined(String)

    init(answer: RSVPAnswer, meetingID: UUID, title: String, publicToken: String? = nil) {
        switch answer {
        case .going: self = .going(meetingID, publicToken: publicToken)
        case .maybe: self = .maybe
        case .notGoing: self = .declined(title)
        }
    }
}
