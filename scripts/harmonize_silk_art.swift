import Foundation
import AppKit
import CoreGraphics
import CoreImage

let root = "/Users/thiagop/nam-y-quan"
let rawArch = "\(root)/scripts/raw/archival"
let rawMaster = "\(root)/scripts/raw"
let artDir = "\(root)/public/art"
let scenesDir = "\(artDir)/scenes"
let ciContext = CIContext(options: nil)

try? FileManager.default.createDirectory(atPath: scenesDir, withIntermediateDirectories: true)

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

func cropFrac(_ cg: CGImage, x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat) -> CGImage {
    let rect = CGRect(
        x: CGFloat(cg.width) * x,
        y: CGFloat(cg.height) * y,
        width: CGFloat(cg.width) * w,
        height: CGFloat(cg.height) * h
    )
    return cg.cropping(to: rect) ?? cg
}

func makeCanvas(w: Int, h: Int, bg: (CGFloat, CGFloat, CGFloat) = (0.980, 0.961, 0.910)) -> CGContext {
    let ctx = CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.interpolationQuality = .high
    ctx.setFillColor(CGColor(red: bg.0, green: bg.1, blue: bg.2, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    return ctx
}

func drawPaperGrain(_ ctx: CGContext, w: Int, h: Int, seed: Int, alpha: CGFloat = 0.032) {
    srand48(seed)
    ctx.setLineWidth(0.75)
    for _ in 0..<140 {
        let x = CGFloat(drand48()) * CGFloat(w)
        let y = CGFloat(drand48()) * CGFloat(h)
        let len = CGFloat(drand48()) * 14 + 4
        let ang = CGFloat(drand48()) * .pi
        ctx.setStrokeColor(CGColor(red: 0.56, green: 0.44, blue: 0.28, alpha: alpha))
        ctx.move(to: CGPoint(x: x, y: y))
        ctx.addLine(to: CGPoint(x: x + cos(ang) * len, y: y + sin(ang) * len))
        ctx.strokePath()
    }
    for _ in 0..<420 {
        let x = CGFloat(drand48()) * CGFloat(w)
        let y = CGFloat(drand48()) * CGFloat(h)
        let r = CGFloat(drand48()) * 1.4 + 0.3
        ctx.setFillColor(CGColor(red: 0.48, green: 0.36, blue: 0.20, alpha: alpha * 0.85))
        ctx.fillEllipse(in: CGRect(x: x, y: y, width: r, height: r))
    }
}

func softBloom(_ ctx: CGContext, cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, r: CGFloat, g: CGFloat, b: CGFloat, alpha: CGFloat) {
    let grad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: r, green: g, blue: b, alpha: alpha),
            CGColor(red: r, green: g, blue: b, alpha: alpha * 0.48),
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

func edgeFadeToIvory(_ ctx: CGContext, w: CGFloat, h: CGFloat, innerFrac: CGFloat = 0.56, bg: (CGFloat, CGFloat, CGFloat) = (0.980, 0.961, 0.910)) {
    let grad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: bg.0, green: bg.1, blue: bg.2, alpha: 0.0),
            CGColor(red: bg.0, green: bg.1, blue: bg.2, alpha: 0.68),
            CGColor(red: bg.0, green: bg.1, blue: bg.2, alpha: 1.0)
        ] as CFArray,
        locations: [innerFrac, 0.86, 1.0]
    )!
    let center = CGPoint(x: w / 2, y: h / 2)
    ctx.saveGState()
    ctx.drawRadialGradient(grad, startCenter: center, startRadius: 0, endCenter: center, endRadius: min(w, h) * 0.50, options: [.drawsAfterEndLocation])
    ctx.restoreGState()
}

func darkLacquerVignette(_ ctx: CGContext, w: CGFloat, h: CGFloat, alpha: CGFloat = 0.48) {
    let grad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.14, green: 0.09, blue: 0.05, alpha: 0.0),
            CGColor(red: 0.09, green: 0.05, blue: 0.03, alpha: alpha)
        ] as CFArray,
        locations: [0.46, 1.0]
    )!
    let center = CGPoint(x: w / 2, y: h / 2)
    ctx.saveGState()
    ctx.drawRadialGradient(grad, startCenter: center, startRadius: min(w, h) * 0.25, endCenter: center, endRadius: max(w, h) * 0.68, options: [.drawsAfterEndLocation])
    ctx.restoreGState()
}

