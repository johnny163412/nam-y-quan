import Foundation
import AppKit
import CoreGraphics
import CoreImage

let root = "/Users/thiagop/.gemini/antigravity/scratch/nam-y-quan"
let outPath = "\(root)/public/art/meridians/meridian-back.jpg"
let ciContext = CIContext(options: nil)

func saveJPEG(_ img: CGImage, to path: String, quality: Double = 0.89) {
    let rep = NSBitmapImageRep(cgImage: img)
    guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality]) else {
        fatalError("JPEG encode failed")
    }
    try! data.write(to: URL(fileURLWithPath: path))
}

func makeTopDownCanvas(w: Int, h: Int) -> CGContext {
    let ctx = CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.interpolationQuality = .high
    // Flip vertically so (x, y) is 1:1 top-down with SVG viewBox * 2 (500x888)
    ctx.translateBy(x: 0, y: CGFloat(h))
    ctx.scaleBy(x: 1, y: -1)
    return ctx
}

func drawSoftWash(_ ctx: CGContext, cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, r: CGFloat, g: CGFloat, b: CGFloat, alpha: CGFloat) {
    let grad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: r, green: g, blue: b, alpha: alpha),
            CGColor(red: r, green: g, blue: b, alpha: alpha * 0.45),
            CGColor(red: r, green: g, blue: b, alpha: 0.0)
        ] as CFArray,
        locations: [0.0, 0.55, 1.0]
    )!
    ctx.saveGState()
    ctx.translateBy(x: cx, y: cy)
    ctx.scaleBy(x: 1.0, y: ry / max(1, rx))
    ctx.drawRadialGradient(grad, startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: rx, options: [])
    ctx.restoreGState()
}

let w = 500
let h = 888
let ctx = makeTopDownCanvas(w: w, h: h)

// 1. Aged Ivory Margin & Inner Dó Silk Scroll Paper (matching meridian-front.jpg)
ctx.setFillColor(CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 1.0))
ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
ctx.setFillColor(CGColor(red: 0.945, green: 0.898, blue: 0.796, alpha: 1.0))
ctx.fill(CGRect(x: 28, y: 28, width: 444, height: 832))
drawSoftWash(ctx, cx: 250, cy: 420, rx: 210, ry: 360, r: 0.975, g: 0.945, b: 0.875, alpha: 0.55)

// Subtle silk paper fiber flecks
srand48(777)
ctx.setLineWidth(0.7)
for _ in 0..<180 {
    let x = CGFloat(drand48()) * CGFloat(w)
    let y = CGFloat(drand48()) * CGFloat(h)
    let len = CGFloat(drand48()) * 12 + 3
    let ang = CGFloat(drand48()) * .pi
    ctx.setStrokeColor(CGColor(red: 0.56, green: 0.44, blue: 0.28, alpha: 0.032))
    ctx.move(to: CGPoint(x: x, y: y))
    ctx.addLine(to: CGPoint(x: x + cos(ang) * len, y: y + sin(ang) * len))
    ctx.strokePath()
}

ctx.setLineCap(.round)
ctx.setLineJoin(.round)

