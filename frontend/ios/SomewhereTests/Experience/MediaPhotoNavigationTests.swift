import Testing

@testable import Somewhere

@Suite("Photo album boundaries")
struct MediaPhotoNavigationTests {
    @Test func twoPhotosHaveDifferentPreviousAndNextActions() {
        #expect(MediaPhotoNavigation.index(from: 0, delta: -1, count: 2) == 0)
        #expect(MediaPhotoNavigation.index(from: 0, delta: 1, count: 2) == 1)
        #expect(MediaPhotoNavigation.index(from: 1, delta: -1, count: 2) == 0)
        #expect(MediaPhotoNavigation.index(from: 1, delta: 1, count: 2) == 1)
    }

    @Test func emptySingleAndMiddlePhotosStayInBounds() {
        #expect(MediaPhotoNavigation.index(from: 0, delta: 1, count: 0) == 0)
        #expect(MediaPhotoNavigation.index(from: 0, delta: -1, count: 1) == 0)
        #expect(MediaPhotoNavigation.index(from: 1, delta: -1, count: 3) == 0)
        #expect(MediaPhotoNavigation.index(from: 1, delta: 1, count: 3) == 2)
    }
}
