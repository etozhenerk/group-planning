import SwiftUI

struct OnboardingArtwork: View {
    let slide: OnboardingSlide
    var body: some View {
        GeometryReader { geometry in
            let scale = min(1, min(geometry.size.width / 330, geometry.size.height / 330))
            ZStack {
                Ellipse().fill(AppPalette.accent.opacity(0.10))
                    .frame(width: 240, height: 200).blur(radius: 42)
                Group {
                    switch slide {
                    case .invitation: InvitationExample()
                    case .conversation: ConversationExample()
                    case .poll: PollExample()
                    case .task: TaskExample()
                    case .plans: PlansExample()
                    }
                }.frame(maxWidth: 330)
            }
            .frame(width: 330, height: 330).scaleEffect(scale)
            .frame(width: geometry.size.width, height: geometry.size.height)
        }
        .accessibilityElement(children: .ignore).accessibilityLabel(slide.exampleLabel)
    }
}