// 2. Full Standing Posterior Silhouette Path (Head + Neck + Shoulders + Arms + Back + Thighs + Calves + Heels)
// Coordinate anchors synced to acupoints:
// Bách Hội (250, 84) | Phong Trì (222, 168) | Ngoại Quan (112, 428) | Thận Du (216, 392)
let bodyPath = CGMutablePath()
// Top of neck behind ears (x: 222..278, y: 148..188)
bodyPath.move(to: CGPoint(x: 226, y: 148))
bodyPath.addCurve(to: CGPoint(x: 218, y: 184), control1: CGPoint(x: 225, y: 164), control2: CGPoint(x: 223, y: 176))
// Left trapezius & posterior deltoid shoulder
bodyPath.addCurve(to: CGPoint(x: 152, y: 218), control1: CGPoint(x: 194, y: 194), control2: CGPoint(x: 168, y: 202))
bodyPath.addCurve(to: CGPoint(x: 138, y: 274), control1: CGPoint(x: 140, y: 234), control2: CGPoint(x: 138, y: 254))
// Left triceps to posterior elbow (136, 348)
bodyPath.addCurve(to: CGPoint(x: 124, y: 348), control1: CGPoint(x: 135, y: 298), control2: CGPoint(x: 128, y: 326))
// Left posterior forearm passing Ngoại Quan (112, 428) to dorsal wrist (92, 454)
bodyPath.addCurve(to: CGPoint(x: 92, y: 454), control1: CGPoint(x: 114, y: 382), control2: CGPoint(x: 102, y: 422))
// Left Dorsal Hand (anatomical pose facing forward from behind -> thumb OUTER left, rounded 4 dorsal fingers inward)
bodyPath.addCurve(to: CGPoint(x: 62, y: 492), control1: CGPoint(x: 80, y: 462), control2: CGPoint(x: 66, y: 478))
bodyPath.addCurve(to: CGPoint(x: 70, y: 495), control1: CGPoint(x: 61, y: 496), control2: CGPoint(x: 66, y: 498))
bodyPath.addLine(to: CGPoint(x: 77, y: 484))
// Index finger (rounded tip)
bodyPath.addCurve(to: CGPoint(x: 75, y: 514), control1: CGPoint(x: 75, y: 496), control2: CGPoint(x: 73, y: 508))
bodyPath.addCurve(to: CGPoint(x: 81, y: 513), control1: CGPoint(x: 76, y: 518), control2: CGPoint(x: 80, y: 518))
bodyPath.addLine(to: CGPoint(x: 85, y: 494))
// Middle finger
bodyPath.addCurve(to: CGPoint(x: 85, y: 521), control1: CGPoint(x: 84, y: 506), control2: CGPoint(x: 83, y: 516))
bodyPath.addCurve(to: CGPoint(x: 91, y: 520), control1: CGPoint(x: 86, y: 525), control2: CGPoint(x: 90, y: 525))
bodyPath.addLine(to: CGPoint(x: 93, y: 496))
// Ring finger
bodyPath.addCurve(to: CGPoint(x: 95, y: 516), control1: CGPoint(x: 93, y: 506), control2: CGPoint(x: 93, y: 513))
bodyPath.addCurve(to: CGPoint(x: 100, y: 514), control1: CGPoint(x: 96, y: 519), control2: CGPoint(x: 99, y: 518))
bodyPath.addLine(to: CGPoint(x: 101, y: 494))
// Little finger (inner closest to thigh)
bodyPath.addCurve(to: CGPoint(x: 104, y: 507), control1: CGPoint(x: 102, y: 501), control2: CGPoint(x: 102, y: 505))
bodyPath.addCurve(to: CGPoint(x: 109, y: 504), control1: CGPoint(x: 106, y: 510), control2: CGPoint(x: 109, y: 508))
bodyPath.addCurve(to: CGPoint(x: 110, y: 460), control1: CGPoint(x: 111, y: 488), control2: CGPoint(x: 111, y: 472))
// Inner forearm back to armpit fold (182, 266)
bodyPath.addCurve(to: CGPoint(x: 146, y: 354), control1: CGPoint(x: 122, y: 428), control2: CGPoint(x: 136, y: 390))
bodyPath.addCurve(to: CGPoint(x: 178, y: 268), control1: CGPoint(x: 158, y: 320), control2: CGPoint(x: 170, y: 292))
// Lateral torso / latissimus down to lumbar waist (186, 392) and hip (176, 466)
bodyPath.addCurve(to: CGPoint(x: 186, y: 392), control1: CGPoint(x: 178, y: 312), control2: CGPoint(x: 186, y: 356))
bodyPath.addCurve(to: CGPoint(x: 176, y: 482), control1: CGPoint(x: 184, y: 426), control2: CGPoint(x: 176, y: 454))
// Left posterior thigh -> popliteal knee outer curve (184, 658) -> sculpted gastrocnemius calf (176, 712) -> Achilles ankle (192, 804) -> heel (186, 832)
bodyPath.addCurve(to: CGPoint(x: 184, y: 658), control1: CGPoint(x: 174, y: 544), control2: CGPoint(x: 182, y: 608))
bodyPath.addCurve(to: CGPoint(x: 177, y: 716), control1: CGPoint(x: 178, y: 678), control2: CGPoint(x: 174, y: 696))
bodyPath.addCurve(to: CGPoint(x: 193, y: 804), control1: CGPoint(x: 180, y: 752), control2: CGPoint(x: 191, y: 782))
// Left Calcaneus Heel (posterior view: rounded heel & slight outer sole edge, NO front toes)
bodyPath.addCurve(to: CGPoint(x: 179, y: 834), control1: CGPoint(x: 188, y: 816), control2: CGPoint(x: 179, y: 825))
bodyPath.addCurve(to: CGPoint(x: 204, y: 841), control1: CGPoint(x: 182, y: 842), control2: CGPoint(x: 194, y: 843))
bodyPath.addCurve(to: CGPoint(x: 215, y: 828), control1: CGPoint(x: 211, y: 839), control2: CGPoint(x: 215, y: 834))
bodyPath.addCurve(to: CGPoint(x: 212, y: 804), control1: CGPoint(x: 215, y: 820), control2: CGPoint(x: 213, y: 812))
// Medial calf -> medial knee -> inner thigh -> cleft (250, 544)
bodyPath.addCurve(to: CGPoint(x: 224, y: 718), control1: CGPoint(x: 216, y: 778), control2: CGPoint(x: 226, y: 750))
bodyPath.addCurve(to: CGPoint(x: 218, y: 658), control1: CGPoint(x: 223, y: 696), control2: CGPoint(x: 220, y: 676))
bodyPath.addCurve(to: CGPoint(x: 250, y: 542), control1: CGPoint(x: 224, y: 616), control2: CGPoint(x: 238, y: 572))

