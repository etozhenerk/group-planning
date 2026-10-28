import Foundation
import Testing

@testable import Somewhere

@MainActor
struct ChatSheetStateTests {
    @Test func pendingDelayIsBoundedWhenClockChanges() {
        let now = Date(timeIntervalSince1970: 1_000)
        #expect(MessageDeliveryTiming.remaining(since: now, now: now) == 2)
        #expect(MessageDeliveryTiming.remaining(since: now.addingTimeInterval(-1), now: now) == 1)
        #expect(MessageDeliveryTiming.remaining(since: now.addingTimeInterval(-2), now: now) == 0)
        #expect(MessageDeliveryTiming.remaining(since: now.addingTimeInterval(-60), now: now) == 0)
        #expect(MessageDeliveryTiming.remaining(since: now.addingTimeInterval(60), now: now) == 2)
    }

    @Test func dismissPreservesParentAndDoesNotRequestRefresh() async throws {
        let context = try await FeedTestContext()
        let owner = context.owner
        owner.informationExpanded = true
        owner.informationScrollOffset = 80
        owner.draft = "Черновик сообщения"
        owner.openSheet(.information)
        owner.openSheet(.settings, child: true)
        owner.closeSheet()
        #expect(owner.sheets == [.information])
        #expect(owner.informationReturn == .settings)
        #expect(owner.informationExpanded && owner.informationScrollOffset == 80)
        owner.closeSheet()
        try await Task.sleep(for: .milliseconds(50))
        #expect(owner.sheets.isEmpty && owner.draft == "Черновик сообщения")
        #expect(await context.harness.transport.count(context.path + "/feed") == 0)
        #expect(await context.harness.transport.count(context.path + "/sync") == 0)
        #expect(await context.harness.transport.count(context.path + "/participants") == 0)
    }

    @Test func pendingLifecycleKeepsStartAndTimelineIdentityThroughAcknowledgement() async throws {
        let context = try await FeedTestContext()
        let key = UUID()
        let created = Date()
        var message = OutgoingMessage(
            id: key, text: "Проверка", createdAt: created, status: .queued)
        context.owner.outgoing = [message]
        let queuedKey = try #require(context.owner.timeline.first?.id)
        #expect(message.pendingSince == created)
        message.status = .sending
        context.owner.outgoing = [message]
        #expect(message.pendingSince == created)
        #expect(context.owner.timeline.first?.id == queuedKey)
        let accepted = try context.entry("1", key: key, text: message.text)
        try context.owner.merge([accepted])
        #expect(context.owner.timeline.count == 1)
        #expect(context.owner.timeline.first?.id == queuedKey)
        #expect(context.owner.timeline.first?.outgoing == nil)
        message.status = .uncertain
        #expect(message.pendingSince == nil)
        message.status = .rejected
        #expect(message.pendingSince == nil)
    }
}
