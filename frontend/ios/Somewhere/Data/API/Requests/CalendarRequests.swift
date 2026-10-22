import Foundation

struct CalendarFilter: Equatable, Sendable {
    let period: MeetingPeriod
    var from: String?
    var to: String?

    func request(cursor: String? = nil) -> APIRequest {
        var query = [URLQueryItem(name: "period", value: period.rawValue)]
        if let from { query.append(URLQueryItem(name: "from", value: from)) }
        if let to { query.append(URLQueryItem(name: "to", value: to)) }
        if let cursor { query.append(URLQueryItem(name: "cursor", value: cursor)) }
        return APIRequest(path: ["meetings"], query: query)
    }
}
