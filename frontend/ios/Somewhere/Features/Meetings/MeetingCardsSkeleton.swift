import SwiftUI

struct MeetingCardsSkeleton: View {
    let label: String
    var body: some View {
        VStack(spacing: 35) {
            ForEach(0..<3) { index in
                VStack(alignment: .leading, spacing: 12) {
                    RoundedRectangle(cornerRadius: 4).frame(width: 150, height: 21)
                    RoundedRectangle(cornerRadius: 4).frame(width: 120, height: 13)
                    Spacer(minLength: 0)
                }.foregroundStyle(.white.opacity(0.09)).padding(.horizontal, 18).padding(.top, 26)
                    .frame(maxWidth: .infinity, minHeight: 145, maxHeight: 145, alignment: .leading)
                    .background(
                        index == 0 ? AppPalette.weekdayCard : AppPalette.weekendCard,
                        in: RoundedRectangle(cornerRadius: 20)
                    )
                    .overlay(alignment: .topLeading) {
                        RoundedRectangle(cornerRadius: 8).fill(AppPalette.surface).frame(
                            width: 160, height: 23
                        ).offset(x: 14, y: -11)
                    }
                    .overlay(alignment: .topTrailing) {
                        RoundedRectangle(cornerRadius: 16).fill(AppPalette.surface).frame(
                            width: 102, height: 101
                        )
                        .rotationEffect(.degrees(index == 0 ? 5 : -4)).offset(x: -13, y: -10)
                    }
                    .overlay(alignment: .bottomTrailing) {
                        HStack(spacing: -8) {
                            ForEach(0..<4) { _ in
                                Circle().fill(AppPalette.surface).frame(width: 32, height: 32)
                            }
                        }.offset(x: -13, y: 15)
                    }
            }
        }.padding(.top, 12).padding(.bottom, 17)
            .accessibilityElement(children: .ignore).accessibilityLabel(label)
    }
}
