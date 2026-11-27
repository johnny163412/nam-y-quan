// Lifts each patient out of their painted portrait (Vision subject mask) so they can sit behind the
// Tiền Đường desk instead of hanging in a framed scroll.
// Usage: swift scripts/cutout_patients.swift <out-dir>, then per PNG:
//   cwebp -q 82 -alpha_q 90 -m 6 <out-dir>/<id>-cutout.png -o public/art/patients/<id>-cutout.webp
import AppKit
import CoreImage
import Foundation
import Vision

let root = "/Users/thiagop/nam-y-quan/public/art/patients"
let outDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp/patient-cutouts"
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
let ci = CIContext()

let files = try FileManager.default.contentsOfDirectory(atPath: root)
    .filter { $0.hasPrefix("c") && $0.hasSuffix(".webp") && !$0.contains("-cutout") }
    .sorted()

for file in files {
    let id = String(file.dropLast(5))
    let ns = NSImage(contentsOfFile: "\(root)/\(file)")!
    var r = NSRect(origin: .zero, size: ns.size)
    let src = CIImage(cgImage: ns.cgImage(forProposedRect: &r, context: nil, hints: nil)!)
    let extent = src.extent
    // render to a plain bitmap first: Vision crashes on lazily decoded images
    let cg = ci.createCGImage(src, from: extent)!

    let req = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: cg)
    try handler.perform([req])
    guard let obs = req.results?.first, !obs.allInstances.isEmpty else {
        print("\(id): no subject found"); continue
    }
    let buf = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
    // soften the edge a touch so the hand-inked outline doesn't look die-cut
    let mask = CIImage(cvPixelBuffer: buf).applyingGaussianBlur(sigma: 0.9).cropped(to: extent)
    let cut = src.applyingFilter("CIBlendWithMask", parameters: [
        kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: extent),
        kCIInputMaskImageKey: mask,
    ])
    let out = ci.createCGImage(cut, from: extent)!
    try NSBitmapImageRep(cgImage: out).representation(using: .png, properties: [:])!
        .write(to: URL(fileURLWithPath: "\(outDir)/\(id)-cutout.png"))
    print("\(id): \(obs.allInstances.count) instance(s)")
}
