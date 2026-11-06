import SwiftUI

struct SupportOptions: View {
    @Bindable var owner: SupportOwner
    let openPolicy: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            Toggle(isOn: $owner.diagnostics) {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                    Text("Данные об устройстве").designFont(
                        DesignTokens.typographySizeSmall, weight: .medium)
                    Text("Версия приложения и системы").designFont(DesignTokens.typographySizeLabel)
                        .foregroundStyle(DesignTokens.colorMuted)
                }
            }.toggleStyle(SupportSwitchStyle()).disabled(owner.sending || owner.frozen)
            NavigationLink("Политика конфиденциальности") {
                ServiceInformationScreen(document: .privacy, api: owner.api)
            }.simultaneousGesture(TapGesture().onEnded { openPolicy() })
                .designFont(DesignTokens.typographySizeLabel).underline()
                .foregroundStyle(DesignTokens.colorMuted)
                .frame(minHeight: DesignTokens.targetIos)
                .padding(.top, DesignTokens.spaceS16 + DesignTokens.spaceS2)
        }.padding(.bottom, DesignTokens.spaceS24)
    }
}
