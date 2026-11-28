// Cân tiểu ly (đẳng tử) + hộp cân hình đàn in thủy mặc: brush ink line, gray/sepia washes
// with pooled edges, dry-brush breaks and hatching, on transparent PNG.
// Run: swift scripts/paint_steelyard.swift && npm run art:webp
// Geometry is fixed: BrassScaleRig.tsx assumes beam 1200×80 (đề x=200, sao 0…10 tiền from x=260, 86px/tiền),
// pan 360×120, weight 120×160, case 1200×240.
import AppKit
import CoreGraphics
import Foundation

let outDir = "/Users/thiagop/nam-y-quan/public/art/tools"

func makeCtx(_ w: Int, _ h: Int) -> CGContext {
  let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                      space: CGColorSpaceCreateDeviceRGB(),
                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.interpolationQuality = .high
  ctx.translateBy(x: 0, y: CGFloat(h))
  ctx.scaleBy(x: 1, y: -1) // top-left origin, like the SVG overlay
  ctx.setLineCap(.round); ctx.setLineJoin(.round)
  return ctx
}

typealias RGB = (CGFloat, CGFloat, CGFloat)
func col(_ c: RGB, _ a: CGFloat) -> CGColor { CGColor(red: c.0, green: c.1, blue: c.2, alpha: a) }

let INK: RGB = (0.13, 0.09, 0.06)      // sepia-black mực tàu
let GRAY: RGB = (0.36, 0.33, 0.30)     // diluted ink wash
let BONE: RGB = (0.86, 0.79, 0.62)
let BRASS: RGB = (0.74, 0.56, 0.26)
let BRASS_D: RGB = (0.34, 0.22, 0.08)
let WOOD: RGB = (0.42, 0.25, 0.13)
let WOOD_D: RGB = (0.22, 0.12, 0.06)
let PEARL: RGB = (0.90, 0.92, 0.88)

func savePNG(_ ctx: CGContext, _ name: String) {
  let img = ctx.makeImage()!
  let data = NSBitmapImageRep(cgImage: img).representation(using: .png, properties: [:])!
  try! data.write(to: URL(fileURLWithPath: "\(outDir)/\(name)"))
  print("WROTE \(name) \(img.width)x\(img.height)")
}

struct RNG {
  var s: UInt64
  mutating func next() -> CGFloat {
    s = s &* 6364136223846793005 &+ 1442695040888963407
    return CGFloat((s >> 32) & 0xFFFF) / 65535
  }
}

/// Smooth 1-D noise in [-1, 1] (sum of seeded sines) — brush pressure and edge wobble.
func noise(_ t: CGFloat, _ seed: CGFloat) -> CGFloat {
  (sin(t * 1.7 + seed) * 0.5 + sin(t * 3.9 + seed * 2.3) * 0.3 + sin(t * 8.1 + seed * 0.7) * 0.2)
}

func lerp(_ a: CGPoint, _ b: CGPoint, _ t: CGFloat) -> CGPoint { CGPoint(x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t) }
func dist(_ a: CGPoint, _ b: CGPoint) -> CGFloat { hypot(b.x - a.x, b.y - a.y) }
func quadAt(_ a: CGPoint, _ c: CGPoint, _ b: CGPoint, _ t: CGFloat) -> CGPoint { lerp(lerp(a, c, t), lerp(c, b, t), t) }
func cubicAt(_ a: CGPoint, _ c1: CGPoint, _ c2: CGPoint, _ b: CGPoint, _ t: CGFloat) -> CGPoint {
  quadAt(lerp(a, c1, t), lerp(c1, c2, t), lerp(c2, b, t), t)
}

