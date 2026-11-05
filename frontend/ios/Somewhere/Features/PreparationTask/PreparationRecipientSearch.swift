import SwiftUI

struct PreparationRecipientSearch: View {
    let form: PreparationFormOwner
    let done: () -> Void
    @State private var query = ""
    private var people: [Participant] {
        (form.participants ?? []).filter {
            query.isEmpty || $0.user.displayName.localizedCaseInsensitiveContains(query)
        }
    }
    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            TextField("Имя участника", text: $query).actionField().accessibilityLabel(
                "Поиск участника"
            ).accessibilityIdentifier("preparation-recipient-search")
                .padding(.bottom, DesignTokens.spaceS12)
            if query.isEmpty {
                Button {
                    form.recipient = nil
                    done()
                } label: {
                    row(
                        name: "Любому участнику", subtitle: "Кто сможет, тот и возьмёт",
                        person: nil, selected: form.recipient == nil)
                }.buttonStyle(.plain).accessibilityIdentifier("preparation-recipient-any")
            }
            ForEach(people, id: \.user.id) { person in
                Button {
                    form.recipient = person.user.id
                    done()
                } label: {
                    row(
                        name: person.user.displayName
                            + (person.user.id == form.operation.session.profile?.id ? " · вы" : ""),
                        subtitle: person.role == "organizer" ? "Организатор" : nil,
                        person: person.user, selected: form.recipient == person.user.id)
                }.buttonStyle(.plain).accessibilityIdentifier(
                    "preparation-recipient-" + person.user.id.uuidString.lowercased())
            }
            if people.isEmpty && !query.isEmpty {
                Text("Участник не найден. Попробуйте другое имя.").designFont(
                    DesignTokens.typographySizeSmall
                ).foregroundStyle(DesignTokens.colorMuted).padding(.vertical, DesignTokens.spaceS16)
            }
        }
    }
    private func row(name: String, subtitle: String?, person: UserProfile?, selected: Bool)
        -> some View
    {
        HStack(spacing: DesignTokens.spaceS12) {
            if let person {
                ParticipantAvatar(user: person, size: DesignTokens.componentMobileAvatarSmallSize)
            } else {
                Image(systemName: "person.2").frame(
                    width: DesignTokens.componentMobileAvatarSmallSize
                ).foregroundStyle(DesignTokens.colorAccent)
            }
            VStack(alignment: .leading, spacing: DesignTokens.spaceS3) {
                Text(name).designFont(DesignTokens.typographySizeButton, weight: .medium)
                if let subtitle {
                    Text(subtitle).designFont(DesignTokens.typographySizeLabel).foregroundStyle(
                        DesignTokens.colorMuted)
                }
            }.frame(maxWidth: .infinity, alignment: .leading)
            if selected { Image(systemName: "checkmark").foregroundStyle(DesignTokens.colorAccent) }
        }.padding(.vertical, DesignTokens.spaceS10).frame(
            minHeight: DesignTokens.componentMobilePreparationRecipientMinimumHeight
        )
        .overlay(alignment: .bottom) {
            Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
        }
        .contentShape(Rectangle())
    }
}
