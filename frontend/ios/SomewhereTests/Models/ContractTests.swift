import Foundation
import Testing

@testable import Somewhere

@Suite("Shared API contract")
struct ContractTests {
    @Test func allSharedFixturesDecode() throws {
        let fixtures = try Fixtures.all()
        #expect(fixtures.count >= 13)
        for fixture in fixtures {
            let data = try fixture.data
            switch fixture.schema {
            case "InvitationPreview": _ = try APICoding.decode(InvitationPreview.self, from: data)
            case "RsvpResult": _ = try APICoding.decode(RSVPResult.self, from: data)
            case "Error": _ = try APICoding.decode(APIErrorEnvelope.self, from: data)
            case "FeedEntry": _ = try APICoding.decode(FeedEntry.self, from: data)
            case "MeetingsPage": _ = try APICoding.decode(CalendarPage.self, from: data)
            case "CreateMeeting": _ = try APICoding.decode(CreateMeeting.self, from: data)
            case "PlacePoll": _ = try APICoding.decode(PlacePoll.self, from: data)
            case "DatePoll": _ = try APICoding.decode(DatePoll.self, from: data)
            case "InvitationsPage": _ = try APICoding.decode(InvitationsPage.self, from: data)
            default: Issue.record("Fixture schema needs an iOS decoder: \(fixture.schema)")
            }
        }
    }

    @Test func dateOnlyCreationAndHiddenPollPreserveContract() throws {
        let creation = try APICoding.decode(
            CreateMeeting.self, from: Fixtures.data("date-only-create"))
        #expect(creation.startsAt == nil)
        #expect(creation.startsOn == "2026-10-24")
        #expect(
            try APICoding.decode(CreateMeeting.self, from: APICoding.encode(creation)) == creation)
        let poll = try APICoding.decode(DatePoll.self, from: Fixtures.data("date-poll-hidden"))
        #expect(poll.settings.hideResults)
        #expect(poll.options.allSatisfy { $0.votes == nil && $0.voters == nil })
        #expect(poll.myOptionIDs.count == 1)
        #expect(poll.leaderOptionIDs.isEmpty)
        #expect(poll.appliedOptionID == nil)
    }

    @Test func placePollKeepsCountsOwnVoteAndFinalState() throws {
        let open = try APICoding.decode(PlacePoll.self, from: Fixtures.data("place-poll-open"))
        #expect(open.previousPlace == nil)
        #expect(open.myVote == "for")
        #expect(open.votesFor == 2 && open.votesAgainst == 1)
        #expect(open.revision.rawValue == "9007199254740993")
        #expect(open.canVote && open.closedAt == nil)
        for state in ["applied", "rejected", "cancelled"] {
            let poll = try APICoding.decode(
                PlacePoll.self, from: Fixtures.data("place-poll-\(state)"))
            #expect(poll.state == state && !poll.canVote && poll.closedAt != nil)
        }
    }

    @Test func nullAndMissingDescriptionsRemainAbsent() throws {
        let invite = try APICoding.decode(
            InvitationPreview.self, from: Fixtures.data("undated-invitation"))
        #expect(invite.startsAt == nil)
        #expect(invite.place == nil)
        #expect(invite.description == nil)
        let data = try Fixtures.data("public-invitation")
        var object = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        object.removeValue(forKey: "description")
        let legacy = try JSONSerialization.data(withJSONObject: object)
        #expect(try APICoding.decode(InvitationPreview.self, from: legacy).description == nil)
    }

    @Test func unsupportedEntriesStayDataAndKeepLargeSequences() throws {
        let entry = try APICoding.decode(FeedEntry.self, from: Fixtures.data("unknown-feed-kind"))
        #expect(entry.kind == "future_kind")
        #expect(entry.payloadVersion == 2)
        #expect(entry.messageText == nil)
        #expect(entry.sequence.rawValue == "9007199254740993")
        #expect(try ServerCounter("9007199254740993") > ServerCounter("9007199254740992"))
        let message = try APICoding.decode(
            FeedEntry.self, from: Fixtures.data("late-message-retry"))
        #expect(message.messageText == "Буду к семи")
    }

    @Test func conflictSnapshotAllowsNoPreviousAnswer() throws {
        let envelope = try APICoding.decode(
            APIErrorEnvelope.self, from: Fixtures.data("first-answer-revision-conflict"))
        let snapshot = try #require(envelope.error.currentResponse)
        #expect(snapshot.rsvp == nil)
        #expect(snapshot.rsvpRevision == .zero)
        #expect(snapshot.canAccessFeed == false)
    }

    @Test func datesKeepOffsetsFractionsAndOriginalText() throws {
        let raw = "2026-10-24T19:00:00.123456789+03:00"
        let instant = try APIInstant(raw)
        let result = try APICoding.decode(APIInstant.self, from: APICoding.encode(instant))
        #expect(result.rawValue == raw)
        #expect(
            try APIInstant("2026-10-24T19:00:00+03:00").date
                == APIInstant("2026-10-24T16:00:00Z").date)
        #expect(throws: ClientFailure.self) { try APIInstant("tomorrow") }
    }

    @Test func malformedCountersAndAnswersAreRejected() throws {
        for value in ["", "01", "-1", "1.5", "١"] {
            #expect(throws: ClientFailure.self) { try ServerCounter(value) }
        }
        #expect(throws: (any Error).self) {
            try APICoding.decode(ServerCounter.self, from: Data("42".utf8))
        }
        #expect(throws: (any Error).self) {
            try APICoding.decode(RSVPAnswer.self, from: Data("\"unknown\"".utf8))
        }
    }

    @Test func patchDistinguishesUnchangedAndClear() throws {
        var patch = UpdateMeeting(expectedRevision: .zero)
        let unchanged = try #require(
            JSONSerialization.jsonObject(with: APICoding.encode(patch)) as? [String: Any])
        #expect(unchanged["description"] == nil)
        patch.description = .clear
        patch.place = .value("Лофт")
        let changed = try #require(
            JSONSerialization.jsonObject(with: APICoding.encode(patch)) as? [String: Any])
        #expect(changed["description"] is NSNull)
        #expect(changed["place"] as? String == "Лофт")
        #expect(changed["expected_revision"] as? String == "0")
    }

    @Test func invitationContextAcceptsBothTokens() throws {
        for length in [22, 43] {
            let context = ReturnContext.invitation(String(repeating: "A", count: length))
            #expect(
                try APICoding.decode(ReturnContext.self, from: APICoding.encode(context)) == context
            )
        }
        #expect(throws: ClientFailure.self) {
            try APICoding.encode(ReturnContext.invitation("../me"))
        }
    }
}
