import XCTest

@MainActor
final class InvitationUITests: XCTestCase {
    let token = "QUFBQUFBQUFBQUFBQUFBQQ"
    let message = "Возьмите настолки, пиццу закажу я."
    let meetingID = "22222222-2222-4222-8222-222222222222"
    override func setUpWithError() throws { continueAfterFailure = false }

    func launch(_ scenario: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryL",
        ]
        app.launch()
        return app
    }
    func open(_ app: XCUIApplication, token: String? = nil, title: String = "Настолки у Саши")
        throws
    {
        let url = try XCTUnwrap(URL(string: "group-planning-ios-ui://i/" + (token ?? self.token)))
        app.open(url)
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 10))
    }
    func capture(_ name: String, _ app: XCUIApplication) {
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    func choose(_ value: String, confirmation: String, app: XCUIApplication) {
        if app.buttons["meeting-info-open"].exists && !app.buttons["rsvp-" + value].isHittable {
            app.buttons["meeting-info-open"].tap()
        }
        let button = app.buttons["rsvp-" + value]
        let scroll = app.scrollViews[
            app.scrollViews["meeting-info"].exists ? "meeting-info" : "invitation-screen"
        ].firstMatch
        for _ in 0..<5 {
            if button.isHittable { break }
            scroll.swipeDown()
        }
        let enabled = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "enabled == true"), object: button)
        XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 5), .completed)
        button.tap()
        let save = app.buttons["rsvp-save"]
        for _ in 0..<4 {
            if save.isHittable { break }
            scroll.swipeUp()
        }
        XCTAssertTrue(save.waitForExistence(timeout: 3))
        save.tap()
        if value == "going" {
            let info = app.buttons["meeting-info-open"]
            XCTAssertTrue(info.waitForExistence(timeout: 10))
            info.tap()
        }
        let saved = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS %@", confirmation),
            object: app.staticTexts["confirmed-rsvp"].firstMatch)
        XCTAssertEqual(XCTWaiter.wait(for: [saved], timeout: 10), .completed)
        if value == "going" { app.buttons["meeting-info-close"].tap() }
    }

    func testAnonymousColdAndWarmInvitationWithoutPrivateContent() throws {
        let app = launch("invite-anonymous")
        try open(app)
        XCTAssertTrue(app.staticTexts["Соберёмся в субботу. Принесите любимую игру."].exists)
        XCTAssertFalse(app.staticTexts[message].exists)
        XCTAssertFalse(app.descendants(matching: .any)["participant-count"].exists)
        app.buttons["Войти и ответить"].tap()
        XCTAssertTrue(app.alerts["Вход ещё не подключён"].waitForExistence(timeout: 3))
        app.buttons["Понятно"].tap()
        capture("invitation-anonymous", app)
        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["Настолки у Саши"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Войти и ответить"].exists)
        XCTAssertFalse(app.staticTexts[message].exists)
        app.open(try XCTUnwrap(URL(string: "group-planning-ios-ui://i/Q0NDQ0NDQ0NDQ0NDQ0NDQw")))
        XCTAssertTrue(app.staticTexts["Приглашение недоступно"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Настолки у Саши"].exists)
        try open(app)
        XCTAssertTrue(app.buttons["Войти и ответить"].exists)
    }

    func testThreeResponsesReentryAndMeetingIDWithdrawal() throws {
        let app = launch("invite-rsvp")
        try open(app)
        XCTAssertFalse(app.staticTexts[message].exists)
        choose("going", confirmation: "Вы придёте", app: app)
        XCTAssertTrue(app.staticTexts[message].waitForExistence(timeout: 10))
        app.buttons["meeting-info-open"].tap()
        XCTAssertEqual(
            app.descendants(matching: .any)["participant-count"].firstMatch.label, "Участники · 2")
        app.buttons["meeting-info-close"].tap()
        capture("invitation-accepted", app)
        choose("maybe", confirmation: "Вы пока не уверены", app: app)
        XCTAssertFalse(app.staticTexts[message].exists)
        XCTAssertFalse(app.descendants(matching: .any)["participant-count"].exists)
        capture("invitation-maybe", app)
        choose("not_going", confirmation: "Вы не сможете прийти", app: app)
        XCTAssertFalse(app.staticTexts[message].exists)
        capture("invitation-declined", app)
        app.terminate()
        app.launchEnvironment["SOMEWHERE_UI_REENTRY"] = "1"
        app.launch()
        XCTAssertTrue(app.staticTexts["confirmed-rsvp"].waitForExistence(timeout: 10))
        XCTAssertTrue(
            app.staticTexts["confirmed-rsvp"].firstMatch.label.contains("Вы не сможете прийти"))
        XCTAssertFalse(app.staticTexts[message].exists)
        choose("going", confirmation: "Вы придёте", app: app)
        XCTAssertTrue(app.staticTexts[message].waitForExistence(timeout: 10))
        app.buttons["feed-back"].tap()
        let card = app.buttons["meeting-card-" + meetingID]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        card.tap()
        XCTAssertTrue(app.staticTexts[message].waitForExistence(timeout: 10))
        choose("not_going", confirmation: "Вы не сможете прийти", app: app)
        XCTAssertFalse(app.staticTexts[message].exists)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.staticTexts["С чего начнём?"].waitForExistence(timeout: 10))
    }

    func testLostRSVPResponseRetriesWithoutPrematureAccess() throws {
        let app = launch("invite-error")
        try open(app, token: "QkJCQkJCQkJCQkJCQkJCQg", title: "Проверка повтора")
        app.buttons["rsvp-going"].tap()
        app.buttons["rsvp-save"].tap()
        XCTAssertTrue(app.staticTexts["rsvp-error"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts[message].exists)
        XCTAssertFalse(app.staticTexts["confirmed-rsvp"].exists)
        capture("invitation-retry", app)
        let retry = app.buttons["rsvp-save"]
        XCTAssertEqual(retry.label, "Повторить сохранение")
        retry.tap()
        XCTAssertTrue(app.staticTexts[message].waitForExistence(timeout: 10))
    }

    func testOrganizerUsesSystemShare() {
        let app = launch("invite-owner")
        let card = app.buttons["meeting-card-" + meetingID]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        card.tap()
        XCTAssertTrue(app.buttons["meeting-info-open"].waitForExistence(timeout: 10))
        app.buttons["meeting-info-open"].tap()
        let share = app.buttons["share-invitation"]
        XCTAssertTrue(share.waitForExistence(timeout: 10))
        share.tap()
        let copy = app.cells.matching(
            NSPredicate(format: "label IN %@", ["Скопировать", "Copy", "Copy Link", "Копировать"])
        ).firstMatch
        XCTAssertTrue(copy.waitForExistence(timeout: 5))
        capture("invitation-system-share", app)
    }
}
