import SwiftUI

struct MeetingInfoHeading: View {
    let owner: FeedOwner
    let meeting: Meeting
    private var organizer: UserProfile? {
        if owner.invitation.organizer { return owner.session.profile }
        return owner.session.privateData.participants[owner.id]?.value?.participants
            .first { $0.role == "organizer" }?.user
    }

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS20) {
            if let url = meeting.coverURL {
                CoverImageView(
                    source: .remote(url, meeting.id), api: owner.session.api,
                    session: owner.session,
                    fixedHeight: DesignTokens.componentMobileInfoCoverHeight,
                    cornerRadius: DesignTokens.spaceS20)
            }
            VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
                Text(meeting.title).designTokenFont(
                    DesignTokens.componentMobileInfoTitleSize,
                    weight: DesignTokens.typographyWeightMobileSheetTitle, relativeTo: .title2
                ).tracking(DesignTokens.componentMobileInfoTitleTracking)
                    .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
                HStack(spacing: DesignTokens.spaceS8) {
                    if let organizer {
                        ParticipantAvatar(
                            user: organizer,
                            size: DesignTokens.componentMobileInfoOrganizerAvatarSize)
                    } else {
                        AvatarSilhouette().fill(DesignTokens.colorMuted)
                            .frame(
                                width: DesignTokens.componentMobileInfoOrganizerAvatarSize,
                                height: DesignTokens.componentMobileInfoOrganizerAvatarSize
                            )
                            .accessibilityHidden(true)
                    }
                    Text(
                        owner.invitation.organizer
                            ? "Вы организатор"
                            : organizer.map { "Организует \($0.displayName)" }
                                ?? "Организатор встречи"
                    )
                    .designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted)
                    Spacer(minLength: DesignTokens.spaceS0)
                    if owner.invitation.organizer {
                        Button {
                            owner.openSheet(.settings, child: true)
                        } label: {
                            ChatIcon(kind: .settings)
                                .frame(
                                    width: DesignTokens.targetIos, height: DesignTokens.targetIos
                                )
                                .contentShape(Rectangle())
                        }.buttonStyle(.plain).accessibilityLabel("Настройки встречи")
                            .accessibilityIdentifier("edit-meeting")
                    }
                }
            }
        }
    }
}
