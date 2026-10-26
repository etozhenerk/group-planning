import SwiftUI

@main
struct SomewhereApp: App {
    var body: some Scene {
        WindowGroup {
            AppRootView()
                #if SOMEWHERE_UI_TEST_HOST
                    .modifier(UITestCaptureContext())
                #endif
        }
    }
}