// Mirror cleanly on right side! (250 -> 500 - x)
bodyPath.addCurve(to: CGPoint(x: 282, y: 658), control1: CGPoint(x: 262, y: 572), control2: CGPoint(x: 276, y: 616))
bodyPath.addCurve(to: CGPoint(x: 276, y: 718), control1: CGPoint(x: 280, y: 676), control2: CGPoint(x: 277, y: 696))
bodyPath.addCurve(to: CGPoint(x: 288, y: 804), control1: CGPoint(x: 274, y: 750), control2: CGPoint(x: 284, y: 778))
bodyPath.addCurve(to: CGPoint(x: 285, y: 828), control1: CGPoint(x: 287, y: 812), control2: CGPoint(x: 285, y: 820))
bodyPath.addCurve(to: CGPoint(x: 296, y: 841), control1: CGPoint(x: 285, y: 834), control2: CGPoint(x: 289, y: 839))
bodyPath.addCurve(to: CGPoint(x: 321, y: 834), control1: CGPoint(x: 306, y: 843), control2: CGPoint(x: 318, y: 842))
bodyPath.addCurve(to: CGPoint(x: 307, y: 804), control1: CGPoint(x: 321, y: 825), control2: CGPoint(x: 312, y: 816))
bodyPath.addCurve(to: CGPoint(x: 323, y: 716), control1: CGPoint(x: 309, y: 782), control2: CGPoint(x: 320, y: 752))
bodyPath.addCurve(to: CGPoint(x: 316, y: 658), control1: CGPoint(x: 326, y: 696), control2: CGPoint(x: 322, y: 678))
bodyPath.addCurve(to: CGPoint(x: 324, y: 482), control1: CGPoint(x: 318, y: 608), control2: CGPoint(x: 326, y: 544))
bodyPath.addCurve(to: CGPoint(x: 314, y: 392), control1: CGPoint(x: 324, y: 454), control2: CGPoint(x: 316, y: 426))
bodyPath.addCurve(to: CGPoint(x: 322, y: 268), control1: CGPoint(x: 314, y: 356), control2: CGPoint(x: 322, y: 312))
bodyPath.addCurve(to: CGPoint(x: 354, y: 354), control1: CGPoint(x: 330, y: 292), control2: CGPoint(x: 342, y: 320))
bodyPath.addCurve(to: CGPoint(x: 390, y: 460), control1: CGPoint(x: 364, y: 390), control2: CGPoint(x: 378, y: 428))
bodyPath.addCurve(to: CGPoint(x: 391, y: 504), control1: CGPoint(x: 389, y: 472), control2: CGPoint(x: 389, y: 488))
bodyPath.addCurve(to: CGPoint(x: 396, y: 507), control1: CGPoint(x: 391, y: 508), control2: CGPoint(x: 394, y: 510))
bodyPath.addCurve(to: CGPoint(x: 399, y: 494), control1: CGPoint(x: 398, y: 505), control2: CGPoint(x: 398, y: 501))
bodyPath.addLine(to: CGPoint(x: 400, y: 514))
bodyPath.addCurve(to: CGPoint(x: 405, y: 516), control1: CGPoint(x: 401, y: 518), control2: CGPoint(x: 404, y: 519))
bodyPath.addCurve(to: CGPoint(x: 407, y: 496), control1: CGPoint(x: 407, y: 513), control2: CGPoint(x: 407, y: 506))
bodyPath.addLine(to: CGPoint(x: 409, y: 520))
bodyPath.addCurve(to: CGPoint(x: 415, y: 521), control1: CGPoint(x: 410, y: 525), control2: CGPoint(x: 414, y: 525))
bodyPath.addCurve(to: CGPoint(x: 415, y: 494), control1: CGPoint(x: 417, y: 516), control2: CGPoint(x: 416, y: 506))
bodyPath.addLine(to: CGPoint(x: 419, y: 513))
bodyPath.addCurve(to: CGPoint(x: 425, y: 514), control1: CGPoint(x: 420, y: 518), control2: CGPoint(x: 424, y: 518))
bodyPath.addCurve(to: CGPoint(x: 423, y: 484), control1: CGPoint(x: 427, y: 508), control2: CGPoint(x: 425, y: 496))
bodyPath.addLine(to: CGPoint(x: 430, y: 495))
bodyPath.addCurve(to: CGPoint(x: 438, y: 492), control1: CGPoint(x: 434, y: 498), control2: CGPoint(x: 439, y: 496))
bodyPath.addCurve(to: CGPoint(x: 408, y: 454), control1: CGPoint(x: 434, y: 478), control2: CGPoint(x: 420, y: 462))
bodyPath.addCurve(to: CGPoint(x: 376, y: 348), control1: CGPoint(x: 398, y: 422), control2: CGPoint(x: 386, y: 382))
bodyPath.addCurve(to: CGPoint(x: 362, y: 274), control1: CGPoint(x: 372, y: 326), control2: CGPoint(x: 365, y: 298))
bodyPath.addCurve(to: CGPoint(x: 348, y: 218), control1: CGPoint(x: 362, y: 254), control2: CGPoint(x: 360, y: 234))
bodyPath.addCurve(to: CGPoint(x: 282, y: 184), control1: CGPoint(x: 332, y: 202), control2: CGPoint(x: 306, y: 194))
bodyPath.addCurve(to: CGPoint(x: 274, y: 148), control1: CGPoint(x: 277, y: 176), control2: CGPoint(x: 275, y: 164))
bodyPath.closeSubpath()

