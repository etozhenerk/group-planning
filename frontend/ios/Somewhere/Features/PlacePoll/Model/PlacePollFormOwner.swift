import Foundation
import Observation

@MainActor @Observable
final class PlacePollFormOwner {
    let meeting: Meeting
    let operation: PlacePollOwner
    var validationAttempt = 0
    private var originalDeadline = Date()
    var place = ""
    var explanation = ""
    var deadline = Date().addingTimeInterval(86_400)

    init(meeting: Meeting, session: SessionStore) {
        self.meeting = meeting
        operation = PlacePollOwner(meetingID: meeting.id, session: session)
        originalDeadline = deadline
    }

    var dirty: Bool { !place.isEmpty || !explanation.isEmpty || deadline != originalDeadline }
    var placeError: String? {
        guard validationAttempt > 0 else { return nil }
        let text = place.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.isEmpty { return "Укажите новое место" }
        if text.unicodeScalars.count > 500 { return "Сократите место до 500 символов" }
        return text == meeting.place ? "Предложите другое место" : nil
    }
    var explanationError: String? {
        validationAttempt > 0
            && explanation.trimmingCharacters(in: .whitespacesAndNewlines).unicodeScalars.count
                > 2000
            ? "Сократите пояснение до 2000 символов." : nil
    }
    var deadlineError: String? {
        validationAttempt > 0 && operation.pending == nil && deadline <= Date()
            ? "Выберите время окончания позже текущего." : nil
    }
    var hasFieldErrors: Bool {
        placeError != nil || explanationError != nil || deadlineError != nil
    }

    func submit() async -> Bool {
        if operation.pending != nil {
            await operation.retry()
        } else {
            validationAttempt += 1
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