/// Flattens a CGPath into points every ~`step` px.
func sample(_ path: CGPath, step: CGFloat = 4) -> [CGPoint] {
  var pts: [CGPoint] = []
  var cur = CGPoint.zero
  var start = CGPoint.zero
  func add(_ len: CGFloat, _ f: (CGFloat) -> CGPoint) {
    let n = max(1, Int(len / step))
    for i in 1...n { pts.append(f(CGFloat(i) / CGFloat(n))) }
  }
  path.applyWithBlock { (e: UnsafePointer<CGPathElement>) -> Void in
    let p = e.pointee.points
    let kind = e.pointee.type
    if kind == .moveToPoint {
      cur = p[0]; start = cur; pts.append(cur)
    } else if kind == .addLineToPoint {
      let a = cur, b = p[0]
      add(dist(a, b)) { t in lerp(a, b, t) }
      cur = b
    } else if kind == .addQuadCurveToPoint {
      let a = cur, c = p[0], b = p[1]
      add(dist(a, c) + dist(c, b)) { t in quadAt(a, c, b, t) }
      cur = b
    } else if kind == .addCurveToPoint {
      let a = cur, c1 = p[0], c2 = p[1], b = p[2]
      add(dist(a, c1) + dist(c1, c2) + dist(c2, b)) { t in cubicAt(a, c1, c2, b, t) }
      cur = b
    } else if kind == .closeSubpath {
      let a = cur, b = start
      add(dist(a, b)) { t in lerp(a, b, t) }
      cur = start
    }
  }
  return pts
}

func polygon(_ pts: [CGPoint], jitter: CGFloat, seed: CGFloat) -> CGPath {
  let path = CGMutablePath()
  for (i, p) in pts.enumerated() {
    let t = CGFloat(i) * 0.09
    let q = CGPoint(x: p.x + noise(t, seed) * jitter, y: p.y + noise(t, seed + 5) * jitter)
    if i == 0 { path.move(to: q) } else { path.addLine(to: q) }
  }
  path.closeSubpath()
  return path
}

/// Watercolor wash: several translucent, slightly shifted layers + a darker pooled rim.
func wash(_ ctx: CGContext, _ shape: CGPath, _ c: RGB, alpha: CGFloat, layers: Int = 3, jitter: CGFloat = 2.5, seed: CGFloat) {
  let pts = sample(shape, step: 5)
  for l in 0..<layers {
    let p = polygon(pts, jitter: jitter * (1 + CGFloat(l) * 0.5), seed: seed + CGFloat(l) * 3.1)
    ctx.addPath(p); ctx.setFillColor(col(c, alpha / CGFloat(layers) * 2.2)); ctx.fillPath()
    ctx.addPath(p); ctx.setStrokeColor(col(c, alpha * 0.45)); ctx.setLineWidth(1.6); ctx.strokePath()
  }
}

/// Soft graded wash inside `clip`, darker towards `dark` (shadow side) — đậm nhạt.
func shade(_ ctx: CGContext, _ clip: CGPath, _ c: RGB, from light: CGPoint, to dark: CGPoint, alpha: CGFloat) {
  ctx.saveGState(); ctx.addPath(clip); ctx.clip()
  let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [col(c, 0), col(c, alpha * 0.6), col(c, alpha)] as CFArray,
                     locations: [0, 0.55, 1])!
  ctx.drawLinearGradient(g, start: light, end: dark, options: [.drawsAfterEndLocation])
  ctx.restoreGState()
}

/// Brush ink line along a path: pressure-varying width, double stroke, dry-brush gaps.
func inkLine(_ ctx: CGContext, _ path: CGPath, width: CGFloat, seed: CGFloat, dry: CGFloat = 0.12, alpha: CGFloat = 0.88) {
  let pts = sample(path, step: 2.5)
  guard pts.count > 1 else { return }
  for pass in 0..<2 {
    let off: CGFloat = pass == 0 ? 0 : 0.9
    for i in 1..<pts.count {
      let t = CGFloat(i) * 0.035
      let n = noise(t, seed + CGFloat(pass) * 7)
      if n < -1 + dry * 2 && pass == 0 { continue } // dry brush: the hair runs out of ink
      let w = width * (pass == 0 ? (0.65 + 0.45 * (n + 1) / 2) : 0.4)
      ctx.move(to: CGPoint(x: pts[i - 1].x + off, y: pts[i - 1].y + off))
      ctx.addLine(to: CGPoint(x: pts[i].x + off, y: pts[i].y + off))
      ctx.setStrokeColor(col(INK, pass == 0 ? alpha : alpha * 0.35)); ctx.setLineWidth(w); ctx.strokePath()
    }
  }
}

