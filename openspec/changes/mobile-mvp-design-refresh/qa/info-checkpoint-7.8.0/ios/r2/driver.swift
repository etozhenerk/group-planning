import Foundation
import XCTest

@MainActor
final class InfoR2TargetedTests: XCTestCase {
    private let output = "/private/tmp/info-checkpoint78-r2-independent-captures"
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
        ExperienceScreenshot.save("info78r2-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/info78r2-" + name + ".json")
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
    func testANormalCoverCompanyAndConsecutiveResponses() async throws {
        let (app, _) = try launch(member)
        wait(app.images["meeting-cover"])
        XCTAssertFalse(app.descendants(matching: .any)["cover-unavailable"].firstMatch.exists)
        try capture("normal-real-cover", app)
        reveal(app.buttons["meeting-people-summary"], app)
        try capture("normal-company", app)
        app.buttons["meeting-change-answer"].tap()
        wait(app.buttons["rsvp-going"])
        app.buttons["rsvp-going"].tap()
        wait(app.staticTexts["meeting-info-header"], "exists == false")
        wait(app.buttons["meeting-info-open"])
        let api = try NativeChatCounterpart(actor: "design", meeting: member)
        let going = try await api.request("meetings/" + member)
        XCTAssertEqual(going["my_rsvp"] as? String, "going")
        try JSONSerialization.data(withJSONObject: going, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/going-api.json"))
        try capture("going-canonical-chat", app)
        app.buttons["meeting-info-open"].tap()
        wait(app.staticTexts["meeting-info-header"])
        app.buttons["meeting-change-answer"].tap()
        wait(app.buttons["rsvp-maybe"])
        app.buttons["rsvp-maybe"].tap()
        wait(app.buttons["saved-invitation-" + member])
        XCTAssertFalse(app.staticTexts["meeting-info-header"].exists)
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        let invites = try await api.request("invitations")
        let items = invites["invitations"] as? [[String: Any]] ?? []
        let preview = try XCTUnwrap(items.compactMap { $0["preview"] as? [String: Any] }.first { $0["meeting_id"] as? String == member })
        XCTAssertEqual(preview["my_rsvp"] as? String, "maybe")
        try JSONSerialization.data(withJSONObject: invites, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/maybe-api.json"))
        try capture("consecutive-maybe-canonical-invitations", app)
        app.terminate()
    }
    func testBCompanyNarrowLayoutOnly() throws {
        let (app, _) = try launch(organizer, narrow: true)
        wait(app.images["meeting-cover"])
        reveal(app.buttons["meeting-people-summary"], app)
        XCTAssertTrue(app.buttons["meeting-info-share"].isHittable)
        try capture("narrow-company-layout", app)
        app.terminate()
    }
}
