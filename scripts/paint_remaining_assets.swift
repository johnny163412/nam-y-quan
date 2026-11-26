import Foundation
import AppKit
import CoreGraphics
import CoreImage

let projectRoot = "/Users/thiagop/.gemini/antigravity/scratch/nam-y-quan"
let rawDir = "\(projectRoot)/scripts/raw"
let artDir = "\(projectRoot)/public/art"
let ciContext = CIContext(options: nil)

func saveJPEG(_ image: CGImage, to path: String, quality: Double = 0.87) {
    let rep = NSBitmapImageRep(cgImage: image)
    guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality]) else {
        fatalError("JPEG encode failed for \(path)")
    }
    try! data.write(to: URL(fileURLWithPath: path))
}

func loadCGImage(from path: String) -> CGImage? {
    guard let nsImg = NSImage(contentsOfFile: path) else { return nil }
    var rect = NSRect(origin: .zero, size: nsImg.size)
    return nsImg.cgImage(forProposedRect: &rect, context: nil, hints: nil)
}

func resizeExact(_ cg: CGImage, w: Int, h: Int) -> CGImage {
    let ctx = CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.interpolationQuality = .high
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
    return ctx.makeImage()!
}

// Re-crop clinic-bg.jpg cleanly from pure wooden lantern/bamboo wall region (width 0.24 -> zero face edge)
func refreshCleanClinicBg() {
    guard let silkLady = loadCGImage(from: "\(rawDir)/c2_tam_ty_luong_hu.jpg") else { return }
    let bgCropRect = CGRect(
        x: CGFloat(silkLady.width) * 0.01,
        y: CGFloat(silkLady.height) * 0.02,
        width: CGFloat(silkLady.width) * 0.24,
        height: CGFloat(silkLady.height) * 0.45
    )
    if let bgRaw = silkLady.cropping(to: bgCropRect) {
        var ciBg = CIImage(cgImage: bgRaw)
        if let blur = CIFilter(name: "CIGaussianBlur") {
            blur.setValue(ciBg, forKey: kCIInputImageKey)
            blur.setValue(4.2, forKey: kCIInputRadiusKey)
            if let out = blur.outputImage { ciBg = out.cropped(to: ciBg.extent) }
        }
        if let col = CIFilter(name: "CIColorControls") {
            col.setValue(ciBg, forKey: kCIInputImageKey)
            col.setValue(0.85, forKey: kCIInputSaturationKey)
            col.setValue(-0.04, forKey: kCIInputBrightnessKey)
            if let out = col.outputImage { ciBg = out }
        }
        let bgImg = ciContext.createCGImage(ciBg, from: ciBg.extent)!
        saveJPEG(resizeExact(bgImg, w: 360, h: 480), to: "\(artDir)/patients/clinic-bg.jpg", quality: 0.84)
    }
}
refreshCleanClinicBg()

func makeIvoryPaperCanvas(w: Int, h: Int, seed: Int) -> CGContext {
    let ctx = CGContext(
        data: nil,
        width: w,
        height: h,
        bitsPerComponent: 8,
        bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    // Warm aged Dó/silk ivory tone matching botanical plates
    ctx.setFillColor(CGColor(red: 0.976, green: 0.955, blue: 0.898, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))

    // Subtle silk-fiber crosshatch + sepia flecks
    srand48(seed)
    ctx.setLineWidth(0.7)
    for _ in 0..<180 {
        let x = CGFloat(drand48()) * CGFloat(w)
        let y = CGFloat(drand48()) * CGFloat(h)
        let len = CGFloat(drand48()) * 14 + 4
        let ang = CGFloat(drand48()) * .pi
        ctx.setStrokeColor(CGColor(red: 0.56, green: 0.45, blue: 0.29, alpha: 0.032))
        ctx.move(to: CGPoint(x: x, y: y))
        ctx.addLine(to: CGPoint(x: x + cos(ang) * len, y: y + sin(ang) * len))
        ctx.strokePath()
    }
    for _ in 0..<600 {
        let x = CGFloat(drand48()) * CGFloat(w)
        let y = CGFloat(drand48()) * CGFloat(h)
        let r = CGFloat(drand48()) * 1.6 + 0.3
        ctx.setFillColor(CGColor(red: 0.48, green: 0.37, blue: 0.22, alpha: 0.025))
        ctx.fillEllipse(in: CGRect(x: x, y: y, width: r, height: r))
    }
    return ctx
}

func softBloom(_ ctx: CGContext, cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, r: CGFloat, g: CGFloat, b: CGFloat, alpha: CGFloat) {
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

func addVignette(_ ctx: CGContext, w: CGFloat, h: CGFloat, alpha: CGFloat = 0.22) {
    let grad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.40, green: 0.28, blue: 0.14, alpha: 0.0),
            CGColor(red: 0.32, green: 0.21, blue: 0.10, alpha: alpha)
        ] as CFArray,
        locations: [0.58, 1.0]
    )!
    ctx.saveGState()
    ctx.drawRadialGradient(grad, startCenter: CGPoint(x: w / 2, y: h / 2), startRadius: min(w, h) * 0.25, endCenter: CGPoint(x: w / 2, y: h / 2), endRadius: max(w, h) * 0.72, options: [.drawsAfterEndLocation])
    ctx.restoreGState()
}

func brushStrokeCurve(_ ctx: CGContext, from p1: CGPoint, to p2: CGPoint, c1: CGPoint, c2: CGPoint, width: CGFloat, color: (CGFloat, CGFloat, CGFloat), alpha: CGFloat = 0.92) {
    ctx.saveGState()
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)
    // Soft outer ink bleed
    ctx.setStrokeColor(CGColor(red: color.0, green: color.1, blue: color.2, alpha: alpha * 0.22))
    ctx.setLineWidth(width + 2.2)
    ctx.move(to: p1)
    ctx.addCurve(to: p2, control1: c1, control2: c2)
    ctx.strokePath()
    // Core brush stroke
    ctx.setStrokeColor(CGColor(red: color.0, green: color.1, blue: color.2, alpha: alpha))
    ctx.setLineWidth(width)
    ctx.move(to: p1)
    ctx.addCurve(to: p2, control1: c1, control2: c2)
    ctx.strokePath()
    ctx.restoreGState()
}

func organicEllipsePath(cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, wobble: CGFloat = 0.07, seed: Int = 1) -> CGMutablePath {
    srand48(seed)
    let path = CGMutablePath()
    let steps = 20
    var pts: [CGPoint] = []
    for i in 0..<steps {
        let a = CGFloat(i) * (.pi * 2 / CGFloat(steps))
        let w = 1.0 + CGFloat(drand48() * 2.0 - 1.0) * wobble
        pts.append(CGPoint(x: cx + cos(a) * rx * w, y: cy + sin(a) * ry * w))
    }
    let startMid = CGPoint(x: (pts[steps - 1].x + pts[0].x) / 2, y: (pts[steps - 1].y + pts[0].y) / 2)
    path.move(to: startMid)
    for i in 0..<steps {
        let next = pts[(i + 1) % steps]
        let mid = CGPoint(x: (pts[i].x + next.x) / 2, y: (pts[i].y + next.y) / 2)
        path.addQuadCurve(to: mid, control: pts[i])
    }
    path.closeSubpath()
    return path
}

