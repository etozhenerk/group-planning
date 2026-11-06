import SwiftUI

struct SupportTopics: View {
    let owner: SupportOwner
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS10) {
            Text("Тема").designFont(DesignTokens.typographySizeSmall, weight: .semibold)
            HStack(spacing: DesignTokens.spaceS4) {
                ForEach([SupportKind.problem, .question, .idea]) { kind in
                    Button {
                        owner.kind = kind
                    } label: {
                        Text(kind.title).designFont(
                            DesignTokens.typographySizeCaption,
                            weight: owner.kind == kind ? .semibold : .regular
                        )
                        .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                        .foregroundStyle(
                            owner.kind == kind
                                ? DesignTokens.colorActionText : DesignTokens.colorMuted
                        )
                        .background(
                            owner.kind == kind ? DesignTokens.colorAction : .clear,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.spaceS10 + DesignTokens.spaceS1))
                    }.buttonStyle(.plain).accessibilityAddTraits(
                        owner.kind == kind ? .isSelected : [])
                }
            }.padding(DesignTokens.spaceS4)
                .background(
                    DesignTokens.colorSurface,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileServiceFieldRadius))
        }
    }
}
