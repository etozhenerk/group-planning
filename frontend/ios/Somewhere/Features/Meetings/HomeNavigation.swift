import SwiftUI

struct HomeNavigation: View {
    @Binding var selection: HomeSection
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        HStack(spacing: 0) {
            ForEach(HomeSection.allCases) { item in
                Button {
                    withAnimation(
                        ChatMotion.animation(
                            DesignTokens.motionDurationNavigation, reduceMotion: reduceMotion)
                    ) {
                        selection = item
                    }
                } label: {
                    VStack(spacing: 3) {
                        ExperienceIcon(
                            kind: icon(item), size: 19, weight: selection == item ? 1.8 : 1.7)
                        Text(item.rawValue).font(.system(size: 9, weight: .medium)).tracking(0.05)
                            .lineLimit(1)
                    }.frame(maxWidth: .infinity).frame(height: 48)
                        .foregroundStyle(
                            selection == item
                                ? DesignTokens.colorNavigationSelectedText
                                : DesignTokens.colorNavigationInactiveText
                        )
                        .contentShape(Rectangle())

                }.buttonStyle(.plain).accessibilityAddTraits(selection == item ? .isSelected : [])
                    .accessibilityIdentifier("home-tab-" + item.symbol)
            }
        }.background {
            GeometryReader { geometry in
                let width = geometry.size.width / CGFloat(HomeSection.allCases.count)
                let position = HomeSection.allCases.firstIndex(of: selection) ?? 0
                RoundedRectangle(cornerRadius: DesignTokens.radiusSheet)
                    .fill(DesignTokens.colorNavigationSelected)
                    .overlay {
                        RoundedRectangle(cornerRadius: DesignTokens.radiusSheet)
                            .stroke(
                                DesignTokens.colorNavigationSelectedBorder,
                                lineWidth: DesignTokens.spaceS1)
                    }
                    .frame(width: width)
                    .offset(x: width * CGFloat(position))
                    .animation(
                        reduceMotion
                            ? nil : .easeInOut(duration: DesignTokens.motionDurationNavigation),
                        value: selection)
            }.accessibilityHidden(true).allowsHitTesting(false)
        }.padding(7).frame(height: 62)
            .background {
                Capsule().fill(.ultraThinMaterial).overlay {
                    Capsule().fill(Color(designHex: 0x27282e, opacity: 0.92))
                }
            }
            .overlay { Capsule().stroke(Color.white.opacity(0.082), lineWidth: 1) }
            .shadow(color: .black.opacity(0.33), radius: 14, y: 8)
            .padding(.horizontal, 16).padding(.bottom, 12)
            .animation(
                reduceMotion ? nil : .easeInOut(duration: DesignTokens.motionDurationNavigation),
                value: selection)

    }
    private func icon(_ item: HomeSection) -> ExperienceIcon.Kind {
        switch item {
        case .meetings: .calendar
        case .invitations: .envelope
        case .profile: .person
        }
    }
}
