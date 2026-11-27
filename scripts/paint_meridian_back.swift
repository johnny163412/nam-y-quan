import AppKit
import CoreGraphics
import Foundation

let root = "/Users/thiagop/nam-y-quan/public/art/meridians"
let frontPath = "\(root)/meridian-front.jpg"
let outPath = "\(root)/meridian-back.jpg"

func loadCG(_ path: String) -> CGImage {
  let img = NSImage(contentsOfFile: path)!
  var r = NSRect(origin: .zero, size: img.size)
  return img.cgImage(forProposedRect: &r, context: nil, hints: nil)!
}

func makeCtx(_ w: Int, _ h: Int) -> CGContext {
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

func saveJPEG(_ img: CGImage, to path: String, quality: CGFloat = 0.93) {
  let rep = NSBitmapImageRep(cgImage: img)
  let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality])!
  try! data.write(to: URL(fileURLWithPath: path))
  print("WROTE \(path) (\(img.width)x\(img.height), \(data.count) bytes)")
}

let src = loadCG(frontPath)
let W = src.width   // 500
let H = src.height  // 888

// Flip horizontally around symmetry axis centerX = 252 so 1:1 head/limb/trunk scale matches meridian-front.jpg pixel-for-pixel
let centerX: CGFloat = 252.0
let refCtx = makeCtx(W, H)
refCtx.setFillColor(CGColor(red: 246.0/255.0, green: 234.0/255.0, blue: 208.0/255.0, alpha: 1.0))
refCtx.fill(CGRect(x: 0, y: 0, width: W, height: H))
refCtx.saveGState()
refCtx.translateBy(x: centerX * 2.0, y: 0)
refCtx.scaleBy(x: -1.0, y: 1.0)
refCtx.draw(src, in: CGRect(x: 0, y: 0, width: W, height: H))
refCtx.restoreGState()

let refBuf = refCtx.data!.assumingMemoryBound(to: UInt8.self)
let total = W * H

// Sample true Dó parchment background color from top-left corner of meridian-front.jpg
let paperR = Int(refBuf[0])
let paperG = Int(refBuf[1])
let paperB = Int(refBuf[2])

@inline(__always)
func isPaperPixel(_ idx: Int) -> Bool {
  let o = idx * 4
  let r = Int(refBuf[o]), g = Int(refBuf[o + 1]), b = Int(refBuf[o + 2])
  let diff = abs(r - paperR) + abs(g - paperG) + abs(b - paperB)
  return diff <= 34
}

// Flood-fill connected exterior paper region cleanly
var isPaper = [Bool](repeating: false, count: total)
var visited = [Bool](repeating: false, count: total)
var queue = [Int]()
queue.reserveCapacity(120_000)

for x in 0..<W {
  for y in [0, H - 1] {
    let i = y * W + x
    if isPaperPixel(i) && !visited[i] { visited[i] = true; queue.append(i) }
  }
}
for y in 0..<H {
  for x in [0, W - 1] {
    let i = y * W + x
    if isPaperPixel(i) && !visited[i] { visited[i] = true; queue.append(i) }
  }
}

var qHead = 0
while qHead < queue.count {
  let idx = queue[qHead]; qHead += 1
  isPaper[idx] = true
  let x = idx % W
  let y = idx / W
  if x > 0 && !visited[idx - 1] { visited[idx - 1] = true; if isPaperPixel(idx - 1) { queue.append(idx - 1) } }
  if x < W - 1 && !visited[idx + 1] { visited[idx + 1] = true; if isPaperPixel(idx + 1) { queue.append(idx + 1) } }
  if y > 0 && !visited[idx - W] { visited[idx - W] = true; if isPaperPixel(idx - W) { queue.append(idx - W) } }
  if y < H - 1 && !visited[idx + W] { visited[idx + W] = true; if isPaperPixel(idx + W) { queue.append(idx + W) } }
}

// Ankle cut line above flared anterior toes (svgY = 408 -> py = 816, norm 0.919)
let yAnkleCut = 804

