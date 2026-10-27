import SwiftUI

struct MeetingSettingsFields: View {
    let owner: MeetingSettingsOwner
    @State private var dateSheet = false
    @State private var timeSheet = false
    @State private var width = DesignTokens.breakpointChatNarrowWidth
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentMobileFormGroupGap) {
            field("Название", key: \.title, identifier: "settings-title")
            field(
                "Описание", key: \.description, identifier: "settings-description",
                lines: 2...6)
            VStack(alignment: .leading, spacing: DesignTokens.componentMobileFormSectionGap) {
                Divider().overlay(DesignTokens.colorLine)
                let layout =
                    width < DesignTokens.breakpointChatNarrowWidth || typeSize.isAccessibilitySize
                    ? AnyLayout(VStackLayout(spacing: DesignTokens.componentMobileFormTwoFieldGap))
                    : AnyLayout(
                        HStackLayout(
                            alignment: .top, spacing: DesignTokens.componentMobileFormTwoFieldGap))
                layout {
                    VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
                        Text("Дата").designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                            DesignTokens.colorMuted)
                        SettingsPickerButton(
                            title: MeetingLabels.day(owner.value.day), symbol: "calendar"
                        ) { dateSheet = true }
                        .accessibilityLabel("Дата").accessibilityValue(
                            MeetingLabels.day(owner.value.day))
                    }
                    VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
                        Text("Время").designFont(DesignTokens.typographySizeCaption)
                            .foregroundStyle(DesignTokens.colorMuted)
                        SettingsPickerButton(
                            title: MeetingLabels.clock(owner.value.clock), symbol: "clock"
                        ) { timeSheet = true }
                        .accessibilityLabel("Время").accessibilityValue(
                            MeetingLabels.clock(owner.value.clock))
                    }
                }
                Text("Время необязательно · \(owner.value.timezone)").designFont(
                    DesignTokens.typographySizeCaption, relativeTo: .caption
                )
                .foregroundStyle(
                    DesignTokens.colorMuted)
            }
            if owner.needsTimeChoice {
                Picker(
                    "Повторяющееся время",
                    selection: Binding(
                        get: { owner.value.repetition },
                        set: { choice in owner.change { $0.repetition = choice } })
                ) {
                    Text("Выберите вариант").tag(MeetingDraft.Repetition?.none)
                    Text("Ранний — до перевода часов").tag(MeetingDraft.Repetition?.some(.earlier))
                    Text("Поздний — после перевода часов").tag(
                        MeetingDraft.Repetition?.some(.later))
                }.pickerStyle(.menu)
            }
            field("Место", key: \.place, identifier: "settings-place")
        }.disabled(!owner.editable)
            .onGeometryChange(for: CGFloat.self) {
                $0.size.width
            } action: {
                width = $0
            }
            .sheet(isPresented: $dateSheet) {
                MeetingDateSheet(draft: owner.value) { date in
                    owner.change {
                        $0.day = LocalMeetingTime.day(
                            date, zone: TimeZone(identifier: owner.value.timezone) ?? .gmt)
                    }
                }
            }
            .sheet(isPresented: $timeSheet) {
                MeetingTimeSheet(
                    draft: owner.value,
                    clear: {
                        owner.change {
                            $0.clock = nil
                            $0.repetition = nil
                        }
                    }
                ) { date in
                    owner.change {
                        $0.clock = LocalMeetingTime.clock(
                            date, zone: TimeZone(identifier: owner.value.timezone) ?? .gmt)
                    }
                }
            }
    }
    private func field(
        _ label: String, key: WritableKeyPath<MeetingDraft, String>, identifier: String,
        lines: ClosedRange<Int> = 1...3
    ) -> some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
            Text(label).designFont(DesignTokens.typographySizeCaption, relativeTo: .caption)
                .foregroundStyle(DesignTokens.colorMuted)
            TextField(
                label,
                text: Binding(
                    get: { owner.value[keyPath: key] },
                    set: { value in owner.change { $0[keyPath: key] = value } }),
                prompt: Text(""), axis: .vertical
            )
            .lineLimit(lines).actionField()
            .accessibilityLabel(label).accessibilityIdentifier(identifier)
        }
    }
}
