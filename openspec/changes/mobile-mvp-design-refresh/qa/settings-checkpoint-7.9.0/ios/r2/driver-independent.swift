import Foundation
import XCTest

@MainActor
final class SettingsCheckpoint79Tests: XCTestCase {
    private let output = "/private/tmp/settings-checkpoint79-r2-independent-captures"
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
        ExperienceScreenshot.save("settings79-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/settings79-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(_ meeting: String, narrow: Bool = false, shareError: Bool = false) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "320x568" : "402x874"
        let gate = shareError ? try ResponseGate(app, path: "/api/v1/meetings/" + meeting, mode: "offline") : nil
        if let gate { try gate.configure(path: "/api/v1/meetings/" + meeting, mode: "offline", method: "PATCH") }
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
    func testANormalChangedFieldsAndReview() async throws {
        let (app, _) = try launch(organizer)
        let date = app.buttons["Дата"]
        revealSettings(date, app)
        wait(date)
        let time = app.buttons["Время"]
        wait(time)
        wait(app.staticTexts["Время можно уточнить позже · Москва"])
        try proof("date-time-metrics", ["date": String(describing: date.frame), "time": String(describing: time.frame), "centerDelta": abs(date.frame.midY - time.frame.midY)])
        XCTAssertLessThan(abs(date.frame.midY - time.frame.midY), 1)
        try capture("normal-date-time-helper", app)
        replaceTitle("Локальная правка для сверки", app)
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let before = try await api.request("meetings/" + organizer)
        let changed = try await api.request("meetings/" + organizer, method: "PATCH", body: ["expected_revision": try XCTUnwrap(before["revision"] as? String), "title": "Заголовок другого устройства", "place": "Место другого устройства"])
        try proof("concurrent-patch-precondition", changed)
        app.buttons["settings-save"].tap()
        wait(app.staticTexts["Встреча изменилась"])
        app.buttons["settings-reload"].tap()
        wait(app.staticTexts["Сейчас во встрече"])
        wait(app.staticTexts["Заголовок другого устройства"])
        XCTAssertFalse(app.images["meeting-cover"].exists)
        wait(app.staticTexts["Ваши правки остались в форме. Обновлённые поля, которые вы не меняли, подставятся автоматически."])
        try capture("review-plain-facts", app)
        app.terminate()
    }
    func testBNarrowChangedUnknownNotice() throws {
        let (app, gate) = try launch(organizer, narrow: true, shareError: true)
        defer { try? gate?.cleanUp() }
        replaceTitle("Проверка переноса уведомления", app)
        app.buttons["settings-save"].tap()
        wait(app.staticTexts["Сохранение не подтверждено"])
        wait(app.staticTexts["Повторите отправку — данные менять не нужно."])
        XCTAssertEqual(app.buttons["settings-save"].label, "Повторить отправку")
        try capture("narrow-unknown-single-panel", app)
        app.terminate()
    }
}