func paintHerbPlate(_ id: String, seed: Int, draw: (CGContext, CGFloat, CGFloat) -> Void) {
    let size = 360
    let ctx = makeIvoryPaperCanvas(w: size, h: size, seed: seed)
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)
    // Soft grounded shadow halo on paper
    softBloom(ctx, cx: 182, cy: 175, rx: 138, ry: 118, r: 0.62, g: 0.49, b: 0.32, alpha: 0.12)
    draw(ctx, CGFloat(size), CGFloat(size))
    addVignette(ctx, w: CGFloat(size), h: CGFloat(size), alpha: 0.14)

    // Subtle hand-carved corner herbal index seal (warm cinnabar/amber tint)
    ctx.setStrokeColor(CGColor(red: 0.62, green: 0.24, blue: 0.16, alpha: 0.28))
    ctx.setLineWidth(1.4)
    ctx.stroke(CGRect(x: 312, y: 24, width: 22, height: 22))
    ctx.setFillColor(CGColor(red: 0.62, green: 0.24, blue: 0.16, alpha: 0.22))
    ctx.fill(CGRect(x: 316, y: 28, width: 14, height: 14))

    saveJPEG(ctx.makeImage()!, to: "\(artDir)/herbs/\(id).jpg", quality: 0.88)
}

func drawLeafShape(
    _ ctx: CGContext,
    x1: CGFloat, y1: CGFloat,
    x2: CGFloat, y2: CGFloat,
    width: CGFloat,
    fill: (CGFloat, CGFloat, CGFloat),
    vein: Bool = true,
    serrated: Bool = false
) {
    let mx = (x1 + x2) / 2
    let my = (y1 + y2) / 2
    let dx = x2 - x1
    let dy = y2 - y1
    let len = max(1, hypot(dx, dy))
    let ux = dx / len
    let uy = dy / len
    let nx = -uy * width
    let ny = ux * width

    let path = CGMutablePath()
    if serrated {
        path.move(to: CGPoint(x: x1, y: y1))
        let teeth = 7
        for i in 1...teeth {
            let t = CGFloat(i) / CGFloat(teeth)
            let arch = sin(t * .pi)
            let bx = x1 + dx * t + nx * arch
            let by = y1 + dy * t + ny * arch
            let toothOut: CGFloat = (i < teeth) ? 1.16 : 1.0
            let tx = x1 + dx * (t - 0.04) + nx * arch * toothOut
            let ty = y1 + dy * (t - 0.04) + ny * arch * toothOut
            path.addLine(to: CGPoint(x: tx, y: ty))
            path.addLine(to: CGPoint(x: bx, y: by))
        }
        for i in stride(from: teeth - 1, through: 0, by: -1) {
            let t = CGFloat(i) / CGFloat(teeth)
            let arch = sin(t * .pi)
            let bx = x1 + dx * t - nx * arch
            let by = y1 + dy * t - ny * arch
            let toothOut: CGFloat = (i > 0) ? 1.16 : 1.0
            let tx = x1 + dx * (t + 0.04) - nx * arch * toothOut
            let ty = y1 + dy * (t + 0.04) - ny * arch * toothOut
            path.addLine(to: CGPoint(x: tx, y: ty))
            path.addLine(to: CGPoint(x: bx, y: by))
        }
        path.closeSubpath()
    } else {
        path.move(to: CGPoint(x: x1, y: y1))
        path.addCurve(to: CGPoint(x: x2, y: y2), control1: CGPoint(x: x1 + dx * 0.25 + nx, y: y1 + dy * 0.25 + ny), control2: CGPoint(x: x1 + dx * 0.72 + nx * 0.75, y: y1 + dy * 0.72 + ny * 0.75))
        path.addCurve(to: CGPoint(x: x1, y: y1), control1: CGPoint(x: x1 + dx * 0.72 - nx * 0.75, y: y1 + dy * 0.72 - ny * 0.75), control2: CGPoint(x: x1 + dx * 0.25 - nx, y: y1 + dy * 0.25 - ny))
        path.closeSubpath()
    }

    ctx.saveGState()
    ctx.addPath(path)
    ctx.clip()
    // Watercolor gradient inside leaf: darker base, sunlit tip
    ctx.setFillColor(CGColor(red: fill.0, green: fill.1, blue: fill.2, alpha: 0.86))
    ctx.fill(CGRect(x: 0, y: 0, width: 360, height: 360))
    softBloom(ctx, cx: x1 + dx * 0.25, cy: y1 + dy * 0.25, rx: len * 0.5, ry: width * 1.1, r: fill.0 * 0.65, g: fill.1 * 0.72, b: fill.2 * 0.65, alpha: 0.62)
    softBloom(ctx, cx: x1 + dx * 0.72 + nx * 0.2, cy: y1 + dy * 0.72 + ny * 0.2, rx: len * 0.35, ry: width * 0.6, r: min(1, fill.0 * 1.24), g: min(1, fill.1 * 1.22), b: min(1, fill.2 * 1.15), alpha: 0.45)

    if vein {
        ctx.setStrokeColor(CGColor(red: 0.16, green: 0.24, blue: 0.14, alpha: 0.56))
        ctx.setLineWidth(1.4)
        ctx.move(to: CGPoint(x: x1, y: y1))
        ctx.addQuadCurve(to: CGPoint(x: x2 * 0.94 + x1 * 0.06, y: y2 * 0.94 + y1 * 0.06), control: CGPoint(x: mx + nx * 0.08, y: my + ny * 0.08))
        ctx.strokePath()
        // Lateral pinnate leaf veins
        ctx.setLineWidth(0.95)
        ctx.setStrokeColor(CGColor(red: 0.18, green: 0.26, blue: 0.15, alpha: 0.38))
        for step in [0.24, 0.44, 0.64, 0.80] {
            let vx = x1 + dx * step
            let vy = y1 + dy * step
            let arch = sin(step * .pi)
            ctx.move(to: CGPoint(x: vx, y: vy))
            ctx.addLine(to: CGPoint(x: vx + dx * 0.12 + nx * arch * 0.72, y: vy + dy * 0.12 + ny * arch * 0.72))
            ctx.move(to: CGPoint(x: vx, y: vy))
            ctx.addLine(to: CGPoint(x: vx + dx * 0.12 - nx * arch * 0.72, y: vy + dy * 0.12 - ny * arch * 0.72))
        }
        ctx.strokePath()
    }
    ctx.restoreGState()

    // Ink outline
    ctx.addPath(path)
    ctx.setStrokeColor(CGColor(red: 0.16, green: 0.12, blue: 0.09, alpha: 0.92))
    ctx.setLineWidth(1.9)
    ctx.strokePath()
}

