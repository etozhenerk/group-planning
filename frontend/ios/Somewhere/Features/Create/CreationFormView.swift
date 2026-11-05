import SwiftUI

struct CreationFormView: View {
    let owner: CreationOwner

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS20 + DesignTokens.spaceS2) {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                        PageBackButton(
                            label: "Вернуться к встречам",
                            enabled: !owner.busy && !owner.preparingCover,
                            action: owner.requestClose)
                        Text("Новая встреча")
                            .designFont(
                                DesignTokens.typographySizeMobileActionHeading, weight: .bold
                            )
                            .padding(.bottom, DesignTokens.spaceS12)
                        RequiredLegend(sentence: true)
                    }
                    CoverEditor(
                        value: owner.value.cover,
                        disabled: !owner.editable,
                        onBusy: { owner.preparingCover = $0 },
                        onChange: { cover in owner.change { $0.cover = cover } })
                    CreationFieldsView(owner: owner)
                }
                .padding(.horizontal, DesignTokens.spaceS20)
                .padding(.top, DesignTokens.spaceS0)
                .padding(.bottom, DesignTokens.spaceS12)
            }
            .scrollDismissesKeyboard(.interactively)
            .accessibilityIdentifier("create-form")
            .onChange(of: owner.validationAttempt) { _, _ in
                if owner.titleError != nil {
                    proxy.scrollTo("creation-title", anchor: .center)
                } else if owner.dayError != nil {
                    proxy.scrollTo("creation-day", anchor: .center)
                }
            }
            .safeAreaInset(edge: .bottom, spacing: DesignTokens.spaceS0) {
                CreationSubmissionFooter(owner: owner)
            }
        }
    }
}
