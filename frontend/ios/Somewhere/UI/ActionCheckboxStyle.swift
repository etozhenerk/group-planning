import SwiftUI

struct ActionCheckboxStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button {
            configuration.isOn.toggle()
        } label: {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                    .font(.system(size: 14)).foregroundStyle(AppPalette.accent)
                    .accessibilityHidden(true)
                configuration.label.designFont(15).fixedSize(horizontal: false, vertical: true)
                    .foregroundStyle(AppPalette.text)
            }.frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 2).contentShape(Rectangle().inset(by: -8))
        }.buttonStyle(.plain).accessibilityValue(configuration.isOn ? "1" : "0")
            .accessibilityAddTraits(configuration.isOn ? .isSelected : [])
    }
}
