import SwiftUI

struct SavedInvitationCard: View {
    let item: SavedInvitation
    let api: APIClient
    let select: () -> Void
    @Environment(\.dynamicTypeSize) private var textSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private var preview: InvitationPreview { item.preview }
    private var hasCover: Bool { preview.coverURL != nil && !textSize.isAccessibilitySize }
    private var weekend: Bool {
        ExperienceDate.weekend(preview.startsAt, day: preview.startsOn, timezone: preview.timezone)
    }

    var body: some View {
        Button(action: select) {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS16) {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                        Text(preview.title).designFont(
                            DesignTokens.typographySizeCardTitleMobile, weight: .bold
                        )
                        .tracking(-0.45).fixedSize(horizontal: false, vertical: true)
                        HStack(alignment: .top, spacing: DesignTokens.spaceS6) {
                            ExperienceIcon(kind: .pin, size: 15)
                            Text(preview.place ?? "Место пока не выбрано")
                                .designFont(DesignTokens.typographySizeCaption)
                                .fixedSize(horizontal: false, vertical: true)
                        }.foregroundStyle(AppPalette.muted)
                    }.padding(.trailing, hasCover ? 112 : 0)
                    if let organizer = preview.organizer {
                        Text("Приглашает " + organizer.displayName)
                            .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                                AppPalette.muted
                            )
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: DesignTokens.spaceS8)
                Text("Изменить ответ →").designFont(
                    DesignTokens.typographySizeLabel, weight: .medium
                )
                .foregroundStyle(AppPalette.accent)
            }
            .padding(.horizontal, DesignTokens.componentMobileInvitationCardInsetInline)
            .padding(.top, DesignTokens.componentMobileInvitationCardInsetTop)
            .padding(.bottom, DesignTokens.componentMobileInvitationCardAnswerInsetBottom)
            .frame(
                maxWidth: .infinity,
                minHeight: DesignTokens.componentMobileInvitationCardMinimumHeight,
                alignment: .topLeading
            )
            .background(
                weekend ? AppPalette.weekendCard : AppPalette.weekdayCard,
                in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                    .stroke(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
            }
            .overlay(alignment: .topLeading) {
                Text(
                    ExperienceDate.label(
                        preview.startsAt, day: preview.startsOn,
                        timezone: preview.timezone, weekday: true)
                )
                .designFont(10, weight: .semibold).lineLimit(1)
                .padding(.horizontal, DesignTokens.spaceS10).padding(
                    .vertical, DesignTokens.spaceS4
                )
                .foregroundStyle(
                    weekend ? DesignTokens.colorWeekendText : DesignTokens.colorWeekdayText
                )
                .background(
                    weekend ? AppPalette.weekendBadge : AppPalette.weekdayBadge,
                    in: RoundedRectangle(cornerRadius: 8)
                )
                .padding(.leading, DesignTokens.componentMobileInvitationCardDateInset)
                .padding(
                    .trailing,
                    hasCover
                        ? DesignTokens.componentMobileInvitationCardCoverDateReserve
                        : DesignTokens.componentMobileInvitationCardDateInset
                )
                .offset(y: -11)
            }
            .overlay(alignment: .topTrailing) {
                if hasCover, let url = preview.coverURL {
                    CoverImageView(
                        source: .remote(url, preview.meetingID), api: api, thumbnail: true,
                        thumbnailSize: DesignTokens.componentCardCoverMobileWidth - DesignTokens
                            .componentCardCoverBorder * 2,
                        fixedHeight: DesignTokens.componentCardCoverMobileHeight - DesignTokens
                            .componentCardCoverBorder * 2
                    )
                    .frame(
                        width: DesignTokens.componentCardCoverMobileWidth - DesignTokens
                            .componentCardCoverBorder * 2,
                        height: DesignTokens.componentCardCoverMobileHeight - DesignTokens
                            .componentCardCoverBorder * 2
                    )
                    .clipped().padding(DesignTokens.componentCardCoverBorder)
                    .background(
                        weekend ? DesignTokens.colorWeekendFrame : DesignTokens.colorWeekdayFrame,
                        in: RoundedRectangle(cornerRadius: 16)
                    )
                    .rotationEffect(.degrees(reduceMotion ? 0 : weekend ? -4 : 5))
                    .padding(.trailing, 13).offset(y: -10)
                }
            }

        }
        .buttonStyle(.plain).accessibilityElement(children: .combine)
        .accessibilityIdentifier("saved-invitation-\(item.id.uuidString.lowercased())")
        .padding(.top, DesignTokens.spaceS12).padding(.bottom, 17)
    }
}
