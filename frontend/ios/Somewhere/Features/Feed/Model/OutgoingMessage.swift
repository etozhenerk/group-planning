import Foundation

struct OutgoingMessage: Identifiable, Equatable {
    enum Status { case sending, uncertain, rejected }
    let id: UUID
    let text: String
    let createdAt: Date
    var status: Status
}