// Fill base skin tone + layered watercolor posterior muscle shading
ctx.saveGState()
ctx.addPath(bodyPath)
ctx.clip()
ctx.setFillColor(CGColor(red: 0.882, green: 0.768, blue: 0.628, alpha: 1.0))
ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))

// Soft watercolor anatomical shading:
// Neck nape shadow
drawSoftWash(ctx, cx: 250, cy: 170, rx: 32, ry: 22, r: 0.72, g: 0.56, b: 0.41, alpha: 0.34)
// Posterior deltoid & upper trapezius roundness
drawSoftWash(ctx, cx: 164, cy: 238, rx: 30, ry: 28, r: 0.76, g: 0.61, b: 0.45, alpha: 0.34)
drawSoftWash(ctx, cx: 336, cy: 238, rx: 30, ry: 28, r: 0.76, g: 0.61, b: 0.45, alpha: 0.34)
// Scapular hollows & erector spinae spinal column shading along x=250
drawSoftWash(ctx, cx: 250, cy: 322, rx: 14, ry: 135, r: 0.70, g: 0.54, b: 0.38, alpha: 0.42)
drawSoftWash(ctx, cx: 214, cy: 290, rx: 30, ry: 48, r: 0.94, g: 0.84, b: 0.71, alpha: 0.36)
drawSoftWash(ctx, cx: 286, cy: 290, rx: 30, ry: 48, r: 0.94, g: 0.84, b: 0.71, alpha: 0.36)
// Arm muscle highlights & forearm shadow
drawSoftWash(ctx, cx: 136, cy: 336, rx: 16, ry: 55, r: 0.74, g: 0.59, b: 0.43, alpha: 0.25)
drawSoftWash(ctx, cx: 364, cy: 336, rx: 16, ry: 55, r: 0.74, g: 0.59, b: 0.43, alpha: 0.25)
// Hamstring & Popliteal Fossa (knee-back hollow shading, y ~ 658)
drawSoftWash(ctx, cx: 204, cy: 658, rx: 22, ry: 16, r: 0.68, g: 0.52, b: 0.38, alpha: 0.42)
drawSoftWash(ctx, cx: 296, cy: 658, rx: 22, ry: 16, r: 0.68, g: 0.52, b: 0.38, alpha: 0.42)
// Calf muscle bellies highlight + gastrocnemius crease shadow
drawSoftWash(ctx, cx: 200, cy: 708, rx: 20, ry: 34, r: 0.94, g: 0.84, b: 0.71, alpha: 0.40)
drawSoftWash(ctx, cx: 300, cy: 708, rx: 20, ry: 34, r: 0.94, g: 0.84, b: 0.71, alpha: 0.40)
drawSoftWash(ctx, cx: 202, cy: 758, rx: 14, ry: 22, r: 0.68, g: 0.52, b: 0.37, alpha: 0.32)
drawSoftWash(ctx, cx: 298, cy: 758, rx: 14, ry: 22, r: 0.68, g: 0.52, b: 0.37, alpha: 0.32)
// Subtle inner torso side shadow (for 3D silk volume matching meridian-front.jpg)
drawSoftWash(ctx, cx: 184, cy: 360, rx: 14, ry: 95, r: 0.72, g: 0.56, b: 0.40, alpha: 0.34)
drawSoftWash(ctx, cx: 316, cy: 360, rx: 14, ry: 95, r: 0.72, g: 0.56, b: 0.40, alpha: 0.34)
// Subtle dorsal hand knuckle shading
drawSoftWash(ctx, cx: 88, cy: 482, rx: 12, ry: 12, r: 0.74, g: 0.58, b: 0.42, alpha: 0.28)
drawSoftWash(ctx, cx: 412, cy: 482, rx: 12, ry: 12, r: 0.74, g: 0.58, b: 0.42, alpha: 0.28)
// Heel contour shading
drawSoftWash(ctx, cx: 200, cy: 824, rx: 16, ry: 15, r: 0.72, g: 0.56, b: 0.41, alpha: 0.36)
drawSoftWash(ctx, cx: 300, cy: 824, rx: 16, ry: 15, r: 0.72, g: 0.56, b: 0.41, alpha: 0.36)
ctx.restoreGState()

