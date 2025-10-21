# Camera Scanner PC客户端部署说明

## GitHub Actions 自动构建和发布流程

本项目已配置了完整的GitHub Actions工作流程，用于自动构建Windows和macOS版本的PC客户端应用程序，并发布到GitHub Releases。

## 工作流程文件

### `.github/workflows/build-release.yml`
主要的构建和发布工作流程，包含以下功能：
- 支持Windows和macOS平台的并行构建
- 自动生成安装包（Windows: .exe, .msi | macOS: .dmg, .zip）
- 自动发布到GitHub Releases
- 支持标签触发和手动触发

## 触发方式

### 1. 标签触发（推荐）
当推送带有版本标签的提交时自动触发：
```bash
# 创建并推送版本标签
git tag v1.0.0
git push origin v1.0.0
```

### 2. 手动触发
在GitHub仓库的Actions页面手动运行工作流程：
1. 访问仓库的Actions页面
2. 选择"Build and Release PC Client"工作流程
3. 点击"Run workflow"
4. 输入版本号（如：1.0.0）
5. 点击"Run workflow"按钮

## 构建产物

### Windows平台
- `camera-scanner-{version}-win-setup.exe` - NSIS安装程序
- `camera-scanner-{version}-win.msi` - MSI安装程序

### macOS平台
- `camera-scanner-{version}-mac.dmg` - DMG磁盘映像
- `camera-scanner-{version}-mac.zip` - ZIP压缩包

## 配置说明

### package.json配置
已更新的构建脚本：
- `npm run build:win` - 构建Windows版本
- `npm run build:mac` - 构建macOS版本
- `npm run build` - 构建所有平台版本

### electron-builder配置
在`pc-client/package.json`中的`build`字段包含：
- 应用程序信息（appId, productName）
- 平台特定配置（Windows, macOS, Linux）
- 图标文件路径
- 安装程序选项

## 图标文件

### 当前状态
- `pc-client/assets/icon.svg` - SVG格式的主图标文件

### 需要生成的图标文件
为了完整支持所有平台，需要生成以下格式的图标：
- `pc-client/assets/icon.ico` - Windows图标
- `pc-client/assets/icon.icns` - macOS图标  
- `pc-client/assets/icon.png` - Linux图标

详细的图标生成说明请参考：`pc-client/assets/README.md`

## 发布流程

1. **准备发布**
   - 确保代码已提交并推送到主分支
   - 更新版本号（如需要）
   - 确保所有图标文件已生成

2. **创建发布**
   - 方式一：推送版本标签
   - 方式二：手动触发工作流程

3. **监控构建**
   - 在Actions页面查看构建进度
   - 检查构建日志确保无错误

4. **验证发布**
   - 检查GitHub Releases页面
   - 下载并测试生成的安装包

## 故障排除

### 常见问题

1. **构建失败 - 缺少图标文件**
   - 确保`pc-client/assets/`目录下存在所需的图标文件
   - 参考图标生成说明创建缺失的图标

2. **权限错误**
   - 确保仓库设置中启用了Actions
   - 检查GITHUB_TOKEN权限

3. **构建超时**
   - 检查依赖项是否正确
   - 确保package.json中的脚本命令正确

### 调试步骤

1. 查看Actions页面的构建日志
2. 检查具体的错误信息
3. 验证本地构建是否正常：
   ```bash
   cd pc-client
   npm install
   npm run build:win  # Windows
   npm run build:mac  # macOS
   ```

## 本地测试

在推送到GitHub之前，建议先在本地测试构建：

```bash
# 进入PC客户端目录
cd pc-client

# 安装依赖
npm install

# 测试Windows构建（需要在Windows系统或使用Wine）
npm run build:win

# 测试macOS构建（需要在macOS系统）
npm run build:mac

# 运行应用程序测试
npm start
```

## 版本管理

建议使用语义化版本号：
- `v1.0.0` - 主要版本
- `v1.1.0` - 次要版本（新功能）
- `v1.0.1` - 补丁版本（bug修复）

每次发布前确保更新`pc-client/package.json`中的版本号。