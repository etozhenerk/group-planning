import SwiftUI

struct CreationFieldsView: View {
    let owner: CreationOwner
    @Environment(\.dynamicTypeSize) private var typeSize
    @FocusState private var focus: Field?
    @State private var dateSheet = false
    @State private var timeSheet = false
    private enum Field: Hashable { case title, description, place }
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Название")
                TextField(
                    "Название", text: text(\.title), prompt: Text("Например, ужин в пятницу"),
                    axis: .vertical
                )
                .lineLimit(1...3).focused($focus, equals: .title).meetingField()
                .accessibilityLabel("Название").accessibilityIdentifier("meeting-title")
            }
            if typeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: 18) {
                    day
                    clock
                }
            } else {
                HStack(alignment: .top, spacing: 14) {
                    day
                    clock
                }
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
                Text("Место")
                TextField(
                    "Место", text: text(\.place), prompt: Text("Адрес, название или ориентир"),
                    axis: .vertical
                )
                .lineLimit(1...3).focused($focus, equals: .place).meetingField().accessibilityLabel(
                    "Место")
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("Описание")
                TextField(
                    "Описание", text: text(\.description), prompt: Text("Что стоит знать друзьям"),
                    axis: .vertical
                )
                .lineLimit(3...6).focused($focus, equals: .description)
                .frame(minHeight: 72, alignment: .topLeading).meetingField()
                .accessibilityLabel("Описание")
            }
        }.designFont(13).disabled(!owner.editable)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Готово") {
                        focus = nil
                        SystemKeyboard.dismiss()
                    }.accessibilityIdentifier("creation-keyboard-done")
                }
            }
            .sheet(isPresented: $dateSheet) {
                MeetingDateSheet(draft: owner.value) { date in
                    owner.change {
                        $0.day = LocalMeetingTime.day(
                            date, zone: TimeZone(identifier: owner.value.timezone) ?? .gmt)
                    }
                }
            }.sheet(isPresented: $timeSheet) {
                MeetingTimeSheet(draft: owner.value) { date in
                    owner.change {
                        $0.clock = LocalMeetingTime.clock(
                            date, zone: TimeZone(identifier: owner.value.timezone) ?? .gmt)
                    }
                }
            }
    }
    private var day: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Дата")
            Button {
                focus = nil
                dateSheet = true
            } label: {
                HStack {
                    Text(MeetingLabels.day(owner.value.day)).lineLimit(1)
                    Spacer(minLength: 4)
                    ExperienceIcon(kind: .calendar, size: 13)
                }.frame(maxWidth: .infinity, alignment: .leading).meetingField()
            }.accessibilityLabel("Дата").accessibilityValue(MeetingLabels.day(owner.value.day))
        }
    }
    private var clock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Время")
            Button {
                focus = nil
                timeSheet = true
            } label: {
                HStack {
                    Text(MeetingLabels.clock(owner.value.clock)).lineLimit(1)
                    Spacer(minLength: 4)
                    Image(systemName: "clock").font(.system(size: 13))
                }.frame(maxWidth: .infinity, alignment: .leading).meetingField()
            }.accessibilityLabel("Время").accessibilityValue(MeetingLabels.clock(owner.value.clock))
            if owner.value.clock != nil {
                Button("Убрать время") {
                    owner.change {
                        $0.clock = nil
                        $0.repetition = nil
                    }
                }
                .frame(minHeight: 44).accessibilityIdentifier("clear-meeting-time")
            }
        }
    }
    private func text(_ key: WritableKeyPath<MeetingDraft, String>) -> Binding<String> {
        Binding(
            get: { owner.value[keyPath: key] },
            set: { value in owner.change { $0[keyPath: key] = value } })
    }
}
