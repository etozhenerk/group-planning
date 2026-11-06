import Foundation
import XCTest

@MainActor final class AboutCheckpoint714R2Tests: XCTestCase {
    let output = URL(fileURLWithPath:"/private/tmp/about-checkpoint714-r2-independent-captures")
    override func setUpWithError() throws { continueAfterFailure=false;try FileManager.default.createDirectory(at:output,withIntermediateDirectories:true) }
    func record(_ name:String,_ facts:[String:Any]) throws {try JSONSerialization.data(withJSONObject:facts,options:[.prettyPrinted,.sortedKeys]).write(to:output.appendingPathComponent(name+".json"))}
    func capture(_ name:String,_ app:XCUIApplication) throws {
        try app.debugDescription.write(to:output.appendingPathComponent(name+".ax.txt"),atomically:true,encoding:.utf8)
        ExperienceScreenshot.save("about714r2-"+name,test:self)
        let file=FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/about714r2-"+name+".json")
        try Data(contentsOf:file).write(to:output.appendingPathComponent(name+".environment.json"))
    }
    func settled(_ name:String,_ app:XCUIApplication,_ e:XCUIElement,_ anchors:[String:XCUIElement]=[:]) async throws {
        _=try await SettledGeometry.captureThenMeasure(app:app,target:e,anchors:anchors,recordURL:output.appendingPathComponent(name+".geometry.json"),capture:{try self.capture(name,app)})
    }
    func link(_ title:String,_ app:XCUIApplication) { let l=app.buttons[title];ChatSheetTestSupport.reveal(l,in:app.scrollViews["profile-screen"],app:app);l.tap() }
    func testTypographyDeltaOnly() async throws {
        let app=XCUIApplication();app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"]="1"
        defer {app.terminate()}
        _=ChatSheetTestSupport.launch(application:app);app.buttons["home-tab-person.crop.circle"].tap()
        link("О приложении",app)
        let page=app.scrollViews["service-information-scroll"]
        XCTAssertTrue(page.waitForExistence(timeout:5))
        let description=app.staticTexts["Договориться о встрече, обсудить детали и сохранить её вайб."]
        try await settled("about-font14",app,description)
        XCTAssertTrue(description.isHittable)
        app.buttons["Назад"].tap();link("Конфиденциальность",app)
        let toc=app.buttons["document-index-trigger"]
        XCTAssertTrue(toc.waitForExistence(timeout:5))
        let heading=app.staticTexts["Кто отвечает за данные"]
        try await settled("document-font14",app,page,["toc":toc,"heading":heading])
        XCTAssertTrue(heading.isHittable)
        toc.tap();let index=app.scrollViews["document-index-scroll"]
        XCTAssertTrue(index.waitForExistence(timeout:5))
        try await settled("toc-font14",app,index)
        XCTAssertTrue(app.buttons["Кто отвечает за данные"].isHittable)
    }
}
