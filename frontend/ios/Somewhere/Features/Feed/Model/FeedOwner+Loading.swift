import Foundation

extension FeedOwner {
    func loadHistory() {
        guard !loadingHistory, historyTask == nil else { return }
        historyTask = Task {
            await history()
            historyTask = nil
        }
    }
    func reload() {
        guard !loading else { return }
        refreshTask = Task { await refresh() }
    }

    func refresh() async {
        if capabilities?.sync == true {
            await synchronize()
            return
        }
        guard current, !loading else { return }
        let version = generation
        loading = true
        problem = nil
        defer { if generation == version { loading = false } }
        do {
            var more: Bool
            repeat {
                let previous = cursor
                let page = try await session.send(
                    FeedRequests.page(id, after: cursor), as: FeedPage.self)
                try Task.checkCancellation()
                guard current, generation == version else { return }
                try merge(page.entries)
                if !loaded { hasHistory = page.hasMore }
                cursor = page.entries.last?.sequence ?? cursor ?? .zero
                more = loaded && page.hasMore
                loaded = true
                if more && (cursor == previous || page.entries.isEmpty) {
                    throw ClientFailure.invalidResponse
                }
                if page.meetingRevision != meeting?.revision {
                    await reloadDetails(version: version)
                }
                guard current, generation == version else { return }
            } while more
            trimWindow()
            await reactions.refresh()
            if infoPresented { await MeetingRepository(session: session).loadParticipants(id) }
            if !current { clear() }
        } catch { failed(error, version: version) }
    }

    func history() async {
        guard current, hasHistory, !loadingHistory, let first = records.first?.sequence else {
            return
        }
        let version = generation
        loadingHistory = true
        historyProblem = nil
        defer { if generation == version { loadingHistory = false } }
        do {
            let page = try await session.send(
                FeedRequests.page(id, before: first), as: FeedPage.self)
            try Task.checkCancellation()
            guard current, generation == version else { return }
            guard page.entries.allSatisfy({ $0.sequence < first }),
                !page.hasMore || !page.entries.isEmpty
            else { throw ClientFailure.invalidResponse }
            try merge(page.entries)
            hasHistory = page.hasMore
            trimWindow(prepending: true)
        } catch {
            if !current || (error as? ClientFailure)?.statusCode == 404 {
                failed(error, version: version)
            }
            if current, generation == version, !(error is CancellationError) {
                historyProblem = "Не удалось загрузить сообщения"
            }
        }
    }

    func reloadDetails(version: UUID) async {
        await MeetingRepository(session: session).loadMeeting(id)
        guard current, generation == version, let meeting else { return }
        invitation.preview = meeting.invitationPreview
        if !invitation.saving, invitation.pending == nil, invitation.choice == invitation.answer {
            invitation.answer = meeting.myRSVP
            invitation.choice = meeting.myRSVP
            invitation.revision = meeting.myRSVPRevision
        }
        invitation.organizer = meeting.organizerID == session.profile?.id
        if !invitation.organizer && meeting.myRSVP != .going {
            session.updateMeetingAccess(id, allowed: false)
            clear()
        }
    }

    func openInfo() async {
        await MeetingRepository(session: session).loadParticipants(id)
        if !current { clear() }
    }
}