var bodyMask = makeCtx(W, H)
let maskPtr = bodyMask.data!.assumingMemoryBound(to: UInt8.self)
for i in 0..<total {
  let o = i * 4
  let y = i / W
  if !isPaper[i] && y < yAnkleCut {
    maskPtr[o] = 255; maskPtr[o + 1] = 255; maskPtr[o + 2] = 255; maskPtr[o + 3] = 255
  } else {
    maskPtr[o] = 0; maskPtr[o + 1] = 0; maskPtr[o + 2] = 0; maskPtr[o + 3] = 0
  }
}

// Keep crisp outer 3px sepia silhouette & preserve crisp hand/finger outlines
var nearEdge = [Bool](repeating: true, count: total)
for y in 4..<(yAnkleCut) {
  for x in 4..<(W - 4) {
    let idx = y * W + x
    if isPaper[idx] { continue }
    var hitPaper = false
    for dy in -3...3 where !hitPaper {
      for dx in -3...3 {
        if isPaper[(y + dy) * W + (x + dx)] { hitPaper = true; break }
      }
    }
    nearEdge[idx] = hitPaper
  }
}

let canvas = makeCtx(W, H)
canvas.draw(refCtx.makeImage()!, in: CGRect(x: 0, y: 0, width: W, height: H))
let buf = canvas.data!.assumingMemoryBound(to: UInt8.self)

// 1) Erase anterior flared toes below yAnkleCut seamlessly to local paper tone (zero border box!)
for y in yAnkleCut..<H {
  for x in 0..<W {
    let idx = y * W + x
    if !isPaper[idx] {
      let o = idx * 4
      let sampleO = (y * W + 12) * 4
      buf[o] = refBuf[sampleO]
      buf[o + 1] = refBuf[sampleO + 1]
      buf[o + 2] = refBuf[sampleO + 2]
      buf[o + 3] = 255
    }
  }
}

// 2) Repaint interior body base to warm harmonious skin watercolor, keeping palm/finger ink lines & outer ink silhouette
for y in 4..<yAnkleCut {
  for x in 4..<(W - 4) {
    let idx = y * W + x
    if isPaper[idx] || nearEdge[idx] { continue }
    let o = idx * 4
    let r = CGFloat(buf[o]), g = CGFloat(buf[o + 1]), b = CGFloat(buf[o + 2])
    let ny = CGFloat(y) / CGFloat(H)
    let nx = CGFloat(x) / CGFloat(W)
    // Preserve crisp outer finger separations cleanly without dark palm creases
    if ny >= 0.515 && ny <= 0.610 && (nx < 0.25 || nx > 0.76) {
      let lum = (r + g + b) / 3.0
      if lum < 118 {
        let keep = max(0.0, min(1.0, (118.0 - lum) / 55.0))
        buf[o] = UInt8(min(255, 224.0 * (1.0 - keep) + r * keep))
        buf[o + 1] = UInt8(min(255, 190.0 * (1.0 - keep) + g * keep))
        buf[o + 2] = UInt8(min(255, 150.0 * (1.0 - keep) + b * keep))
        continue
      }
    }
    buf[o] = 224
    buf[o + 1] = 191
    buf[o + 2] = 152
  }
}

let cs = CGColorSpaceCreateDeviceRGB()
func pt(_ nx: CGFloat, _ ny: CGFloat) -> CGPoint {
  CGPoint(x: nx * CGFloat(W), y: (1.0 - ny) * CGFloat(H))
}
func wash(_ cx: CGFloat, _ cy: CGFloat, _ rx: CGFloat, _ ry: CGFloat, _ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ alpha: CGFloat) {
  let grad = CGGradient(
    colorsSpace: cs,
    colors: [
      CGColor(red: r, green: g, blue: b, alpha: alpha),
      CGColor(red: r, green: g, blue: b, alpha: alpha * 0.52),
      CGColor(red: r, green: g, blue: b, alpha: 0.0)
    ] as CFArray,
    locations: [0.0, 0.55, 1.0]
  )!
  canvas.saveGState()
  let c = pt(cx, cy)
  canvas.translateBy(x: c.x, y: c.y)
  canvas.scaleBy(x: 1.0, y: (ry * CGFloat(H)) / max(1.0, rx * CGFloat(W)))
  canvas.drawRadialGradient(grad, startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: rx * CGFloat(W), options: [])
  canvas.restoreGState()
}

