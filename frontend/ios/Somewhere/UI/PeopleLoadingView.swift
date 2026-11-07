import SwiftUI

struct PeopleLoadingView: View {
    var body: some View {
        DeferredPlaceholder {
            VStack(spacing: DesignTokens.spaceS24) {
                ForEach(0..<3) { index in
                    HStack(spacing: DesignTokens.componentMobileInfoPeopleSkeletonGap) {
                        Circle().fill(DesignTokens.colorLine).frame(
                            width: DesignTokens.componentMobileInfoPeopleSkeletonPictureSize,
                            height: DesignTokens.componentMobileInfoPeopleSkeletonPictureSize)
                        VStack(alignment: .leading, spacing: DesignTokens.spaceS10) {
                            line(
                                index == 1
                                    ? DesignTokens
                                        .componentMobileInfoPeopleSkeletonShortTitleFraction
                                    : DesignTokens.componentMobileInfoPeopleSkeletonTitleFraction,
                                height: DesignTokens.componentMobileInfoPeopleSkeletonTitleHeight)
                            line(
                                DesignTokens.componentMobileInfoPeopleSkeletonLineFraction,
                                height: DesignTokens.spaceS12)
                        }
                    }
                }
            }.padding(.vertical, DesignTokens.spaceS20)
                .accessibilityElement(children: .ignore).accessibilityLabel("Загрузка участников")
        }
    }

    private func line(_ fraction: CGFloat, height: CGFloat) -> some View {
        GeometryReader { geometry in
            RoundedRectangle(cornerRadius: DesignTokens.componentInvitationStateLoadingRadius)
                .fill(DesignTokens.colorLine).frame(width: geometry.size.width * fraction)
        }.frame(height: height)
    }
}
