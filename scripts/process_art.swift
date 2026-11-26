import Foundation
import AppKit
import CoreGraphics
import CoreImage

let projectRoot = "/Users/thiagop/.gemini/antigravity/scratch/nam-y-quan"
let rawDir = "\(projectRoot)/scripts/raw"
let artDir = "\(projectRoot)/public/art"
let ciContext = CIContext(options: nil)

func loadCGImage(from path: String) -> CGImage? {
    guard let nsImg = NSImage(contentsOfFile: path) else { return nil }
    var rect = NSRect(origin: .zero, size: nsImg.size)
    return nsImg.cgImage(forProposedRect: &rect, context: nil, hints: nil)
}

func saveJPEG(_ image: CGImage, to path: String, quality: Double = 0.85) {
    let rep = NSBitmapImageRep(cgImage: image)
    guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality]) else {
        fatalError("Failed JPEG encode for \(path)")
    }
    try! data.write(to: URL(fileURLWithPath: path))
}

func savePNG(_ image: CGImage, to path: String) {
    let rep = NSBitmapImageRep(cgImage: image)
    guard let data = rep.representation(using: .png, properties: [:]) else {
        fatalError("Failed PNG encode for \(path)")
    }
    try! data.write(to: URL(fileURLWithPath: path))
}

