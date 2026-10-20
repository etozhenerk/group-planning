import Foundation

@MainActor
struct MeetingRepository {
    let session: SessionStore
    var state: PrivateData { session.privateData }

    func loadMeetings() async {
        guard let lease = try? state.lease() else { return }
        let token = state.meetings.begin()
        do {
            let page = try await session.send(MeetingRequests.list(), as: MeetingsPage.self)
            guard state.isCurrent(lease) else { return }
            state.meetings.succeed(
                page.meetings.filter { !state.denied.contains($0.id) }, requestID: token)
        } catch {
            guard state.isCurrent(lease) else { return }
            state.meetings.fail(error, requestID: token)
        }
    }

    func loadMeeting(_ id: UUID) async {
        guard let lease = try? state.lease(for: id) else { return }
        var resource = state.details[id] ?? ResourceState()
        let token = resource.begin()
        state.details[id] = resource
        do {
            let value = try await session.send(MeetingRequests.details(id), as: Meeting.self)
            guard state.isCurrent(lease) else { return }
            state.details[id]?.succeed(value, requestID: token)
        } catch {
            guard state.isCurrent(lease) else { return }
            state.details[id]?.fail(error, requestID: token)
        }
    }

    func loadFeed(_ id: UUID) async {
        guard let lease = try? state.lease(for: id) else { return }
        var resource = state.feeds[id] ?? ResourceState()
        let token = resource.begin()
        state.feeds[id] = resource
        do {
            let value = try await session.send(FeedRequests.page(id), as: FeedPage.self)
            guard state.isCurrent(lease) else { return }
            state.feeds[id]?.succeed(value, requestID: token)
        } catch {
            guard state.isCurrent(lease) else { return }
            state.feeds[id]?.fail(error, requestID: token)
        }
    }

    func loadParticipants(_ id: UUID) async {
        guard let lease = try? state.lease(for: id) else { return }
        var resource = state.participants[id] ?? ResourceState()
        let token = resource.begin()
        state.participants[id] = resource
        do {
            let value = try await session.send(
                MeetingRequests.participants(id), as: Participants.self)
            guard state.isCurrent(lease) else { return }
            state.participants[id]?.succeed(value, requestID: token)
        } catch {
            guard state.isCurrent(lease) else { return }
            state.participants[id]?.fail(error, requestID: token)
        }
    }
}