func applyCIPolish(_ cg: CGImage, sat: Double = 1.05, contrast: Double = 1.12, bright: Double = 0.03, tempShift: Double = 600, gentleBlur: Double = 0.0, sepia: Double = 0.0) -> CGImage {
    var ci = CIImage(cgImage: cg)
    if gentleBlur > 0, let blur = CIFilter(name: "CIGaussianBlur") {
        blur.setValue(ci, forKey: kCIInputImageKey)
        blur.setValue(gentleBlur, forKey: kCIInputRadiusKey)
        if let out = blur.outputImage { ci = out.cropped(to: ci.extent) }
    }
    if let col = CIFilter(name: "CIColorControls") {
        col.setValue(ci, forKey: kCIInputImageKey)
        col.setValue(sat, forKey: kCIInputSaturationKey)
        col.setValue(contrast, forKey: kCIInputContrastKey)
        col.setValue(bright, forKey: kCIInputBrightnessKey)
        if let out = col.outputImage { ci = out }
    }
    if let temp = CIFilter(name: "CITemperatureAndTint") {
        temp.setValue(ci, forKey: kCIInputImageKey)
        temp.setValue(CIVector(x: 6500, y: 0), forKey: "inputNeutral")
        temp.setValue(CIVector(x: 6500 + tempShift, y: -6), forKey: "inputTargetNeutral")
        if let out = temp.outputImage { ci = out }
    }
    if sepia > 0, let sep = CIFilter(name: "CISepiaTone") {
        sep.setValue(ci, forKey: kCIInputImageKey)
        sep.setValue(sepia, forKey: kCIInputIntensityKey)
        if let out = sep.outputImage { ci = out }
    }
    if let sharp = CIFilter(name: "CIUnsharpMask") {
        sharp.setValue(ci, forKey: kCIInputImageKey)
        sharp.setValue(1.3, forKey: kCIInputRadiusKey)
        sharp.setValue(0.45, forKey: kCIInputIntensityKey)
        if let out = sharp.outputImage { ci = out }
    }
    return ciContext.createCGImage(ci, from: ci.extent) ?? cg
}

// =========================================================================
// 1. HARMONIZE 12 BOTANICAL HERB PLATES ONTO WARM #FAF5E8 GIẤY ĐIỆP (360x360)
// =========================================================================
struct HerbCropSpec {
    let id: String
    let file: String
    let crop: CGRect
    let isPhotoSpecimen: Bool
    let isLineEngraving: Bool
    let boostWarm: Double
    let paddingFrac: CGFloat
}

let herbSpecs: [HerbCropSpec] = [
    HerbCropSpec(id: "sinh-khuong", file: "sinh_khuong.jpg", crop: CGRect(x: 0.02, y: 0.02, width: 0.96, height: 0.95), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 550, paddingFrac: 0.05),
    HerbCropSpec(id: "cam-thao", file: "cam_thao.jpg", crop: CGRect(x: 0.02, y: 0.02, width: 0.96, height: 0.93), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 500, paddingFrac: 0.05),
    HerbCropSpec(id: "que-chi", file: "que_chi.jpg", crop: CGRect(x: 0.02, y: 0.02, width: 0.96, height: 0.94), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 550, paddingFrac: 0.05),
    HerbCropSpec(id: "bac-ha", file: "bac_ha.jpg", crop: CGRect(x: 0.06, y: 0.08, width: 0.39, height: 0.80), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 400, paddingFrac: 0.05),
    HerbCropSpec(id: "kim-ngan-hoa", file: "kim_ngan_hoa.jpg", crop: CGRect(x: 0.14, y: 0.56, width: 0.74, height: 0.34), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 350, paddingFrac: 0.04),
    HerbCropSpec(id: "lac-tien", file: "lac_tien.jpg", crop: CGRect(x: 0.04, y: 0.03, width: 0.92, height: 0.85), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 450, paddingFrac: 0.05),
    HerbCropSpec(id: "ky-tu", file: "ky_tu.jpg", crop: CGRect(x: 0.10, y: 0.10, width: 0.78, height: 0.76), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 500, paddingFrac: 0.05),
    HerbCropSpec(id: "dan-sam", file: "dan_sam.jpg", crop: CGRect(x: 0.16, y: 0.13, width: 0.54, height: 0.52), isPhotoSpecimen: true, isLineEngraving: false, boostWarm: 900, paddingFrac: 0.04),
    HerbCropSpec(id: "hoai-son", file: "hoai_son.jpg", crop: CGRect(x: 0.03, y: 0.02, width: 0.94, height: 0.84), isPhotoSpecimen: false, isLineEngraving: true, boostWarm: 700, paddingFrac: 0.05),
    HerbCropSpec(id: "tam-sen", file: "tam_sen.jpg", crop: CGRect(x: 0.02, y: 0.02, width: 0.96, height: 0.94), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 500, paddingFrac: 0.05),
    HerbCropSpec(id: "tran-bi", file: "tran_bi.jpg", crop: CGRect(x: 0.04, y: 0.04, width: 0.92, height: 0.92), isPhotoSpecimen: true, isLineEngraving: false, boostWarm: 950, paddingFrac: 0.05),
    HerbCropSpec(id: "co-xuoc", file: "co_xuoc.jpg", crop: CGRect(x: 0.03, y: 0.03, width: 0.94, height: 0.94), isPhotoSpecimen: false, isLineEngraving: false, boostWarm: 550, paddingFrac: 0.05),
]