/// Fine parallel hatching clipped to shape ∩ region (shadow side only).
func hatch(_ ctx: CGContext, _ clip: CGPath, region: CGRect, angle: CGFloat, spacing: CGFloat, alpha: CGFloat, seed: CGFloat) {
  ctx.saveGState(); ctx.addPath(clip); ctx.clip(); ctx.clip(to: region)
  let d = hypot(region.width, region.height)
  let dx = cos(angle), dy = sin(angle)
  var k: CGFloat = -d
  var i: CGFloat = 0
  while k < d {
    let cx = region.midX + -dy * k, cy = region.midY + dx * k
    ctx.move(to: CGPoint(x: cx - dx * d, y: cy - dy * d + noise(i, seed)))
    ctx.addLine(to: CGPoint(x: cx + dx * d, y: cy + dy * d + noise(i + 3, seed)))
    ctx.setStrokeColor(col(INK, alpha * (0.6 + 0.4 * abs(noise(i, seed + 1))))); ctx.setLineWidth(0.9); ctx.strokePath()
    k += spacing; i += 1
  }
  ctx.restoreGState()
}

func speckle(_ ctx: CGContext, _ clip: CGPath, _ c: RGB, count: Int, alpha: CGFloat, seed: UInt64) {
  var r = RNG(s: seed)
  let b = clip.boundingBox
  ctx.saveGState(); ctx.addPath(clip); ctx.clip()
  for _ in 0..<count {
    let x = b.minX + r.next() * b.width, y = b.minY + r.next() * b.height, s = 0.6 + r.next() * 2.2
    ctx.setFillColor(col(c, alpha * (0.4 + r.next() * 0.6)))
    ctx.fillEllipse(in: CGRect(x: x, y: y, width: s * 1.6, height: s))
  }
  ctx.restoreGState()
}

func ellipse(_ r: CGRect) -> CGPath { CGPath(ellipseIn: r, transform: nil) }

// MARK: - Đòn cân 1200×80
func paintBeam() {
  let ctx = makeCtx(1200, 80)
  let beam = CGMutablePath()
  beam.move(to: CGPoint(x: 40, y: 28))
  beam.addCurve(to: CGPoint(x: 1172, y: 37), control1: CGPoint(x: 400, y: 29), control2: CGPoint(x: 900, y: 34))
  beam.addQuadCurve(to: CGPoint(x: 1172, y: 43), control: CGPoint(x: 1179, y: 40))
  beam.addCurve(to: CGPoint(x: 40, y: 52), control1: CGPoint(x: 900, y: 46), control2: CGPoint(x: 400, y: 51))
  beam.closeSubpath()
  wash(ctx, beam, BONE, alpha: 0.85, jitter: 0.8, seed: 1)
  shade(ctx, beam, GRAY, from: CGPoint(x: 0, y: 32), to: CGPoint(x: 0, y: 52), alpha: 0.38)
  hatch(ctx, beam, region: CGRect(x: 40, y: 44, width: 1140, height: 10), angle: -0.9, spacing: 5, alpha: 0.3, seed: 2)
  speckle(ctx, beam, WOOD, count: 120, alpha: 0.18, seed: 3)
  inkLine(ctx, beam, width: 2.2, seed: 4)

  // brass ferrule & collars (đầu bịt đồng, khâu móc, khâu đề)
  for (i, (x, w)) in [(36.0, 30.0), (72.0, 16.0), (192.0, 16.0)].enumerated() as EnumeratedSequence<[(CGFloat, CGFloat)]> {
    let band = CGPath(roundedRect: CGRect(x: x, y: 24, width: w, height: 32), cornerWidth: 4, cornerHeight: 4, transform: nil)
    wash(ctx, band, BRASS, alpha: 0.9, jitter: 0.6, seed: 10 + CGFloat(i))
    shade(ctx, band, BRASS_D, from: CGPoint(x: 0, y: 30), to: CGPoint(x: 0, y: 56), alpha: 0.7)
    hatch(ctx, band, region: CGRect(x: x, y: 44, width: w, height: 14), angle: 1.2, spacing: 3, alpha: 0.4, seed: CGFloat(i))
    inkLine(ctx, band, width: 1.8, seed: 20 + CGFloat(i), dry: 0.05)
  }

  // Sao: ink-ringed brass dots, one per phân, bigger each tiền, plum flower at 5 & 10 tiền.
  for i in 0...100 {
    let x = 260 + CGFloat(i) * 8.6
    let y: CGFloat = 40 - (x - 260) / 860 * 2.5 + 1
    let r: CGFloat = i % 10 == 0 ? 3.0 : (i % 5 == 0 ? 2.1 : 1.2)
    if i % 50 == 0 && i > 0 {
      for k in 0..<5 {
        let a = CGFloat(k) / 5 * .pi * 2
        ctx.setFillColor(col(BRASS, 0.9)); ctx.fillEllipse(in: CGRect(x: x + cos(a) * 5 - 2, y: y + sin(a) * 5 - 2, width: 4, height: 4))
      }
    }
    ctx.setFillColor(col(INK, 0.7)); ctx.fillEllipse(in: CGRect(x: x - r - 0.7, y: y - r - 0.5, width: r * 2 + 1.4, height: r * 2 + 1.4))
    ctx.setFillColor(col(BRASS, 0.95)); ctx.fillEllipse(in: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2))
  }
  savePNG(ctx, "steelyard-beam.png")
}

