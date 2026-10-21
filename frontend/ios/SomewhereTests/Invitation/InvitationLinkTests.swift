import Foundation
import Testing

@testable import Somewhere

struct InvitationLinkTests {
    static let token = "QUFBQUFBQUFBQUFBQUFBQQ"
    @Test func validCurrentLegacyAndNativeLinks() throws {
        let origin = try APIOrigin(#require(URL(string: "https://api.example.test")))
        let old = Data(repeating: 65, count: 32).base64EncodedString().replacingOccurrences(
            of: "=", with: "")
        for path in [
            "https://api.example.test/i/" + Self.token,
            "https://api.example.test/invitations/" + old,
            "group-planning-ios://i/" + Self.token,
        ] {
            let token = InvitationURL.token(
                from: try #require(URL(string: path)), origin: origin, scheme: "group-planning-ios")
            #expect(token == (path.hasSuffix(old) ? old : Self.token))
        }
    }
    @Test func rejectsUntrustedAndAmbiguousLinks() throws {
        let origin = try APIOrigin(#require(URL(string: "https://api.example.test")))
        for path in [
            "https://other.example/i/", "http://api.example.test/i/",
            "https://api.example.test:8443/i/", "https://user@api.example.test/i/",
            "https://api.example.test/i//", "group-planning-ios://auth/",
            "other://i/",
        ] {
            let url = try #require(URL(string: path + Self.token))
            #expect(
                InvitationURL.token(from: url, origin: origin, scheme: "group-planning-ios") == nil)
        }
        for suffix in ["?next=x", "#x", "/extra", "/"] {
            let url = try #require(URL(string: "https://api.example.test/i/" + Self.token + suffix))
            #expect(
                InvitationURL.token(from: url, origin: origin, scheme: "group-planning-ios") == nil)
        }
        #expect(!InvitationURL.valid(String(repeating: "a", count: 22)))
        #expect(!InvitationURL.valid("../" + Self.token))
    }
    @Test func protectedContextIgnoresLateWriteAndRestores() async throws {
        let folder = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: folder) }
        let store = PendingInvitationStore(file: folder.appendingPathComponent("pending"))
        try await store.save(Self.token, version: 1)
        #expect(try await store.load() == Self.token)
        try await store.save(nil, version: 3)
        try await store.save(Self.token, version: 2)
        #expect(try await store.load() == nil)
        try await store.save(Self.token, version: 4)
        let restored = PendingInvitationStore(file: folder.appendingPathComponent("pending"))
        #expect(try await restored.load() == Self.token)
    }
    @Test @MainActor func runtimeRestoresInvitationWithoutReply() async throws {
        let folder = URL.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: folder) }
        let store = PendingInvitationStore(file: folder.appendingPathComponent("pending"))
        try await store.save(Self.token, version: 0)
        let drafts = DraftRepository(storage: MemoryDraftStorage())
        let runtime = AppRuntime(session: nil, drafts: drafts, links: store)
        #expect(!runtime.ready)
        await runtime.restore()
        #expect(runtime.ready)
        #expect(runtime.invitation == .token(Self.token))
        #expect(runtime.session == nil)
        runtime.open(try #require(URL(string: "https://attacker.example/i/" + Self.token)))
        #expect(runtime.invitation == .token(Self.token))
    }
}
