import Foundation
import Observation

@MainActor @Observable
final class SavedInvitationsOwner {
    let session: SessionStore
    var page = ResourceState<InvitationsPage>()
    private var pages = 1
    @ObservationIgnored private let lease: PrivateData.Lease?
    @ObservationIgnored private var operation: Task<Void, Never>?

    init(session: SessionStore) {
        self.session = session
        lease = try? session.privateData.lease()
    }

    var current: Bool {
        session.status == .authenticated && lease.map(session.privateData.isCurrent) == true
    }
    var items: [SavedInvitation] { current ? page.value?.invitations ?? [] : [] }

    func load(more: Bool = false) async {
        guard current, !page.isLoading else { return }
        let old = page.value
        if more && old?.nextCursor == nil { return }
        let requestID = page.begin()
        do {
            var result = try await fetch(cursor: more ? old?.nextCursor : nil)
            var loaded = 1
            if more, let old {
                result = merge(old, result)
                loaded = pages + 1
            } else {
                while loaded < pages, let cursor = result.nextCursor {
                    result = merge(result, try await fetch(cursor: cursor))
                    loaded += 1
                }
            }
            try Task.checkCancellation()
            guard current else {
                page = ResourceState()
                return
            }
            pages = loaded
            page.succeed(result, requestID: requestID)
        } catch {
            guard current else {
                page = ResourceState()
                return
            }
            page.fail(error, requestID: requestID)
        }
    }

    func refresh(more: Bool = false) {
        guard !page.isLoading else { return }
        operation = Task { await load(more: more) }
    }

    func cancel() {
        operation?.cancel()
        operation = nil
    }

    func target(_ item: SavedInvitation) -> InvitationTarget? {
        InvitationURL.token(from: item.invitationURL, origin: session.api.origin, scheme: "")
            .map(InvitationTarget.token)
    }

    private func fetch(cursor: String?) async throws -> InvitationsPage {
        var query = [URLQueryItem(name: "limit", value: "50")]
        if let cursor { query.append(URLQueryItem(name: "cursor", value: cursor)) }
        let result = try await session.send(
            APIRequest(path: ["invitations"], query: query), as: InvitationsPage.self)
        guard result.invitations.allSatisfy({ $0.preview.myRSVP == .maybe && target($0) != nil })
        else {
            throw ClientFailure.invalidResponse
        }
        return result
    }

    private func merge(_ first: InvitationsPage, _ next: InvitationsPage) -> InvitationsPage {
        var ids = Set(first.invitations.map(\.id))
        return InvitationsPage(
            invitations: first.invitations + next.invitations.filter { ids.insert($0.id).inserted },
            nextCursor: next.nextCursor)
    }
}
