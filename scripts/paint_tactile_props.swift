import AppKit
import CoreGraphics
import Foundation

let outDir = "/Users/thiagop/nam-y-quan/public/art/tools"
let S = 512

func makeCtx(_ w: Int = S, _ h: Int = S) -> CGContext {
  let cs = CGColorSpaceCreateDeviceRGB()
  let ctx = CGContext(
    data: nil,
    width: w,
    height: h,
    bitsPerComponent: 8,
    bytesPerRow: w * 4,
    space: cs,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  )!
  ctx.interpolationQuality = .high
  return ctx
}

func col(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1.0) -> CGColor {
  CGColor(red: r, green: g, blue: b, alpha: a)
}

func saveJPEG(_ ctx: CGContext, name: String, quality: CGFloat = 0.92) {
  let img = ctx.makeImage()!
  let rep = NSBitmapImageRep(cgImage: img)
  let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality])!
  let path = "\(outDir)/\(name)"
  try! data.write(to: URL(fileURLWithPath: path))
  print("WROTE \(path) (\(img.width)x\(img.height), \(data.count) bytes)")
}

struct SeededRNG {
  var state: UInt64
  mutating func next() -> CGFloat {
    state = state &* 6364136223846793005 &+ 1442695040888963407
    return CGFloat((state >> 32) & 0xFFFF) / 65535.0
  }
}

func radialWash(_ ctx: CGContext, cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, r: CGFloat, g: CGFloat, b: CGFloat, alpha: CGFloat) {
  let cs = CGColorSpaceCreateDeviceRGB()
  let grad = CGGradient(
    colorsSpace: cs,
    colors: [col(r, g, b, alpha), col(r, g, b, alpha * 0.45), col(r, g, b, 0)] as CFArray,
    locations: [0.0, 0.55, 1.0]
  )!
  ctx.saveGState()
  ctx.translateBy(x: cx, y: cy)
  ctx.scaleBy(x: 1.0, y: ry / max(1.0, rx))
  ctx.drawRadialGradient(grad, startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: rx, options: [])
  ctx.restoreGState()
}

func drawDoPaper(_ ctx: CGContext, seed: UInt64) {
  var rng = SeededRNG(state: seed)
  ctx.setFillColor(col(230/255, 214/255, 182/255))
  ctx.fill(CGRect(x: 0, y: 0, width: S, height: S))

  // Watercolor blotches & warm tea-stained parchment washes
  for _ in 0..<18 {
    let cx = rng.next() * CGFloat(S)
    let cy = rng.next() * CGFloat(S)
    let rad = 50 + rng.next() * 140
    let warm = rng.next() > 0.45
    radialWash(ctx, cx: cx, cy: cy, rx: rad, ry: rad * (0.7 + rng.next() * 0.5),
               r: warm ? 0.80 : 0.96, g: warm ? 0.67 : 0.90, b: warm ? 0.46 : 0.78,
               alpha: 0.14 + rng.next() * 0.14)
  }

  // Soft aged vignette + delicate Dó mulberry paper fibers
  radialWash(ctx, cx: 256, cy: 256, rx: 350, ry: 350, r: 0.97, g: 0.92, b: 0.82, alpha: 0.25)

  ctx.setLineCap(.round)
  for _ in 0..<240 {
    let x1 = rng.next() * CGFloat(S)
    let y1 = rng.next() * CGFloat(S)
    let ang = rng.next() * .pi * 2
    let len = 4 + rng.next() * 14
    ctx.beginPath()
    ctx.move(to: CGPoint(x: x1, y: y1))
    ctx.addLine(to: CGPoint(x: x1 + cos(ang) * len, y: y1 + sin(ang) * len))
    ctx.setStrokeColor(rng.next() > 0.5 ? col(0.55, 0.42, 0.27, 0.10) : col(0.98, 0.94, 0.84, 0.18))
    ctx.setLineWidth(0.7 + rng.next() * 0.8)
    ctx.strokePath()
  }

  // Subtle hand-inked outer woodblock frame
  ctx.setStrokeColor(col(0.32, 0.21, 0.12, 0.45))
  ctx.setLineWidth(2.0)
  ctx.stroke(CGRect(x: 14, y: 14, width: S - 28, height: S - 28))
}

