import SwiftUI

struct PreparationTitleField: View {
    let form: PreparationFormOwner
    @FocusState private var focused: Bool
    var body: some View {
        @Bindable var form = form
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            RequiredFieldLabel(title: "Что нужно сделать", required: true).designFont(
                DesignTokens.typographySizeSmall, weight: .medium)
            TextField("Например, принести настолки", text: $form.title, axis: .vertical)
                .lineLimit(2...6).frame(
                    minHeight: DesignTokens.componentMobilePreparationTitleFieldMinimumHeight
                        - DesignTokens.spaceS24
                )
                .modifier(
                    CreationFieldModifier(
                        invalid: form.titleError != nil, cornerRadius: DesignTokens.radiusControl,
                        insetInline: DesignTokens.spaceS12)
                )
                .focused($focused).accessibilityIdentifier("preparation-title")
            if let error = form.titleError { CreationFieldHint(text: error) }
        }.disabled(!form.operation.editable)
            .onChange(of: form.validationAttempt) { _, _ in
                if form.titleError != nil { focused = true }
            }
    }
}
