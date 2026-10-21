import Foundation
import Observation

@MainActor @Observable
final class MeetingSettingsOwner {
    let session: SessionStore
    let lease: PrivateData.Lease?
    var original: Meeting
    var value: MeetingDraft
    var saving = false
    var conflict = false
    var forbidden = false
    var problem: String?
    var saved: Meeting?
    var pending: Submission?
    @ObservationIgnored var generation = UUID()
    @ObservationIgnored var operation: Task<Void, Never>?

    struct Submission: Sendable {
        let input: UpdateMeeting
        let key: UUID
    }

    init(meeting: Meeting, session: SessionStore) {
        original = meeting
        value = MeetingSettingsDraft.make(meeting)
        self.session = session
        lease = try? session.privateData.lease(for: meeting.id)
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    var editable: Bool { current && !saving && pending == nil && !conflict && !forbidden }
    var dirty: Bool { value != MeetingSettingsDraft.make(original) }
    var needsTimeChoice: Bool {
        do {
            _ = try MeetingSettingsDraft.patch(value, from: original)
            return false
        } catch { return error as? DraftIssue == .ambiguous }
    }
    func change(_ change: (inout MeetingDraft) -> Void) {
        guard editable else { return }
        change(&value)
        problem = nil
    }
    func save() {
        guard current, !saving, !conflict, !forbidden else { return }
        operation = Task { await submit() }
    }
    func submit() async {
        guard current, !saving, !conflict, !forbidden, dirty || pending != nil else { return }
        let version = generation
        saving = true
        problem = nil
        defer { if version == generation { saving = false } }
        do {
            if pending == nil {
                pending = Submission(
                    input: try MeetingSettingsDraft.patch(value, from: original), key: UUID())
            }
            guard let pending else { return }
            let result = try await session.send(
                MeetingRequests.update(original.id, input: pending.input, key: pending.key),
                as: Meeting.self)
            try Task.checkCancellation()
            guard current, generation == version else { return }
            guard result.id == original.id else { throw ClientFailure.invalidResponse }
            var resource = ResourceState<Meeting>()
            let token = resource.begin()
            resource.succeed(result, requestID: token)
            session.privateData.details[result.id] = resource
            self.pending = nil
            saved = result
            await MeetingRepository(session: session).loadMeetings()
        } catch {
            guard current, generation == version, !(error is CancellationError) else { return }
            if let issue = error as? DraftIssue {
                pending = nil
                problem = issue.text
            } else if (error as? ClientFailure)?.statusCode == 409 {
                pending = nil
                conflict = true
                problem =
                    "Встречу уже изменили. Загрузите актуальные настройки, затем внесите правку снова."
            } else if (error as? ClientFailure)?.statusCode == 403 {
                pending = nil
                forbidden = true
                problem = "Менять настройки может только организатор."
            } else if [400, 404, 422].contains((error as? ClientFailure)?.statusCode ?? 0) {
                pending = nil
                problem = "Не удалось сохранить настройки. Проверьте поля и попробуйте ещё раз."
            } else {
                problem = "Сохранение не подтверждено. Повторите запрос с теми же настройками."
            }
        }
    }
    func reload() async {
        guard current, !saving else { return }
        let version = generation
        saving = true
        defer { if generation == version { saving = false } }
        do {
            let meeting = try await session.send(
                MeetingRequests.details(original.id), as: Meeting.self)
            try Task.checkCancellation()
            guard current, generation == version, meeting.id == original.id else { return }
            original = meeting
            value = MeetingSettingsDraft.make(meeting)
            pending = nil
            conflict = false
            forbidden = meeting.organizerID != session.profile?.id
            problem = forbidden ? "Менять настройки может только организатор." : nil
        } catch {
            if current, generation == version, !(error is CancellationError) {
                problem = "Не удалось загрузить настройки. Введённые данные сохранены в форме."
            }
        }
    }
    func suspend() {
        generation = UUID()
        operation?.cancel()
        operation = nil
        saving = false
    }
}
