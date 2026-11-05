import SwiftUI

struct RSVPFormView: View {
    let owner: InvitationOwner
    var authenticating = false
    var signIn: () -> Void = {}
    var compact = false
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
            if !owner.authenticated {
                Text("Вход не подтверждает участие.")
                    .designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted)
                ActionButton(title: "Войти через Яндекс ID", busy: authenticating, action: signIn)
            } else {
                if compact {
                    Text("Ваш ответ")
                        .designFont(DesignTokens.typographySizeSectionHeading, weight: .bold)
                        .accessibilityAddTraits(.isHeader)
                }
                if let error = owner.responseProblem { InvitationNoticeView(error: error) }
                if !owner.joinClosed || owner.pending != nil {
                    if compact {
                        ViewThatFits(in: .horizontal) {
                            HStack(spacing: DesignTokens.spaceS10) { choices }
                            VStack(spacing: DesignTokens.spaceS10) { choices }
                        }
                    } else {
                        InvitationResponseButton(owner: owner, answer: .going)
                        if typeSize.isAccessibilitySize {
                            VStack(spacing: DesignTokens.spaceS8) { secondaryChoices }
                        } else {
                            HStack(spacing: DesignTokens.spaceS8) { secondaryChoices }
                        }
                    }
                }
                if owner.saving {
                    Text("Сохраняем ответ…")
                        .designFont(DesignTokens.typographySizeCaption)
                        .accessibilityIdentifier("rsvp-saving")
                } else if owner.responseProblem != nil {
                    Button(action: owner.reload) {
                        Text("Проверить текущий ответ")
                            .designFont(DesignTokens.typographySizeCaption)
                            .foregroundStyle(DesignTokens.colorMuted)
                            .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                            .contentShape(Rectangle())
                    }.buttonStyle(.plain).disabled(owner.loading)
                } else if !compact && !owner.joinClosed {
                    Text("После ответа «Приду» откроется общий чат.")
                        .designFont(DesignTokens.typographySizeCaption)
                        .foregroundStyle(DesignTokens.colorMuted)
                }
            }
        }.fixedSize(horizontal: false, vertical: true)
    }

    private var choices: some View {
        ForEach([RSVPAnswer.going, .maybe, .notGoing], id: \.rawValue) { answer in
            InvitationResponseButton(owner: owner, answer: answer, compact: true)
        }
    }

    private var secondaryChoices: some View {
        Group {
            InvitationResponseButton(owner: owner, answer: .maybe)
            InvitationResponseButton(owner: owner, answer: .notGoing)
        }
    }
}
