import AppKit
import CoreImage
import Foundation

let root = "/Users/thiagop/.gemini/antigravity/scratch/nam-y-quan/public/art"
let brain = "/Users/thiagop/.gemini/antigravity/brain/90213e4b-c384-4bc9-b2b5-4be77a632f54"
let scratch = "\(brain)/scratch"

let ciCtx = CIContext(options: [.useSoftwareRenderer: false])

func loadCG(_ path: String) -> CGImage {
  guard let img = NSImage(contentsOfFile: path) else {
    fatalError("Cannot load \(path)")
  }
  var r = NSRect(origin: .zero, size: img.size)
  guard let cg = img.cgImage(forProposedRect: &r, context: nil, hints: nil) else {
    fatalError("Cannot convert to CGImage: \(path)")
  }
  return cg
}

func makeCtx(_ w: Int, _ h: Int) -> CGContext {
  let cs = CGColorSpaceCreateDeviceRGB()
  guard
    let ctx = CGContext(
      data: nil,
      width: w,
      height: h,
      bitsPerComponent: 8,
      bytesPerRow: w * 4,
      space: cs,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )
  else {
    fatalError("Failed CGContext \(w)x\(h)")
  }
  ctx.interpolationQuality = .high
  return ctx
}

func saveJPEG(_ img: CGImage, to path: String, quality: CGFloat = 0.91) {
  let rep = NSBitmapImageRep(cgImage: img)
  guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality]) else {
    fatalError("Encode JPEG failed: \(path)")
  }
  try! data.write(to: URL(fileURLWithPath: path))
  print("WROTE \(path) (\(img.width)x\(img.height), \(data.count) bytes)")
}

func savePNG(_ img: CGImage, to path: String) {
  let rep = NSBitmapImageRep(cgImage: img)
  guard let data = rep.representation(using: .png, properties: [:]) else {
    fatalError("Encode PNG failed: \(path)")
  }
  try! data.write(to: URL(fileURLWithPath: path))
  print("WROTE \(path) (\(img.width)x\(img.height), \(data.count) bytes)")
}

// 1. Key out outer white paper background of healer-hand into crisp RGBA PNG
func buildTransparentHealerHand(srcPath: String, dstPath: String) {
  let src = loadCG(srcPath)
  let w = 520
  let h = 520
  let ctx = makeCtx(w, h)
  ctx.draw(src, in: CGRect(x: 0, y: 0, width: w, height: h))
  guard let rawPtr = ctx.data else { fatalError("No bitmap data") }
  let buf = rawPtr.assumingMemoryBound(to: UInt8.self)

  // Flood-fill from corners so interior cream sleeve cuffs & skin highlights are NEVER keyed out
  let total = w * h
  var isBg = [Bool](repeating: false, count: total)
  var visited = [Bool](repeating: false, count: total)
  var queue = [Int]()
  queue.reserveCapacity(total / 2)

  func pixelIsWhiteBg(_ idx: Int) -> Bool {
    let o = idx * 4
    let r = Float(buf[o])
    let g = Float(buf[o + 1])
    let b = Float(buf[o + 2])
    let lum = (r + g + b) / 3.0
    let chroma = max(r, max(g, b)) - min(r, min(g, b))
    return lum > 224.0 && chroma < 24.0
  }

  for x in 0..<w {
    for y in [0, h - 1] {
      let idx = y * w + x
      if !visited[idx] && pixelIsWhiteBg(idx) {
        visited[idx] = true
        queue.append(idx)
      }
    }
  }
  for y in 0..<h {
    for x in [0, w - 1] {
      let idx = y * w + x
      if !visited[idx] && pixelIsWhiteBg(idx) {
        visited[idx] = true
        queue.append(idx)
      }
    }
  }

  var head = 0
  while head < queue.count {
    let idx = queue[head]
    head += 1
    isBg[idx] = true
    let x = idx % w
    let y = idx / w
    let neighbors = [
      x > 0 ? idx - 1 : -1,
      x + 1 < w ? idx + 1 : -1,
      y > 0 ? idx - w : -1,
      y + 1 < h ? idx + w : -1,
    ]
    for n in neighbors where n >= 0 && !visited[n] {
      visited[n] = true
      if pixelIsWhiteBg(n) {
        queue.append(n)
      }
    }
  }

  // Apply transparent alpha on flood-filled exterior + soft anti-aliased edge feathering
  for y in 0..<h {
    for x in 0..<w {
      let idx = y * w + x
      let o = idx * 4
      if isBg[idx] {
        buf[o] = 0
        buf[o + 1] = 0
        buf[o + 2] = 0
        buf[o + 3] = 0
      } else {
        // Check if adjacent to background for 1px smooth anti-aliasing
        var bgNeighbors = 0
        for dy in -1...1 {
          for dx in -1...1 {
            let nx = x + dx
            let ny = y + dy
            if nx >= 0 && nx < w && ny >= 0 && ny < h && isBg[ny * w + nx] {
              bgNeighbors += 1
            }
          }
        }
        if bgNeighbors > 0 {
          let r = Float(buf[o])
          let g = Float(buf[o + 1])
          let b = Float(buf[o + 2])
          let lum = (r + g + b) / 3.0
          if lum > 205 {
            let alphaScale = max(0.25, 1.0 - (lum - 205.0) / 50.0)
            buf[o] = UInt8(Float(buf[o]) * alphaScale)
            buf[o + 1] = UInt8(Float(buf[o + 1]) * alphaScale)
            buf[o + 2] = UInt8(Float(buf[o + 2]) * alphaScale)
            buf[o + 3] = UInt8(255.0 * alphaScale)
          }
        }
      }
    }
  }

  savePNG(ctx.makeImage()!, to: dstPath)
}

