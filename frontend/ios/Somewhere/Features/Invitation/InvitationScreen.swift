import SwiftUI

struct InvitationScreen: View {
    @State private var owner: InvitationOwner
    @Environment(\.scenePhase) private var phase
    @Environment(\.completeRSVP) private var completion
    @State private var automaticRouteCompleted = false
    @State private var routedResponseID: UUID?
    var responseCompleted: () -> Void
    var warning: String?
    let allowsPullToRefresh: Bool
    var authenticating: Bool
    var signIn: () -> Void

    init(
        target: InvitationTarget, api: APIClient, session: SessionStore?, warning: String? = nil,
        allowsPullToRefresh: Bool = true,
        authenticating: Bool = false, signIn: @escaping () -> Void = {},
        responseCompleted: @escaping () -> Void = {}
    ) {
        _owner = State(initialValue: InvitationOwner(target: target, api: api, session: session))
        self.warning = warning
        self.allowsPullToRefresh = allowsPullToRefresh
        self.authenticating = authenticating
        self.signIn = signIn
        self.responseCompleted = responseCompleted
    }

    var body: some View {
        Group {
            if owner.canAccess, let value = owner.preview, let session = owner.session,
                !session.privateData.denied.contains(value.meetingID)
            {
                MeetingFeedScreen(id: value.meetingID, session: session, invitation: owner)
            } else if allowsPullToRefresh {
                invitation.refreshable { await owner.load() }
            } else {
                invitation
            }
        }
        .task(id: phase) {
            guard phase == .active else {
                owner.suspend()
                return
            }
            if !owner.canAccess { await owner.load() }
            while !Task.isCancelled, !owner.unavailable {
                do { try await Task.sleep(for: .seconds(5)) } catch { return }
                if (!owner.canAccess
                    || owner.preview.map {
                        owner.session?.privateData.denied.contains($0.meetingID) == true
                    } == true)
                    && !owner.loading && !owner.saving && owner.pending == nil
                    && owner.choice == owner.answer
                {
                    await owner.load()
                }
            }
        }
        .onChange(of: owner.completedResponseID) { _, requestID in
            if let requestID, let outcome = owner.completedResponse {
                complete(outcome, requestID: requestID)
            }
        }
        .onChange(of: owner.canAccess) { _, allowed in
            if allowed, owner.completedResponseID == nil, case .token = owner.target,
                let id = owner.preview?.meetingID
            {
                complete(.going(id))
            }
        }
        .onChange(
            of: owner.preview.map {
                owner.session?.privateData.denied.contains($0.meetingID) == true
            } ?? false
        ) { _, denied in
            if denied { owner.preview = owner.preview?.publicFacts }
        }
        .onDisappear { owner.cancel() }
    }
    private func complete(_ outcome: RSVPOutcome, requestID: UUID? = nil) {
        guard owner.current, owner.authenticated, let completion else { return }
        if let requestID {
            guard routedResponseID != requestID else { return }
            routedResponseID = requestID
        } else {
            guard !automaticRouteCompleted else { return }
            automaticRouteCompleted = true
        }
        responseCompleted()
        completion.perform(outcome)
    }

    private var invitation: some View {
        InvitationPublicSurface(
            owner: owner, warning: warning, authenticating: authenticating, signIn: signIn)
    }
}
