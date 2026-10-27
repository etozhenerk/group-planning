import XCTest
import Foundation
@MainActor
final class IndependentEscapeReview: XCTestCase {
 func testEscapeFromExistingDock() throws {
  continueAfterFailure = true
  let app = XCUIApplication(bundleIdentifier: "dev.groupplanning.ios.uitesthost")
  app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "design"
  app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
  app.launch()
  let card = app.buttons["meeting-card-cea00000-0000-4000-8000-000000000001"]
  XCTAssertTrue(card.waitForExistence(timeout:20))
  card.tap()
  XCTAssertTrue(app.buttons["composer-emoji-toggle"].waitForExistence(timeout:10))
  let search = app.textFields["emoji-search"]
  if !search.exists { app.buttons["composer-emoji-toggle"].tap() }
  XCTAssertTrue(search.waitForExistence(timeout:5))
  func capture(_ name:String) {
   let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)
   print("INDEPENDENT_STEP \(Date().timeIntervalSince1970) \(name)")
   print("INDEPENDENT_TREE " + app.debugDescription)
  }
  capture("ios-escape-repro-before")
  app.typeKey(.escape, modifierFlags: [])
  let gone = XCTNSPredicateExpectation(predicate:NSPredicate(format:"exists == false"),object:search)
  let result = XCTWaiter.wait(for:[gone],timeout:3)
  capture("ios-escape-repro-after-3s")
  XCTAssertEqual(result,.completed,"Escape must dismiss emoji dock")
  XCTAssertEqual(app.keyboards.count,0)
 }
}