// Stroke outer body contour with warm sumi-ink
ctx.addPath(bodyPath)
ctx.setStrokeColor(CGColor(red: 0.17, green: 0.12, blue: 0.08, alpha: 0.94))
ctx.setLineWidth(2.1)
ctx.strokePath()

// 3. Rear Anatomical Inner Ink Linework (Scapulae, Đốc Mạch Spine, Elbows, Dorsal Knuckles, Popliteal Creases, Calves & Achilles)
ctx.setStrokeColor(CGColor(red: 0.34, green: 0.24, blue: 0.16, alpha: 0.64))
ctx.setLineWidth(1.4)
// C7 prominence & median vertebral groove (x=250, y=190..464)
ctx.move(to: CGPoint(x: 245, y: 190))
ctx.addQuadCurve(to: CGPoint(x: 255, y: 190), control: CGPoint(x: 250, y: 194))
ctx.move(to: CGPoint(x: 250, y: 194))
ctx.addCurve(to: CGPoint(x: 250, y: 462), control1: CGPoint(x: 249, y: 290), control2: CGPoint(x: 251, y: 380))

// Left & Right Scapular borders (xương bả vai)
ctx.move(to: CGPoint(x: 192, y: 248))
ctx.addQuadCurve(to: CGPoint(x: 230, y: 314), control: CGPoint(x: 232, y: 274))
ctx.move(to: CGPoint(x: 308, y: 248))
ctx.addQuadCurve(to: CGPoint(x: 270, y: 314), control: CGPoint(x: 268, y: 274))
// Subtle posterior elbow horizontal folds (mỏm khuỷu)
ctx.move(to: CGPoint(x: 130, y: 350))
ctx.addQuadCurve(to: CGPoint(x: 145, y: 354), control: CGPoint(x: 138, y: 356))
ctx.move(to: CGPoint(x: 370, y: 350))
ctx.addQuadCurve(to: CGPoint(x: 355, y: 354), control: CGPoint(x: 362, y: 356))
// Subtle dorsal finger joint ticks
for fx in [74.0, 81.0, 89.0] {
    ctx.move(to: CGPoint(x: fx, y: 492))
    ctx.addLine(to: CGPoint(x: fx + 3, y: 492))
    ctx.move(to: CGPoint(x: 500 - fx, y: 492))
    ctx.addLine(to: CGPoint(x: 497 - fx, y: 492))
}
// Posterior knee-back creases (khoeo chân - crisp horizontal double arc, NO circular kneecaps!)
ctx.move(to: CGPoint(x: 187, y: 656))
ctx.addQuadCurve(to: CGPoint(x: 215, y: 656), control: CGPoint(x: 201, y: 660))
ctx.move(to: CGPoint(x: 191, y: 663))
ctx.addQuadCurve(to: CGPoint(x: 211, y: 663), control: CGPoint(x: 201, y: 665))
ctx.move(to: CGPoint(x: 285, y: 656))
ctx.addQuadCurve(to: CGPoint(x: 313, y: 656), control: CGPoint(x: 299, y: 660))
ctx.move(to: CGPoint(x: 289, y: 663))
ctx.addQuadCurve(to: CGPoint(x: 309, y: 663), control: CGPoint(x: 299, y: 665))
// Gastrocnemius muscle lower boundary & Achilles tendon lines
ctx.move(to: CGPoint(x: 185, y: 734))
ctx.addQuadCurve(to: CGPoint(x: 201, y: 746), control: CGPoint(x: 196, y: 744))
ctx.move(to: CGPoint(x: 216, y: 734))
ctx.addQuadCurve(to: CGPoint(x: 203, y: 746), control: CGPoint(x: 206, y: 744))
ctx.move(to: CGPoint(x: 315, y: 734))
ctx.addQuadCurve(to: CGPoint(x: 299, y: 746), control: CGPoint(x: 304, y: 744))
ctx.move(to: CGPoint(x: 284, y: 734))
ctx.addQuadCurve(to: CGPoint(x: 297, y: 746), control: CGPoint(x: 294, y: 744))
// Achilles tendons down to heels
ctx.move(to: CGPoint(x: 201, y: 752))
ctx.addLine(to: CGPoint(x: 201, y: 816))
ctx.move(to: CGPoint(x: 299, y: 752))
ctx.addLine(to: CGPoint(x: 299, y: 816))
ctx.strokePath()

