import AppKit
import CoreImage
import Foundation

let root = "/Users/thiagop/nam-y-quan/public/art"
let brain = "/Users/thiagop/.gemini/antigravity/brain/90213e4b-c384-4bc9-b2b5-4be77a632f54"

let ciCtx = CIContext(options: [.useSoftwareRenderer: false])

func loadCGImage(_ path: String) -> CGImage? {
  guard let nsImg = NSImage(contentsOfFile: path) else { return nil }
  var rect = NSRect(origin: .zero, size: nsImg.size)
  return nsImg.cgImage(forProposedRect: &rect, context: nil, hints: nil)
}

func saveJPEG(_ image: CGImage, to path: String, quality: CGFloat = 0.90) {
  let rep = NSBitmapImageRep(cgImage: image)
  guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality]) else {
    fatalError("Failed to encode JPEG for \(path)")
  }
  do {
    try data.write(to: URL(fileURLWithPath: path))
    print("WROTE \(path) (\(image.width)x\(image.height), \(data.count) bytes)")
  } catch {
    fatalError("Failed write \(path): \(error)")
  }
}

func makeContext(width: Int, height: Int) -> CGContext {
  let cs = CGColorSpaceCreateDeviceRGB()
  guard
    let ctx = CGContext(
      data: nil,
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: width * 4,
      space: cs,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )
  else {
    fatalError("Could not allocate CGContext \(width)x\(height)")
  }
  ctx.interpolationQuality = .high
  return ctx
}

func paperColor() -> CGColor {
  CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 1.0)
}

func drawWarmPaperGrain(in ctx: CGContext, width: Int, height: Int, seed: UInt64, toneShift: CGFloat = 0) {
  let w = CGFloat(width)
  let h = CGFloat(height)
  ctx.setFillColor(
    CGColor(
      red: (250.0 / 255.0) - toneShift,
      green: (245.0 / 255.0) - toneShift,
      blue: (232.0 / 255.0) - toneShift * 1.1,
      alpha: 1.0
    ))
  ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))

  // Subtle translucent tea/silk mottling
  var s = seed
  func rand() -> CGFloat {
    s = s &* 6364136223846793005 &+ 1442695040888963407
    return CGFloat((s >> 33) & 0xffff) / 65535.0
  }

  for _ in 0..<26 {
    let cx = rand() * w
    let cy = rand() * h
    let r = (0.14 + rand() * 0.25) * min(w, h)
    let warm = rand() > 0.5
    let alpha = 0.015 + rand() * 0.025
    ctx.setFillColor(
      warm
        ? CGColor(red: 0.72, green: 0.62, blue: 0.44, alpha: alpha)
        : CGColor(red: 0.85, green: 0.78, blue: 0.63, alpha: alpha)
    )
    ctx.fillEllipse(in: CGRect(x: cx - r, y: cy - r * 0.75, width: r * 2, height: r * 1.5))
  }
}

func harmonizeHerb(srcPath: String, dstPath: String, insetFraction: CGFloat = 0.03, warmTint: Bool = true) {
  guard let src = loadCGImage(srcPath) else {
    fatalError("Missing herb source \(srcPath)")
  }
  let size = 360
  let ctx = makeContext(width: size, height: size)
  ctx.setFillColor(paperColor())
  ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))

  let sw = CGFloat(src.width)
  let sh = CGFloat(src.height)
  let side = min(sw, sh) * (1.0 - insetFraction * 2.0)
  let cropRect = CGRect(
    x: (sw - side) * 0.5,
    y: (sh - side) * 0.5,
    width: side,
    height: side
  )
  guard let cropped = src.cropping(to: cropRect) else {
    fatalError("Failed crop \(srcPath)")
  }

  // Slight multiply blend onto warm Dó paper #FAF5E8 so bright white paper backgrounds harmonize
  ctx.saveGState()
  if warmTint {
    ctx.setBlendMode(.multiply)
  }
  ctx.draw(cropped, in: CGRect(x: 8, y: 8, width: size - 16, height: size - 16))
  ctx.restoreGState()

  // Soft edge fade to exact #FAF5E8 around outer perimeter so drawers/dishes never show hard seams
  let cs = CGColorSpaceCreateDeviceRGB()
  let colors = [
    CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 0.0),
    CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 0.0),
    CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 0.85),
    CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 1.0),
  ] as CFArray
  let locs: [CGFloat] = [0.0, 0.72, 0.91, 1.0]
  if let grad = CGGradient(colorsSpace: cs, colors: colors, locations: locs) {
    let center = CGPoint(x: CGFloat(size) / 2, y: CGFloat(size) / 2)
    ctx.drawRadialGradient(
      grad,
      startCenter: center,
      startRadius: 0,
      endCenter: center,
      endRadius: CGFloat(size) * 0.505,
      options: [.drawsAfterEndLocation]
    )
  }

  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.91)
}

