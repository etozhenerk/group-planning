import Foundation
import XCTest
@MainActor final class Info716PreflightTests: XCTestCase {
 let out=URL(fileURLWithPath:"/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/mobile-mvp-design-refresh/qa/final/ios-info-7.16-preflight/actual")
 let meeting=MeetingInfoTestSupport.memberMeeting
 override func setUpWithError()throws {continueAfterFailure=false;try FileManager.default.createDirectory(at:out,withIntermediateDirectories:true)}
 func node(_ label:String,_ app:XCUIApplication)->XCUIElement {app.descendants(matching:.any).matching(NSPredicate(format:"label == %@",label)).firstMatch}
 func capture(_ name:String,_ app:XCUIApplication)throws {
  let target=app.scrollViews["meeting-info"];var previous=CGRect.zero,stable=0
  for _ in 0..<12 {let f=target.frame;if f==previous{stable+=1}else{stable=0};previous=f;if stable>=3{break};Thread.sleep(forTimeInterval:0.15)}
  ExperienceScreenshot.save("info716-"+name,test:self)
  let from=FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/info716-"+name)
  for ext in ["png","json"]{try Data(contentsOf:from.appendingPathExtension(ext)).write(to:out.appendingPathComponent(name).appendingPathExtension(ext))}
  try app.debugDescription.write(to:out.appendingPathComponent(name+".ax.txt"),atomically:true,encoding:.utf8)
 }
 func start(_ mode:String,_ suffix:String="")throws->(XCUIApplication,ResponseGate){
  let app=XCUIApplication(),gate=try ResponseGate(app,path:"/unused716",mode:mode)
  _=ChatSheetTestSupport.launch(application:app);ChatSheetTestSupport.openChat(app,id:meeting)
  Thread.sleep(forTimeInterval:0.6)
  try gate.configure(path:"/api/v1/meetings/"+meeting+suffix,mode:mode,method:"GET")
  app.buttons["meeting-info-open"].tap();XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout:5));return(app,gate)
 }
 func ready(_ app:XCUIApplication){XCTAssertTrue(app.buttons["meeting-change-answer"].waitForExistence(timeout:10))}
 func testADetailsLoadingAndReady()throws{
  let(app,gate)=try start("hold-before");defer{try?gate.cleanUp();app.terminate()}
  XCTAssertTrue(node("Загрузка встречи",app).waitForExistence(timeout:10));try capture("details-loading",app)
  XCTAssertFalse(app.buttons["meeting-change-answer"].exists);XCTAssertFalse(app.buttons["meeting-info-share"].exists)
  try gate.release();ready(app);try capture("details-ready",app)
 }
 func testBDetailsErrorAndRetry()throws{
  let(app,gate)=try start("unavailable");defer{try?gate.cleanUp();app.terminate()}
  XCTAssertTrue(app.staticTexts["Встреча не загрузилась"].waitForExistence(timeout:10));try capture("details-error",app)
  XCTAssertFalse(app.buttons["meeting-change-answer"].exists);XCTAssertFalse(app.buttons["meeting-info-share"].exists)
  try gate.release();app.buttons["Повторить загрузку"].tap();ready(app);try capture("details-retry-ready",app)
 }
 func testCRosterStatesRetryAndChildReturn()throws{
  let(app,gate)=try start("hold-before","/participants");defer{try?gate.cleanUp();app.terminate()};ready(app)
  XCTAssertTrue(node("Загрузка участников",app).waitForExistence(timeout:10));try capture("roster-loading",app)
  XCTAssertTrue(app.staticTexts["participant-count"].exists)
  try gate.release();let all=app.buttons["meeting-people-all"];XCTAssertTrue(all.waitForExistence(timeout:10))
  ChatSheetTestSupport.dismissBySwipe(app,headerIdentifier:"meeting-info-header")
  try gate.configure(path:"/api/v1/meetings/"+meeting+"/participants",mode:"unavailable",method:"GET")
  app.buttons["meeting-info-open"].tap();XCTAssertTrue(app.staticTexts["Не удалось получить ответы."].waitForExistence(timeout:10))
  try capture("roster-error",app);XCTAssertTrue(app.staticTexts["participant-count"].exists)
  let retry=app.buttons["Повторить"];MeetingInfoTestSupport.reveal(retry,app:app);try gate.release();retry.tap()
  XCTAssertTrue(all.waitForExistence(timeout:10));try capture("roster-ready-after-retry",app)
  MeetingInfoTestSupport.reveal(all,app:app);all.tap();let collapse=app.buttons["meeting-people-collapse"]
  MeetingInfoTestSupport.reveal(collapse,app:app);try capture("expanded-before-child",app);let before=collapse.frame.minY
  app.buttons["meeting-change-answer"].tap();let back=app.buttons["← К деталям встречи"]
  XCTAssertTrue(back.waitForExistence(timeout:5));back.tap();XCTAssertTrue(collapse.waitForExistence(timeout:5))
  try capture("expanded-after-child",app);XCTAssertEqual(collapse.frame.minY,before,accuracy:3)
  try JSONSerialization.data(withJSONObject:["beforeY":before,"afterY":collapse.frame.minY,"expandedRestored":collapse.exists],options:[.prettyPrinted]).write(to:out.appendingPathComponent("child-return.json"))
 }
}
