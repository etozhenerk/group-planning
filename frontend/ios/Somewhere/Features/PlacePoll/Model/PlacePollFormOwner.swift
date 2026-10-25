import Foundation
import Observation

@MainActor @Observable
final class PlacePollFormOwner {
    let meeting: Meeting
    let operation: PlacePollOwner
    var place = ""
    var explanation = ""
    var deadline = Date().addingTimeInterval(86_400)

    init(meeting: Meeting, session: SessionStore) {
        self.meeting = meeting
        operation = PlacePollOwner(meetingID: meeting.id, session: session)
    }

    func submit() async -> Bool {
        if operation.pending != nil {
            await operation.retry()
        } else {
            let trimmed = place.trimmingCharacters(in: .whitespacesAndNewlines)
            guard (1...500).contains(trimmed.unicodeScalars.count) else {
                operation.problem = "Введите новое место: от 1 до 500 символов."
                return false
            }
            guard
                explanation.trimmingCharacters(in: .whitespacesAndNewlines).unicodeScalars.count
                    <= 2000
            else {
                operation.problem = "Сократите пояснение до 2000 символов."
                return false
            }
            guard trimmed != meeting.place else {
                operation.problem = "Предложите другое место."
                return false
            }
            guard deadline > Date() else {
                operation.problem = "Выберите время окончания позже текущего."
                return false
            }
            do {
                await operation.submit(
                    try PlacePollRequests.create(
                        meeting.id, place: trimmed, deadline: deadline, explanation: explanation))
            } catch { operation.problem = "Не удалось подготовить опрос." }
        }
        return operation.current && operation.poll != nil
    }

    func clear() {
        operation.clear()
        place = ""
        explanation = ""
        deadline = Date()
    }
}