// MARK: - Đĩa cân 360×120
func paintPan() {
  let ctx = makeCtx(360, 120)
  let bowl = CGMutablePath()
  bowl.move(to: CGPoint(x: 14, y: 41))
  bowl.addQuadCurve(to: CGPoint(x: 346, y: 41), control: CGPoint(x: 180, y: 150))
  bowl.addQuadCurve(to: CGPoint(x: 14, y: 41), control: CGPoint(x: 180, y: 60))
  wash(ctx, bowl, BRASS, alpha: 0.75, jitter: 1.5, seed: 30)
  shade(ctx, bowl, BRASS_D, from: CGPoint(x: 100, y: 50), to: CGPoint(x: 300, y: 100), alpha: 0.75)
  hatch(ctx, bowl, region: CGRect(x: 200, y: 50, width: 150, height: 60), angle: 0.5, spacing: 4, alpha: 0.4, seed: 31)
  speckle(ctx, bowl, BRASS_D, count: 60, alpha: 0.3, seed: 32)
  inkLine(ctx, bowl, width: 2.4, seed: 33)
  let rim = ellipse(CGRect(x: 12, y: 23, width: 336, height: 36))
  wash(ctx, rim, BRASS, alpha: 0.55, jitter: 1, seed: 34)
  let inner = ellipse(CGRect(x: 30, y: 29, width: 300, height: 24))
  wash(ctx, inner, BRASS_D, alpha: 0.55, jitter: 1, seed: 35)
  shade(ctx, inner, INK, from: CGPoint(x: 0, y: 53), to: CGPoint(x: 0, y: 29), alpha: 0.35)
  inkLine(ctx, rim, width: 2.2, seed: 36)
  inkLine(ctx, inner, width: 1.2, seed: 37, dry: 0.25, alpha: 0.6)
  for x in [24.0, 180.0, 336.0] as [CGFloat] {
    ctx.setFillColor(col(INK, 0.9)); ctx.fillEllipse(in: CGRect(x: x - 3.5, y: 35, width: 7, height: 7))
  }
  savePNG(ctx, "steelyard-pan.png")
}

