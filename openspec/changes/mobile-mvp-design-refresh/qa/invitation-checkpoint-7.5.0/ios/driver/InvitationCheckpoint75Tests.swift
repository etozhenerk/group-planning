import XCTest

@MainActor
final class InvitationCheckpoint75Tests: XCTestCase {
    private let root = "/Users/misha/Documents/Codex/projects/group-planning"
    private let output = "/private/tmp/invitation-checkpoint75-independent-captures"
    private var created: [(String, String)] = []

    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws { XCUIDevice.shared.orientation = .portrait }

    private func makeMeeting(title: String = "Ужин в пятницу", cover: Bool = true,
                             time: Bool = true, ownerActor: String = "review-reader-1") async throws -> (String, String) {
        let owner = try NativeChatCounterpart(actor: ownerActor)
        var body: [String: Any] = [
            "title": title,
            "description": "Соберёмся после работы: поужинаем и поболтаем. Столик на шестерых уже забронирован.",
            "starts_on": "2026-11-06", "timezone": "Europe/Moscow",
            "starts_at": time ? "2026-11-06T20:00:00+03:00" : NSNull(),
            "place": "Кафе «Соседи», Покровка, 8",
        ]
        if cover {
            let file = URL(fileURLWithPath: root + "/openspec/changes/meeting-experience-refresh/assets/dinner.png")
            body["cover"] = ["media_type": "image/png", "data": try Data(contentsOf: file).base64EncodedString()]
        }
        let result = try await owner.request("meetings", method: "POST", body: body)
        let meeting = try XCTUnwrap(result["meeting"] as? [String: Any])
        let id = try XCTUnwrap(meeting["id"] as? String)
        let invitation = try XCTUnwrap(result["invitation_url"] as? String)
        let token = try XCTUnwrap(URL(string: invitation)?.lastPathComponent)
        created.append((id, token))
        return (id, token)
    }

