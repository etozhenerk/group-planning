import Foundation

extension InvitationOwner {
    func load() async {
        guard current, !saving else { return }
        let version = UUID()
        generation = version
        loading = true
        unavailable = false
        problem = nil
        defer { if generation == version { loading = false } }
        do {
            switch target {
            case .token(let token):
                let request = try InvitationRequests.preview(token)
                let value: InvitationPreview
                if authenticated, let session {
                    value = try await session.send(request, as: InvitationPreview.self)
                } else {
                    value = try await api.send(request, as: InvitationPreview.self)
                }
                try Task.checkCancellation()
                guard current, generation == version else { return }
                preview = value
                answer = value.myRSVP
                revision = value.myRSVPRevision
                choice = answer
                pending = nil
                responseProblem = nil
                if answer != .going && !organizer { canAccess = false }
                if authenticated { await loadPrivate(version: version) }
            case .meeting:
                guard authenticated else { throw ClientFailure.http(401, nil) }
                await loadPrivate(version: version)
            }
        } catch {
            guard current, generation == version, !(error is CancellationError) else { return }
            unavailable = (error as? ClientFailure)?.statusCode == 404
            if unavailable {
                preview = nil
                answer = nil
                choice = nil
                canAccess = false
                organizer = false
                shareURL = nil
            }
            problem = unavailable ? "Приглашение недоступно" : "Не удалось открыть приглашение"
        }
    }

    func loadPrivate(version: UUID) async {
        guard let session, current else { return }
        let id: UUID
        switch target {
        case .meeting(let value): id = value
        case .token:
            guard let value = preview?.meetingID else { return }
            id = value
        }
        if answer == .going || session.privateData.details[id]?.value?.organizerID == userID {
            session.updateMeetingAccess(id, allowed: true)
        }
        do {
            let meeting = try await session.send(MeetingRequests.details(id), as: Meeting.self)
            try Task.checkCancellation()
            guard current, generation == version, meeting.id == id else { return }
            organizer = meeting.organizerID == userID
            answer = meeting.myRSVP
            revision = meeting.myRSVPRevision
            choice = answer
            pending = nil
            preview = InvitationPreview(
                meetingID: id, title: meeting.title, description: meeting.description,
                startsAt: meeting.startsAt, timezone: meeting.timezone, place: meeting.place,
                coverURL: meeting.coverURL, myRSVP: answer, myRSVPRevision: revision)
            canAccess = organizer || answer == .going
            guard canAccess else {
                session.updateMeetingAccess(id, allowed: false)
                return
            }
            var resource = ResourceState<Meeting>()
            let request = resource.begin()
            resource.succeed(meeting, requestID: request)
            session.privateData.details[id] = resource
            await MeetingRepository(session: session).loadParticipants(id)
            guard current, generation == version, !session.privateData.denied.contains(id) else {
                canAccess = false
                return
            }
            await MeetingRepository(session: session).loadFeed(id)
            guard current, generation == version, !session.privateData.denied.contains(id) else {
                canAccess = false
                return
            }
            if organizer { await loadShare(id: id, version: version) }
        } catch {
            guard current, generation == version, !(error is CancellationError) else { return }
            let status = (error as? ClientFailure)?.statusCode
            if status == 404 {
                canAccess = false
                organizer = false
                shareURL = nil
                preview = nil
                unavailable = true
                problem = "Встреча недоступна"
                session.updateMeetingAccess(id, allowed: false)
            } else if status == 403 || error as? ClientFailure == .accessRevoked {
                session.updateMeetingAccess(id, allowed: false)
                if case .meeting = target {
                    problem = "Доступ к встрече изменился. Откройте исходное приглашение."
                }
            } else {
                responseProblem = "Не удалось обновить данные встречи. Попробуйте ещё раз."
            }
        }
    }

    func loadShare(id: UUID, version: UUID) async {
        shareProblem = false
        do {
            guard let session else { return }
            let value = try await session.send(
                MeetingRequests.invitation(id), as: InvitationLink.self)
            guard current, generation == version else { return }
            guard value.invitationURL.scheme == "https",
                InvitationURL.token(from: value.invitationURL, origin: api.origin, scheme: "")
                    != nil
            else { throw ClientFailure.invalidResponse }
            shareURL = value.invitationURL
        } catch {
            if current, generation == version, !(error is CancellationError) { shareProblem = true }
        }
    }
}
