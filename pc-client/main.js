const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const express = require('express')
const qrcode = require('qrcode')
const WebSocket = require('ws')
const portfinder = require('portfinder')

// 创建本地HTTP服务器
const httpServer = express()
let port = 3001
let wsPort = 3002

// 手机端部署地址配置（用户需要设置）
let mobileAppUrl = 'https://your-mobile-app.com'  // 默认值，用户需要修改

// 获取可用端口
async function getAvailablePorts() {
  try {
    port = await portfinder.getPortPromise({ port: port })
    wsPort = await portfinder.getPortPromise({ port: wsPort })
    return { httpPort: port, wsPort }
  } catch (err) {
    console.error('获取端口失败:', err)
    return { httpPort: 3001, wsPort: 3002 } // 默认回退
  }
}

// WebSocket服务器
let wss

let mainWindow
let mobileConnections = new Set()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
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

// 关闭服务器
function closeServers() {
  return new Promise((resolve) => {
    if (httpServer && httpServer.close) {
      httpServer.close(() => {
        console.log('HTTP server closed')
        if (wss) {
          wss.close(() => {
            console.log('WebSocket server closed')
            resolve()
          })
        } else {
          resolve()
        }
      })
    } else {
      resolve()
    }
  })
}

app.on('window-all-closed', async () => {
  await closeServers()
  app.quit()
})

// 处理异常退出
process.on('SIGINT', async () => {
  await closeServers()
  process.exit(0)
})

process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err)
  await closeServers()
  process.exit(1)
})

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  await closeServers()
  process.exit(1)
})

// 启动服务器
async function startServers() {
  const ports = await getAvailablePorts()
  port = ports.httpPort
  wsPort = ports.wsPort

  // 启动HTTP服务器（用于二维码生成等）
  httpServer.use(express.static('public'))
  httpServer.get('/qrcode', async (req, res) => {
    const localIP = getIPAddress()
    const qrUrl = `${mobileAppUrl}/?wsHost=${localIP}&wsPort=${wsPort}&width=1280&height=720`
    const qr = await qrcode.toDataURL(qrUrl)
    res.send(`<img src="${qr}">`)
  })

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      console.log(`HTTP server running at http://localhost:${port}`)
      
      // 启动WebSocket服务器
      wss = new WebSocket.Server({ port: wsPort })
      console.log(`WebSocket server running at ws://localhost:${wsPort}`)

      // WebSocket连接处理
      wss.on('connection', (ws) => {
        mobileConnections.add(ws)
        console.log('移动端已连接，当前连接数:', mobileConnections.size)
        
        // 通知渲染进程连接状态变化
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('connection-status', {
            connected: true,
            count: mobileConnections.size
          })
        }
        
        ws.on('message', (message) => {
          if (!mainWindow || mainWindow.isDestroyed()) {
            console.log('主窗口已关闭，忽略消息')
            return
          }
          try {
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
          console.log('移动端已断开，当前连接数:', mobileConnections.size)
          
          // 通知渲染进程连接状态变化
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('connection-status', {
              connected: mobileConnections.size > 0,
              count: mobileConnections.size
            })
          }
        })
      })

      resolve()
    })
  })
}

// 启动应用
app.whenReady().then(async () => {
  createWindow()
  await startServers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      startServers()
    }
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
// 获取连接信息
ipcMain.handle('get-connection-info', () => {
  const localIP = getIPAddress()
  return {
    localIP,
    wsPort,
    httpPort: port,
    mobileAppUrl,
    connectionCount: mobileConnections.size,
    qrUrl: `${mobileAppUrl}/?wsHost=${localIP}&wsPort=${wsPort}&width=1280&height=720`
  }
})

// 设置手机端URL
ipcMain.handle('set-mobile-url', (event, url) => {
  mobileAppUrl = url
  console.log('手机端URL已更新:', mobileAppUrl)
  return true
})

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

// 关闭应用
ipcMain.on('close-app', async () => {
  await closeServers()
  app.quit()
})

// 截图保存
ipcMain.handle('take-screenshot', async (event, imageData, width, height) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotPath = path.join(app.getPath('pictures'), `screenshot-${timestamp}.png`)
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    
    await require('fs').promises.writeFile(screenshotPath, base64Data, 'base64')
    console.log('截图保存成功:', screenshotPath)
    
    return {
      success: true,
      path: screenshotPath,
      data: imageData
    }
  } catch (err) {
    console.error('截图保存失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
})

// 设置分辨率
ipcMain.on('set-resolution', (event, width, height) => {
  console.log('分辨率设置:', width, 'x', height)
  // 这里可以添加分辨率设置的逻辑
})
