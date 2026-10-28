import PhotosUI
import SwiftUI

struct SupportForm: View {
    @Bindable var owner: SupportOwner
    @Binding var screenshot: PhotosPickerItem?
    let photoError: String?
    let submit: () -> Void
    @FocusState private var focused: String?
    var body: some View {
        let screenshotTitle = owner.screenshot == nil ? "Добавить скриншот" : "Заменить скриншот"
        VStack(alignment: .leading, spacing: 21) {
            SupportTopics(owner: owner)
            VStack(alignment: .leading, spacing: 8) {
                Text("Ваше сообщение").designFont(13)
                TextEditor(text: $owner.description).designFont(13).padding(8).frame(height: 145)
                    .scrollContentBackground(.hidden).background(
                        Color(designHex: 0x25262c), in: RoundedRectangle(cornerRadius: 12)
                    )
                    .overlay {
                        RoundedRectangle(cornerRadius: 12).stroke(
                            .white.opacity(0.078), lineWidth: 1)
                    }
                    .overlay(alignment: .topLeading) {
                        if owner.description.isEmpty {
                            Text("Что вы делали и что пошло не так").designFont(13)
                                .foregroundStyle(.white.opacity(0.35))
                                .padding(14).allowsHitTesting(false).accessibilityHidden(true)
                        }
                    }.accessibilityIdentifier("support-description").focused(
                        $focused, equals: "description")
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Раздел").designFont(13)
                Menu {
                    ForEach(SupportSection.allCases) { section in
                        Button(section.title) { owner.screen = section.rawValue }
                    }
                } label: {
                    HStack {
                        Text(SupportSection(rawValue: owner.screen)?.title ?? "Другое")
                            .designFont(13)
                        Spacer()
                        Image(systemName: "chevron.down").font(.system(size: 10))
                    }.foregroundStyle(AppPalette.text).padding(.horizontal, 14)
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .background(
                            Color(designHex: 0x25262c), in: RoundedRectangle(cornerRadius: 12)
                        )
                        .overlay {
                            RoundedRectangle(cornerRadius: 12).stroke(
                                .white.opacity(0.078), lineWidth: 1)
                        }
                }.accessibilityLabel("Раздел")
            }
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Почта для ответа").designFont(13)
                    Spacer()
                    Text("Необязательно").designFont(10).foregroundStyle(AppPalette.muted)
                }
                TextField("you@example.com", text: $owner.email).designFont(13).padding(14)
                    .textContentType(.emailAddress).keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never).autocorrectionDisabled()
                    .background(Color(designHex: 0x25262c), in: RoundedRectangle(cornerRadius: 12))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12).stroke(
                            .white.opacity(0.078), lineWidth: 1)
                    }
                    .focused($focused, equals: "email").accessibilityLabel(
                        "Почта для ответа (необязательно)")
            }
            PhotosPicker(selection: $screenshot, matching: .images) {
                HStack(spacing: 13) {
                    ExperienceIcon(kind: .photo, size: 23).foregroundStyle(AppPalette.accent)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(screenshotTitle)
                            .designFont(12, weight: .medium)
                        Text("PNG, JPG или WebP · до 5 МБ").designFont(11).foregroundStyle(
                            AppPalette.muted)
                    }
                    Spacer()
                }.padding(16).overlay {
                    RoundedRectangle(cornerRadius: 15).stroke(
                        .white.opacity(0.15), style: StrokeStyle(lineWidth: 1, dash: [5, 4]))
                }
            }.buttonStyle(.plain)
            if let photo = owner.screenshot {
                HStack(spacing: 12) {
                    if let image = UIImage(data: photo.data) {
                        Image(uiImage: image).resizable().scaledToFill().frame(
                            width: 52, height: 52
                        ).clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    Text(photo.name).designFont(11).lineLimit(2)
                    Spacer()
                    Button("Убрать") {
                        owner.screenshot = nil
                        screenshot = nil
                    }.designFont(12)
                }
            }
            if let photoError {
                Text(photoError).designFont(12).foregroundStyle(AppPalette.error)
            }
            Button {
                owner.diagnostics.toggle()
            } label: {
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: owner.diagnostics ? "checkmark.square.fill" : "square").font(
                        .system(size: 16)
                    ).foregroundStyle(AppPalette.accent)
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Приложить сведения об устройстве").designFont(12)
                        Text("Версия приложения и iOS. Без переписки и данных входа.").font(
                            .system(size: 10)
                        ).foregroundStyle(AppPalette.muted)
                        if owner.diagnostics {
                            Text("iOS \(UIDevice.current.systemVersion) · \(AppVersion.shortLabel)")
                                .designFont(10).foregroundStyle(AppPalette.muted)
                        }
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
            }.buttonStyle(.plain).accessibilityAddTraits(owner.diagnostics ? .isSelected : [])
                .accessibilityLabel("Приложить сведения об устройстве").accessibilityValue(
                    owner.diagnostics ? "1" : "0")
            ForEach(owner.fieldErrors.keys.sorted(), id: \.self) { field in
                Text(owner.fieldErrors[field] ?? "Проверьте поле").designFont(12)
                    .foregroundStyle(AppPalette.error)
            }
            if let problem = owner.problem {
                Text(problem).designFont(12).foregroundStyle(AppPalette.error)
            }
            Rectangle().fill(AppPalette.border).frame(height: 1)
            Button {
                focused = nil
                submit()
            } label: {
                Group {
                    if owner.sending {
                        ProgressView()
                    } else {
                        Text("Отправить").designFont(14, weight: .semibold)
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 46).foregroundStyle(AppPalette.actionText)
                .background(AppPalette.action, in: RoundedRectangle(cornerRadius: 13))
            }.disabled(owner.sending)
            NavigationLink("Политика конфиденциальности") {
                ServiceInformationScreen(document: .privacy, api: owner.api)
            }.designFont(10)
        }.padding(.horizontal, 17).padding(.vertical, 20)
            .background(Color(designHex: 0x2d2e35), in: RoundedRectangle(cornerRadius: 22))
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Готово") { focused = nil }
                        .accessibilityIdentifier("support-keyboard-done")
                }
            }
    }
}
