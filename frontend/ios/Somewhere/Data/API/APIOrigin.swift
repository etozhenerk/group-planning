import Foundation

struct APIOrigin: Equatable, Sendable {
    let url: URL

    init(_ url: URL) throws {
        guard url.scheme == "https", let host = url.host, !host.isEmpty,
            url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
            url.path.isEmpty || url.path == "/",
            let normalized = URLComponents(url: url, resolvingAgainstBaseURL: false)
        else { throw ClientFailure.invalidOrigin }
        var components = normalized
        components.path = ""
        guard let origin = components.url else { throw ClientFailure.invalidOrigin }
        self.url = origin
    }

    func url(for request: APIRequest) throws -> URL {
        guard request.path.allSatisfy(APIRequest.isPathComponent),
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        else { throw ClientFailure.invalidRequest }
        components.path = "/api/v1/" + request.path.joined(separator: "/")
        components.queryItems = request.query.isEmpty ? nil : request.query
        guard let result = components.url else { throw ClientFailure.invalidRequest }
        return result
    }
}
