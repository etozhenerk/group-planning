import Foundation

struct PendingMedia: Identifiable, Sendable {
    enum Stage: Equatable, Sendable { case ready, uploading, failed, published }
    let id: UUID
    let publishKey: UUID
    let name: String
    let contentType: String
    let data: Data
    var media: MeetingMedia?
    var stage: Stage = .ready
    var problem: String?
    var caption = ""
}
