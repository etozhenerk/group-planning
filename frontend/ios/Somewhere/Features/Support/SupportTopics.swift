import SwiftUI

struct SupportTopics: View {
    let owner: SupportOwner
    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            Text("Тема обращения").designFont(12).foregroundStyle(AppPalette.muted)
                .frame(minHeight: 19.2)
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 7) { buttons }.fixedSize(horizontal: true, vertical: false)
                VStack(alignment: .leading, spacing: 7) { buttons }
            }
        }
    }
    private var buttons: some View {
        ForEach(SupportKind.allCases) { kind in
            Button {
                owner.kind = kind
            } label: {
                Text(kind.title).designFont(12).padding(.horizontal, 14).padding(.vertical, 8)
                    .frame(minHeight: 36)
                    .foregroundStyle(Color(designHex: owner.kind == kind ? 0xf1e7fa : 0xc6c0ce))
                    .background(
                        owner.kind == kind ? Color(designHex: 0x51465e) : .clear,
                        in: RoundedRectangle(cornerRadius: 11)
                    )
                    .contentShape(Rectangle().inset(by: -4))
                    .overlay {
                        RoundedRectangle(cornerRadius: 11).stroke(
                            .white.opacity(owner.kind == kind ? 0.2 : 0.07), lineWidth: 1)
                    }
            }.buttonStyle(.plain).accessibilityAddTraits(owner.kind == kind ? .isSelected : [])
        }
    }
}