let cxNorm: CGFloat = centerX / CGFloat(W) // 0.504 exact match with meridian-front.jpg!
let silhouetteCG = bodyMask.makeImage()!
canvas.saveGState()
canvas.clip(to: CGRect(x: 0, y: 0, width: W, height: H), mask: silhouetteCG)

// --- A. HEAD POSTERIOR HAIR CROWN, NAPE HAIRLINE & EARS ---
// Cover entire posterior skull width from left temple to right temple seamlessly
let hairCap = CGMutablePath()
hairCap.move(to: pt(cxNorm - 0.11, 0.048))
hairCap.addLine(to: pt(cxNorm + 0.11, 0.048))
hairCap.addLine(to: pt(cxNorm + 0.095, 0.166))
hairCap.addCurve(to: pt(cxNorm, 0.184), control1: pt(cxNorm + 0.055, 0.182), control2: pt(cxNorm + 0.022, 0.178))
hairCap.addCurve(to: pt(cxNorm - 0.095, 0.166), control1: pt(cxNorm - 0.022, 0.178), control2: pt(cxNorm - 0.055, 0.182))
hairCap.closeSubpath()

canvas.saveGState()
canvas.addPath(hairCap)
canvas.clip()
canvas.setFillColor(CGColor(red: 0.16, green: 0.13, blue: 0.11, alpha: 0.96))
canvas.fill(CGRect(x: 0, y: 0, width: W, height: H))
wash(cxNorm - 0.008, 0.112, 0.056, 0.020, 0.36, 0.31, 0.27, 0.42)

canvas.setLineCap(.round)
for i in -14...14 {
  let fi = CGFloat(i)
  let xTop = cxNorm + fi * 0.0046
  let xBot = cxNorm + fi * 0.0056
  let yEnd = 0.180 - abs(fi) * 0.0010
  canvas.beginPath()
  canvas.move(to: pt(xTop, 0.080))
  canvas.addCurve(to: pt(xBot, yEnd), control1: pt(cxNorm + fi * 0.0068, 0.118), control2: pt(cxNorm + fi * 0.0062, 0.152))
  canvas.setStrokeColor(i % 2 == 0 ? CGColor(red: 0.08, green: 0.06, blue: 0.05, alpha: 0.72) : CGColor(red: 0.36, green: 0.31, blue: 0.26, alpha: 0.44))
  canvas.setLineWidth(1.3)
  canvas.strokePath()
}
canvas.restoreGState()

// M-shaped nape hairline & hair tie cord below bun
canvas.beginPath()
canvas.move(to: pt(cxNorm - 0.078, 0.165))
canvas.addCurve(to: pt(cxNorm, 0.184), control1: pt(cxNorm - 0.052, 0.182), control2: pt(cxNorm - 0.022, 0.178))
canvas.addCurve(to: pt(cxNorm + 0.078, 0.165), control1: pt(cxNorm + 0.022, 0.178), control2: pt(cxNorm + 0.052, 0.182))
canvas.setStrokeColor(CGColor(red: 0.14, green: 0.10, blue: 0.07, alpha: 0.90))
canvas.setLineWidth(1.8)
canvas.strokePath()

canvas.beginPath()
canvas.move(to: pt(cxNorm - 0.036, 0.085))
canvas.addCurve(to: pt(cxNorm + 0.036, 0.085), control1: pt(cxNorm - 0.015, 0.091), control2: pt(cxNorm + 0.015, 0.091))
canvas.setStrokeColor(CGColor(red: 0.10, green: 0.08, blue: 0.06, alpha: 0.92))
canvas.setLineWidth(2.2)
canvas.strokePath()

