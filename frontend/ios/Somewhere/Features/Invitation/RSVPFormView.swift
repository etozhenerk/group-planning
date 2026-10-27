import SwiftUI

struct RSVPFormView: View {
    let owner: InvitationOwner
    var authenticating = false
    var signIn: () -> Void = {}
    var compact = false
    @Environment(\.scenePhase) private var phase
    @State private var now = Date()
    var body: some View {
        let closed = owner.joinClosed(at: now)
        VStack(alignment: .leading, spacing: 18) {
            if !owner.authenticated {
                Text("Ответьте на приглашение").font(.title2.bold())
                Text("Для ответа нужен вход через Яндекс ID. Сам вход не подтверждает участие.")
                    .foregroundStyle(AppPalette.muted)
                ActionButton(title: "Войти и ответить", busy: authenticating, action: signIn)
            } else {
                if compact {
                    Text("Ваш ответ")
                        .designFont(DesignTokens.typographySizeSectionHeading, weight: .bold)
                        .foregroundStyle(DesignTokens.colorText).accessibilityAddTraits(.isHeader)
                } else if let answer = owner.answer {
                    Label(RSVPLabels.confirmation(answer), systemImage: RSVPLabels.symbol(answer))
                        .font(.headline).foregroundStyle(AppPalette.accent)
                        .accessibilityIdentifier("confirmed-rsvp")
                } else {
                    Text("Сможете прийти?").font(.title2.bold())
                }
                if closed {
                    Text("Присоединиться уже нельзя — запись закрывается за час до начала.")
                        .font(.footnote).foregroundStyle(AppPalette.muted)
                }
                if compact {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: DesignTokens.spaceS10) {
                            choices(closed: closed)
                        }.fixedSize(horizontal: true, vertical: true)
                        VStack(spacing: DesignTokens.spaceS10) {
                            choices(closed: closed)
                        }
                    }
                } else {
                    VStack(spacing: 10) {
                        choices(closed: closed)
                    }
                }
                if owner.choice != .going && owner.answer == .going && owner.choice != nil {
                    Text("После сохранения переписка и состав участников будут недоступны.")
                        .font(.footnote).foregroundStyle(AppPalette.muted)
                }
                if owner.canSave || owner.pending != nil {
                    ActionButton(
                        title: owner.saving
                            ? "Сохраняем…"
                            : (owner.pending == nil ? "Сохранить ответ" : "Повторить сохранение"),
                        disabled: owner.loading || owner.saving, action: owner.save
                    )
                    .accessibilityIdentifier("rsvp-save")
                }
                if let error = owner.responseProblem {
                    Text(error).font(.footnote).foregroundStyle(AppPalette.error)
                        .accessibilityIdentifier("rsvp-error")
                    Button("Проверить текущий ответ", action: owner.reload).disabled(owner.saving)
                }
            }
        }
        .task(id: phase) {
            guard phase == .active else { return }
            now = Date()
            while !Task.isCancelled {
                do { try await Task.sleep(for: .seconds(1)) } catch { return }
                now = Date()
            }
        }
        .padding(compact ? DesignTokens.spaceS0 : 22)
        .background(
            compact ? .clear : AppPalette.surface, in: RoundedRectangle(cornerRadius: 24))

    }

    private func choices(closed: Bool) -> some View {
        ForEach([RSVPAnswer.going, .maybe, .notGoing], id: \.rawValue) { answer in
            RSVPChoiceView(
                answer: answer, selected: owner.choice == answer,
                disabled: !owner.editable || (answer == .going && closed),
                action: { owner.choose(answer) }, compact: compact)
        }
    }
}