for (idx, spec) in herbSpecs.enumerated() {
    let raw = loadCG("\(rawArch)/\(spec.file)")
    let cropped = cropFrac(raw, x: spec.crop.origin.x, y: spec.crop.origin.y, w: spec.crop.size.width, h: spec.crop.size.height)

    let polished: CGImage
    if spec.isPhotoSpecimen {
        polished = applyCIPolish(cropped, sat: 1.22, contrast: 1.15, bright: 0.04, tempShift: spec.boostWarm, gentleBlur: 0.5, sepia: 0.14)
    } else if spec.isLineEngraving {
        polished = applyCIPolish(cropped, sat: 0.65, contrast: 1.20, bright: 0.04, tempShift: spec.boostWarm, gentleBlur: 0.0, sepia: 0.45)
    } else if spec.id == "kim-ngan-hoa" {
        polished = applyCIPolish(cropped, sat: 1.18, contrast: 1.24, bright: 0.12, tempShift: spec.boostWarm, gentleBlur: 0.0, sepia: 0.0)
    } else {
        polished = applyCIPolish(cropped, sat: 1.06, contrast: 1.14, bright: 0.06, tempShift: spec.boostWarm, gentleBlur: 0.0, sepia: 0.04)
    }

    let size = 360
    let ctx = makeCanvas(w: size, h: size, bg: (0.980, 0.961, 0.910))

    // Aspect-fit into padded square
    let avail = CGFloat(size) * (1.0 - spec.paddingFrac * 2)
    let iw = CGFloat(polished.width)
    let ih = CGFloat(polished.height)
    let scale = min(avail / iw, avail / ih)
    let dw = iw * scale
    let dh = ih * scale
    let dx = (CGFloat(size) - dw) / 2
    let dy = (CGFloat(size) - dh) / 2

    if spec.isPhotoSpecimen {
        let tmp = makeCanvas(w: size, h: size, bg: (0.980, 0.961, 0.910))
        tmp.draw(polished, in: CGRect(x: dx, y: dy, width: dw, height: dh))
        edgeFadeToIvory(tmp, w: CGFloat(size), h: CGFloat(size), innerFrac: 0.50)
        tmp.setStrokeColor(CGColor(red: 0.34, green: 0.22, blue: 0.12, alpha: 0.32))
        tmp.setLineWidth(1.5)
        tmp.strokeEllipse(in: CGRect(x: 24, y: 24, width: size - 48, height: size - 48))
        ctx.draw(tmp.makeImage()!, in: CGRect(x: 0, y: 0, width: size, height: size))
    } else {
        ctx.saveGState()
        ctx.setBlendMode(.multiply)
        ctx.draw(polished, in: CGRect(x: dx, y: dy, width: dw, height: dh))
        ctx.restoreGState()
        if spec.id == "kim-ngan-hoa" {
            // Feather top/bottom rectangular edge cleanly into #FAF5E8 Giấy Điệp
            let tbFade = CGGradient(
                colorsSpace: CGColorSpaceCreateDeviceRGB(),
                colors: [
                    CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 1.0),
                    CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 0.0),
                    CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 0.0),
                    CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 1.0)
                ] as CFArray,
                locations: [0.22, 0.36, 0.64, 0.78]
            )!
            ctx.drawLinearGradient(tbFade, start: CGPoint(x: 0, y: 0), end: CGPoint(x: 0, y: size), options: [])
        } else {
            edgeFadeToIvory(ctx, w: CGFloat(size), h: CGFloat(size), innerFrac: 0.88)
        }
        if spec.id == "hoai-son" {
            softBloom(ctx, cx: 112, cy: 238, rx: 64, ry: 52, r: 0.45, g: 0.62, b: 0.38, alpha: 0.20)
            softBloom(ctx, cx: 266, cy: 256, rx: 56, ry: 46, r: 0.45, g: 0.62, b: 0.38, alpha: 0.18)
        }
    }

    drawPaperGrain(ctx, w: size, h: size, seed: 200 + idx, alpha: 0.024)
    saveJPEG(ctx.makeImage()!, to: "\(artDir)/herbs/\(spec.id).jpg", quality: 0.88)
}