// 2. Clean 18 AI herbs without dark vignette halos on pure #FAF5E8
func cleanHerbFromOriginal(srcPath: String, dstPath: String, insetFraction: CGFloat) {
  let src = loadCG(srcPath)
  let size = 360
  let ctx = makeCtx(size, size)

  let sw = CGFloat(src.width)
  let sh = CGFloat(src.height)
  let side = min(sw, sh) * (1.0 - insetFraction * 2.0)
  let cropRect = CGRect(x: (sw - side) * 0.5, y: (sh - side) * 0.5, width: side, height: side)
  let cropped = src.cropping(to: cropRect)!

  // Warm gentle exposure & contrast lift so paper corners match #FAF5E8 natively without circular shadow
  let ciImg = CIImage(cgImage: cropped)
    .applyingFilter("CIColorControls", parameters: [
      kCIInputBrightnessKey: 0.015,
      kCIInputSaturationKey: 1.06,
      kCIInputContrastKey: 1.03,
    ])
  let graded = ciCtx.createCGImage(ciImg, from: ciImg.extent)!

  ctx.setFillColor(CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 1.0))
  ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
  ctx.draw(graded, in: CGRect(x: 4, y: 4, width: size - 8, height: size - 8))

  // Only feather outer 8% edges gently into #FAF5E8
  let cs = CGColorSpaceCreateDeviceRGB()
  let grad = CGGradient(
    colorsSpace: cs,
    colors: [
      CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 0.0),
      CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 0.0),
      CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 0.92),
      CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 1.0),
    ] as CFArray,
    locations: [0.0, 0.80, 0.94, 1.0]
  )!
  let center = CGPoint(x: 180, y: 180)
  ctx.drawRadialGradient(
    grad,
    startCenter: center,
    startRadius: 0,
    endCenter: center,
    endRadius: 182,
    options: [.drawsAfterEndLocation]
  )

  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.92)
}

