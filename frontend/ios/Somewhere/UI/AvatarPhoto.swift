import SwiftUI

struct AvatarPhoto: View {
    let url: URL
    @Environment(\.avatarImages) private var images

    var body: some View {
        Group {
            if let image = images?.images[url] {
                Image(uiImage: image).resizable().scaledToFill()
            } else if images == nil {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color.clear
                }
            } else {
                Color.clear
            }
        }.task(id: url) { await images?.load(url) }
    }
}