func fillAndInk(_ ctx: CGContext, path: CGPath, fillGradientColors: [CGColor], start: CGPoint, end: CGPoint, inkWidth: CGFloat = 3.2) {
  let cs = CGColorSpaceCreateDeviceRGB()
  ctx.saveGState()
  ctx.addPath(path)
  ctx.clip()
  let grad = CGGradient(colorsSpace: cs, colors: fillGradientColors as CFArray, locations: nil)!
  ctx.drawLinearGradient(grad, start: start, end: end, options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
  ctx.restoreGState()

  ctx.addPath(path)
  ctx.setStrokeColor(col(0.17, 0.11, 0.07, 0.92))
  ctx.setLineWidth(inkWidth)
  ctx.setLineJoin(.round)
  ctx.setLineCap(.round)
  ctx.strokePath()
}

// =========================================================================
// 1. BAMBOO CUPPING JARS (Ống giác hơi tre cổ truyền + chén lửa ấm)
// =========================================================================
func paintBambooCupping() {
  let ctx = makeCtx()
  drawDoPaper(ctx, seed: 101)

  // Soft cast shadows
  radialWash(ctx, cx: 230, cy: 132, rx: 140, ry: 36, r: 0.28, g: 0.18, b: 0.10, alpha: 0.34)
  radialWash(ctx, cx: 335, cy: 120, rx: 95, ry: 28, r: 0.28, g: 0.18, b: 0.10, alpha: 0.32)

  // Back tilted bamboo jar (Right)
  ctx.saveGState()
  ctx.translateBy(x: 326, y: 245)
  ctx.rotate(by: -0.22)
  let jar2 = CGMutablePath()
  jar2.move(to: CGPoint(x: -44, y: -110))
  jar2.addCurve(to: CGPoint(x: -50, y: 85), control1: CGPoint(x: -48, y: -40), control2: CGPoint(x: -54, y: 30))
  jar2.addCurve(to: CGPoint(x: 50, y: 85), control1: CGPoint(x: -25, y: 102), control2: CGPoint(x: 25, y: 102))
  jar2.addCurve(to: CGPoint(x: 44, y: -110), control1: CGPoint(x: 54, y: 30), control2: CGPoint(x: 48, y: -40))
  jar2.closeSubpath()
  fillAndInk(ctx, path: jar2, fillGradientColors: [
    col(0.76, 0.56, 0.31), col(0.60, 0.41, 0.20), col(0.36, 0.22, 0.11)
  ], start: CGPoint(x: -50, y: 0), end: CGPoint(x: 52, y: 0), inkWidth: 3.0)
  // Bamboo node ridge
  ctx.beginPath()
  ctx.move(to: CGPoint(x: -49, y: -8))
  ctx.addQuadCurve(to: CGPoint(x: 49, y: -8), control: CGPoint(x: 0, y: -22))
  ctx.setStrokeColor(col(0.18, 0.11, 0.06, 0.78))
  ctx.setLineWidth(2.6)
  ctx.strokePath()
  // Top rim
  let rim2 = CGMutablePath()
  rim2.addEllipse(in: CGRect(x: -44, y: 72, width: 88, height: 24))
  fillAndInk(ctx, path: rim2, fillGradientColors: [col(0.24, 0.14, 0.08), col(0.42, 0.27, 0.14)],
             start: CGPoint(x: 0, y: 96), end: CGPoint(x: 0, y: 72), inkWidth: 2.8)
  ctx.restoreGState()

  // Foreground primary large roasted-bamboo cupping jar (Center-Left)
  ctx.saveGState()
  ctx.translateBy(x: 204, y: 270)
  ctx.rotate(by: 0.07)
  let jar1 = CGMutablePath()
  jar1.move(to: CGPoint(x: -56, y: -128))
  jar1.addCurve(to: CGPoint(x: -64, y: 98), control1: CGPoint(x: -62, y: -45), control2: CGPoint(x: -70, y: 32))
  jar1.addCurve(to: CGPoint(x: 64, y: 98), control1: CGPoint(x: -35, y: 120), control2: CGPoint(x: 35, y: 120))
  jar1.addCurve(to: CGPoint(x: 56, y: -128), control1: CGPoint(x: 70, y: 32), control2: CGPoint(x: 62, y: -45))
  jar1.addCurve(to: CGPoint(x: -56, y: -128), control1: CGPoint(x: 24, y: -144), control2: CGPoint(x: -24, y: -144))
  jar1.closeSubpath()
  fillAndInk(ctx, path: jar1, fillGradientColors: [
    col(0.84, 0.65, 0.37), col(0.66, 0.45, 0.22), col(0.40, 0.24, 0.11)
  ], start: CGPoint(x: -64, y: 0), end: CGPoint(x: 66, y: 0), inkWidth: 3.4)

  // Vertical bamboo grain hatching & warm flame reflection
  for sx in stride(from: -38.0, through: 42.0, by: 12.0) {
    ctx.beginPath()
    ctx.move(to: CGPoint(x: sx, y: -112))
    ctx.addLine(to: CGPoint(x: sx * 1.08, y: 82))
    ctx.setStrokeColor(col(0.24, 0.14, 0.07, 0.24))
    ctx.setLineWidth(1.2)
    ctx.strokePath()
  }
  ctx.beginPath()
  ctx.move(to: CGPoint(x: -63, y: -14))
  ctx.addQuadCurve(to: CGPoint(x: 63, y: -14), control: CGPoint(x: 0, y: -32))
  ctx.setStrokeColor(col(0.16, 0.10, 0.06, 0.85))
  ctx.setLineWidth(3.0)
  ctx.strokePath()

  // Mouth rim & inner ember-warm glow
  let rim1 = CGMutablePath()
  rim1.addEllipse(in: CGRect(x: -56, y: 80, width: 112, height: 32))
  fillAndInk(ctx, path: rim1, fillGradientColors: [col(0.18, 0.10, 0.06), col(0.55, 0.24, 0.10)],
             start: CGPoint(x: 0, y: 112), end: CGPoint(x: 0, y: 80), inkWidth: 3.0)
  radialWash(ctx, cx: 0, cy: 96, rx: 40, ry: 12, r: 0.96, g: 0.50, b: 0.16, alpha: 0.48)
  ctx.restoreGState()

  // Small ceramic spirit/ember cup in front right + rising warm wisps
  let cup = CGMutablePath()
  cup.move(to: CGPoint(x: 315, y: 145))
  cup.addQuadCurve(to: CGPoint(x: 345, y: 115), control: CGPoint(x: 318, y: 120))
  cup.addQuadCurve(to: CGPoint(x: 382, y: 115), control: CGPoint(x: 363, y: 110))
  cup.addQuadCurve(to: CGPoint(x: 412, y: 145), control: CGPoint(x: 408, y: 120))
  cup.closeSubpath()
  fillAndInk(ctx, path: cup, fillGradientColors: [col(0.62, 0.72, 0.63), col(0.36, 0.49, 0.43)],
             start: CGPoint(x: 315, y: 140), end: CGPoint(x: 412, y: 120), inkWidth: 2.8)
  radialWash(ctx, cx: 363, cy: 162, rx: 32, ry: 34, r: 0.98, g: 0.56, b: 0.18, alpha: 0.42)
  radialWash(ctx, cx: 363, cy: 164, rx: 14, ry: 18, r: 1.0, g: 0.85, b: 0.42, alpha: 0.82)

  saveJPEG(ctx, name: "bamboo-cupping.jpg")
}

// =========================================================================
// 2. PORCELAIN DECOCTION BOWL (Bát sứ men lam Bát Tràng bốc khói)
// =========================================================================
func paintPorcelainBowl() {
  let ctx = makeCtx()
  drawDoPaper(ctx, seed: 202)

  // Saucer shadow + wooden coaster rim
  radialWash(ctx, cx: 256, cy: 142, rx: 165, ry: 44, r: 0.24, g: 0.15, b: 0.08, alpha: 0.36)

  // Bowl foot ring
  let foot = CGMutablePath()
  foot.move(to: CGPoint(x: 196, y: 158))
  foot.addLine(to: CGPoint(x: 204, y: 132))
  foot.addQuadCurve(to: CGPoint(x: 308, y: 132), control: CGPoint(x: 256, y: 124))
  foot.addLine(to: CGPoint(x: 316, y: 158))
  foot.closeSubpath()
  fillAndInk(ctx, path: foot, fillGradientColors: [col(0.84, 0.85, 0.81), col(0.64, 0.67, 0.63)],
             start: CGPoint(x: 196, y: 145), end: CGPoint(x: 316, y: 145), inkWidth: 2.8)

  // Outer Bát Tràng crackle porcelain bowl body
  let bowl = CGMutablePath()
  bowl.move(to: CGPoint(x: 94, y: 274))
  bowl.addCurve(to: CGPoint(x: 194, y: 146), control1: CGPoint(x: 96, y: 198), control2: CGPoint(x: 142, y: 156))
  bowl.addQuadCurve(to: CGPoint(x: 318, y: 146), control: CGPoint(x: 256, y: 134))
  bowl.addCurve(to: CGPoint(x: 418, y: 274), control1: CGPoint(x: 370, y: 156), control2: CGPoint(x: 416, y: 198))
  bowl.addQuadCurve(to: CGPoint(x: 94, y: 274), control: CGPoint(x: 256, y: 215))
  bowl.closeSubpath()
  fillAndInk(ctx, path: bowl, fillGradientColors: [
    col(0.92, 0.91, 0.85), col(0.80, 0.82, 0.77), col(0.60, 0.65, 0.63)
  ], start: CGPoint(x: 105, y: 240), end: CGPoint(x: 410, y: 180), inkWidth: 3.4)

  // Cobalt-blue traditional brushwork lotus & wave band along bowl belly
  ctx.saveGState()
  ctx.addPath(bowl)
  ctx.clip()
  for i in 0..<7 {
    let bx = 114.0 + CGFloat(i) * 48.0
    radialWash(ctx, cx: bx, cy: 202, rx: 24, ry: 18, r: 0.16, g: 0.29, b: 0.48, alpha: 0.42)
    ctx.beginPath()
    ctx.move(to: CGPoint(x: bx - 16, y: 192))
    ctx.addCurve(to: CGPoint(x: bx, y: 222), control1: CGPoint(x: bx - 12, y: 212), control2: CGPoint(x: bx - 4, y: 220))
    ctx.addCurve(to: CGPoint(x: bx + 16, y: 192), control1: CGPoint(x: bx + 4, y: 220), control2: CGPoint(x: bx + 12, y: 212))
    ctx.setStrokeColor(col(0.14, 0.26, 0.44, 0.72))
    ctx.setLineWidth(2.2)
    ctx.strokePath()
  }
  ctx.restoreGState()

  // Bowl interior & thick amber-brown medicinal soup
  let interior = CGMutablePath()
  interior.addEllipse(in: CGRect(x: 94, y: 228, width: 324, height: 96))
  fillAndInk(ctx, path: interior, fillGradientColors: [col(0.82, 0.81, 0.75), col(0.95, 0.94, 0.89)],
             start: CGPoint(x: 256, y: 324), end: CGPoint(x: 256, y: 228), inkWidth: 3.2)

  let liquid = CGMutablePath()
  liquid.addEllipse(in: CGRect(x: 112, y: 234, width: 288, height: 74))
  fillAndInk(ctx, path: liquid, fillGradientColors: [
    col(0.24, 0.11, 0.04), col(0.46, 0.21, 0.06), col(0.64, 0.34, 0.10)
  ], start: CGPoint(x: 256, y: 308), end: CGPoint(x: 256, y: 234), inkWidth: 2.0)

  // Floating herbal highlights & blue double-ring rim
  radialWash(ctx, cx: 222, cy: 274, rx: 64, ry: 18, r: 0.88, g: 0.58, b: 0.24, alpha: 0.38)
  ctx.beginPath()
  ctx.addEllipse(in: CGRect(x: 99, y: 232, width: 314, height: 88))
  ctx.setStrokeColor(col(0.16, 0.30, 0.48, 0.65))
  ctx.setLineWidth(2.0)
  ctx.strokePath()

  // Soft painterly ascending steam plumes
  for (ox, amp) in [(210.0, 14.0), (258.0, -16.0), (302.0, 12.0)] as [(CGFloat, CGFloat)] {
    ctx.beginPath()
    ctx.move(to: CGPoint(x: ox, y: 285))
    ctx.addCurve(to: CGPoint(x: ox + amp, y: 365), control1: CGPoint(x: ox - amp, y: 315), control2: CGPoint(x: ox + amp * 1.4, y: 340))
    ctx.addCurve(to: CGPoint(x: ox - amp * 0.4, y: 445), control1: CGPoint(x: ox - amp * 0.8, y: 392), control2: CGPoint(x: ox + amp, y: 420))
    ctx.setStrokeColor(col(0.99, 0.97, 0.92, 0.72))
    ctx.setLineWidth(7.0)
    ctx.setLineCap(.round)
    ctx.strokePath()
  }

  saveJPEG(ctx, name: "porcelain-decoction-bowl.jpg")
}

// =========================================================================
// 3. COCONUT LADLE (Gáo dừa cán tre múc sương mai)
// =========================================================================
func paintCoconutLadle() {
  let ctx = makeCtx()
  drawDoPaper(ctx, seed: 303)

  radialWash(ctx, cx: 235, cy: 146, rx: 145, ry: 34, r: 0.25, g: 0.16, b: 0.08, alpha: 0.32)

  // Slender bamboo handle sweeping diagonally right-upward
  let handle = CGMutablePath()
  handle.move(to: CGPoint(x: 245, y: 222))
  handle.addLine(to: CGPoint(x: 422, y: 396))
  handle.addQuadCurve(to: CGPoint(x: 438, y: 380), control: CGPoint(x: 436, y: 394))
  handle.addLine(to: CGPoint(x: 262, y: 204))
  handle.closeSubpath()
  fillAndInk(ctx, path: handle, fillGradientColors: [
    col(0.84, 0.70, 0.42), col(0.66, 0.50, 0.25), col(0.48, 0.34, 0.15)
  ], start: CGPoint(x: 320, y: 320), end: CGPoint(x: 350, y: 280), inkWidth: 3.0)

  // Bamboo handle joints
  for t in [0.35, 0.72] as [CGFloat] {
    let jx = 252 + t * 174
    let jy = 212 + t * 172
    ctx.beginPath()
    ctx.move(to: CGPoint(x: jx - 10, y: jy + 10))
    ctx.addLine(to: CGPoint(x: jx + 10, y: jy - 10))
    ctx.setStrokeColor(col(0.20, 0.12, 0.06, 0.85))
    ctx.setLineWidth(3.0)
    ctx.strokePath()
  }

  // Carved dark walnut/coconut shell bowl (left-foreground)
  let shell = CGMutablePath()
  shell.move(to: CGPoint(x: 78, y: 236))
  shell.addCurve(to: CGPoint(x: 184, y: 122), control1: CGPoint(x: 76, y: 162), control2: CGPoint(x: 124, y: 124))
  shell.addCurve(to: CGPoint(x: 292, y: 236), control1: CGPoint(x: 244, y: 124), control2: CGPoint(x: 294, y: 162))
  shell.addQuadCurve(to: CGPoint(x: 78, y: 236), control: CGPoint(x: 185, y: 192))
  shell.closeSubpath()
  fillAndInk(ctx, path: shell, fillGradientColors: [
    col(0.46, 0.29, 0.15), col(0.32, 0.18, 0.09), col(0.18, 0.10, 0.05)
  ], start: CGPoint(x: 90, y: 220), end: CGPoint(x: 270, y: 140), inkWidth: 3.4)

  // Coconut bowl interior & shimmering jade-clear morning dew water
  let rim = CGMutablePath()
  rim.addEllipse(in: CGRect(x: 78, y: 202, width: 214, height: 68))
  fillAndInk(ctx, path: rim, fillGradientColors: [col(0.64, 0.45, 0.27), col(0.38, 0.24, 0.13)],
             start: CGPoint(x: 185, y: 270), end: CGPoint(x: 185, y: 202), inkWidth: 3.0)

  let water = CGMutablePath()
  water.addEllipse(in: CGRect(x: 92, y: 208, width: 186, height: 50))
  fillAndInk(ctx, path: water, fillGradientColors: [
    col(0.64, 0.85, 0.88, 0.95), col(0.32, 0.62, 0.68, 0.95)
  ], start: CGPoint(x: 185, y: 258), end: CGPoint(x: 185, y: 208), inkWidth: 2.0)

  // Water shimmer arcs + falling clear morning droplets
  ctx.beginPath()
  ctx.move(to: CGPoint(x: 132, y: 236))
  ctx.addQuadCurve(to: CGPoint(x: 216, y: 242), control: CGPoint(x: 175, y: 252))
  ctx.setStrokeColor(col(0.95, 0.99, 1.0, 0.82))
  ctx.setLineWidth(2.6)
  ctx.strokePath()

  for (dx, dy, dr) in [(88.0, 178.0, 6.0), (104.0, 150.0, 4.5), (124.0, 128.0, 4.0)] as [(CGFloat, CGFloat, CGFloat)] {
    let drop = CGMutablePath()
    drop.move(to: CGPoint(x: dx, y: dy + dr * 1.6))
    drop.addCurve(to: CGPoint(x: dx, y: dy - dr), control1: CGPoint(x: dx - dr, y: dy), control2: CGPoint(x: dx - dr * 0.8, y: dy - dr))
    drop.addCurve(to: CGPoint(x: dx, y: dy + dr * 1.6), control1: CGPoint(x: dx + dr * 0.8, y: dy - dr), control2: CGPoint(x: dx + dr, y: dy))
    drop.closeSubpath()
    fillAndInk(ctx, path: drop, fillGradientColors: [col(0.84, 0.96, 0.98), col(0.35, 0.68, 0.74)],
               start: CGPoint(x: dx - 2, y: dy + 4), end: CGPoint(x: dx + 2, y: dy - 4), inkWidth: 1.8)
  }

  saveJPEG(ctx, name: "coconut-ladle.jpg")
}

// =========================================================================
// 4. BRONZE SHEARS (Kéo đồng cắt thuốc cổ & nhành thảo dược)
// =========================================================================
func paintBronzeShears() {
  let ctx = makeCtx()
  drawDoPaper(ctx, seed: 404)

  radialWash(ctx, cx: 256, cy: 190, rx: 160, ry: 48, r: 0.25, g: 0.16, b: 0.08, alpha: 0.24)

  // Freshly snipped green herb sprig beneath the shear blades (Right)
  ctx.beginPath()
  ctx.move(to: CGPoint(x: 270, y: 170))
  ctx.addCurve(to: CGPoint(x: 412, y: 142), control1: CGPoint(x: 325, y: 168), control2: CGPoint(x: 375, y: 158))
  ctx.setStrokeColor(col(0.18, 0.34, 0.22, 0.92))
  ctx.setLineWidth(3.2)
  ctx.strokePath()
  for (lx, ly, rot) in [(325.0, 174.0, 0.42), (370.0, 166.0, 0.32), (345.0, 140.0, -0.58), (392.0, 134.0, -0.45)] as [(CGFloat, CGFloat, CGFloat)] {
    ctx.saveGState()
    ctx.translateBy(x: lx, y: ly)
    ctx.rotate(by: rot)
    let leaf = CGMutablePath()
    leaf.move(to: CGPoint(x: -22, y: 0))
    leaf.addQuadCurve(to: CGPoint(x: 24, y: 0), control: CGPoint(x: 0, y: 18))
    leaf.addQuadCurve(to: CGPoint(x: -22, y: 0), control: CGPoint(x: 0, y: -18))
    leaf.closeSubpath()
    fillAndInk(ctx, path: leaf, fillGradientColors: [col(0.48, 0.67, 0.38), col(0.22, 0.42, 0.28)],
               start: CGPoint(x: -20, y: 10), end: CGPoint(x: 20, y: -10), inkWidth: 2.2)
    ctx.restoreGState()
  }

  // Blade A (sweeping upper-left)
  let bladeA = CGMutablePath()
  bladeA.move(to: CGPoint(x: 236, y: 248))
  bladeA.addCurve(to: CGPoint(x: 424, y: 340), control1: CGPoint(x: 312, y: 288), control2: CGPoint(x: 382, y: 326))
  bladeA.addCurve(to: CGPoint(x: 256, y: 226), control1: CGPoint(x: 382, y: 292), control2: CGPoint(x: 318, y: 248))
  bladeA.closeSubpath()
  fillAndInk(ctx, path: bladeA, fillGradientColors: [
    col(0.78, 0.79, 0.76), col(0.55, 0.57, 0.56), col(0.36, 0.38, 0.39)
  ], start: CGPoint(x: 300, y: 290), end: CGPoint(x: 330, y: 245), inkWidth: 3.0)

  // Blade B (sweeping lower-right)
  let bladeB = CGMutablePath()
  bladeB.move(to: CGPoint(x: 234, y: 248))
  bladeB.addCurve(to: CGPoint(x: 422, y: 212), control1: CGPoint(x: 312, y: 222), control2: CGPoint(x: 378, y: 212))
  bladeB.addCurve(to: CGPoint(x: 256, y: 272), control1: CGPoint(x: 375, y: 244), control2: CGPoint(x: 310, y: 264))
  bladeB.closeSubpath()
  fillAndInk(ctx, path: bladeB, fillGradientColors: [
    col(0.84, 0.85, 0.81), col(0.62, 0.63, 0.61), col(0.40, 0.42, 0.42)
  ], start: CGPoint(x: 300, y: 265), end: CGPoint(x: 330, y: 215), inkWidth: 3.0)

  // Antique bronze finger loops & stems
  for (loopY, stemTarget) in [(328.0, CGPoint(x: 246, y: 246)), (180.0, CGPoint(x: 244, y: 254))] {
    let stem = CGMutablePath()
    stem.move(to: stemTarget)
    stem.addLine(to: CGPoint(x: 158, y: loopY + (loopY > 250 ? -12 : 12)))
    stem.addLine(to: CGPoint(x: 148, y: loopY + (loopY > 250 ? 6 : -6)))
    stem.addLine(to: CGPoint(x: stemTarget.x, y: stemTarget.y + (loopY > 250 ? 18 : -18)))
    stem.closeSubpath()
    fillAndInk(ctx, path: stem, fillGradientColors: [col(0.84, 0.65, 0.33), col(0.54, 0.36, 0.14)],
               start: CGPoint(x: 150, y: loopY), end: stemTarget, inkWidth: 3.0)

    let outer = CGMutablePath()
    outer.addEllipse(in: CGRect(x: 80, y: loopY - 40, width: 88, height: 80))
    fillAndInk(ctx, path: outer, fillGradientColors: [col(0.86, 0.67, 0.34), col(0.52, 0.34, 0.13)],
               start: CGPoint(x: 80, y: loopY + 40), end: CGPoint(x: 168, y: loopY - 40), inkWidth: 3.2)

    let hole = CGMutablePath()
    hole.addEllipse(in: CGRect(x: 98, y: loopY - 24, width: 52, height: 48))
    ctx.addPath(hole)
    ctx.setFillColor(col(230/255, 214/255, 182/255))
    ctx.fillPath()
    ctx.addPath(hole)
    ctx.setStrokeColor(col(0.18, 0.11, 0.06, 0.90))
    ctx.setLineWidth(2.8)
    ctx.strokePath()
  }

  // Central bronze pivot rivet
  let rivet = CGMutablePath()
  rivet.addEllipse(in: CGRect(x: 236, y: 242, width: 18, height: 18))
  fillAndInk(ctx, path: rivet, fillGradientColors: [col(0.95, 0.80, 0.45), col(0.58, 0.39, 0.16)],
             start: CGPoint(x: 236, y: 260), end: CGPoint(x: 254, y: 242), inkWidth: 2.6)

  saveJPEG(ctx, name: "bronze-shears.jpg")
}

// =========================================================================
// 5. BAMBOO BASKET (Giỏ mây tre đan đựng lá thuốc tươi)
// =========================================================================
func paintBambooBasket() {
  let ctx = makeCtx()
  drawDoPaper(ctx, seed: 505)

  radialWash(ctx, cx: 256, cy: 135, rx: 185, ry: 42, r: 0.24, g: 0.15, b: 0.08, alpha: 0.34)

  // Shallow woven basket body (lower-foreground)
  let body = CGMutablePath()
  body.move(to: CGPoint(x: 72, y: 258))
  body.addCurve(to: CGPoint(x: 158, y: 140), control1: CGPoint(x: 84, y: 180), control2: CGPoint(x: 118, y: 145))
  body.addQuadCurve(to: CGPoint(x: 354, y: 140), control: CGPoint(x: 256, y: 122))
  body.addCurve(to: CGPoint(x: 440, y: 258), control1: CGPoint(x: 394, y: 145), control2: CGPoint(x: 428, y: 180))
  body.addQuadCurve(to: CGPoint(x: 72, y: 258), control: CGPoint(x: 256, y: 210))
  body.closeSubpath()
  fillAndInk(ctx, path: body, fillGradientColors: [
    col(0.84, 0.67, 0.39), col(0.66, 0.48, 0.24), col(0.45, 0.31, 0.14)
  ], start: CGPoint(x: 80, y: 250), end: CGPoint(x: 430, y: 145), inkWidth: 3.4)

  // Cross-hatched woven rattan strips clipped inside basket body
  ctx.saveGState()
  ctx.addPath(body)
  ctx.clip()
  for i in stride(from: -140.0, through: 540.0, by: 24.0) {
    ctx.beginPath()
    ctx.move(to: CGPoint(x: i, y: 270))
    ctx.addLine(to: CGPoint(x: i + 64, y: 120))
    ctx.move(to: CGPoint(x: i + 64, y: 270))
    ctx.addLine(to: CGPoint(x: i, y: 120))
    ctx.setStrokeColor(col(0.24, 0.15, 0.06, 0.36))
    ctx.setLineWidth(2.0)
    ctx.strokePath()
  }
  ctx.restoreGState()

  // Woven interior floor ellipse
  let inside = CGMutablePath()
  inside.addEllipse(in: CGRect(x: 74, y: 218, width: 364, height: 84))
  fillAndInk(ctx, path: inside, fillGradientColors: [col(0.56, 0.40, 0.20), col(0.75, 0.58, 0.32)],
             start: CGPoint(x: 256, y: 302), end: CGPoint(x: 256, y: 218), inkWidth: 3.0)

  // Pile of freshly harvested lush green & violet Perilla / Mint / Ginger sprigs inside basket
  let leaves: [(CGFloat, CGFloat, CGFloat, CGFloat, Bool)] = [
    (168, 258, -0.35, 1.15, false),
    (220, 268, 0.22, 1.25, true),
    (284, 266, -0.18, 1.20, false),
    (342, 256, 0.38, 1.10, false),
    (200, 286, 0.10, 1.10, false),
    (256, 290, -0.06, 1.30, true),
    (312, 284, 0.25, 1.12, false)
  ]
  for (lx, ly, rot, sc, isPurple) in leaves {
    ctx.saveGState()
    ctx.translateBy(x: lx, y: ly)
    ctx.rotate(by: rot)
    ctx.scaleBy(x: sc, y: sc)
    let lf = CGMutablePath()
    lf.move(to: CGPoint(x: -36, y: 0))
    lf.addCurve(to: CGPoint(x: 38, y: 0), control1: CGPoint(x: -14, y: 24), control2: CGPoint(x: 16, y: 22))
    lf.addCurve(to: CGPoint(x: -36, y: 0), control1: CGPoint(x: 16, y: -22), control2: CGPoint(x: -14, y: -24))
    lf.closeSubpath()
    fillAndInk(ctx, path: lf, fillGradientColors: isPurple
      ? [col(0.52, 0.33, 0.44), col(0.28, 0.42, 0.31)]
      : [col(0.52, 0.72, 0.41), col(0.21, 0.42, 0.27)],
      start: CGPoint(x: -30, y: 14), end: CGPoint(x: 30, y: -14), inkWidth: 2.2)
    ctx.beginPath()
    ctx.move(to: CGPoint(x: -34, y: 0))
    ctx.addLine(to: CGPoint(x: 34, y: 0))
    ctx.setStrokeColor(col(0.15, 0.22, 0.12, 0.7))
    ctx.setLineWidth(1.5)
    ctx.strokePath()
    ctx.restoreGState()
  }

  // Thick braided upper bamboo rim over leaves bottom edge
  ctx.beginPath()
  ctx.move(to: CGPoint(x: 72, y: 258))
  ctx.addQuadCurve(to: CGPoint(x: 440, y: 258), control: CGPoint(x: 256, y: 194))
  ctx.setStrokeColor(col(0.46, 0.31, 0.14, 0.95))
  ctx.setLineWidth(10.0)
  ctx.setLineCap(.round)
  ctx.strokePath()
  ctx.beginPath()
  ctx.move(to: CGPoint(x: 72, y: 258))
  ctx.addQuadCurve(to: CGPoint(x: 440, y: 258), control: CGPoint(x: 256, y: 194))
  ctx.setStrokeColor(col(0.84, 0.67, 0.39, 0.92))
  ctx.setLineWidth(5.5)
  ctx.strokePath()

  saveJPEG(ctx, name: "bamboo-basket.jpg")
}

paintBambooCupping()
paintPorcelainBowl()
paintCoconutLadle()
paintBronzeShears()
paintBambooBasket()