func harmonizeCover(
  srcPath: String,
  dstPath: String,
  width: Int,
  height: Int,
  topBias: CGFloat = 0.5,
  warmVeil: CGFloat = 0.04
) {
  guard let src = loadCGImage(srcPath) else {
    fatalError("Missing cover source \(srcPath)")
  }
  let ctx = makeContext(width: width, height: height)
  let sw = CGFloat(src.width)
  let sh = CGFloat(src.height)
  let targetAspect = CGFloat(width) / CGFloat(height)
  let srcAspect = sw / sh

  var cropW = sw
  var cropH = sh
  if srcAspect > targetAspect {
    cropW = sh * targetAspect
  } else {
    cropH = sw / targetAspect
  }
  let cropX = (sw - cropW) * 0.5
  let cropY = (sh - cropH) * topBias

  guard let cropped = src.cropping(to: CGRect(x: cropX, y: cropY, width: cropW, height: cropH)) else {
    fatalError("Failed crop cover \(srcPath)")
  }
  ctx.draw(cropped, in: CGRect(x: 0, y: 0, width: width, height: height))

  if warmVeil > 0 {
    ctx.setFillColor(CGColor(red: 0.88, green: 0.74, blue: 0.52, alpha: warmVeil))
    ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
  }
  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.90)
}