// 3. Real painterly watercolor herbs built by smooth cubic curves & watercolor granulation (zero polygonal corners)
func paintOrganicWatercolorTranBi(dstPath: String) {
  let hi = 1080
  let ctx = makeCtx(hi, hi)
  let cs = CGColorSpaceCreateDeviceRGB()
  ctx.setFillColor(CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 1.0))
  ctx.fill(CGRect(x: 0, y: 0, width: hi, height: hi))

  func drawPeelCurl(cx: CGFloat, cy: CGFloat, scale: CGFloat, rot: CGFloat, seed: UInt64) {
    ctx.saveGState()
    ctx.translateBy(x: cx, y: cy)
    ctx.rotate(by: rot)
    ctx.scaleBy(x: scale, y: scale)

    // Soft diffused ground watercolor wash
    let shGrad = CGGradient(
      colorsSpace: cs,
      colors: [
        CGColor(red: 0.48, green: 0.36, blue: 0.22, alpha: 0.14),
        CGColor(red: 0.48, green: 0.36, blue: 0.22, alpha: 0.0),
      ] as CFArray,
      locations: [0.0, 1.0]
    )!
    ctx.saveGState()
    ctx.translateBy(x: 6, y: -22)
    ctx.scaleBy(x: 1.0, y: 0.36)
    ctx.drawRadialGradient(shGrad, startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: 210, options: [])
    ctx.restoreGState()

    // Organic curled tangerine rind outline
    let outer = CGMutablePath()
    outer.move(to: CGPoint(x: -175, y: -30))
    outer.addCurve(to: CGPoint(x: 0, y: 95), control1: CGPoint(x: -145, y: 55), control2: CGPoint(x: -78, y: 95))
    outer.addCurve(to: CGPoint(x: 180, y: -15), control1: CGPoint(x: 88, y: 95), control2: CGPoint(x: 162, y: 45))
    outer.addCurve(to: CGPoint(x: 158, y: -72), control1: CGPoint(x: 192, y: -42), control2: CGPoint(x: 178, y: -68))
    outer.addCurve(to: CGPoint(x: -154, y: -74), control1: CGPoint(x: 78, y: -26), control2: CGPoint(x: -75, y: -22))
    outer.addCurve(to: CGPoint(x: -175, y: -30), control1: CGPoint(x: -176, y: -62), control2: CGPoint(x: -182, y: -44))
    outer.closeSubpath()

    ctx.saveGState()
    ctx.addPath(outer)
    ctx.clip()

    let baseGrad = CGGradient(
      colorsSpace: cs,
      colors: [
        CGColor(red: 0.72, green: 0.31, blue: 0.11, alpha: 0.96),
        CGColor(red: 0.85, green: 0.49, blue: 0.19, alpha: 0.94),
        CGColor(red: 0.62, green: 0.25, blue: 0.09, alpha: 0.98),
      ] as CFArray,
      locations: [0.0, 0.48, 1.0]
    )!
    ctx.drawLinearGradient(baseGrad, start: CGPoint(x: -180, y: 90), end: CGPoint(x: 180, y: -75), options: [])

    // Cream inner spongy albedo strip along concave underside
    let pith = CGMutablePath()
    pith.move(to: CGPoint(x: -165, y: -72))
    pith.addCurve(to: CGPoint(x: 165, y: -70), control1: CGPoint(x: -60, y: -4), control2: CGPoint(x: 65, y: -6))
    pith.addLine(to: CGPoint(x: 165, y: -115))
    pith.addLine(to: CGPoint(x: -170, y: -115))
    pith.closeSubpath()
    ctx.setFillColor(CGColor(red: 0.94, green: 0.86, blue: 0.70, alpha: 0.90))
    ctx.addPath(pith)
    ctx.fillPath()

    var s = seed
    for _ in 0..<28 {
      s = s &* 6364136223846793005 &+ 1442695040888963407
      let bx = (CGFloat((s >> 16) & 0xff) / 255.0 - 0.5) * 320
      let by = (CGFloat((s >> 24) & 0xff) / 255.0 - 0.35) * 145
      let br = 22 + (CGFloat((s >> 8) & 0xff) / 255.0) * 34
      ctx.setFillColor(CGColor(red: 0.52, green: 0.19, blue: 0.06, alpha: 0.11))
      ctx.fillEllipse(in: CGRect(x: bx - br, y: by - br * 0.6, width: br * 2, height: br * 1.2))
    }
    for _ in 0..<140 {
      s = s &* 1103515245 &+ 12345
      let px = (CGFloat((s >> 8) & 0xff) / 255.0 - 0.5) * 330
      let py = (CGFloat((s >> 16) & 0xff) / 255.0 - 0.20) * 120
      let pr = 2.0 + (CGFloat((s >> 24) & 0xff) / 255.0) * 2.4
      ctx.setFillColor(CGColor(red: 0.40, green: 0.14, blue: 0.04, alpha: 0.42))
      ctx.fillEllipse(in: CGRect(x: px, y: py, width: pr, height: pr * 0.9))
    }
    ctx.restoreGState()

    // Fine hand-inked botanical sepia stroke (delicate 2.6px width like AI ink plates)
    ctx.addPath(outer)
    ctx.setStrokeColor(CGColor(red: 0.25, green: 0.14, blue: 0.08, alpha: 0.85))
    ctx.setLineWidth(2.6)
    ctx.setLineJoin(.round)
    ctx.strokePath()
    ctx.restoreGState()
  }

  drawPeelCurl(cx: 500, cy: 710, scale: 1.38, rot: -0.18, seed: 101)
  drawPeelCurl(cx: 605, cy: 495, scale: 1.32, rot: 0.26, seed: 202)
  drawPeelCurl(cx: 410, cy: 360, scale: 1.12, rot: -0.45, seed: 303)

  let hiCG = ctx.makeImage()!
  let finalCtx = makeCtx(360, 360)
  finalCtx.draw(hiCG, in: CGRect(x: 0, y: 0, width: 360, height: 360))
  saveJPEG(finalCtx.makeImage()!, to: dstPath, quality: 0.92)
}