// =========================================================================
// 2. HARMONIZE 2 HISTORICAL VIETNAMESE PORTRAITS (c2-ty-vi-hu-han & c2-can-khi-uat, 480x640)
// =========================================================================
func makeHarmonizedPortrait(rawPath: String, cropRect: CGRect, outId: String, tintColor: (CGFloat, CGFloat, CGFloat), robeWash: (CGFloat, CGFloat, CGFloat), gentleBlur: Double, seed: Int) {
    let raw = loadCG(rawPath)
    let cropped = cropFrac(raw, x: cropRect.origin.x, y: cropRect.origin.y, w: cropRect.size.width, h: cropRect.size.height)
    let polished = applyCIPolish(cropped, sat: 0.86, contrast: 1.12, bright: 0.06, tempShift: 750, gentleBlur: gentleBlur, sepia: 0.26)

    let w = 480, h = 640
    let ctx = makeCanvas(w: w, h: h, bg: (0.14, 0.09, 0.05))

    let scale = max(CGFloat(w) / CGFloat(polished.width), CGFloat(h) / CGFloat(polished.height))
    let dw = CGFloat(polished.width) * scale
    let dh = CGFloat(polished.height) * scale
    ctx.draw(polished, in: CGRect(x: (CGFloat(w) - dw) / 2, y: (CGFloat(h) - dh) / 2, width: dw, height: dh))

    softBloom(ctx, cx: 240, cy: 380, rx: 150, ry: 175, r: tintColor.0, g: tintColor.1, b: tintColor.2, alpha: 0.16)
    softBloom(ctx, cx: 240, cy: 110, rx: 220, ry: 160, r: robeWash.0, g: robeWash.1, b: robeWash.2, alpha: 0.24)
    drawPaperGrain(ctx, w: w, h: h, seed: seed, alpha: 0.028)
    darkLacquerVignette(ctx, w: CGFloat(w), h: CGFloat(h), alpha: 0.50)
    saveJPEG(ctx.makeImage()!, to: "\(artDir)/patients/\(outId).jpg", quality: 0.88)
}

// Bà Năm Trầu: crisp bust portrait (minimal blur so face & plaque brushwork stay sharp)
makeHarmonizedPortrait(
    rawPath: "\(rawArch)/ba_nam_trau.jpg",
    cropRect: CGRect(x: 0.42, y: 0.21, width: 0.35, height: 0.40),
    outId: "c2-ty-vi-hu-han",
    tintColor: (0.94, 0.78, 0.52),
    robeWash: (0.44, 0.26, 0.14),
    gentleBlur: 0.25,
    seed: 301
)

// Cậu Minh: Confucian scholar (gentle 0.9px blur softens newspaper halftone dots cleanly)
makeHarmonizedPortrait(
    rawPath: "\(rawArch)/cau_minh.jpg",
    cropRect: CGRect(x: 0.03, y: 0.03, width: 0.94, height: 0.90),
    outId: "c2-can-khi-uat",
    tintColor: (0.88, 0.74, 0.48),
    robeWash: (0.14, 0.28, 0.42),
    gentleBlur: 0.9,
    seed: 302
)