// MARK: - Quả cân 120×160
func paintWeight() {
  let ctx = makeCtx(120, 160)
  let knob = ellipse(CGRect(x: 48, y: 6, width: 24, height: 22))
  wash(ctx, knob, BRASS, alpha: 0.85, jitter: 0.6, seed: 40)
  shade(ctx, knob, BRASS_D, from: CGPoint(x: 50, y: 8), to: CGPoint(x: 70, y: 28), alpha: 0.7)
  inkLine(ctx, knob, width: 1.8, seed: 41, dry: 0.05)
  let body = CGMutablePath()
  body.move(to: CGPoint(x: 52, y: 26))
  body.addCurve(to: CGPoint(x: 34, y: 62), control1: CGPoint(x: 50, y: 42), control2: CGPoint(x: 34, y: 46))
  body.addCurve(to: CGPoint(x: 16, y: 120), control1: CGPoint(x: 16, y: 74), control2: CGPoint(x: 10, y: 100))
  body.addCurve(to: CGPoint(x: 104, y: 120), control1: CGPoint(x: 28, y: 156), control2: CGPoint(x: 92, y: 156))
  body.addCurve(to: CGPoint(x: 86, y: 62), control1: CGPoint(x: 110, y: 100), control2: CGPoint(x: 104, y: 74))
  body.addCurve(to: CGPoint(x: 68, y: 26), control1: CGPoint(x: 86, y: 46), control2: CGPoint(x: 70, y: 42))
  body.closeSubpath()
  wash(ctx, body, BRASS, alpha: 0.8, jitter: 1.2, seed: 42)
  shade(ctx, body, BRASS_D, from: CGPoint(x: 30, y: 70), to: CGPoint(x: 104, y: 140), alpha: 0.85)
  hatch(ctx, body, region: CGRect(x: 76, y: 70, width: 40, height: 80), angle: 1.1, spacing: 3.5, alpha: 0.35, seed: 43)
  // unpainted paper highlight left of centre
  let hi = CGMutablePath(); hi.move(to: CGPoint(x: 38, y: 80)); hi.addQuadCurve(to: CGPoint(x: 36, y: 118), control: CGPoint(x: 30, y: 100))
  ctx.addPath(hi); ctx.setStrokeColor(col((1, 0.97, 0.88), 0.55)); ctx.setLineWidth(5); ctx.strokePath()
  inkLine(ctx, body, width: 2.4, seed: 44)
  let band = CGMutablePath(); band.move(to: CGPoint(x: 26, y: 92)); band.addQuadCurve(to: CGPoint(x: 94, y: 92), control: CGPoint(x: 60, y: 102))
  inkLine(ctx, band, width: 1.3, seed: 45, dry: 0.3, alpha: 0.7)
  ctx.setFillColor(col((0.62, 0.15, 0.10), 0.85)); ctx.fillEllipse(in: CGRect(x: 55, y: 110, width: 9, height: 9)) // thợ đúc chu sa mark
  savePNG(ctx, "steelyard-weight.png")
}

