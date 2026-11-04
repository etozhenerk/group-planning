import SwiftUI

struct AvatarSilhouette: Shape {
    func path(in rect: CGRect) -> Path {
        let headRadius: CGFloat = 4
        let bodyRadius: CGFloat = 8
        var path = Path()
        path.addEllipse(
            in: CGRect(
                x: 12 - headRadius, y: 8 - headRadius,
                width: headRadius * 2, height: headRadius * 2))
        path.move(to: CGPoint(x: 4, y: 22))
        path.addLine(to: CGPoint(x: 4, y: 20))
        path.addArc(
            center: CGPoint(x: 12, y: 20), radius: bodyRadius,
            startAngle: .degrees(180), endAngle: .degrees(0), clockwise: false)
        path.addLine(to: CGPoint(x: 20, y: 22))
        path.closeSubpath()
        return path.applying(CGAffineTransform(scaleX: rect.width / 24, y: rect.height / 24))
    }
}
