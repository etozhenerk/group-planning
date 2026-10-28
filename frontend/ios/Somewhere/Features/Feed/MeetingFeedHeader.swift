import SwiftUI

struct MeetingFeedHeader: View {
    let owner: FeedOwner
    var viewport = CGSize.zero
    var sheetDismissal = 0
    @Environment(\.dismiss) private var dismiss
    @State private var returnAction: HeaderAction?
    @AccessibilityFocusState private var focusedAction: HeaderAction?

    private enum HeaderAction: Hashable { case heading, information, share }

    var body: some View {
        HStack(spacing: DesignTokens.spaceS6) {
            Button {
                owner.actionDrafts.clear()
                dismiss()
            } label: {
                ChatIcon(kind: .back)
                    .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                    .contentShape(Rectangle())
            }.accessibilityLabel("Назад").accessibilityIdentifier("feed-back")
            ChatIcon(kind: .calendar)
                .foregroundStyle(DesignTokens.colorMeetingMarkForeground)
                .frame(
                    width: narrow
                        ? DesignTokens.componentMobileChatNarrowMarkWidth
                        : DesignTokens.componentMobileChatMarkWidth,
                    height: narrow
                        ? DesignTokens.componentMobileChatNarrowMarkHeight
                        : DesignTokens.componentMobileChatMarkHeight
                )
                .background(
                    DesignTokens.colorMeetingMark,
                    in: RoundedRectangle(
                        cornerRadius: narrow
                            ? DesignTokens.componentMobileChatNarrowMarkRadius
                            : DesignTokens.componentMobileChatMarkRadius)
                )
                .accessibilityHidden(true)
            Button {
                open(.information, from: .heading)
            } label: {
                heading
            }.accessibilityIdentifier("meeting-heading")
                .accessibilityFocused($focusedAction, equals: .heading)
            if owner.invitation.organizer, !owner.showEmptyInvitation,
                let url = owner.invitation.shareURL
            {
                ShareLink(item: url, preview: SharePreview(owner.meeting?.title ?? "Встреча")) {
                    ChatIcon(kind: .share)
                        .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                        .contentShape(Rectangle())
                }.accessibilityLabel("Пригласить друзей").accessibilityIdentifier("feed-share")
                    .accessibilityFocused($focusedAction, equals: .share)
            }
            Button {
                open(.information, from: .information)
            } label: {
                ChatIcon(kind: .info)
                    .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                    .contentShape(
                        Rectangle())
            }.accessibilityLabel("Информация о встрече").accessibilityIdentifier(
                "meeting-info-open"
            ).accessibilityFocused($focusedAction, equals: .information)
        }.buttonStyle(ChatPressStyle()).foregroundStyle(AppPalette.text)
            .padding(.horizontal, DesignTokens.componentMobileChatHeaderInset).frame(
                minHeight: viewport.height < DesignTokens.breakpointChatCompactHeight
                    ? DesignTokens.componentMobileChatCompactHeaderHeight
                    : DesignTokens.componentMobileChatHeaderHeight
            ).background(AppPalette.background)
            .overlay(alignment: .bottom) {
                Rectangle().fill(AppPalette.border).frame(height: DesignTokens.spaceS1)
            }
            .onChange(of: sheetDismissal) { _, _ in
                focusedAction = returnAction
                returnAction = nil
            }
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS2) {
            Text(owner.meeting?.title ?? "Разговор").designTokenFont(
                narrow
                    ? DesignTokens.typographySizeMobileChatNarrowTitle
                    : DesignTokens.typographySizeMobileChatTitle,
                weight: DesignTokens.typographyWeightMobileChatTitle, relativeTo: .headline
            )
            .lineLimit(1).truncationMode(.tail).frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isHeader).accessibilityIdentifier("feed-title")
            if let meeting = owner.meeting {
                Text(
                    ExperienceDate.label(
                        meeting.startsAt, day: meeting.startsOn, timezone: meeting.timezone)
                        + " · " + ExperienceDate.participants(meeting.participantCount)
                )
                .designFont(DesignTokens.typographySizeLabel, relativeTo: .caption)
                .foregroundStyle(AppPalette.muted).lineLimit(1)
            }
        }.frame(minHeight: DesignTokens.targetIos).contentShape(Rectangle())
    }

    private func open(_ route: ChatSheetRoute, from action: HeaderAction) {
        returnAction = action
        focusedAction = nil
        SystemKeyboard.dismiss()
        owner.openSheet(route)
    }

    private var narrow: Bool { viewport.width < DesignTokens.breakpointChatNarrowWidth }
}
