import SwiftUI

struct MeetingSettingsFields: View {
    let owner: MeetingSettingsOwner
    @State private var dateSheet = false
    @State private var timeSheet = false
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentActionFieldGap) {
            field("Название", key: \.title, identifier: "settings-title")
            field(
                "Описание · необязательно", key: \.description, identifier: "settings-description",
                lines: 3...6)
            Text("Описание увидят все, у кого есть приглашение.")
                .designFont(DesignTokens.typographySizeCaption, relativeTo: .caption)
                .foregroundStyle(DesignTokens.colorMuted)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
                Text("Дата и время").designFont(
                    DesignTokens.typographySizeSmall, relativeTo: .caption
                ).foregroundStyle(
                    DesignTokens.colorMuted)
                SettingsPickerButton(
                    title: MeetingLabels.day(owner.value.day), symbol: "calendar"
                ) {
                    dateSheet = true
                }.accessibilityLabel("Дата").accessibilityValue(MeetingLabels.day(owner.value.day))
                SettingsPickerButton(
                    title: MeetingLabels.clock(owner.value.clock), symbol: "clock"
                ) {
                    timeSheet = true
                }.accessibilityLabel("Время").accessibilityValue(
                    MeetingLabels.clock(owner.value.clock))
                if owner.value.clock != nil {
                    Button("Убрать время") {
                        owner.change {
                            $0.clock = nil
                            $0.repetition = nil
                        }
                    }.frame(minHeight: DesignTokens.targetIos).accessibilityIdentifier(
                        "clear-meeting-time")
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
            field("Место · необязательно", key: \.place, identifier: "settings-place")
        }.disabled(!owner.editable)
            .sheet(isPresented: $dateSheet) {
                MeetingDateSheet(draft: owner.value) { date in
                    owner.change {
                        $0.day = LocalMeetingTime.day(
                            date, zone: TimeZone(identifier: owner.value.timezone) ?? .gmt)
                    }
                }
            }
            .sheet(isPresented: $timeSheet) {
                MeetingTimeSheet(draft: owner.value) { date in
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
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            Text(label).designFont(DesignTokens.typographySizeSmall, relativeTo: .caption)
                .foregroundStyle(DesignTokens.colorMuted)
            TextField(
                label,
                text: Binding(
                    get: { owner.value[keyPath: key] },
                    set: { value in owner.change { $0[keyPath: key] = value } }),
                prompt: Text(label).foregroundStyle(DesignTokens.colorMuted), axis: .vertical
            )
            .lineLimit(lines).actionField()
            .accessibilityLabel(label).accessibilityIdentifier(identifier)
        }
    }
}
