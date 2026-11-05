import SwiftUI

struct InvitationFactsView: View {
    let value: InvitationPreview
    let api: APIClient
    let session: SessionStore?
    var closed = false

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            if let url = value.coverURL {
                CoverImageView(
                    source: .remote(url, value.meetingID), api: api, session: session,
                    fixedHeight: DesignTokens.componentMobileInvitationCoverHeight
                )
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusCard))
                .padding(.bottom, DesignTokens.spaceS24)
            }
            Text("Приглашение на встречу")
                .designFont(DesignTokens.typographySizeLabel)
                .foregroundStyle(DesignTokens.colorMuted)
                .padding(.bottom, DesignTokens.spaceS8)
            Text(value.title)
                .designTokenFont(
                    DesignTokens.componentMobileInvitationTitleSize,
                    weight: DesignTokens.componentMobileInvitationTitleWeight, relativeTo: .title
                )
                .tracking(-DesignTokens.componentActionHeadingTrackingMobile)
                .accessibilityAddTraits(.isHeader)
                .padding(.bottom, DesignTokens.componentMobileInvitationTitleGap)
            if let organizer = value.organizer {
                HStack(spacing: DesignTokens.spaceS10) {
                    ParticipantAvatar(
                        user: organizer, size: DesignTokens.spaceS32,
                        color: DesignTokens.colorRosterLilac,
                        foregroundColor: DesignTokens.colorText)
                    (Text("Приглашает ").foregroundColor(DesignTokens.colorMuted)
                        + Text(organizer.displayName).fontWeight(.medium))
                        .designFont(DesignTokens.typographySizeSmall)
                }.padding(.bottom, DesignTokens.spaceS24)
            }
            if closed { InvitationClosedView(answer: value.myRSVP) }
            VStack(alignment: .leading, spacing: DesignTokens.spaceS24) {
                fact(
                    "calendar",
                    text: ExperienceDate.label(
                        value.startsAt, day: value.startsOn, timezone: value.timezone),
                    detail: value.startsAt == nil
                        ? "Время пока не выбрано" : InvitationTimezone.label(value.timezone))
                fact("mappin.and.ellipse", text: value.place ?? "Место пока не выбрано")
            }
            .padding(.vertical, DesignTokens.componentMobileInvitationFactsInsetBlock)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay(alignment: .top) { Divider().overlay(DesignTokens.colorLine) }
            .overlay(alignment: .bottom) { Divider().overlay(DesignTokens.colorLine) }
            if let text = value.description, !text.isEmpty {
                Text(text).designFont(DesignTokens.componentMobileInvitationDescriptionFontSize)
                    .foregroundStyle(DesignTokens.colorMuted)
                    .lineSpacing(DesignTokens.spaceS4).textSelection(.enabled)
                    .padding(.top, DesignTokens.spaceS20)
            }
        }.fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func fact(_ icon: String, text: String, detail: String? = nil) -> some View {
        HStack(alignment: .top, spacing: DesignTokens.spaceS12) {
            Image(systemName: icon).font(
                .system(size: DesignTokens.componentMobileRosterActionIcon)
            )
            .frame(width: DesignTokens.componentMobileRosterActionIcon).foregroundStyle(
                DesignTokens.colorMuted
            )
            .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                Text(text).designFont(DesignTokens.typographySizeButton, weight: .medium)
                if let detail {
                    Text(detail).designFont(DesignTokens.typographySizeSmall)
                        .foregroundStyle(DesignTokens.colorMuted)
                }
            }
        }
    }
}
