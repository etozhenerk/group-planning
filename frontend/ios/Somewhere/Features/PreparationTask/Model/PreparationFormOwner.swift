import Foundation
import Observation

@MainActor @Observable
final class PreparationFormOwner {
    let operation: PreparationTaskOwner
    var title = ""
    var recipient: UUID?
    var participants: [Participant]?
    var peopleLoading = false
    var peopleProblem: String?
    @ObservationIgnored private var version = UUID()

    init(meetingID: UUID, session: SessionStore) {
        operation = PreparationTaskOwner(meetingID: meetingID, session: session)
    }

    func loadParticipants() async {
        guard operation.current, !peopleLoading else { return }
        let stamp = version
        peopleLoading = true
        defer { if stamp == version { peopleLoading = false } }
        do {
            let value = try await operation.session.send(
                MeetingRequests.participants(operation.meetingID), as: Participants.self)
            try Task.checkCancellation()
            guard operation.current, stamp == version else { return }
            participants = value.participants.filter { $0.role == "organizer" || $0.rsvp == .going }
            peopleProblem = nil
        } catch {
            guard operation.current, stamp == version, !(error is CancellationError) else { return }
            peopleProblem = "Не удалось загрузить участников."
        }
    }

    func submit() async {
        if operation.pending != nil {
            await operation.retry()
            return
        }
        guard operation.editable, let participants, peopleProblem == nil else { return }
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...200).contains(trimmed.unicodeScalars.count) else {
            operation.problem = "Введите название задачи: от 1 до 200 символов."
            return
        }
        guard recipient == nil || participants.contains(where: { $0.user.id == recipient }) else {
            operation.problem = "Выберите участника из списка."
            return
        }
        do {
            await operation.submit(
                try PreparationTaskRequests.create(
                    operation.meetingID, title: trimmed, recipient: recipient))
            if operation.task == nil && operation.pending == nil { await loadParticipants() }
        } catch {
            operation.problem = "Не удалось подготовить задачу."
        }
    }

    func clear() {
        version = UUID()
        operation.clear()
        participants = nil
        title = ""
        recipient = nil
        peopleLoading = false
        peopleProblem = nil
    }
}
