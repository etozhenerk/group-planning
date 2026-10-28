import UIKit
import XCTest

@MainActor
final class MeetingInfoUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testOrganizerCompactExpandCollapseAndSharePreserveDraft() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let message = app.textViews["message-input"]
        message.tap()
        message.typeText("Уточню состав")
        MeetingInfoTestSupport.open(app)
        let summary = app.buttons["meeting-people-summary"]
        XCTAssertEqual(summary.label, "Компания, 6 участников")
        XCTAssertFalse(MeetingInfoTestSupport.person(3, app: app).exists)
        XCTAssertFalse(app.scrollViews["meeting-info"].images["meeting-cover"].exists)
        XCTAssertTrue(app.buttons["edit-meeting"].isHittable)
        XCTAssertFalse(app.buttons["rsvp-going"].exists)
        ExperienceScreenshot.save("info-organizer-compact", test: self)
        summary.tap()
        XCTAssertTrue(app.buttons["meeting-people-collapse"].waitForExistence(timeout: 5))
        XCTAssertTrue(MeetingInfoTestSupport.person(3, app: app).label.contains("Организатор"))
        for index in 1...6 {
            let row = MeetingInfoTestSupport.person(index, app: app)
            MeetingInfoTestSupport.reveal(row, app: app)
            XCTAssertFalse(row.label.isEmpty)
        }
        ExperienceScreenshot.save("info-organizer-expanded", test: self)
        let share = app.buttons["meeting-info-share"]
        MeetingInfoTestSupport.reveal(share, app: app)
        share.tap()
        XCTAssertFalse(app.staticTexts["meeting-share-header"].exists)
        let copy = MeetingInfoTestSupport.copyAction(app)
        XCTAssertTrue(copy.waitForExistence(timeout: 5))
        SystemShareTestSupport.cancel(app)
        MeetingInfoTestSupport.waitUntilGone(copy)
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["meeting-people-collapse"].exists)
        MeetingInfoTestSupport.reveal(share, app: app)
        let clipboardVersion = UIPasteboard.general.changeCount
        share.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(copy.waitForExistence(timeout: 5))
        copy.tap()
        MeetingInfoTestSupport.waitUntilGone(copy)
        XCTAssertGreaterThan(UIPasteboard.general.changeCount, clipboardVersion)
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout: 5))
        let collapse = app.buttons["meeting-people-collapse"]
        MeetingInfoTestSupport.reveal(collapse, app: app)
        collapse.tap()
        XCTAssertTrue(summary.waitForExistence(timeout: 5))
        XCTAssertFalse(MeetingInfoTestSupport.person(3, app: app).exists)
        XCTAssertTrue(app.buttons["edit-meeting"].exists)
        ExperienceScreenshot.save("info-organizer-collapsed-after-share", test: self)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "meeting-info-header")
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 5))
        XCTAssertEqual(message.value as? String, "Уточню состав")
    }

    func testMemberResponseRemainsIndependentOfExpandedRoster() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app, id: MeetingInfoTestSupport.memberMeeting)
        MeetingInfoTestSupport.open(app)
        XCTAssertFalse(app.buttons["edit-meeting"].exists)
        XCTAssertFalse(app.buttons["share-invitation"].exists)
        let going = app.buttons["rsvp-going"]
        XCTAssertTrue(going.isSelected)
        XCTAssertTrue(going.isHittable)
        ExperienceScreenshot.save("info-member-compact", test: self)
        app.buttons["meeting-people-summary"].tap()
        XCTAssertTrue(app.buttons["meeting-people-collapse"].waitForExistence(timeout: 5))
        XCTAssertTrue(MeetingInfoTestSupport.person(4, app: app).label.contains("Организатор"))
        let maybe = app.buttons["rsvp-maybe"]
        MeetingInfoTestSupport.reveal(maybe, app: app)
        maybe.tap()
        XCTAssertTrue(maybe.isSelected)
        let save = app.buttons["rsvp-save"]
        XCTAssertTrue(save.waitForExistence(timeout: 5))
        XCTAssertTrue(
            app.staticTexts[
                "После сохранения переписка и состав участников будут недоступны."
            ].exists)
        ExperienceScreenshot.save("info-member-expanded-response", test: self)
        let collapse = app.buttons["meeting-people-collapse"]
        MeetingInfoTestSupport.reveal(collapse, app: app)
        collapse.tap()
        XCTAssertTrue(app.buttons["meeting-people-summary"].waitForExistence(timeout: 5))
        XCTAssertTrue(maybe.isSelected)
        XCTAssertTrue(save.exists)
        MeetingInfoTestSupport.reveal(going, app: app)
        going.tap()
        XCTAssertTrue(going.isSelected)
        XCTAssertFalse(save.exists)
        XCTAssertFalse(app.buttons["edit-meeting"].exists)
        maybe.tap()
        MeetingInfoTestSupport.reveal(save, app: app)
        save.tap()
        let confirmed = app.staticTexts["confirmed-rsvp"]
        XCTAssertTrue(confirmed.waitForExistence(timeout: 10))
        XCTAssertTrue(confirmed.label.contains("Вы пока не уверены"))
        XCTAssertFalse(app.buttons["message-send"].exists)
        XCTAssertFalse(app.staticTexts["meeting-info-header"].exists)
        XCTAssertTrue(app.images["meeting-cover"].waitForExistence(timeout: 10))
        ExperienceScreenshot.save("info-member-saved-rsvp", test: self)
        let invitation = app.scrollViews["invitation-screen"]
        ChatSheetTestSupport.reveal(going, in: invitation, app: app)
        going.tap()
        ChatSheetTestSupport.reveal(save, in: invitation, app: app)
        save.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
    }

    func testOrganizerLargeTextReachesRosterSettingsAndClose() {
        let app = ChatSheetTestSupport.launch(large: true)
        ChatSheetTestSupport.openChat(app)
        MeetingInfoTestSupport.open(app)
        let summary = app.buttons["meeting-people-summary"]
        MeetingInfoTestSupport.reveal(summary, app: app)
        XCTAssertTrue(app.frame.contains(summary.frame))
        ExperienceScreenshot.save("info-organizer-large-compact", test: self)
        summary.tap()
        let last = MeetingInfoTestSupport.person(6, app: app)
        MeetingInfoTestSupport.reveal(last, app: app)
        XCTAssertTrue(app.frame.contains(last.frame))
        let edit = app.buttons["edit-meeting"]
        MeetingInfoTestSupport.reveal(edit, app: app)
        XCTAssertTrue(app.frame.contains(edit.frame))
        ExperienceScreenshot.save("info-organizer-large-expanded", test: self)
        edit.tap()
        XCTAssertTrue(app.staticTexts["settings-header"].waitForExistence(timeout: 5))
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "settings-header")
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["meeting-people-collapse"].exists)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "meeting-info-header")
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 5))
    }

    func testMemberLargeTextKeepsAllResponsesAndCollapseReachable() {
        let app = ChatSheetTestSupport.launch(large: true)
        ChatSheetTestSupport.openChat(app, id: MeetingInfoTestSupport.memberMeeting)
        MeetingInfoTestSupport.open(app)
        let summary = app.buttons["meeting-people-summary"]
        MeetingInfoTestSupport.reveal(summary, app: app)
        summary.tap()
        for answer in ["going", "maybe", "not_going"] {
            let choice = app.buttons["rsvp-" + answer]
            MeetingInfoTestSupport.reveal(choice, app: app)
            XCTAssertTrue(app.frame.contains(choice.frame))
            XCTAssertGreaterThanOrEqual(choice.frame.height, 44)
        }
        XCTAssertFalse(app.buttons["edit-meeting"].exists)
        ExperienceScreenshot.save("info-member-large-expanded", test: self)
        let collapse = app.buttons["meeting-people-collapse"]
        MeetingInfoTestSupport.reveal(collapse, app: app)
        collapse.tap()
        XCTAssertTrue(summary.waitForExistence(timeout: 5))
        XCTAssertFalse(MeetingInfoTestSupport.person(4, app: app).exists)
        XCTAssertTrue(app.staticTexts["meeting-info-header"].isHittable)
        ExperienceScreenshot.save("info-member-large-collapsed", test: self)
    }
}
