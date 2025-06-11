document.addEventListener('DOMContentLoaded', () => {
    const canvasElement = document.getElementById('mobile-stream')
    const ctx = canvasElement.getContext('2d')
    // 设置canvas尺寸
    canvasElement.width = 1280
    canvasElement.height = 720
    const captureBtn = document.getElementById('capture-btn')
    const resolutionSelect = document.getElementById('resolution')
    const qrcodeContainer = document.getElementById('qrcode')
    const historyContainer = document.getElementById('screenshot-history')

    // 获取并显示二维码
    fetch('http://localhost:3001/qrcode')
        .then(response => response.text())
        .then(html => {
            qrcodeContainer.innerHTML = html
        })

    // 优化渲染性能
    let lastRenderTime = 0
    let pendingFrame = null
    
    const renderFrame = () => {
        if (pendingFrame) {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
            ctx.drawImage(pendingFrame, 0, 0, canvasElement.width, canvasElement.height)
            pendingFrame = null
        }
        requestAnimationFrame(renderFrame)
    }
    renderFrame()

    // 简化渲染逻辑
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
                console.log(`尝试${formats[currentFormat]}格式，ObjectURL:`, objectUrl)
                img.src = objectUrl
            }
            
            tryLoadImage()
        } catch (e) {
            console.error('处理视频数据异常:', e)
        }
    })

    // 截图功能
    captureBtn.addEventListener('click', async () => {
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
        console.log('截图已保存:', result.path)
        addToHistory(result.data)
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

    // 初始化时显示历史容器
    historyContainer.style.display = 'grid'
})