// 1. Bespoke Silk-Watercolor botanical paintings for tran-bi & dan-sam (matching the sepia ink + mineral wash aesthetic)
func paintTranBi(dstPath: String) {
  let size = 360
  let ctx = makeContext(width: size, height: size)
  drawWarmPaperGrain(in: ctx, width: size, height: size, seed: 801)

  func drawPeel(cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, rot: CGFloat, flip: CGFloat) {
    ctx.saveGState()
    ctx.translateBy(x: cx, y: cy)
    ctx.rotate(by: rot)
    ctx.scaleBy(x: 1, y: flip)

    // Soft cast shadow under peel
    let shadow = CGMutablePath()
    shadow.addEllipse(in: CGRect(x: -rx * 0.95, y: -ry * 0.45 - 8, width: rx * 1.9, height: ry * 0.6))
    ctx.setFillColor(CGColor(red: 0.45, green: 0.34, blue: 0.22, alpha: 0.14))
    ctx.addPath(shadow)
    ctx.fillPath()

    // Outer deep amber-ochre aged tangerine peel crescent
    let outer = CGMutablePath()
    outer.move(to: CGPoint(x: -rx, y: -ry * 0.15))
    outer.addCurve(
      to: CGPoint(x: rx, y: -ry * 0.12),
      control1: CGPoint(x: -rx * 0.55, y: ry * 0.92),
      control2: CGPoint(x: rx * 0.55, y: ry * 0.88)
    )
    outer.addCurve(
      to: CGPoint(x: rx * 0.72, y: -ry * 0.55),
      control1: CGPoint(x: rx * 1.06, y: -ry * 0.42),
      control2: CGPoint(x: rx * 0.88, y: -ry * 0.58)
    )
    outer.addCurve(
      to: CGPoint(x: -rx * 0.75, y: -ry * 0.52),
      control1: CGPoint(x: rx * 0.25, y: -ry * 0.05),
      control2: CGPoint(x: -rx * 0.25, y: -ry * 0.02)
    )
    outer.closeSubpath()

    // Base burnt-orange mineral wash
    ctx.saveGState()
    ctx.addPath(outer)
    ctx.clip()
    let cs = CGColorSpaceCreateDeviceRGB()
    let grad = CGGradient(
      colorsSpace: cs,
      colors: [
        CGColor(red: 0.74, green: 0.33, blue: 0.12, alpha: 0.92),
        CGColor(red: 0.84, green: 0.49, blue: 0.19, alpha: 0.90),
        CGColor(red: 0.62, green: 0.26, blue: 0.10, alpha: 0.94),
      ] as CFArray,
      locations: [0.0, 0.55, 1.0]
    )!
    ctx.drawLinearGradient(
      grad,
      start: CGPoint(x: -rx, y: ry * 0.7),
      end: CGPoint(x: rx, y: -ry * 0.5),
      options: []
    )

    // Pale pith inner ridge highlight
    ctx.setFillColor(CGColor(red: 0.93, green: 0.84, blue: 0.67, alpha: 0.76))
    ctx.fillEllipse(in: CGRect(x: -rx * 0.68, y: -ry * 0.48, width: rx * 1.36, height: ry * 0.42))

    // Tangerine oil-gland stipples
    var seed: UInt64 = 4242
    for i in 0..<85 {
      seed = seed &* 1103515245 &+ 12345 &+ UInt64(i)
      let px = (CGFloat((seed >> 8) & 0xff) / 255.0 - 0.5) * rx * 1.7
      let py = (CGFloat((seed >> 16) & 0xff) / 255.0 - 0.25) * ry * 1.15
      ctx.setFillColor(CGColor(red: 0.48, green: 0.19, blue: 0.06, alpha: 0.42))
      ctx.fillEllipse(in: CGRect(x: px, y: py, width: 2.3, height: 2.1))
    }
    ctx.restoreGState()

    // Sepia ink woodblock outline & inner crease
    ctx.addPath(outer)
    ctx.setStrokeColor(CGColor(red: 0.28, green: 0.17, blue: 0.10, alpha: 0.88))
    ctx.setLineWidth(2.0)
    ctx.setLineJoin(.round)
    ctx.strokePath()

    ctx.beginPath()
    ctx.move(to: CGPoint(x: -rx * 0.74, y: -ry * 0.24))
    ctx.addCurve(
      to: CGPoint(x: rx * 0.72, y: -ry * 0.22),
      control1: CGPoint(x: -rx * 0.2, y: ry * 0.2),
      control2: CGPoint(x: rx * 0.22, y: ry * 0.18)
    )
    ctx.setStrokeColor(CGColor(red: 0.34, green: 0.21, blue: 0.12, alpha: 0.52))
    ctx.setLineWidth(1.2)
    ctx.strokePath()

    ctx.restoreGState()
  }

  drawPeel(cx: 170, cy: 235, rx: 92, ry: 54, rot: -0.22, flip: 1)
  drawPeel(cx: 215, cy: 158, rx: 88, ry: 48, rot: 0.28, flip: 1)
  drawPeel(cx: 132, cy: 126, rx: 74, ry: 42, rot: -0.46, flip: -1)

  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.91)
}