// 1. sinh-khuong (Organic knobby aged ginger rhizome + textured slices + rootlets)
paintHerbPlate("sinh-khuong", seed: 101) { ctx, _, _ in
    // Delicate earthy ginger rootlets
    for (rx, ry, dx, dy) in [(94.0, 178.0, -28.0, -24.0), (140.0, 162.0, -14.0, -34.0), (222.0, 172.0, 26.0, -28.0)] {
        brushStrokeCurve(ctx, from: CGPoint(x: rx, y: ry), to: CGPoint(x: rx + dx, y: ry + dy), c1: CGPoint(x: rx + dx * 0.3, y: ry - 12), c2: CGPoint(x: rx + dx * 0.8, y: ry + dy * 0.5), width: 1.6, color: (0.44, 0.33, 0.20), alpha: 0.78)
    }

    let lobes: [(CGFloat, CGFloat, CGFloat, CGFloat, Int)] = [
        (146, 206, 62, 42, 11), (208, 218, 56, 40, 12), (176, 254, 44, 34, 13), (246, 186, 40, 32, 14), (108, 188, 36, 30, 15)
    ]
    for (cx, cy, rx, ry, sd) in lobes {
        let p = organicEllipsePath(cx: cx, cy: cy, rx: rx, ry: ry, wobble: 0.09, seed: sd)
        ctx.saveGState()
        ctx.addPath(p)
        ctx.clip()
        ctx.setFillColor(CGColor(red: 0.79, green: 0.63, blue: 0.35, alpha: 0.94))
        ctx.fill(CGRect(x: 0, y: 0, width: 360, height: 360))
        softBloom(ctx, cx: cx - 10, cy: cy + 12, rx: rx * 0.85, ry: ry * 0.75, r: 0.93, g: 0.82, b: 0.54, alpha: 0.65)
        softBloom(ctx, cx: cx + 10, cy: cy - 14, rx: rx * 0.75, ry: ry * 0.65, r: 0.52, g: 0.37, b: 0.19, alpha: 0.42)
        // Curved node growth bands
        ctx.setStrokeColor(CGColor(red: 0.42, green: 0.29, blue: 0.16, alpha: 0.55))
        ctx.setLineWidth(1.5)
        for off in [-18.0, 2.0, 20.0] {
            ctx.move(to: CGPoint(x: cx + off, y: cy - ry * 0.7))
            ctx.addQuadCurve(to: CGPoint(x: cx + off + 6, y: cy + ry * 0.7), control: CGPoint(x: cx + off + 13, y: cy))
        }
        ctx.strokePath()
        ctx.restoreGState()

        ctx.addPath(p)
        ctx.setStrokeColor(CGColor(red: 0.22, green: 0.15, blue: 0.10, alpha: 0.94))
        ctx.setLineWidth(2.2)
        ctx.strokePath()
    }

    // Fresh pale-gold cut ginger slices with inner fibrous ring
    for (sx, sy, sd) in [(138.0, 108.0, 21), (208.0, 96.0, 22)] {
        let p = organicEllipsePath(cx: sx, cy: sy, rx: 35, ry: 24, wobble: 0.06, seed: sd)
        ctx.saveGState()
        ctx.addPath(p)
        ctx.clip()
        ctx.setFillColor(CGColor(red: 0.95, green: 0.86, blue: 0.52, alpha: 0.98))
        ctx.fill(CGRect(x: 0, y: 0, width: 360, height: 360))
        softBloom(ctx, cx: sx - 6, cy: sy + 5, rx: 24, ry: 16, r: 0.99, g: 0.95, b: 0.76, alpha: 0.7)
        ctx.restoreGState()
        ctx.addPath(p)
        ctx.setStrokeColor(CGColor(red: 0.44, green: 0.30, blue: 0.14, alpha: 0.95))
        ctx.setLineWidth(2.4)
        ctx.strokePath()
        let inner = organicEllipsePath(cx: sx, cy: sy, rx: 26, ry: 17, wobble: 0.05, seed: sd + 5)
        ctx.addPath(inner)
        ctx.setStrokeColor(CGColor(red: 0.68, green: 0.52, blue: 0.22, alpha: 0.52))
        ctx.setLineWidth(1.1)
        ctx.strokePath()
    }
}

// 2. bac-ha (Serrated peppermint leaves on square reddish-green stem)
paintHerbPlate("bac-ha", seed: 102) { ctx, _, _ in
    brushStrokeCurve(ctx, from: CGPoint(x: 176, y: 56), to: CGPoint(x: 185, y: 312), c1: CGPoint(x: 166, y: 140), c2: CGPoint(x: 196, y: 228), width: 3.6, color: (0.24, 0.34, 0.20), alpha: 0.95)
    drawLeafShape(ctx, x1: 176, y1: 118, x2: 84, y2: 144, width: 30, fill: (0.31, 0.55, 0.36), serrated: true)
    drawLeafShape(ctx, x1: 178, y1: 118, x2: 272, y2: 142, width: 30, fill: (0.35, 0.59, 0.40), serrated: true)
    drawLeafShape(ctx, x1: 180, y1: 186, x2: 92, y2: 222, width: 26, fill: (0.34, 0.58, 0.38), serrated: true)
    drawLeafShape(ctx, x1: 182, y1: 186, x2: 268, y2: 218, width: 26, fill: (0.38, 0.62, 0.42), serrated: true)
    drawLeafShape(ctx, x1: 182, y1: 252, x2: 126, y2: 294, width: 20, fill: (0.40, 0.64, 0.44), serrated: true)
    drawLeafShape(ctx, x1: 184, y1: 252, x2: 240, y2: 292, width: 20, fill: (0.42, 0.66, 0.46), serrated: true)
    drawLeafShape(ctx, x1: 184, y1: 288, x2: 186, y2: 332, width: 15, fill: (0.46, 0.70, 0.48), serrated: true)
}

// 3. kim-ngan-hoa (Twining honeysuckle vine with silver-white & golden blossoms + buds)
paintHerbPlate("kim-ngan-hoa", seed: 103) { ctx, _, _ in
    brushStrokeCurve(ctx, from: CGPoint(x: 112, y: 62), to: CGPoint(x: 248, y: 280), c1: CGPoint(x: 158, y: 152), c2: CGPoint(x: 192, y: 228), width: 3.2, color: (0.28, 0.36, 0.22))
    drawLeafShape(ctx, x1: 138, y1: 114, x2: 82, y2: 146, width: 21, fill: (0.33, 0.51, 0.32))
    drawLeafShape(ctx, x1: 176, y1: 172, x2: 248, y2: 150, width: 22, fill: (0.36, 0.54, 0.35))
    drawLeafShape(ctx, x1: 206, y1: 224, x2: 142, y2: 260, width: 19, fill: (0.38, 0.56, 0.36))

    let blooms: [(CGFloat, CGFloat, CGFloat, CGFloat, Bool)] = [
        (168, 174, 114, 224, false), (174, 178, 146, 246, true),
        (214, 240, 276, 286, false), (218, 236, 284, 244, true),
        (244, 278, 224, 326, false)
    ]
    for (bx, by, tx, ty, isGold) in blooms {
        let col: (CGFloat, CGFloat, CGFloat) = isGold ? (0.93, 0.76, 0.30) : (0.97, 0.95, 0.86)
        drawLeafShape(ctx, x1: bx, y1: by, x2: tx, y2: ty, width: 11, fill: col, vein: false)
        // Delicate curved stamens & anther dots
        let sx1 = (bx + tx) / 2, sy1 = (by + ty) / 2
        let ex1 = tx + (tx - bx) * 0.28, ey1 = ty + (ty - by) * 0.28
        brushStrokeCurve(ctx, from: CGPoint(x: sx1, y: sy1), to: CGPoint(x: ex1, y: ey1), c1: CGPoint(x: tx, y: ty + 6), c2: CGPoint(x: ex1 - 4, y: ey1), width: 1.3, color: (0.80, 0.54, 0.16), alpha: 0.9)
        ctx.setFillColor(CGColor(red: 0.76, green: 0.44, blue: 0.12, alpha: 0.95))
        ctx.fillEllipse(in: CGRect(x: ex1 - 2.5, y: ey1 - 2.5, width: 5, height: 5))
    }
}

