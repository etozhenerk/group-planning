import Foundation
import Testing

@testable import Somewhere

@MainActor
struct CoverAccessTests {
    private func url(_ id: UUID) throws -> URL {
        try #require(
            URL(
                string: "https://api.example.test/api/v1/meetings/" + id.uuidString.lowercased()
                    + "/cover?v=" + String(repeating: "a", count: 64)))
    }

    @Test func onlyExactOriginMeetingAndVersionCanReceiveAuthorization() throws {
        let origin = try APIOrigin(#require(URL(string: "https://api.example.test")))
        let id = UUID()
        let valid = try url(id)
        let request = try CoverRequests.read(valid, meetingID: id, origin: origin)
        #expect(request.meetingID == id && request.invalidatesMeetingOnForbidden)
        for text in [
            valid.absoluteString.replacingOccurrences(
                of: "api.example.test", with: "other.example.test"),
            valid.absoluteString + "&v=other", valid.absoluteString + "#x",
            valid.absoluteString.replacingOccurrences(
                of: "https://", with: "https://user:password@"),
            "https://api.example.test/api/v1/me",
        ] {
            #expect(throws: ClientFailure.invalidRequest) {
                try CoverRequests.read(#require(URL(string: text)), meetingID: id, origin: origin)
            }
        }
        #expect(throws: ClientFailure.invalidRequest) {
            try CoverRequests.read(valid, meetingID: UUID(), origin: origin)
        }
    }

    @Test func privateImageUsesSessionAndRejectsWrongMime() async throws {
        let h = try SessionHarness()
        try await h.login()
        let id = UUID()
        let url = try url(id)
        let request = try CoverRequests.read(url, meetingID: id, origin: h.session.api.origin)
        let data = try CoverFixtures.jpeg()
        await h.transport.enqueue(url.path, data: data, mime: "image/jpeg")
        #expect(try await h.session.image(request) == data)
        let wire = try #require(await h.transport.requests.last)
        #expect(wire.value(forHTTPHeaderField: "Authorization") == "Bearer test-session")
        #expect(wire.url?.query?.contains("v=") == true)
        await h.transport.enqueue(url.path, data: data, mime: "text/html")
        await #expect(throws: ClientFailure.invalidResponse) { try await h.session.image(request) }
    }

    @Test func lateImageIsDiscardedAfterAccessRevocationAndAfterLogout() async throws {
        for logout in [false, true] {
            let h = try SessionHarness()
            try await h.login()
            let id = UUID()
            let url = try url(id)
            let gate = TestGate()
            await h.transport.enqueue(
                url.path, data: try CoverFixtures.jpeg(), mime: "image/jpeg", gate: gate)
            let owner = CoverImageOwner(api: h.session.api, session: h.session)
            let loading = Task { await owner.load(.remote(url, id)) }
            try await h.transport.waitFor(url.path)
            if logout {
                await h.transport.enqueue("/api/v1/auth/logout", status: 204)
                try await h.session.logout()
            } else {
                h.session.updateMeetingAccess(id, allowed: false)
            }
            await gate.release()
            await loading.value
            #expect(owner.image == nil && !owner.loading)
        }
    }

    @Test func aDisplayedImageDisappearsAsSoonAsItsAccessLeaseExpires() async throws {
        let h = try SessionHarness()
        try await h.login()
        let id = UUID()
        let url = try url(id)
        await h.transport.enqueue(url.path, data: try CoverFixtures.jpeg(), mime: "image/jpeg")
        let owner = CoverImageOwner(api: h.session.api, session: h.session)
        await owner.load(.remote(url, id))
        #expect(owner.image != nil)
        h.session.updateMeetingAccess(id, allowed: false)
        #expect(owner.image == nil)
    }
}