// Re-paint Dan Sam organically from co_xuoc roots + sliced rounds WITHOUT tinting white paper orange!
func paintOrganicWatercolorDanSam(coXuocSrcPath: String, camThaoSrcPath: String, dstPath: String) {
  let ctImg = loadCG(camThaoSrcPath)
  let cxImg = loadCG(coXuocSrcPath)
  let size = 360

  // Helper: transform warm tan roots to deep brick-crimson Salvia Miltiorrhiza while keeping paper clean white
  func makeRedRootLayer(_ src: CGImage) -> CGImage {
    let c = makeCtx(size, size)
    c.draw(src, in: CGRect(x: 0, y: 0, width: size, height: size))
    let ptr = c.data!.assumingMemoryBound(to: UInt8.self)
    for i in 0..<(size * size) {
      let o = i * 4
      let r = Float(ptr[o])
      let g = Float(ptr[o + 1])
      let b = Float(ptr[o + 2])
      let lum = (r + g + b) / 3.0
      if lum < 230 {
        // Shift tan/ochre/yellow wood fibers into deep rusty cinnabar/crimson root bark!
        let nr = min(255, r * 0.96 + 18)
        let ng = min(255, g * 0.44)
        let nb = min(255, b * 0.36)
        ptr[o] = UInt8(nr)
        ptr[o + 1] = UInt8(ng)
        ptr[o + 2] = UInt8(nb)
        ptr[o + 3] = 255
      } else {
        ptr[o] = 0; ptr[o + 1] = 0; ptr[o + 2] = 0; ptr[o + 3] = 0
      }
    }
    return c.makeImage()!
  }

  let redRoots = makeRedRootLayer(cxImg)
  let redSlices = makeRedRootLayer(ctImg)

  let out = makeCtx(size, size)
  out.setFillColor(CGColor(red: 250.0 / 255.0, green: 245.0 / 255.0, blue: 232.0 / 255.0, alpha: 1.0))
  out.fill(CGRect(x: 0, y: 0, width: size, height: size))

  // Rotated crimson knotted root bundle in center + deep red sliced cross sections
  out.saveGState()
  out.translateBy(x: 180, y: 180)
  out.rotate(by: -0.35)
  out.draw(redRoots, in: CGRect(x: -175, y: -175, width: 350, height: 350))
  out.restoreGState()

  out.saveGState()
  out.setAlpha(0.75)
  out.draw(redSlices, in: CGRect(x: 16, y: 16, width: 328, height: 328))
  out.restoreGState()

  saveJPEG(out.makeImage()!, to: dstPath, quality: 0.92)
}