// 4. Posterior Ears & Head (Full Charcoal Hair Dome + Natural Occipital Nape + Topknot Bun — Zero Face!)
// Back of outer ears
for ex in [210.0, 290.0] {
    let dir: CGFloat = ex < 250 ? -1 : 1
    let ear = CGMutablePath()
    ear.move(to: CGPoint(x: ex, y: 112))
    ear.addCurve(to: CGPoint(x: ex, y: 142), control1: CGPoint(x: ex + dir * 11, y: 112), control2: CGPoint(x: ex + dir * 9, y: 142))
    ear.closeSubpath()
    ctx.addPath(ear)
    ctx.setFillColor(CGColor(red: 0.85, green: 0.73, blue: 0.59, alpha: 1.0))
    ctx.fillPath()
    ctx.addPath(ear)
    ctx.setStrokeColor(CGColor(red: 0.17, green: 0.12, blue: 0.08, alpha: 0.94))
    ctx.setLineWidth(1.8)
    ctx.strokePath()
}

// Cranium covered cleanly by rear-view dark hair + natural tapered occipital hairline at nape (y ~ 158)
let headHair = CGMutablePath()
headHair.move(to: CGPoint(x: 250, y: 70))
headHair.addCurve(to: CGPoint(x: 211, y: 118), control1: CGPoint(x: 222, y: 70), control2: CGPoint(x: 210, y: 92))
headHair.addCurve(to: CGPoint(x: 224, y: 156), control1: CGPoint(x: 212, y: 138), control2: CGPoint(x: 218, y: 152))
headHair.addQuadCurve(to: CGPoint(x: 250, y: 162), control: CGPoint(x: 238, y: 157))
headHair.addQuadCurve(to: CGPoint(x: 276, y: 156), control: CGPoint(x: 262, y: 157))
headHair.addCurve(to: CGPoint(x: 289, y: 118), control1: CGPoint(x: 282, y: 152), control2: CGPoint(x: 288, y: 138))
headHair.addCurve(to: CGPoint(x: 250, y: 70), control1: CGPoint(x: 290, y: 92), control2: CGPoint(x: 278, y: 70))
headHair.closeSubpath()

