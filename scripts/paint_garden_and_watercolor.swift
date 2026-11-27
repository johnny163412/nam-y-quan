import Foundation
import AppKit
import CoreGraphics
import CoreImage

let root = "/Users/thiagop/nam-y-quan"
let artDir = "\(root)/public/art"
let ciContext = CIContext(options: nil)

func loadCG(_ path: String) -> CGImage {
    guard let nsImg = NSImage(contentsOfFile: path) else {
        fatalError("Failed to load image: \(path)")
    }
    var rect = NSRect(origin: .zero, size: nsImg.size)
    guard let cg = nsImg.cgImage(forProposedRect: &rect, context: nil, hints: nil) else {
        fatalError("No CGImage for: \(path)")
    }
    return cg
}

func saveJPEG(_ img: CGImage, to path: String, quality: Double = 0.88) {
    let rep = NSBitmapImageRep(cgImage: img)
    guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality]) else {
        fatalError("JPEG encode failed for \(path)")
    }
    try! data.write(to: URL(fileURLWithPath: path))
}

// 1. Paint lush Vietnamese herbal garden backdrop: public/art/scenes/room-hau-vien.jpg (1280x720)
func paintHerbGardenBackdrop() {
    let w = 1280
    let h = 720
    let ctx = CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.interpolationQuality = .high

    // Morning sky mist gradient (silk wash)
    let skyGrad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.86, green: 0.82, blue: 0.69, alpha: 1.0),
            CGColor(red: 0.72, green: 0.74, blue: 0.60, alpha: 1.0),
            CGColor(red: 0.45, green: 0.50, blue: 0.38, alpha: 1.0)
        ] as CFArray,
        locations: [0.0, 0.52, 1.0]
    )!
    ctx.drawLinearGradient(skyGrad, start: CGPoint(x: 0, y: CGFloat(h)), end: CGPoint(x: 0, y: 0), options: [])

    // Distant misty limestone mountains (ink wash silhouettes)
    let drawHill = { (pts: [(CGFloat, CGFloat)], r: CGFloat, g: CGFloat, b: CGFloat, a: CGFloat) in
        ctx.setFillColor(CGColor(red: r, green: g, blue: b, alpha: a))
        ctx.beginPath()
        ctx.move(to: CGPoint(x: pts[0].0, y: 0))
        for p in pts {
            ctx.addLine(to: CGPoint(x: p.0, y: p.1))
        }
        ctx.addLine(to: CGPoint(x: CGFloat(w), y: 0))
        ctx.closePath()
        ctx.fillPath()
    }
    drawHill([(0, 420), (240, 520), (490, 445), (760, 540), (1050, 460), (1280, 505)], 0.38, 0.44, 0.36, 0.55)
    drawHill([(0, 310), (310, 385), (620, 325), (940, 395), (1280, 340)], 0.27, 0.34, 0.25, 0.72)

    // Soft golden dawn sunbeam halo
    let sunGrad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.99, green: 0.91, blue: 0.68, alpha: 0.62),
            CGColor(red: 0.99, green: 0.91, blue: 0.68, alpha: 0.0)
        ] as CFArray,
        locations: [0.0, 1.0]
    )!
    ctx.drawRadialGradient(sunGrad, startCenter: CGPoint(x: 940, y: 540), startRadius: 10, endCenter: CGPoint(x: 940, y: 540), endRadius: 340, options: [])

    // Garden stone wall & mossy courtyard ground
    ctx.setFillColor(CGColor(red: 0.21, green: 0.25, blue: 0.17, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: 220))

    // Terracotta raised garden beds & bamboo fence slats
    ctx.setStrokeColor(CGColor(red: 0.42, green: 0.33, blue: 0.20, alpha: 0.88))
    ctx.setLineWidth(8)
    for x in stride(from: 60, to: 1240, by: 54) {
        ctx.move(to: CGPoint(x: x, y: 190))
        ctx.addLine(to: CGPoint(x: x, y: 390))
        ctx.strokePath()
    }
    ctx.setLineWidth(6)
    ctx.move(to: CGPoint(x: 40, y: 270))
    ctx.addLine(to: CGPoint(x: 1240, y: 270))
    ctx.strokePath()
    ctx.move(to: CGPoint(x: 40, y: 345))
    ctx.addLine(to: CGPoint(x: 1240, y: 345))
    ctx.strokePath()

    // Lush bamboo clusters on left & right foreground
    srand48(2026)
    let drawBamboo = { (baseX: CGFloat, lean: CGFloat, count: Int) in
        for i in 0..<count {
            let x = baseX + CGFloat(i) * 26
            ctx.setStrokeColor(CGColor(red: 0.16, green: 0.30, blue: 0.18, alpha: 0.92))
            ctx.setLineWidth(5.5 - CGFloat(i % 2))
            ctx.move(to: CGPoint(x: x, y: 180))
            ctx.addQuadCurve(to: CGPoint(x: x + lean, y: 700), control: CGPoint(x: x + lean * 0.45, y: 440))
            ctx.strokePath()
            // Bamboo leaf clusters
            for j in 0..<7 {
                let ly = 270 + CGFloat(j) * 58 + CGFloat(drand48() * 24)
                let lx = x + lean * ((ly - 180) / 520)
                ctx.setFillColor(CGColor(red: 0.18, green: 0.36, blue: 0.20, alpha: 0.85))
                for k in 0..<3 {
                    let ang = (drand48() - 0.5) * 1.4
                    ctx.saveGState()
                    ctx.translateBy(x: lx, y: ly)
                    ctx.rotate(by: CGFloat(ang + Double(k) * 0.38))
                    ctx.fillEllipse(in: CGRect(x: 0, y: -3, width: 34, height: 7))
                    ctx.restoreGState()
                }
            }
        }
    }
    drawBamboo(24, 34, 5)
    drawBamboo(1110, -40, 5)

    // Foreground rustic ironwood timber sill & ceramic pots silhouette
    let woodGrad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.22, green: 0.14, blue: 0.08, alpha: 1.0),
            CGColor(red: 0.12, green: 0.07, blue: 0.04, alpha: 1.0)
        ] as CFArray,
        locations: [0.0, 1.0]
    )!
    ctx.drawLinearGradient(woodGrad, start: CGPoint(x: 0, y: 185), end: CGPoint(x: 0, y: 0), options: [])

    // Subtle wooden eaves overhang at top
    ctx.setFillColor(CGColor(red: 0.13, green: 0.08, blue: 0.05, alpha: 0.92))
    ctx.fill(CGRect(x: 0, y: h - 38, width: w, height: 38))

    // Vignette
    let vigGrad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.08, green: 0.05, blue: 0.03, alpha: 0.0),
            CGColor(red: 0.07, green: 0.04, blue: 0.02, alpha: 0.45)
        ] as CFArray,
        locations: [0.55, 1.0]
    )!
    let center = CGPoint(x: CGFloat(w) / 2, y: CGFloat(h) / 2)
    ctx.drawRadialGradient(vigGrad, startCenter: center, startRadius: 200, endCenter: center, endRadius: 760, options: [.drawsAfterEndLocation])

    if let cg = ctx.makeImage() {
        saveJPEG(cg, to: "\(artDir)/scenes/room-hau-vien.jpg", quality: 0.87)
    }
}

