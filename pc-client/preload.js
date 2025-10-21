const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 关闭应用
  closeApp: () => ipcRenderer.send('close-app'),

  // 监听移动端视频流
  onMobileStream: (callback) => ipcRenderer.on('mobile-stream', callback),

  // 监听连接状态变化
  onConnectionStatus: (callback) => ipcRenderer.on('connection-status', callback),

  // 获取连接信息
  getConnectionInfo: () => ipcRenderer.invoke('get-connection-info'),

  // 设置手机端URL
  setMobileUrl: (url) => ipcRenderer.invoke('set-mobile-url', url),

  // 复制图片到剪贴板
  copyImageToClipboard: (imageData) => ipcRenderer.invoke('copy-image-to-clipboard', imageData),

  // 截图保存
  takeScreenshot: (imageData, width, height) => ipcRenderer.invoke('take-screenshot', imageData, width, height),

  // 设置分辨率
  setResolution: (width, height) => ipcRenderer.send('set-resolution', width, height)
})
