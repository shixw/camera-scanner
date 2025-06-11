const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const express = require('express')
const qrcode = require('qrcode')
const WebSocket = require('ws')

// 创建本地HTTP服务器
const httpServer = express()
const port = 3001

// WebSocket服务器
const wss = new WebSocket.Server({ port: 3002 })

let mainWindow
let mobileConnections = new Set()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadFile('renderer/index.html')

  // 开发工具
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 启动HTTP服务器
httpServer.use(express.static('public'))
httpServer.get('/qrcode', async (req, res) => {
  const url = `http://${getIPAddress()}:${port}/mobile.html`
  const qr = await qrcode.toDataURL(url)
  res.send(`<img src="${qr}">`)
})

httpServer.listen(port, () => {
  console.log(`HTTP server running at http://localhost:${port}`)
})

// WebSocket连接处理
wss.on('connection', (ws) => {
  mobileConnections.add(ws)
  
  ws.on('message', (message) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.log('主窗口已关闭，忽略消息')
      return
    }
    try {
      // 解析带时间戳的数据
      // 直接转发二进制数据并添加时间戳
      mainWindow.webContents.send('mobile-stream', {
        timestamp: Date.now(),
        data: message
      })
    } catch (err) {
      console.error('解析消息失败:', err)
    }
  })

  ws.on('close', () => {
    mobileConnections.delete(ws)
  })
})

// 获取本地IP地址
function getIPAddress() {
  const interfaces = require('os').networkInterfaces()
  for (const devName in interfaces) {
    const iface = interfaces[devName]
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address
      }
    }
  }
  return 'localhost'
}

// IPC通信处理
// 复制图片到剪贴板
ipcMain.handle('copy-image-to-clipboard', (event, imageData) => {
  try {
    const nativeImage = require('electron').nativeImage
    const image = nativeImage.createFromDataURL(imageData)
    require('electron').clipboard.writeImage(image)
    return true
  } catch (err) {
    console.error('复制图片失败:', err)
    return false
  }
})

// 截图保存
ipcMain.handle('take-screenshot', async (event, { data, width, height }) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotPath = path.join(app.getPath('pictures'), `screenshot-${timestamp}.png`)
    const base64Data = data.replace(/^data:image\/png;base64,/, '')
    
    await require('fs').promises.writeFile(screenshotPath, base64Data, 'base64')
    console.log('截图保存成功:', screenshotPath)
    
    // 返回截图数据以便前端显示
    return {
      path: screenshotPath,
      data: data // 返回原始base64数据用于立即显示
    }
  } catch (err) {
    console.error('保存截图失败:', err)
    throw err
  }
})
