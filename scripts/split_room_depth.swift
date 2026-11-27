// Splits each room background into depth layers for the parallax diorama:
//   <room>-near.png  foreground (desk band + objects lifted with Vision), transparent elsewhere
//   <room>-base.png  the full scene with the near objects smeared out, holes cut where a deep layer shows through
//   <room>-deep.png  (optional) the view through a window/opening, edges extended so a small shift never shows the frame
// Usage: swift scripts/split_room_depth.swift <out-dir>, then per PNG: cwebp -q 80 -alpha_q 85 -m 6 in.png -o public/art/scenes/depth/<name>.webp
import AppKit
import CoreImage
import Foundation
import Vision

let root = "/Users/thiagop/nam-y-quan/public/art/scenes"
let outDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp/room-depth"
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
let ci = CIContext()

/// Rects are in image pixels with a top-left origin (as you read them off the 1280x720 painting).
struct RoomSpec {
    let name: String
    var nearBands: [CGRect] = []   // whole strips that sit in front (desk/counter top)
    var nearObjects: [CGRect] = [] // crops in which Vision lifts the main object
    var deepHoles: [CGRect] = []   // openings the deep layer shows through
}

let rooms: [RoomSpec] = [
    RoomSpec(
        name: "room-tien-duong",
        nearBands: [CGRect(x: 0, y: 514, width: 1280, height: 206)],
        nearObjects: [
            CGRect(x: 150, y: 260, width: 150, height: 310),  // oil lamp
            CGRect(x: 425, y: 480, width: 90, height: 80),    // ink pot
            CGRect(x: 1030, y: 470, width: 250, height: 110), // cup + teapot
        ],
        deepHoles: [
            CGRect(x: 338, y: 84, width: 620, height: 424),   // main window to the garden
            CGRect(x: 1024, y: 52, width: 156, height: 350),  // bamboo window
        ]
    ),
    RoomSpec(
        name: "room-duoc-cac",
        nearBands: [CGRect(x: 0, y: 552, width: 1280, height: 168)],
        nearObjects: [
            CGRect(x: 280, y: 450, width: 90, height: 160),   // brush pot
            CGRect(x: 220, y: 540, width: 70, height: 70),    // cup
            CGRect(x: 820, y: 495, width: 110, height: 110),  // mortar
            CGRect(x: 905, y: 505, width: 340, height: 135),  // herb bundles
        ]
    ),
    RoomSpec(
        name: "room-noi-cac",
        nearObjects: [CGRect(x: 960, y: 370, width: 280, height: 320)] // stove + kettle
    ),
    RoomSpec(
        name: "room-hau-vien",
        nearObjects: [
            CGRect(x: 0, y: 380, width: 470, height: 340),    // potted herbs, left
            CGRect(x: 950, y: 430, width: 330, height: 290),  // jars + potted herb, right
        ]
    ),
]

func cgImage(_ path: String) -> CGImage {
    let ns = NSImage(contentsOfFile: path)!
    var r = NSRect(origin: .zero, size: ns.size)
    return ns.cgImage(forProposedRect: &r, context: nil, hints: nil)!
}

func savePNG(_ img: CIImage, _ path: String, extent: CGRect) {
    let cg = ci.createCGImage(img, from: extent)!
    try! NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}

/// Core Image uses a bottom-left origin.
func flip(_ r: CGRect, _ h: CGFloat) -> CGRect { CGRect(x: r.minX, y: h - r.maxY, width: r.width, height: r.height) }

func rectMask(_ rects: [CGRect], extent: CGRect) -> CIImage {
    var m = CIImage(color: .black).cropped(to: extent)
    for r in rects {
        m = CIImage(color: .white).cropped(to: flip(r, extent.height)).composited(over: m)
    }
    return m
}

/// Vision subject lift inside a crop, placed back into full-image coordinates.
func liftedObject(_ src: CIImage, crop: CGRect, extent: CGRect) -> CIImage? {
    let f = flip(crop, extent.height)
    // render the crop to its own bitmap (CGImage.cropping on a lazily decoded image crashes Vision)
    guard let sub = ci.createCGImage(src, from: f) else { return nil }
    let req = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: sub)
    try? handler.perform([req])
    guard let obs = req.results?.first, !obs.allInstances.isEmpty,
          let buf = try? obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler) else { return nil }
    return CIImage(cvPixelBuffer: buf).transformed(by: CGAffineTransform(translationX: f.minX, y: f.minY))
}

func maxOf(_ a: CIImage, _ b: CIImage) -> CIImage { a.applyingFilter("CIMaximumCompositing", parameters: [kCIInputBackgroundImageKey: b]) }

for spec in rooms {
    let cg = cgImage("\(root)/\(spec.name).webp")
    let src = CIImage(cgImage: cg)
    let extent = src.extent

    var nearMask = rectMask(spec.nearBands, extent: extent)
    for crop in spec.nearObjects {
        if let m = liftedObject(src, crop: crop, extent: extent) {
            nearMask = maxOf(m, nearMask).cropped(to: extent)
        } else {
            print("\(spec.name): Vision found nothing in \(crop)")
        }
    }
    let clear = CIImage(color: .clear).cropped(to: extent)
    let near = src.applyingFilter("CIBlendWithMask", parameters: [
        kCIInputBackgroundImageKey: clear,
        kCIInputMaskImageKey: nearMask.applyingGaussianBlur(sigma: 1.2).cropped(to: extent),
    ])
    savePNG(near, "\(outDir)/\(spec.name)-near.png", extent: extent)

    // base: smear the scene under the near objects (only visible as a few px when layers drift apart)
    let grown = nearMask.applyingFilter("CIMorphologyMaximum", parameters: [kCIInputRadiusKey: 10])
        .applyingGaussianBlur(sigma: 6).cropped(to: extent)
    let smear = src.clampedToExtent().applyingGaussianBlur(sigma: 24).cropped(to: extent)
    var base = smear.applyingFilter("CIBlendWithMask", parameters: [
        kCIInputBackgroundImageKey: src, kCIInputMaskImageKey: grown,
    ])

    if !spec.deepHoles.isEmpty {
        // deep: each opening, ringed by a dark blurred margin (reads as the frame's shadow) so shifting it
        // never drags frame pixels or streaky edge-repeats into view
        var deep = clear
        for hole in spec.deepHoles {
            let f = flip(hole, extent.height)
            let inner = src.cropped(to: f.insetBy(dx: 2, dy: 2))
            let margin = src.cropped(to: f.insetBy(dx: 2, dy: 2)).clampedToExtent()
                .applyingGaussianBlur(sigma: 16)
                .applyingFilter("CIColorControls", parameters: [kCIInputBrightnessKey: -0.12, kCIInputSaturationKey: 0.8])
                .cropped(to: f.insetBy(dx: -40, dy: -40))
            deep = inner.composited(over: margin).composited(over: deep)
        }
        savePNG(deep.cropped(to: extent), "\(outDir)/\(spec.name)-deep.png", extent: extent)
        // cut the holes out of the base with a 3px feathered edge
        let holeMask = rectMask(spec.deepHoles, extent: extent).applyingGaussianBlur(sigma: 1.5).cropped(to: extent)
        base = clear.applyingFilter("CIBlendWithMask", parameters: [
            kCIInputBackgroundImageKey: base, kCIInputMaskImageKey: holeMask,
        ])
    }
    savePNG(base, "\(outDir)/\(spec.name)-base.png", extent: extent)
    print("\(spec.name): done")
}
