import SwiftUI

/// The 24-point outline icons from the approved refresh assets.
struct ExperienceIcon: View {
    enum Kind {
        case calendar, envelope, person, list, plus, close, pin, crown, lock, back, smile, send,
            photo, file, share, more, grid, download
    }
    let kind: Kind
    var size: CGFloat = 21
    var weight: CGFloat = 1.7
    var body: some View {
        Group {
            if kind == .smile {
                Image("ComposerSmile").resizable()
            } else {
                drawing.stroke(
                    style: StrokeStyle(lineWidth: weight, lineCap: .round, lineJoin: .round))
            }
        }
        .frame(width: 24, height: 24).scaleEffect(size / 24).frame(width: size, height: size)
        .accessibilityHidden(true)
    }
    private var drawing: Path {
        Path { p in
            func line(_ points: CGPoint...) {
                guard let first = points.first else { return }
                p.move(to: first)
                for point in points.dropFirst() { p.addLine(to: point) }
            }
            switch kind {
            case .calendar:
                p.addRoundedRect(
                    in: CGRect(x: 3, y: 5, width: 18, height: 16),
                    cornerSize: CGSize(width: 3, height: 3))
                line(CGPoint(x: 7, y: 3), CGPoint(x: 7, y: 7))
                line(CGPoint(x: 17, y: 3), CGPoint(x: 17, y: 7))
                line(CGPoint(x: 3, y: 11), CGPoint(x: 21, y: 11))
            case .envelope:
                p.addRoundedRect(
                    in: CGRect(x: 3, y: 5, width: 18, height: 14),
                    cornerSize: CGSize(width: 3, height: 3))
                line(CGPoint(x: 3, y: 7), CGPoint(x: 12, y: 13), CGPoint(x: 21, y: 7))
            case .person:
                p.addEllipse(in: CGRect(x: 8, y: 4, width: 8, height: 8))
                p.move(to: CGPoint(x: 4, y: 21))
                p.addLine(to: CGPoint(x: 4, y: 18))
                p.addCurve(
                    to: CGPoint(x: 20, y: 18), control1: CGPoint(x: 4, y: 9),
                    control2: CGPoint(x: 20, y: 9))
                p.addLine(to: CGPoint(x: 20, y: 21))
            case .list:
                for y in [6.0, 12, 18] {
                    line(CGPoint(x: 8, y: y), CGPoint(x: 21, y: y))
                    line(CGPoint(x: 3, y: y), CGPoint(x: 3.1, y: y))
                }
            case .plus:
                line(CGPoint(x: 12, y: 5), CGPoint(x: 12, y: 19))
                line(CGPoint(x: 5, y: 12), CGPoint(x: 19, y: 12))
            case .close:
                line(CGPoint(x: 6, y: 6), CGPoint(x: 18, y: 18))
                line(CGPoint(x: 18, y: 6), CGPoint(x: 6, y: 18))
            case .back:
                line(CGPoint(x: 15, y: 5), CGPoint(x: 8, y: 12), CGPoint(x: 15, y: 19))
            case .pin:
                p.move(to: CGPoint(x: 19, y: 10))
                p.addCurve(
                    to: CGPoint(x: 12, y: 21), control1: CGPoint(x: 19, y: 15),
                    control2: CGPoint(x: 12, y: 21))
                p.addCurve(
                    to: CGPoint(x: 5, y: 10), control1: CGPoint(x: 12, y: 21),
                    control2: CGPoint(x: 5, y: 15))
                p.addArc(
                    center: CGPoint(x: 12, y: 10), radius: 7, startAngle: .degrees(180),
                    endAngle: .degrees(0), clockwise: false)
                p.addEllipse(in: CGRect(x: 10, y: 8, width: 4, height: 4))
            case .crown:
                line(
                    CGPoint(x: 3, y: 7), CGPoint(x: 7, y: 11), CGPoint(x: 12, y: 4),
                    CGPoint(x: 17, y: 11), CGPoint(x: 21, y: 7), CGPoint(x: 19, y: 19),
                    CGPoint(x: 5, y: 19), CGPoint(x: 3, y: 7))
                line(CGPoint(x: 6, y: 22), CGPoint(x: 18, y: 22))
            case .lock:
                p.addRoundedRect(
                    in: CGRect(x: 5, y: 10, width: 14, height: 11),
                    cornerSize: CGSize(width: 2, height: 2))
                p.move(to: CGPoint(x: 8, y: 10))
                p.addLine(to: CGPoint(x: 8, y: 7))
                p.addArc(
                    center: CGPoint(x: 12, y: 7), radius: 4, startAngle: .degrees(180),
                    endAngle: .degrees(0), clockwise: false)
                p.addLine(to: CGPoint(x: 16, y: 10))
            case .smile: break
            case .send:
                line(CGPoint(x: 12, y: 19), CGPoint(x: 12, y: 5))
                line(CGPoint(x: 6, y: 11), CGPoint(x: 12, y: 5), CGPoint(x: 18, y: 11))
            case .photo:
                p.addRoundedRect(
                    in: CGRect(x: 3, y: 3, width: 18, height: 18),
                    cornerSize: CGSize(width: 3, height: 3))
                p.addEllipse(in: CGRect(x: 7, y: 6, width: 4, height: 4))
                line(
                    CGPoint(x: 3, y: 17), CGPoint(x: 9, y: 11), CGPoint(x: 13, y: 15),
                    CGPoint(x: 17, y: 11), CGPoint(x: 21, y: 15))
            case .more:
                for x in [4.0, 11, 18] {
                    p.addEllipse(in: CGRect(x: x, y: 11, width: 2, height: 2))
                }
            case .share:
                line(CGPoint(x: 12, y: 16), CGPoint(x: 12, y: 3))
                line(CGPoint(x: 8, y: 7), CGPoint(x: 12, y: 3), CGPoint(x: 16, y: 7))
                p.move(to: CGPoint(x: 5, y: 13))
                p.addLine(to: CGPoint(x: 5, y: 19))
                p.addQuadCurve(to: CGPoint(x: 7, y: 21), control: CGPoint(x: 5, y: 21))
                p.addLine(to: CGPoint(x: 17, y: 21))
                p.addQuadCurve(to: CGPoint(x: 19, y: 19), control: CGPoint(x: 19, y: 21))
                p.addLine(to: CGPoint(x: 19, y: 13))
            case .download:
                line(CGPoint(x: 12, y: 15), CGPoint(x: 12, y: 3))
                line(CGPoint(x: 7, y: 10), CGPoint(x: 12, y: 15), CGPoint(x: 17, y: 10))
                p.move(to: CGPoint(x: 21, y: 15))
                p.addLine(to: CGPoint(x: 21, y: 19))
                p.addQuadCurve(to: CGPoint(x: 19, y: 21), control: CGPoint(x: 21, y: 21))
                p.addLine(to: CGPoint(x: 5, y: 21))
                p.addQuadCurve(to: CGPoint(x: 3, y: 19), control: CGPoint(x: 3, y: 21))
                p.addLine(to: CGPoint(x: 3, y: 15))
            case .grid:
                for x in [3.0, 14] {
                    for y in [3.0, 14] {
                        p.addRoundedRect(
                            in: CGRect(x: x, y: y, width: 7, height: 7),
                            cornerSize: CGSize(width: 1, height: 1))
                    }
                }
            case .file:
                line(
                    CGPoint(x: 14, y: 3), CGPoint(x: 20, y: 9), CGPoint(x: 20, y: 21),
                    CGPoint(x: 4, y: 21), CGPoint(x: 4, y: 3), CGPoint(x: 14, y: 3),
                    CGPoint(x: 14, y: 9), CGPoint(x: 20, y: 9))
            }
        }
    }
}
