import Foundation

extension InvitationOwner {
    // A successful withdrawal closes private access. Its preview must use the
    // invitation capability, never a private cover URL or a reopened meeting lease.
    func loadPublicPreview(version: UUID) async throws {
        guard current, generation == version else { return }
        let id: UUID
        switch target {
        case .meeting(let value, _): id = value
        case .token:
            guard let value = preview?.meetingID else { return }
            id = value
        }
        canAccess = false
        shareURL = nil
        problem = nil
        retainOnlyPublicCover()
        var token = publicToken
        if token == nil, answer == .maybe {
            token = try await savedInvitationToken(for: id, version: version)
            guard token != nil else { throw ClientFailure.invalidResponse }
        }
        guard current, generation == version else { return }
        // An ID-only NotGoing response does not grant an invitation token. Keep
        // its public metadata, but do not retain an inaccessible private image.
        guard let token else { return }
        let request = try InvitationRequests.preview(token)
        let value: InvitationPreview
        if authenticated, let session {
            value = try await session.send(request, as: InvitationPreview.self)
        } else {
            value = try await api.send(request, as: InvitationPreview.self)
        }
        try Task.checkCancellation()
        guard current, generation == version else { return }
        guard value.meetingID == id else { throw ClientFailure.invalidResponse }
        if let url = value.coverURL {
            let cover = try CoverRequests.read(url, meetingID: id, origin: api.origin)
            guard cover.meetingID == nil, cover.path == ["invitations", token, "cover"] else {
                throw ClientFailure.invalidResponse
            }
        }
        let updateAnswer = pending == nil && choice == answer
        preview = value
        publicToken = token
        problem = nil
        responseProblem = nil
        if updateAnswer {
            answer = value.myRSVP
            revision = value.myRSVPRevision
            choice = answer
        }
    }

    private func savedInvitationToken(for id: UUID, version: UUID) async throws -> String? {
        guard let session, authenticated else { throw ClientFailure.staleSession }
        var cursor: String?
        var seen = Set<String>()
        repeat {
            var query = [URLQueryItem(name: "limit", value: "50")]
            if let cursor { query.append(URLQueryItem(name: "cursor", value: cursor)) }
            let page = try await session.send(
                APIRequest(path: ["invitations"], query: query), as: InvitationsPage.self)
            try Task.checkCancellation()
            guard current, generation == version else { return nil }
            if let item = page.invitations.first(where: { $0.id == id }) {
                guard item.preview.myRSVP == .maybe,
                    let token = InvitationURL.token(
                        from: item.invitationURL, origin: api.origin, scheme: "")
                else { throw ClientFailure.invalidResponse }
                return token
            }
            guard let next = page.nextCursor else { return nil }
            guard let parsed = UUID(uuidString: next), parsed.uuidString.lowercased() == next,
                cursor.map({ next > $0 }) ?? true, seen.insert(next).inserted
            else { throw ClientFailure.invalidResponse }
            cursor = next
        } while true
    }

    private func retainOnlyPublicCover() {
        guard let value = preview else { return }
        var publicCover: URL?
        if let url = value.coverURL,
            let request = try? CoverRequests.read(
                url, meetingID: value.meetingID, origin: api.origin), request.meetingID == nil
        {
            publicCover = url
        }
        preview = InvitationPreview(
            meetingID: value.meetingID, title: value.title, description: value.description,
            startsAt: value.startsAt, timezone: value.timezone, place: value.place,
            coverURL: publicCover, myRSVP: answer, myRSVPRevision: revision,
            organizer: value.organizer, startsOn: value.startsOn,
            joinClosesAt: value.joinClosesAt, canJoin: value.canJoin,
            joinDisabledReason: value.joinDisabledReason)
    }
}
