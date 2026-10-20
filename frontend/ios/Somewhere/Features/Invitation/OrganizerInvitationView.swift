import SwiftUI

struct OrganizerInvitationView: View {
    let owner: InvitationOwner
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let url = owner.shareURL, let title = owner.preview?.title {
                InvitationShareButton(url: url, title: title)
            } else if owner.shareProblem {
                Text("Не удалось получить ссылку приглашения").foregroundStyle(AppPalette.error)
                Button("Попробовать ещё раз", action: owner.reload)
            } else {
                ProgressView("Получаем ссылку…")
            }
        }
    }
}
