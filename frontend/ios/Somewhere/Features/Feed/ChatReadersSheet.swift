import SwiftUI

struct ChatReadersSheet: View {
    let owner: ChatReadersOwner
    var body: some View {
        ActionFormSheet(
            title: "Прочитали", scrollIdentifier: "chat-readers",
            closeIdentifier: "chat-readers-close"
        ) {
            if owner.loading && !owner.loaded {
                VStack(spacing: DesignTokens.spaceS12) {
                    ForEach(0..<3) { _ in
                        HStack(spacing: DesignTokens.componentMobileRosterRowGap) {
                            Circle().frame(
                                width: DesignTokens.componentMobileRosterAvatarSize,
                                height: DesignTokens.componentMobileRosterAvatarSize)
                            Text("Имя участника").designFont(DesignTokens.typographySizeSmall)
                            Spacer()
                        }.frame(minHeight: DesignTokens.componentMobileRosterRowHeight)
                    }
                }.redacted(reason: .placeholder).foregroundStyle(DesignTokens.colorMuted)
                    .accessibilityElement(children: .ignore).accessibilityLabel("Загружаем список")
            }
            ForEach(Array(owner.people.enumerated()), id: \.element.id) { index, person in
                HStack(spacing: DesignTokens.componentMobileRosterRowGap) {
                    MeetingInfoAvatar(
                        user: person, size: DesignTokens.componentMobileRosterAvatarSize,
                        textSize: DesignTokens.typographySizeCaption,
                        weight: DesignTokens.typographyWeightSemibold,
                        color: index.isMultiple(of: 2)
                            ? DesignTokens.colorRosterMint : DesignTokens.colorRosterLilac,
                        textColor: DesignTokens.colorRosterText)
                    Text(person.displayName).designFont(DesignTokens.typographySizeSmall)
                    Spacer(minLength: DesignTokens.spaceS0)
                }.frame(minHeight: DesignTokens.componentMobileRosterRowHeight)
                    .accessibilityElement(children: .combine)
            }
            if owner.loaded, owner.people.isEmpty, owner.problem == nil {
                Text("Пока никто не прочитал").font(.body).foregroundStyle(DesignTokens.colorMuted)
            }
            if let problem = owner.problem {
                Text(problem).foregroundStyle(DesignTokens.colorError)
                Button("Повторить") { Task { await owner.load(reset: !owner.loaded) } }
                    .frame(minHeight: DesignTokens.targetIos)
            } else if owner.nextCursor != nil {
                Button("Показать ещё") { Task { await owner.load() } }
                    .frame(minHeight: DesignTokens.targetIos).disabled(owner.loading)
            }
        }.task { await owner.load() }.onDisappear { owner.suspend() }
    }
}
