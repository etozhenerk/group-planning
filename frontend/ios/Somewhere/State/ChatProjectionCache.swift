import Foundation
import Observation

@MainActor @Observable
final class ChatProjectionCache {
    var datePolls: [UUID: DatePoll] = [:]
    var placePolls: [UUID: PlacePoll] = [:]
    var tasks: [UUID: PreparationTask] = [:]
}
