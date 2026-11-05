import SwiftUI

struct MeetingInfoFooter: View {
    let owner: FeedOwner
    private var answer: String {
        switch owner.invitation.answer {
        case .going: "Приду"
        case .maybe: "Возможно"
        case .notGoing: "Не смогу"
        case nil: "Без ответа"
        }
    }

    var body: some View {
        if owner.invitation.organizer {
            ActionFormButton(title: "Пригласить друзей") {
                owner.openSheet(.share, child: true)
            }.accessibilityIdentifier("meeting-info-share")
        } else {
            HStack(spacing: DesignTokens.spaceS12) {
                Image(systemName: "checkmark").font(
                    .system(size: DesignTokens.componentMobileRosterActionIcon)
                )
                .foregroundStyle(DesignTokens.colorAccent)
                .frame(
                    width: DesignTokens.componentMobileInfoResponseIconSize,
                    height: DesignTokens.componentMobileInfoResponseIconSize
                )
                .background(
                    DesignTokens.colorBackground,
                    in: RoundedRectangle(cornerRadius: DesignTokens.spaceS12))
                VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                    Text("Ваш ответ").designFont(DesignTokens.typographySizeLabel)
                        .foregroundStyle(DesignTokens.colorMuted)
                    Text(answer).designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                }
                Spacer(minLength: DesignTokens.spaceS0)
                Button {
                    owner.openSheet(.response, child: true)
                } label: {
                    HStack(spacing: DesignTokens.spaceS6) {
                        Text("Изменить").designFont(DesignTokens.typographySizeCaption)
                        Image(systemName: "chevron.down").font(.system(size: DesignTokens.spaceS16))
                    }.frame(minHeight: DesignTokens.targetIos).contentShape(Rectangle())
                }.buttonStyle(.plain).foregroundStyle(DesignTokens.colorAccent)
                    .accessibilityIdentifier("meeting-change-answer")
            }.fixedSize(horizontal: false, vertical: true)
        }
    }
}
