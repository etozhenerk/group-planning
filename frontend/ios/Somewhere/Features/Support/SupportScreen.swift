import PhotosUI
import SwiftUI

struct SupportScreen: View {
    @State private var owner: SupportOwner
    @State private var screenshot: PhotosPickerItem?
    @State private var photoError: String?
    @State private var photoReading = false
    private let accepted: (() -> Void)?
    @State private var showHelp = false
    @State private var submission = false
    @State private var contentHeight = DesignTokens.spaceS0
    @State private var footerHeight = DesignTokens.spaceS0
    @State private var viewportHeight = DesignTokens.spaceS0
    @State private var pendingErrorReveal: String?
    @State private var keyboardFrame = CGRect.null
    @State private var keyboardAccessoryHeight = DesignTokens.targetIos
    private var pinned: Bool { contentHeight + footerHeight > viewportHeight && viewportHeight > 0 }
    private var footer: some View {
        SupportSubmissionFooter(owner: owner, pinned: pinned, reading: photoReading) {
            submission = true
        }
        .onGeometryChange(for: CGFloat.self) {
            $0.size.height
        } action: {
            footerHeight = $0
        }
    }
    @Environment(\.dismiss) private var dismiss
    init(api: APIClient, kind: SupportKind, screen: String, accepted: (() -> Void)? = nil) {
        self.accepted = accepted
        _owner = State(initialValue: SupportOwner(api: api, kind: kind, screen: screen))
    }
    var body: some View {
        Group {
            if showHelp {
                ServiceInformationScreen(document: .help, api: owner.api)
            } else {
                NavigationStack {
                    GeometryReader { geometry in
                        ScrollViewReader { proxy in
                            VStack(spacing: DesignTokens.spaceS0) {
                                ScrollView {
                                    VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                                        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                                            ServiceScreenHeader(
                                                title: owner.reference == nil
                                                    ? "Написать в поддержку" : "Поддержка",
                                                form: owner.reference == nil
                                            ) {
                                                if owner.reference != nil {
                                                    finish()
                                                } else {
                                                    dismiss()
                                                }
                                            }
                                            if let reference = owner.reference {
                                                SupportSuccess(reference: reference) { finish() }
                                            } else {
                                                SupportForm(
                                                    owner: owner, screenshot: $screenshot,
                                                    photoError: photoError,
                                                    keyboardAccessoryHeight:
                                                        $keyboardAccessoryHeight
                                                ).disabled(photoReading)
                                            }
                                        }.onGeometryChange(for: CGFloat.self) {
                                            $0.size.height
                                        } action: {
                                            contentHeight = $0
                                        }
                                        if !pinned && owner.reference == nil { footer }
                                    }
                                }.scrollDismissesKeyboard(.interactively)
                                    .accessibilityIdentifier("support-scroll")
                                if pinned && owner.reference == nil { footer }
                            }.onGeometryChange(for: CGFloat.self) {
                                $0.size.height
                            } action: {
                                viewportHeight = $0
                            }.padding(.bottom, keyboardOverlap(in: geometry))
                                .onChange(of: owner.fieldErrors) { _, _ in
                                    guard let target = errorTarget else {
                                        pendingErrorReveal = nil
                                        return
                                    }
                                    pendingErrorReveal =
                                        target == "support-screenshot-error" ? nil : target
                                    proxy.scrollTo(target, anchor: .center)
                                }
                                .onReceive(
                                    NotificationCenter.default.publisher(
                                        for: UIResponder.keyboardDidShowNotification)
                                ) { _ in
                                    guard let target = pendingErrorReveal else { return }
                                    proxy.scrollTo(target, anchor: .center)
                                    pendingErrorReveal = nil
                                }
                        }
                    }.background(AppPalette.background).toolbar(.hidden, for: .navigationBar)
                }
            }
        }.onReceive(
            NotificationCenter.default.publisher(
                for: UIResponder.keyboardWillChangeFrameNotification)
        ) { notification in
            keyboardFrame =
                (notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue)?
                .cgRectValue ?? .null
        }.onReceive(
            NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)
        ) { _ in
            keyboardFrame = .null
        }.task(id: submission) {
            if submission {
                await owner.submit()
                submission = false
            }
        }
        .task(id: screenshot) {
            guard let screenshot, !owner.sending, !owner.frozen else { return }
            photoReading = true
            defer { if self.screenshot == screenshot { photoReading = false } }
            do {
                guard let data = try await screenshot.loadTransferable(type: Data.self) else {
                    throw ClientFailure.invalidResponse
                }
                let photo = try MediaSelection.photo(data, name: "Скриншот.jpg")
                guard photo.data.count <= 5 * 1024 * 1024 else {
                    throw ClientFailure.invalidRequest
                }
                try Task.checkCancellation()
                guard !owner.sending, !owner.frozen else { return }
                owner.screenshot = photo
                photoError = nil
            } catch {
                if !(error is CancellationError) {
                    photoError = "Не удалось добавить скриншот. Выберите изображение до 5 МБ."
                }
            }
        }.onDisappear { owner.cancel() }
    }
    private var errorTarget: String? {
        ["description", "email", "screenshot"].first { owner.fieldErrors[$0] != nil }
            .map { "support-" + $0 + "-error" }
    }
    private func keyboardOverlap(in geometry: GeometryProxy) -> CGFloat {
        guard !keyboardFrame.isNull else { return 0 }
        // UIKit includes the prediction bar; SwiftUI's toolbar occupies the space above it.
        // Subtract only overlap left after the system's own keyboard-safe area adjustment.
        let boundary = keyboardFrame.minY - keyboardAccessoryHeight
        return max(0, geometry.frame(in: .global).maxY - boundary)
    }
    private func finish() {
        if let accepted { accepted() } else { showHelp = true }
    }
}
