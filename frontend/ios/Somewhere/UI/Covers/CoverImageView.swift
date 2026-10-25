import SwiftUI

struct CoverImageView: View {
    let source: CoverImageSource
    let session: SessionStore?
    let thumbnail: Bool
    let thumbnailSize: CGFloat
    @State private var owner: CoverImageOwner

    private struct LoadKey: Hashable {
        let source: CoverImageSource
        let lease: PrivateData.Lease?
    }

    init(
        source: CoverImageSource, api: APIClient? = nil, session: SessionStore? = nil,
        thumbnail: Bool = false, thumbnailSize: CGFloat = 64
    ) {
        self.source = source
        self.session = session
        self.thumbnail = thumbnail
        self.thumbnailSize = thumbnailSize
        _owner = State(initialValue: CoverImageOwner(api: api, session: session))
    }

    private var key: LoadKey {
        let meeting: UUID?
        if case .remote(let url, let id) = source, url.path.contains("/meetings/") {
            meeting = id
        } else {
            meeting = nil
        }
        return LoadKey(source: source, lease: try? session?.privateData.lease(for: meeting))
    }

    var body: some View {
        GeometryReader { geometry in
            Group {
                if owner.requestedSource == source, let image = owner.image {
                    Image(image, scale: 1, label: Text("Обложка встречи")).resizable()
                        .scaledToFill()
                        .accessibilityLabel("Обложка встречи").accessibilityIdentifier(
                            "meeting-cover")
                } else if owner.requestedSource != source || owner.loading {
                    CoverSkeleton()
                } else {
                    ZStack {
                        AppPalette.message
                        Image(systemName: "photo").foregroundStyle(AppPalette.muted)
                    }.accessibilityLabel("Фото недоступно").accessibilityIdentifier(
                        "cover-unavailable")
                }
            }.frame(width: geometry.size.width, height: geometry.size.height).clipped()
        }
        .aspectRatio(thumbnail ? 1 : 16.0 / 9.0, contentMode: .fit)
        .frame(width: thumbnail ? thumbnailSize : nil, height: thumbnail ? thumbnailSize : nil)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .task(id: key) { await owner.load(source) }
        .onDisappear { owner.clear() }
    }
}
