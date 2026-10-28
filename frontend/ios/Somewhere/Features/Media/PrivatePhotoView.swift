import SwiftUI

struct PrivatePhotoView: View {
    let media: MeetingMedia
    var fitting = false
    var onAspect: ((CGFloat) -> Void)?
    var onFailure: (() -> Void)?
    var retryID: UUID?
    @State private var owner: MediaContentOwner
    @State private var reloadID = UUID()
    init(
        media: MeetingMedia, session: SessionStore, fitting: Bool = false,
        onAspect: ((CGFloat) -> Void)? = nil,
        onFailure: (() -> Void)? = nil, retryID: UUID? = nil
    ) {
        self.media = media
        self.fitting = fitting
        self.onAspect = onAspect
        self.onFailure = onFailure
        self.retryID = retryID
        _owner = State(initialValue: MediaContentOwner(media: media, session: session))
    }
    var body: some View {
        GeometryReader { geometry in
            Group {
                if owner.current, let image = owner.image {
                    Image(uiImage: image).resizable().aspectRatio(
                        contentMode: fitting ? .fit : .fill)
                } else if owner.failed {
                    VStack(spacing: 12) {
                        Image(systemName: "photo")
                        Button("Повторить загрузку") { reloadID = UUID() }
                    }.font(.caption)
                } else {
                    Rectangle().fill(AppPalette.surface).overlay { ProgressView() }
                }
            }.frame(width: geometry.size.width, height: geometry.size.height).clipped()
        }.accessibilityLabel("Фото: " + media.fileName)
            .task(id: [reloadID, retryID ?? reloadID]) {
                await owner.load()
                if owner.current, let image = owner.image,
                    image.size.height > 0
                {
                    onAspect?(image.size.width / image.size.height)
                } else if owner.current, owner.failed {
                    onFailure?()
                }
            }
            .onChange(of: owner.current) { _, current in if !current { owner.clear() } }
            .onDisappear { owner.clear() }
    }
}
