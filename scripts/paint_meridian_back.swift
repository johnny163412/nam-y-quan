import AppKit
import CoreImage
import Foundation

let brain = "/Users/thiagop/.gemini/antigravity/brain/90213e4b-c384-4bc9-b2b5-4be77a632f54"
let root = "/Users/thiagop/.gemini/antigravity/scratch/nam-y-quan/public/art"
let frontPath = "\(brain)/meridian_front_1795696951049.jpg"
let outPath = "\(root)/meridians/meridian-back.jpg"

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

func saveJPEG(_ img: CGImage, to path: String, quality: CGFloat = 0.92) {
  let rep = NSBitmapImageRep(cgImage: img)
  let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality])!
  try! data.write(to: URL(fileURLWithPath: path))
  print("WROTE \(path) (\(img.width)x\(img.height), \(data.count) bytes)")
}

let src = loadCG(frontPath)
let W = src.width   // 768
let H = src.height  // 1376

// Mirror front reference horizontally so body geometry, paper texture & limb spacing match 1:1
let refCtx = makeCtx(W, H)
refCtx.saveGState()
refCtx.translateBy(x: CGFloat(W), y: 0)
refCtx.scaleBy(x: -1, y: 1)
refCtx.draw(src, in: CGRect(x: 0, y: 0, width: W, height: H))
refCtx.restoreGState()
let refBuf = refCtx.data!.assumingMemoryBound(to: UInt8.self)

// Flood-fill surrounding paper outside figure
let total = W * H
var isPaper = [Bool](repeating: false, count: total)
var visited = [Bool](repeating: false, count: total)
var queue = [Int]()
queue.reserveCapacity(total / 2)

@inline(__always)
func isPaperPixel(_ idx: Int) -> Bool {
  let o = idx * 4
  let r = Int(refBuf[o])
  let g = Int(refBuf[o + 1])
  let b = Int(refBuf[o + 2])
  return (r + g + b) >= 654 && r >= 220 && g >= 210
}

for x in 46..<(W - 46) {
  for y in [40, H - 40] {
    let idx = y * W + x
    if !visited[idx] && isPaperPixel(idx) {
      visited[idx] = true
      queue.append(idx)
    }
  }
}
for y in 40..<(H - 40) {
  for x in [48, W - 48] {
    let idx = y * W + x
    if !visited[idx] && isPaperPixel(idx) {
      visited[idx] = true
      queue.append(idx)
    }
  }
}

var head = 0
while head < queue.count {
  let idx = queue[head]
  head += 1
  isPaper[idx] = true
  let x = idx % W
  let y = idx / W
  if x > 44 && !visited[idx - 1] {
    visited[idx - 1] = true
    if isPaperPixel(idx - 1) { queue.append(idx - 1) }
  }
  if x < W - 45 && !visited[idx + 1] {
    visited[idx + 1] = true
    if isPaperPixel(idx + 1) { queue.append(idx + 1) }
  }
  if y > 35 && !visited[idx - W] {
    visited[idx - W] = true
    if isPaperPixel(idx - W) { queue.append(idx - W) }
  }
  if y < H - 36 && !visited[idx + W] {
    visited[idx + W] = true
    if isPaperPixel(idx + W) { queue.append(idx + W) }
  }
}
for y in 0..<H {
  for x in 0..<W {
    if y < 40 || y >= H - 40 || x < 48 || x >= W - 48 {
      isPaper[y * W + x] = true
    }
  }
}

// Ankle cut line at yAnkleCut = 1166 (norm 0.847) above foot flare so ankles & heels taper continuously!
let yAnkleCut = Int(Double(H) * 0.847)

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

// Distance from exterior paper contour (preserving crisp outer 3px ink outline + preserving finger outlines on hands!)
var nearEdge = [Bool](repeating: true, count: total)
for y in 6..<(yAnkleCut - 4) {
  for x in 6..<(W - 6) {
    let idx = y * W + x
    if isPaper[idx] { continue }
    var hitPaper = false
    for dy in -3...3 where !hitPaper {
      for dx in -3...3 {
        let ny = y + dy
        let nx = x + dx
        if isPaper[ny * W + nx] {
          hitPaper = true
          break
        }
      }
    }
    nearEdge[idx] = hitPaper
  }
}

// Working canvas initialized from mirrored reference (preserves genuine paper texture + crisp outer silhouette & hand lines)
let canvas = makeCtx(W, H)
canvas.draw(refCtx.makeImage()!, in: CGRect(x: 0, y: 0, width: W, height: H))
let buf = canvas.data!.assumingMemoryBound(to: UInt8.self)