// 4. cam-thao (Gnarled licorice wood stalks with bark striation + golden cambium slices)
paintHerbPlate("cam-thao", seed: 104) { ctx, _, _ in
    for (x1, y1, x2, y2) in [(88.0, 96.0, 224.0, 288.0), (146.0, 80.0, 276.0, 264.0)] {
        brushStrokeCurve(ctx, from: CGPoint(x: x1, y: y1), to: CGPoint(x: x2, y: y2), c1: CGPoint(x: x1 + 42, y: y1 + 68), c2: CGPoint(x: x2 - 44, y: y2 - 64), width: 24, color: (0.32, 0.20, 0.12), alpha: 0.96)
        brushStrokeCurve(ctx, from: CGPoint(x: x1, y: y1), to: CGPoint(x: x2, y: y2), c1: CGPoint(x: x1 + 42, y: y1 + 68), c2: CGPoint(x: x2 - 44, y: y2 - 64), width: 15, color: (0.54, 0.36, 0.21), alpha: 0.76)
        // Bark fiber striations
        for shift in [-4.0, 4.0] {
            brushStrokeCurve(ctx, from: CGPoint(x: x1 + shift, y: y1), to: CGPoint(x: x2 + shift, y: y2), c1: CGPoint(x: x1 + 42 + shift, y: y1 + 68), c2: CGPoint(x: x2 - 44 + shift, y: y2 - 64), width: 1.2, color: (0.20, 0.12, 0.07), alpha: 0.65)
        }
    }
    for (idx, (cx, cy, ang)) in [(135.0, 118.0, 0.4), (218.0, 114.0, -0.35), (255.0, 178.0, 0.2)].enumerated() {
        ctx.saveGState()
        ctx.translateBy(x: cx, y: cy)
        ctx.rotate(by: ang)
        let p = organicEllipsePath(cx: 0, cy: 0, rx: 36, ry: 21, wobble: 0.07, seed: 200 + idx)
        ctx.addPath(p)
        ctx.setFillColor(CGColor(red: 0.91, green: 0.76, blue: 0.32, alpha: 0.98))
        ctx.fillPath()
        ctx.addPath(p)
        ctx.setStrokeColor(CGColor(red: 0.30, green: 0.18, blue: 0.10, alpha: 0.95))
        ctx.setLineWidth(3.0)
        ctx.strokePath()
        ctx.setStrokeColor(CGColor(red: 0.64, green: 0.45, blue: 0.15, alpha: 0.56))
        ctx.setLineWidth(1.0)
        for i in 0..<10 {
            let a = CGFloat(i) * .pi / 5
            ctx.move(to: .zero)
            ctx.addLine(to: CGPoint(x: cos(a) * 28, y: sin(a) * 15))
        }
        ctx.strokePath()
        ctx.restoreGState()
    }
}

// 5. tran-bi (Three curled aged tangerine peels with oil-gland dimples)
paintHerbPlate("tran-bi", seed: 105) { ctx, _, _ in
    softBloom(ctx, cx: 180, cy: 175, rx: 112, ry: 100, r: 0.85, g: 0.46, b: 0.18, alpha: 0.18)
    let curls: [(CGFloat, CGFloat, CGFloat)] = [(128, 152, -0.38), (228, 164, 0.44), (178, 232, 0.06)]
    for (idx, (cx, cy, rot)) in curls.enumerated() {
        ctx.saveGState()
        ctx.translateBy(x: cx, y: cy)
        ctx.rotate(by: rot)
        let p = CGMutablePath()
        p.move(to: CGPoint(x: -46, y: -14))
        p.addCurve(to: CGPoint(x: 46, y: -10), control1: CGPoint(x: -30, y: 46), control2: CGPoint(x: 30, y: 46))
        p.addCurve(to: CGPoint(x: -46, y: -14), control1: CGPoint(x: 20, y: 12), control2: CGPoint(x: -20, y: 12))
        ctx.addPath(p)
        ctx.setFillColor(CGColor(red: 0.74, green: 0.34, blue: 0.11, alpha: 0.95))
        ctx.fillPath()
        // Inner white-cream pith rim
        ctx.setStrokeColor(CGColor(red: 0.93, green: 0.84, blue: 0.66, alpha: 0.88))
        ctx.setLineWidth(3.0)
        ctx.move(to: CGPoint(x: -40, y: -11))
        ctx.addCurve(to: CGPoint(x: 40, y: -8), control1: CGPoint(x: -18, y: 10), control2: CGPoint(x: 18, y: 10))
        ctx.strokePath()
        // Stippled oil glands
        srand48(300 + idx)
        for _ in 0..<26 {
            let gx = CGFloat(drand48() * 64 - 32)
            let gy = CGFloat(drand48() * 24 + 4)
            ctx.setFillColor(CGColor(red: 0.38, green: 0.16, blue: 0.06, alpha: 0.45))
            ctx.fillEllipse(in: CGRect(x: gx, y: gy, width: 2.2, height: 2.2))
        }
        ctx.addPath(p)
        ctx.setStrokeColor(CGColor(red: 0.24, green: 0.13, blue: 0.08, alpha: 0.94))
        ctx.setLineWidth(2.2)
        ctx.strokePath()
        ctx.restoreGState()
    }
}

// 6. hoai-son (Cinnamon-skinned yam cylinder + diagonal chalk-white slices)
paintHerbPlate("hoai-son", seed: 106) { ctx, _, _ in
    let root = organicEllipsePath(cx: 180, cy: 196, rx: 90, ry: 34, wobble: 0.08, seed: 401)
    ctx.saveGState()
    ctx.addPath(root)
    ctx.clip()
    ctx.setFillColor(CGColor(red: 0.72, green: 0.58, blue: 0.42, alpha: 0.95))
    ctx.fill(CGRect(x: 0, y: 0, width: 360, height: 360))
    softBloom(ctx, cx: 165, cy: 212, rx: 78, ry: 22, r: 0.85, g: 0.74, b: 0.56, alpha: 0.55)
    ctx.restoreGState()
    ctx.addPath(root)
    ctx.setStrokeColor(CGColor(red: 0.24, green: 0.17, blue: 0.11, alpha: 0.94))
    ctx.setLineWidth(2.3)
    ctx.strokePath()

    for (idx, (cx, cy, ang)) in [(134.0, 114.0, -0.25), (195.0, 104.0, 0.2), (244.0, 134.0, 0.42)].enumerated() {
        ctx.saveGState()
        ctx.translateBy(x: cx, y: cy)
        ctx.rotate(by: ang)
        let s = organicEllipsePath(cx: 0, cy: 0, rx: 36, ry: 24, wobble: 0.05, seed: 410 + idx)
        ctx.addPath(s)
        ctx.setFillColor(CGColor(red: 0.97, green: 0.95, blue: 0.89, alpha: 0.99))
        ctx.fillPath()
        ctx.addPath(s)
        ctx.setStrokeColor(CGColor(red: 0.40, green: 0.30, blue: 0.20, alpha: 0.92))
        ctx.setLineWidth(2.3)
        ctx.strokePath()
        // Faint mucilage shimmer dots
        ctx.setFillColor(CGColor(red: 0.84, green: 0.79, blue: 0.68, alpha: 0.55))
        for dx in [-14.0, 0.0, 14.0] {
            ctx.fillEllipse(in: CGRect(x: dx, y: -3, width: 2.4, height: 2.4))
        }
        ctx.restoreGState()
    }
}