// Simple posterior ear rim shading (left/right edges of head at ny=0.145)
for dir in [-1.0, 1.0] as [CGFloat] {
  let ex = cxNorm + dir * 0.084
  wash(ex, 0.150, 0.014, 0.020, 0.72, 0.56, 0.40, 0.44)
  canvas.beginPath()
  canvas.move(to: pt(ex - dir * 0.004, 0.136))
  canvas.addCurve(to: pt(ex - dir * 0.003, 0.164), control1: pt(ex + dir * 0.008, 0.144), control2: pt(ex + dir * 0.007, 0.158))
  canvas.setStrokeColor(CGColor(red: 0.36, green: 0.24, blue: 0.15, alpha: 0.72))
  canvas.setLineWidth(1.3)
  canvas.strokePath()
}

// --- B. NAPE, TRAPEZIUS, SCAPULAE & DORSAL WATERCOLOR SHADING ---
wash(cxNorm - 0.026, 0.194, 0.018, 0.016, 0.72, 0.55, 0.39, 0.48)
wash(cxNorm + 0.026, 0.194, 0.018, 0.016, 0.72, 0.55, 0.39, 0.48)
wash(cxNorm, 0.219, 0.026, 0.015, 0.94, 0.84, 0.69, 0.68) // C7 prominence

// Shoulder traps + deltoids
wash(cxNorm - 0.095, 0.238, 0.048, 0.028, 0.92, 0.81, 0.64, 0.42)
wash(cxNorm + 0.095, 0.238, 0.048, 0.028, 0.92, 0.81, 0.64, 0.42)
wash(cxNorm - 0.165, 0.262, 0.036, 0.040, 0.70, 0.53, 0.37, 0.42)
wash(cxNorm + 0.165, 0.262, 0.036, 0.040, 0.70, 0.53, 0.37, 0.42)

// Scapulae & erector spinae + latissimus flank shadows
wash(cxNorm - 0.062, 0.285, 0.044, 0.046, 0.70, 0.53, 0.37, 0.42)
wash(cxNorm + 0.062, 0.285, 0.044, 0.046, 0.70, 0.53, 0.37, 0.42)
wash(cxNorm - 0.052, 0.272, 0.028, 0.030, 0.92, 0.82, 0.66, 0.50)
wash(cxNorm + 0.052, 0.272, 0.028, 0.030, 0.92, 0.82, 0.66, 0.50)

wash(cxNorm - 0.122, 0.358, 0.032, 0.096, 0.66, 0.49, 0.33, 0.44)
wash(cxNorm + 0.122, 0.358, 0.032, 0.096, 0.66, 0.49, 0.33, 0.44)
wash(cxNorm - 0.030, 0.365, 0.024, 0.100, 0.92, 0.81, 0.64, 0.42)
wash(cxNorm + 0.030, 0.365, 0.024, 0.100, 0.92, 0.81, 0.64, 0.42)
wash(cxNorm, 0.352, 0.012, 0.118, 0.62, 0.46, 0.31, 0.40) // Spinal furrow

// Spine line C7 -> L5 & scapula curves
canvas.beginPath()
canvas.move(to: pt(cxNorm, 0.218))
canvas.addCurve(to: pt(cxNorm, 0.456), control1: pt(cxNorm - 0.002, 0.31), control2: pt(cxNorm + 0.002, 0.39))
canvas.setStrokeColor(CGColor(red: 0.46, green: 0.31, blue: 0.19, alpha: 0.52))
canvas.setLineWidth(1.3)
canvas.strokePath()

for dir in [-1.0, 1.0] as [CGFloat] {
  canvas.beginPath()
  canvas.move(to: pt(cxNorm + dir * 0.084, 0.238))
  canvas.addCurve(to: pt(cxNorm + dir * 0.044, 0.322), control1: pt(cxNorm + dir * 0.050, 0.262), control2: pt(cxNorm + dir * 0.038, 0.296))
  canvas.setStrokeColor(CGColor(red: 0.40, green: 0.26, blue: 0.16, alpha: 0.55))
  canvas.setLineWidth(1.2)
  canvas.strokePath()
}