// =========================================================================
// 3. UPGRADE DECOCTION STOVE (public/art/tools/decoction-stove.jpg, 680x340)
// =========================================================================
func buildDecoctionStove() {
    let w = 680, h = 340
    let ctx = makeCanvas(w: w, h: h, bg: (0.10, 0.06, 0.03))

    let shop = applyCIPolish(cropFrac(loadCG("\(rawArch)/herbalist_shop.jpg"), x: 0.34, y: 0.12, w: 0.63, h: 0.78), sat: 0.85, contrast: 1.08, bright: -0.26, tempShift: 950, gentleBlur: 1.8, sepia: 0.24)
    ctx.saveGState()
    ctx.setAlpha(0.54)
    ctx.draw(shop, in: CGRect(x: 0, y: 74, width: w, height: h - 74))
    ctx.restoreGState()

    // Rustic dark ironwood apothecary hearth bench at bottom
    ctx.setFillColor(CGColor(red: 0.15, green: 0.09, blue: 0.05, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: 90))
    ctx.setStrokeColor(CGColor(red: 0.48, green: 0.32, blue: 0.16, alpha: 0.45))
    ctx.setLineWidth(1.5)
    ctx.move(to: CGPoint(x: 0, y: 89))
    ctx.addLine(to: CGPoint(x: CGFloat(w), y: 89))
    ctx.strokePath()

    softBloom(ctx, cx: 340, cy: 130, rx: 280, ry: 185, r: 0.92, g: 0.44, b: 0.14, alpha: 0.38)

    // Clay brazier pedestal (bếp lò đất nung)
    let brazier = CGMutablePath()
    brazier.move(to: CGPoint(x: 248, y: 20))
    brazier.addLine(to: CGPoint(x: 432, y: 20))
    brazier.addQuadCurve(to: CGPoint(x: 446, y: 122), control: CGPoint(x: 452, y: 74))
    brazier.addLine(to: CGPoint(x: 234, y: 122))
    brazier.addQuadCurve(to: CGPoint(x: 248, y: 20), control: CGPoint(x: 228, y: 74))
    brazier.closeSubpath()
    ctx.addPath(brazier)
    ctx.setFillColor(CGColor(red: 0.24, green: 0.17, blue: 0.12, alpha: 1.0))
    ctx.fillPath()
    ctx.addPath(brazier)
    ctx.setStrokeColor(CGColor(red: 0.09, green: 0.05, blue: 0.03, alpha: 1.0))
    ctx.setLineWidth(2.6)
    ctx.strokePath()

    ctx.setFillColor(CGColor(red: 0.08, green: 0.03, blue: 0.02, alpha: 1.0))
    ctx.fillEllipse(in: CGRect(x: 288, y: 32, width: 104, height: 58))
    for (ex, ey, er) in [(314.0, 54.0, 14.0), (340.0, 50.0, 16.0), (364.0, 56.0, 13.0), (328.0, 64.0, 12.0), (352.0, 64.0, 12.0)] {
        softBloom(ctx, cx: ex, cy: ey, rx: er * 1.7, ry: er * 1.4, r: 0.99, g: 0.38, b: 0.08, alpha: 0.92)
    }

    // Authentic Yixing stoneware clay pot nestled on top of brazier — wide unclipped radial alpha fade (no handle/spout cut!)
    let potRaw = loadCG("\(rawArch)/clay_pot.jpg")
    let potCropped = cropFrac(potRaw, x: 0.02, y: 0.22, w: 0.96, h: 0.56)
    let potGraded = applyCIPolish(potCropped, sat: 1.24, contrast: 1.38, bright: -0.10, tempShift: 1100, gentleBlur: 0.2, sepia: 0.18)

    let potCiBg = CIImage(color: CIColor(red: 0, green: 0, blue: 0, alpha: 0)).cropped(to: CGRect(x: 0, y: 0, width: w, height: h))
    let potCanvas = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    let potFrame = CGRect(x: 162, y: 96, width: 356, height: 184)
    potCanvas.draw(potGraded, in: potFrame)
    let potImg = potCanvas.makeImage()!

    if let vigMask = CIFilter(name: "CIRadialGradient") {
        vigMask.setValue(CIVector(x: 340, y: 184), forKey: "inputCenter")
        vigMask.setValue(84.0, forKey: "inputRadius0")
        vigMask.setValue(148.0, forKey: "inputRadius1")
        vigMask.setValue(CIColor(red: 1, green: 1, blue: 1, alpha: 1), forKey: "inputColor0")
        vigMask.setValue(CIColor(red: 0, green: 0, blue: 0, alpha: 0), forKey: "inputColor1")
        if let maskOut = vigMask.outputImage?.cropped(to: CGRect(x: 0, y: 0, width: w, height: h)),
           let blend = CIFilter(name: "CIBlendWithAlphaMask") {
            blend.setValue(CIImage(cgImage: potImg), forKey: kCIInputImageKey)
            blend.setValue(potCiBg, forKey: kCIInputBackgroundImageKey)
            blend.setValue(maskOut, forKey: kCIInputMaskImageKey)
            if let blended = blend.outputImage, let finalPot = ciContext.createCGImage(blended, from: CGRect(x: 0, y: 0, width: w, height: h)) {
                ctx.draw(finalPot, in: CGRect(x: 0, y: 0, width: w, height: h))
            }
        }
    }
    softBloom(ctx, cx: 340, cy: 118, rx: 120, ry: 34, r: 0.98, g: 0.44, b: 0.12, alpha: 0.42)

    // Celadon porcelain bowl of decoction on right bench
    ctx.setFillColor(CGColor(red: 0.84, green: 0.81, blue: 0.72, alpha: 1.0))
    ctx.fillEllipse(in: CGRect(x: 522, y: 34, width: 92, height: 42))
    ctx.setStrokeColor(CGColor(red: 0.18, green: 0.12, blue: 0.08, alpha: 1.0))
    ctx.setLineWidth(2.0)
    ctx.strokeEllipse(in: CGRect(x: 522, y: 34, width: 92, height: 42))
    ctx.setFillColor(CGColor(red: 0.38, green: 0.21, blue: 0.09, alpha: 0.95))
    ctx.fillEllipse(in: CGRect(x: 532, y: 44, width: 72, height: 22))

    // Rising silk steam wisps
    for sx in [318.0, 360.0, 466.0] {
        softBloom(ctx, cx: sx, cy: 294, rx: 28, ry: 46, r: 0.97, g: 0.94, b: 0.86, alpha: 0.28)
    }

    darkLacquerVignette(ctx, w: CGFloat(w), h: CGFloat(h), alpha: 0.46)
    saveJPEG(ctx.makeImage()!, to: "\(artDir)/tools/decoction-stove.jpg", quality: 0.88)
}
buildDecoctionStove()

