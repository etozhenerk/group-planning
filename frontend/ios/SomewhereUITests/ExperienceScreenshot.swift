import XCTest

@MainActor
enum ExperienceScreenshot {
    static func save(_ name: String, test: XCTestCase) {
        let settled = XCTestExpectation(description: "Presentation transition settled")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { settled.fulfill() }
        _ = XCTWaiter.wait(for: [settled], timeout: 1)
        let screenshot = XCUIApplication().screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        test.add(attachment)
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(
            "somewhere-design-verification", isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let path = folder.appendingPathComponent(name + ".png")
            try screenshot.pngRepresentation.write(to: path, options: .atomic)
            print("SOMEWHERE_SCREENSHOT=" + path.path)
        } catch {
            XCTFail("Не удалось сохранить снимок: \(error)")
        }
    }
}
