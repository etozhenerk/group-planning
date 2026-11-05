import Foundation
import Testing

@testable import Somewhere

struct RSVPEventPresentationTests {
    @Test(arguments: ["participant_joined", "participant_left", "rsvp_changed"])
    func responseEventsNameTheConfirmedAnswer(_ kind: String) throws {
        for answer in [RSVPAnswer.going, .maybe, .notGoing] {
            let entry = FeedEntry(
                id: UUID(), meetingID: UUID(), sequence: try ServerCounter("1"),
                kind: kind, payloadVersion: 1,
                actor: UserProfile(id: UUID(), displayName: "Лена"),
                occurredAt: try APIInstant("2026-11-05T12:00:00Z"),
                payload: ["answer": .string(answer.rawValue)], clientRequestID: nil)
            #expect(FeedPresentation.event(entry) == "Лена ответил «\(RSVPLabels.title(answer))»")
            #expect(entry.messageText == nil)
        }
    }
}
