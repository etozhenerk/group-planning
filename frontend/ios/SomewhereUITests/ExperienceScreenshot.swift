import UIKit
import XCTest

@MainActor
enum ExperienceScreenshot {
    private static var contextFile: URL?

    static func configure(_ app: XCUIApplication) {
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(
            "somewhere-ui-context-" + UUID().uuidString + ".json")
        contextFile = file
        app.launchEnvironment["SOMEWHERE_UI_CAPTURE_CONTEXT"] = file.path
    }

    static func reducedMotionEnabled() throws -> Bool {
        let file = try XCTUnwrap(contextFile, "Capture context must be configured before launch")
        let context = try XCTUnwrap(
            JSONSerialization.jsonObject(with: Data(contentsOf: file)) as? [String: Any])
        return try XCTUnwrap(context["reducedMotion"] as? Bool)
    }

    static func save(_ name: String, test: XCTestCase) {
        let settled = XCTestExpectation(description: "Presentation transition settled")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { settled.fulfill() }
        _ = XCTWaiter.wait(for: [settled], timeout: 1)
        let app = XCUIApplication()
        let screenshot = XCUIScreen.main.screenshot()
        let capturedAt = Date()
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
            let file = try XCTUnwrap(
                contextFile, "Capture context must be configured before launch")
            let environment = try JSONSerialization.jsonObject(with: Data(contentsOf: file))
            let metadata: [String: Any] = [
                "capturedAt": ISO8601DateFormatter().string(from: capturedAt),
                "appEnvironment": environment,
                "captureSurface": "screen",
                "appFrame": [
                    "x": app.frame.minX, "y": app.frame.minY,
                    "width": app.frame.width, "height": app.frame.height,
                ],
                "viewport": ["width": app.frame.width, "height": app.frame.height],
                "pixels": [
                    "width": screenshot.image.cgImage?.width ?? 0,
                    "height": screenshot.image.cgImage?.height ?? 0,
                ],
                "screenScale": app.frame.width > 0
                    ? CGFloat(screenshot.image.cgImage?.width ?? 0) / app.frame.width : 0,
                "imageScale": screenshot.image.scale,
            ]
            let data = try JSONSerialization.data(
                withJSONObject: metadata, options: [.prettyPrinted, .sortedKeys])
            let sidecar = folder.appendingPathComponent(name + ".json")
            try data.write(to: sidecar, options: .atomic)
            print("SOMEWHERE_CAPTURE_CONTEXT=" + sidecar.path)
        } catch {
            XCTFail("Не удалось сохранить снимок и измеренный контекст: \(error)")
        }
    }
}
