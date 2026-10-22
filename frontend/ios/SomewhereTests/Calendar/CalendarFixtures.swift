import Foundation
import Testing

@testable import Somewhere

@MainActor
enum CalendarFixtures {
    static func page(
        ids: [UUID] = [], day: String? = "2026-10-24", period: String = "upcoming",
        total: Int? = nil, cursor: String? = nil,
        transition: String? = nil, asOf: String = "2026-10-22T12:00:00Z"
    ) throws -> Data {
        let meetings: [[String: Any]] = try ids.map { id in
            var value = try #require(
                JSONSerialization.jsonObject(with: APICoding.encode(Fixtures.meeting(id)))
                    as? [String: Any])
            value["local_date"] = day ?? NSNull() as Any
            value["period"] = period
            if day == nil { value["starts_at"] = NSNull() }
            return value
        }
        return try JSONSerialization.data(withJSONObject: [
            "meetings": meetings, "next_cursor": cursor ?? NSNull() as Any,
            "as_of": asOf,
            "counts": [
                "upcoming": period == "upcoming" ? total ?? ids.count : 0,
                "past": period == "past" ? total ?? ids.count : 0,
                "undated": period == "undated" ? total ?? ids.count : 0,
            ],
            "days": day.map { [["date": $0, "count": total ?? ids.count] as [String: Any]] } ?? [],
            "next_transition_at": transition ?? NSNull() as Any, "refresh_after_seconds": 5,
        ])
    }
}