// 4. True painted decoction stove cropped & balanced directly from room_noi_cac watercolor painting
func buildPaintedDecoctionStove(srcPath: String, dstPath: String) {
  let src = loadCG(srcPath)
  let sw = CGFloat(src.width)
  let sh = CGFloat(src.height)
  // Bottom-right hearth, clay charcoal brazier, glowing flame, ceramic herbal kettle & curling steam
  let cropRect = CGRect(
    x: sw * 0.45,
    y: sh * 0.16,
    width: sw * 0.55,
    height: sh * 0.68
  )
  let cropped = src.cropping(to: cropRect)!
  let ciImg = CIImage(cgImage: cropped)
    .applyingFilter("CIColorControls", parameters: [
      kCIInputSaturationKey: 1.12,
      kCIInputContrastKey: 1.08,
      kCIInputBrightnessKey: 0.02,
    ])
  let graded = ciCtx.createCGImage(ciImg, from: ciImg.extent)!

  let ctx = makeCtx(640, 360)
  ctx.draw(graded, in: CGRect(x: 0, y: 0, width: 640, height: 360))
  // Warm atmospheric vignette
  let cs = CGColorSpaceCreateDeviceRGB()
  let grad = CGGradient(
    colorsSpace: cs,
    colors: [
      CGColor(red: 0, green: 0, blue: 0, alpha: 0.0),
      CGColor(red: 0.08, green: 0.04, blue: 0.02, alpha: 0.45),
    ] as CFArray,
    locations: [0.55, 1.0]
  )!
  ctx.drawRadialGradient(
    grad,
    startCenter: CGPoint(x: 370, y: 185),
    startRadius: 90,
    endCenter: CGPoint(x: 340, y: 180),
    endRadius: 410,
    options: [.drawsAfterEndLocation]
  )
  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.92)
}

