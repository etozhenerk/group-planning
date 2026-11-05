import SwiftUI

struct PlacePollFormFields: View {
    let form: PlacePollFormOwner
    private enum Field { case place, explanation }
    @FocusState private var focused: Field?
    var body: some View {
        @Bindable var form = form
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            RequiredFieldLabel(title: "Новое место", required: true)
                .designFont(DesignTokens.typographySizeSmall, weight: .medium)
            TextField("Название и адрес", text: $form.place, axis: .vertical)
                .lineLimit(2...4).frame(
                    minHeight: DesignTokens.componentMobileFieldTextAreaMinimumHeight
                        - DesignTokens.spaceS20
                )
                .modifier(
                    CreationFieldModifier(
                        invalid: form.placeError != nil,
                        cornerRadius: DesignTokens.radiusControl, insetInline: DesignTokens.spaceS12
                    )
                )
                .focused($focused, equals: .place).accessibilityIdentifier("place-poll-place")
            if let error = form.placeError { CreationFieldHint(text: error) }
        }.disabled(!form.operation.editable)
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            Text("Почему здесь").designFont(DesignTokens.typographySizeSmall, weight: .medium)
            TextField("Что вам нравится в этом месте", text: $form.explanation, axis: .vertical)
                .lineLimit(3...8)
                .modifier(
                    CreationFieldModifier(
                        invalid: form.explanationError != nil,
                        cornerRadius: DesignTokens.radiusControl, insetInline: DesignTokens.spaceS12
                    )
                )
                .focused($focused, equals: .explanation).accessibilityIdentifier(
                    "place-poll-explanation")
            if let error = form.explanationError { CreationFieldHint(text: error) }
        }.disabled(!form.operation.editable)
            .onChange(of: form.validationAttempt) { _, _ in
                if form.placeError != nil {
                    focused = .place
                } else if form.explanationError != nil {
                    focused = .explanation
                }
            }
    }
}
