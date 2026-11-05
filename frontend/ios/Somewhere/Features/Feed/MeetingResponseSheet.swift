import SwiftUI

struct MeetingResponseSheet: View {
    let owner: FeedOwner

    var body: some View {
        ActionFormSheet(title: "Изменить ответ", dismissDisabled: owner.invitation.saving) {
            Button("← К деталям встречи") { owner.closeSheet() }
                .frame(minHeight: DesignTokens.targetIos).foregroundStyle(DesignTokens.colorAccent)
            Text("Если выбрать «Возможно» или «Не смогу», доступ к чату закроется.")
                .designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                    DesignTokens.colorMuted)
            RSVPFormView(owner: owner.invitation)
        }.onChange(of: owner.invitation.completedResponseID) { _, result in
            if result != nil { owner.sheets = [] }
        }
    }
}
