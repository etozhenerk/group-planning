import Foundation

extension FeedOwner {
    func synchronize() async {
        guard current else { return }
        if loading {
            syncRequested = true
            return
        }
        let version = generation
        loading = true
        problem = nil
        defer { if generation == version { loading = false } }
        do {
            repeat {
                syncRequested = false
                if changeCursor == nil {
                    try await snapshot(version: version)
                } else {
                    try await changes(version: version)
                }
                guard current, generation == version else { return }
            } while syncRequested
            synchronizationSucceeded()
        } catch {
            if (error as? ClientFailure)?.statusCode == 410, current, generation == version {
                do {
                    try await snapshot(version: version)
                    synchronizationSucceeded()
                    return
                } catch { failed(error, version: version) }
            } else {
                failed(error, version: version)
            }
            if current, generation == version {
                realtimeReady = false
                startFallback(delay: 3)
            }
        }
    }

    func snapshot(version: UUID) async throws {
        let result: ChatSnapshot
        do {
            result = try await session.send(
                ChatRequests.snapshot(id, aroundEntryID: anchorID), as: ChatSnapshot.self)
        } catch {
            guard anchorID != nil, (error as? ClientFailure)?.statusCode == 404 else { throw error }
            result = try await session.send(ChatRequests.snapshot(id), as: ChatSnapshot.self)
            guard current, generation == version else { throw ClientFailure.staleSession }
            anchorID = nil
        }
        try Task.checkCancellation()
        guard current, generation == version else { throw ClientFailure.staleSession }
        guard result.mode == "snapshot", !result.changeCursor.isEmpty,
            result.entries.count <= 100
        else { throw ClientFailure.invalidResponse }
        try validate(result.projections, entries: result.entries, meeting: result.meeting)
        let previous = records
        records = []
        projectionVersions = [:]
        do { try apply(result.projections, entries: result.entries, meeting: result.meeting) } catch
        {
            records = previous
            throw error
        }
        if streamEpoch != result.streamEpoch { reads.resetProjectionVersions() }
        reads.apply(
            actual: result.myReadState, count: result.unreadCount, firstUnread: result.firstUnread,
            projectionVersion: result.projectionVersion)
        latestKnownSequence = result.latestSequence
        streamEpoch = result.streamEpoch
        hasHistory = result.hasOlder
        hasNewer = result.hasNewer
        loaded = true
        changeCursor = result.changeCursor
        session.privateData.syncMeetings.insert(id)
    }

    private func changes(version: UUID) async throws {
        var through: String?
        var more: Bool
        repeat {
            guard let cursor = changeCursor else { throw ClientFailure.invalidResponse }
            let result = try await session.send(
                ChatRequests.changes(id, cursor: cursor), as: ChatChanges.self)
            try Task.checkCancellation()
            guard current, generation == version else { throw ClientFailure.staleSession }
            guard result.mode == "changes", result.streamEpoch == streamEpoch,
                !result.nextCursor.isEmpty, !result.throughCursor.isEmpty,
                through == nil || through == result.throughCursor,
                !result.hasMore || result.nextCursor != cursor
            else { throw ClientFailure.invalidResponse }
            if result.changes.contains(where: { $0.kind == "history_invalidated" }) {
                try await snapshot(version: version)
                return
            }
            let projections = result.changes.compactMap(\.projection)
            let arrivals = projections.compactMap(\.entry).filter {
                $0.sequence > latestKnownSequence
            }
            let latest = arrivals.map(\.sequence).max()
            try validate(projections, entries: [], meeting: result.meeting)
            try apply(projections, entries: [], meeting: result.meeting)
            for change in result.changes where change.kind == "entry_removed" {
                if let id = change.entryID,
                    change.projectionVersion >= (projectionVersions[id] ?? .zero)
                {
                    records.removeAll { $0.id == id }
                    projectionVersions[id] = change.projectionVersion
                }
            }
            reads.apply(
                actual: result.myReadState, count: result.unreadCount,
                firstUnread: result.firstUnread, projectionVersion: result.projectionVersion)
            reads.refreshCounts()
            if let readers { await readers.load(reset: true) }
            guard current, generation == version else { return }
            if !followingLatest {
                newMessageCount +=
                    Set(
                        arrivals.filter {
                            $0.kind == "message" && $0.actor.id != session.profile?.id
                        }.map(\.id)
                    ).count
            }
            latestKnownSequence = max(latestKnownSequence, latest ?? .zero)
            changeCursor = result.nextCursor
            more = result.hasMore
            through = result.throughCursor
        } while more
    }

