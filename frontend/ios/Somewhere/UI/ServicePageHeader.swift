import SwiftUI

struct ServicePageHeader: View {
    var symbolOnly = false
    var body: some View {
        HStack {
            if symbolOnly {
                Image("RefreshBrand").resizable().scaledToFit()
                    .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                    .accessibilityHidden(true)
            } else {
                BrandWordmark(compact: true).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
            }
            Spacer()
        }
        .padding(.horizontal, 20).padding(.top, 17).background(AppPalette.background)
    }
}