// 5. True watercolor woodblock figure for Meridian Back (CG standard bottom-left coordinates matching meridian-front pixels)
// Front image pixels: y_top 0..852 -> in CG bottom-left (h=852): y_cg = 852 - y_top!
// Measured landmarks on 480x852: bun top y_top=68, hair/ears y_top=92..166, chest y_top=200..365, loin y_top=380..492, knees y_top=578..630.
func buildWatercolorMeridianBack(frontPath: String, dstPath: String) {
  let front = loadCG(frontPath)
  let w = 480
  let h = 852
  let ctx = makeCtx(w, h)

  // Draw horizontally mirrored figure directly in CG bottom-left space
  ctx.saveGState()
  ctx.translateBy(x: CGFloat(w), y: 0)
  ctx.scaleBy(x: -1, y: 1)
  ctx.draw(front, in: CGRect(x: 0, y: 0, width: w, height: h))
  ctx.restoreGState()

  // Helper converting top-down coordinates to CG bottom-left y
  func washTop(cx: CGFloat, yTop: CGFloat, rx: CGFloat, ry: CGFloat, r: CGFloat, g: CGFloat, b: CGFloat, alpha: CGFloat) {
    let cs = CGColorSpaceCreateDeviceRGB()
    let grad = CGGradient(
      colorsSpace: cs,
      colors: [
        CGColor(red: r, green: g, blue: b, alpha: alpha),
        CGColor(red: r, green: g, blue: b, alpha: alpha * 0.94),
        CGColor(red: r, green: g, blue: b, alpha: 0.0),
      ] as CFArray,
      locations: [0.0, 0.72, 1.0]
    )!
    ctx.saveGState()
    ctx.translateBy(x: cx, y: CGFloat(h) - yTop)
    ctx.scaleBy(x: 1.0, y: ry / max(1.0, rx))
    ctx.drawRadialGradient(grad, startCenter: .zero, startRadius: 0, endCenter: .zero, endRadius: rx, options: [])
    ctx.restoreGState()
  }

  // Exact measured face/body rows on 480x852 meridian-front:
  // Face (eyes/nose/mouth) spans yTop = 148..214, hair crest starts at yTop = 115
  // Nipples & sternum span yTop = 276..395, navel at yTop = 398, loincloth 410..480, knees 566..614

  // 1) Paint natural rounded sepia-charcoal occiput hair covering face & ear-cheek seams cleanly
  washTop(cx: 240, yTop: 158, rx: 34, ry: 34, r: 0.21, g: 0.18, b: 0.16, alpha: 1.0)
  washTop(cx: 240, yTop: 182, rx: 28, ry: 20, r: 0.20, g: 0.17, b: 0.15, alpha: 1.0)
  // Softly blend chin shadow & front throat V-neck at yTop = 196..226 into smooth nape skin
  washTop(cx: 240, yTop: 212, rx: 25, ry: 18, r: 0.85, g: 0.71, b: 0.56, alpha: 0.99)

  // Curved natural hair contours flowing toward the nape center (never vertical curtain bars)
  ctx.saveGState()
  ctx.setLineCap(.round)
  for i in -6...6 {
    let fi = CGFloat(i)
    let x0 = 240 + fi * 4.2
    let x1 = 240 + fi * 2.4
    let y0 = CGFloat(h) - (126.0 + abs(fi) * 2.5)
    let y1 = CGFloat(h) - (192.0 - abs(fi) * 1.8)
    ctx.beginPath()
    ctx.move(to: CGPoint(x: x0, y: y0))
    ctx.addCurve(
      to: CGPoint(x: x1, y: y1),
      control1: CGPoint(x: 240 + fi * 4.8, y: CGFloat(h) - 150.0),
      control2: CGPoint(x: 240 + fi * 3.2, y: CGFloat(h) - 174.0)
    )
    ctx.setStrokeColor(
      i % 2 == 0
        ? CGColor(red: 0.12, green: 0.10, blue: 0.08, alpha: 0.55)
        : CGColor(red: 0.34, green: 0.29, blue: 0.24, alpha: 0.42)
    )
    ctx.setLineWidth(1.2)
    ctx.strokePath()
  }
  ctx.restoreGState()

  // 2) Completely paint warm dorsal skin tones over anterior pectorals, nipples, linea alba & navel (yTop = 236..406)
  washTop(cx: 240, yTop: 292, rx: 64, ry: 52, r: 0.87, g: 0.73, b: 0.58, alpha: 0.995)
  washTop(cx: 196, yTop: 296, rx: 40, ry: 34, r: 0.87, g: 0.73, b: 0.58, alpha: 0.995)
  washTop(cx: 284, yTop: 296, rx: 40, ry: 34, r: 0.87, g: 0.73, b: 0.58, alpha: 0.995)
  washTop(cx: 240, yTop: 372, rx: 52, ry: 48, r: 0.86, g: 0.72, b: 0.56, alpha: 0.995)

  // 3) Paint delicate back anatomy: soft dorsal spinal groove + left/right scapular blades
  washTop(cx: 240, yTop: 315, rx: 8, ry: 86, r: 0.68, g: 0.51, b: 0.36, alpha: 0.28)
  ctx.saveGState()
  ctx.setLineCap(.round)
  ctx.beginPath()
  ctx.move(to: CGPoint(x: 240, y: CGFloat(h) - 214))
  ctx.addCurve(
    to: CGPoint(x: 240, y: CGFloat(h) - 404),
    control1: CGPoint(x: 238, y: CGFloat(h) - 275),
    control2: CGPoint(x: 242, y: CGFloat(h) - 340)
  )
  ctx.setStrokeColor(CGColor(red: 0.36, green: 0.24, blue: 0.15, alpha: 0.50))
  ctx.setLineWidth(1.5)
  ctx.strokePath()

  for dir in [-1.0, 1.0] as [CGFloat] {
    ctx.beginPath()
    ctx.move(to: CGPoint(x: 240 + dir * 20, y: CGFloat(h) - 246))
    ctx.addCurve(
      to: CGPoint(x: 240 + dir * 56, y: CGFloat(h) - 306),
      control1: CGPoint(x: 240 + dir * 46, y: CGFloat(h) - 256),
      control2: CGPoint(x: 240 + dir * 58, y: CGFloat(h) - 282)
    )
    ctx.setStrokeColor(CGColor(red: 0.38, green: 0.25, blue: 0.16, alpha: 0.48))
    ctx.setLineWidth(1.5)
    ctx.strokePath()
  }

  // 4) Smooth loincloth back pleats & posterior popliteal knee creases (yTop = 584..608)
  washTop(cx: 240, yTop: 446, rx: 52, ry: 38, r: 0.61, g: 0.58, b: 0.43, alpha: 0.92)
  ctx.beginPath()
  ctx.move(to: CGPoint(x: 240, y: CGFloat(h) - 414))
  ctx.addLine(to: CGPoint(x: 240, y: CGFloat(h) - 476))
  ctx.setStrokeColor(CGColor(red: 0.24, green: 0.19, blue: 0.13, alpha: 0.46))
  ctx.setLineWidth(1.4)
  ctx.strokePath()

  for kx in [200.0, 280.0] as [CGFloat] {
    washTop(cx: kx, yTop: 586, rx: 20, ry: 20, r: 0.84, g: 0.70, b: 0.54, alpha: 0.94)
    ctx.beginPath()
    ctx.move(to: CGPoint(x: kx - 13, y: CGFloat(h) - 586))
    ctx.addCurve(
      to: CGPoint(x: kx + 13, y: CGFloat(h) - 586),
      control1: CGPoint(x: kx - 4, y: CGFloat(h) - 590),
      control2: CGPoint(x: kx + 4, y: CGFloat(h) - 590)
    )
    ctx.setStrokeColor(CGColor(red: 0.36, green: 0.24, blue: 0.15, alpha: 0.50))
    ctx.setLineWidth(1.2)
    ctx.strokePath()
  }
  ctx.restoreGState()

  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.92)
}