func cropAndResize(_ cg: CGImage, insetFrac: CGFloat, targetW: Int, targetH: Int) -> CGImage {
    let w = CGFloat(cg.width)
    let h = CGFloat(cg.height)
    let cropRect = CGRect(
        x: w * insetFrac,
        y: h * insetFrac,
        width: w * (1 - 2 * insetFrac),
        height: h * (1 - 2 * insetFrac)
    )
    let cropped = cg.cropping(to: cropRect) ?? cg
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let ctx = CGContext(
        data: nil,
        width: targetW,
        height: targetH,
        bitsPerComponent: 8,
        bytesPerRow: targetW * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.interpolationQuality = .high
    ctx.draw(cropped, in: CGRect(x: 0, y: 0, width: targetW, height: targetH))
    return ctx.makeImage()!
}

// 1. Meridian Front (6% inset crop -> 500x888)
guard let mFrontRaw = loadCGImage(from: "\(rawDir)/meridian_front.jpg") else {
    fatalError("Missing meridian_front.jpg")
}
let mFront = cropAndResize(mFrontRaw, insetFrac: 0.06, targetW: 500, targetH: 888)
saveJPEG(mFront, to: "\(artDir)/meridians/meridian-front.jpg", quality: 0.86)

// 2. Meridian Back derived cleanly from cropped mFront
func buildMeridianBack(from front: CGImage) -> CGImage {
    let w = 500
    let h = 888
    let ctx = CGContext(
        data: nil,
        width: w,
        height: h,
        bitsPerComponent: 8,
        bytesPerRow: w * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.draw(front, in: CGRect(x: 0, y: 0, width: w, height: h))

    // Note: CoreGraphics origin (0,0) is BOTTOM-LEFT. Convert top-down Y via yTop -> (h - yTop).
    func topRect(x: CGFloat, yTop: CGFloat, width: CGFloat, height: CGFloat) -> CGRect {
        return CGRect(x: x, y: CGFloat(h) - yTop - height, width: width, height: height)
    }

    // Paint back-of-head sumi hair smoothly over face oval (leaving ears at x < 208 or x > 292 visible)
    ctx.saveGState()
    let hairPath = CGMutablePath()
    hairPath.addEllipse(in: topRect(x: 211, yTop: 112, width: 78, height: 100))
    ctx.addPath(hairPath)
    ctx.clip()
    let hairGrad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            CGColor(red: 0.16, green: 0.15, blue: 0.14, alpha: 0.98),
            CGColor(red: 0.22, green: 0.20, blue: 0.18, alpha: 0.98)
        ] as CFArray,
        locations: [0.0, 1.0]
    )!
    ctx.drawLinearGradient(
        hairGrad,
        start: CGPoint(x: 250, y: CGFloat(h) - 110),
        end: CGPoint(x: 250, y: CGFloat(h) - 212),
        options: []
    )
    ctx.restoreGState()

    // Tapered nape hairline
    ctx.setFillColor(CGColor(red: 0.18, green: 0.17, blue: 0.16, alpha: 0.95))
    ctx.fillEllipse(in: topRect(x: 223, yTop: 185, width: 54, height: 32))

    // Softly paint out front chest nipples and navel with warm skin wash (#DEC19D)
    func drawSkinPatch(cx: CGFloat, cyTop: CGFloat, rx: CGFloat, ry: CGFloat) {
        let center = CGPoint(x: cx, y: CGFloat(h) - cyTop)
        let grad = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: [
                CGColor(red: 0.86, green: 0.74, blue: 0.59, alpha: 0.97),
                CGColor(red: 0.86, green: 0.74, blue: 0.59, alpha: 0.0)
            ] as CFArray,
            locations: [0.0, 1.0]
        )!
        ctx.saveGState()
        ctx.translateBy(x: center.x, y: center.y)
        ctx.scaleBy(x: 1.0, y: ry / rx)
        ctx.drawRadialGradient(grad, startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: rx, options: [])
        ctx.restoreGState()
    }

    drawSkinPatch(cx: 205, cyTop: 292, rx: 22, ry: 18) // left nipple
    drawSkinPatch(cx: 295, cyTop: 292, rx: 22, ry: 18) // right nipple
    drawSkinPatch(cx: 250, cyTop: 388, rx: 22, ry: 20) // navel

    // Soften front loincloth flap shadow slightly
    ctx.setFillColor(CGColor(red: 0.67, green: 0.63, blue: 0.50, alpha: 0.45))
    ctx.fill(topRect(x: 224, yTop: 422, width: 52, height: 68))

    // Draw subtle sumi-brown dorsal spine groove & shoulder blade shading
    ctx.setStrokeColor(CGColor(red: 0.31, green: 0.22, blue: 0.15, alpha: 0.48))
    ctx.setLineWidth(2.0)
    ctx.setLineCap(.round)
    ctx.move(to: CGPoint(x: 250, y: CGFloat(h) - 216))
    ctx.addCurve(
        to: CGPoint(x: 250, y: CGFloat(h) - 418),
        control1: CGPoint(x: 248, y: CGFloat(h) - 280),
        control2: CGPoint(x: 252, y: CGFloat(h) - 355)
    )
    ctx.strokePath()

    // Scapula curved ink hints
    ctx.setStrokeColor(CGColor(red: 0.31, green: 0.22, blue: 0.15, alpha: 0.38))
    ctx.setLineWidth(1.6)
    ctx.move(to: CGPoint(x: 196, y: CGFloat(h) - 252))
    ctx.addQuadCurve(to: CGPoint(x: 228, y: CGFloat(h) - 304), control: CGPoint(x: 222, y: CGFloat(h) - 270))
    ctx.move(to: CGPoint(x: 304, y: CGFloat(h) - 252))
    ctx.addQuadCurve(to: CGPoint(x: 272, y: CGFloat(h) - 304), control: CGPoint(x: 278, y: CGFloat(h) - 270))
    ctx.strokePath()

    return ctx.makeImage()!
}

let mBack = buildMeridianBack(from: mFront)
saveJPEG(mBack, to: "\(artDir)/meridians/meridian-back.jpg", quality: 0.86)