ctx.saveGState()
ctx.addPath(headHair)
ctx.clip()
ctx.setFillColor(CGColor(red: 0.18, green: 0.14, blue: 0.12, alpha: 1.0))
ctx.fill(CGRect(x: 205, y: 65, width: 90, height: 105))
drawSoftWash(ctx, cx: 244, cy: 102, rx: 28, ry: 22, r: 0.34, g: 0.28, b: 0.24, alpha: 0.55)
// Fine curved hair strands sweeping upward to the topknot
ctx.setStrokeColor(CGColor(red: 0.36, green: 0.30, blue: 0.25, alpha: 0.65))
ctx.setLineWidth(1.2)
for sx in stride(from: -26.0, through: 26.0, by: 6.5) {
    ctx.move(to: CGPoint(x: 250 + sx * 0.72, y: 158))
    ctx.addQuadCurve(to: CGPoint(x: 250 + sx * 0.35, y: 72), control: CGPoint(x: 250 + sx * 1.1, y: 118))
}
ctx.strokePath()
ctx.restoreGState()

ctx.addPath(headHair)
ctx.setStrokeColor(CGColor(red: 0.14, green: 0.10, blue: 0.08, alpha: 0.96))
ctx.setLineWidth(2.0)
ctx.strokePath()

// Traditional Topknot Bun (búi tóc củ hành) right at y = 46..70
let bun = CGMutablePath()
bun.addEllipse(in: CGRect(x: 233, y: 47, width: 34, height: 24))
ctx.addPath(bun)
ctx.setFillColor(CGColor(red: 0.18, green: 0.14, blue: 0.12, alpha: 1.0))
ctx.fillPath()
drawSoftWash(ctx, cx: 246, cy: 56, rx: 12, ry: 7, r: 0.38, g: 0.32, b: 0.28, alpha: 0.55)
ctx.addPath(bun)
ctx.setStrokeColor(CGColor(red: 0.14, green: 0.10, blue: 0.08, alpha: 0.96))
ctx.setLineWidth(2.0)
ctx.strokePath()
// Topknot tie band
ctx.setStrokeColor(CGColor(red: 0.36, green: 0.28, blue: 0.22, alpha: 0.9))
ctx.setLineWidth(2.2)
ctx.move(to: CGPoint(x: 236, y: 69))
ctx.addQuadCurve(to: CGPoint(x: 264, y: 69), control: CGPoint(x: 250, y: 72))
ctx.strokePath()

