# 手机摄像头扫描仪 - 移动端

这是手机摄像头扫描仪的移动端应用，需要部署到支持HTTPS的静态托管服务上。

## 部署方式

### 1. GitHub Pages
1. 将此文件夹内容推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择部署分支（通常是main或gh-pages）
4. 获得HTTPS访问地址，如：`https://username.github.io/repository-name/`

### 2. Netlify
1. 将此文件夹拖拽到Netlify部署页面
2. 或连接GitHub仓库进行自动部署
3. 获得HTTPS访问地址

### 3. Vercel
1. 使用Vercel CLI或网页界面部署
2. 自动获得HTTPS访问地址

## 使用方法

1. 部署完成后，记录HTTPS访问地址
2. 在PC端配置中设置此地址作为手机端URL
3. 手机扫描PC端生成的二维码即可连接
4. 也可以在手机端手动输入WebSocket连接信息

## URL参数说明

移动端支持以下URL参数：
- `wsHost`: WebSocket服务器地址（PC端IP地址）
- `wsPort`: WebSocket服务器端口（默认3002）
- `width`: 视频宽度（默认1280）
- `height`: 视频高度（默认720）

示例：
```
https://your-mobile-app.com/?wsHost=192.168.1.100&wsPort=3002&width=1280&height=720
```

## 技术要求

- 需要HTTPS协议才能访问摄像头
- 支持WebRTC的现代浏览器
- 移动设备需要有后置摄像头