document.addEventListener('DOMContentLoaded', async () => {
    const canvasElement = document.getElementById('mobile-stream')
    const ctx = canvasElement.getContext('2d')
    // 设置canvas尺寸
    canvasElement.width = 1280
    canvasElement.height = 720
    
    const captureBtn = document.getElementById('capture-btn')
    const closeBtn = document.getElementById('close-btn')
    const resolutionSelect = document.getElementById('resolution')
    const qrcodeContainer = document.getElementById('qrcode')
    const historyContainer = document.getElementById('screenshot-history')
    const noConnectionDiv = document.getElementById('noConnection')
    
    // 新增元素
    const statusIndicator = document.getElementById('statusIndicator')
    const statusText = document.getElementById('statusText')
    const mobileUrlInput = document.getElementById('mobileUrl')
    const updateUrlBtn = document.getElementById('updateUrlBtn')
    const refreshQrBtn = document.getElementById('refreshQrBtn')
    const localIPSpan = document.getElementById('localIP')
    const wsPortSpan = document.getElementById('wsPort')
    const connectionCountSpan = document.getElementById('connectionCount')
    const qrContainer = document.getElementById('qrContainer')
    
    let connectionInfo = null
    let isConnected = false

    // 初始化连接信息
    async function initConnectionInfo() {
        try {
            connectionInfo = await window.electronAPI.getConnectionInfo()
            localIPSpan.textContent = connectionInfo.localIP
            wsPortSpan.textContent = connectionInfo.wsPort
            mobileUrlInput.value = connectionInfo.mobileAppUrl
            connectionCountSpan.textContent = connectionInfo.connectionCount
            
            // 生成二维码
            await generateQRCode()
        } catch (err) {
            console.error('获取连接信息失败:', err)
        }
    }

    // 生成二维码
    async function generateQRCode() {
        try {
            const response = await fetch(`http://localhost:${connectionInfo.httpPort}/qrcode`)
            const html = await response.text()
            qrcodeContainer.innerHTML = html
        } catch (err) {
            console.error('生成二维码失败:', err)
            qrcodeContainer.innerHTML = '<p>二维码生成失败</p>'
        }
    }

    // 更新连接状态显示
    function updateConnectionStatus(connected, count = 0) {
        isConnected = connected
        if (connected) {
            statusIndicator.className = 'status-indicator connected'
            statusText.textContent = `已连接 (${count}台设备)`
            noConnectionDiv.style.display = 'none'
            canvasElement.style.display = 'block'
            // 连接后隐藏二维码和配置区域
            qrContainer.style.display = 'none'
            document.querySelector('.config-section').style.display = 'none'
        } else {
            statusIndicator.className = 'status-indicator disconnected'
            statusText.textContent = '未连接'
            noConnectionDiv.style.display = 'flex'
            canvasElement.style.display = 'none'
            // 未连接时显示二维码和配置区域
            qrContainer.style.display = 'block'
            document.querySelector('.config-section').style.display = 'block'
        }
        connectionCountSpan.textContent = count
    }

    // 更新手机端URL
    updateUrlBtn.addEventListener('click', async () => {
        const url = mobileUrlInput.value.trim()
        if (!url) {
            alert('请输入有效的手机端URL')
            return
        }
        
        try {
            await window.electronAPI.setMobileUrl(url)
            alert('手机端URL已更新')
            // 重新获取连接信息并生成二维码
            await initConnectionInfo()
        } catch (err) {
            console.error('更新URL失败:', err)
            alert('更新失败')
        }
    })

    // 刷新二维码
    refreshQrBtn.addEventListener('click', async () => {
        await generateQRCode()
    })

    // 关闭应用
    closeBtn.addEventListener('click', () => {
        window.electronAPI.closeApp()
    })

    // 监听连接状态变化
    window.electronAPI.onConnectionStatus((event, { connected, count }) => {
        updateConnectionStatus(connected, count)
    })

    // 优化渲染性能
    let lastRenderTime = 0
    let pendingFrame = null
    
    const renderFrame = () => {
        if (pendingFrame && isConnected) {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
            ctx.drawImage(pendingFrame, 0, 0, canvasElement.width, canvasElement.height)
            pendingFrame = null
        }
        requestAnimationFrame(renderFrame)
    }
    renderFrame()

    // 处理移动端视频流
    window.electronAPI.onMobileStream((event, {timestamp, data}) => {
        console.log('收到视频数据，大小:', data.byteLength, '时间戳:', timestamp)
        
        try {
            // 尝试多种图像格式
            const formats = ['image/jpeg', 'image/png', 'image/webp']
            let currentFormat = 0
            
            const tryLoadImage = () => {
                if (currentFormat >= formats.length) {
                    console.error('所有图像格式尝试失败')
                    return
                }
                
                const blob = new Blob([data], {type: formats[currentFormat]})
                const img = new Image()
                
                img.onload = () => {
                    console.log(`图像加载成功(${formats[currentFormat]}), 尺寸:`, img.width, 'x', img.height)
                    pendingFrame = img
                    URL.revokeObjectURL(img.src)
                }
                
                img.onerror = () => {
                    console.log(`${formats[currentFormat]}格式加载失败，尝试下一种`)
                    currentFormat++
                    tryLoadImage()
                }
                
                const objectUrl = URL.createObjectURL(blob)
                img.src = objectUrl
            }
            
            tryLoadImage()
        } catch (e) {
            console.error('处理视频数据异常:', e)
        }
    })

    // 截图功能
    captureBtn.addEventListener('click', async () => {
        if (!isConnected) {
            alert('请先连接手机端')
            return
        }
        
        const [width, height] = resolutionSelect.value.split('x').map(Number)
        
        // 创建canvas来捕获当前视频帧
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(canvasElement, 0, 0, width, height)
        
        const imageData = canvas.toDataURL('image/png')
        
        // 发送截图到主进程保存
        const result = await window.electronAPI.takeScreenshot(imageData, width, height)
        if (result.success) {
            console.log('截图已保存:', result.path)
            addToHistory(result.data)
        } else {
            console.error('截图保存失败:', result.error)
            alert('截图保存失败')
        }
    })

    // 分辨率设置
    resolutionSelect.addEventListener('change', () => {
        const [width, height] = resolutionSelect.value.split('x').map(Number)
        window.electronAPI.setResolution(width, height)
    })

    // 添加截图到历史记录
    function addToHistory(imageData) {
        console.log('添加截图到历史:', imageData)
        if (!imageData || !imageData.startsWith('data:image')) {
            console.error('无效的截图数据')
            return
        }

        const item = document.createElement('div')
        item.className = 'screenshot-item'
        
        const img = document.createElement('img')
        img.src = imageData
        img.onerror = () => {
            console.error('图片加载失败')
            item.remove()
        }
        
        const time = document.createElement('p')
        time.textContent = new Date().toLocaleString()
        
        const copyBtn = document.createElement('button')
        copyBtn.className = 'copy-btn'
        copyBtn.innerHTML = '复制'
        copyBtn.onclick = async () => {
            try {
                const success = await window.electronAPI.copyImageToClipboard(imageData)
                if (success) {
                    copyBtn.textContent = '已复制!'
                    setTimeout(() => {
                        copyBtn.textContent = '复制'
                    }, 2000)
                }
            } catch (err) {
                console.error('复制失败:', err)
            }
        }
        
        const footer = document.createElement('div')
        footer.className = 'screenshot-footer'
        footer.appendChild(time)
        footer.appendChild(copyBtn)
        
        item.appendChild(img)
        item.appendChild(footer)
        historyContainer.prepend(item)

        // 确保历史容器可见
        historyContainer.style.display = 'grid'
    }

    // 初始化
    await initConnectionInfo()
    updateConnectionStatus(false, 0)
    
    // 初始化时显示历史容器
    historyContainer.style.display = 'grid'
})