// 5. Traditional Rear Homespun Loincloth Wrap (Khố Vải Mặt Sau) matching meridian-front.jpg palette
let wrapOuter = CGMutablePath()
wrapOuter.move(to: CGPoint(x: 177, y: 460))
wrapOuter.addQuadCurve(to: CGPoint(x: 250, y: 470), control: CGPoint(x: 214, y: 468))
wrapOuter.addQuadCurve(to: CGPoint(x: 323, y: 460), control: CGPoint(x: 286, y: 468))
wrapOuter.addCurve(to: CGPoint(x: 331, y: 540), control1: CGPoint(x: 328, y: 492), control2: CGPoint(x: 332, y: 520))
wrapOuter.addQuadCurve(to: CGPoint(x: 282, y: 556), control: CGPoint(x: 306, y: 552))
wrapOuter.addLine(to: CGPoint(x: 274, y: 576))
wrapOuter.addQuadCurve(to: CGPoint(x: 226, y: 576), control: CGPoint(x: 250, y: 582))
wrapOuter.addLine(to: CGPoint(x: 218, y: 556))
wrapOuter.addQuadCurve(to: CGPoint(x: 169, y: 540), control: CGPoint(x: 194, y: 552))
wrapOuter.addCurve(to: CGPoint(x: 177, y: 460), control1: CGPoint(x: 168, y: 520), control2: CGPoint(x: 172, y: 492))
wrapOuter.closeSubpath()

ctx.saveGState()
ctx.addPath(wrapOuter)
ctx.clip()
ctx.setFillColor(CGColor(red: 0.698, green: 0.651, blue: 0.494, alpha: 1.0))
ctx.fill(CGRect(x: 165, y: 455, width: 170, height: 132))
drawSoftWash(ctx, cx: 215, cy: 520, rx: 34, ry: 32, r: 0.56, g: 0.51, b: 0.36, alpha: 0.45)
drawSoftWash(ctx, cx: 285, cy: 520, rx: 34, ry: 32, r: 0.56, g: 0.51, b: 0.36, alpha: 0.45)
drawSoftWash(ctx, cx: 250, cy: 515, rx: 28, ry: 45, r: 0.78, g: 0.73, b: 0.58, alpha: 0.42)
ctx.restoreGState()

ctx.addPath(wrapOuter)
ctx.setStrokeColor(CGColor(red: 0.17, green: 0.12, blue: 0.08, alpha: 0.94))
ctx.setLineWidth(2.0)
ctx.strokePath()

// Cloth fold lines & tucked rear belt band
ctx.setStrokeColor(CGColor(red: 0.25, green: 0.20, blue: 0.14, alpha: 0.78))
ctx.setLineWidth(1.4)
ctx.move(to: CGPoint(x: 175, y: 478))
ctx.addQuadCurve(to: CGPoint(x: 325, y: 478), control: CGPoint(x: 250, y: 486))
ctx.move(to: CGPoint(x: 224, y: 478))
ctx.addCurve(to: CGPoint(x: 218, y: 556), control1: CGPoint(x: 222, y: 508), control2: CGPoint(x: 220, y: 534))
ctx.move(to: CGPoint(x: 276, y: 478))
ctx.addCurve(to: CGPoint(x: 282, y: 556), control1: CGPoint(x: 278, y: 508), control2: CGPoint(x: 280, y: 534))
ctx.move(to: CGPoint(x: 176, y: 504))
ctx.addQuadCurve(to: CGPoint(x: 222, y: 528), control: CGPoint(x: 196, y: 518))
ctx.move(to: CGPoint(x: 324, y: 504))
ctx.addQuadCurve(to: CGPoint(x: 278, y: 528), control: CGPoint(x: 304, y: 518))
ctx.strokePath()

saveJPEG(ctx.makeImage()!, to: outPath, quality: 0.89)
print("Successfully painted anatomically true dorsal meridian-back.jpg")