wash(cxNorm - 0.032, 0.450, 0.011, 0.011, 0.64, 0.48, 0.33, 0.34)
wash(cxNorm + 0.032, 0.450, 0.011, 0.011, 0.64, 0.48, 0.33, 0.34)

// --- C. POSTERIOR LOINCLOTH (Seamless olive cloth covering buttocks at ny=0.458..0.606) ---
let clothPath = CGMutablePath()
clothPath.move(to: pt(cxNorm - 0.18, 0.460))
clothPath.addCurve(to: pt(cxNorm + 0.18, 0.460), control1: pt(cxNorm - 0.06, 0.468), control2: pt(cxNorm + 0.06, 0.468))
clothPath.addLine(to: pt(cxNorm + 0.20, 0.585))
clothPath.addCurve(to: pt(cxNorm, 0.606), control1: pt(cxNorm + 0.12, 0.592), control2: pt(cxNorm + 0.04, 0.606))
clothPath.addCurve(to: pt(cxNorm - 0.20, 0.585), control1: pt(cxNorm - 0.04, 0.606), control2: pt(cxNorm - 0.12, 0.592))
clothPath.closeSubpath()

canvas.saveGState()
canvas.addPath(clothPath)
canvas.clip()
canvas.setFillColor(CGColor(red: 147.0 / 255.0, green: 138.0 / 255.0, blue: 100.0 / 255.0, alpha: 1.0))
canvas.fill(CGRect(x: 0, y: 0, width: W, height: H))
wash(cxNorm - 0.06, 0.534, 0.08, 0.046, 0.69, 0.64, 0.45, 0.55)
wash(cxNorm + 0.06, 0.534, 0.08, 0.046, 0.69, 0.64, 0.45, 0.55)
wash(cxNorm, 0.562, 0.024, 0.044, 0.34, 0.30, 0.21, 0.40)

for (yL, dip) in [(0.488, 0.008), (0.514, 0.011), (0.542, 0.015), (0.572, 0.018)] {
  canvas.beginPath()
  canvas.move(to: pt(cxNorm - 0.18, yL))
  canvas.addCurve(to: pt(cxNorm, yL + dip), control1: pt(cxNorm - 0.08, yL + dip * 0.4), control2: pt(cxNorm - 0.02, yL + dip * 0.9))
  canvas.addCurve(to: pt(cxNorm + 0.18, yL), control1: pt(cxNorm + 0.02, yL + dip * 0.9), control2: pt(cxNorm + 0.08, yL + dip * 0.4))
  canvas.setStrokeColor(CGColor(red: 0.25, green: 0.21, blue: 0.14, alpha: 0.46))
  canvas.setLineWidth(1.2)
  canvas.strokePath()
}
canvas.restoreGState()

canvas.beginPath()
canvas.move(to: pt(cxNorm - 0.18, 0.460))
canvas.addCurve(to: pt(cxNorm + 0.18, 0.460), control1: pt(cxNorm - 0.06, 0.468), control2: pt(cxNorm + 0.06, 0.468))
canvas.move(to: pt(cxNorm - 0.18, 0.575))
canvas.addCurve(to: pt(cxNorm, 0.606), control1: pt(cxNorm - 0.09, 0.594), control2: pt(cxNorm - 0.03, 0.606))
canvas.addCurve(to: pt(cxNorm + 0.18, 0.575), control1: pt(cxNorm + 0.03, 0.606), control2: pt(cxNorm + 0.09, 0.594))
canvas.setStrokeColor(CGColor(red: 0.16, green: 0.13, blue: 0.09, alpha: 0.85))
canvas.setLineWidth(1.7)
canvas.strokePath()

