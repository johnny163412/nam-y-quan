import Foundation
import AppKit
import CoreGraphics
import CoreImage

let artifactDir = "/Users/thiagop/.gemini/antigravity/brain/90213e4b-c384-4bc9-b2b5-4be77a632f54"
let artDir = "/Users/thiagop/.gemini/antigravity/scratch/nam-y-quan/public/art"
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

func renderAspectFill(_ cg: CGImage, width: Int, height: Int, vignetteAlpha: CGFloat = 0.0, warmLightEdges: Bool = false) -> CGImage {
    let ctx = CGContext(
        data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.interpolationQuality = .high
    ctx.setFillColor(CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 1.0))
    ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))

    let cw = CGFloat(width)
    let ch = CGFloat(height)
    let sw = CGFloat(cg.width)
    let sh = CGFloat(cg.height)
    let scale = max(cw / sw, ch / sh)
    let dw = sw * scale
    let dh = sh * scale
    ctx.draw(cg, in: CGRect(x: (cw - dw) * 0.5, y: (ch - dh) * 0.5, width: dw, height: dh))

    if warmLightEdges {
        let grad = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: [
                CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 0.0),
                CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 0.48),
                CGColor(red: 0.980, green: 0.961, blue: 0.910, alpha: 0.96)
            ] as CFArray,
            locations: [0.64, 0.9, 1.0]
        )!
        let c = CGPoint(x: cw / 2, y: ch / 2)
        ctx.drawRadialGradient(grad, startCenter: c, startRadius: 0, endCenter: c, endRadius: min(cw, ch) * 0.54, options: [.drawsAfterEndLocation])
    } else if vignetteAlpha > 0 {
        let grad = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: [
                CGColor(red: 0.09, green: 0.05, blue: 0.03, alpha: 0.0),
                CGColor(red: 0.07, green: 0.04, blue: 0.02, alpha: vignetteAlpha)
            ] as CFArray,
            locations: [0.55, 1.0]
        )!
        let c = CGPoint(x: cw / 2, y: ch / 2)
        ctx.drawRadialGradient(grad, startCenter: c, startRadius: min(cw, ch) * 0.3, endCenter: c, endRadius: max(cw, ch) * 0.68, options: [.drawsAfterEndLocation])
    }
    return ctx.makeImage()!
}

// 1. Rooms (1280x720 rich moody woodblock backdrops)
let rooms: [(String, String)] = [
    ("room_tien_duong_1795715728081.jpg", "\(artDir)/scenes/room-tien-duong.jpg"),
    ("room_duoc_cac_1795715737176.jpg", "\(artDir)/scenes/room-duoc-cac.jpg"),
    ("room_noi_cac_1795715745324.jpg", "\(artDir)/scenes/room-noi-cac.jpg")
]
for (src, dst) in rooms {
    let cg = loadCG("\(artifactDir)/\(src)")
    let out = renderAspectFill(cg, width: 1280, height: 720, vignetteAlpha: 0.42, warmLightEdges: false)
    saveJPEG(out, to: dst, quality: 0.87)
}

// 2. Tools (720x460 clean still life)
let tools: [(String, String)] = [
    ("paozhi_workbench_1795715727481.jpg", "\(artDir)/tools/paozhi-workbench.jpg"),
    ("red_herb_packet_1795715786696.jpg", "\(artDir)/tools/red-herb-packet.jpg"),
    ("moxa_stick_1795715755723.jpg", "\(artDir)/tools/moxa-stick.jpg")
]
for (src, dst) in tools {
    let cg = loadCG("\(artifactDir)/\(src)")
    let out = renderAspectFill(cg, width: 720, height: 460, vignetteAlpha: 0.25, warmLightEdges: false)
    saveJPEG(out, to: dst, quality: 0.88)
}

// 3. Unique Silk Patient Portraits (480x640 with soft #FAF5E8 Do-paper edges)
let portraits: [(String, String)] = [
    ("p_anh_tu_moc_1795715731941.jpg", "\(artDir)/patients/c1-thuong-thuc-han.jpg"),
    ("p_ba_nam_trau_1795715741390.jpg", "\(artDir)/patients/c2-ty-vi-hu-han.jpg"),
    ("p_cau_minh_1795715750804.jpg", "\(artDir)/patients/c2-can-khi-uat.jpg"),
    ("p_bac_tu_xe_1795715759402.jpg", "\(artDir)/patients/c3-vai-gay-phong-han.jpg"),
    ("p_chi_hue_1795715767702.jpg", "\(artDir)/patients/c3-thai-phu-khi-nghich.jpg")
]
for (src, dst) in portraits {
    let cg = loadCG("\(artifactDir)/\(src)")
    let out = renderAspectFill(cg, width: 480, height: 640, vignetteAlpha: 0.0, warmLightEdges: true)
    saveJPEG(out, to: dst, quality: 0.88)
}

// Note: c3-than-duong-hu-phong-thap.jpg -> subtle warm silk retouch from existing file so Bác Năm Rừng looks weathered & warm
let bacNamPath = "\(artDir)/patients/c3-than-duong-hu-phong-thap.jpg"
let bacNamCG = loadCG(bacNamPath)
var ci = CIImage(cgImage: bacNamCG)
if let col = CIFilter(name: "CIColorControls") {
    col.setValue(ci, forKey: kCIInputImageKey)
    col.setValue(0.88, forKey: kCIInputSaturationKey)
    col.setValue(1.06, forKey: kCIInputContrastKey)
    col.setValue(-0.02, forKey: kCIInputBrightnessKey)
    if let o = col.outputImage { ci = o }
}
if let temp = CIFilter(name: "CITemperatureAndTint") {
    temp.setValue(ci, forKey: kCIInputImageKey)
    temp.setValue(CIVector(x: 6500, y: 0), forKey: "inputNeutral")
    temp.setValue(CIVector(x: 6950, y: -4), forKey: "inputTargetNeutral")
    if let o = temp.outputImage { ci = o }
}
if let graded = ciContext.createCGImage(ci, from: ci.extent) {
    let out = renderAspectFill(graded, width: 480, height: 640, vignetteAlpha: 0.0, warmLightEdges: true)
    saveJPEG(out, to: bacNamPath, quality: 0.88)
}

print("Successfully built 3 room backdrops, 3 tool still-lifes, and harmonized all patient portraits!")
