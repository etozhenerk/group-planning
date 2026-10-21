import Foundation
import Testing

@testable import Somewhere

struct BrandMotionTests {
    @Test func reducedMotionAndInactiveSceneStayStill() {
        for elapsed in [-1.0, 0, 0.6, 1.2, 9.9] {
            #expect(BrandMotion.rotation(elapsed: elapsed, moving: false) == 0)
        }
    }

    @Test func rotationSettlesAtWholeTurnsWithoutReversingOrJumping() {
        #expect(BrandMotion.rotation(elapsed: -1, moving: true) == 0)
        var previous = 0.0
        for step in 0...240 {
            let angle = BrandMotion.rotation(elapsed: Double(step) / 100, moving: true)
            #expect(angle >= previous)
            #expect(angle - previous < 6)
            previous = angle
        }
        for cycle in 0...2 {
            let time = Double(cycle) * BrandMotion.duration
            #expect(
                abs(BrandMotion.rotation(elapsed: time, moving: true) - Double(cycle) * 360) < 0.001
            )
            let before = BrandMotion.rotation(elapsed: time - 0.001, moving: true)
            let after = BrandMotion.rotation(elapsed: time + 0.001, moving: true)
            #expect(after - before < 0.001)
        }
    }
}
