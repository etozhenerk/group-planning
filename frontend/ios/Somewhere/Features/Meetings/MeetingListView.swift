import SwiftUI

struct MeetingListView: View {
    let owner: MeetingListOwner
    let create: () -> Void
    let select: (UUID) -> Void
    @Binding var invitations: Bool
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if typeSize.isAccessibilitySize {
                    heading.padding(.horizontal, -DesignTokens.spaceS20)
                }
                if owner.selection.display == .calendar {
                    MeetingCalendarView(owner: owner, create: create, select: select)
                } else {
                    MeetingResultsView(owner: owner, create: create, select: select)
                    UndatedMeetingsButton(owner: owner).padding(.top, 20)
                }
            }.padding(.horizontal, DesignTokens.spaceS20)
                .padding(
                    .top,
                    owner.selection.display == .list ? DesignTokens.spaceS20 : DesignTokens.spaceS0
                )
                .padding(.bottom, DesignTokens.spaceS20)
                .frame(maxWidth: .infinity, alignment: .leading)
        }.defaultScrollAnchor(.top).accessibilityIdentifier("meetings-list")
            .safeAreaInset(edge: .top, spacing: DesignTokens.spaceS0) {
                if !typeSize.isAccessibilitySize { heading }
            }
            .background(AppPalette.background)
    }

    private var heading: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            MeetingListHeading(
                empty: owner.selection.display == .list && owner.empty, create: create
            )
            .padding(.top, DesignTokens.componentMobileMeetingsHeadingInsetTop)
            .padding(.bottom, DesignTokens.componentMobileMeetingsHeadingInsetBottom)
            .frame(minHeight: DesignTokens.componentMobileMeetingsHeadingMinimumHeight)
            MeetingToolbar(owner: owner)
        }
        .padding(.horizontal, DesignTokens.spaceS20)
        .background(AppPalette.background)
    }
}
