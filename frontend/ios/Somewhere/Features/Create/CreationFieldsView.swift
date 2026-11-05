import SwiftUI

struct CreationFieldsView: View {
    let owner: CreationOwner
    @Environment(\.dynamicTypeSize) private var typeSize
    @FocusState private var focus: Field?
    @State private var dateSheet = false
    @State private var timeSheet = false
    private enum Field: Hashable { case title, description, place, day }
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS20) {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                RequiredFieldLabel(title: "Название", required: true)
                TextField(
                    "Название", text: text(\.title), prompt: Text("Ужин в пятницу"),
                    axis: .vertical
                )
                .lineLimit(1...3).focused($focus, equals: .title).modifier(
                    CreationFieldModifier(invalid: owner.titleError != nil)
                )
                .contentShape(Rectangle())
                .simultaneousGesture(TapGesture().onEnded { focus = .title })
                .accessibilityLabel("Название").accessibilityHint("Обязательное поле")
                .accessibilityIdentifier("meeting-title")
                if let error = owner.titleError { CreationFieldHint(text: error) }
            }
            .id("creation-title")
            if typeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS20) {
                    day
                    clock
                }
            } else {
                HStack(alignment: .top, spacing: DesignTokens.spaceS12 + DesignTokens.spaceS2) {
                    day
                    clock
                }
            }
            Text("Время можно уточнить позже · \(MeetingLabels.zone(owner.value.timezone))")
                .designFont(DesignTokens.typographySizeCaption)
                .foregroundStyle(DesignTokens.colorMuted)
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
            VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                Text("Место")
                TextField(
                    "Место", text: text(\.place), prompt: Text("Адрес, название или ориентир"),
                    axis: .vertical
                )
                .lineLimit(1...3).focused($focus, equals: .place).modifier(CreationFieldModifier())
                .accessibilityLabel(
                    "Место"
                )
                .contentShape(Rectangle())
                .simultaneousGesture(TapGesture().onEnded { focus = .place })
            }
            VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                Text("Описание")
                TextField(
                    "Описание", text: text(\.description), prompt: Text("Что стоит знать друзьям"),
                    axis: .vertical
                )
                .lineLimit(3...6).focused($focus, equals: .description)
                .frame(minHeight: 72, alignment: .topLeading).modifier(CreationFieldModifier())
                .accessibilityLabel("Описание")
                .contentShape(Rectangle())
                .simultaneousGesture(TapGesture().onEnded { focus = .description })
            }
        }.onChange(of: owner.validationAttempt) { _, _ in
            if owner.titleError != nil {
                focus = .title
            } else if owner.dayError != nil {
                focus = .day
            }
        }.designFont(DesignTokens.componentMobileCreationLabelSize, weight: .medium).disabled(
            !owner.editable
        )
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
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            RequiredFieldLabel(title: "Дата", required: true)
            Button {
                focus = nil
                dateSheet = true
            } label: {
                HStack {
                    Text(MeetingLabels.day(owner.value.day)).fixedSize(
                        horizontal: false, vertical: true)
                    Spacer(minLength: 4)
                    ExperienceIcon(kind: .calendar, size: 13)
                }.frame(maxWidth: .infinity, alignment: .leading).modifier(
                    CreationFieldModifier(invalid: owner.dayError != nil))
            }.focused($focus, equals: .day).accessibilityLabel("Дата").accessibilityHint(
                "Обязательное поле"
            ).accessibilityValue(
                MeetingLabels.day(owner.value.day))
            if let error = owner.dayError { CreationFieldHint(text: error) }
        }.id("creation-day")
    }
    private var clock: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            RequiredFieldLabel(title: "Время")
            Button {
                focus = nil
                timeSheet = true
            } label: {
                HStack {
                    Text(MeetingLabels.clock(owner.value.clock)).fixedSize(
                        horizontal: false, vertical: true)
                    Spacer(minLength: 4)
                    Image(systemName: "clock").font(.system(size: 13))
                }.frame(maxWidth: .infinity, alignment: .leading).modifier(CreationFieldModifier())
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
