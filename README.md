# 手机摄像头扫描仪

一个基于Electron和Web技术的手机摄像头扫描仪应用，支持PC端和手机端分离部署。

## 🏗️ 新架构设计

### 架构概述
本项目采用分离式架构设计，将PC端和手机端完全分开部署：

- **PC端**: Electron桌面应用，作为接收端显示手机摄像头画面
- **手机端**: 纯Web应用，部署到HTTPS静态服务，作为摄像头数据发送端
- **通信协议**: WebSocket实现实时双向通信

### 部署架构图
```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   PC端 (本地)    │ ←──────────────→ │ 手机端 (HTTPS)   │
│                │                  │                │
│ • Electron应用  │                  │ • 静态Web应用    │
│ • WebSocket服务 │                  │ • 摄像头访问     │
│ • 二维码生成    │                  │ • 视频流发送     │
│ • 截图保存      │                  │ • 参数化连接     │
└─────────────────┘                  └─────────────────┘
```

### 连接流程
1. **PC端启动** → 显示本机IP和WebSocket端口信息
2. **配置手机端URL** → 用户输入已部署的手机端HTTPS地址
3. **生成二维码** → 包含手机端URL和WebSocket连接参数
4. **手机端连接** → 扫描二维码或手动输入连接信息
5. **建立通信** → WebSocket连接成功，开始视频传输

## 📁 项目结构

```
camera-scanner/
├── pc-client/              # PC端应用
│   ├── main.js            # Electron主进程
│   ├── preload.js         # 预加载脚本
│   ├── package.json       # PC端依赖配置
│   ├── renderer/          # 渲染进程
│   │   ├── index.html     # 主界面
│   │   ├── renderer.js    # 前端逻辑
│   │   └── style.css      # 样式文件
│   └── README.md          # PC端说明文档
├── mobile-client/          # 手机端应用
│   ├── index.html         # 手机端页面
│   ├── package.json       # 手机端配置
│   └── README.md          # 手机端说明文档
└── README.md              # 项目总体说明
```

## 🚀 快速开始

### 1. 部署手机端
```bash
# 进入手机端目录
cd mobile-client

# 部署到GitHub Pages、Netlify、Vercel等HTTPS服务
# 获得类似 https://your-username.github.io/camera-scanner 的地址
```

### 2. 启动PC端
```bash
# 进入PC端目录
cd pc-client

# 安装依赖
npm install

# 启动应用
npm start
```

### 3. 配置连接
1. 在PC端界面输入手机端的HTTPS部署地址
2. 点击"更新"按钮保存配置
3. 手机扫描生成的二维码或手动输入连接信息

## ✨ 主要特性

### PC端功能
- 🖥️ **实时视频显示**: 接收并显示手机摄像头画面
- 📱 **连接状态管理**: 实时显示连接状态和设备数量
- 🔧 **灵活配置**: 支持自定义手机端URL和连接参数
- 📸 **截图功能**: 一键截图并保存到本地
- 📋 **历史记录**: 查看和管理截图历史
- 🎯 **分辨率设置**: 支持多种视频分辨率选择

### 手机端功能
- 📷 **摄像头访问**: 使用后置摄像头进行扫描
- 🔗 **参数化连接**: 通过URL参数自动配置连接信息
- ✋ **手动连接**: 支持手动输入WebSocket连接信息
- 📱 **响应式设计**: 适配各种手机屏幕尺寸
- 🔒 **安全连接**: 要求HTTPS协议保证安全性

## 🛠️ 技术栈

### PC端
- **Electron**: 跨平台桌面应用框架
- **Node.js**: 后端运行时环境
- **WebSocket**: 实时通信协议
- **Express**: HTTP服务器（用于二维码生成）
- **QRCode**: 二维码生成库

### 手机端
- **HTML5**: 现代Web标准
- **WebRTC**: 摄像头访问API
- **WebSocket**: 实时通信协议
- **Canvas API**: 视频帧处理
- **响应式CSS**: 移动端适配

## 🔧 配置说明

### 网络要求
- PC端和手机端需要在**同一局域网**内
- 手机端必须使用**HTTPS协议**访问
- 确保WebSocket端口（默认3002）未被防火墙阻止

### 浏览器兼容性
- **Chrome/Safari**: 完全支持
- **Firefox**: 支持（可能需要手动授权摄像头）
- **Edge**: 支持
- **移动端浏览器**: 需要支持WebRTC的现代浏览器

## 📋 部署指南

### 手机端部署选项

#### GitHub Pages
1. 将mobile-client内容推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 获得 `https://username.github.io/repository-name/` 地址

#### Netlify
1. 拖拽mobile-client文件夹到Netlify
2. 或连接GitHub仓库自动部署
3. 获得自定义域名或Netlify提供的HTTPS地址

#### Vercel
1. 使用Vercel CLI或网页部署
2. 自动获得HTTPS访问地址

### PC端打包
```bash
cd pc-client
npm run package
```

## 🐛 故障排除

### 常见问题
1. **手机无法访问摄像头**
   - 确认使用HTTPS协议
   - 检查浏览器权限设置
   - 尝试刷新页面重新授权

2. **WebSocket连接失败**
   - 确认PC端和手机在同一网络
   - 检查防火墙设置
   - 验证端口是否被占用

3. **二维码无法生成**
   - 检查手机端URL配置是否正确
   - 确认HTTP服务器正常运行

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

### 开发环境设置
1. Fork本仓库
2. 创建功能分支
3. 进行开发和测试
4. 提交Pull Request

## 📄 许可证

本项目采用 ISC 许可证。

## 🔄 版本历史

### v2.0.0 (当前版本)
- 🎉 全新分离式架构设计
- 📱 手机端独立部署支持
- 🔧 灵活的连接配置
- 🎨 全新的用户界面设计
- 📋 完善的文档和部署指南

### v1.0.0 (旧版本)
- 基础的一体化架构
- 本地HTTP服务器部署
