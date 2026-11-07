import UIKit
import XCTest

@MainActor
final class AlbumOfflineSweepUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testEveryPreparedPhotoRemainsVisibleAcrossBothOfflineSwipeDirections() async throws {
        let app = XCUIApplication()
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "album-preload-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        let gate = try ResponseGate(app, path: "/unused", mode: "offline")
        defer { try? gate.cleanUp() }
        ExperienceScreenshot.configure(app)
        app.launch()
        XCTAssertTrue(app.buttons["period-past"].waitForExistence(timeout: 15))
        app.buttons["period-past"].tap()
        let album = app.buttons["meeting-memories-daf40000-0000-4000-8000-000000000001"]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        album.tap()
        XCTAssertTrue(app.staticTexts["1 из 103"].waitForExistence(timeout: 15))
        let prepared = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in (try? self.contentCounts(trace).count) == 103 },
            object: nil)
        let loaded = await XCTWaiter.fulfillment(of: [prepared], timeout: 30)
        XCTAssertEqual(loaded, .completed)
        await settle(seconds: 1)
        let before = try contentCounts(trace)
        try gate.failMediaContent(pathPrefix: "/api/v1/meetings/")
        var signatures = [[UInt8]]()
        for number in 1...103 {
            if number > 1 {
                app.buttons["Открыть фото \(number - 1)"].swipeLeft(velocity: .fast)
            }
            expectPhoto(number, app: app, trace: trace)
            await settle(seconds: 0.65)
            let value = try sample(app.buttons["Открыть фото \(number)"])
            XCTAssertTrue((135...165).contains(Int(value[1])), "Photo must replace the blank card")
            signatures.append(value)
            print("OFFLINE_SWEEP direction=left index=\(number) rgb=\(value)")
            if [1, 52, 103].contains(number) {
                ExperienceScreenshot.save("offline-left-\(number)", test: self)
            }
        }
        XCTAssertEqual(Set(signatures).count, 103, "Every distinct fixture photo must be rendered")
        for number in 1...103 {
            let previous = number == 1 ? 103 : number - 1
            app.buttons["Открыть фото \(previous)"].swipeRight(velocity: .fast)
            expectPhoto(number, app: app, trace: trace)
            await settle(seconds: 0.65)
            let value = try sample(app.buttons["Открыть фото \(number)"])
            for component in 0..<3 {
                XCTAssertLessThanOrEqual(
                    abs(Int(value[component]) - Int(signatures[number - 1][component])), 2)
            }
            print("OFFLINE_SWEEP direction=right index=\(number) rgb=\(value)")
            if [1, 52, 103].contains(number) {
                ExperienceScreenshot.save("offline-right-\(number)", test: self)
            }
        }
        XCTAssertEqual(try contentCounts(trace), before)
        XCTAssertFalse(gate.requested)
        XCTAssertFalse(app.staticTexts["Не удалось загрузить фото"].exists)
        print("OFFLINE_SWEEP photos=103 directions=2 extraContentRequests=0")
    }

    private func expectPhoto(_ number: Int, app: XCUIApplication, trace: URL) {
        let visible = app.staticTexts["\(number) из 103"].waitForExistence(timeout: 5)
        if !visible {
            ExperienceScreenshot.save("offline-counter-failure-\(number)", test: self)
            let hierarchy = XCTAttachment(string: app.debugDescription)
            hierarchy.name = "offline-counter-hierarchy-\(number)"
            hierarchy.lifetime = .keepAlways
            add(hierarchy)
            if let counts = try? String(contentsOf: trace, encoding: .utf8) {
                let requests = XCTAttachment(string: counts)
                requests.name = "offline-content-counts-\(number)"
                requests.lifetime = .keepAlways
                add(requests)
            }
        }
        XCTAssertTrue(visible)
    }

    private func settle(seconds: Double) async {
        let ready = XCTestExpectation(description: "Photo presentation settled")
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { ready.fulfill() }
        let result = await XCTWaiter.fulfillment(of: [ready], timeout: seconds + 2)
        XCTAssertEqual(result, .completed)
    }

    private func sample(_ photo: XCUIElement) throws -> [UInt8] {
        let source = try XCTUnwrap(photo.screenshot().image.cgImage)
        let centre = try XCTUnwrap(
            source.cropping(
                to: CGRect(x: source.width / 2 - 5, y: source.height / 2 - 5, width: 10, height: 10)
            ))
        let space = try XCTUnwrap(CGColorSpace(name: CGColorSpace.sRGB))
        var pixel = [UInt8](repeating: 0, count: 4)
        try pixel.withUnsafeMutableBytes { bytes in
            let context = try XCTUnwrap(
                CGContext(
                    data: bytes.baseAddress, width: 1, height: 1, bitsPerComponent: 8,
                    bytesPerRow: 4, space: space,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
            context.draw(centre, in: CGRect(x: 0, y: 0, width: 1, height: 1))
        }
        return Array(pixel.prefix(3))
    }

    private func contentCounts(_ file: URL) throws -> [String: Int] {
        try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: file))
            .filter { $0.key.hasSuffix("/content") }
    }
}
