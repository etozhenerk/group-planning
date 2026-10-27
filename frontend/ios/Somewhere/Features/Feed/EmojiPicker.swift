import SwiftUI

struct EmojiPicker: View {
    var privateData: PrivateData?
    var close: (() -> Void)?
    var delete: (() -> Void)?
    var selected: Set<String> = []
    let select: (String) -> Void
    @State private var query = ""
    @State private var category = ""
    @State private var recent: [String] = []
    @FocusState private var searchFocused: Bool
    private let symbols = ["😀", "🧑", "🐻", "🍎", "⚽️", "🚗", "💡", "❤️", "🏳️"]

    private var results: [EmojiCatalogEntry] {
        if query.isEmpty, category.isEmpty {
            return recent.compactMap { symbol in EmojiCatalog.entries.first { $0.emoji == symbol } }
        }
        return EmojiCatalog.entries.filter { entry in
            if query.isEmpty { return entry.categoryName == category }
            return entry.name.localizedCaseInsensitiveContains(query)
                || entry.keywords.contains { $0.localizedCaseInsensitiveContains(query) }
                || entry.emoji == query
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            HStack(spacing: DesignTokens.spaceS4) {
                HStack(spacing: DesignTokens.spaceS8) {
                    ChatIcon(kind: .search, size: DesignTokens.componentEmojiDockSearchIcon)
                    TextField("Поиск эмодзи", text: $query)
                        .designFont(DesignTokens.typographySizeSmall).focused($searchFocused)
                        .autocorrectionDisabled().textInputAutocapitalization(.never)
                        .accessibilityIdentifier("emoji-search")
                }.foregroundStyle(DesignTokens.colorMuted)
                    .padding(.horizontal, DesignTokens.componentEmojiDockSearchInset)
                    .frame(minHeight: DesignTokens.targetIos)
                    .background(
                        DesignTokens.colorBackground,
                        in: RoundedRectangle(
                            cornerRadius: DesignTokens.componentEmojiDockSearchRadius))
                if let delete {
                    Button(action: delete) {
                        ChatIcon(kind: .backspace)
                            .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                            .contentShape(Rectangle())
                    }.accessibilityLabel("Удалить предыдущий символ").accessibilityIdentifier(
                        "emoji-delete")
                }
                if let close {
                    Button(action: close) {
                        ChatIcon(kind: .close)
                            .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                            .contentShape(Rectangle())
                    }.accessibilityLabel("Закрыть выбор реакции").accessibilityIdentifier(
                        "reaction-picker-close")
                }
            }.padding(.horizontal, DesignTokens.componentEmojiDockToolbarInsetInline)
                .padding(.top, DesignTokens.componentEmojiDockToolbarInsetTop)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: DesignTokens.spaceS0) {
                    categoryButton("", label: "Недавние", symbol: "◷")
                    ForEach(Array(EmojiCatalog.categories.enumerated()), id: \.element) {
                        index, value in
                        categoryButton(value, label: value, symbol: symbols[index % symbols.count])
                    }
                }
            }.fixedSize(horizontal: false, vertical: true)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                }
            ScrollView {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                    Text(
                        query.isEmpty
                            ? (category.isEmpty ? "Недавние" : category) : "Результаты поиска"
                    )
                    .designFont(DesignTokens.typographySizeEmojiGroupLabel, relativeTo: .caption2)
                    .foregroundStyle(DesignTokens.colorMuted)
                    LazyVGrid(
                        columns: [
                            GridItem(
                                .adaptive(minimum: DesignTokens.targetIos),
                                spacing: DesignTokens.spaceS0)
                        ], spacing: DesignTokens.spaceS0
                    ) {
                        ForEach(results) { entry in
                            Button {
                                recent.removeAll { $0 == entry.emoji }
                                recent.insert(entry.emoji, at: 0)
                                privateData?.recentEmoji = Array(recent.prefix(24))
                                select(entry.emoji)
                            } label: {
                                Text(entry.emoji).designFont(DesignTokens.typographySizeEmojiChoice)
                                    .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                                    .contentShape(Rectangle())
                                    .background(
                                        selected.contains(entry.emoji)
                                            ? DesignTokens.colorSelectedSegment : .clear,
                                        in: RoundedRectangle(
                                            cornerRadius: DesignTokens
                                                .componentEmojiDockChoiceRadius)
                                    )
                                    .overlay {
                                        if selected.contains(entry.emoji) {
                                            RoundedRectangle(
                                                cornerRadius: DesignTokens
                                                    .componentEmojiDockChoiceRadius
                                            )
                                            .strokeBorder(
                                                DesignTokens.colorAccent,
                                                lineWidth: DesignTokens.spaceS1)
                                        }
                                    }
                            }.buttonStyle(ChatPressStyle()).accessibilityLabel(entry.name)
                                .accessibilityIdentifier("emoji-" + entry.emoji)
                                .accessibilityAddTraits(
                                    selected.contains(entry.emoji) ? .isSelected : [])
                        }
                    }
                    if results.isEmpty {
                        VStack(spacing: DesignTokens.spaceS4) {
                            Text(query.isEmpty ? "Недавних эмодзи пока нет" : "Ничего не найдено")
                            if !query.isEmpty {
                                Button("Очистить поиск") {
                                    query = ""
                                    searchFocused = true
                                }
                                .frame(minHeight: DesignTokens.targetIos)
                            }
                        }.designFont(DesignTokens.typographySizeSmall)
                            .foregroundStyle(DesignTokens.colorMuted).frame(maxWidth: .infinity)
                    }
                }.padding(.horizontal, DesignTokens.componentEmojiDockResultInsetInline)
                    .padding(.top, DesignTokens.componentEmojiDockResultInsetTop)
                    .padding(.bottom, DesignTokens.componentEmojiDockResultInsetBottom)
            }.scrollBounceBehavior(.basedOnSize).accessibilityIdentifier("emoji-results")
        }.background(DesignTokens.colorSurface).buttonStyle(ChatPressStyle())
            .onAppear {
                recent = privateData?.recentEmoji ?? []
                if recent.isEmpty { category = EmojiCatalog.categories.first ?? "" }
            }
    }

    private func categoryButton(_ value: String, label: String, symbol: String) -> some View {
        Button {
            category = value
            query = ""
        } label: {
            Text(symbol).designFont(DesignTokens.typographySizeEmojiCategory)
                .frame(minWidth: DesignTokens.targetIos, minHeight: DesignTokens.targetIos)
                .contentShape(Rectangle())
                .overlay(alignment: .bottom) {
                    if category == value {
                        Capsule().fill(DesignTokens.colorAccent)
                            .frame(
                                width: DesignTokens.targetIos / 2,
                                height: DesignTokens.componentEmojiDockCategoryIndicator)
                    }
                }
        }.accessibilityLabel(label).accessibilityAddTraits(category == value ? .isSelected : [])
    }
}
