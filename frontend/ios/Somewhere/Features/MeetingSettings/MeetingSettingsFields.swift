import SwiftUI

struct MeetingSettingsFields: View {
    let owner: MeetingSettingsOwner
    @ScaledMetric(relativeTo: .caption) private var labelSize = 13.0
    @ScaledMetric(relativeTo: .body) private var inputSize = 16.0
    @State private var dateSheet = false
    @State private var timeSheet = false
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            field("Название", key: \.title, identifier: "settings-title")
            field(
                "Описание · необязательно", key: \.description, identifier: "settings-description",
                lines: 3...6)
            Text("Описание увидят все, у кого есть приглашение.")
                .font(.caption).foregroundStyle(AppPalette.muted)
            VStack(alignment: .leading, spacing: 12) {
                Text("Дата и время").font(.system(size: labelSize)).foregroundStyle(
                    AppPalette.muted)
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
                Text("Время встречи · " + owner.value.timezone).font(.caption).foregroundStyle(
                    AppPalette.muted)
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
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.system(size: labelSize)).foregroundStyle(AppPalette.muted)
            TextField(
                label,
                text: Binding(
                    get: { owner.value[keyPath: key] },
                    set: { value in owner.change { $0[keyPath: key] = value } }),
                prompt: Text(label).foregroundStyle(AppPalette.muted), axis: .vertical
            )
            .font(.system(size: inputSize)).lineLimit(lines).padding(12)
            .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
            .background(Color("SettingsField"), in: RoundedRectangle(cornerRadius: 13))
            .accessibilityLabel(label).accessibilityIdentifier(identifier)
        }
    }
}
