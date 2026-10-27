import SwiftUI

struct ActionDeadlineFields: View {
    @Binding var selection: Date
    let zone: TimeZone
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var width: CGFloat = DesignTokens.breakpointChatNarrowWidth

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
            Text("Опрос завершится").designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                DesignTokens.colorMuted)
            let layout =
                width < DesignTokens.breakpointChatNarrowWidth || typeSize > .large
                ? AnyLayout(VStackLayout(spacing: DesignTokens.componentMobileFormTwoFieldGap))
                : AnyLayout(HStackLayout(spacing: DesignTokens.componentMobileFormTwoFieldGap))
            layout {
                ActionDateField(
                    title: "Дата окончания", selection: $selection, zone: zone, hideLabel: true,
                    omitWeekday: true)
                ActionDateField(
                    title: "Время окончания", selection: $selection, zone: zone, hideLabel: true,
                    timeOnly: true)
            }
        }.onGeometryChange(for: CGFloat.self) {
            $0.size.width
        } action: {
            width = $0
        }
    }
}
