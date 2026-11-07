import SwiftUI

struct InvitationPublicSurface: View {
    let owner: InvitationOwner
    let warning: String?
    let authenticating: Bool
    let signIn: () -> Void
    @State private var now = Date()
    @Environment(\.scenePhase) private var phase

    private var closed: Bool { owner.joinClosed(at: now) }

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS24) {
                if let value = owner.preview?.publicFacts {
                    InvitationFactsView(
                        value: value, api: owner.api, session: owner.session, closed: closed)
                    if let warning {
                        Text(warning).designFont(DesignTokens.typographySizeCaption)
                            .foregroundStyle(DesignTokens.colorError)
                    }
                    if let problem = owner.problem {
                        StatusView(title: problem, retry: { owner.reload() })
                    }
                } else if owner.problem != nil {
                    InvitationUnavailableView(retry: { owner.reload() })
                } else {
                    DetailsLoadingView(
                        label: "Загрузка приглашения", identifier: "invitation-loading")
                }
            }.padding(.horizontal, DesignTokens.spaceS20).padding(.bottom, DesignTokens.spaceS24)
        }
        .accessibilityIdentifier("invitation-screen")
        .safeAreaInset(edge: .top, spacing: DesignTokens.spaceS0) {
            InvitationPageHeader(session: owner.session)
        }
        .safeAreaInset(edge: .bottom, spacing: DesignTokens.spaceS0) {
            if owner.preview != nil && (!closed || owner.pending != nil) {
                InvitationResponsePanel {
                    RSVPFormView(owner: owner, authenticating: authenticating, signIn: signIn)
                }
            }
        }
        .background(DesignTokens.colorBackground).toolbar(.hidden, for: .navigationBar)
        .task(id: phase) {
            guard phase == .active else { return }
            now = Date()
            while !Task.isCancelled {
                do { try await Task.sleep(for: .seconds(1)) } catch { return }
                now = Date()
            }
        }
    }
}
