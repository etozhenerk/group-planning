import SwiftUI

struct OnboardingArtwork: View {
    let slide: OnboardingSlide
    var body: some View {
        GeometryReader { geometry in
            let width = DesignTokens.componentMobileOnboardingArtworkReferenceWidth
            let height =
                slide == .conversation || slide == .task
                ? DesignTokens.componentMobileOnboardingTallArtworkHeight
                : DesignTokens.componentMobileOnboardingArtworkHeight
            let scale = min(1, geometry.size.width / width)
            Group {
                if slide == .meetings {
                    artwork.accessibilityElement(children: .contain)
                } else {
                    artwork.allowsHitTesting(false)
                        .accessibilityElement(children: .ignore).accessibilityLabel(
                            slide.exampleLabel)
                }
            }
            .environment(\.dynamicTypeSize, .medium)
            .frame(width: width, height: height)
            .scaleEffect(scale)
            .frame(width: geometry.size.width, height: geometry.size.height)
        }
    }
    @ViewBuilder private var artwork: some View {
        switch slide {
        case .invitation: InvitationExample()
        case .meetings: PlansExample()
        case .conversation: ConversationExample()
        case .date: DateExample()
        case .poll: PollExample()
        case .task: TaskExample()
        case .album: OnboardingAlbumExample()
        case .plans: OnboardingMeetingPreview(title: "Ваша первая встреча", first: true)
        }
    }
}
