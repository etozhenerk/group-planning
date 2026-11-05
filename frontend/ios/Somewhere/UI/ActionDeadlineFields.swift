import SwiftUI

struct ActionDeadlineFields: View {
    @Binding var selection: Date
    let zone: TimeZone
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
            Divider().overlay(DesignTokens.colorLine)
                .padding(.bottom, DesignTokens.componentMobileFormSectionGap)
            Text("Окончание опроса").designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                DesignTokens.colorMuted)
            let layout =
                typeSize > .large
                ? AnyLayout(VStackLayout(spacing: DesignTokens.componentMobileFormTwoFieldGap))
                : AnyLayout(HStackLayout(spacing: DesignTokens.componentMobileDecisionDeadlineGap))
            layout {
                ActionDateField(
                    title: "Дата", selection: $selection, zone: zone, required: true,
                    omitWeekday: true)
                ActionDateField(
                    title: "Время", selection: $selection, zone: zone, required: true,
                    timeOnly: true)
            }
            Text(
                zone.identifier == "Europe/Moscow"
                    ? "По московскому времени"
                    : zone.localizedName(for: .generic, locale: Locale(identifier: "ru_RU"))
                        ?? zone.identifier
            )
            .designFont(DesignTokens.typographySizeCaption).foregroundStyle(DesignTokens.colorMuted)
        }
    }
}