// 3. Extract smooth RGBA transparency for healer-hand.png (440x440)
guard let handRaw = loadCGImage(from: "\(rawDir)/healer_hand.jpg") else {
    fatalError("Missing healer_hand.jpg")
}
func extractAlphaHand(_ cg: CGImage, size: Int) -> CGImage {
    let bytesPerRow = size * 4
    var pixels = [UInt8](repeating: 0, count: bytesPerRow * size)
    let ctx = CGContext(
        data: &pixels,
        width: size,
        height: size,
        bitsPerComponent: 8,
        bytesPerRow: bytesPerRow,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.interpolationQuality = .high
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: size, height: size))

    for i in stride(from: 0, to: pixels.count, by: 4) {
        let r = Int(pixels[i])
        let g = Int(pixels[i + 1])
        let b = Int(pixels[i + 2])
        let minC = min(r, min(g, b))
        let maxC = max(r, max(g, b))
        let sat = maxC - minC
        let warmDelta = r - b

        // Protect warm ivory cuff (warmDelta >= 16); key out neutral pure-white studio background
        if minC >= 242 && sat <= 18 && warmDelta < 16 {
            pixels[i] = 0
            pixels[i + 1] = 0
            pixels[i + 2] = 0
            pixels[i + 3] = 0
        } else if minC >= 214 && sat <= 22 && warmDelta < 18 {
            let t = Double(242 - minC) / 28.0 // 0 near white -> 1 near edge
            let alpha = UInt8(max(0, min(255, Int(t * 255.0))))
            let factor = Double(alpha) / 255.0
            pixels[i] = UInt8(Double(r) * factor)
            pixels[i + 1] = UInt8(Double(g) * factor)
            pixels[i + 2] = UInt8(Double(b) * factor)
            pixels[i + 3] = alpha
        }
    }
    return ctx.makeImage()!
}
let handPng = extractAlphaHand(handRaw, size: 440)
savePNG(handPng, to: "\(artDir)/tools/healer-hand.png")

// 4. Optimize pulse-pillow.jpg (680x382)
guard let pillowRaw = loadCGImage(from: "\(rawDir)/pulse_pillow.jpg") else {
    fatalError("Missing pulse_pillow.jpg")
}
let pillowOut = cropAndResize(pillowRaw, insetFrac: 0.01, targetW: 680, targetH: 382)
saveJPEG(pillowOut, to: "\(artDir)/tools/pulse-pillow.jpg", quality: 0.85)

// 5. Process 8 Botanical Herbs (6% inset crop -> 360x360)
let herbs = ["tia-to", "kinh-gioi", "cuc-hoa", "cat-can", "dinh-lang", "ngai-cuu", "nhan-tran", "la-lot"]
for id in herbs {
    let fname = id.replacingOccurrences(of: "-", with: "_") + ".jpg"
    guard let hRaw = loadCGImage(from: "\(rawDir)/\(fname)") else {
        fatalError("Missing \(fname)")
    }
    let out = cropAndResize(hRaw, insetFrac: 0.06, targetW: 360, targetH: 360)
    saveJPEG(out, to: "\(artDir)/herbs/\(id).jpg", quality: 0.85)
}

// 6. Process 4 Master Patient Portraits + Mood-Graded Variants + Blurred Clinic Background
func resizeExact(_ cg: CGImage, w: Int, h: Int) -> CGImage {
    return cropAndResize(cg, insetFrac: 0.0, targetW: w, targetH: h)
}

func gradeAndCrop(_ cg: CGImage, cropFracRect: CGRect, saturation: Double, brightness: Double, tempShift: Double) -> CGImage {
    let w = CGFloat(cg.width)
    let h = CGFloat(cg.height)
    let rect = CGRect(x: w * cropFracRect.origin.x, y: h * cropFracRect.origin.y, width: w * cropFracRect.size.width, height: h * cropFracRect.size.height)
    let cropped = cg.cropping(to: rect) ?? cg
    var ci = CIImage(cgImage: cropped)

    if let colorCtrl = CIFilter(name: "CIColorControls") {
        colorCtrl.setValue(ci, forKey: kCIInputImageKey)
        colorCtrl.setValue(saturation, forKey: kCIInputSaturationKey)
        colorCtrl.setValue(brightness, forKey: kCIInputBrightnessKey)
        colorCtrl.setValue(1.04, forKey: kCIInputContrastKey)
        if let out = colorCtrl.outputImage { ci = out }
    }
    if let tempFilter = CIFilter(name: "CITemperatureAndTint") {
        tempFilter.setValue(ci, forKey: kCIInputImageKey)
        tempFilter.setValue(CIVector(x: 6500, y: 0), forKey: "inputNeutral")
        tempFilter.setValue(CIVector(x: 6500 + tempShift, y: 0), forKey: "inputTargetNeutral")
        if let out = tempFilter.outputImage { ci = out }
    }
    let rendered = ciContext.createCGImage(ci, from: ci.extent)!
    return resizeExact(rendered, w: 480, h: 640)
}