// 1) Erase anterior splayed feet & toes below yAnkleCut smoothly to inner parchment tone
for y in yAnkleCut..<(H - 44) {
  for x in 48..<(W - 48) {
    let idx = y * W + x
    if !isPaper[idx] {
      let o = idx * 4
      // Sample nearby horizontal background tone so parchment texture stays unified
      let sampleO = (y * W + 64) * 4
      buf[o] = refBuf[sampleO]
      buf[o + 1] = refBuf[sampleO + 1]
      buf[o + 2] = refBuf[sampleO + 2]
      buf[o + 3] = 255
    }
  }
}

// 2) Repaint interior pixels cleanly while keeping fine finger separations & outer sepia contour ink!
for y in 42..<yAnkleCut {
  for x in 48..<(W - 48) {
    let idx = y * W + x
    if isPaper[idx] || nearEdge[idx] { continue }
    let o = idx * 4
    let fy = CGFloat(y) / CGFloat(H)
    let fx = CGFloat(x) / CGFloat(W)

    // Preserve ONLY individual inter-finger separation ink lines (fy >= 0.525, distal fingers) while painting smooth dorsal palm/wrist skin
    let inFingersZone = fy >= 0.528 && fy <= 0.585 && (fx < 0.25 || fx > 0.75)
    if inFingersZone {
      let lum = (Int(buf[o]) + Int(buf[o + 1]) + Int(buf[o + 2])) / 3
      if lum < 115 { continue }
    }

    // Posterior Skull Hair Dome: covers 100% behind temple/cranial edge right down to ear helices & M-shaped nape hairline
    let isOuterEar = (fx < 0.424 || fx > 0.576) && fy >= 0.142 && fy <= 0.194
    let hairlineLimit = 0.195 - pow(abs(fx - 0.50) / 0.085, 2.0) * 0.018
    if fy < hairlineLimit && !isOuterEar {
      buf[o] = 50; buf[o + 1] = 42; buf[o + 2] = 36; buf[o + 3] = 255
      continue
    }

    // Posterior Loincloth Wrap Shape (curved organic gluteal lower hem higher at midline fold & thighs)
    let hipCurveBottom: CGFloat = 0.538 + (1.0 - abs(fx - 0.50) / 0.16) * 0.032
    let inLoincloth = fy >= 0.456 && fy <= min(0.570, hipCurveBottom) && fx >= 0.345 && fx <= 0.655
    if inLoincloth {
      buf[o] = 166; buf[o + 1] = 152; buf[o + 2] = 110; buf[o + 3] = 255
    } else {
      // Base warm watercolor skin matching meridian-front lighting
      buf[o] = 224; buf[o + 1] = 191; buf[o + 2] = 149; buf[o + 3] = 255
    }
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
      CGColor(red: r, green: g, blue: b, alpha: 0.0),
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

let silhouetteCG = bodyMask.makeImage()!
canvas.saveGState()
canvas.clip(to: CGRect(x: 0, y: 0, width: W, height: H), mask: silhouetteCG)

// --- A. HEAD HAIR CROWN, NAPE HAIRLINE & POSTERIOR EARS ---
wash(0.500, 0.132, 0.068, 0.056, 0.17, 0.14, 0.12, 0.85)
wash(0.500, 0.072, 0.032, 0.020, 0.15, 0.13, 0.11, 0.92)
// Subtle highlight sheen across occipital hair
wash(0.492, 0.122, 0.045, 0.016, 0.38, 0.33, 0.29, 0.32)

// Organic hair brush strands converging softly toward nape (within hair zone only!)
canvas.setLineCap(.round)
for i in -9...9 {
  let fi = CGFloat(i)
  let xTop = 0.50 + fi * 0.0040
  let xBot = 0.50 + fi * 0.0056
  let yEnd = 0.186 - abs(fi) * 0.0012
  canvas.beginPath()
  canvas.move(to: pt(xTop, 0.088))
  canvas.addCurve(to: pt(xBot, yEnd), control1: pt(0.50 + fi * 0.0072, 0.126), control2: pt(0.50 + fi * 0.0064, 0.160))
  canvas.setStrokeColor(i % 2 == 0 ? CGColor(red: 0.09, green: 0.07, blue: 0.06, alpha: 0.65) : CGColor(red: 0.36, green: 0.31, blue: 0.26, alpha: 0.42))
  canvas.setLineWidth(1.4)
  canvas.strokePath()
}

// Nape hairline ink edge & Phong Tri suboccipital hollows below skull base
canvas.beginPath()
canvas.move(to: pt(0.440, 0.178))
canvas.addCurve(to: pt(0.500, 0.193), control1: pt(0.456, 0.190), control2: pt(0.482, 0.188))
canvas.addCurve(to: pt(0.560, 0.178), control1: pt(0.518, 0.188), control2: pt(0.544, 0.190))
canvas.setStrokeColor(CGColor(red: 0.16, green: 0.12, blue: 0.09, alpha: 0.85))
canvas.setLineWidth(2.0)
canvas.strokePath()

// Hair bun band
canvas.beginPath()
canvas.move(to: pt(0.474, 0.086))
canvas.addCurve(to: pt(0.526, 0.086), control1: pt(0.490, 0.091), control2: pt(0.510, 0.091))
canvas.setStrokeColor(CGColor(red: 0.11, green: 0.08, blue: 0.06, alpha: 0.9))
canvas.setLineWidth(2.4)
canvas.strokePath()

// Posterior ear shading (simple helix fold from behind, zero ear canal)
for (ex, dir) in [(0.425, -1.0), (0.575, 1.0)] as [(CGFloat, CGFloat)] {
  wash(ex, 0.164, 0.012, 0.018, 0.72, 0.56, 0.40, 0.45)
  canvas.beginPath()
  canvas.move(to: pt(ex - dir * 0.003, 0.150))
  canvas.addCurve(to: pt(ex - dir * 0.002, 0.178), control1: pt(ex + dir * 0.007, 0.158), control2: pt(ex + dir * 0.006, 0.172))
  canvas.setStrokeColor(CGColor(red: 0.38, green: 0.25, blue: 0.16, alpha: 0.68))
  canvas.setLineWidth(1.4)
  canvas.strokePath()
}

// --- B. NAPE, TRAPEZIUS, SCAPULAE & RICH DORSAL WATERCOLOR ANATOMY ---
// Two vertical nuchal muscles & Phong Tri hollows (only neck, NOT touching skull!)
wash(0.476, 0.200, 0.016, 0.014, 0.72, 0.55, 0.39, 0.48)
wash(0.524, 0.200, 0.016, 0.014, 0.72, 0.55, 0.39, 0.48)
wash(0.500, 0.222, 0.022, 0.014, 0.94, 0.84, 0.69, 0.68) // C7 Dai Chuy prominence

// Trapezius & posterior deltoid depth
wash(0.415, 0.242, 0.042, 0.026, 0.92, 0.81, 0.64, 0.44)
wash(0.585, 0.242, 0.042, 0.026, 0.92, 0.81, 0.64, 0.44)
wash(0.360, 0.262, 0.032, 0.036, 0.70, 0.53, 0.37, 0.42)
wash(0.640, 0.262, 0.032, 0.036, 0.70, 0.53, 0.37, 0.42)

// Scapular muscle shadows & infraspinatus highlights + latissimus dorsi waist taper
wash(0.448, 0.280, 0.038, 0.042, 0.70, 0.53, 0.37, 0.44)
wash(0.552, 0.280, 0.038, 0.042, 0.70, 0.53, 0.37, 0.44)
wash(0.456, 0.268, 0.024, 0.028, 0.92, 0.82, 0.66, 0.50)
wash(0.544, 0.268, 0.024, 0.028, 0.92, 0.82, 0.66, 0.50)

wash(0.396, 0.345, 0.028, 0.095, 0.66, 0.49, 0.33, 0.46) // Left lat & flank shadow
wash(0.604, 0.345, 0.028, 0.095, 0.66, 0.49, 0.33, 0.46) // Right lat & flank shadow
wash(0.474, 0.355, 0.020, 0.095, 0.92, 0.81, 0.64, 0.44) // Erector spinae highlight L
wash(0.526, 0.355, 0.020, 0.095, 0.92, 0.81, 0.64, 0.44) // Erector spinae highlight R
wash(0.500, 0.345, 0.011, 0.110, 0.62, 0.46, 0.31, 0.42) // Central vertebral groove

// Subtle C7–L5 anatomical ink linework starting BELOW nape at shoulder base (y = 0.236)
canvas.beginPath()
canvas.move(to: pt(0.500, 0.236))
canvas.addCurve(to: pt(0.500, 0.452), control1: pt(0.498, 0.308), control2: pt(0.502, 0.382))
canvas.setStrokeColor(CGColor(red: 0.38, green: 0.25, blue: 0.15, alpha: 0.58))
canvas.setLineWidth(1.7)
canvas.strokePath()

for dir in [-1.0, 1.0] as [CGFloat] {
  // Scapular spine & inner scapula angle
  canvas.beginPath()
  canvas.move(to: pt(0.50 + dir * 0.125, 0.238))
  canvas.addCurve(to: pt(0.50 + dir * 0.044, 0.280), control1: pt(0.50 + dir * 0.086, 0.244), control2: pt(0.50 + dir * 0.056, 0.258))
  canvas.addCurve(to: pt(0.50 + dir * 0.068, 0.318), control1: pt(0.50 + dir * 0.042, 0.300), control2: pt(0.50 + dir * 0.056, 0.314))
  canvas.setStrokeColor(CGColor(red: 0.38, green: 0.25, blue: 0.15, alpha: 0.54))
  canvas.setLineWidth(1.6)
  canvas.strokePath()
}

// Sacral lumbar dimples
wash(0.468, 0.442, 0.009, 0.007, 0.62, 0.46, 0.31, 0.48)
wash(0.532, 0.442, 0.009, 0.007, 0.62, 0.46, 0.31, 0.48)

// --- C. POSTERIOR LOINCLOTH WITH CURVED GLUTEAL HEM ---
wash(0.500, 0.525, 0.120, 0.058, 0.50, 0.45, 0.30, 0.42)
wash(0.442, 0.506, 0.048, 0.032, 0.72, 0.66, 0.48, 0.48)
wash(0.558, 0.506, 0.048, 0.032, 0.72, 0.66, 0.48, 0.48)

// Waistband belt
canvas.beginPath()
canvas.move(to: pt(0.365, 0.462))
canvas.addCurve(to: pt(0.635, 0.462), control1: pt(0.445, 0.475), control2: pt(0.555, 0.475))
canvas.setStrokeColor(CGColor(red: 0.23, green: 0.18, blue: 0.11, alpha: 0.85))
canvas.setLineWidth(2.2)
canvas.strokePath()

canvas.beginPath()
canvas.move(to: pt(0.360, 0.486))
canvas.addCurve(to: pt(0.640, 0.486), control1: pt(0.445, 0.499), control2: pt(0.555, 0.499))
canvas.setStrokeColor(CGColor(red: 0.26, green: 0.21, blue: 0.14, alpha: 0.68))
canvas.setLineWidth(1.6)
canvas.strokePath()

// Curved bottom edge of rear loincloth matching natural gluteal silhouette
canvas.beginPath()
canvas.move(to: pt(0.348, 0.538))
canvas.addCurve(to: pt(0.500, 0.570), control1: pt(0.390, 0.548), control2: pt(0.465, 0.568))
canvas.addCurve(to: pt(0.652, 0.538), control1: pt(0.535, 0.568), control2: pt(0.610, 0.548))
canvas.setStrokeColor(CGColor(red: 0.23, green: 0.18, blue: 0.11, alpha: 0.85))
canvas.setLineWidth(2.1)
canvas.strokePath()

for foldY in [0.512, 0.536] as [CGFloat] {
  for dir in [-1.0, 1.0] as [CGFloat] {
    canvas.beginPath()
    canvas.move(to: pt(0.50 + dir * 0.138, foldY - 0.010))
    canvas.addCurve(to: pt(0.50, foldY + 0.014), control1: pt(0.50 + dir * 0.082, foldY + 0.002), control2: pt(0.50 + dir * 0.032, foldY + 0.012))
    canvas.setStrokeColor(CGColor(red: 0.28, green: 0.23, blue: 0.16, alpha: 0.55))
    canvas.setLineWidth(1.4)
    canvas.strokePath()
  }
}

// --- D. POSTERIOR ARMS, ELBOWS & BACKS OF HANDS ---
for (dir, armTopX, elbowX, handX) in [(-1.0, 0.325, 0.274, 0.185), (1.0, 0.675, 0.726, 0.815)] as [(CGFloat, CGFloat, CGFloat, CGFloat)] {
  wash(armTopX + dir * 0.010, 0.335, 0.022, 0.055, 0.68, 0.52, 0.36, 0.38)
  wash(elbowX, 0.386, 0.015, 0.015, 0.92, 0.82, 0.66, 0.52)
  // Olecranon U-crease at elbow back
  canvas.beginPath()
  canvas.move(to: pt(elbowX - 0.012, 0.384))
  canvas.addCurve(to: pt(elbowX + 0.012, 0.384), control1: pt(elbowX - 0.004, 0.391), control2: pt(elbowX + 0.004, 0.391))
  canvas.setStrokeColor(CGColor(red: 0.36, green: 0.24, blue: 0.15, alpha: 0.62))
  canvas.setLineWidth(1.5)
  canvas.strokePath()

  // Forearm taper & dorsal metacarpal shading
  wash(elbowX + dir * 0.038, 0.440, 0.018, 0.045, 0.69, 0.53, 0.37, 0.32)
  wash(handX, 0.525, 0.028, 0.030, 0.78, 0.62, 0.46, 0.24)
  for k in -1...1 {
    let off = CGFloat(k) * 0.008
    canvas.beginPath()
    canvas.move(to: pt(handX - dir * 0.008 + off, 0.506))
    canvas.addLine(to: pt(handX + dir * 0.012 + off, 0.534))
    canvas.setStrokeColor(CGColor(red: 0.42, green: 0.29, blue: 0.18, alpha: 0.45))
    canvas.setLineWidth(1.2)
    canvas.strokePath()
  }
}

// --- E. HAMSTRINGS, POPLITEAL KNEE FOSSA (Hõm Khoeo) & CALVES ---
for side in [-1.0, 1.0] as [CGFloat] {
  let legX = 0.50 + side * 0.095
  wash(legX + side * 0.018, 0.630, 0.024, 0.068, 0.68, 0.52, 0.36, 0.42)
  wash(legX - side * 0.016, 0.630, 0.022, 0.064, 0.68, 0.52, 0.36, 0.36)
  wash(legX, 0.622, 0.022, 0.056, 0.91, 0.80, 0.64, 0.48)

  // Popliteal crease behind knees
  wash(legX, 0.712, 0.026, 0.016, 0.72, 0.56, 0.40, 0.40)
  canvas.beginPath()
  canvas.move(to: pt(legX - 0.026, 0.710))
  canvas.addCurve(to: pt(legX + 0.026, 0.710), control1: pt(legX - 0.009, 0.715), control2: pt(legX + 0.009, 0.715))
  canvas.setStrokeColor(CGColor(red: 0.36, green: 0.24, blue: 0.15, alpha: 0.68))
  canvas.setLineWidth(1.7)
  canvas.strokePath()

  // Distinct twin gastrocnemius calf bellies + Achilles furrow
  wash(legX - 0.015, 0.764, 0.017, 0.032, 0.92, 0.82, 0.66, 0.52)
  wash(legX + 0.015, 0.764, 0.017, 0.032, 0.92, 0.82, 0.66, 0.52)
  wash(legX - side * 0.026, 0.775, 0.012, 0.044, 0.67, 0.50, 0.34, 0.38)
  wash(legX + side * 0.026, 0.775, 0.012, 0.044, 0.67, 0.50, 0.34, 0.42)
  wash(legX, 0.818, 0.010, 0.044, 0.69, 0.53, 0.37, 0.38)

  canvas.beginPath()
  canvas.move(to: pt(legX - 0.025, 0.772))
  canvas.addCurve(to: pt(legX, 0.786), control1: pt(legX - 0.014, 0.784), control2: pt(legX - 0.004, 0.786))
  canvas.addCurve(to: pt(legX + 0.025, 0.772), control1: pt(legX + 0.004, 0.786), control2: pt(legX + 0.014, 0.784))
  canvas.setStrokeColor(CGColor(red: 0.36, green: 0.24, blue: 0.15, alpha: 0.65))
  canvas.setLineWidth(1.7)
  canvas.strokePath()

  canvas.beginPath()
  canvas.move(to: pt(legX - 0.005, 0.794))
  canvas.addLine(to: pt(legX - 0.005, 0.847))
  canvas.move(to: pt(legX + 0.005, 0.794))
  canvas.addLine(to: pt(legX + 0.005, 0.847))
  canvas.setStrokeColor(CGColor(red: 0.44, green: 0.30, blue: 0.19, alpha: 0.44))
  canvas.setLineWidth(1.3)
  canvas.strokePath()
}

canvas.restoreGState()

// --- F. SEAMLESSLY CONNECTED TAPERED ANKLES -> ROUNDED POSTERIOR HEELS (Measured exact calf cut width!) ---
for side in [-1.0, 1.0] as [CGFloat] {
  // Dynamically measure exact left/right boundary of the leg at row (yAnkleCut - 2) for zero-step connection
  let scanY = yAnkleCut - 2
  let xStart = side < 0 ? W / 4 : W / 2
  let xEnd = side < 0 ? W / 2 : (W * 3) / 4
  var minLegPx = xEnd
  var maxLegPx = xStart
  for x in xStart..<xEnd {
    if !isPaper[scanY * W + x] {
      if x < minLegPx { minLegPx = x }
      if x > maxLegPx { maxLegPx = x }
    }
  }
  let nLeft = CGFloat(minLegPx) / CGFloat(W)
  let nRight = CGFloat(maxLegPx) / CGFloat(W)
  let legX = (nLeft + nRight) * 0.5
  let topY: CGFloat = 0.844
  let heelW: CGFloat = 0.031
  let botY: CGFloat = 0.922

  // Cast soft ground contact shadow
  wash(legX, botY + 0.003, heelW * 1.15, 0.008, 0.42, 0.34, 0.24, 0.26)

  let foot = CGMutablePath()
  foot.move(to: pt(nLeft, topY - 0.004))
  foot.addCurve(to: pt(legX - heelW, botY - 0.012), control1: pt(nLeft + 0.002, topY + 0.028), control2: pt(legX - heelW * 1.02, botY - 0.026))
  foot.addCurve(to: pt(legX, botY), control1: pt(legX - heelW * 0.82, botY), control2: pt(legX - heelW * 0.38, botY))
  foot.addCurve(to: pt(legX + heelW, botY - 0.012), control1: pt(legX + heelW * 0.38, botY), control2: pt(legX + heelW * 0.82, botY))
  foot.addCurve(to: pt(nRight, topY - 0.004), control1: pt(legX + heelW * 1.02, botY - 0.026), control2: pt(nRight - 0.002, topY + 0.028))
  foot.closeSubpath()

  canvas.saveGState()
  canvas.addPath(foot)
  canvas.clip()
  canvas.setFillColor(CGColor(red: 224.0 / 255.0, green: 191.0 / 255.0, blue: 149.0 / 255.0, alpha: 1.0))
  canvas.fill(CGRect(x: 0, y: 0, width: W, height: H))
  // Match Achilles groove shading at topY smoothly so no horizontal break line exists
  wash(legX - side * 0.016, topY + 0.010, 0.012, 0.025, 0.68, 0.52, 0.36, 0.34)
  wash(legX + side * 0.016, topY + 0.010, 0.012, 0.025, 0.68, 0.52, 0.36, 0.34)
  wash(legX, botY - 0.004, heelW * 0.85, 0.010, 0.66, 0.49, 0.34, 0.48)
  wash(legX, topY + 0.026, 0.010, 0.028, 0.92, 0.82, 0.66, 0.52)
  wash(legX - side * 0.018, topY + 0.042, 0.007, 0.007, 0.92, 0.81, 0.64, 0.55)
  wash(legX + side * 0.018, topY + 0.044, 0.007, 0.007, 0.92, 0.81, 0.64, 0.55)
  canvas.restoreGState()

  canvas.beginPath()
  canvas.move(to: pt(nLeft, topY - 0.004))
  canvas.addCurve(to: pt(legX - heelW, botY - 0.012), control1: pt(nLeft + 0.002, topY + 0.028), control2: pt(legX - heelW * 1.02, botY - 0.026))
  canvas.addCurve(to: pt(legX, botY), control1: pt(legX - heelW * 0.82, botY), control2: pt(legX - heelW * 0.38, botY))
  canvas.addCurve(to: pt(legX + heelW, botY - 0.012), control1: pt(legX + heelW * 0.38, botY), control2: pt(legX + heelW * 0.82, botY))
  canvas.addCurve(to: pt(nRight, topY - 0.004), control1: pt(legX + heelW * 1.02, botY - 0.026), control2: pt(nRight - 0.002, topY + 0.028))
  canvas.setStrokeColor(CGColor(red: 0.22, green: 0.14, blue: 0.09, alpha: 0.90))
  canvas.setLineWidth(2.4)
  canvas.setLineCap(.round)
  canvas.strokePath()
}

let hiResImg = canvas.makeImage()!
let outCtx = makeCtx(480, 852)
outCtx.draw(hiResImg, in: CGRect(x: 0, y: 0, width: 480, height: 852))
saveJPEG(outCtx.makeImage()!, to: outPath, quality: 0.93)
