import SwiftUI

struct ProfilePersonalPanel: View {
    let profile: AccountProfile
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            ProfilePersonalRow(title: "Логин", value: ProfilePersonalCopy.value(profile.login))
            ProfilePersonalRow(title: "Имя", value: ProfilePersonalCopy.value(profile.firstName))
            ProfilePersonalRow(title: "Фамилия", value: ProfilePersonalCopy.value(profile.lastName))
            ProfilePersonalRow(
                title: "Дата рождения", value: ProfilePersonalCopy.birthday(profile.birthday))
            ProfilePersonalRow(
                title: "Пол", value: ProfilePersonalCopy.sex(profile.sex), last: true)
        }
    }
}