let pMasters = ["c1-phong-han", "c1-phong-nhiet", "c2-tam-ty-luong-hu", "c2-tam-hoa-vuong"]
for id in pMasters {
    let fname = id.replacingOccurrences(of: "-", with: "_") + ".jpg"
    guard let pRaw = loadCGImage(from: "\(rawDir)/\(fname)") else { fatalError("Missing \(fname)") }
    saveJPEG(resizeExact(pRaw, w: 480, h: 640), to: "\(artDir)/patients/\(id).jpg", quality: 0.85)
}

if let boatman = loadCGImage(from: "\(rawDir)/c1_phong_han.jpg") {
    let carter = gradeAndCrop(boatman, cropFracRect: CGRect(x: 0.08, y: 0.03, width: 0.86, height: 0.86), saturation: 0.92, brightness: 0.02, tempShift: 500)
    saveJPEG(carter, to: "\(artDir)/patients/c3-vai-gay-phong-han.jpg", quality: 0.84)

    let woodcutter = gradeAndCrop(boatman, cropFracRect: CGRect(x: 0.04, y: 0.06, width: 0.90, height: 0.90), saturation: 0.82, brightness: -0.04, tempShift: 750)
    saveJPEG(woodcutter, to: "\(artDir)/patients/c3-than-duong-hu-phong-thap.jpg", quality: 0.84)
}

if let smith = loadCGImage(from: "\(rawDir)/c2_tam_hoa_vuong.jpg") {
    let carpenter = gradeAndCrop(smith, cropFracRect: CGRect(x: 0.12, y: 0.04, width: 0.78, height: 0.78), saturation: 0.65, brightness: -0.02, tempShift: -900)
    saveJPEG(carpenter, to: "\(artDir)/patients/c1-thuong-thuc-han.jpg", quality: 0.84)
}

if let silkLady = loadCGImage(from: "\(rawDir)/c2_tam_ty_luong_hu.jpg") {
    let expectant = gradeAndCrop(silkLady, cropFracRect: CGRect(x: 0.08, y: 0.03, width: 0.84, height: 0.84), saturation: 1.08, brightness: 0.03, tempShift: 650)
    saveJPEG(expectant, to: "\(artDir)/patients/c3-thai-phu-khi-nghich.jpg", quality: 0.84)

    // Soft blurred apothecary backdrop for composite folk portraits
    let bgCropRect = CGRect(x: CGFloat(silkLady.width) * 0.02, y: CGFloat(silkLady.height) * 0.02, width: CGFloat(silkLady.width) * 0.42, height: CGFloat(silkLady.height) * 0.52)
    if let bgRaw = silkLady.cropping(to: bgCropRect) {
        var ciBg = CIImage(cgImage: bgRaw)
        if let blur = CIFilter(name: "CIGaussianBlur") {
            blur.setValue(ciBg, forKey: kCIInputImageKey)
            blur.setValue(3.5, forKey: kCIInputRadiusKey)
            if let out = blur.outputImage { ciBg = out.cropped(to: ciBg.extent) }
        }
        let bgImg = ciContext.createCGImage(ciBg, from: ciBg.extent)!
        saveJPEG(resizeExact(bgImg, w: 360, h: 480), to: "\(artDir)/patients/clinic-bg.jpg", quality: 0.82)
    }
}

print("Processed all silk-and-ink assets successfully.")
