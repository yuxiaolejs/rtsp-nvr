// use electron to open 127.0.0.1:3010
const application = require("./app")

const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

// Hide the menu bar
app.on('browser-window-created', function (e, window) {
    window.setMenu(null);
});

let win

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            // preload: path.join(__dirname, 'preload.js')
        }
    })

    // win.loadFile('index.html')
    win.loadURL("http://127.0.0.1:3010/webrtc.html")

    // win.webContents.openDevTools()

    win.on('closed', () => {
        win = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    app.quit()
})


