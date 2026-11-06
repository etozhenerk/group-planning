import SwiftUI

struct ServiceDocumentReader: View {
    let document: ServiceDocument
    let api: APIClient
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var indexOpen = false
    @State private var position = DesignTokens.spaceS0
    @State private var destination: Int?
    private var sections: [(String, String)] { Array(document.sections.dropFirst()) }
    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            HStack(spacing: DesignTokens.spaceS16) {
                PageBackButton { dismiss() }
                Spacer()
                Button {
                    indexOpen = true
                } label: {
                    HStack(spacing: DesignTokens.spaceS8) {
                        Image(systemName: "list.bullet").font(.system(size: DesignTokens.spaceS20))
                        Text("Содержание").designFont(DesignTokens.typographySizeSmall)
                    }
                    .frame(minHeight: DesignTokens.targetIos)
                    .foregroundStyle(DesignTokens.colorMuted)
                }.buttonStyle(.plain).accessibilityIdentifier("document-index-trigger")
            }.padding(.horizontal, DesignTokens.spaceS20).padding(.bottom, DesignTokens.spaceS12)
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                        Text(
                            document == .privacy
                                ? "Политика конфиденциальности" : "Cookie и данные браузера"
                        )
                        .designTokenFont(
                            DesignTokens.componentMobileAboutDocumentTitleSize,
                            weight: DesignTokens.componentMobileServiceTitleWeight,
                            relativeTo: .title
                        )
                        .tracking(-DesignTokens.componentMobileAboutDocumentTitleTracking)
                        .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(
                            .isHeader)
                        ServiceDocumentStatus()
                        ForEach(Array(sections.enumerated()), id: \.offset) { index, section in
                            VStack(
                                alignment: .leading,
                                spacing: DesignTokens.spaceS12 + DesignTokens.spaceS2
                            ) {
                                Text(section.0).designFont(
                                    DesignTokens.typographySizeCalendarTitleMobile,
                                    weight: .semibold
                                )
                                .accessibilityAddTraits(.isHeader).fixedSize(
                                    horizontal: false, vertical: true)
                                Text(section.1).designFont(DesignTokens.typographySizeButton)
                                    .lineSpacing(DesignTokens.spaceS6)
                                    .fixedSize(horizontal: false, vertical: true)
                            }.id(index).padding(
                                .bottom, DesignTokens.spaceS32 + DesignTokens.spaceS2)
                        }
                        NavigationLink {
                            ServiceInformationScreen(
                                document: document == .privacy ? .cookies : .privacy, api: api)
                        } label: {
                            Text(
                                document == .privacy
                                    ? "Cookie и данные браузера" : "Политика конфиденциальности"
                            )
                            .designFont(DesignTokens.typographySizeSmall).underline()
                            .foregroundStyle(DesignTokens.colorAccent)
                            .frame(minHeight: DesignTokens.targetIos)
                        }
                    }.padding(.horizontal, DesignTokens.spaceS20)
                        .padding(.top, DesignTokens.spaceS12 + DesignTokens.spaceS2)
                        .padding(.bottom, DesignTokens.spaceS40)
                        .background { SheetScrollPosition(offset: $position) }
                }.accessibilityIdentifier("service-information-scroll")
                    .onChange(of: destination) { _, value in
                        guard let value else { return }
                        withAnimation(
                            ChatMotion.animation(
                                DesignTokens.motionDurationCard, reduceMotion: reduceMotion)
                        ) {
                            proxy.scrollTo(value, anchor: .top)
                        }
                        destination = nil
                    }
            }
        }.sheet(isPresented: $indexOpen) {
            ServiceDocumentIndex(sections: sections) { index in
                indexOpen = false
                destination = index
            }
        }
    }
}
