import SwiftUI

struct DraftDiscardContent: View {
    let explanation: String
    let stay: () -> Void
    let leave: () -> Void
    var body: some View {
        Text(explanation).designFont(DesignTokens.typographySizeSmall)
            .foregroundStyle(DesignTokens.colorMuted)
        ActionFormButton(title: "Продолжить редактирование", action: stay)
        Button("Выйти без сохранения", action: leave)
            .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
            .foregroundStyle(DesignTokens.colorMuted)
    }
}
