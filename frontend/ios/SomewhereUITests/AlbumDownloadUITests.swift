import XCTest

@MainActor
final class AlbumDownloadUITests: XCTestCase {
    private let meeting = "dab00000-0000-4000-8000-000000000001"

    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testAdjacentActionsSaveUsingRealPhotoKitAndKeepSelection() throws {
        let app = configured()
        launchAlbum(app)
        app.buttons["Открыть фото 1"].swipeLeft()
        XCTAssertTrue(app.staticTexts["2 из 3"].waitForExistence(timeout: 5))
        assertAdjacent(app)
        ExperienceScreenshot.save("album-download-ready", test: self)
        app.buttons["album-save"].tap()
        acceptAddPermission(app)
        XCTAssertTrue(app.staticTexts["Фотографии сохранены"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.staticTexts["2 из 3"].exists)
        XCTAssertEqual(app.buttons["album-save"].label, "Сохранить все фото")
        ExperienceScreenshot.save("album-download-saved", test: self)
    }

    func testCancellationAndNetworkRetryKeepPhotoGeometry() throws {
        let app = configured()
        let path = "/api/v1/meetings/" + meeting + "/memories/snapshot"
        let gate = try ResponseGate(app, path: path, mode: "hold-before")
        defer { try? gate.cleanUp() }
        launchAlbum(app)
        let photo = app.buttons["Открыть фото 1"]
        let before = photo.frame
        let save = app.buttons["album-save"]
        let saveBefore = save.frame
        save.tap()
        acceptAddPermission(app)
        XCTAssertEqual(
            XCTWaiter.wait(
                for: [
                    XCTNSPredicateExpectation(
                        predicate: NSPredicate { _, _ in gate.requested }, object: nil)
                ],
                timeout: 10), .completed)
        XCTAssertEqual(save.label, "Отменить подготовку фотографий")
        assertAdjacent(app)
        XCTAssertEqual(photo.frame.minY, before.minY, accuracy: 1)
        XCTAssertEqual(photo.frame.height, before.height, accuracy: 1)
        XCTAssertEqual(save.frame.height, saveBefore.height, accuracy: 1)
        ExperienceScreenshot.save("album-download-preparing", test: self)
        save.tap()
        XCTAssertEqual(save.label, "Сохранить все фото")
        XCTAssertEqual(photo.frame.minY, before.minY, accuracy: 1)
        try gate.configure(path: path, mode: "offline")
        XCTAssertTrue(save.waitForExistence(timeout: 5))
        let ready = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "enabled == true"), object: save)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 5), .completed)
        save.tap()
        XCTAssertTrue(
            app.staticTexts["Не удалось подготовить фотографии. Попробуйте ещё раз."]
                .waitForExistence(timeout: 10))
        ExperienceScreenshot.save("album-download-error", test: self)
        try gate.configure(path: path, mode: "hold-before")
        save.tap()
        XCTAssertEqual(save.label, "Отменить подготовку фотографий")
        save.tap()
        XCTAssertEqual(save.label, "Сохранить все фото")
        XCTAssertFalse(app.staticTexts["Фотографии сохранены"].exists)
    }

    func testLeavingCancelsPreparationAndLargeTextActionsRemainAdjacent() throws {
        let app = configured(large: true)
        let gate = try ResponseGate(
            app, path: "/api/v1/meetings/" + meeting + "/memories/snapshot", mode: "hold-before")
        defer { try? gate.cleanUp() }
        launchAlbum(app)
        assertAdjacent(app)
        ExperienceScreenshot.save("album-download-large-text", test: self)
        app.buttons["album-save"].tap()
        acceptAddPermission(app)
        XCTAssertTrue(app.buttons["Отменить подготовку фотографий"].waitForExistence(timeout: 10))
        app.buttons["memories-back"].tap()
        let album = app.buttons["meeting-memories-" + meeting]
        XCTAssertTrue(album.waitForExistence(timeout: 10))
        try gate.release()
        album.tap()
        XCTAssertTrue(app.buttons["album-save"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons["album-save"].label, "Сохранить все фото")
        XCTAssertFalse(app.staticTexts["Фотографии сохранены"].exists)
    }

    func testPermissionRefusalKeepsAlbumAndOffersSettings() {
        let app = configured()
        app.resetAuthorizationStatus(for: .photos)
        defer { app.resetAuthorizationStatus(for: .photos) }
        launchAlbum(app)
        app.buttons["album-save"].tap()
        let alert = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch
        XCTAssertTrue(alert.waitForExistence(timeout: 10))
        XCTAssertTrue(
            alert.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "somewhere QA"))
                .firstMatch.exists)
        alert.buttons["Не разрешать"].tap()
        XCTAssertTrue(
            app.staticTexts["Разрешите сохранять фото в настройках приложения."]
                .waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons["album-save"].label, "Настройки")
        XCTAssertTrue(app.staticTexts["1 из 3"].exists)
        XCTAssertFalse(app.staticTexts["Фотографии сохранены"].exists)
        ExperienceScreenshot.save("album-download-permission-denied", test: self)
    }

    private func configured(large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "audit-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        if large {
            app.launchArguments += [
                "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
            ]
        }
        ExperienceScreenshot.configure(app)
        return app
    }

    private func launchAlbum(_ app: XCUIApplication) {
        app.launch()
        let past = app.buttons["period-past"]
        XCTAssertTrue(past.waitForExistence(timeout: 15))
        past.tap()
        let album = app.buttons["meeting-memories-" + meeting]
        XCTAssertTrue(album.waitForExistence(timeout: 10))
        album.tap()
        XCTAssertTrue(app.buttons["Открыть фото 1"].waitForExistence(timeout: 10))
    }

    private func assertAdjacent(_ app: XCUIApplication) {
        let add = app.buttons["album-add"]
        let save = app.buttons["album-save"]
        XCTAssertTrue(add.isHittable)
        XCTAssertTrue(save.isHittable)
        XCTAssertEqual(add.frame.minY, save.frame.minY, accuracy: 1)
        XCTAssertEqual(add.frame.height, save.frame.height, accuracy: 1)
        XCTAssertEqual(add.frame.width, save.frame.width, accuracy: 1)
        XCTAssertGreaterThanOrEqual(save.frame.minX - add.frame.maxX, 7)
        XCTAssertLessThanOrEqual(save.frame.maxX, app.frame.maxX)
    }

    private func acceptAddPermission(_ app: XCUIApplication) {
        // iOS presents this application's add-only request in SpringBoard, not
        // in the application's accessibility subtree.
        let alert = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch
        guard alert.waitForExistence(timeout: 2) else { return }
        XCTAssertTrue(
            alert.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "somewhere QA"))
                .firstMatch.exists)
        for title in [
            "Разрешить добавление фото", "Разрешить добавление", "Allow Adding Photos", "OK",
            "Разрешить",
        ] {
            let button = alert.buttons[title]
            if button.exists {
                button.tap()
                return
            }
        }
        XCTFail("Не найдено ожидаемое разрешение add-only: " + alert.debugDescription)
    }
}
