import PhotosUI
import SwiftUI

struct SupportScreen: View {
    @State private var owner: SupportOwner
    @State private var screenshot: PhotosPickerItem?
    @State private var photoError: String?
    @State private var submission = false
    @Environment(\.dismiss) private var dismiss
    init(api: APIClient, kind: SupportKind, screen: String) {
        _owner = State(initialValue: SupportOwner(api: api, kind: kind, screen: screen))
    }
    var body: some View {
        @Bindable var owner = owner
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Button {
                        dismiss()
                    } label: {
                        Text("← Назад").designFont(13).foregroundStyle(
                            AppPalette.accent
                        ).frame(minHeight: 44)
                    }.accessibilityLabel("Назад")
                    if let reference = owner.reference {
                        VStack(spacing: 18) {
                            Text("✓").designFont(32).foregroundStyle(
                                Color(designHex: 0xc3e0c8)
                            )
                            .frame(width: 76, height: 76).background(
                                Color(designHex: 0x384b42), in: RoundedRectangle(cornerRadius: 28)
                            )
                            .rotationEffect(.degrees(-8)).padding(.bottom, 12)
                            Text("Обращение принято").designFont(28, weight: .bold)
                            Text("Номер: " + reference).designFont(14).foregroundStyle(
                                AppPalette.muted)
                            Button("Готово") { dismiss() }.frame(minHeight: 44)
                        }.frame(maxWidth: .infinity).padding(.vertical, 65)
                    } else {
                        Text(
                            owner.kind == .idea
                                ? "Есть идея?"
                                : owner.kind == .question ? "Нужна помощь?" : "Что-то пошло не так?"
                        )
                        .designFont(28, weight: .bold).tracking(-0.9).padding(.top, 10)
                        Text(
                            owner.kind == .idea
                                ? "Расскажите, как сделать somewhere удобнее."
                                : owner.kind == .question
                                    ? "Расскажите, с чем нужна помощь."
                                    : "Расскажите, что случилось. Это поможет разобраться."
                        )
                        .designFont(13).lineSpacing(5).foregroundStyle(AppPalette.muted).frame(
                            minHeight: 22, alignment: .leading
                        )
                        .padding(.top, 12).padding(.bottom, 32)
                        SupportForm(owner: owner, screenshot: $screenshot, photoError: photoError) {
                            submission = true
                        }
                    }
                }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 28).disabled(
                    owner.sending)
            }.scrollDismissesKeyboard(.interactively)
                .accessibilityIdentifier("support-scroll").background(AppPalette.background)
                .toolbar(
                    .hidden, for: .navigationBar
                )
                .safeAreaInset(edge: .top, spacing: 0) { ServicePageHeader() }
        }.task(id: submission) {
            if submission {
                await owner.submit()
                submission = false
            }
        }
        .task(id: screenshot) {
            guard let screenshot else { return }
            do {
                guard let data = try await screenshot.loadTransferable(type: Data.self) else {
                    throw ClientFailure.invalidResponse
                }
                let photo = try MediaSelection.photo(data, name: "Скриншот.jpg")
                guard photo.data.count <= 5 * 1024 * 1024 else {
                    throw ClientFailure.invalidRequest
                }
                try Task.checkCancellation()
                owner.screenshot = photo
                photoError = nil
            } catch {
                if !(error is CancellationError) {
                    photoError = "Не удалось добавить скриншот. Выберите изображение до 5 МБ."
                }
            }
        }.onDisappear { owner.cancel() }
    }
}