// 6. Woodblock Watercolor Shader for Khue Van Cac (Y Mieu) & Duong Sinh Courtyard
func buildPainterlyYMieu(srcPath: String, dstPath: String) {
  let src = loadCG(srcPath)
  let ciSrc = CIImage(cgImage: src)
  let painted = ciSrc
    .applyingFilter("CIMedianFilter")
    .applyingFilter("CISepiaTone", parameters: [kCIInputIntensityKey: 0.48])
    .applyingFilter("CIColorControls", parameters: [
      kCIInputSaturationKey: 1.18,
      kCIInputContrastKey: 1.12,
      kCIInputBrightnessKey: 0.04,
    ])
    .cropped(to: ciSrc.extent)

  let ink = ciSrc
    .applyingFilter("CIEdges", parameters: [kCIInputIntensityKey: 1.8])
    .applyingFilter("CIColorMatrix", parameters: [
      "inputRVector": CIVector(x: -0.22, y: -0.22, z: -0.22, w: 0),
      "inputGVector": CIVector(x: -0.26, y: -0.26, z: -0.26, w: 0),
      "inputBVector": CIVector(x: -0.30, y: -0.30, z: -0.30, w: 0),
      "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0.42),
      "inputBiasVector": CIVector(x: 0.22, y: 0.14, z: 0.09, w: 0),
    ])

  let paintedCG = ciCtx.createCGImage(painted, from: ciSrc.extent)!
  let inkCG = ciCtx.createCGImage(ink, from: ciSrc.extent)!

  let ctx = makeCtx(1280, 720)
  // Cover-fit preserving aspect ratio
  let sw = CGFloat(paintedCG.width)
  let sh = CGFloat(paintedCG.height)
  let scale = max(1280.0 / sw, 720.0 / sh)
  let dw = sw * scale
  let dh = sh * scale
  let drawRect = CGRect(x: (1280 - dw) * 0.5, y: (720 - dh) * 0.5, width: dw, height: dh)

  ctx.draw(paintedCG, in: drawRect)
  ctx.saveGState()
  ctx.setBlendMode(.multiply)
  ctx.draw(inkCG, in: drawRect)
  ctx.restoreGState()

  // Warm woodblock morning glow scrim
  ctx.setFillColor(CGColor(red: 0.85, green: 0.67, blue: 0.40, alpha: 0.12))
  ctx.fill(CGRect(x: 0, y: 0, width: 1280, height: 720))

  saveJPEG(ctx.makeImage()!, to: dstPath, quality: 0.90)
}

func buildPaintedDuongSinhAndHall(tienDuongPath: String, hauVienPath: String, duocCacPath: String) {
  let td = loadCG(tienDuongPath)
  let hv = loadCG(hauVienPath)
  let dc = loadCG(duocCacPath)

  // Duong Sinh: clean single-exposure panoramic crop of serene misty bamboo garden & tea veranda (zero ghosting!)
  do {
    let ctx = makeCtx(1280, 720)
    let sw = CGFloat(td.width)
    let sh = CGFloat(td.height)
    // Right 72% of room_tien_duong showcases celadon teapot, teacup, bamboo grove and sunlit misty garden courtyard
    let crop = td.cropping(to: CGRect(x: sw * 0.24, y: 0, width: sw * 0.76, height: sh * 0.86))!
    ctx.draw(crop, in: CGRect(x: 0, y: 0, width: 1280, height: 720))
    saveJPEG(ctx.makeImage()!, to: "\(root)/scenes/duong-sinh-scroll.jpg", quality: 0.90)
  }

  // clinic-hall & patients/clinic-bg painted upgrades
  do {
    let ctx = makeCtx(1280, 720)
    ctx.draw(dc, in: CGRect(x: 0, y: 0, width: 1280, height: 720))
    saveJPEG(ctx.makeImage()!, to: "\(root)/scenes/clinic-hall.jpg", quality: 0.88)
  }
  do {
    let ctx = makeCtx(480, 640)
    let sw = CGFloat(td.width)
    let sh = CGFloat(td.height)
    let cropW = sh * 0.75
    let crop = td.cropping(to: CGRect(x: (sw - cropW) * 0.5, y: 0, width: cropW, height: sh))!
    ctx.draw(crop, in: CGRect(x: 0, y: 0, width: 480, height: 640))
    saveJPEG(ctx.makeImage()!, to: "\(root)/patients/clinic-bg.jpg", quality: 0.88)
  }
}

