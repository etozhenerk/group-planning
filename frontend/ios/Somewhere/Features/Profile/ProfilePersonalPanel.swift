import SwiftUI

struct ProfilePersonalPanel: View {
    let profile: AccountProfile

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            ProfilePersonalRow(title: "Логин", value: ProfilePersonalCopy.value(profile.login))
            ProfilePersonalRow(title: "Имя", value: ProfilePersonalCopy.value(profile.firstName))
            ProfilePersonalRow(title: "Фамилия", value: ProfilePersonalCopy.value(profile.lastName))
            ProfilePersonalRow(
                title: "Дата рождения", value: ProfilePersonalCopy.birthday(profile.birthday))
            ProfilePersonalRow(title: "Пол", value: ProfilePersonalCopy.sex(profile.sex))
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
            .background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
}
