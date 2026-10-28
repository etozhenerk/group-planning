import Foundation

// Controlled transport faults belong only to SomewhereUITestHost. Successful
// responses still come from the real fixture API; no application state is injected.
enum FixtureResponseGate {
    private struct Rule: Decodable {
        let path: String
        let queryName: String?
        let mode: String
        let method: String?
    }

    static func before(_ request: URLRequest) async throws {
        guard let (rule, root) = try matchingRule(request) else { return }
        if rule.mode == "hold-before" {
            try Data("waiting".utf8).write(
                to: root.appendingPathComponent("requested"), options: .atomic)
            while FileManager.default.fileExists(
                atPath: root.appendingPathComponent("rule.json").path)
            {
                try await Task.sleep(for: .milliseconds(50))
            }
            return
        }
        guard rule.mode == "offline" else { return }
        try Data("offline".utf8).write(
            to: root.appendingPathComponent("requested"), options: .atomic)
        throw URLError(.notConnectedToInternet)
    }

    static func apply(
        _ result: (Data, HTTPURLResponse), to request: URLRequest
    ) async throws -> (Data, HTTPURLResponse) {
        guard let (rule, root) = try matchingRule(request), let url = request.url else {
            return result
        }
        let ruleFile = root.appendingPathComponent("rule.json")
        try Data(String(result.1.statusCode).utf8).write(
            to: root.appendingPathComponent("requested"), options: .atomic)
        switch rule.mode {
        case "hold":
            while FileManager.default.fileExists(atPath: ruleFile.path) {
                try await Task.sleep(for: .milliseconds(50))
            }
            return result
        case "unavailable":
            guard
                let response = HTTPURLResponse(
                    url: url, statusCode: 503, httpVersion: nil, headerFields: nil)
            else { throw URLError(.badServerResponse) }
            return (Data("Controlled test outage".utf8), response)
        default:
            throw URLError(.badServerResponse)
        }
    }

    private static func matchingRule(_ request: URLRequest) throws -> (Rule, URL)? {
        guard let directory = ProcessInfo.processInfo.environment["SOMEWHERE_UI_RESPONSE_GATE"],
            let url = request.url, url.scheme == "https", url.host == "127.0.0.1"
        else { return nil }
        let root = URL(fileURLWithPath: directory, isDirectory: true)
        let file = root.appendingPathComponent("rule.json")
        guard FileManager.default.fileExists(atPath: file.path) else { return nil }
        let rule = try JSONDecoder().decode(Rule.self, from: Data(contentsOf: file))
        guard url.path == rule.path, request.httpMethod == (rule.method ?? "GET") else {
            return nil
        }
        if let name = rule.queryName,
            URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?
                .contains(where: { $0.name == name }) != true
        {
            return nil
        }
        return (rule, root)
    }
}