print("Running Masterpiece Concept Art Upgrade...")

buildTransparentHealerHand(
  srcPath: "\(brain)/healer_hand_1795696964438.jpg",
  dstPath: "\(root)/tools/healer-hand.png"
)

buildPaintedDecoctionStove(
  srcPath: "\(brain)/room_noi_cac_1795715745324.jpg",
  dstPath: "\(root)/tools/decoction-stove.jpg"
)

buildWatercolorMeridianBack(
  frontPath: "\(brain)/meridian_front_1795696951049.jpg",
  dstPath: "\(root)/meridians/meridian-back.jpg"
)

paintOrganicWatercolorTranBi(dstPath: "\(root)/herbs/tran-bi.jpg")
paintOrganicWatercolorDanSam(
  coXuocSrcPath: "\(brain)/co_xuoc_1795753926685.jpg",
  camThaoSrcPath: "\(brain)/cam_thao_1795753884619.jpg",
  dstPath: "\(root)/herbs/dan-sam.jpg"
)

buildPainterlyYMieu(
  srcPath: "\(scratch)/old_y_mieu.jpg",
  dstPath: "\(root)/scenes/y-mieu-temple.jpg"
)

buildPaintedDuongSinhAndHall(
  tienDuongPath: "\(brain)/room_tien_duong_1795715728081.jpg",
  hauVienPath: "\(brain)/room_hau_vien_1795753901786.jpg",
  duocCacPath: "\(brain)/room_duoc_cac_1795715737176.jpg"
)

let originalAIHerbs: [(String, String, CGFloat)] = [
  ("tia-to", "tia_to_1795696947988.jpg", 0.02),
  ("kinh-gioi", "kinh_gioi_1795696959961.jpg", 0.02),
  ("cuc-hoa", "cuc_hoa_1795696951100.jpg", 0.02),
  ("cat-can", "cat_can_1795696960772.jpg", 0.02),
  ("dinh-lang", "dinh_lang_1795696949799.jpg", 0.02),
  ("ngai-cuu", "ngai_cuu_1795696961283.jpg", 0.02),
  ("nhan-tran", "nhan_tran_1795696954232.jpg", 0.02),
  ("la-lot", "la_lot_1795696969069.jpg", 0.02),
  ("bac-ha", "bac_ha_1795753865579.jpg", 0.02),
  ("kim-ngan-hoa", "kim_ngan_hoa_1795753874723.jpg", 0.02),
  ("cam-thao", "cam_thao_1795753884619.jpg", 0.02),
  ("sinh-khuong", "sinh_khuong_1795753890961.jpg", 0.02),
  ("que-chi", "que_chi_1795753897911.jpg", 0.02),
  ("hoai-son", "hoai_son_1795753868336.jpg", 0.02),
  ("lac-tien", "lac_tien_1795753887769.jpg", 0.02),
  ("tam-sen", "tam_sen_1795753899138.jpg", 0.02),
  ("ky-tu", "ky_tu_1795753910127.jpg", 0.14),
  ("co-xuoc", "co_xuoc_1795753926685.jpg", 0.02),
]

for (id, file, inset) in originalAIHerbs {
  cleanHerbFromOriginal(
    srcPath: "\(brain)/\(file)",
    dstPath: "\(root)/herbs/\(id).jpg",
    insetFraction: inset
  )
}

print("DONE MASTERPIECE ART UPGRADE.")
