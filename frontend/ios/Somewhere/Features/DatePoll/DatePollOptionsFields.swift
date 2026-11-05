import SwiftUI

struct DatePollOptionsFields: View {
    let form: DatePollFormOwner
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentMobileFormDateOptionGap) {
            RequiredFieldLabel(title: "Варианты даты", required: true)
                .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
            ForEach(Array(form.options.enumerated()), id: \.element.id) { index, option in
                VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
                    HStack(spacing: DesignTokens.componentMobileFormDateDeleteGap) {
                        ActionDateField(
                            title: "Вариант \(index + 1)",
                            selection: Binding(
                                get: { form.date(for: option.id, fallback: Date()) },
                                set: { form.setDate($0, for: option.id) }), hideLabel: true)
                        if form.dates.count > 2 {
                            Button {
                                form.removeDate(option.id)
                            } label: {
                                ChatIcon(
                                    kind: .close, size: DesignTokens.componentMobileFieldIconSize
                                )
                                .frame(
                                    width: DesignTokens.targetIos,
                                    height: DesignTokens.componentMobileFieldMinimumHeight)
                            }.accessibilityLabel("Удалить вариант \(index + 1)")
                        }
                    }
                    if let error = form.dateError(option.day) { CreationFieldHint(text: error) }
                }.disabled(!form.operation.editable)
            }
            if form.dates.count < 20 {
                Button {
                    form.addDate()
                } label: {
                    HStack(spacing: DesignTokens.spaceS8) {
                        ChatIcon(kind: .plus, size: DesignTokens.componentMobileFieldIconSize)
                        Text("Добавить дату")
                    }.frame(minHeight: DesignTokens.targetIos)
                }.foregroundStyle(DesignTokens.colorAccent).disabled(!form.operation.editable)
            }
        }
    }
}