    private func validate(
        _ projections: [ChatProjection], entries: [FeedEntry], meeting: ChatMeeting
    ) throws {
        try validateEntries(entries + projections.compactMap(\.entry))
        guard meeting.id == id, entries.allSatisfy({ $0.meetingID == id }),
            projections.allSatisfy({ projection in
                (projection.entry == nil || projection.entry?.meetingID == id)
                    && (projection.datePoll == nil || projection.datePoll?.meetingID == id)
                    && (projection.placePoll == nil || projection.placePoll?.meetingID == id)
                    && (projection.preparationTask == nil
                        || projection.preparationTask?.meetingID == id)
            })
        else { throw ClientFailure.invalidResponse }
        guard meeting.organizerID == session.profile?.id || meeting.myRSVP == .going else {
            session.updateMeetingAccess(id, allowed: false)
            throw ClientFailure.accessRevoked
        }
    }

    private func apply(_ projections: [ChatProjection], entries: [FeedEntry], meeting: ChatMeeting)
        throws
    {
        guard let previous = self.meeting else { throw ClientFailure.invalidResponse }
        let updated = try meeting.replacing(previous)
        try merge(entries)
        let cache = session.privateData.chatProjections[id] ?? ChatProjectionCache()
        for projection in projections {
            guard
                projection.projectionVersion >= (projectionVersions[projection.resourceID] ?? .zero)
            else { continue }
            if let entry = projection.entry {
                if !hasNewer || records.contains(where: { $0.id == entry.id }) {
                    try merge([entry])
                }
                if !reactions.isUpdating(entry.id) {
                    reactions.values[entry.id] =
                        projection.reactions?.first(where: { $0.entryID == entry.id })?.reactions
                        ?? []
                }
            }
            if let poll = projection.datePoll { cache.datePolls[poll.id] = poll }
            if let poll = projection.placePoll { cache.placePolls[poll.id] = poll }
            if let task = projection.preparationTask { cache.tasks[task.id] = task }
            projectionVersions[projection.resourceID] = projection.projectionVersion
        }
        session.privateData.chatProjections[id] = cache
        var resource = session.privateData.details[id] ?? ResourceState<Meeting>()
        let request = resource.begin()
        resource.succeed(updated, requestID: request)
        session.privateData.details[id] = resource
        invitation.preview = updated.invitationPreview
        trimWindow()
    }

    func trimWindow(prepending: Bool = false) {
        if records.count > 500 {
            let index = anchorID.flatMap { anchor in records.firstIndex(where: { $0.id == anchor })
            }
            let start =
                index.map { max(0, min($0 - 250, records.count - 500)) }
                ?? (prepending ? 0 : records.count - 500)
            if start > 0 { hasHistory = true }
            if start + 500 < records.count { hasNewer = true }
            records = Array(records[start..<start + 500])
        }
        let ids = Set(records.map(\.id))
        let resources = Set(
            records.compactMap { entry -> UUID? in
                let key = entry.kind == "preparation_task_created" ? "task_id" : "poll_id"
                guard case .string(let raw) = entry.payload[key] else { return nil }
                return UUID(uuidString: raw)
            })
        reads.counts = reads.counts.filter { ids.contains($0.key) }
        reactions.values = reactions.values.filter { ids.contains($0.key) }
        projectionVersions = projectionVersions.filter {
            ids.contains($0.key) || resources.contains($0.key)
        }
        if let cache = session.privateData.chatProjections[id] {
            cache.datePolls = cache.datePolls.filter { resources.contains($0.key) }
            cache.placePolls = cache.placePolls.filter { resources.contains($0.key) }
            cache.tasks = cache.tasks.filter { resources.contains($0.key) }
        }
    }
}
