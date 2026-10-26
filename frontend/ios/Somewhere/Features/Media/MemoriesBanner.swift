import SwiftUI

struct MemoriesBanner: View {
    let owner: MemoriesOwner
    @State private var presented = false
    @State private var adding = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        Button {
            if owner.loaded && owner.photos.isEmpty { adding = true } else { presented = true }
        } label: {
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("После встречи").font(.system(size: 10)).foregroundStyle(
                        Color(designHex: 0xc7bace)
                    ).padding(.bottom, 4)
                    Text(owner.photos.isEmpty ? "Как всё прошло?" : "Вайб встречи").font(
                        .system(size: 21, weight: .bold))
                    HStack(spacing: 14) {
                        Text(owner.photos.isEmpty ? "Добавить фото" : "Открыть вайб")
                        Text(owner.photos.isEmpty ? "＋" : "→")
                    }.font(.system(size: 11, weight: .semibold)).foregroundStyle(
                        Color(designHex: 0x28232b)
                    )
                    .padding(.horizontal, 11).padding(.vertical, 8)
                    .background(Color(designHex: 0xe5dbe9), in: RoundedRectangle(cornerRadius: 11))
                    .padding(.top, 12)
                }
                Spacer(minLength: 0)
                if owner.photos.isEmpty {
                    Text("✦").font(.system(size: 68)).foregroundStyle(Color(designHex: 0xcbb7dc))
                        .rotationEffect(.degrees(reduceMotion ? 0 : 12)).padding(.trailing, 15)
                } else {
                    ZStack(alignment: .trailing) {
                        ForEach(Array(owner.photos.prefix(3).enumerated()), id: \.element.id) {
                            index, photo in
                            PrivatePhotoView(media: photo, session: owner.session).frame(
                                width: 65, height: 82
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 6)).padding(3)
                            .background(
                                Color(designHex: 0xd4c9d1), in: RoundedRectangle(cornerRadius: 9)
                            )
                            .rotationEffect(.degrees(reduceMotion ? 0 : [14.0, 3, -10][index]))
                            .offset(x: CGFloat(-index * 20)).shadow(
                                color: .black.opacity(0.27), radius: 6, y: 5)
                        }
                    }.frame(width: 115, height: 105).padding(.trailing, -16).accessibilityHidden(
                        true)
                }
            }.padding(.horizontal, 17).padding(.vertical, 16).frame(
                maxWidth: .infinity, minHeight: 142
            )
            .background(Color(designHex: 0x3a3540), in: RoundedRectangle(cornerRadius: 19))
            .overlay {
                RoundedRectangle(cornerRadius: 19).stroke(
                    AppPalette.accent.opacity(0.13), lineWidth: 1)
            }
        }.buttonStyle(.plain).padding(.horizontal, 14).padding(.top, 14)
            .fullScreenCover(isPresented: $presented) { MemoriesScreen(owner: owner) }
            .sheet(isPresented: $adding, onDismiss: { Task { await owner.load() } }) {
                MediaPickerPanel(owner: owner.transfer, photosOnly: true)
            }
            .task { await owner.load() }
    }
}
