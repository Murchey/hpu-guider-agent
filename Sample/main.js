// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
 
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true
  });
  // 加载Vue构建后的index.html
  win.loadFile(path.join(__dirname, 'dist/index.html'));
}
 
app.whenReady().then(createWindow);
 
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});