// =========================================================================
// 4. PAINTED DORSAL SILK MERIDIAN SCROLL (delegated to paint_meridian_back.swift)
// =========================================================================
func buildMeridianBackScroll() {
    let task = Process()
    task.executableURL = URL(fileURLWithPath: "/usr/bin/swift")
    task.arguments = ["\(root)/scripts/paint_meridian_back.swift"]
    try? task.run()
    task.waitUntilExit()
}
buildMeridianBackScroll()

// =========================================================================
// 5. 5 ATMOSPHERIC ĐÔNG Y & FOLKLORE SCENE BANNERS (public/art/scenes/*.jpg)
// =========================================================================
func buildPanoramaBanner(outName: String, leftPath: String, leftCrop: CGRect, rightPath: String?, rightCrop: CGRect?, warmTint: (CGFloat, CGFloat, CGFloat), rightDarken: Bool = false, seed: Int) {
    let w = 1200, h = 260
    let ctx = makeCanvas(w: w, h: h, bg: (0.14, 0.09, 0.05))

    let leftRaw = applyCIPolish(cropFrac(loadCG(leftPath), x: leftCrop.origin.x, y: leftCrop.origin.y, w: leftCrop.size.width, h: leftCrop.size.height), sat: 0.92, contrast: 1.14, bright: -0.05, tempShift: 750, gentleBlur: 0.4, sepia: 0.16)
    if let rPath = rightPath, let rCrop = rightCrop {
        let rightRaw = applyCIPolish(cropFrac(loadCG(rPath), x: rCrop.origin.x, y: rCrop.origin.y, w: rCrop.size.width, h: rCrop.size.height), sat: 0.90, contrast: 1.14, bright: rightDarken ? -0.14 : -0.05, tempShift: 850, gentleBlur: 0.4, sepia: rightDarken ? 0.34 : 0.16)
        ctx.draw(leftRaw, in: CGRect(x: 0, y: -30, width: 650, height: 320))
        ctx.saveGState()
        ctx.setAlpha(0.92)
        ctx.draw(rightRaw, in: CGRect(x: 560, y: -30, width: 640, height: 320))
        ctx.restoreGState()
        // Soft velvety horizontal center dissolve (wide wood-lacquer blend)
        let seamGrad = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: [
                CGColor(red: 0.14, green: 0.09, blue: 0.05, alpha: 0.0),
                CGColor(red: 0.14, green: 0.09, blue: 0.05, alpha: 0.88),
                CGColor(red: 0.14, green: 0.09, blue: 0.05, alpha: 0.0)
            ] as CFArray,
            locations: [0.0, 0.5, 1.0]
        )!
        ctx.drawLinearGradient(seamGrad, start: CGPoint(x: 470, y: 130), end: CGPoint(x: 690, y: 130), options: [])
    } else {
        ctx.draw(leftRaw, in: CGRect(x: 0, y: -20, width: w, height: h + 40))
    }

    let leftScrim = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.11, green: 0.07, blue: 0.04, alpha: 0.88),
            CGColor(red: 0.11, green: 0.07, blue: 0.04, alpha: 0.52),
            CGColor(red: 0.11, green: 0.07, blue: 0.04, alpha: 0.24)
        ] as CFArray,
        locations: [0.0, 0.45, 1.0]
    )!
    ctx.drawLinearGradient(leftScrim, start: CGPoint(x: 0, y: 130), end: CGPoint(x: CGFloat(w), y: 130), options: [])
    softBloom(ctx, cx: 920, cy: 150, rx: 280, ry: 160, r: warmTint.0, g: warmTint.1, b: warmTint.2, alpha: 0.20)
    darkLacquerVignette(ctx, w: CGFloat(w), h: CGFloat(h), alpha: 0.42)
    drawPaperGrain(ctx, w: w, h: h, seed: seed, alpha: 0.025)
    saveJPEG(ctx.makeImage()!, to: "\(scenesDir)/\(outName)", quality: 0.87)
}

