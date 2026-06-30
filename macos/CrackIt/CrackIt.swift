import AppKit
import Darwin
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
  private var window: NSWindow?
  private var webView: WKWebView?
  private var webServer: LocalWebServer?

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.regular)
    configureMenu()

    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    configuration.defaultWebpagePreferences.allowsContentJavaScript = true
    configuration.preferences.javaScriptCanOpenWindowsAutomatically = false

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.navigationDelegate = self
    webView.uiDelegate = self
    webView.allowsBackForwardNavigationGestures = true
    webView.setValue(false, forKey: "drawsBackground")

    let screenFrame = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1280, height: 820)
    let windowFrame = NSRect(
      x: screenFrame.minX,
      y: screenFrame.minY,
      width: screenFrame.width,
      height: screenFrame.height
    )

    let window = NSWindow(
      contentRect: windowFrame,
      styleMask: [.titled, .closable, .miniaturizable, .resizable],
      backing: .buffered,
      defer: false
    )
    window.title = "CrackIt"
    window.minSize = NSSize(width: 1024, height: 680)
    window.contentView = webView
    window.makeKeyAndOrderFront(nil)

    self.window = window
    self.webView = webView

    loadApp(in: webView)
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    true
  }

  @objc private func closeWindow(_ sender: Any?) {
    window?.performClose(sender)
  }

  private func configureMenu() {
    let mainMenu = NSMenu()

    let appMenuItem = NSMenuItem()
    let appMenu = NSMenu()
    appMenu.addItem(
      NSMenuItem(
        title: "Quit CrackIt",
        action: #selector(NSApplication.terminate(_:)),
        keyEquivalent: "q"
      )
    )
    appMenuItem.submenu = appMenu
    mainMenu.addItem(appMenuItem)

    let fileMenuItem = NSMenuItem()
    let fileMenu = NSMenu(title: "File")
    let closeItem = NSMenuItem(
      title: "Close Window",
      action: #selector(closeWindow(_:)),
      keyEquivalent: "w"
    )
    closeItem.target = self
    fileMenu.addItem(closeItem)
    fileMenuItem.submenu = fileMenu
    mainMenu.addItem(fileMenuItem)

    NSApp.mainMenu = mainMenu
  }

  private func loadApp(in webView: WKWebView) {
    guard let resourcesURL = Bundle.main.resourceURL else {
      showMissingBundleError(in: webView)
      return
    }

    let distURL = resourcesURL.appendingPathComponent("dist", isDirectory: true)
    let indexURL = distURL.appendingPathComponent("index.html")

    guard FileManager.default.fileExists(atPath: indexURL.path) else {
      showMissingBundleError(in: webView)
      return
    }

    do {
      let server = LocalWebServer(rootURL: distURL)
      let appURL = try server.start()
      webServer = server
      webView.load(URLRequest(url: appURL))
    } catch {
      showStartupError(in: webView, message: "The desktop web server could not start.")
    }
  }

  private func showMissingBundleError(in webView: WKWebView) {
    showStartupError(in: webView, message: "The desktop bundle is missing its built web files.")
  }

  private func showStartupError(in webView: WKWebView, message: String) {
    let html = """
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>CrackIt</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #faf8f4;
            color: #1a1714;
            font: 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          main {
            max-width: 28rem;
            padding: 2rem;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>CrackIt could not start.</h1>
          <p>\(message)</p>
        </main>
      </body>
    </html>
    """
    webView.loadHTMLString(html, baseURL: nil)
  }

  @available(macOS 12.0, *)
  func webView(
    _ webView: WKWebView,
    requestMediaCapturePermissionFor origin: WKSecurityOrigin,
    initiatedByFrame frame: WKFrameInfo,
    type: WKMediaCaptureType,
    decisionHandler: @escaping (WKPermissionDecision) -> Void
  ) {
    decisionHandler(.prompt)
  }
}

final class LocalWebServer {
  private static let stablePort: UInt16 = 41730
  private let rootURL: URL
  private var socketFileDescriptor: Int32 = -1
  private let queue = DispatchQueue(label: "CrackIt.LocalWebServer", qos: .userInitiated)
  private(set) var port: UInt16 = 0

  init(rootURL: URL) {
    self.rootURL = rootURL.standardizedFileURL
  }

  deinit {
    stop()
  }

