import SwiftUI

struct HomeNavigation: View {
    @Binding var selection: HomeSection
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var highlight
    var body: some View {
        HStack(spacing: 0) {
            ForEach(HomeSection.allCases) { item in
                Button {
                    selection = item
                } label: {
                    VStack(spacing: 3) {
                        ExperienceIcon(
                            kind: icon(item), size: 19, weight: selection == item ? 1.8 : 1.7)
                        Text(item.rawValue).font(.system(size: 9, weight: .medium)).tracking(0.05)
                            .lineLimit(1)
                    }.frame(maxWidth: .infinity).frame(height: 48)
                        .foregroundStyle(Color(designHex: selection == item ? 0xeee5f7 : 0x92939f))
                        .contentShape(Rectangle())
                        .background {
                            if selection == item {
                                RoundedRectangle(cornerRadius: 24).fill(Color(designHex: 0x4a4554))
                                    .overlay {
                                        RoundedRectangle(cornerRadius: 24).stroke(
                                            Color.white.opacity(0.086), lineWidth: 1)
                                    }
                                    .matchedGeometryEffect(id: "selection", in: highlight)
                            }
                        }
                }.buttonStyle(.plain).accessibilityAddTraits(selection == item ? .isSelected : [])
                    .accessibilityIdentifier("home-tab-" + item.symbol)
            }
        }.padding(7).frame(height: 62)
            .background {
                Capsule().fill(.ultraThinMaterial).overlay {
                    Capsule().fill(Color(designHex: 0x27282e, opacity: 0.92))
                }
            }
            .overlay { Capsule().stroke(Color.white.opacity(0.082), lineWidth: 1) }
            .shadow(color: .black.opacity(0.33), radius: 14, y: 8)
            .padding(.horizontal, 16).padding(.bottom, 12)
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.26), value: selection)

    }
    private func icon(_ item: HomeSection) -> ExperienceIcon.Kind {
        switch item {
        case .meetings: .calendar
        case .invitations: .envelope
        case .profile: .person
        }
    }
}