func paintDanSam(dstPath: String) {
  let size = 360
  let ctx = makeContext(width: size, height: size)
  drawWarmPaperGrain(in: ctx, width: size, height: size, seed: 912)

  func drawRootBranch(pts: [CGPoint], widths: [CGFloat], hueShift: CGFloat) {
    guard pts.count >= 3 else { return }
    // Watercolor drop shadow
    ctx.saveGState()
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)
    for i in 0..<(pts.count - 1) {
      let a = pts[i]
      let b = pts[i + 1]
      let w = (widths[i] + widths[i + 1]) * 0.5
      ctx.beginPath()
      ctx.move(to: CGPoint(x: a.x + 3, y: a.y - 5))
      ctx.addLine(to: CGPoint(x: b.x + 3, y: b.y - 5))
      ctx.setStrokeColor(CGColor(red: 0.38, green: 0.25, blue: 0.18, alpha: 0.12))
      ctx.setLineWidth(w + 4)
      ctx.strokePath()
    }
    // Brick-red / rusty cinnabar body fill
    for i in 0..<(pts.count - 1) {
      let a = pts[i]
      let b = pts[i + 1]
      let w = (widths[i] + widths[i + 1]) * 0.5
      ctx.beginPath()
      ctx.move(to: a)
      ctx.addLine(to: b)
      ctx.setStrokeColor(
        CGColor(
          red: 0.64 + hueShift,
          green: 0.22 + hueShift * 0.4,
          blue: 0.14,
          alpha: 0.94
        ))
      ctx.setLineWidth(w)
      ctx.strokePath()

      // Warm central highlight ridge
      ctx.beginPath()
      ctx.move(to: CGPoint(x: a.x - 1.5, y: a.y + 1.5))
      ctx.addLine(to: CGPoint(x: b.x - 1.5, y: b.y + 1.5))
      ctx.setStrokeColor(CGColor(red: 0.80, green: 0.39, blue: 0.24, alpha: 0.48))
      ctx.setLineWidth(w * 0.38)
      ctx.strokePath()
    }
    // Fine sepia outline and longitudinal bark striations
    for side in [-1.0, 1.0] as [CGFloat] {
      ctx.beginPath()
      for (idx, p) in pts.enumerated() {
        let r = widths[idx] * 0.48 * side
        let q = CGPoint(x: p.x + r * 0.65, y: p.y + r * 0.35)
        if idx == 0 { ctx.move(to: q) } else { ctx.addLine(to: q) }
      }
      ctx.setStrokeColor(CGColor(red: 0.25, green: 0.11, blue: 0.08, alpha: 0.86))
      ctx.setLineWidth(1.6)
      ctx.strokePath()
    }
    ctx.restoreGState()
  }

  // Main gnarled Dan Sam roots
  drawRootBranch(
    pts: [
      CGPoint(x: 92, y: 278),
      CGPoint(x: 132, y: 242),
      CGPoint(x: 158, y: 194),
      CGPoint(x: 175, y: 146),
      CGPoint(x: 205, y: 95),
      CGPoint(x: 238, y: 66),
    ],
    widths: [20, 26, 24, 21, 15, 7],
    hueShift: 0.02
  )
  drawRootBranch(
    pts: [
      CGPoint(x: 146, y: 215),
      CGPoint(x: 205, y: 202),
      CGPoint(x: 256, y: 174),
      CGPoint(x: 282, y: 136),
    ],
    widths: [18, 17, 13, 6],
    hueShift: -0.04
  )
  drawRootBranch(
    pts: [
      CGPoint(x: 152, y: 170),
      CGPoint(x: 112, y: 132),
      CGPoint(x: 84, y: 92),
    ],
    widths: [16, 12, 5],
    hueShift: 0.04
  )

  // Two oblique cut root slices in foreground showing pale ochre-cream vascular core
  func drawSlice(cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, rot: CGFloat) {
    ctx.saveGState()
    ctx.translateBy(x: cx, y: cy)
    ctx.rotate(by: rot)
    ctx.setFillColor(CGColor(red: 0.56, green: 0.19, blue: 0.12, alpha: 0.96))
    ctx.fillEllipse(in: CGRect(x: -rx - 2, y: -ry - 4, width: (rx + 2) * 2, height: (ry + 2) * 2))
    ctx.setFillColor(CGColor(red: 0.89, green: 0.72, blue: 0.56, alpha: 0.96))
    ctx.fillEllipse(in: CGRect(x: -rx, y: -ry, width: rx * 2, height: ry * 2))
    ctx.setStrokeColor(CGColor(red: 0.65, green: 0.24, blue: 0.14, alpha: 0.62))
    ctx.setLineWidth(1.5)
    ctx.strokeEllipse(in: CGRect(x: -rx * 0.62, y: -ry * 0.62, width: rx * 1.24, height: ry * 1.24))
    ctx.setStrokeColor(CGColor(red: 0.25, green: 0.11, blue: 0.08, alpha: 0.9))
    ctx.setLineWidth(1.8)
    ctx.strokeEllipse(in: CGRect(x: -rx, y: -ry, width: rx * 2, height: ry * 2))
    ctx.restoreGState()
  }

  drawSlice(cx: 242, cy: 256, rx: 28, ry: 17, rot: -0.25)
  drawSlice(cx: 130, cy: 82, rx: 24, ry: 14, rot: 0.32)

  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.91)
}

