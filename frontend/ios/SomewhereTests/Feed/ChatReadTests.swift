import Foundation
import Testing

@testable import Somewhere

@MainActor
struct ChatReadTests {
    @Test func loadOrShortVisibilityOrOverlayDoesNotReadMessage() async throws {
        let context = try await FeedTestContext()
        let reads = context.owner.reads
        reads.enabled = true
        reads.resume()
        let entry = try context.entry("10")
        let path = context.path + "/read-marker"
        reads.visible([entry], unobscured: true)
        try await Task.sleep(for: .milliseconds(100))
        reads.cover(true)
        try await Task.sleep(for: .milliseconds(550))
        #expect(await context.harness.transport.count(path) == 0)
        reads.cover(false)
        reads.pause()
        try await Task.sleep(for: .milliseconds(550))
        #expect(await context.harness.transport.count(path) == 0)
    }

    @Test func visibleEndReadsAfter500msAndServerMaximumWins() async throws {
        let context = try await FeedTestContext()
        let reads = context.owner.reads
        reads.enabled = true
        reads.resume()
        let marker = context.path + "/read-marker"
        await context.harness.transport.enqueue(
            marker,
            data: Data(
                """
                {"read_through_sequence":"150","unread_baseline_sequence":"100",
                 "unread_count":"0","first_unread":null,"projection_version":"151"}
                """.utf8))
        reads.visible([try context.entry("140")], unobscured: true)
        try await context.harness.transport.waitFor(marker)
        for _ in 0..<20 where reads.actual.rawValue != "150" {
            try await Task.sleep(for: .milliseconds(10))
        }
        #expect(reads.actual.rawValue == "150" && reads.unread == .zero)
        reads.visible([try context.entry("130")], unobscured: true)
        try await Task.sleep(for: .milliseconds(550))
        #expect(await context.harness.transport.count(marker) == 1)
        reads.pause()
    }

    @Test func dividerDoesNotFollowMarkerAndReceiptRequiresServerCount() async throws {
        let context = try await FeedTestContext()
        let reads = context.owner.reads
        let first = UUID()
        let next = UUID()
        reads.enabled = true
        reads.apply(actual: .zero, count: try ServerCounter("2"), firstUnread: first)
        reads.apply(
            actual: try ServerCounter("10"), count: try ServerCounter("1"), firstUnread: next)
        #expect(reads.divider == first)
        #expect(reads.counts.isEmpty)
        #expect(ChatReadCopy.unread("21") == "21 непрочитанное сообщение")
        #expect(ChatReadCopy.unread("12") == "12 непрочитанных сообщений")
    }

    @Test func staleSyncCannotRestoreUnreadAfterConfirmedMarker() async throws {
        let context = try await FeedTestContext()
        let reads = context.owner.reads
        reads.enabled = true
        reads.apply(
            actual: try ServerCounter("10"), count: .zero, firstUnread: nil,
            projectionVersion: try ServerCounter("20"))
        reads.apply(
            actual: try ServerCounter("5"), count: try ServerCounter("3"), firstUnread: UUID(),
            projectionVersion: try ServerCounter("19"))
        #expect(reads.actual.rawValue == "10" && reads.unread == .zero)
    }

    @Test func receiptBatchUsesCanonicalLowercaseIDs() throws {
        let id = UUID()
        let request = try ChatReadRequests.receipts(UUID(), entries: [id])
        let body = try #require(request.body)
        let value = try #require(JSONSerialization.jsonObject(with: body) as? [String: Any])
        #expect(value["entry_ids"] as? [String] == [id.uuidString.lowercased()])
    }

    @Test func optionalReadFieldsDecodeWithoutChangingLegacyCapability() throws {
        let old = Data(
            "{\"protocol_version\":1,\"sync\":true,\"read_state\":false,\"realtime\":false}".utf8)
        let capability = try APICoding.decode(ChatCapabilities.self, from: old)
        #expect(!capability.readState)
        let body = try ChatReadRequests.marker(UUID(), through: ServerCounter("9007199254740993"))
            .body
        #expect(
            String(data: try #require(body), encoding: .utf8)?.contains("\"9007199254740993\"")
                == true)
    }
}
