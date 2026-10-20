import Foundation

struct MessageRequest: Encodable, Sendable {
    let text: String
    let clientRequestID: UUID

    enum CodingKeys: String, CodingKey {
        case text
        case clientRequestID = "client_request_id"
    }

    func encode(to encoder: any Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(text, forKey: .text)
        try values.encode(clientRequestID.uuidString.lowercased(), forKey: .clientRequestID)
    }
}