// 2. Painterly Silk-Woodblock scenes for y-mieu-temple & duong-sinh-scroll
func paintYMieuTemple(dstPath: String) {
  let w = 1280
  let h = 720
  let ctx = makeContext(width: w, height: h)
  let cs = CGColorSpaceCreateDeviceRGB()

  // Warm sanctuary atmospheric gradient
  let bgGrad = CGGradient(
    colorsSpace: cs,
    colors: [
      CGColor(red: 0.18, green: 0.11, blue: 0.07, alpha: 1.0),
      CGColor(red: 0.30, green: 0.19, blue: 0.11, alpha: 1.0),
      CGColor(red: 0.22, green: 0.13, blue: 0.08, alpha: 1.0),
    ] as CFArray,
    locations: [0.0, 0.52, 1.0]
  )!
  ctx.drawLinearGradient(bgGrad, start: CGPoint(x: 640, y: 720), end: CGPoint(x: 640, y: 0), options: [])

  // Soft golden sunbeams slanting from left lattice
  for i in 0..<4 {
    let shift = CGFloat(i) * 140
    ctx.saveGState()
    ctx.beginPath()
    ctx.move(to: CGPoint(x: 80 + shift, y: 720))
    ctx.addLine(to: CGPoint(x: 210 + shift, y: 720))
    ctx.addLine(to: CGPoint(x: 680 + shift, y: 0))
    ctx.addLine(to: CGPoint(x: 490 + shift, y: 0))
    ctx.closePath()
    ctx.setFillColor(CGColor(red: 0.96, green: 0.78, blue: 0.42, alpha: 0.07))
    ctx.fillPath()
    ctx.restoreGState()
  }

  // Carved ironwood columns & crossbeams
  let darkWood = CGColor(red: 0.13, green: 0.08, blue: 0.05, alpha: 0.95)
  let trimGold = CGColor(red: 0.72, green: 0.54, blue: 0.24, alpha: 0.65)
  for x in [120, 310, 920, 1110] {
    ctx.setFillColor(darkWood)
    ctx.fill(CGRect(x: x, y: 0, width: 54, height: 720))
    ctx.setFillColor(trimGold)
    ctx.fill(CGRect(x: x + 6, y: 0, width: 3, height: 720))
  }
  ctx.setFillColor(darkWood)
  ctx.fill(CGRect(x: 0, y: 585, width: 1280, height: 135))

  // Central lacquered Hoành Phi plaque silhouette (no readable text)
  ctx.setFillColor(CGColor(red: 0.46, green: 0.13, blue: 0.09, alpha: 0.95))
  ctx.fill(CGRect(x: 455, y: 490, width: 370, height: 96))
  ctx.setStrokeColor(CGColor(red: 0.82, green: 0.64, blue: 0.29, alpha: 0.85))
  ctx.setLineWidth(5)
  ctx.stroke(CGRect(x: 463, y: 498, width: 354, height: 80))

  // Carved wooden altar table & antique brass incense burner (đỉnh đồng)
  ctx.setFillColor(CGColor(red: 0.16, green: 0.09, blue: 0.06, alpha: 0.98))
  ctx.fill(CGRect(x: 360, y: 0, width: 560, height: 175))
  ctx.setFillColor(CGColor(red: 0.24, green: 0.14, blue: 0.08, alpha: 0.98))
  ctx.fill(CGRect(x: 340, y: 155, width: 600, height: 28))

  // Brass censer + rising incense smoke wisps
  let censerGrad = CGGradient(
    colorsSpace: cs,
    colors: [
      CGColor(red: 0.84, green: 0.66, blue: 0.34, alpha: 1.0),
      CGColor(red: 0.46, green: 0.31, blue: 0.13, alpha: 1.0),
    ] as CFArray,
    locations: [0.0, 1.0]
  )!
  ctx.saveGState()
  ctx.addEllipse(in: CGRect(x: 565, y: 185, width: 150, height: 112))
  ctx.clip()
  ctx.drawLinearGradient(censerGrad, start: CGPoint(x: 565, y: 260), end: CGPoint(x: 715, y: 200), options: [])
  ctx.restoreGState()
  ctx.setFillColor(CGColor(red: 0.62, green: 0.44, blue: 0.18, alpha: 0.95))
  ctx.fillEllipse(in: CGRect(x: 618, y: 288, width: 44, height: 28))

  // Delicate curling smoke trails
  for sIdx in 0..<3 {
    ctx.beginPath()
    let sx = CGFloat(624 + sIdx * 16)
    ctx.move(to: CGPoint(x: sx, y: 315))
    ctx.addCurve(
      to: CGPoint(x: sx + CGFloat((sIdx - 1) * 35), y: 540),
      control1: CGPoint(x: sx - 32, y: 390),
      control2: CGPoint(x: sx + 38, y: 455)
    )
    ctx.setStrokeColor(CGColor(red: 0.96, green: 0.91, blue: 0.82, alpha: 0.22))
    ctx.setLineWidth(5.5 - CGFloat(sIdx))
    ctx.setLineCap(.round)
    ctx.strokePath()
  }

  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.90)
}

