import SwiftUI

struct SignInProblemModifier: ViewModifier {
    let signIn: YandexSignIn?
    var active = true

    func body(content: Content) -> some View {
        content.alert(
            "Не удалось войти",
            isPresented: Binding(
                get: { active && signIn?.problem != nil },
                set: { if !$0 && active { signIn?.dismissProblem() } }
            )
        ) {
            Button("Понятно", role: .cancel) { signIn?.dismissProblem() }
        } message: {
            Text(signIn?.problem ?? "")
        }
    }
}
