import Foundation
import XCTest

@MainActor
final class ResponseGate {
    private struct Rule: Encodable {
        let path: String
        let queryName: String?
        let mode: String
        let method: String
    }
    private let directory = FileManager.default.temporaryDirectory.appendingPathComponent(
        "somewhere-response-gate-" + UUID().uuidString, isDirectory: true)
    var requested: Bool {
        FileManager.default.fileExists(atPath: directory.appendingPathComponent("requested").path)
    }

    init(_ app: XCUIApplication, path: String, queryName: String? = nil, mode: String) throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try configure(path: path, queryName: queryName, mode: mode)
        app.launchEnvironment["SOMEWHERE_UI_RESPONSE_GATE"] = directory.path
    }

    func configure(path: String, queryName: String? = nil, mode: String, method: String = "GET")
        throws
    {
        let marker = directory.appendingPathComponent("requested")
        if FileManager.default.fileExists(atPath: marker.path) {
            try FileManager.default.removeItem(at: marker)
        }
        let rule = Rule(path: path, queryName: queryName, mode: mode, method: method)
        try JSONEncoder().encode(rule).write(
            to: directory.appendingPathComponent("rule.json"), options: .atomic)
    }

    func release() throws {
        let file = directory.appendingPathComponent("rule.json")
        if FileManager.default.fileExists(atPath: file.path) {
            try FileManager.default.removeItem(at: file)
        }
    }

    func cleanUp() throws { try FileManager.default.removeItem(at: directory) }
}