// MARK: - Hộp cân hình đàn 1200×240
func paintCase(dragon: Bool) {
  let ctx = makeCtx(1200, 240)
  let shell = CGMutablePath()
  shell.move(to: CGPoint(x: 120, y: 30))
  shell.addCurve(to: CGPoint(x: 330, y: 70), control1: CGPoint(x: 230, y: 24), control2: CGPoint(x: 280, y: 56))
  shell.addLine(to: CGPoint(x: 1140, y: 98))
  shell.addQuadCurve(to: CGPoint(x: 1140, y: 146), control: CGPoint(x: 1176, y: 122))
  shell.addLine(to: CGPoint(x: 330, y: 170))
  shell.addCurve(to: CGPoint(x: 120, y: 210), control1: CGPoint(x: 280, y: 184), control2: CGPoint(x: 230, y: 216))
  shell.addCurve(to: CGPoint(x: 120, y: 30), control1: CGPoint(x: 10, y: 204), control2: CGPoint(x: 10, y: 36))
  shell.closeSubpath()

  // ink-wash cast shadow pooled under the case
  let shadow = ellipse(CGRect(x: 40, y: 190, width: 1120, height: 40))
  wash(ctx, shadow, GRAY, alpha: 0.12, layers: 2, jitter: 6, seed: 50)

  wash(ctx, shell, dragon ? WOOD_D : WOOD, alpha: 0.85, jitter: 2, seed: 51)
  shade(ctx, shell, WOOD_D, from: CGPoint(x: 0, y: 60), to: CGPoint(x: 0, y: 215), alpha: 0.7)
  hatch(ctx, shell, region: CGRect(x: 0, y: 150, width: 1200, height: 70), angle: -0.75, spacing: 5, alpha: 0.35, seed: 52)

  // wood grain: dry-brush ink strokes following the case
  var r = RNG(s: dragon ? 77 : 55)
  ctx.saveGState(); ctx.addPath(shell); ctx.clip()
  for k in 0..<30 {
    let y = 40 + r.next() * 160
    let g = CGMutablePath()
    g.move(to: CGPoint(x: 30 + r.next() * 200, y: y))
    g.addCurve(to: CGPoint(x: 1170, y: 120 + (y - 120) * 0.25),
               control1: CGPoint(x: 260, y: y + (r.next() - 0.5) * 30),
               control2: CGPoint(x: 600, y: 120 + (y - 120) * 0.4))
    inkLine(ctx, g, width: 0.8 + r.next() * 1.2, seed: 60 + CGFloat(k), dry: 0.45, alpha: 0.28)
  }
  ctx.restoreGState()
  inkLine(ctx, shell, width: 3, seed: 53)

  let seam = CGMutablePath(); seam.move(to: CGPoint(x: 40, y: 120)); seam.addLine(to: CGPoint(x: 1150, y: 122))
  inkLine(ctx, seam, width: 1.8, seed: 54, dry: 0.2)
  for (i, x) in [300.0, 720.0, 1080.0].enumerated() as EnumeratedSequence<[CGFloat]> {
    let clasp = CGPath(roundedRect: CGRect(x: x - 11, y: 109, width: 22, height: 26), cornerWidth: 5, cornerHeight: 5, transform: nil)
    wash(ctx, clasp, BRASS, alpha: 0.9, jitter: 0.6, seed: 70 + CGFloat(i))
    shade(ctx, clasp, BRASS_D, from: CGPoint(x: x, y: 110), to: CGPoint(x: x, y: 135), alpha: 0.6)
    inkLine(ctx, clasp, width: 1.6, seed: 80 + CGFloat(i), dry: 0.05)
  }

  if dragon {
    // Xà cừ dragon: pearly scales with ink rims, head whiskers, chasing a pearl.
    var p = RNG(s: 99)
    for i in 0..<70 {
      let t = CGFloat(i) / 70
      let x = 70 + t * 820
      let y = 120 + sin(t * .pi * 3.2) * 46 * (1 - t * 0.6)
      let rr = 9 * (1 - t * 0.55)
      let e = ellipse(CGRect(x: x - rr, y: y - rr * 0.8, width: rr * 2, height: rr * 1.6))
      ctx.addPath(e); ctx.setFillColor(col((PEARL.0 + p.next() * 0.08, PEARL.1, PEARL.2 + p.next() * 0.08), 0.85)); ctx.fillPath()
      ctx.addPath(e); ctx.setStrokeColor(col(INK, 0.5)); ctx.setLineWidth(0.8); ctx.strokePath()
    }
    for k in 0..<2 {
      let w = CGMutablePath(); w.move(to: CGPoint(x: 64, y: 116 + CGFloat(k) * 8))
      w.addCurve(to: CGPoint(x: 20 + CGFloat(k) * 6, y: 90 + CGFloat(k) * 50), control1: CGPoint(x: 40, y: 100), control2: CGPoint(x: 30, y: 130))
      inkLine(ctx, w, width: 1.4, seed: 90 + CGFloat(k), dry: 0.2, alpha: 0.7)
    }
    let pearl = ellipse(CGRect(x: 954, y: 97, width: 20, height: 20))
    ctx.addPath(pearl); ctx.setFillColor(col(PEARL, 0.95)); ctx.fillPath()
    inkLine(ctx, pearl, width: 1.2, seed: 95, dry: 0)
  } else {
    // a single xà cừ plum blossom (hoa mai) on the bowl
    for k in 0..<5 {
      let a = CGFloat(k) / 5 * .pi * 2
      let pet = ellipse(CGRect(x: 130 + cos(a) * 13 - 9, y: 120 + sin(a) * 13 - 9, width: 18, height: 18))
      ctx.addPath(pet); ctx.setFillColor(col(PEARL, 0.85)); ctx.fillPath()
      inkLine(ctx, pet, width: 1, seed: 100 + CGFloat(k), dry: 0.1, alpha: 0.6)
    }
    ctx.setFillColor(col(BRASS, 0.95)); ctx.fillEllipse(in: CGRect(x: 125, y: 115, width: 10, height: 10))
  }
  savePNG(ctx, dragon ? "scale-case-long.png" : "scale-case-go.png")
}

paintBeam()
paintPan()
paintWeight()
paintCase(dragon: false)
paintCase(dragon: true)
