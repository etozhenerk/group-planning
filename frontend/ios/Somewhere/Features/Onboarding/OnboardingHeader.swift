import SwiftUI

struct OnboardingHeader: View {
    let last: Bool
    let busy: Bool
    let skip: () -> Void
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        Group {
            if typeSize >= .xxxLarge {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                    brand
                    HStack {
                        Spacer(minLength: DesignTokens.spaceS0)
                        skipButton
                    }
                }
            } else {
                HStack {
                    brand
                    Spacer(minLength: DesignTokens.spaceS16)
                    skipButton
                }
            }
        }.padding(.horizontal, DesignTokens.spaceS24).padding(.top, DesignTokens.spaceS8)
            .fixedSize(horizontal: false, vertical: true)
    }
    private var brand: some View {
        BrandWordmark(compact: true).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }
    private var skipButton: some View {
        OnboardingSkipButton(hidden: last, action: skip).disabled(busy)
    }
}