// 2. Harmonize the 12 archival herbs into cohesive hand-painted watercolor style on warm #FAF5E8 Giấy Điệp
let archivalHerbIds = [
    "sinh-khuong", "cam-thao", "que-chi", "bac-ha", "kim-ngan-hoa", "lac-tien",
    "ky-tu", "dan-sam", "hoai-son", "tran-bi", "tam-sen", "co-xuoc"
]

for herbId in archivalHerbIds {
    let path = "\(artDir)/herbs/\(herbId).jpg"
    let cg = loadCG(path)
    var ci = CIImage(cgImage: cg)

    // Subtle painterly softness + watercolor pigment vibrancy + warm cream edge blend
    if let smooth = CIFilter(name: "CINoiseReduction") {
        smooth.setValue(ci, forKey: kCIInputImageKey)
        smooth.setValue(0.04, forKey: "inputNoiseLevel")
        smooth.setValue(0.35, forKey: "inputSharpness")
        if let out = smooth.outputImage { ci = out }
    }
    if let col = CIFilter(name: "CIColorControls") {
        col.setValue(ci, forKey: kCIInputImageKey)
        col.setValue(1.14, forKey: kCIInputSaturationKey)
        col.setValue(1.04, forKey: kCIInputContrastKey)
        col.setValue(0.015, forKey: kCIInputBrightnessKey)
        if let out = col.outputImage { ci = out }
    }
    if let temp = CIFilter(name: "CITemperatureAndTint") {
        temp.setValue(ci, forKey: kCIInputImageKey)
        temp.setValue(CIVector(x: 6500, y: 0), forKey: "inputNeutral")
        temp.setValue(CIVector(x: 6950, y: -5), forKey: "inputTargetNeutral")
        if let out = temp.outputImage { ci = out }
    }

    guard let processed = ciContext.createCGImage(ci, from: ci.extent) else { continue }

    let w = 360
    let h = 360
    let ctx = CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.setFillColor(CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.draw(processed, in: CGRect(x: 0, y: 0, width: w, height: h))

    // Soft organic watercolor bleed fade into #FAF5E8 Giấy Điệp
    let fadeGrad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 0.0),
            CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 0.55),
            CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 1.0)
        ] as CFArray,
        locations: [0.58, 0.88, 1.0]
    )!
    let c = CGPoint(x: 180, y: 180)
    ctx.drawRadialGradient(fadeGrad, startCenter: c, startRadius: 0, endCenter: c, endRadius: 178, options: [.drawsAfterEndLocation])

    if let finalImg = ctx.makeImage() {
        saveJPEG(finalImg, to: path, quality: 0.89)
    }
}

paintHerbGardenBackdrop()
print("Harmonized 12 archival herbs to watercolor look and painted room-hau-vien.jpg!")