func paintDuongSinhScroll(dstPath: String) {
  let w = 1280
  let h = 720
  let ctx = makeContext(width: w, height: h)
  let cs = CGColorSpaceCreateDeviceRGB()

  // Misty morning silk-parchment wash
  let bgGrad = CGGradient(
    colorsSpace: cs,
    colors: [
      CGColor(red: 0.94, green: 0.90, blue: 0.80, alpha: 1.0),
      CGColor(red: 0.85, green: 0.83, blue: 0.72, alpha: 1.0),
      CGColor(red: 0.69, green: 0.72, blue: 0.62, alpha: 1.0),
    ] as CFArray,
    locations: [0.0, 0.55, 1.0]
  )!
  ctx.drawLinearGradient(bgGrad, start: CGPoint(x: 640, y: 720), end: CGPoint(x: 640, y: 0), options: [])

  // Misty sage hills in distance
  ctx.setFillColor(CGColor(red: 0.45, green: 0.53, blue: 0.44, alpha: 0.30))
  ctx.beginPath()
  ctx.move(to: CGPoint(x: 0, y: 240))
  ctx.addCurve(to: CGPoint(x: 1280, y: 290), control1: CGPoint(x: 420, y: 420), control2: CGPoint(x: 820, y: 180))
  ctx.addLine(to: CGPoint(x: 1280, y: 0))
  ctx.addLine(to: CGPoint(x: 0, y: 0))
  ctx.closePath()
  ctx.fillPath()

  // Bamboo silhouette stalks & leaves (left & right corners)
  func drawBamboo(baseX: CGFloat, lean: CGFloat, alpha: CGFloat) {
    ctx.setStrokeColor(CGColor(red: 0.22, green: 0.34, blue: 0.23, alpha: alpha))
    ctx.setLineWidth(11)
    ctx.beginPath()
    ctx.move(to: CGPoint(x: baseX, y: 0))
    ctx.addLine(to: CGPoint(x: baseX + lean, y: 720))
    ctx.strokePath()
    for node in 1...6 {
      let t = CGFloat(node) / 6.5
      let nx = baseX + lean * t
      let ny = 720 * t
      ctx.setFillColor(CGColor(red: 0.20, green: 0.31, blue: 0.21, alpha: alpha * 0.9))
      for leaf in -1...1 {
        ctx.saveGState()
        ctx.translateBy(x: nx, y: ny)
        ctx.rotate(by: CGFloat(leaf) * 0.45 + 0.35)
        ctx.fillEllipse(in: CGRect(x: 8, y: -5, width: 52, height: 11))
        ctx.restoreGState()
      }
    }
  }
  drawBamboo(baseX: 115, lean: 48, alpha: 0.52)
  drawBamboo(baseX: 185, lean: -22, alpha: 0.38)
  drawBamboo(baseX: 1120, lean: -54, alpha: 0.48)
  drawBamboo(baseX: 1055, lean: 20, alpha: 0.32)

  // Low dark carved timber tea table + celadon teapot
  ctx.setFillColor(CGColor(red: 0.23, green: 0.14, blue: 0.08, alpha: 0.95))
  ctx.fill(CGRect(x: 410, y: 38, width: 460, height: 105))
  ctx.setFillColor(CGColor(red: 0.34, green: 0.21, blue: 0.12, alpha: 0.98))
  ctx.fill(CGRect(x: 385, y: 132, width: 510, height: 26))

  // Celadon tea pot & twin cups
  ctx.setFillColor(CGColor(red: 0.45, green: 0.62, blue: 0.53, alpha: 0.96))
  ctx.fillEllipse(in: CGRect(x: 585, y: 156, width: 88, height: 64))
  ctx.fillEllipse(in: CGRect(x: 710, y: 154, width: 32, height: 22))
  ctx.fillEllipse(in: CGRect(x: 752, y: 154, width: 32, height: 22))

  // Framed silk scroll panel hint
  ctx.setStrokeColor(CGColor(red: 0.31, green: 0.20, blue: 0.11, alpha: 0.35))
  ctx.setLineWidth(4)
  ctx.stroke(CGRect(x: 24, y: 24, width: 1232, height: 672))

  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.90)
}

