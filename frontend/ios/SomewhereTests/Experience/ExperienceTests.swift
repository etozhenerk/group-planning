import Foundation
import Testing

@testable import Somewhere

@Suite("Meeting experience contracts and privacy")
@MainActor
struct ExperienceTests {
    @Test func invitationCutoffIsInclusiveAndKeepsCurrentParticipants() async throws {
        let context = try await InvitationTestContext()
        let cutoff = try APIInstant("2026-11-01T12:00:00Z")
        var preview = try context.preview()
        preview.joinClosesAt = cutoff
        preview.canJoin = true
        context.owner.preview = preview
        #expect(!context.owner.joinClosed(at: cutoff.date.addingTimeInterval(-0.001)))
        #expect(context.owner.joinClosed(at: cutoff.date))
        #expect(context.owner.joinClosed(at: cutoff.date.addingTimeInterval(60)))
        context.owner.answer = .going
        #expect(!context.owner.joinClosed(at: cutoff.date.addingTimeInterval(60)))
        context.owner.answer = .notGoing
        #expect(context.owner.joinClosed(at: cutoff.date.addingTimeInterval(60)))
        preview.joinClosesAt = nil
        preview.startsOn = "2026-11-01"
        context.owner.preview = preview
        #expect(!context.owner.joinClosed(at: cutoff.date))
        preview.canJoin = false
        context.owner.preview = preview
        #expect(context.owner.joinClosed(at: cutoff.date.addingTimeInterval(-60)))
    }

    @Test func optionalProfileFieldsStayPrivateAndMissing() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let user = try #require(harness.session.profile)
        let data = Data(
            """
            {"id":"\(user.id)","display_name":"Лена","email":null,"phone":null,"avatar_url":null,"provider":"yandex"}
            """.utf8)
        await harness.transport.enqueue("/api/v1/me/profile", data: data)
        let owner = ProfileOwner(session: harness.session)
        await owner.load()
        #expect(owner.profile?.email == nil)
        #expect(owner.profile?.phone == nil)
        #expect(owner.profile?.login == nil)
        #expect(owner.profile?.firstName == nil)
        #expect(owner.profile?.lastName == nil)
        #expect(owner.profile?.birthday == nil)
        #expect(owner.profile?.sex == nil)
        #expect(owner.profile?.displayName == "Лена")
        #expect(!owner.failed)
        let publicData = try APICoding.encode(user)
        let object = try #require(JSONSerialization.jsonObject(with: publicData) as? [String: Any])
        #expect(object["email"] == nil)
        #expect(object["phone"] == nil)
        for key in ["login", "first_name", "last_name", "birthday", "sex"] {
            #expect(object[key] == nil)
        }
    }

    @Test func profileCallbackAfterLogoutCannotRepopulateState() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let owner = ProfileOwner(session: harness.session)
        let gate = TestGate()
        let id = try #require(harness.session.profile?.id)
        let data = Data("{\"id\":\"\(id)\",\"display_name\":\"Лена\",\"provider\":\"yandex\"}".utf8)
        await harness.transport.enqueue("/api/v1/me/profile", data: data, gate: gate)
        let work = Task { await owner.load() }
        try await harness.transport.waitFor("/api/v1/me/profile")
        await harness.transport.enqueue("/api/v1/auth/logout", status: 204)
        do { try await harness.session.logout() } catch {
            // Reset occurs before logout transport.
        }
        await gate.release()
        await work.value
        #expect(owner.profile == nil)
        #expect(!owner.current)
    }

    @Test func completeEmojiCatalogHasRussianSearchAndRecentIsSessionScoped() throws {
        #expect(EmojiCatalog.entries.count == 3944)
        #expect(EmojiCatalog.entries.contains { $0.emoji == "❤️" && $0.name.contains("сердце") })
        #expect(EmojiCatalog.categories.count >= 8)
        #expect(
            EmojiCatalog.entries.contains {
                $0.emoji.unicodeScalars.contains { $0.value == 0x1F3FD }
            })
        let privateData = PrivateData()
        privateData.recentEmoji = ["❤️"]
        privateData.clear()
        #expect(privateData.recentEmoji.isEmpty)
    }
}
