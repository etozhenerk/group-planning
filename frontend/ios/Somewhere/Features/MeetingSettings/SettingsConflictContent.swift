import SwiftUI

struct SettingsConflictContent: View {
    let owner: MeetingSettingsOwner
    var body: some View {
        if let meeting = owner.conflictMeeting {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                Text("Сейчас во встрече").designFont(
                    DesignTokens.typographySizeCaption, weight: .medium
                )
                .foregroundStyle(DesignTokens.colorMuted)
                .padding(.top, DesignTokens.spaceS12).padding(.bottom, DesignTokens.spaceS8)
                Text(meeting.title).designFont(
                    DesignTokens.componentMobileSettingsReviewTitleSize, weight: .bold
                )
                .fixedSize(horizontal: false, vertical: true).padding(
                    .bottom, DesignTokens.spaceS24)
                MeetingInfoFacts(meeting: meeting, card: false)
                Text(
                    "Ваши правки остались в форме. Обновлённые поля, которые вы не меняли, подставятся автоматически."
                )
                .designFont(DesignTokens.componentMobileSettingsReviewBodySize)
                .foregroundStyle(DesignTokens.colorMuted)
                .fixedSize(horizontal: false, vertical: true).padding(
                    .top, DesignTokens.spaceS24 + DesignTokens.spaceS4)
            }
        } else if owner.saving {
            ProgressView("Загружаем настройки…")
        }
    }
}