// 7. lac-tien (Climbing passiflora vine + tendrils + violet-crowned blossom)
paintHerbPlate("lac-tien", seed: 107) { ctx, _, _ in
    brushStrokeCurve(ctx, from: CGPoint(x: 84, y: 74), to: CGPoint(x: 266, y: 278), c1: CGPoint(x: 132, y: 190), c2: CGPoint(x: 208, y: 210), width: 2.8, color: (0.22, 0.40, 0.24))
    brushStrokeCurve(ctx, from: CGPoint(x: 214, y: 235), to: CGPoint(x: 276, y: 288), c1: CGPoint(x: 256, y: 245), c2: CGPoint(x: 235, y: 295), width: 1.7, color: (0.28, 0.48, 0.28))

    drawLeafShape(ctx, x1: 126, y1: 132, x2: 74, y2: 185, width: 25, fill: (0.33, 0.55, 0.35))
    drawLeafShape(ctx, x1: 215, y1: 215, x2: 278, y2: 188, width: 23, fill: (0.37, 0.59, 0.39))

    let fx: CGFloat = 178, fy: CGFloat = 205
    for i in 0..<10 {
        let a = CGFloat(i) * (.pi * 2 / 10)
        drawLeafShape(ctx, x1: fx, y1: fy, x2: fx + cos(a) * 46, y2: fy + sin(a) * 46, width: 10, fill: (0.90, 0.87, 0.95), vein: false)
    }
    ctx.setStrokeColor(CGColor(red: 0.44, green: 0.28, blue: 0.54, alpha: 0.88))
    ctx.setLineWidth(1.6)
    for i in 0..<24 {
        let a = CGFloat(i) * (.pi * 2 / 24)
        ctx.move(to: CGPoint(x: fx + cos(a) * 11, y: fy + sin(a) * 11))
        ctx.addLine(to: CGPoint(x: fx + cos(a) * 28, y: fy + sin(a) * 28))
    }
    ctx.strokePath()
    ctx.setFillColor(CGColor(red: 0.78, green: 0.68, blue: 0.28, alpha: 0.96))
    ctx.fillEllipse(in: CGRect(x: fx - 9, y: fy - 9, width: 18, height: 18))
}

// 8. tam-sen (Halved lotus seeds + emerald bitter plumule shoots)
paintHerbPlate("tam-sen", seed: 108) { ctx, _, _ in
    for (idx, (cx, cy, ang)) in [(134.0, 155.0, -0.2), (222.0, 175.0, 0.25)].enumerated() {
        ctx.saveGState()
        ctx.translateBy(x: cx, y: cy)
        ctx.rotate(by: ang)
        let s = organicEllipsePath(cx: 0, cy: 0, rx: 44, ry: 56, wobble: 0.05, seed: 500 + idx)
        ctx.addPath(s)
        ctx.setFillColor(CGColor(red: 0.95, green: 0.92, blue: 0.82, alpha: 0.98))
        ctx.fillPath()
        ctx.addPath(s)
        ctx.setStrokeColor(CGColor(red: 0.40, green: 0.31, blue: 0.20, alpha: 0.92))
        ctx.setLineWidth(2.2)
        ctx.strokePath()
        ctx.restoreGState()
    }
    for sx in [134.0, 222.0, 176.0] {
        let base: CGFloat = sx == 176.0 ? 115 : 138
        drawLeafShape(ctx, x1: sx, y1: base, x2: sx - 8, y2: base + 68, width: 8, fill: (0.22, 0.50, 0.30))
        drawLeafShape(ctx, x1: sx, y1: base, x2: sx + 10, y2: base + 62, width: 7, fill: (0.26, 0.54, 0.33))
    }
}

// 9. ky-tu (Goji berry branch with crimson oblong berries)
paintHerbPlate("ky-tu", seed: 109) { ctx, _, _ in
    brushStrokeCurve(ctx, from: CGPoint(x: 92, y: 100), to: CGPoint(x: 264, y: 262), c1: CGPoint(x: 145, y: 145), c2: CGPoint(x: 210, y: 212), width: 2.6, color: (0.36, 0.26, 0.16))
    drawLeafShape(ctx, x1: 144, y1: 148, x2: 96, y2: 196, width: 12, fill: (0.34, 0.53, 0.33))
    drawLeafShape(ctx, x1: 214, y1: 205, x2: 266, y2: 172, width: 12, fill: (0.34, 0.53, 0.33))

    for (idx, (bx, by, rot)) in [(135.0, 128.0, 0.4), (170.0, 162.0, -0.3), (195.0, 124.0, 0.2), (222.0, 198.0, 0.5), (156.0, 212.0, -0.4), (245.0, 232.0, 0.1)].enumerated() {
        ctx.saveGState()
        ctx.translateBy(x: bx, y: by)
        ctx.rotate(by: rot)
        let r = organicEllipsePath(cx: 0, cy: 0, rx: 14, ry: 21, wobble: 0.08, seed: 600 + idx)
        ctx.addPath(r)
        ctx.setFillColor(CGColor(red: 0.76, green: 0.17, blue: 0.13, alpha: 0.96))
        ctx.fillPath()
        softBloom(ctx, cx: -4, cy: 6, rx: 10, ry: 14, r: 0.96, g: 0.38, b: 0.22, alpha: 0.62)
        ctx.addPath(r)
        ctx.setStrokeColor(CGColor(red: 0.24, green: 0.10, blue: 0.08, alpha: 0.9))
        ctx.setLineWidth(1.8)
        ctx.strokePath()
        ctx.restoreGState()
    }
}

// 10. co-xuoc (Slender tied golden-buff roots + green floral spike)
paintHerbPlate("co-xuoc", seed: 110) { ctx, _, _ in
    for dx in stride(from: -28.0, through: 28.0, by: 8.5) {
        brushStrokeCurve(ctx, from: CGPoint(x: 165 + dx * 0.4, y: 274), to: CGPoint(x: 155 + dx * 1.4, y: 74), c1: CGPoint(x: 170 + dx, y: 185), c2: CGPoint(x: 150 + dx, y: 125), width: 4.4, color: (0.70, 0.55, 0.30))
    }
    // Hemp twine tie
    brushStrokeCurve(ctx, from: CGPoint(x: 142, y: 222), to: CGPoint(x: 190, y: 222), c1: CGPoint(x: 158, y: 218), c2: CGPoint(x: 174, y: 225), width: 5.0, color: (0.35, 0.24, 0.13))
    // Green spiky stalk beside
    brushStrokeCurve(ctx, from: CGPoint(x: 236, y: 92), to: CGPoint(x: 248, y: 296), c1: CGPoint(x: 240, y: 160), c2: CGPoint(x: 244, y: 230), width: 3.0, color: (0.28, 0.48, 0.28))
    drawLeafShape(ctx, x1: 238, y1: 145, x2: 196, y2: 172, width: 16, fill: (0.34, 0.54, 0.34))
}

