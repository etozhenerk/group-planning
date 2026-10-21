import Foundation
import Testing

@testable import Somewhere

struct BrandMotionTests {
    @Test func reducedMotionAndInactiveSceneStayStill() {
        for elapsed in [-1.0, 0, 0.6, 1.2, 9.9] {
            #expect(BrandMotion.rotation(elapsed: elapsed, moving: false) == 0)
        }
    }

    @Test func rotationCompletesExactlyOnceEvenDuringLongLoading() {
        #expect(BrandMotion.rotation(elapsed: -1, moving: true) == 0)
        var previous = 0.0
        for step in 0...240 {
            let angle = BrandMotion.rotation(elapsed: Double(step) / 100, moving: true)
            #expect(angle >= previous && angle <= 360)
            #expect(angle - previous < 6)
            previous = angle
        }
        #expect(BrandMotion.rotation(elapsed: BrandMotion.duration / 2, moving: true) == 180)
        for elapsed in [BrandMotion.duration, 1.3, 2.4, 7, 60] {
            #expect(BrandMotion.rotation(elapsed: elapsed, moving: true) == 360)
        }
    }
}
