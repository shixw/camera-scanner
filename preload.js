const { contextBridge, ipcRenderer, clipboard } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    takeScreenshot: (data, width, height) => ipcRenderer.invoke('take-screenshot', { data, width, height }),
    setResolution: (width, height) => ipcRenderer.send('set-resolution', { width, height }),
    onMobileStream: (callback) => ipcRenderer.on('mobile-stream', callback),
    copyImageToClipboard: (imageData) => ipcRenderer.invoke('copy-image-to-clipboard', imageData),
    closeApp: () => ipcRenderer.send('close-app')
})
