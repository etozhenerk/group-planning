import SwiftUI

struct ServicePageHeader: View {
    var body: some View {
        HStack {
            BrandWordmark(compact: true).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
            Spacer()
        }
        .padding(.horizontal, 20).padding(.top, 17).background(AppPalette.background)
    }
}
