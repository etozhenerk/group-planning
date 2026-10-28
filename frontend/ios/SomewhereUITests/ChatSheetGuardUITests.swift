import XCTest

@MainActor
final class ChatSheetGuardUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testBodySwipeKeepsDraftAndDoesNotRefresh() throws {
        let app = XCUIApplication()
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(
            "sheet-body-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        _ = ChatSheetTestSupport.launch(application: app)
        ChatSheetTestSupport.openChat(app)
        ChatSheetTestSupport.openAction("new-place-poll", app: app)
        let field = app.descendants(matching: .any)["place-poll-place"].firstMatch
        field.tap()
        field.typeText("Сохраняем кафе у метро")
        app.buttons["action-keyboard-done"].tap()
        let before = try counts(trace)
        app.scrollViews["action-form-scroll"].swipeDown()
        let afterSwipe = try counts(trace)
        XCTAssertEqual(afterSwipe, before, "Dragging the sheet body must not start any request")
        if app.staticTexts["action-form-header"].exists {
            ChatSheetTestSupport.dismissBySwipe(app)
        }
        ChatSheetTestSupport.openAction("new-place-poll", app: app)
        XCTAssertEqual(field.value as? String, "Сохраняем кафе у метро")
        ExperienceScreenshot.save("sheet-controls-body-draft", test: self)
    }

    func testBusySheetRejectsSwipeThenClosesAfterOneSubmission() async throws {
        let app = XCUIApplication()
        let root = "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting
        let path = root + "/preparation-tasks"
        let gate = try ResponseGate(app, path: path, mode: "hold-before")
        try gate.configure(path: path, mode: "hold-before", method: "POST")
        addTeardownBlock { @MainActor in try gate.cleanUp() }
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(
            "sheet-submit-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        _ = ChatSheetTestSupport.launch(application: app)
        ChatSheetTestSupport.openChat(app)
        ChatSheetTestSupport.openAction("new-preparation-task", app: app)
        let field = app.descendants(matching: .any)["preparation-title"].firstMatch
        field.tap()
        field.typeText("Купить салфетки " + UUID().uuidString.prefix(6))
        app.buttons["action-keyboard-done"].tap()
        let submit = app.buttons["preparation-create"]
        XCTAssertTrue(submit.isEnabled)
        submit.tap()
        let sent = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in gate.requested }, object: nil)
        let sentResult = await XCTWaiter.fulfillment(of: [sent], timeout: 5)
        XCTAssertEqual(sentResult, .completed)
        let before = try counts(trace)
        let header = app.staticTexts["action-form-header"]
        XCTAssertTrue(header.exists)
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        XCTAssertTrue(header.exists)
        XCTAssertFalse(submit.isEnabled)
        XCTAssertEqual(try counts(trace), before)
        ExperienceScreenshot.save("sheet-controls-busy-guard", test: self)
        try gate.release()
        XCTAssertTrue(header.waitForNonExistence(timeout: 15))
        XCTAssertTrue(app.buttons["meeting-add"].isHittable)
        XCTAssertEqual(try counts(trace)[path], 1)
        ExperienceScreenshot.save("sheet-controls-success-dismiss", test: self)
    }

    func testPresentedInvitationBodyDoesNotRefresh() throws {
        let app = XCUIApplication()
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(
            "sheet-invitation-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "invite-anonymous"
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        let token = "QUFBQUFBQUFBQUFBQUFBQQ"
        let link = try XCTUnwrap(URL(string: "group-planning-ios-ui://i/" + token))
        app.open(link)
        let scroll = app.scrollViews["invitation-screen"]
        XCTAssertTrue(scroll.waitForExistence(timeout: 10))
        let path = "/api/v1/invitations/" + token
        try waitForInvitationPoll(trace, path: path)
        let before = try counts(trace)[path]
        scroll.swipeDown()
        XCTAssertEqual(try counts(trace)[path], before)
        ExperienceScreenshot.save("sheet-controls-invitation-body", test: self)
    }

    func testOrdinaryRevokedPreviewKeepsPrivacyAndRejoin() throws {
        let app = XCUIApplication()
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(
            "ordinary-invitation-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        _ = ChatSheetTestSupport.launch(application: app)
        let meeting = MeetingInfoTestSupport.memberMeeting
        ChatSheetTestSupport.openChat(app, id: meeting)
        MeetingInfoTestSupport.open(app)
        let maybe = app.buttons["rsvp-maybe"]
        MeetingInfoTestSupport.reveal(maybe, app: app)
        maybe.tap()
        let save = app.buttons["rsvp-save"]
        MeetingInfoTestSupport.reveal(save, app: app)
        save.tap()
        let scroll = app.scrollViews["invitation-screen"]
        XCTAssertTrue(scroll.waitForExistence(timeout: 10))
        let path = "/api/v1/meetings/" + meeting
        let before = try counts(trace)[path] ?? 0
        scroll.swipeDown()
        XCTAssertEqual(try counts(trace)[path] ?? 0, before)
        XCTAssertTrue(scroll.exists)
        ExperienceScreenshot.save("sheet-controls-revoked-preview", test: self)
        let going = app.buttons["rsvp-going"]
        ChatSheetTestSupport.reveal(going, in: scroll, app: app)
        going.tap()
        ChatSheetTestSupport.reveal(save, in: scroll, app: app)
        save.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
    }

    private func waitForInvitationPoll(_ trace: URL, path: String) throws {
        let initial = try counts(trace)[path] ?? 0
        let polled = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                ((try? self.counts(trace)[path]) ?? 0) > initial
            }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [polled], timeout: 7), .completed)
    }

    private func counts(_ file: URL) throws -> [String: Int] {
        try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: file))
    }
}
