import AppKit

let outputDirectory = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
  .appendingPathComponent("icons", isDirectory: true)

try? FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

let sizes: [CGFloat] = [16, 32, 48, 128]

func color(_ hex: Int, alpha: CGFloat = 1) -> NSColor {
  let red = CGFloat((hex >> 16) & 0xff) / 255
  let green = CGFloat((hex >> 8) & 0xff) / 255
  let blue = CGFloat(hex & 0xff) / 255
  return NSColor(calibratedRed: red, green: green, blue: blue, alpha: alpha)
}

func drawSparkle(center: CGPoint, radius: CGFloat) {
  let sparkle = NSBezierPath()
  sparkle.move(to: CGPoint(x: center.x, y: center.y + radius))
  sparkle.line(to: CGPoint(x: center.x + radius * 0.34, y: center.y + radius * 0.34))
  sparkle.line(to: CGPoint(x: center.x + radius, y: center.y))
  sparkle.line(to: CGPoint(x: center.x + radius * 0.34, y: center.y - radius * 0.34))
  sparkle.line(to: CGPoint(x: center.x, y: center.y - radius))
  sparkle.line(to: CGPoint(x: center.x - radius * 0.34, y: center.y - radius * 0.34))
  sparkle.line(to: CGPoint(x: center.x - radius, y: center.y))
  sparkle.line(to: CGPoint(x: center.x - radius * 0.34, y: center.y + radius * 0.34))
  sparkle.close()
  sparkle.fill()
}

for size in sizes {
  let image = NSImage(size: NSSize(width: size, height: size))
  image.lockFocus()

  guard let context = NSGraphicsContext.current?.cgContext else {
    fatalError("Unable to access graphics context")
  }

  let rect = CGRect(origin: .zero, size: CGSize(width: size, height: size))
  let cornerRadius = size * 0.25

  let backgroundPath = NSBezierPath(roundedRect: rect, xRadius: cornerRadius, yRadius: cornerRadius)
  let backgroundGradient = NSGradient(
    colors: [
      color(0xFFB06B),
      color(0xED7C3B),
      color(0x193252)
    ]
  )!
  backgroundGradient.draw(in: backgroundPath, angle: -45)

  let insetRect = rect.insetBy(dx: size * 0.08, dy: size * 0.08)
  let insetPath = NSBezierPath(roundedRect: insetRect, xRadius: size * 0.2, yRadius: size * 0.2)
  color(0xFFFFFF, alpha: 0.18).setFill()
  insetPath.fill()
  color(0xFFFFFF, alpha: 0.34).setStroke()
  insetPath.lineWidth = max(1, size * 0.018)
  insetPath.stroke()

  let bodyRect = CGRect(
    x: size * 0.33,
    y: size * 0.28,
    width: size * 0.34,
    height: size * 0.34
  )
  let bodyPath = NSBezierPath(roundedRect: bodyRect, xRadius: size * 0.09, yRadius: size * 0.09)
  color(0x0F2038).setFill()
  bodyPath.fill()

  let shacklePath = NSBezierPath()
  shacklePath.lineWidth = max(2.5, size * 0.075)
  shacklePath.lineCapStyle = .round
  shacklePath.move(to: CGPoint(x: size * 0.4, y: size * 0.6))
  shacklePath.curve(
    to: CGPoint(x: size * 0.6, y: size * 0.6),
    controlPoint1: CGPoint(x: size * 0.4, y: size * 0.76),
    controlPoint2: CGPoint(x: size * 0.6, y: size * 0.76)
  )
  color(0xFFD88A).setStroke()
  shacklePath.stroke()

  let keyholeCircle = NSBezierPath(ovalIn: CGRect(
    x: size * 0.455,
    y: size * 0.425,
    width: size * 0.09,
    height: size * 0.09
  ))
  color(0xFFD56A).setFill()
  keyholeCircle.fill()

  let keyholeStem = NSBezierPath()
  keyholeStem.lineWidth = max(1.5, size * 0.05)
  keyholeStem.lineCapStyle = .round
  keyholeStem.move(to: CGPoint(x: size * 0.5, y: size * 0.42))
  keyholeStem.line(to: CGPoint(x: size * 0.5, y: size * 0.35))
  keyholeStem.stroke()

  color(0xFFF0C3).setFill()
  drawSparkle(center: CGPoint(x: size * 0.74, y: size * 0.78), radius: size * 0.08)
  color(0xB5F1D5).setFill()
  drawSparkle(center: CGPoint(x: size * 0.28, y: size * 0.24), radius: size * 0.05)

  context.setFillColor(color(0xFFFFFF, alpha: 0.12).cgColor)
  context.fillEllipse(in: CGRect(x: size * 0.18, y: size * 0.7, width: size * 0.24, height: size * 0.1))

  image.unlockFocus()

  guard
    let tiffData = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiffData),
    let pngData = bitmap.representation(using: .png, properties: [:])
  else {
    fatalError("Unable to encode PNG")
  }

  let outputURL = outputDirectory.appendingPathComponent("icon-\(Int(size)).png")
  try pngData.write(to: outputURL)
}

print("Generated icons in \(outputDirectory.path)")
