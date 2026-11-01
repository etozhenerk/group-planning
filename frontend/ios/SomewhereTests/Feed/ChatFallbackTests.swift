import Foundation
import Testing

@testable import Somewhere

@MainActor
struct ChatFallbackTests {
    @Test func successfulHTTPWithoutSubscriptionUsesProtocolCadenceAndIndependentJitter()
        async throws
    {
        let context = try await FeedTestContext()
        context.owner.active = true
        context.owner.loaded = true
        context.owner.capabilitiesLoaded = true
        context.owner.capabilities = ChatCapabilities(
            protocolVersion: 1, sync: false, readState: false, realtime: true)
        for _ in 0..<6 { try await context.enqueue([]) }
        var delays: [Double] = []
        var jitterIndex = 0
        let factors = [0.9, 1.1, 0.9, 1.1, 0.9, 1.1]
        context.owner.startFallback(
            delay: 10,
            sleep: { value in
                delays.append(value)
                if delays.count == 7 { throw CancellationError() }
            },
            random: {
                defer { jitterIndex += 1 }
                return factors[jitterIndex]
            })
        await context.owner.fallbackTask?.value
        let expected = [10.0, 2.7, 6.6, 10.8, 33.0, 27.0, 33.0]
        #expect(delays.count == expected.count)
        for (actual, target) in zip(delays, expected) {
            #expect(abs(actual - target) < 0.000_001)
        }
        #expect(await context.harness.transport.count(context.path + "/feed") == 6)
        #expect(context.owner.fallbackTask == nil)
        context.owner.suspend()
    }
}
