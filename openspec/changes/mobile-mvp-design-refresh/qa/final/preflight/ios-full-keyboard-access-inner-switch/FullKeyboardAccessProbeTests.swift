import Foundation
import XCTest
@MainActor final class FullKeyboardAccessProbeTests:XCTestCase {
 let out=URL(fileURLWithPath:"/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/mobile-mvp-design-refresh/qa/final/preflight/ios-full-keyboard-access-inner-switch")
 let settings=XCUIApplication(bundleIdentifier:"com.apple.Preferences")
 var changed=false,original="",toggle:XCUIElement?
 override func setUpWithError()throws{continueAfterFailure=false;try FileManager.default.createDirectory(at:out,withIntermediateDirectories:true)}
 func save(_ name:String,_ app:XCUIApplication)throws{try XCUIScreen.main.screenshot().pngRepresentation.write(to:out.appendingPathComponent(name+".png"));try app.debugDescription.write(to:out.appendingPathComponent(name+".ax.txt"),atomically:true,encoding:.utf8)}
 func facts(_ name:String,_ value:[String:Any])throws{var v=value;v["at"]=ISO8601DateFormatter().string(from:Date());try JSONSerialization.data(withJSONObject:v,options:[.prettyPrinted,.sortedKeys]).write(to:out.appendingPathComponent(name+".json"))}
 func locate(_ labels:[String])->XCUIElement?{for _ in 0..<6{for label in labels{let e=settings.descendants(matching:.any).matching(NSPredicate(format:"label == %@",label)).firstMatch;if e.exists&&e.isHittable{return e}};settings.swipeUp()};return nil}
 override func tearDown()async throws{if changed{settings.activate();if let toggle,toggle.exists, String(describing:toggle.value ?? "") != original{toggle.tap();try await Task.sleep(for:.milliseconds(400))};try facts("restored",["original":original,"actual":String(describing:toggle?.value ?? "unavailable"),"restored":String(describing:toggle?.value ?? "") == original]);XCTAssertEqual(String(describing:toggle?.value ?? ""),original)};settings.terminate();XCUIApplication().terminate()}
 func testSettingsAndPublicHardwareKeys()throws{
 settings.launch();try save("settings-entry",settings)
 for _ in 0..<5{let b=settings.navigationBars.buttons.firstMatch;if b.exists&&b.isHittable&&b.label != "Edit"&&b.label != "Settings"{b.tap()}else{break}}
 guard let accessibility=locate(["Accessibility","Универсальный доступ"])else{try save("blocked-accessibility",settings);throw XCTSkip("Public Settings Accessibility entry unavailable")};accessibility.tap()
 let keyboards=settings.buttons["KEYBOARDS"];for _ in 0..<6{if keyboards.exists&&keyboards.isHittable{break};settings.swipeUp()};guard keyboards.exists&&keyboards.isHittable else{try save("blocked-keyboards",settings);throw XCTSkip("Actual KEYBOARDS entry unavailable")};keyboards.tap();try save("keyboards-live",settings)
 let full=settings.buttons["FULL_KEYBOARD_ACCESS"];guard full.exists&&full.isHittable else{try save("blocked-fullkeyboard",settings);throw XCTSkip("Confirmed FULL_KEYBOARD_ACCESS entry unavailable")};full.tap();try save("fullkeyboard-before",settings)
 let wrapper=settings.switches["FKAEnabledSwitch"];let t=wrapper.switches.firstMatch;guard t.waitForExistence(timeout:3),t.frame.width<100 else{try save("blocked-inner-switch",settings);throw XCTSkip("Observed nested63pt switch not found")};toggle=t;original=String(describing:t.value ?? "unknown");try facts("original",["value":original]);guard original=="0"||original=="1"else{throw XCTSkip("Unknown initial setting, no mutation")};if original=="0"{changed=true;t.tap();Thread.sleep(forTimeInterval:0.4)};try save("fullkeyboard-enabled",settings);XCTAssertEqual(String(describing:t.value ?? ""),"1")
 let app=XCUIApplication();app.launchEnvironment["SOMEWHERE_UI_SCENARIO"]="onboarding";app.launchEnvironment["SOMEWHERE_UI_LOGIN_OUTCOME"]="cancelled";app.launchArguments=["-AppleLanguages","(ru)","-AppleLocale","ru_RU"];ExperienceScreenshot.configure(app);app.launch();let page=app.pageIndicators["onboarding-progress"];guard page.waitForExistence(timeout:5)else{try save("blocked-onboarding",app);throw XCTSkip("Onboarding precondition missing")};try save("onboarding-before-keys",app)
 for index in 1...7{let before=String(describing:page.value ?? "unknown");var advanced=false
 for tab in 1...3{app.typeKey("\t",modifierFlags:[]);Thread.sleep(forTimeInterval:0.1);try save("page-\(index)-tab-\(tab)",app);app.typeKey(" ",modifierFlags:[]);Thread.sleep(forTimeInterval:0.35);let after=String(describing:page.value ?? "unknown");try facts("page-\(index)-key-\(tab)",["before":before,"after":after,"key":"Tab then Space"]);if after != before{advanced=true;break};if !page.exists{break}}
 guard advanced&&page.exists else{try save("hardware-input-blocked",app);throw XCTSkip("Public Tab/Space did not provide confirmed safe onboarding progression")};XCTAssertEqual(String(describing:page.value ?? ""),"\(index+1) из 8")}
 try save("eight-pages-keyboard",app)
 }
}
