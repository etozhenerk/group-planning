import SwiftUI

struct HomeNavigation: View {
    @Binding var selection: HomeSection
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: DesignTokens.spaceS0) {
            ForEach(HomeSection.allCases) { item in
                Button {
                    withAnimation(
                        ChatMotion.animation(
                            DesignTokens.motionDurationNavigation, reduceMotion: reduceMotion)
                    ) {
                        selection = item
                    }
                } label: {
                    VStack(spacing: DesignTokens.componentMobileNavigationIconGap) {
                        ExperienceIcon(
                            kind: icon(item), size: DesignTokens.componentNavigationIcon,
                            weight: CGFloat(selection == item
                                ? DesignTokens.componentMobileNavigationSelectedIconStroke
                                : DesignTokens.componentMobileNavigationIconStroke))
                        Text(item.rawValue)
                            .designFont(DesignTokens.typographySizeNavigationLabel, weight: .medium)
                            .tracking(DesignTokens.typographyTrackingNavigationLabel)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: DesignTokens.targetAndroid)
                    .foregroundStyle(
                        selection == item
                            ? DesignTokens.colorNavigationSelectedText
                            : DesignTokens.colorNavigationInactiveText)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selection == item ? .isSelected : [])
                .accessibilityIdentifier("home-tab-" + item.symbol)
                .accessibilityShowsLargeContentViewer {
                    Label(item.rawValue, systemImage: item.symbol)
                }
            }
        }
        .background {
            GeometryReader { geometry in
                let width = geometry.size.width / CGFloat(HomeSection.allCases.count)
                let position = HomeSection.allCases.firstIndex(of: selection) ?? 0
                RoundedRectangle(cornerRadius: DesignTokens.radiusSheet)
                    .fill(DesignTokens.colorNavigationSelected)
                    .overlay {
                        RoundedRectangle(cornerRadius: DesignTokens.radiusSheet)
                            .strokeBorder(
                                DesignTokens.colorNavigationSelectedBorder,
                                lineWidth: DesignTokens.spaceS1)
                    }
                    .frame(width: width)
                    .offset(x: width * CGFloat(position))
                    .animation(
                        ChatMotion.animation(
                            DesignTokens.motionDurationNavigation, reduceMotion: reduceMotion),
                        value: selection)
            }
            .accessibilityHidden(true).allowsHitTesting(false)
        }
        .padding(DesignTokens.componentMobileNavigationPadding)
        .background {
            panel.fill(.ultraThinMaterial)
                .overlay { panel.fill(DesignTokens.colorMobileNavigationIOSBackground) }
                .overlay {
                    panel.strokeBorder(
                        DesignTokens.colorMobileNavigationIOSBorder,
                        lineWidth: DesignTokens.spaceS1)
                }
                .shadow(
                    color: DesignTokens.colorMobileStickyShadow,
                    radius: DesignTokens.componentMobileStickyShadowBlur,
                    y: -DesignTokens.componentMobileStickyShadowUpOffset)
                .ignoresSafeArea(edges: .bottom)
        }
    }

    private var panel: UnevenRoundedRectangle {
        UnevenRoundedRectangle(
            topLeadingRadius: DesignTokens.componentMobileStickyRadius,
            topTrailingRadius: DesignTokens.componentMobileStickyRadius)
    }

    private func icon(_ item: HomeSection) -> ExperienceIcon.Kind {
        switch item {
        case .meetings: .calendar
        case .invitations: .envelope
        case .profile: .person
        }
    }
}
