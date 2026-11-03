import XCTest

extension SupportFormUITests {
    func testScreenshotPickerCancellationAndLostReceiptRetryKeepForm() throws {
        let app = XCUIApplication()
        let path = "/api/v1/support/feedback"
        let gate = try ResponseGate(app, path: path, mode: "offline")
        defer { try? gate.cleanUp() }
        try gate.configure(path: path, mode: "offline", method: "POST")
        _ = ChatSheetTestSupport.launch(application: app)
        openSupport(app)
        let description = app.textViews["support-description"]
        let text = "Проверяем сохранение обращения после потери ответа"
        description.tap()
        description.typeText(text)
        app.buttons["support-keyboard-done"].tap()
        let scroll = app.scrollViews["support-scroll"]
        let screenshot = app.buttons.matching(
            NSPredicate(format: "label CONTAINS %@", "Добавить скриншот")
        ).firstMatch
        ChatSheetTestSupport.reveal(screenshot, in: scroll, app: app)
        screenshot.tap()
        let cancel = app.buttons.matching(
            NSPredicate(format: "label IN %@", ["Cancel", "Отмена", "Отменить"])
        ).firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10))
        cancel.tap()
        XCTAssertEqual(description.value as? String, text)
        screenshot.tap()
        let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10))
        photo.tap()
        let remove = app.buttons["Убрать"]
        XCTAssertTrue(remove.waitForExistence(timeout: 10))
        remove.tap()
        XCTAssertFalse(remove.exists)
        let send = app.buttons["Отправить"]
        ChatSheetTestSupport.reveal(send, in: scroll, app: app)
        send.tap()
        let failure = app.staticTexts[
            "Не удалось отправить обращение. Проверьте поля и повторите попытку."]
        XCTAssertTrue(failure.waitForExistence(timeout: 10))
        XCTAssertEqual(description.value as? String, text)
        XCTAssertFalse(app.staticTexts["Обращение принято"].exists)
        try gate.configure(path: path, mode: "unavailable", method: "POST")
        send.tap()
        XCTAssertTrue(failure.waitForExistence(timeout: 10))
        XCTAssertEqual(try gate.receivedStatus(), "201")
        XCTAssertEqual(description.value as? String, text)
        ExperienceScreenshot.save("support-retry-preserved", test: self)
        try gate.release()
        send.tap()
        XCTAssertTrue(app.staticTexts["Обращение принято"].waitForExistence(timeout: 15))
        ExperienceScreenshot.save("support-retry-accepted", test: self)
        app.buttons["Назад"].tap()
        XCTAssertTrue(app.scrollViews["profile-screen"].waitForExistence(timeout: 5))
    }

    func testLeavingHeldSubmissionDoesNotPresentALateReceipt() throws {
        let app = XCUIApplication()
        let path = "/api/v1/support/feedback"
        let gate = try ResponseGate(app, path: path, mode: "hold")
        defer { try? gate.cleanUp() }
        try gate.configure(path: path, mode: "hold", method: "POST")
        _ = ChatSheetTestSupport.launch(application: app)
        openSupport(app)
        let description = app.textViews["support-description"]
        description.tap()
        description.typeText("Проверяем закрытие формы во время отправки обращения")
        app.buttons["support-keyboard-done"].tap()
        let send = app.buttons["Отправить"]
        ChatSheetTestSupport.reveal(send, in: app.scrollViews["support-scroll"], app: app)
        send.tap()
        let requested = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in gate.requested }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [requested], timeout: 10), .completed)
        XCTAssertEqual(try gate.receivedStatus(), "201")
        let back = app.buttons["Назад"]
        ChatSheetTestSupport.reveal(back, in: app.scrollViews["support-scroll"], app: app)
        XCTAssertTrue(back.isEnabled)
        back.tap()
        XCTAssertTrue(app.scrollViews["support-scroll"].waitForNonExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Сообщить о проблеме"].isHittable)
        try gate.release()
        XCTAssertFalse(app.staticTexts["Обращение принято"].exists)
        ExperienceScreenshot.save("support-left-without-late-success", test: self)
    }

    func testServiceDocumentsReturnToProfileAtLargestText() throws {
        let app = ChatSheetTestSupport.launch(large: true)
        app.buttons["home-tab-person.crop.circle"].tap()
        let profile = app.scrollViews["profile-screen"]
        for title in ["Помощь", "О приложении", "Конфиденциальность", "Cookie и данные устройства"]
        {
            let link = app.buttons[title]
            ChatSheetTestSupport.reveal(link, in: profile, app: app)
            link.tap()
            let page = app.scrollViews["service-information-scroll"]
            XCTAssertTrue(page.waitForExistence(timeout: 5))
            XCTAssertFalse(app.buttons["home-tab-calendar"].isHittable)
            if title == "О приложении" {
                XCTAssertEqual(app.staticTexts.matching(identifier: "somewhere").count, 1)
                let version = app.staticTexts["Версия"]
                ChatSheetTestSupport.reveal(version, in: page, app: app)
                XCTAssertTrue(version.isHittable)
                let semver = app.staticTexts.matching(
                    NSPredicate(
                        format: "label MATCHES %@", "[0-9]+\\.[0-9]+\\.[0-9]+(-rc\\.[0-9]+)?")
                ).firstMatch
                XCTAssertTrue(semver.exists)
            }
            let back = app.buttons["Назад"]
            ChatSheetTestSupport.reveal(back, in: page, app: app)
            ExperienceScreenshot.save("service-document-" + title, test: self)
            back.tap()
            XCTAssertTrue(page.waitForNonExistence(timeout: 5))
            XCTAssertTrue(profile.waitForExistence(timeout: 5))
        }
    }

    private func openSupport(_ app: XCUIApplication) {
        app.buttons["home-tab-person.crop.circle"].tap()
        let profile = app.scrollViews["profile-screen"]
        let problem = app.buttons["Сообщить о проблеме"]
        ChatSheetTestSupport.reveal(problem, in: profile, app: app)
        problem.tap()
        XCTAssertTrue(app.textViews["support-description"].waitForExistence(timeout: 5))
    }
}
