import Foundation

struct APIProblem: Codable, Equatable, Sendable {
    let code: String
    let fieldErrors: [String: String]
    let requestID: UUID
    let currentResponse: RSVPSnapshot?
    let currentMeeting: Meeting?

    enum CodingKeys: String, CodingKey {
        case code
        case fieldErrors = "field_errors"
        case requestID = "request_id"
        case currentResponse = "current_response"
        case currentMeeting = "current_meeting"
    }
}
