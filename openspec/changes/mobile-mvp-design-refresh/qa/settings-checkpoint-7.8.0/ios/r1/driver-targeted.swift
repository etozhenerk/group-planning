import Foundation
import XCTest

@MainActor
final class SettingsCheckpoint78Tests: XCTestCase {
    private let output = "/private/tmp/settings-checkpoint78-r1-independent-captures"
    private let organizer = ChatSheetTestSupport.sharedMeeting
    private let member = MeetingInfoTestSupport.memberMeeting
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func wait(_ e: XCUIElement, _ predicate: String = "exists == true") {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: e)], timeout: 12), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(toFile: output + "/" + name + ".ax.txt", atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("settings78-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/settings78-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(_ meeting: String, narrow: Bool = false, shareError: Bool = false) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "320x568" : "402x874"
        let gate = shareError ? try ResponseGate(app, path: "/api/v1/meetings/" + meeting, mode: "unavailable") : nil
        if let gate { try gate.configure(path: "/api/v1/meetings/" + meeting, mode: "unavailable", method: "PATCH") }
        _ = ChatSheetTestSupport.launch(application: app)
        app.buttons["period-upcoming"].tap()
        let card = app.buttons["meeting-card-" + meeting]
        for _ in 0..<3 {
            let top = max(app.buttons["period-upcoming"].frame.maxY, app.buttons["period-past"].frame.maxY) + 8
            let bottom = app.buttons["home-tab-calendar"].frame.minY - 8
            let f = card.frame
            if f.minY > top && f.maxY < bottom { break }
            let mid = (top + bottom) / 2
            let delta = max(-200, min(200, mid - f.midY))
            let origin = app.coordinate(withNormalizedOffset: .zero)
            let start = origin.withOffset(CGVector(dx: app.windows.firstMatch.frame.midX, dy: mid))
            let end = origin.withOffset(CGVector(dx: app.windows.firstMatch.frame.midX, dy: mid + delta))
            start.press(forDuration: 0.4, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 1)
        }
        card.tap()
        print("INFO_AFTER_CARD_APP_STATE=" + String(app.state.rawValue))
        wait(app.buttons["meeting-info-open"])
        app.buttons["meeting-info-open"].tap()
        wait(app.staticTexts["meeting-info-header"])
        wait(app.buttons["meeting-people-summary"])
        reveal(app.buttons["edit-meeting"], app)
        app.buttons["edit-meeting"].tap()
        wait(app.staticTexts["settings-header"])
        wait(app.textFields["settings-title"])
        return (app, gate)
    }
    private func reveal(_ e: XCUIElement, _ app: XCUIApplication) {
        let scroll = app.scrollViews["meeting-info"]
        for _ in 0..<6 {
            let top = app.staticTexts["meeting-info-header"].frame.maxY + 4
            let bottom = app.buttons["meeting-info-share"].exists ? app.buttons["meeting-info-share"].frame.minY - 4 : app.buttons["meeting-change-answer"].frame.minY - 4
            if e.exists {
                let f = e.frame
                if e.isHittable && f.minY > top && f.maxY < bottom { return }
                if f.minY < top { scroll.swipeDown() } else { scroll.swipeUp() }
            } else { scroll.swipeUp() }
        }
    }
    private func revealSettings(_ e: XCUIElement, _ app: XCUIApplication) {
        let scroll = app.scrollViews["meeting-settings"]
        for _ in 0..<6 {
            if e.exists {
                let top = app.staticTexts["settings-header"].frame.maxY + 4
                let bottom = app.buttons["settings-save"].frame.minY - 4
                let f = e.frame
                if e.isHittable && f.minY > top && f.maxY < bottom { return }
                if f.minY < top { scroll.swipeDown() } else { scroll.swipeUp() }
            } else { scroll.swipeUp() }
        }
    }
    private func replaceTitle(_ text: String, _ app: XCUIApplication, dismissKeyboard: Bool = true) {
        let title = app.textFields["settings-title"]
        revealSettings(title, app)
        title.tap()
        title.press(forDuration: 1)
        let labels = ["Выбрать все", "Выбрать всё", "Select All"]
        let select = app.descendants(matching: .any).matching(NSPredicate(format: "label IN %@", labels)).firstMatch
        if select.waitForExistence(timeout: 2) { select.tap() }
        else { title.tap(withNumberOfTaps: 3, numberOfTouches: 1) }
        title.typeText(XCUIKeyboardKey.delete.rawValue)
        XCTAssertEqual(title.value as? String ?? "", "", "QA replacement must start from a genuinely empty field")
        if !text.isEmpty { title.typeText(text) }
        XCTAssertEqual(title.value as? String ?? "", text)
        if dismissKeyboard { app.buttons["action-keyboard-done"].tap() }
    }
    private func closeSettings(_ app: XCUIApplication) {
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "settings-header")
    }
    private func proof(_ name: String, _ data: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: data, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/" + name + ".json"))
    }
    func testAFormRequiredDirtyStayLeaveAndSave() async throws {
        let (app, _) = try launch(organizer)
        wait(app.images["meeting-cover"])
        try capture("normal-form", app)
        replaceTitle("", app)
        app.buttons["settings-save"].tap()
        wait(app.staticTexts["Введите название встречи"])
        wait(app.keyboards.firstMatch)
        try capture("required-title-focus-keyboard", app)
        let title = app.textFields["settings-title"]
        title.typeText("Мой несохранённый заголовок")
        app.buttons["action-keyboard-done"].tap()
        closeSettings(app)
        wait(app.staticTexts["Выйти без сохранения?"])
        try capture("dirty-confirm-same-sheet", app)
        app.buttons["Продолжить редактирование"].tap()
        wait(title)
        XCTAssertEqual(title.value as? String, "Мой несохранённый заголовок")
        closeSettings(app)
        wait(app.buttons["Выйти без сохранения"])
        app.buttons["Выйти без сохранения"].tap()
        wait(app.staticTexts["meeting-info-header"])
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let unchanged = try await api.request("meetings/" + organizer)
        XCTAssertEqual(unchanged["title"] as? String, "Настолки у Саши")
        try capture("dirty-leave-original-info", app)
        app.buttons["edit-meeting"].tap()
        wait(app.textFields["settings-title"])
        replaceTitle("Настройки после сохранения", app)
        app.buttons["settings-save"].tap()
        wait(app.staticTexts["settings-saved"])
        let saved = try await api.request("meetings/" + organizer)
        XCTAssertEqual(saved["title"] as? String, "Настройки после сохранения")
        try proof("normal-save-api", saved)
        try capture("patch-saved-info", app)
        app.terminate()
    }
    func testBRealConflictReviewAndRebase() async throws {
        let (app, _) = try launch(organizer)
        replaceTitle("Мои правки при конфликте", app)
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let before = try await api.request("meetings/" + organizer)
        let changed = try await api.request("meetings/" + organizer, method: "PATCH", body: ["expected_revision": try XCTUnwrap(before["revision"] as? String), "title": "Заголовок другого устройства", "place": "Место другого устройства"])
        try proof("concurrent-patch-api", changed)
        app.buttons["settings-save"].tap()
        wait(app.staticTexts["Встреча изменилась"])
        try capture("conflict-notice", app)
        app.buttons["settings-reload"].tap()
        wait(app.staticTexts["Сейчас во встрече"])
        wait(app.staticTexts["Заголовок другого устройства"])
        try capture("conflict-review-separate-content", app)
        app.buttons["Продолжить с моими правками"].tap()
        wait(app.textFields["settings-title"])
        XCTAssertEqual(app.textFields["settings-title"].value as? String, "Мои правки при конфликте")
        XCTAssertEqual(app.textFields["settings-place"].value as? String, "Место другого устройства")
        app.buttons["settings-save"].tap()
        wait(app.staticTexts["settings-saved"])
        let saved = try await api.request("meetings/" + organizer)
        XCTAssertEqual(saved["title"] as? String, "Мои правки при конфликте")
        XCTAssertEqual(saved["place"] as? String, "Место другого устройства")
        try proof("conflict-rebased-save-api", saved)
        try capture("conflict-resumed-saved-info", app)
        app.terminate()
    }
    func testCNarrowIMEAndUnknownSameIntentRetry() async throws {
        let (app, gate) = try launch(organizer, narrow: true, shareError: true)
        defer { try? gate?.cleanUp() }
        let title = app.textFields["settings-title"]
        replaceTitle("После неподтверждённого ответа", app, dismissKeyboard: false)
        wait(app.keyboards.firstMatch)
        XCTAssertLessThan(app.keyboards.firstMatch.frame.minY, XCUIScreen.main.screenshot().image.size.height)
        XCTAssertTrue(app.buttons["settings-save"].isHittable)
        try capture("narrow-visible-keyboard", app)
        app.buttons["action-keyboard-done"].tap()
        app.buttons["settings-save"].tap()
        wait(app.staticTexts["Сохранение не подтверждено"])
        XCTAssertFalse(title.isEnabled)
        XCTAssertEqual(app.buttons["settings-save"].label, "Повторить отправку")
        closeSettings(app)
        wait(app.staticTexts["settings-header"])
        XCTAssertFalse(app.buttons["Выйти без сохранения"].exists)
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let committed = try await api.request("meetings/" + organizer)
        XCTAssertEqual(committed["title"] as? String, "После неподтверждённого ответа")
        try proof("unknown-committed-api", committed)
        try capture("unknown-locked-and-close-blocked", app)
        try gate?.release()
        app.buttons["settings-save"].tap()
        wait(app.staticTexts["settings-saved"])
        let saved = try await api.request("meetings/" + organizer)
        XCTAssertEqual(saved["title"] as? String, committed["title"] as? String)
        XCTAssertEqual(saved["revision"] as? String, committed["revision"] as? String)
        try proof("unknown-retry-same-revision-api", saved)
        try capture("unknown-retry-saved-info", app)
        app.terminate()
    }
}
