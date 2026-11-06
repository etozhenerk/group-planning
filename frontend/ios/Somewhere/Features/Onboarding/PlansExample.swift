import SwiftUI

struct PlansExample: View {
    @State private var calendar = false
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS16) {
            HStack(spacing: DesignTokens.spaceS6) {
                ForEach([false, true], id: \.self) { value in
                    Button(value ? "Календарь" : "Список") { calendar = value }
                        .font(.system(size: DesignTokens.typographySizeCaption))
                        .padding(.horizontal, DesignTokens.spaceS12)
                        .frame(minHeight: DesignTokens.targetIos)
                        .background(
                            calendar == value
                                ? DesignTokens.colorSelectedSegment : DesignTokens.colorSurface,
                            in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl)
                        )
                        .accessibilityAddTraits(calendar == value ? .isSelected : [])
                }
            }
            Group {
                if calendar {
                    OnboardingCalendarExample()
                } else {
                    VStack(spacing: DesignTokens.spaceS16) {
                        OnboardingMeetingPreview(photo: true)
                        OnboardingMeetingPreview(title: "Кофе в воскресенье", coffee: true)
                    }
                }
            }.allowsHitTesting(false).accessibilityHidden(true)
        }
    }
}