// 11. que-chi (Reddish cinnamon quills with spiral scroll ends + twig)
paintHerbPlate("que-chi", seed: 111) { ctx, _, _ in
    for (x, y, ang) in [(135.0, 175.0, -0.32), (190.0, 185.0, 0.14), (236.0, 165.0, 0.42)] {
        ctx.saveGState()
        ctx.translateBy(x: x, y: y)
        ctx.rotate(by: ang)
        let r = CGRect(x: -17, y: -86, width: 34, height: 172)
        ctx.setFillColor(CGColor(red: 0.56, green: 0.28, blue: 0.15, alpha: 0.96))
        ctx.fill(r)
        // Bark vertical texture
        ctx.setStrokeColor(CGColor(red: 0.36, green: 0.16, blue: 0.08, alpha: 0.55))
        ctx.setLineWidth(1.4)
        for bx in [-8.0, 0.0, 8.0] {
            ctx.move(to: CGPoint(x: bx, y: -82))
            ctx.addLine(to: CGPoint(x: bx + 1.5, y: 74))
        }
        ctx.strokePath()
        ctx.setStrokeColor(CGColor(red: 0.22, green: 0.12, blue: 0.08, alpha: 0.94))
        ctx.setLineWidth(2.2)
        ctx.stroke(r)
        ctx.setFillColor(CGColor(red: 0.74, green: 0.44, blue: 0.26, alpha: 0.96))
        ctx.fillEllipse(in: CGRect(x: -17, y: 76, width: 34, height: 16))
        ctx.strokeEllipse(in: CGRect(x: -17, y: 76, width: 34, height: 16))
        ctx.restoreGState()
    }
}

// 12. dan-sam (Brick-crimson sage roots + chrysanthemum-heart slices)
paintHerbPlate("dan-sam", seed: 112) { ctx, _, _ in
    for (dx, dy) in [(-24.0, 0.0), (0.0, 12.0), (26.0, -6.0)] {
        brushStrokeCurve(ctx, from: CGPoint(x: 175 + dx * 0.4, y: 278 + dy), to: CGPoint(x: 172 + dx * 1.6, y: 76), c1: CGPoint(x: 192 + dx, y: 200), c2: CGPoint(x: 152 + dx, y: 132), width: 13.5, color: (0.62, 0.17, 0.13), alpha: 0.95)
        brushStrokeCurve(ctx, from: CGPoint(x: 175 + dx * 0.4, y: 278 + dy), to: CGPoint(x: 172 + dx * 1.6, y: 76), c1: CGPoint(x: 192 + dx, y: 200), c2: CGPoint(x: 152 + dx, y: 132), width: 2.2, color: (0.28, 0.08, 0.06), alpha: 0.65)
    }
    for (idx, (sx, sy)) in [(126.0, 118.0), (230.0, 112.0)].enumerated() {
        let s = organicEllipsePath(cx: sx, cy: sy, rx: 26, ry: 18, wobble: 0.06, seed: 700 + idx)
        ctx.addPath(s)
        ctx.setFillColor(CGColor(red: 0.89, green: 0.66, blue: 0.48, alpha: 0.98))
        ctx.fillPath()
        ctx.addPath(s)
        ctx.setStrokeColor(CGColor(red: 0.58, green: 0.15, blue: 0.11, alpha: 0.96))
        ctx.setLineWidth(3.0)
        ctx.strokePath()
    }
}