// --- D. POSTERIOR ARMS, ELBOWS & DORSAL HANDS ---
for (dir, elbowX) in [(-1.0, cxNorm - 0.242), (1.0, cxNorm + 0.242)] as [(CGFloat, CGFloat)] {
  wash(cxNorm + dir * 0.190, 0.335, 0.024, 0.065, 0.91, 0.80, 0.64, 0.45)
  wash(elbowX, 0.398, 0.015, 0.018, 0.72, 0.55, 0.38, 0.40)
  canvas.beginPath()
  canvas.move(to: pt(elbowX - 0.012, 0.402))
  canvas.addCurve(to: pt(elbowX + 0.012, 0.402), control1: pt(elbowX - 0.004, 0.406), control2: pt(elbowX + 0.004, 0.406))
  canvas.setStrokeColor(CGColor(red: 0.38, green: 0.25, blue: 0.16, alpha: 0.54))
  canvas.setLineWidth(1.2)
  canvas.strokePath()
}

// --- E. POSTERIOR THIGHS, POPLITEAL FOSSA (nv=0.716), CALVES & ACHILLES ---
for (side, legX) in [(-1.0, cxNorm - 0.094), (1.0, cxNorm + 0.094)] as [(CGFloat, CGFloat)] {
  wash(legX, 0.640, 0.032, 0.056, 0.92, 0.82, 0.66, 0.52)
  wash(legX + side * 0.016, 0.642, 0.020, 0.064, 0.69, 0.53, 0.37, 0.40)

  // Popliteal fossa back knee crease (exactly at ny = 0.716 -> svgY = 318 where Ủy Trung sits!)
  wash(legX, 0.716, 0.026, 0.016, 0.66, 0.49, 0.34, 0.52)
  canvas.beginPath()
  canvas.move(to: pt(legX - 0.032, 0.715))
  canvas.addCurve(to: pt(legX + 0.032, 0.715), control1: pt(legX - 0.012, 0.719), control2: pt(legX + 0.012, 0.719))
  canvas.setStrokeColor(CGColor(red: 0.32, green: 0.21, blue: 0.13, alpha: 0.75))
  canvas.setLineWidth(1.4)
  canvas.strokePath()

  // Twin gastrocnemius calf bellies + Achilles tendon groove
  wash(legX - 0.016, 0.790, 0.020, 0.036, 0.92, 0.82, 0.66, 0.52)
  wash(legX + 0.016, 0.790, 0.020, 0.036, 0.92, 0.82, 0.66, 0.52)
  wash(legX, 0.862, 0.012, 0.044, 0.69, 0.53, 0.37, 0.38)

  canvas.beginPath()
  canvas.move(to: pt(legX - 0.028, 0.800))
  canvas.addCurve(to: pt(legX, 0.816), control1: pt(legX - 0.015, 0.814), control2: pt(legX - 0.005, 0.816))
  canvas.addCurve(to: pt(legX + 0.028, 0.800), control1: pt(legX + 0.005, 0.816), control2: pt(legX + 0.015, 0.814))
  canvas.setStrokeColor(CGColor(red: 0.36, green: 0.24, blue: 0.15, alpha: 0.65))
  canvas.setLineWidth(1.4)
  canvas.strokePath()

  canvas.beginPath()
  canvas.move(to: pt(legX - 0.006, 0.824))
  canvas.addLine(to: pt(legX - 0.006, 0.905))
  canvas.move(to: pt(legX + 0.006, 0.824))
  canvas.addLine(to: pt(legX + 0.006, 0.905))
  canvas.setStrokeColor(CGColor(red: 0.44, green: 0.30, blue: 0.19, alpha: 0.44))
  canvas.setLineWidth(1.1)
  canvas.strokePath()
}

canvas.restoreGState()

