import Foundation

extension InvitationOwner {
    func submit() async {
        guard current, authenticated, let session, let pending, !saving else { return }
        let version = generation
        saving = true
        responseProblem = nil
        defer { if generation == version { saving = false } }
        do {
            let request: APIRequest
            switch target {
            case .token(let token):
                request = try InvitationRequests.respond(
                    token, input: pending.input, key: pending.key)
            case .meeting(let id):
                request = try InvitationRequests.respond(
                    to: id, input: pending.input, key: pending.key)
            }
            let result = try await session.send(request, as: RSVPResult.self)
            try Task.checkCancellation()
            guard current, generation == version else { return }
            guard result.meetingID == preview?.meetingID else {
                throw ClientFailure.invalidResponse
            }
            answer = result.rsvp
            revision = result.rsvpRevision
            choice = answer
            self.pending = nil
            canAccess = false
            session.updateMeetingAccess(result.meetingID, allowed: result.canAccessFeed)
            if result.canAccessFeed { await loadPrivate(version: version) }
            guard current, generation == version else { return }
            await MeetingRepository(session: session).loadMeetings()
        } catch {
            guard current, generation == version, !(error is CancellationError) else { return }
            if (error as? ClientFailure)?.statusCode == 409 {
                self.pending = nil
                saving = false
                await load()
                responseProblem =
                    "Ответ уже изменился. Проверьте актуальные данные и выберите ответ снова."
            } else if let status = (error as? ClientFailure)?.statusCode,
                [400, 403, 404, 422].contains(status)
            {
                self.pending = nil
                responseProblem =
                    "Не удалось сохранить ответ. Обновите приглашение и попробуйте ещё раз."
            } else {
                responseProblem =
                    "Сохранение не подтверждено. Повторите запрос или проверьте текущий ответ."
            }
        }
    }
}
