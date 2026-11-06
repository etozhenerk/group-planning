import PhotosUI
import SwiftUI

struct SupportForm: View {
    @Bindable var owner: SupportOwner
    @Binding var screenshot: PhotosPickerItem?
    let photoError: String?
    @Binding var keyboardAccessoryHeight: CGFloat
    @FocusState private var focused: String?
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                SupportTopics(owner: owner).padding(
                    .bottom, DesignTokens.spaceS24 + DesignTokens.spaceS2)
                VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS10) {
                        (Text("Сообщение ") + Text("*").foregroundColor(DesignTokens.colorError))
                            .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                        TextEditor(text: $owner.description).designFont(
                            DesignTokens.typographySizeMobileWebInput
                        )
                        .padding(DesignTokens.spaceS8)
                        .frame(
                            minHeight: DesignTokens.componentMobileSupportTextareaMinimumHeight,
                            maxHeight: DesignTokens.componentMobileSupportTextareaMinimumHeight
                        )
                        .scrollContentBackground(.hidden)
                        .background(
                            DesignTokens.colorSurface,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileServiceFieldRadius)
                        )
                        .overlay(alignment: .topLeading) {
                            if owner.description.isEmpty {
                                Text(placeholder).designFont(
                                    DesignTokens.typographySizeMobileWebInput
                                )
                                .foregroundStyle(DesignTokens.colorMuted).padding(
                                    (DesignTokens.spaceS12 + DesignTokens.spaceS2)
                                )
                                .allowsHitTesting(false).accessibilityHidden(true)
                            }
                        }.overlay { fieldBorder(owner.fieldErrors["description"] != nil) }
                        .accessibilityIdentifier("support-description").accessibilityLabel(
                            "Сообщение"
                        )
                        .focused($focused, equals: "description")
                    }
                    hint(
                        owner.fieldErrors["description"].map {
                            $0 == "length" ? "Проверьте сообщение — от 10 до 3000 символов." : $0
                        }, fallback: "От 10 до 3000 символов")
                }.id("support-description-error")
                SupportSectionPicker(owner: owner).padding(.bottom, DesignTokens.spaceS24)
                VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS10) {
                        Text("Почта для ответа").designFont(
                            DesignTokens.typographySizeSmall, weight: .semibold)
                        TextField("mail@example.com", text: $owner.email)
                            .designFont(DesignTokens.typographySizeMobileWebInput)
                            .padding(.horizontal, (DesignTokens.spaceS12 + DesignTokens.spaceS2))
                            .frame(minHeight: DesignTokens.componentMobileServiceFieldHeight)
                            .textContentType(.emailAddress).keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never).autocorrectionDisabled()
                            .background(
                                DesignTokens.colorSurface,
                                in: RoundedRectangle(
                                    cornerRadius: DesignTokens.componentMobileServiceFieldRadius)
                            )
                            .overlay { fieldBorder(owner.fieldErrors["email"] != nil) }
                            .focused($focused, equals: "email").accessibilityLabel(
                                "Почта для ответа")
                    }
                    hint(
                        owner.fieldErrors["email"].map { _ in
                            "Проверьте адрес почты или оставьте поле пустым."
                        }, fallback: "Оставьте почту, если нужен ответ")
                }.id("support-email-error")
                SupportAttachment(
                    owner: owner, selection: $screenshot,
                    problem: photoError
                        ?? (owner.fieldErrors["screenshot"] == nil
                            ? nil : "Не удалось добавить скриншот. Выберите изображение до 5 МБ.")
                )
                .id("support-screenshot-error").padding(
                    .bottom, DesignTokens.spaceS24 + DesignTokens.spaceS2)
            }.disabled(owner.sending || owner.frozen)
            SupportOptions(owner: owner) {
                focused = nil
                SystemKeyboard.dismiss()
            }
        }.padding(.horizontal, DesignTokens.spaceS20)
            .onChange(of: owner.fieldErrors) { _, fields in
                if fields["description"] != nil {
                    focused = "description"
                } else if fields["email"] != nil {
                    focused = "email"
                }
            }
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Готово") { focused = nil }.accessibilityIdentifier(
                        "support-keyboard-done"
                    )
                    .onGeometryChange(for: CGFloat.self) {
                        $0.size.height
                    } action: {
                        keyboardAccessoryHeight = max(DesignTokens.targetIos, $0)
                    }
                }
            }
    }
    private var placeholder: String {
        owner.kind == .problem
            ? "Что вы делали и что пошло не так"
            : owner.kind == .idea ? "Что вы хотите предложить" : "О чём хотите спросить"
    }
    private func fieldBorder(_ invalid: Bool) -> some View {
        RoundedRectangle(cornerRadius: DesignTokens.componentMobileServiceFieldRadius)
            .stroke(
                invalid ? DesignTokens.colorError : DesignTokens.colorBorderStrong,
                lineWidth: DesignTokens.spaceS1)
    }
    private func hint(_ error: String?, fallback: String) -> some View {
        Text(error ?? fallback).designFont(
            error == nil ? DesignTokens.typographySizeLabel : DesignTokens.typographySizeCaption
        )
        .foregroundStyle(error == nil ? DesignTokens.colorMuted : DesignTokens.colorError)
        .fixedSize(horizontal: false, vertical: true)
        .padding(.top, DesignTokens.spaceS8).padding(.bottom, DesignTokens.spaceS24)
    }
}