// --- Execute Harmonization ---
print("Starting Concept Art Unification...")

let newAIHerbs: [(String, String, CGFloat)] = [
  ("bac-ha", "bac_ha_1795753865579.jpg", 0.03),
  ("kim-ngan-hoa", "kim_ngan_hoa_1795753874723.jpg", 0.03),
  ("cam-thao", "cam_thao_1795753884619.jpg", 0.03),
  ("sinh-khuong", "sinh_khuong_1795753890961.jpg", 0.03),
  ("que-chi", "que_chi_1795753897911.jpg", 0.03),
  ("hoai-son", "hoai_son_1795753868336.jpg", 0.03),
  ("lac-tien", "lac_tien_1795753887769.jpg", 0.03),
  ("tam-sen", "tam_sen_1795753899138.jpg", 0.03),
  ("ky-tu", "ky_tu_1795753910127.jpg", 0.14), // crop outer deckled paper edge cleanly
  ("co-xuoc", "co_xuoc_1795753926685.jpg", 0.03),
]

for (id, file, inset) in newAIHerbs {
  harmonizeHerb(
    srcPath: "\(brain)/\(file)",
    dstPath: "\(root)/herbs/\(id).jpg",
    insetFraction: inset
  )
}

let existingAIHerbs = [
  "tia-to", "kinh-gioi", "cuc-hoa", "cat-can",
  "dinh-lang", "ngai-cuu", "nhan-tran", "la-lot",
]
for id in existingAIHerbs {
  let path = "\(root)/herbs/\(id).jpg"
  harmonizeHerb(srcPath: path, dstPath: path, insetFraction: 0.01, warmTint: false)
}

paintTranBi(dstPath: "\(root)/herbs/tran-bi.jpg")
paintDanSam(dstPath: "\(root)/herbs/dan-sam.jpg")

harmonizeCover(
  srcPath: "\(brain)/bac_nam_rung_1795753871643.jpg",
  dstPath: "\(root)/patients/c3-than-duong-hu-phong-thap.jpg",
  width: 480,
  height: 640,
  topBias: 0.72,
  warmVeil: 0.02
)

harmonizeCover(
  srcPath: "\(brain)/mortar_closeup_1795753881008.jpg",
  dstPath: "\(root)/tools/mortar-closeup.jpg",
  width: 640,
  height: 420,
  topBias: 0.5,
  warmVeil: 0.03
)

harmonizeCover(
  srcPath: "\(brain)/wok_closeup_1795753891061.jpg",
  dstPath: "\(root)/tools/wok-closeup.jpg",
  width: 640,
  height: 420,
  topBias: 0.5,
  warmVeil: 0.03
)

harmonizeCover(
  srcPath: "\(brain)/room_hau_vien_1795753901786.jpg",
  dstPath: "\(root)/scenes/room-hau-vien.jpg",
  width: 1280,
  height: 720,
  topBias: 0.5,
  warmVeil: 0.03
)

harmonizeCover(
  srcPath: "\(brain)/tang_thu_library_1795753911556.jpg",
  dstPath: "\(root)/scenes/tang-thu-library.jpg",
  width: 1280,
  height: 720,
  topBias: 0.5,
  warmVeil: 0.03
)

paintYMieuTemple(dstPath: "\(root)/scenes/y-mieu-temple.jpg")
paintDuongSinhScroll(dstPath: "\(root)/scenes/duong-sinh-scroll.jpg")

print("ALL 50 CONCEPT ASSETS UNIFIED.")
