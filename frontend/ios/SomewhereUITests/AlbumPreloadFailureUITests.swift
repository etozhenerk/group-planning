import UIKit
import XCTest

@MainActor
final class AlbumPreloadFailureUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testFailedPhotoKeepsOtherPreparedImagesAndCanRetryBeforeRevocation() async throws {
        let id = "deb00000-0000-4000-8000-000000000004"
        let api = try NativeChatCounterpart(actor: "design")
        let page = try await api.request("meetings/" + id + "/memories")
        let photos = try XCTUnwrap(page["photos"] as? [[String: Any]])
        XCTAssertEqual(photos.count, 3)
        let failedID = try XCTUnwrap(photos[1]["id"] as? String)
        let app = XCUIApplication()
        let gate = try ResponseGate(
            app, path: "/api/v1/meetings/" + id + "/media/" + failedID + "/content",
            mode: "unavailable")
        defer {
            try? gate.cleanUp()
            app.terminate()
        }
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        _ = ChatSheetTestSupport.launch(application: app)
        app.buttons["period-past"].tap()
        let album = app.buttons["meeting-memories-" + id]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        album.tap()
        XCTAssertTrue(app.staticTexts["1 из 3"].waitForExistence(timeout: 10))
        let attempted = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in (try? self.contentCounts(trace).count) == 3 },
            object: nil)
        let result = await XCTWaiter.fulfillment(of: [attempted], timeout: 15)
        XCTAssertEqual(result, .completed)
        XCTAssertTrue(gate.requested)
        app.buttons["Открыть фото 1"].swipeLeft()
        XCTAssertTrue(app.staticTexts["Не удалось загрузить фото"].waitForExistence(timeout: 8))
        XCTAssertTrue(app.staticTexts["1 из 3"].exists)
        XCTAssertTrue(app.buttons["Открыть фото 1"].exists)
        ExperienceScreenshot.save("preload-failed-next-keeps-first", test: self)
        try gate.configure(path: "/unused", mode: "offline")
        try gate.failMediaContent(pathPrefix: "/api/v1/meetings/")
        let before = try contentCounts(trace)
        app.buttons["Показать сеткой"].tap()
        app.buttons["Открыть фото 3"].tap()
        XCTAssertTrue(app.staticTexts["3 / 3"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["Повторить загрузку"].exists)
        let after = try contentCounts(trace)
        let cached = before.filter { !$0.key.contains(failedID) }
        XCTAssertEqual(after.filter { !$0.key.contains(failedID) }, cached)
        ExperienceScreenshot.save("preload-third-available-offline", test: self)
        app.buttons["Закрыть просмотр"].tap()
        app.buttons["Показать стопкой"].tap()
        app.buttons["Открыть фото 3"].swipeRight()
        XCTAssertTrue(app.staticTexts["1 из 3"].waitForExistence(timeout: 5))
        app.buttons["Открыть фото 1"].swipeLeft()
        XCTAssertTrue(app.staticTexts["Не удалось загрузить фото"].waitForExistence(timeout: 5))
        try gate.release()
        app.buttons["Попробовать ещё раз"].tap()
        XCTAssertTrue(app.staticTexts["2 из 3"].waitForExistence(timeout: 8))
        XCTAssertFalse(app.staticTexts["Не удалось загрузить фото"].exists)
        try assertPhotographVisible(app.buttons["Открыть фото 2"])
        ExperienceScreenshot.save("preload-failed-photo-retried", test: self)
        _ = try await api.request("me", method: "DELETE")
        app.buttons["memories-back"].tap()
        XCTAssertTrue(app.buttons["Пропустить знакомство"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Открыть фото 2"].exists)
        XCTAssertFalse(app.buttons["album-save"].exists)
        ExperienceScreenshot.save("preload-failure-cache-revoked", test: self)
    }

    private func assertPhotographVisible(_ photo: XCUIElement) throws {
        let source = try XCTUnwrap(photo.screenshot().image.cgImage)
        let size = 48
        var pixels = [UInt8](repeating: 0, count: size * size * 4)
        let context = try XCTUnwrap(
            CGContext(
                data: &pixels, width: size, height: size, bitsPerComponent: 8,
                bytesPerRow: size * 4, space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        context.draw(source, in: CGRect(x: 0, y: 0, width: size, height: size))
        var coloured = 0
        var total = 0
        for y in 14..<34 {
            for x in 14..<34 {
                let offset = (y * size + x) * 4
                let rgb = pixels[offset..<(offset + 3)]
                if Int(rgb.max() ?? 0) - Int(rgb.min() ?? 0) > 30 { coloured += 1 }
                total += 1
            }
        }
        // The fixture photograph is coloured; the stale beige error card is not.
        let fraction = Double(coloured) / Double(total)
        print("PRELOAD_RETRIED_PHOTO_COLOUR_FRACTION=\(fraction)")
        XCTAssertGreaterThan(fraction, 0.2)
    }

    private func contentCounts(_ file: URL) throws -> [String: Int] {
        try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: file))
            .filter { $0.key.hasSuffix("/content") }
    }
}
