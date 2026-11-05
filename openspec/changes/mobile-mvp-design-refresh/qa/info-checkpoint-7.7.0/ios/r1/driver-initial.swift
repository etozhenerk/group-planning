import Foundation
import XCTest

@MainActor
final class InfoCheckpoint77Tests: XCTestCase {
    private let output = "/private/tmp/info-checkpoint77-r1-independent-captures"
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
        ExperienceScreenshot.save("info77-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/info77-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(_ meeting: String, narrow: Bool = false, shareError: Bool = false) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "320x568" : "402x874"
        let gate = shareError ? try ResponseGate(app, path: "/api/v1/meetings/" + meeting + "/invitation", mode: "unavailable") : nil
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
        return (app, gate)
    }
    private func reveal(_ e: XCUIElement, _ app: XCUIApplication) {
        let scroll = app.scrollViews["meeting-info"]
        let header = app.staticTexts["meeting-info-header"]
        let footer = app.buttons["meeting-info-share"].exists ? app.buttons["meeting-info-share"] : app.buttons["meeting-change-answer"]
        for _ in 0..<8 {
            let top = max(scroll.frame.minY, header.frame.maxY) + 4
            let bottom = min(scroll.frame.maxY, footer.frame.minY) - 4
            let f = e.frame
            if e.exists && e.isHittable && f.minY >= top && f.maxY <= bottom { return }
            let mid = (top + bottom) / 2
            let delta = max(-160, min(160, mid - f.midY))
            let origin = app.coordinate(withNormalizedOffset: .zero)
            let start = origin.withOffset(CGVector(dx: app.windows.firstMatch.frame.midX, dy: mid))
            let end = origin.withOffset(CGVector(dx: app.windows.firstMatch.frame.midX, dy: mid + delta))
            start.press(forDuration: 0.2, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
        }
        XCTAssertTrue(e.isHittable)
    }
    func testAOrganizerRosterShareErrorRetryAndSettingsReturn() throws {
        let (app, gate) = try launch(organizer, shareError: true)
        defer { try? gate?.cleanUp() }
        wait(app.staticTexts["Вы организатор"])
        XCTAssertFalse(app.staticTexts["Europe/Moscow"].exists)
        let share = app.buttons["meeting-info-share"]
        XCTAssertTrue(share.isHittable)
        let pinned = share.frame
        try capture("organizer-initial", app)
        let all = app.buttons["meeting-people-all"]
        reveal(all, app)
        all.tap()
        let collapse = app.buttons["meeting-people-collapse"]
        wait(collapse)
        reveal(collapse, app)
        XCTAssertEqual(share.frame.minY, pinned.minY, accuracy: 2)
        try capture("organizer-expanded-roster", app)
        collapse.tap()
        wait(app.buttons["meeting-people-all"])
        let returnY = app.buttons["meeting-people-all"].frame.minY
        share.tap()
        wait(app.staticTexts["meeting-share-header"])
        wait(app.staticTexts["Не удалось получить ссылку приглашения"])
        XCTAssertTrue(gate?.requested == true)
        XCTAssertEqual(app.staticTexts.matching(NSPredicate(format: "label == %@", "Не удалось получить ссылку приглашения")).count, 1)
        try capture("share-single-error", app)
        try gate?.release()
        app.buttons["Попробовать ещё раз"].tap()
        wait(app.buttons["invitation-copy"])
        app.buttons["invitation-copy"].tap()
        wait(app.buttons["Скопировано"])
        try capture("share-retry-copied", app)
        app.buttons["← К деталям встречи"].tap()
        wait(app.staticTexts["meeting-info-header"])
        XCTAssertEqual(app.buttons["meeting-people-all"].frame.minY, returnY, accuracy: 12)
        let settings = app.buttons["edit-meeting"]
        reveal(settings, app)
        settings.tap()
        wait(app.staticTexts["settings-header"])
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "settings-header")
        wait(app.staticTexts["meeting-info-header"])
        XCTAssertTrue(share.isHittable)
        try capture("organizer-return-from-settings", app)
        app.terminate()
    }
    func testBMemberChildResponseThenMaybeInvitations() async throws {
        let (app, _) = try launch(member)
        wait(app.staticTexts["Организует Сергей"])
        XCTAssertFalse(app.buttons["edit-meeting"].exists)
        XCTAssertFalse(app.buttons["meeting-info-share"].exists)
        let change = app.buttons["meeting-change-answer"]
        XCTAssertTrue(change.isHittable)
        try capture("member-initial", app)
        let all = app.buttons["meeting-people-all"]
        reveal(all, app)
        all.tap()
        let collapse = app.buttons["meeting-people-collapse"]
        wait(collapse)
        reveal(collapse, app)
        try capture("member-expanded-footer", app)
        collapse.tap()
        change.tap()
        wait(app.staticTexts["Изменить ответ"])
        wait(app.staticTexts["Если выбрать «Возможно» или «Не смогу», доступ к чату закроется."])
        try capture("member-response-child", app)
        app.buttons["← К деталям встречи"].tap()
        wait(app.staticTexts["meeting-info-header"])
        change.tap()
        wait(app.buttons["rsvp-going"])
        app.buttons["rsvp-going"].tap()
        wait(app.staticTexts["meeting-info-header"], "exists == false")
        wait(app.buttons["meeting-info-open"])
        let api = try NativeChatCounterpart(actor: "design", meeting: member)
        let confirmed = try await api.request("meetings/" + member)
        XCTAssertEqual(confirmed["my_rsvp"] as? String, "going")
        try JSONSerialization.data(withJSONObject: confirmed, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/member-going-api.json"))
        try capture("member-going-canonical-chat", app)
        app.buttons["meeting-info-open"].tap()
        wait(app.staticTexts["meeting-info-header"])
        app.buttons["meeting-change-answer"].tap()
        wait(app.buttons["rsvp-maybe"])
        app.buttons["rsvp-maybe"].tap()
        wait(app.buttons["saved-invitation-" + member])
        XCTAssertFalse(app.staticTexts["meeting-info-header"].exists)
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        try capture("member-maybe-canonical-invitations", app)
        app.terminate()
    }
    func testCNarrowOrganizerFooterAndRosterSanity() throws {
        let (app, _) = try launch(organizer, narrow: true)
        let share = app.buttons["meeting-info-share"]
        XCTAssertTrue(share.isHittable)
        try capture("narrow-organizer-initial", app)
        let all = app.buttons["meeting-people-all"]
        reveal(all, app)
        all.tap()
        let collapse = app.buttons["meeting-people-collapse"]
        wait(collapse)
        reveal(collapse, app)
        XCTAssertTrue(share.isHittable)
        XCTAssertLessThan(collapse.frame.maxY, share.frame.minY)
        try capture("narrow-organizer-roster-footer", app)
        app.terminate()
    }
}
