import UIKit
import XCTest

@MainActor
final class MeetingInfoUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws {
        if !name.contains("testMixedResponsesAndSecondParticipantUpdateKeepMeetingOnlyContent") {
            ChatSheetTestSupport.recordFailure(self)
        }
    }

    func testMixedResponsesAndSecondParticipantUpdateKeepMeetingOnlyContent() async throws {
        let first = try NativeChatCounterpart(actor: "review-reader-1")
        let second = try NativeChatCounterpart(actor: "review-reader-2")
        let changed = try NativeChatCounterpart(actor: "review-reader-4")
        addTeardownBlock { @MainActor in
            try await changed.answer("going")
            try await second.answer("going")
            try await first.answer("going")
        }
        for index in 1...20 {
            _ = try await changed.send(
                "История \(index)\nДля проверки положения при открытии состава")
        }
        try await first.answer("maybe")
        try await second.answer("not_going")
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let draft = app.textViews["message-input"]
        draft.tap()
        draft.typeText("Состав не меняет черновик")
        app.buttons["meeting-add"].tap()
        app.buttons["meeting-add"].tap()
        let anchor = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS %@", "Я принесу настолки.")
        ).firstMatch
        ChatSheetTestSupport.revealInConversation(anchor, app: app)
        let anchorY = anchor.frame.minY
        MeetingInfoTestSupport.open(app)
        let summary = app.buttons["meeting-people-summary"]
        XCTAssertEqual(summary.label, "Компания, 4 участника")
        for label in [
            "Помощь", "Сообщить о проблеме", "Предложить идею", "О приложении",
            "Политика конфиденциальности", "Cookie и хранение",
        ] {
            XCTAssertFalse(app.buttons[label].exists)
        }
        ExperienceScreenshot.save("info-current-four-mixed-responses", test: self)
        summary.tap()
        for index in 1...6 {
            let person = MeetingInfoTestSupport.person(index, app: app)
            MeetingInfoTestSupport.reveal(person, app: app)
            XCTAssertFalse(person.label.contains("sasha@example.com"))
        }
        XCTAssertTrue(MeetingInfoTestSupport.person(1, app: app).label.contains("Возможно"))
        XCTAssertTrue(MeetingInfoTestSupport.person(2, app: app).label.contains("Не смогу"))
        let collapse = app.buttons["meeting-people-collapse"]
        MeetingInfoTestSupport.reveal(collapse, app: app)
        collapse.tap()
        XCTAssertEqual(summary.label, "Компания, 4 участника")
        try await changed.answer("maybe")
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "meeting-info-header")
        MeetingInfoTestSupport.open(app)
        let refreshed = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label == %@", "Компания, 3 участника"), object: summary)
        let result = await XCTWaiter.fulfillment(of: [refreshed], timeout: 10)
        XCTAssertEqual(result, .completed)
        summary.tap()
        XCTAssertTrue(MeetingInfoTestSupport.person(4, app: app).label.contains("Возможно"))
        for index in 1...6 { XCTAssertTrue(MeetingInfoTestSupport.person(index, app: app).exists) }
        ExperienceScreenshot.save("info-current-three-full-six", test: self)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "meeting-info-header")
        XCTAssertEqual(draft.value as? String, "Состав не меняет черновик")
        XCTAssertEqual(anchor.frame.minY, anchorY, accuracy: 2)
    }

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
        let collapse = app.buttons["meeting-people-collapse"]
        MeetingInfoTestSupport.reveal(collapse, app: app)
        collapse.tap()
        XCTAssertTrue(app.buttons["meeting-people-summary"].waitForExistence(timeout: 5))
        XCTAssertTrue(going.isSelected)
        app.buttons["meeting-people-summary"].tap()
        let maybe = app.buttons["rsvp-maybe"]
        MeetingInfoTestSupport.reveal(maybe, app: app)
        ExperienceScreenshot.save("info-member-expanded-response", test: self)
        maybe.tap()
        let card = app.buttons["saved-invitation-" + MeetingInfoTestSupport.memberMeeting]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["message-send"].exists)
        XCTAssertFalse(app.staticTexts["meeting-info-header"].exists)
        ExperienceScreenshot.save("info-member-saved-rsvp", test: self)
        card.tap()
        XCTAssertTrue(app.buttons["rsvp-maybe"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["rsvp-maybe"].isSelected)
        app.buttons["rsvp-going"].tap()
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