// --- F. SEAMLESSLY CONNECTED ANKLES -> ROUNDED POSTERIOR HEELS MATCHING FRONT GROUND HEIGHT (botY = 0.978 -> svgY = 434) ---
for side in [-1.0, 1.0] as [CGFloat] {
  let scanY = yAnkleCut - 2
  let xStart = side < 0 ? 120 : 252
  let xEnd = side < 0 ? 252 : 390
  var minLegPx = xEnd
  var maxLegPx = xStart
  for x in xStart..<xEnd {
    if !isPaper[scanY * W + x] {
      if x < minLegPx { minLegPx = x }
      if x > maxLegPx { maxLegPx = x }
    }
  }
  let nLeft = CGFloat(minLegPx + 2) / CGFloat(W)
  let nRight = CGFloat(maxLegPx - 2) / CGFloat(W)
  let legX = (nLeft + nRight) * 0.5
  let topY: CGFloat = CGFloat(yAnkleCut - 14) / CGFloat(H) // Blend softly higher up the Achilles taper!
  let halfAnkle = (nRight - nLeft) * 0.5
  let heelW: CGFloat = max(halfAnkle * 1.05, 0.026)
  let botY: CGFloat = 0.978 // Matches front feet at py ~ 868 (svgY = 434)!

  wash(legX, botY + 0.004, heelW * 1.2, 0.008, 0.42, 0.34, 0.24, 0.25)

  let foot = CGMutablePath()
  foot.move(to: pt(nLeft, topY))
  foot.addCurve(to: pt(legX - heelW, botY - 0.012), control1: pt(nLeft - 0.002, topY + 0.036), control2: pt(legX - heelW * 1.02, botY - 0.028))
  foot.addCurve(to: pt(legX, botY), control1: pt(legX - heelW * 0.80, botY), control2: pt(legX - heelW * 0.35, botY))
  foot.addCurve(to: pt(legX + heelW, botY - 0.012), control1: pt(legX + heelW * 0.35, botY), control2: pt(legX + heelW * 0.80, botY))
  foot.addCurve(to: pt(nRight, topY), control1: pt(legX + heelW * 1.02, botY - 0.028), control2: pt(nRight + 0.002, topY + 0.036))
  foot.closeSubpath()

  canvas.saveGState()
  canvas.addPath(foot)
  canvas.clip()
  canvas.setFillColor(CGColor(red: 224.0 / 255.0, green: 191.0 / 255.0, blue: 152.0 / 255.0, alpha: 1.0))
  canvas.fill(CGRect(x: 0, y: 0, width: W, height: H))
  // Erase flat interior horizontal edge by painting full vertical Achilles contour highlights & side shadows
  wash(legX, topY + 0.026, 0.012, 0.038, 0.92, 0.82, 0.66, 0.56)
  wash(legX - 0.018, topY + 0.020, 0.014, 0.035, 0.68, 0.52, 0.36, 0.34)
  wash(legX + 0.018, topY + 0.020, 0.014, 0.035, 0.68, 0.52, 0.36, 0.34)
  wash(legX, botY - 0.005, heelW * 0.88, 0.012, 0.66, 0.49, 0.34, 0.48)
  canvas.restoreGState()

  // Stroke outer silhouette down to rounded heel without stroking across topY!
  canvas.beginPath()
  canvas.move(to: pt(nLeft, topY + 0.012))
  canvas.addCurve(to: pt(legX - heelW, botY - 0.012), control1: pt(nLeft - 0.002, topY + 0.038), control2: pt(legX - heelW * 1.02, botY - 0.028))
  canvas.addCurve(to: pt(legX, botY), control1: pt(legX - heelW * 0.80, botY), control2: pt(legX - heelW * 0.35, botY))
  canvas.addCurve(to: pt(legX + heelW, botY - 0.012), control1: pt(legX + heelW * 0.35, botY), control2: pt(legX + heelW * 0.80, botY))
  canvas.addCurve(to: pt(nRight, topY + 0.012), control1: pt(legX + heelW * 1.02, botY - 0.028), control2: pt(nRight + 0.002, topY + 0.038))
  canvas.setStrokeColor(CGColor(red: 0.19, green: 0.13, blue: 0.09, alpha: 0.88))
  canvas.setLineWidth(1.6)
  canvas.strokePath()
}

saveJPEG(canvas.makeImage()!, to: outPath)