// 13. Decoction Stove Scene (680x340): Hand-shaded Terracotta Siêu Đất Nung over Glowing Charcoal Brazier
func paintDecoctionStove() {
    let w = 680, h = 340
    let ctx = CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    // Warm timber wall + aged apothecary table
    ctx.setFillColor(CGColor(red: 0.11, green: 0.07, blue: 0.04, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.setFillColor(CGColor(red: 0.17, green: 0.11, blue: 0.07, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: 84))
    // Wood grain lines on table
    ctx.setStrokeColor(CGColor(red: 0.09, green: 0.05, blue: 0.03, alpha: 0.55))
    ctx.setLineWidth(1.5)
    for gy in [18.0, 38.0, 62.0] {
        ctx.move(to: CGPoint(x: 0, y: gy))
        ctx.addQuadCurve(to: CGPoint(x: CGFloat(w), y: gy + 4), control: CGPoint(x: 340, y: gy - 6))
    }
    ctx.strokePath()

    // Warm firelight aura
    softBloom(ctx, cx: 340, cy: 132, rx: 280, ry: 185, r: 0.88, g: 0.42, b: 0.14, alpha: 0.34)
    softBloom(ctx, cx: 340, cy: 84, rx: 145, ry: 72, r: 0.98, g: 0.32, b: 0.10, alpha: 0.54)

    // Clay stove brazier with carved rib rings
    let brazier = CGMutablePath()
    brazier.move(to: CGPoint(x: 242, y: 20))
    brazier.addLine(to: CGPoint(x: 438, y: 20))
    brazier.addQuadCurve(to: CGPoint(x: 452, y: 126), control: CGPoint(x: 458, y: 74))
    brazier.addLine(to: CGPoint(x: 228, y: 126))
    brazier.addQuadCurve(to: CGPoint(x: 242, y: 20), control: CGPoint(x: 222, y: 74))
    brazier.closeSubpath()
    ctx.saveGState()
    ctx.addPath(brazier)
    ctx.clip()
    ctx.setFillColor(CGColor(red: 0.27, green: 0.20, blue: 0.15, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    softBloom(ctx, cx: 340, cy: 108, rx: 105, ry: 44, r: 0.42, g: 0.30, b: 0.21, alpha: 0.55)
    ctx.restoreGState()
    ctx.addPath(brazier)
    ctx.setStrokeColor(CGColor(red: 0.11, green: 0.07, blue: 0.04, alpha: 1.0))
    ctx.setLineWidth(3)
    ctx.strokePath()

    // Glowing charcoal draft mouth
    ctx.setFillColor(CGColor(red: 0.08, green: 0.03, blue: 0.02, alpha: 1.0))
    ctx.fillEllipse(in: CGRect(x: 285, y: 32, width: 110, height: 64))
    for (ex, ey, er) in [(312.0, 56.0, 14.0), (338.0, 52.0, 16.0), (362.0, 58.0, 13.0), (326.0, 66.0, 12.0), (350.0, 68.0, 12.0)] {
        softBloom(ctx, cx: ex, cy: ey, rx: er * 1.65, ry: er * 1.4, r: 0.99, g: 0.36, b: 0.08, alpha: 0.88)
    }

    // Earthenware Siêu Đất Nung pot
    let potRect = CGRect(x: 245, y: 120, width: 190, height: 126)
    ctx.saveGState()
    ctx.addEllipse(in: potRect)
    ctx.clip()
    ctx.setFillColor(CGColor(red: 0.46, green: 0.23, blue: 0.13, alpha: 1.0))
    ctx.fill(potRect)
    softBloom(ctx, cx: 308, cy: 196, rx: 78, ry: 52, r: 0.76, g: 0.41, b: 0.22, alpha: 0.58)
    softBloom(ctx, cx: 392, cy: 148, rx: 64, ry: 48, r: 0.22, g: 0.10, b: 0.05, alpha: 0.52)
    ctx.restoreGState()
    ctx.setStrokeColor(CGColor(red: 0.15, green: 0.08, blue: 0.04, alpha: 1.0))
    ctx.setLineWidth(3)
    ctx.strokeEllipse(in: potRect)

    // Spout & terracotta handle
    brushStrokeCurve(ctx, from: CGPoint(x: 422, y: 185), to: CGPoint(x: 474, y: 238), c1: CGPoint(x: 452, y: 196), c2: CGPoint(x: 468, y: 215), width: 18, color: (0.44, 0.22, 0.12), alpha: 1.0)
    brushStrokeCurve(ctx, from: CGPoint(x: 256, y: 188), to: CGPoint(x: 196, y: 224), c1: CGPoint(x: 224, y: 192), c2: CGPoint(x: 204, y: 205), width: 16, color: (0.44, 0.22, 0.12), alpha: 1.0)

    // Pot lid & knob
    ctx.setFillColor(CGColor(red: 0.54, green: 0.28, blue: 0.16, alpha: 1.0))
    ctx.fillEllipse(in: CGRect(x: 282, y: 224, width: 116, height: 34))
    ctx.setStrokeColor(CGColor(red: 0.16, green: 0.09, blue: 0.05, alpha: 1.0))
    ctx.setLineWidth(2.5)
    ctx.strokeEllipse(in: CGRect(x: 282, y: 224, width: 116, height: 34))
    ctx.fillEllipse(in: CGRect(x: 328, y: 252, width: 24, height: 18))

    // Celadon-ivory porcelain bowl of warm amber decoction on right
    ctx.setFillColor(CGColor(red: 0.85, green: 0.82, blue: 0.74, alpha: 1.0))
    ctx.fillEllipse(in: CGRect(x: 505, y: 40, width: 96, height: 48))
    ctx.setStrokeColor(CGColor(red: 0.20, green: 0.14, blue: 0.09, alpha: 1.0))
    ctx.setLineWidth(2.4)
    ctx.strokeEllipse(in: CGRect(x: 505, y: 40, width: 96, height: 48))
    ctx.setFillColor(CGColor(red: 0.36, green: 0.21, blue: 0.10, alpha: 0.94))
    ctx.fillEllipse(in: CGRect(x: 515, y: 52, width: 76, height: 24))

    // Rising delicate silk steam wisps
    for sx in [318.0, 355.0, 474.0] {
        softBloom(ctx, cx: sx, cy: 292, rx: 30, ry: 55, r: 0.96, g: 0.93, b: 0.84, alpha: 0.24)
        brushStrokeCurve(ctx, from: CGPoint(x: sx - 4, y: 248), to: CGPoint(x: sx + 8, y: 332), c1: CGPoint(x: sx + 12, y: 278), c2: CGPoint(x: sx - 12, y: 306), width: 3.5, color: (0.95, 0.92, 0.84), alpha: 0.28)
    }

    addVignette(ctx, w: CGFloat(w), h: CGFloat(h), alpha: 0.38)
    saveJPEG(ctx.makeImage()!, to: "\(artDir)/tools/decoction-stove.jpg", quality: 0.88)
}
paintDecoctionStove()

// 14. Richly Shaded Folk Silk Portraits over pure wooden-lantern clinic-bg.jpg (no second face!)
func paintFolkPortrait(id: String, isScholar: Bool) {
    let w = 480, h = 640
    let ctx = CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    if let bg = loadCGImage(from: "\(artDir)/patients/clinic-bg.jpg") {
        ctx.draw(bg, in: CGRect(x: 0, y: 0, width: w, height: h))
    } else {
        ctx.setFillColor(CGColor(red: 0.20, green: 0.14, blue: 0.09, alpha: 1.0))
        ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    }
    // Subtle aged apothecary medicine cabinet shelves in background so frame feels rich and grounded
    ctx.setFillColor(CGColor(red: 0.16, green: 0.10, blue: 0.06, alpha: 0.48))
    ctx.fill(CGRect(x: 24, y: 400, width: 120, height: 180))
    ctx.setStrokeColor(CGColor(red: 0.32, green: 0.22, blue: 0.14, alpha: 0.45))
    ctx.setLineWidth(1.5)
    for row in stride(from: 420.0, to: 570.0, by: 36.0) {
        ctx.stroke(CGRect(x: 30, y: row, width: 108, height: 28))
    }
    softBloom(ctx, cx: 240, cy: 400, rx: 220, ry: 240, r: 0.90, g: 0.70, b: 0.36, alpha: 0.28)

    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)

    // Robe with silk fold shading
    let robePath = CGMutablePath()
    robePath.move(to: CGPoint(x: 48, y: 0))
    robePath.addCurve(to: CGPoint(x: 240, y: 266), control1: CGPoint(x: 68, y: 198), control2: CGPoint(x: 132, y: 266))
    robePath.addCurve(to: CGPoint(x: 432, y: 0), control1: CGPoint(x: 348, y: 266), control2: CGPoint(x: 412, y: 198))
    robePath.closeSubpath()
    ctx.saveGState()
    ctx.addPath(robePath)
    ctx.clip()
    ctx.setFillColor(isScholar ? CGColor(red: 0.14, green: 0.23, blue: 0.34, alpha: 0.98) : CGColor(red: 0.41, green: 0.29, blue: 0.20, alpha: 0.98))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    softBloom(ctx, cx: 170, cy: 140, rx: 140, ry: 120, r: isScholar ? 0.26 : 0.54, g: isScholar ? 0.38 : 0.40, b: isScholar ? 0.52 : 0.28, alpha: 0.46)
    ctx.restoreGState()
    ctx.addPath(robePath)
    ctx.setStrokeColor(CGColor(red: 0.13, green: 0.09, blue: 0.06, alpha: 0.95))
    ctx.setLineWidth(4.0)
    ctx.strokePath()

    // Collar detail
    if isScholar {
        ctx.setFillColor(CGColor(red: 0.90, green: 0.85, blue: 0.73, alpha: 0.95))
        ctx.move(to: CGPoint(x: 196, y: 262))
        ctx.addLine(to: CGPoint(x: 240, y: 118))
        ctx.addLine(to: CGPoint(x: 284, y: 262))
        ctx.closePath()
        ctx.fillPath()
        brushStrokeCurve(ctx, from: CGPoint(x: 196, y: 262), to: CGPoint(x: 240, y: 118), c1: CGPoint(x: 212, y: 210), c2: CGPoint(x: 228, y: 155), width: 3.5, color: (0.14, 0.10, 0.07))
        brushStrokeCurve(ctx, from: CGPoint(x: 240, y: 118), to: CGPoint(x: 284, y: 262), c1: CGPoint(x: 252, y: 155), c2: CGPoint(x: 268, y: 210), width: 3.5, color: (0.14, 0.10, 0.07))
    } else {
        brushStrokeCurve(ctx, from: CGPoint(x: 162, y: 252), to: CGPoint(x: 300, y: 0), c1: CGPoint(x: 218, y: 165), c2: CGPoint(x: 260, y: 80), width: 3.8, color: (0.16, 0.10, 0.07))
        brushStrokeCurve(ctx, from: CGPoint(x: 318, y: 252), to: CGPoint(x: 236, y: 136), c1: CGPoint(x: 288, y: 200), c2: CGPoint(x: 262, y: 165), width: 3.8, color: (0.16, 0.10, 0.07))
    }

    // Neck + shadow under chin
    ctx.setFillColor(CGColor(red: 0.86, green: 0.73, blue: 0.59, alpha: 1.0))
    ctx.fill(CGRect(x: 204, y: 246, width: 72, height: 82))
    softBloom(ctx, cx: 240, cy: 300, rx: 38, ry: 26, r: 0.54, g: 0.39, b: 0.27, alpha: 0.50)

    // Ears
    ctx.setFillColor(CGColor(red: 0.87, green: 0.74, blue: 0.60, alpha: 1.0))
    ctx.fillEllipse(in: CGRect(x: 142, y: 364, width: 28, height: 52))
    ctx.fillEllipse(in: CGRect(x: 310, y: 364, width: 28, height: 52))
    ctx.setStrokeColor(CGColor(red: 0.26, green: 0.18, blue: 0.12, alpha: 0.75))
    ctx.setLineWidth(2.4)
    ctx.strokeEllipse(in: CGRect(x: 142, y: 364, width: 28, height: 52))
    ctx.strokeEllipse(in: CGRect(x: 310, y: 364, width: 28, height: 52))

    // Jawline-tapered face contour
    let face = CGMutablePath()
    face.move(to: CGPoint(x: 240, y: 518))
    face.addCurve(to: CGPoint(x: 154, y: 398), control1: CGPoint(x: 178, y: 516), control2: CGPoint(x: 152, y: 465))
    face.addCurve(to: CGPoint(x: 240, y: 296), control1: CGPoint(x: 158, y: 332), control2: CGPoint(x: 200, y: 296))
    face.addCurve(to: CGPoint(x: 326, y: 398), control1: CGPoint(x: 280, y: 296), control2: CGPoint(x: 322, y: 332))
    face.addCurve(to: CGPoint(x: 240, y: 518), control1: CGPoint(x: 328, y: 465), control2: CGPoint(x: 302, y: 516))
    face.closeSubpath()

    ctx.saveGState()
    ctx.addPath(face)
    ctx.clip()
    ctx.setFillColor(isScholar ? CGColor(red: 0.90, green: 0.79, blue: 0.66, alpha: 1.0) : CGColor(red: 0.87, green: 0.74, blue: 0.59, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    softBloom(ctx, cx: 224, cy: 416, rx: 68, ry: 88, r: 0.98, g: 0.88, b: 0.75, alpha: 0.52)
    // Pale/fatigue shading for both cases
    softBloom(ctx, cx: 204, cy: 388, rx: 22, ry: 12, r: 0.56, g: 0.44, b: 0.36, alpha: isScholar ? 0.30 : 0.22)
    softBloom(ctx, cx: 276, cy: 388, rx: 22, ry: 12, r: 0.56, g: 0.44, b: 0.36, alpha: isScholar ? 0.30 : 0.22)
    ctx.restoreGState()
    ctx.addPath(face)
    ctx.setStrokeColor(CGColor(red: 0.16, green: 0.11, blue: 0.08, alpha: 0.94))
    ctx.setLineWidth(3.6)
    ctx.strokePath()

    // Traditional Headwear
    if isScholar {
        let turban = CGMutablePath()
        turban.move(to: CGPoint(x: 146, y: 446))
        turban.addCurve(to: CGPoint(x: 334, y: 446), control1: CGPoint(x: 154, y: 576), control2: CGPoint(x: 326, y: 576))
        turban.addQuadCurve(to: CGPoint(x: 146, y: 446), control: CGPoint(x: 240, y: 472))
        ctx.addPath(turban)
        ctx.setFillColor(CGColor(red: 0.12, green: 0.11, blue: 0.10, alpha: 0.98))
        ctx.fillPath()
        ctx.setStrokeColor(CGColor(red: 0.42, green: 0.36, blue: 0.28, alpha: 0.65))
        ctx.setLineWidth(2.4)
        ctx.move(to: CGPoint(x: 162, y: 468))
        ctx.addLine(to: CGPoint(x: 240, y: 496))
        ctx.addLine(to: CGPoint(x: 318, y: 468))
        ctx.strokePath()
    } else {
        let scarf = CGMutablePath()
        scarf.move(to: CGPoint(x: 126, y: 382))
        scarf.addCurve(to: CGPoint(x: 354, y: 382), control1: CGPoint(x: 136, y: 564), control2: CGPoint(x: 344, y: 564))
        scarf.addQuadCurve(to: CGPoint(x: 240, y: 466), control: CGPoint(x: 292, y: 454))
        scarf.addQuadCurve(to: CGPoint(x: 126, y: 382), control: CGPoint(x: 188, y: 454))
        ctx.addPath(scarf)
        ctx.setFillColor(CGColor(red: 0.35, green: 0.29, blue: 0.24, alpha: 0.97))
        ctx.fillPath()
        // Silver-white elderly parted hair
        brushStrokeCurve(ctx, from: CGPoint(x: 166, y: 448), to: CGPoint(x: 238, y: 464), c1: CGPoint(x: 192, y: 462), c2: CGPoint(x: 215, y: 466), width: 6.0, color: (0.88, 0.85, 0.78))
        brushStrokeCurve(ctx, from: CGPoint(x: 242, y: 464), to: CGPoint(x: 314, y: 448), c1: CGPoint(x: 265, y: 466), c2: CGPoint(x: 288, y: 462), width: 6.0, color: (0.88, 0.85, 0.78))
    }

    // Expressive eyes (sclera + dark iris + upper eyelid), brows, nose, gentle mouth
    for (ex, tilt) in [(204.0, isScholar ? -3.0 : 0.0), (276.0, isScholar ? 3.0 : 0.0)] {
        ctx.setFillColor(CGColor(red: 0.96, green: 0.94, blue: 0.90, alpha: 0.94))
        ctx.fillEllipse(in: CGRect(x: ex - 13, y: 392, width: 26, height: 12))
        ctx.setFillColor(CGColor(red: 0.14, green: 0.10, blue: 0.08, alpha: 0.96))
        ctx.fillEllipse(in: CGRect(x: ex - 5.5, y: 392.5, width: 11, height: 11))
        brushStrokeCurve(ctx, from: CGPoint(x: ex - 16, y: 398), to: CGPoint(x: ex + 16, y: 398 + tilt * 0.4), c1: CGPoint(x: ex - 6, y: 406), c2: CGPoint(x: ex + 6, y: 406), width: 3.0, color: (0.14, 0.10, 0.07))
    }
    // Brows
    brushStrokeCurve(ctx, from: CGPoint(x: 184, y: 422), to: CGPoint(x: 224, y: isScholar ? 416 : 422), c1: CGPoint(x: 198, y: 432), c2: CGPoint(x: 212, y: 430), width: 3.5, color: (0.15, 0.11, 0.08))
    brushStrokeCurve(ctx, from: CGPoint(x: 256, y: isScholar ? 416 : 422), to: CGPoint(x: 296, y: 422), c1: CGPoint(x: 268, y: 430), c2: CGPoint(x: 282, y: 432), width: 3.5, color: (0.15, 0.11, 0.08))

    // Nose & mouth
    brushStrokeCurve(ctx, from: CGPoint(x: 240, y: 398), to: CGPoint(x: 244, y: 356), c1: CGPoint(x: 240, y: 378), c2: CGPoint(x: 234, y: 362), width: 2.4, color: (0.36, 0.25, 0.18), alpha: 0.88)
    brushStrokeCurve(ctx, from: CGPoint(x: 216, y: 332), to: CGPoint(x: 264, y: 332), c1: CGPoint(x: 230, y: 326), c2: CGPoint(x: 250, y: 326), width: 3.0, color: (0.54, 0.26, 0.20), alpha: 0.92)

    addVignette(ctx, w: CGFloat(w), h: CGFloat(h), alpha: 0.28)
    saveJPEG(ctx.makeImage()!, to: "\(artDir)/patients/\(id).jpg", quality: 0.87)
}

paintFolkPortrait(id: "c2-ty-vi-hu-han", isScholar: false)
paintFolkPortrait(id: "c2-can-khi-uat", isScholar: true)

print("Refreshed clean clinic-bg + upgraded all 15 hand-painted assets.")
