import Foundation
import XCTest

@MainActor
final class VibeCheckpoint713Tests: XCTestCase {
    private let output = URL(fileURLWithPath: "/private/tmp/vibe-checkpoint713-r3-independent-captures")
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
        ExperienceScreenshot.save("vibe713r3-" + name, test: self)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/vibe713r3-" + name + ".json")
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
    private func openAlbum(_ app: XCUIApplication) throws {
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_CHAT_STORAGE_NAMESPACE"] = UUID().uuidString
        _ = ChatSheetTestSupport.launch(application: app)
        app.buttons["period-past"].tap()
        let album = app.buttons["meeting-memories-" + meeting]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        XCTAssertTrue(album.isHittable); album.tap()
        XCTAssertTrue(app.buttons["album-add"].waitForExistence(timeout: 10))
        app.buttons["album-add"].tap()
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForExistence(timeout: 6))
    }
    func testAEmptyNativeGrabberDismiss() async throws {
        let app = XCUIApplication()
        try openAlbum(app)
        let header = app.staticTexts["media-picker-header"]
        _ = try await settled("empty-before-grabber", target: header, app: app)
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let y = header.frame.minY - 16
        try JSONSerialization.data(withJSONObject: ["startX": app.frame.midX, "startY": y, "endY": app.frame.maxY - 30], options: [.prettyPrinted]).write(to: output.appendingPathComponent("native-grabber-action.json"))
        origin.withOffset(CGVector(dx: app.frame.midX, dy: y)).press(forDuration: 0.1,
            thenDragTo: origin.withOffset(CGVector(dx: app.frame.midX, dy: app.frame.maxY - 30)),
            withVelocity: .fast, thenHoldForDuration: 0)
        let closed = header.waitForNonExistence(timeout: 6)
        try capture("empty-after-grabber-before-assert", app)
        XCTAssertTrue(closed, "Native grabber dismissal must close the empty panel")
        XCTAssertTrue(app.buttons["album-add"].exists)
        app.terminate()
    }
    private func photoIDs(_ api: NativeChatCounterpart) async throws -> [String] {
        let page = try await api.request("meetings/" + meeting + "/memories")
        return try XCTUnwrap(page["photos"] as? [[String: Any]]).map { try XCTUnwrap($0["id"] as? String) }.sorted()
    }
    func testBPartialUploadNoticeAndExactRetry() async throws {
        let app = XCUIApplication()
        let root = "/api/v1/meetings/" + meeting + "/media/"
        let gate = try ResponseGate(app, path: "/unused", mode: "hold")
        try gate.failPublishedMediaResponse(pathPrefix: root, afterFirst: true)
        addTeardownBlock { @MainActor in try gate.cleanUp() }
        let trace = output.appendingPathComponent("http-request-counts.json")
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        let api = try NativeChatCounterpart(actor: "design", meeting: meeting)
        let before = try await photoIDs(api)
        try openAlbum(app)
        app.buttons["Выбрать фото"].tap()
        let photos = app.images.matching(identifier: "PXGGridLayout-Info")
        XCTAssertTrue(photos.firstMatch.waitForExistence(timeout: 10))
        XCTAssertGreaterThanOrEqual(photos.count, 2)
        photos.element(boundBy: 0).tap(); photos.element(boundBy: 1).tap()
        let add = app.buttons["Add"]
        XCTAssertTrue(add.waitForExistence(timeout: 6)); add.tap()
        let send = app.buttons["media-batch-send"]
        XCTAssertTrue(send.waitForExistence(timeout: 10))
        let previews = app.images.matching(identifier: "Выбранное фото")
        XCTAssertEqual(previews.count, 2)
        try capture("two-selected", app)
        send.tap()
        let requested = await XCTWaiter.fulfillment(of: [XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in gate.requested }, object: nil)], timeout: 20)
        if requested != .completed { try capture("gate-not-reached", app) }
        XCTAssertEqual(requested, .completed)
        try gate.continuePartialFailure()
        let partial = await XCTWaiter.fulfillment(of: [XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in previews.count == 1 && send.isEnabled && send.label == "Повторить отправку" }, object: nil)], timeout: 20)
        if partial != .completed { try capture("partial-not-reached", app) }
        XCTAssertEqual(partial, .completed)
        let notice = app.descendants(matching: .any).matching(identifier: "media-upload-error").firstMatch
        _ = try await settled("partial-notice-before-assert", target: notice, app: app)
        XCTAssertTrue(app.staticTexts["Остальные снимки уже в альбоме. Повтор добавит только оставшиеся."].exists)
        XCTAssertEqual(previews.count, 1)
        let committedPartial = try await photoIDs(api)
        try gate.release()
        send.tap()
        let header = app.staticTexts["media-picker-header"]
        let closed = header.waitForNonExistence(timeout: 20)
        try capture("retry-result-before-assert", app)
        XCTAssertTrue(closed)
        let after = try await photoIDs(api)
        let requests = try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: trace))
        let publishes = requests.filter { $0.key.hasPrefix(root) && $0.key.hasSuffix("/publish") }
        try JSONSerialization.data(withJSONObject: ["beforeIDs": before, "committedPartialIDs": committedPartial, "afterIDs": after, "publishCounts": publishes], options: [.prettyPrinted,.sortedKeys]).write(to: output.appendingPathComponent("api-retry-proof.json"))
        XCTAssertEqual(after.count, before.count + 2)
        XCTAssertEqual(committedPartial, after)
        XCTAssertTrue(Set(before).isSubset(of: Set(after)))
        XCTAssertEqual(publishes.count, 2)
        XCTAssertEqual(publishes.values.sorted(), [1, 2])
        app.terminate()
    }
}
