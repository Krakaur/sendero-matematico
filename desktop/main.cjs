const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");
app.setName("Sendero");
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_wc, _permission, callback) => callback(false),
  );
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*"] },
    (_details, callback) => callback({ cancel: true }),
  );
  const window = new BrowserWindow({
    width: 1100,
    height: 830,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: "#f7f5ed",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../web/icon-192.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) event.preventDefault();
  });
  window.webContents.setUserAgent(
    window.webContents.getUserAgent() + " SenderoDesktop/1",
  );
  window.loadFile(path.join(__dirname, "../web/index.html"));
});
app.on("window-all-closed", () => app.quit());