    private func launch(_ scenario: String = "invite-rsvp", large: Bool = false,
                        gate: ((XCUIApplication) throws -> ResponseGate)? = nil)
        throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName",
            large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL"]
        ExperienceScreenshot.configure(app)
        let responseGate = try gate?(app)
        app.launch()
        return (app, responseGate)
    }

    private func open(_ token: String, _ app: XCUIApplication, title: String = "Ужин в пятницу") throws {
        app.open(try XCTUnwrap(URL(string: "group-planning-ios-ui://i/" + token)))
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 12))
    }

    private func capture(_ name: String, _ app: XCUIApplication, settle: Bool = true) throws {
        if settle { RunLoop.current.run(until: Date().addingTimeInterval(0.35)) }
        let url = URL(fileURLWithPath: output).appendingPathComponent(name)
        try XCUIScreen.main.screenshot().pngRepresentation.write(to: url.appendingPathExtension("png"))
        try app.debugDescription.write(to: url.appendingPathExtension("ax.txt"), atomically: true, encoding: .utf8)
        let metadata: [String: Any] = ["capturedAt": ISO8601DateFormatter().string(from: Date()),
            "appFrame": String(describing: app.frame), "orientation": XCUIDevice.shared.orientation.rawValue,
            "captureMethod": "XCUIScreen + app.debugDescription; full hierarchy in ax.txt"]
        try JSONSerialization.data(withJSONObject: metadata, options: [.prettyPrinted, .sortedKeys])
            .write(to: url.appendingPathExtension("json"))
        ExperienceScreenshot.save(name, test: self)
        let environment = FileManager.default.temporaryDirectory
            .appendingPathComponent("somewhere-design-verification/" + name + ".json")
        try Data(contentsOf: environment).write(
            to: url.appendingPathExtension("environment.json"))
        print("INDEPENDENT_CAPTURE=\(name)")
    }

    private func wait(_ element: XCUIElement, _ predicate: String = "exists == true", timeout: Double = 10) {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(
            predicate: NSPredicate(format: predicate), object: element)], timeout: timeout), .completed)
    }

    func testAReadyMaybeDeclinedAndGuest() async throws {
        let (id, token) = try await makeMeeting()
        let (app, _) = try launch("invite-anonymous")
        try open(token, app)
        wait(app.images["meeting-cover"])
        XCTAssertTrue(app.staticTexts["Москва"].exists)
        XCTAssertFalse(app.staticTexts["Europe/Moscow"].exists)
        try capture("guest-standard-phone", app)
        XCTAssertTrue(app.buttons["Войти через Яндекс ID"].isHittable)
        app.buttons["Войти через Яндекс ID"].tap()
        wait(app.alerts["Не удалось войти"])
        try capture("auth-error-standard-phone", app)
        app.buttons["Понятно"].tap()
        XCTAssertTrue(app.buttons["Войти через Яндекс ID"].isEnabled)
        app.buttons["Закрыть"].tap()
        XCTAssertFalse(app.scrollViews["invitation-screen"].exists)
        app.terminate()
        let (signed, _) = try launch()
        try open(token, signed)
        wait(signed.buttons["rsvp-going"])
        try capture("ready-standard-phone", signed)
        signed.buttons["rsvp-maybe"].tap()
        wait(signed.buttons["saved-invitation-" + id])
        try capture("maybe-invitations", signed)
        signed.buttons["saved-invitation-" + id].tap()
        wait(signed.buttons["rsvp-maybe"])
        XCTAssertTrue(signed.buttons["rsvp-maybe"].isSelected)
        try capture("maybe-standard-phone", signed)
        signed.buttons["rsvp-not_going"].tap()
        wait(signed.scrollViews["rsvp-declined"])
        try capture("declined-confirmation", signed)
        XCTAssertTrue(signed.buttons["К моим встречам"].isHittable)
        signed.buttons["К моим встречам"].tap()
        wait(signed.buttons["Встречи"])
        XCTAssertFalse(signed.scrollViews["rsvp-declined"].exists)
        try capture("meetings-action", signed)
    }

    func testBBusyUnknownRetryAndMember() async throws {
        let (id, token) = try await makeMeeting()
        let (app, optionalGate) = try launch(gate: { app in
            try ResponseGate(app, path: "/api/v1/invitations/" + token + "/rsvp", mode: "staged-drop")
        })
        let gate = try XCTUnwrap(optionalGate)
        try gate.configure(path: "/api/v1/invitations/" + token + "/rsvp", mode: "staged-drop", method: "PUT")
        defer { try? gate.cleanUp() }
        try open(token, app)
        app.buttons["rsvp-going"].tap()
        wait(app.buttons["rsvp-going"], "enabled == false")
        try capture("response-busy-standard-phone", app)
        try gate.allowMessageCommit()
        wait(app.staticTexts["rsvp-error"])
        XCTAssertTrue(app.buttons["rsvp-going"].isEnabled)
        XCTAssertFalse(app.buttons["rsvp-maybe"].isEnabled)
        try capture("response-unknown-standard-phone", app)
        app.buttons["rsvp-going"].tap()
        wait(app.buttons["meeting-info-open"])
        try capture("going-chat", app)
        app.buttons["meeting-info-open"].tap()
        wait(app.buttons["meeting-people-summary"])
        try capture("member-information", app)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "meeting-info-header")
        try open(token, app)
        wait(app.buttons["meeting-info-open"])
        try capture("member-chat", app)
        let owner = try NativeChatCounterpart(actor: "review-reader-1", meeting: id)
        let feed = try await owner.request("meetings/" + id + "/feed")
        let data = try JSONSerialization.data(withJSONObject: feed, options: [.prettyPrinted, .sortedKeys])
        try data.write(to: URL(fileURLWithPath: output + "/member-feed.json"))
    }

    func testCNoCoverNoTimeLongAndClosed() async throws {
        let (_, noCover) = try await makeMeeting(cover: false)
        let (_, noTime) = try await makeMeeting(time: false)
        let longTitle = "Большой вечер настольных игр, пиццы и разговоров до утра"
        let (id, long) = try await makeMeeting(title: longTitle)
        let (app, _) = try launch()
        try open(noCover, app)
        try capture("no-cover-standard-phone", app)
        try open(noTime, app)
        try capture("no-time-standard-phone", app)
        try open(long, app, title: longTitle)
        try capture("long-standard-phone", app)
        app.buttons["rsvp-not_going"].tap()
        wait(app.scrollViews["rsvp-declined"])
        try capture("declined-long-title", app)
        app.buttons["К моим встречам"].tap()
        let owner = try NativeChatCounterpart(actor: "review-reader-1", meeting: id)
        try await owner.reschedule(start: Date().addingTimeInterval(1200))
        try open(long, app, title: longTitle)
        wait(app.buttons["rsvp-going"], "exists == false")
        try capture("closed-standard-phone", app)
        XCTAssertFalse(app.buttons["rsvp-maybe"].exists)
        XCTAssertFalse(app.buttons["rsvp-not_going"].exists)
    }

    func testDLoadingUnavailableAndRecovery() async throws {
        let (_, token) = try await makeMeeting()
        let (app, optionalGate) = try launch("invite-anonymous", gate: { app in
            try ResponseGate(app, path: "/api/v1/invitations/" + token, mode: "hold-before")
        })
        let gate = try XCTUnwrap(optionalGate)
        defer { try? gate.cleanUp() }
        app.open(try XCTUnwrap(URL(string: "group-planning-ios-ui://i/" + token)))
        wait(app.otherElements["invitation-loading"])
        try capture("loading-standard-phone", app)
        try gate.release()
        wait(app.staticTexts["Ужин в пятницу"])
        XCTAssertTrue(app.buttons["Войти через Яндекс ID"].isHittable)
        app.open(try XCTUnwrap(URL(string: "group-planning-ios-ui://i/Q0NDQ0NDQ0NDQ0NDQ0NDQw")))
        wait(app.staticTexts["Приглашение недоступно"])
        try capture("unavailable-standard-phone", app)
        app.buttons["Повторить загрузку"].tap()
        wait(app.staticTexts["Приглашение недоступно"])
        try open(token, app)
        XCTAssertTrue(app.buttons["Войти через Яндекс ID"].isHittable)
    }

    func testELargeTextAndLandscape() async throws {
        let (_, token) = try await makeMeeting()
        let (app, _) = try launch(large: true)
        try open(token, app)
        try capture("large-text", app)
        for name in ["rsvp-going", "rsvp-maybe", "rsvp-not_going"] {
            XCTAssertTrue(app.buttons[name].isHittable, "Required action unreachable at largest text: " + name)
        }
        app.buttons["rsvp-not_going"].tap()
        wait(app.scrollViews["rsvp-declined"])
        try capture("declined-large-text", app)
        for _ in 0..<6 {
            if app.buttons["К моим встречам"].isHittable { break }
            app.scrollViews["rsvp-declined"].swipeUp()
        }
        XCTAssertTrue(app.buttons["К моим встречам"].isHittable)
        app.terminate()
        let (normal, _) = try launch()
        try open(token, normal)
        XCUIDevice.shared.orientation = .landscapeLeft
        try capture("landscape-return", normal)
        XCTAssertTrue(normal.buttons["rsvp-going"].isHittable)
        normal.buttons["Закрыть"].tap()
        XCTAssertFalse(normal.scrollViews["invitation-screen"].exists)
        XCUIDevice.shared.orientation = .portrait
    }

    func testFOrganizerShareAndReducedMotion() async throws {
        let (_, token) = try await makeMeeting()
        let motion = SimulatorMotionPreference()
        try motion.enable()
        defer { try? motion.restore() }
        let (app, _) = try launch("review-owner")
        try open(token, app)
        wait(app.buttons["meeting-info-open"])
        XCTAssertTrue(try ExperienceScreenshot.reducedMotionEnabled())
        try capture("organizer-chat-reduced-motion", app)
        app.buttons["meeting-info-open"].tap()
        wait(app.buttons["meeting-info-share"])
        try capture("organizer-information", app)
        app.buttons["meeting-info-share"].tap()
        let copy = app.cells.matching(NSPredicate(format: "label IN %@", ["Скопировать", "Copy", "Copy Link", "Копировать"])).firstMatch
        wait(copy)
        try capture("share-standard-phone", app)
    }

    func testGServerEventsAndReopen() async throws {
        let (id, token) = try await makeMeeting()
        let actor = try NativeChatCounterpart(actor: "invite-rsvp", meeting: id)
        for answer in ["going", "maybe", "not_going"] {
            let preview = try await actor.request("invitations/" + token)
            let revision = try XCTUnwrap(preview["my_rsvp_revision"] as? String)
            _ = try await actor.request("invitations/" + token + "/rsvp", method: "PUT",
                body: ["answer": answer, "expected_revision": revision])
        }
        let (app, _) = try launch("review-owner")
        try open(token, app)
        wait(app.buttons["meeting-info-open"])
        try capture("server-events", app)
        try open(token, app)
        wait(app.buttons["meeting-info-open"])
        try capture("server-events-reopen", app)
        let owner = try NativeChatCounterpart(actor: "review-reader-1", meeting: id)
        let feed = try await owner.request("meetings/" + id + "/feed")
        try JSONSerialization.data(withJSONObject: feed, options: [.prettyPrinted, .sortedKeys])
            .write(to: URL(fileURLWithPath: output + "/three-response-events.json"))
    }

    func testHSuccessfulSignInWaitsForExplicitResponse() async throws {
        let (_, token) = try await makeMeeting()
        let (app, optionalGate) = try launch("profile-fields", gate: { app in
            try ResponseGate(app, path: "/api/v1/auth/yandex/start", mode: "hold-before")
        })
        let gate = try XCTUnwrap(optionalGate)
        try gate.configure(path: "/api/v1/auth/yandex/start", mode: "hold-before", method: "POST")
        defer { try? gate.cleanUp() }
        try open(token, app)
        app.buttons["Войти через Яндекс ID"].tap()
        wait(app.buttons["Войти через Яндекс ID"], "enabled == false")
        try capture("sign-in-busy-standard-phone", app)
        try gate.release()
        try await Task.sleep(for: .seconds(4))
        try capture("auth-return-observed", app)
        wait(app.buttons["rsvp-going"], "exists == true AND enabled == true", timeout: 15)
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        try capture("auth-no-rsvp", app)
        XCTAssertFalse(app.buttons["rsvp-going"].isSelected)
    }

    func testIConflictAndClosedMember() async throws {
        let (id, token) = try await makeMeeting()
        let (app, _) = try launch()
        try open(token, app)
        let actor = try NativeChatCounterpart(actor: "invite-rsvp", meeting: id)
        _ = try await actor.request("invitations/" + token + "/rsvp", method: "PUT",
            body: ["answer": "maybe", "expected_revision": "0"])
        app.buttons["rsvp-going"].tap()
        wait(app.staticTexts["rsvp-error"])
        try capture("response-error-standard-phone", app)
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        app.buttons["rsvp-going"].tap()
        wait(app.buttons["meeting-info-open"])
        let owner = try NativeChatCounterpart(actor: "review-reader-1", meeting: id)
        try await owner.reschedule(start: Date().addingTimeInterval(1200))
        try open(token, app)
        wait(app.buttons["meeting-info-open"])
        try capture("closed-member-standard-phone", app)
        XCTAssertFalse(app.buttons["rsvp-going"].exists)
    }

    func testJShareErrorAndRetry() async throws {
        let (id, token) = try await makeMeeting()
        let path = "/api/v1/meetings/" + id + "/invitation"
        let (app, optionalGate) = try launch("review-owner", gate: { app in
            try ResponseGate(app, path: path, mode: "unavailable")
        })
        let gate = try XCTUnwrap(optionalGate)
        defer { try? gate.cleanUp() }
        try open(token, app)
        wait(app.buttons["meeting-info-open"])
        app.buttons["meeting-info-open"].tap()
        wait(app.staticTexts["meeting-info-header"])
        try await Task.sleep(for: .seconds(1))
        try capture("share-error-standard-phone", app)
        XCTAssertFalse(app.buttons["meeting-info-share"].exists)
        XCTAssertTrue(app.buttons["invitation-share-retry"].isHittable)
        try gate.release()
        app.buttons["invitation-share-retry"].tap()
        wait(app.buttons["meeting-info-share"])
        app.buttons["meeting-info-share"].tap()
        wait(SystemShareTestSupport.copy(app))
        try capture("share-retry-result", app)
        SystemShareTestSupport.cancel(app)
    }

    func testKKeyboardReturnAndResponseWithReducedMotion() async throws {
        let (_, ownerToken) = try await makeMeeting()
        let (id, token) = try await makeMeeting(ownerActor: "invite-rsvp")
        let motion = SimulatorMotionPreference()
        try motion.enable()
        defer { try? motion.restore() }
        let (app, _) = try launch("review-owner")
        try open(ownerToken, app)
        wait(app.textViews["message-input"])
        app.textViews["message-input"].tap()
        wait(app.keyboards.firstMatch)
        try capture("keyboard-before-invitation", app)
        try open(token, app)
        wait(app.buttons["rsvp-going"])
        XCTAssertFalse(app.keyboards.firstMatch.exists)
        XCTAssertTrue(app.buttons["rsvp-going"].isHittable)
        XCTAssertTrue(try ExperienceScreenshot.reducedMotionEnabled())
        try capture("short-ime", app)
        try capture("invitation-reduced-motion", app)
        app.buttons["rsvp-going"].tap()
        wait(app.buttons["meeting-info-open"])
        try capture("event-reduced-motion", app)
        app.buttons["meeting-info-open"].tap()
        wait(app.buttons["rsvp-maybe"])
        app.buttons["rsvp-maybe"].tap()
        wait(app.buttons["saved-invitation-" + id])
        app.buttons["saved-invitation-" + id].tap()
        wait(app.buttons["rsvp-not_going"])
        app.buttons["rsvp-not_going"].tap()
        wait(app.scrollViews["rsvp-declined"])
        try capture("declined-reduced-motion", app)
        app.buttons["К моим встречам"].tap()
        wait(app.buttons["Встречи"])
    }

    func testLServerEventsAtLargestText() async throws {
        let (id, token) = try await makeMeeting()
        let actor = try NativeChatCounterpart(actor: "invite-rsvp", meeting: id)
        for answer in ["going", "maybe", "not_going"] {
            let preview = try await actor.request("invitations/" + token)
            let revision = try XCTUnwrap(preview["my_rsvp_revision"] as? String)
            _ = try await actor.request("invitations/" + token + "/rsvp", method: "PUT",
                body: ["answer": answer, "expected_revision": revision])
        }
        let (app, _) = try launch("review-owner", large: true)
        try open(token, app)
        wait(app.buttons["meeting-info-open"])
        try capture("server-events-large-text", app)
        app.scrollViews["feed-timeline"].swipeUp()
        try capture("server-events-large-text-tail", app)
    }
    func testKNarrowWindowSmoke() async throws {
        let (_, token) = try await makeMeeting()
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "invite-anonymous"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        try open(token, app)
        XCTAssertTrue(app.buttons["Войти через Яндекс ID"].isHittable)
        try capture("narrow-window-smoke", app)
    }

}