  func start() throws -> URL {
    socketFileDescriptor = socket(AF_INET, SOCK_STREAM, 0)
    guard socketFileDescriptor >= 0 else {
      throw POSIXError(.EIO)
    }

    var reuse: Int32 = 1
    setsockopt(socketFileDescriptor, SOL_SOCKET, SO_REUSEADDR, &reuse, socklen_t(MemoryLayout<Int32>.size))

    var address = sockaddr_in()
    address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    address.sin_family = sa_family_t(AF_INET)
    address.sin_port = in_port_t(Self.stablePort).bigEndian
    address.sin_addr = in_addr(s_addr: inet_addr("127.0.0.1"))

    let bindResult = withUnsafePointer(to: &address) { pointer in
      pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPointer in
        Darwin.bind(socketFileDescriptor, sockaddrPointer, socklen_t(MemoryLayout<sockaddr_in>.size))
      }
    }
    guard bindResult == 0 else {
      throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO)
    }

    guard listen(socketFileDescriptor, SOMAXCONN) == 0 else {
      throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO)
    }

    var boundAddress = sockaddr_in()
    var boundAddressLength = socklen_t(MemoryLayout<sockaddr_in>.size)
    let nameResult = withUnsafeMutablePointer(to: &boundAddress) { pointer in
      pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPointer in
        getsockname(socketFileDescriptor, sockaddrPointer, &boundAddressLength)
      }
    }
    guard nameResult == 0 else {
      throw POSIXError(POSIXErrorCode(rawValue: errno) ?? .EIO)
    }

    port = UInt16(bigEndian: boundAddress.sin_port)
    queue.async { [weak self] in
      self?.acceptLoop()
    }

    guard let url = URL(string: "http://127.0.0.1:\(port)/index.html") else {
      throw POSIXError(.EINVAL)
    }
    return url
  }

  func stop() {
    if socketFileDescriptor >= 0 {
      Darwin.shutdown(socketFileDescriptor, SHUT_RDWR)
      Darwin.close(socketFileDescriptor)
      socketFileDescriptor = -1
    }
  }

  private func acceptLoop() {
    while socketFileDescriptor >= 0 {
      let client = accept(socketFileDescriptor, nil, nil)
      guard client >= 0 else {
        continue
      }
      handle(client: client)
      Darwin.close(client)
    }
  }

  private func handle(client: Int32) {
    var buffer = [UInt8](repeating: 0, count: 8192)
    let bytesRead = recv(client, &buffer, buffer.count, 0)
    guard bytesRead > 0 else {
      return
    }

    let request = String(decoding: buffer.prefix(bytesRead), as: UTF8.self)
    let requestLine = request.split(separator: "\r\n", maxSplits: 1, omittingEmptySubsequences: false).first ?? ""
    let parts = requestLine.split(separator: " ")
    guard parts.count >= 2, parts[0] == "GET" || parts[0] == "HEAD" else {
      writeResponse(client: client, status: "405 Method Not Allowed", body: Data())
      return
    }

    let pathPart = String(parts[1])
    let requestPath = pathPart.split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false).first.map(String.init) ?? "/"
    let relativePath = normalizedRelativePath(from: requestPath)
    let fileURL = rootURL.appendingPathComponent(relativePath).standardizedFileURL

    guard fileURL.path.hasPrefix(rootURL.path), FileManager.default.fileExists(atPath: fileURL.path) else {
      writeResponse(client: client, status: "404 Not Found", body: Data("Not found".utf8), contentType: "text/plain; charset=utf-8")
      return
    }

    do {
      let body = try Data(contentsOf: fileURL)
      let contentType = mimeType(for: fileURL.pathExtension)
      if parts[0] == "HEAD" {
        writeResponse(client: client, status: "200 OK", body: Data(), contentType: contentType, contentLength: body.count)
      } else {
        writeResponse(client: client, status: "200 OK", body: body, contentType: contentType)
      }
    } catch {
      writeResponse(client: client, status: "500 Internal Server Error", body: Data("Could not read file".utf8), contentType: "text/plain; charset=utf-8")
    }
  }

  private func normalizedRelativePath(from requestPath: String) -> String {
    let decodedPath = requestPath.removingPercentEncoding ?? requestPath
    let trimmedPath = decodedPath == "/" ? "index.html" : decodedPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    return trimmedPath.isEmpty ? "index.html" : trimmedPath
  }

  private func writeResponse(
    client: Int32,
    status: String,
    body: Data,
    contentType: String = "application/octet-stream",
    contentLength: Int? = nil
  ) {
    let length = contentLength ?? body.count
    let headers = """
    HTTP/1.1 \(status)\r
    Content-Type: \(contentType)\r
    Content-Length: \(length)\r
    Cache-Control: no-store\r
    Connection: close\r
    Access-Control-Allow-Origin: *\r
    \r

    """
    writeAll(client: client, data: Data(headers.utf8))
    if !body.isEmpty {
      writeAll(client: client, data: body)
    }
  }

  private func writeAll(client: Int32, data: Data) {
    data.withUnsafeBytes { pointer in
      guard let baseAddress = pointer.baseAddress else {
        return
      }

      var bytesWritten = 0
      while bytesWritten < data.count {
        let result = Darwin.write(client, baseAddress.advanced(by: bytesWritten), data.count - bytesWritten)
        if result <= 0 {
          break
        }
        bytesWritten += result
      }
    }
  }

  private func mimeType(for fileExtension: String) -> String {
    switch fileExtension.lowercased() {
    case "css":
      return "text/css; charset=utf-8"
    case "html":
      return "text/html; charset=utf-8"
    case "js", "mjs":
      return "text/javascript; charset=utf-8"
    case "json", "webmanifest":
      return "application/manifest+json; charset=utf-8"
    case "svg":
      return "image/svg+xml"
    case "png":
      return "image/png"
    case "jpg", "jpeg":
      return "image/jpeg"
    case "woff":
      return "font/woff"
    case "woff2":
      return "font/woff2"
    default:
      return "application/octet-stream"
    }
  }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