buildPanoramaBanner(
    outName: "clinic-hall.jpg",
    leftPath: "\(rawArch)/medicine_cabinet.jpg",
    leftCrop: CGRect(x: 0.20, y: 0.26, width: 0.62, height: 0.40),
    rightPath: "\(rawArch)/herbalist_shop.jpg",
    rightCrop: CGRect(x: 0.36, y: 0.16, width: 0.60, height: 0.56),
    warmTint: (0.94, 0.62, 0.22),
    seed: 501
)

buildPanoramaBanner(
    outName: "tang-thu-library.jpg",
    leftPath: "\(rawArch)/ming_materia.jpg",
    leftCrop: CGRect(x: 0.08, y: 0.38, width: 0.84, height: 0.44),
    rightPath: "\(rawArch)/ancient_meridian.jpg",
    rightCrop: CGRect(x: 0.12, y: 0.18, width: 0.72, height: 0.46),
    warmTint: (0.85, 0.66, 0.34),
    seed: 502
)

buildPanoramaBanner(
    outName: "y-mieu-temple.jpg",
    leftPath: "\(rawArch)/van_mieu.jpg",
    leftCrop: CGRect(x: 0.04, y: 0.16, width: 0.90, height: 0.44),
    rightPath: nil,
    rightCrop: nil,
    warmTint: (0.86, 0.32, 0.22),
    seed: 503
)

buildPanoramaBanner(
    outName: "duong-sinh-scroll.jpg",
    leftPath: "\(rawArch)/dong_ho.jpg",
    leftCrop: CGRect(x: 0.08, y: 0.24, width: 0.84, height: 0.34),
    rightPath: "\(rawArch)/ky_tu.jpg",
    rightCrop: CGRect(x: 0.10, y: 0.18, width: 0.76, height: 0.54),
    warmTint: (0.92, 0.68, 0.30),
    rightDarken: true,
    seed: 504
)

func buildAncientMeridianPlate() {
    let raw = cropFrac(loadCG("\(rawArch)/ancient_meridian.jpg"), x: 0.05, y: 0.03, w: 0.90, h: 0.92)
    let polished = applyCIPolish(raw, sat: 0.90, contrast: 1.15, bright: 0.02, tempShift: 650, gentleBlur: 0.0, sepia: 0.15)
    let w = 480, h = 680
    let ctx = makeCanvas(w: w, h: h, bg: (0.87, 0.79, 0.64))
    ctx.draw(polished, in: CGRect(x: 0, y: 0, width: w, height: h))
    darkLacquerVignette(ctx, w: CGFloat(w), h: CGFloat(h), alpha: 0.22)
    saveJPEG(ctx.makeImage()!, to: "\(scenesDir)/ancient-meridian-woodblock.jpg", quality: 0.88)
}
buildAncientMeridianPlate()

print("Harmonized all archival herbs, portraits, stove, meridian-back & 5 scenes.")
