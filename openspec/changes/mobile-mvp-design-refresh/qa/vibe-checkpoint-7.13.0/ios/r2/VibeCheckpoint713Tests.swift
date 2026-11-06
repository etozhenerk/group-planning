import Foundation
import XCTest

@MainActor
final class VibeCheckpoint713Tests: XCTestCase {
    private let output = URL(fileURLWithPath: "/private/tmp/vibe-checkpoint713-r2-independent-captures")
    private let meeting = "deb00000-0000-4000-8000-000000000004"
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
    }
    private func element(_ id: String, _ app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(to: output.appendingPathComponent(name + ".ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("vibe713r2-" + name, test: self)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/vibe713r2-" + name + ".json")
        try Data(contentsOf: file).write(to: output.appendingPathComponent(name + ".environment.json"))
    }
    private func settled(_ name: String, target: XCUIElement, app: XCUIApplication) async throws -> SettledGeometry.Record {
        try await SettledGeometry.captureThenMeasure(app: app, target: target,
            recordURL: output.appendingPathComponent(name + ".geometry.json"),
            capture: { try self.capture(name, app) })
    }
    private func index(_ n: Int, app: XCUIApplication, viewer: Bool = false) throws {
        let label = viewer ? "\(n) / 3" : "\(n) из 3"
        let value = app.staticTexts[label]
        let result = XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == true"), object: value)], timeout: 6)
        if result != .completed { try capture("unexpected-index-" + String(n), app) }
        XCTAssertEqual(result, .completed)
    }
    private func drag(_ element: XCUIElement, dx: CGFloat, app: XCUIApplication, fast: Bool = false) {
        XCTAssertTrue(element.isHittable)
        let f = element.frame
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: f.midX, dy: f.midY))
        let end = origin.withOffset(CGVector(dx: f.midX + dx, dy: f.midY))
        print("VIBE_GESTURE_EPOCH=\(Date().timeIntervalSince1970) DX=\(dx) FAST=\(fast)")
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: fast ? .fast : .slow,
            thenHoldForDuration: fast ? 0 : 0.2)
    }
    func testShortFrozenVibeCheckpoint() async throws {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_CHAT_STORAGE_NAMESPACE"] = UUID().uuidString
        _ = ChatSheetTestSupport.launch(application: app)
        app.buttons["period-past"].tap()
        let album = app.buttons["meeting-memories-" + meeting]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        XCTAssertTrue(album.isHittable); album.tap()
        try index(1, app: app)
        let stack = element("photo-stack", app)
        let ready = try await settled("ready-effective-deck", target: stack, app: app)
        var metrics: [String: Any] = ["deck": String(describing: stack.frame), "window": String(describing: app.windows.firstMatch.frame), "stable": ready.settled]
        for id in ["album-view-controls", "album-add", "album-save"] {
            let e = element(id, app); if e.exists { metrics[id] = String(describing: e.frame) }
        }
        try JSONSerialization.data(withJSONObject: metrics, options: [.prettyPrinted,.sortedKeys]).write(to: output.appendingPathComponent("effective-layout.json"))
        let photo = app.buttons["Открыть фото 1"]
        drag(photo, dx: -150, app: app)
        try index(2, app: app)
        _ = try await settled("after-one-swipe", target: stack, app: app)
        app.buttons["Открыть фото 2"].tap()
        let viewer = element("memory-fullscreen", app)
        try index(2, app: app, viewer: true)
        _ = try await settled("viewer-contain", target: viewer, app: app)
        app.buttons["Закрыть просмотр"].tap()
        try index(2, app: app)
        _ = try await settled("viewer-return", target: stack, app: app)
        app.buttons["album-add"].tap()
        let header = app.staticTexts["media-picker-header"]
        XCTAssertTrue(header.waitForExistence(timeout: 6))
        XCTAssertEqual(header.label, "Добавить фото")
        _ = try await settled("upload-title", target: header, app: app)
        header.swipeDown()
        XCTAssertTrue(header.waitForNonExistence(timeout: 6))
        try index(2, app: app)
        _ = try await settled("upload-close-return", target: stack, app: app)
        app.terminate()
    }
}
