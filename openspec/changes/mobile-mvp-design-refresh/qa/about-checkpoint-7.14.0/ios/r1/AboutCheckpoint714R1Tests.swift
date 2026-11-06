import Foundation
import XCTest

@MainActor final class AboutCheckpoint714R1Tests: XCTestCase {
    let output = URL(fileURLWithPath:"/private/tmp/about-checkpoint714-r1-independent-captures")
    override func setUpWithError() throws { continueAfterFailure=false;try FileManager.default.createDirectory(at:output,withIntermediateDirectories:true) }
    func record(_ name:String,_ facts:[String:Any]) throws {try JSONSerialization.data(withJSONObject:facts,options:[.prettyPrinted,.sortedKeys]).write(to:output.appendingPathComponent(name+".json"))}
    func capture(_ name:String,_ app:XCUIApplication) throws {
        try app.debugDescription.write(to:output.appendingPathComponent(name+".ax.txt"),atomically:true,encoding:.utf8)
        ExperienceScreenshot.save("about714r1-"+name,test:self)
        let file=FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/about714r1-"+name+".json")
        try Data(contentsOf:file).write(to:output.appendingPathComponent(name+".environment.json"))
    }
    func settled(_ name:String,_ app:XCUIApplication,_ e:XCUIElement,_ anchors:[String:XCUIElement]=[:]) async throws {
        _=try await SettledGeometry.captureThenMeasure(app:app,target:e,anchors:anchors,recordURL:output.appendingPathComponent(name+".geometry.json"),capture:{try self.capture(name,app)})
    }
    func link(_ title:String,_ app:XCUIApplication) { let l=app.buttons[title];ChatSheetTestSupport.reveal(l,in:app.scrollViews["profile-screen"],app:app);l.tap() }
    func testAboutAndDocumentHistory() async throws {
        let app=XCUIApplication();app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"]="1"
        defer {app.terminate()}
        _=ChatSheetTestSupport.launch(application:app);app.buttons["home-tab-person.crop.circle"].tap()
        link("О приложении",app)
        let page=app.scrollViews["service-information-scroll"]
        XCTAssertTrue(page.waitForExistence(timeout:5))
        try await settled("about-normal",app,page)
        XCTAssertEqual(app.staticTexts.matching(identifier:"somewhere").count,1)
        XCTAssertTrue(app.staticTexts["0.1.0"].exists)
        XCTAssertTrue(app.staticTexts["1"].exists)
        XCTAssertEqual(app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@","Developed by")).count,1)
        XCTAssertFalse(app.buttons["Сообщить о проблеме"].isHittable)
        XCTAssertFalse(app.buttons["Конфиденциальность"].isHittable)
        app.buttons["Назад"].tap()
        link("Конфиденциальность",app)
        let toc=app.buttons["document-index-trigger"],back=app.buttons["Назад"]
        XCTAssertTrue(toc.waitForExistence(timeout:5));XCTAssertTrue(app.staticTexts["Проект документа"].exists)
        try await settled("privacy-top",app,page,["toc":toc,"back":back])
        let barY=toc.frame.minY
        page.swipeUp(velocity:.slow)
        let anchor=app.staticTexts["Кто получает доступ"]
        ChatSheetTestSupport.reveal(anchor,in:page,app:app)
        try await settled("privacy-reading",app,anchor,["toc":toc,"back":back])
        let beforeCancel=anchor.frame.minY
        toc.tap();let index=app.scrollViews["document-index-scroll"]
        XCTAssertTrue(index.waitForExistence(timeout:5))
        try await settled("toc-open",app,index)
        index.swipeDown(velocity:.slow)
        let gone=index.waitForNonExistence(timeout:5)
        try await settled("toc-cancel",app,anchor,["toc":toc,"back":back])
        try record("toc-cancel-facts",["dismissed":gone,"beforeAnchorY":beforeCancel,"afterAnchorY":anchor.frame.minY,"barBeforeY":barY,"barAfterY":toc.frame.minY])
        XCTAssertTrue(gone);XCTAssertEqual(anchor.frame.minY,beforeCancel,accuracy:1);XCTAssertEqual(toc.frame.minY,barY,accuracy:0.5)
        toc.tap();XCTAssertTrue(index.waitForExistence(timeout:5))
        let choice=app.buttons["Хранение и ваши права"]
        ChatSheetTestSupport.reveal(choice,in:index,app:app);choice.tap()
        XCTAssertTrue(index.waitForNonExistence(timeout:5))
        let last=app.staticTexts["Хранение и ваши права"]
        try await settled("toc-selected",app,last,["toc":toc,"back":back])
        XCTAssertGreaterThanOrEqual(last.frame.minY,page.frame.minY-1)
        let cross=app.buttons["Cookie и данные браузера"]
        ChatSheetTestSupport.reveal(cross,in:page,app:app)
        try await settled("privacy-crosslink",app,last,["toc":toc])
        let beforeCross=last.frame.minY
        cross.tap();XCTAssertTrue(app.staticTexts["Данные приложения iOS"].waitForExistence(timeout:5))
        try await settled("cookies-top",app,page,["toc":toc,"back":back])
        page.swipeUp(velocity:.slow)
        try await settled("cookies-reading",app,toc,["back":back])
        back.tap();XCTAssertTrue(last.waitForExistence(timeout:5))
        try await settled("crosslink-return",app,last,["toc":toc,"back":back])
        try record("crosslink-return-facts",["beforeY":beforeCross,"afterY":last.frame.minY,"delta":last.frame.minY-beforeCross])
        XCTAssertEqual(last.frame.minY,beforeCross,accuracy:1)
        back.tap();XCTAssertTrue(app.scrollViews["profile-screen"].waitForExistence(timeout:5))
        app.terminate()
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"]="320x568"
        _=ChatSheetTestSupport.launch(large:true,application:app);app.buttons["home-tab-person.crop.circle"].tap()
        link("Конфиденциальность",app);XCTAssertTrue(toc.waitForExistence(timeout:5))
        try await settled("privacy-compact-large",app,toc,["back":back,"body":page])
        XCTAssertTrue(toc.isHittable);XCTAssertTrue(back.isHittable)
        toc.tap();XCTAssertTrue(index.waitForExistence(timeout:5))
        try await settled("toc-compact-large",app,index)
    }
}
