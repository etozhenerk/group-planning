import SwiftUI

struct ProfileField: View {
    let title: String
    let value: String
    var body: some View {
        HStack(spacing: 14) {
            ExperienceIcon(kind: title == "Почта" ? .envelope : .person)
                .foregroundStyle(AppPalette.muted).frame(width: 44, height: 44)
            VStack(alignment: .leading, spacing: 0) {
                Text(title).designFont(12).foregroundStyle(AppPalette.muted).frame(
                    minHeight: 18)
                Text(value).designFont(15).frame(minHeight: 22.5)
                    .fixedSize(horizontal: false, vertical: true)
            }.frame(maxWidth: .infinity, alignment: .leading)
        }.accessibilityElement(children: .combine)
    }
}
