import SwiftUI

struct CreationFieldsView: View {
    let owner: CreationOwner
    @Environment(\.dynamicTypeSize) private var typeSize
    @FocusState private var focus: Field?
    @State private var dateSheet = false
    @State private var timeSheet = false
    private enum Field: Hashable { case title, description, place }
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Название").font(.subheadline.bold())
                TextField(
                    "Название", text: text(\.title),
                    prompt: Text(
                        typeSize.isAccessibilitySize ? "" : "Например, вечер настольных игр"
                    ).foregroundStyle(
                        AppPalette.muted),
                    axis: .vertical
                ).lineLimit(1...3)
                    .accessibilityLabel("Название").accessibilityIdentifier("meeting-title")
                    .focused($focus, equals: .title).meetingField()
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Описание · необязательно").font(.subheadline.bold())
                TextField(
                    "Описание", text: text(\.description),
                    prompt: Text(typeSize.isAccessibilitySize ? "" : "Что нужно знать друзьям")
                        .foregroundStyle(AppPalette.muted),
                    axis: .vertical
                )
                .accessibilityLabel("Описание").lineLimit(3...6).focused(
                    $focus, equals: .description
                ).meetingField()
                Text("Описание увидят все, у кого есть приглашение.").font(.caption)
                    .foregroundStyle(AppPalette.muted)
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Дата").font(.subheadline.bold())
                ActionButton(
                    title: MeetingLabels.day(owner.value.day), symbol: "calendar", primary: false,
                    disabled: !owner.editable
                ) {
                    focus = nil
                    dateSheet = true
                }.accessibilityLabel("Дата").accessibilityValue(MeetingLabels.day(owner.value.day))
                Text("Время").font(.subheadline.bold()).padding(.top, 12)
                ActionButton(
                    title: MeetingLabels.clock(owner.value.clock), symbol: "clock", primary: false,
                    disabled: !owner.editable
                ) {
                    focus = nil
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
            VStack(alignment: .leading, spacing: 8) {
                Text("Место · необязательно").font(.subheadline.bold())
                TextField(
                    "Место", text: text(\.place),
                    prompt: Text(typeSize.isAccessibilitySize ? "" : "Адрес, название или ориентир")
                        .foregroundStyle(AppPalette.muted),
                    axis: .vertical
                ).lineLimit(1...3)
                    .accessibilityLabel("Место").focused($focus, equals: .place).meetingField()
            }
        }
        .disabled(!owner.editable)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Готово") { focus = nil }
            }
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
            MeetingTimeSheet(draft: owner.value) { date in
                owner.change {
                    $0.clock = LocalMeetingTime.clock(
                        date, zone: TimeZone(identifier: owner.value.timezone) ?? .gmt)
                }
            }
        }
    }

    private func text(_ key: WritableKeyPath<MeetingDraft, String>) -> Binding<String> {
        Binding(
            get: { owner.value[keyPath: key] },
            set: { value in owner.change { $0[keyPath: key] = value } })
    }
}
