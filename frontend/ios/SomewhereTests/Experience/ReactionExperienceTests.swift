import Foundation
import Testing

@testable import Somewhere

@Suite("Reactions and composer")
@MainActor
struct ReactionExperienceTests {
    @Test func emojiReplacesSelectedTextWithoutSplittingUnicodeOrSending() {
        var text = "Жду 👨‍👩‍👧‍👦, до встречи"
        let selected = (text as NSString).range(of: "👨‍👩‍👧‍👦")
        var selection = selected
        ComposerInsertion.insert("❤️", into: &text, selection: &selection)
        #expect(text == "Жду ❤️, до встречи")
        #expect(selection == NSRange(location: "Жду ❤️".utf16.count, length: 0))
        ComposerInsertion.insert("👍🏽", into: &text, selection: &selection)
        #expect(text == "Жду ❤️👍🏽, до встречи")
        selection = NSRange(location: 1000, length: 5)
        ComposerInsertion.insert("!", into: &text, selection: &selection)
        #expect(text.hasSuffix("!"))
    }
    @Test func visibleMessagesLoadReactionsWithoutWaitingForFeedPolling() async throws {
        let context = try await FeedTestContext()
        let owner = context.owner.reactions
        let entry = try context.entry("1")
        let path = context.path + "/reactions"
        let data = Data(
            "{\"entries\":[{\"entry_id\":\"\(entry.id)\",\"reactions\":[{\"emoji\":\"❤️\",\"count\":2,\"mine\":false,\"users\":[]}]}]}"
                .utf8)
        await context.harness.transport.enqueue(path, data: data)
        owner.updateVisible([entry.id])
        try await context.harness.transport.waitFor(path)
        for _ in 0..<100 where owner.values[entry.id]?.first?.count != 2 {
            try await Task.sleep(for: .milliseconds(5))
        }
        #expect(owner.values[entry.id]?.first?.count == 2)
        owner.suspend()
    }
    @Test func failedReactionRollsBackAndRetrySendsDesiredState() async throws {
        let context = try await FeedTestContext()
        let owner = context.owner.reactions
        let entry = try context.entry("1")
        let path = context.path + "/messages/" + entry.id.uuidString.lowercased() + "/reactions"
        let gate = TestGate()
        await context.harness.transport.enqueue(path, status: 503, gate: gate)
        owner.toggle("❤️", entryID: entry.id)
        #expect(owner.values[entry.id]?.first?.mine == true)
        #expect(owner.values[entry.id]?.first?.count == 1)
        try await context.harness.transport.waitFor(path)
        await gate.release()
        for _ in 0..<100 where !owner.failures.contains(entry.id) {
            try await Task.sleep(for: .milliseconds(5))
        }
        #expect(owner.values[entry.id]?.isEmpty == true)
        #expect(owner.failures.contains(entry.id))
        let body = Data(
            "{\"entry_id\":\"\(entry.id)\",\"reactions\":[{\"emoji\":\"❤️\",\"count\":1,\"mine\":true,\"users\":[]}] }"
                .utf8)
        let refreshPath = context.path + "/reactions"
        await context.harness.transport.enqueue(
            refreshPath, data: Data("{\"entries\":[\(String(decoding: body, as: UTF8.self))]}".utf8)
        )
        owner.visible = [entry.id]
        await owner.refresh()
        #expect(owner.values[entry.id]?.first?.mine == true)
        await context.harness.transport.enqueue(path, data: body)
        owner.retry(entry.id)
        try await context.harness.transport.waitFor(path, count: 2)
        let requests = await context.harness.transport.requests.filter { $0.url?.path == path }
        for request in requests {
            let data = try #require(request.httpBody)
            let payload = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
            #expect(payload["active"] as? Bool == true)
        }
        #expect(requests[0].httpBody == requests[1].httpBody)
        #expect(
            requests[0].value(forHTTPHeaderField: "Idempotency-Key")
                == requests[1].value(forHTTPHeaderField: "Idempotency-Key"))
        #expect(owner.values[entry.id]?.first?.count == 1)
    }

    @Test(arguments: [false, true])
    func staleBatchCannotOverwriteCompletedMutation(startDuringMutation: Bool) async throws {
        let context = try await FeedTestContext()
        let owner = context.owner.reactions
        let entry = try context.entry("1")
        let getPath = context.path + "/reactions"
        let putPath = context.path + "/messages/" + entry.id.uuidString.lowercased() + "/reactions"
        let getGate = TestGate()
        let putGate = TestGate()
        let confirmed = Data(
            """
            {"entry_id":"\(entry.id)","reactions":[{"emoji":"❤️","count":1,"mine":true,"users":[]}]}
            """.utf8)
        await context.harness.transport.enqueue(putPath, data: confirmed, gate: putGate)
        await context.harness.transport.enqueue(
            getPath,
            data: Data("{\"entries\":[{\"entry_id\":\"\(entry.id)\",\"reactions\":[]}]}".utf8),
            gate: getGate)
        owner.visible = [entry.id]
        if startDuringMutation {
            owner.toggle("❤️", entryID: entry.id)
            try await context.harness.transport.waitFor(putPath)
        }
        let refresh = Task { await owner.refresh() }
        try await context.harness.transport.waitFor(getPath)
        if !startDuringMutation {
            owner.toggle("❤️", entryID: entry.id)
            try await context.harness.transport.waitFor(putPath)
        }
        await putGate.release()
        for _ in 0..<100 where owner.isUpdating(entry.id) {
            try await Task.sleep(for: .milliseconds(5))
        }
        #expect(!owner.isUpdating(entry.id))
        await getGate.release()
        await refresh.value
        #expect(owner.values[entry.id]?.first?.mine == true)
        #expect(owner.values[entry.id]?.first?.count == 1)
    }
}
