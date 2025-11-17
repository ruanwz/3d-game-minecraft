# 3D Minecraft - 网页版我的世界

一个基于 Web 的 Minecraft 克隆游戏，使用 Three.js 构建。

## 特性

- ✨ 3D 体素世界渲染
- 🎮 第一人称视角控制
- 🌍 程序化地形生成
- 🚀 基于区块的世界系统
- 💨 流畅的 60 FPS 性能目标

## 技术栈

- **Three.js** - WebGL 3D 图形引擎
- **TypeScript** - 类型安全开发
- **Vite** - 快速的开发构建工具
- **Cannon-es** - 物理引擎（待集成）

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

浏览器会自动打开 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 游戏操作

- **点击屏幕** - 开始游戏（锁定鼠标指针）
- **W/A/S/D** - 前后左右移动
- **空格** - 向上飞行
- **Shift** - 向下飞行
- **鼠标移动** - 环顾四周
- **ESC** - 退出指针锁定

## 项目结构

```
src/
├── core/           # 核心游戏引擎
│   ├── engine.ts   # 主游戏循环
│   ├── renderer.ts # Three.js 渲染器
│   ├── camera.ts   # 相机控制器
│   └── input.ts    # 输入管理
├── world/          # 世界管理
│   ├── chunk.ts    # 区块系统
│   └── block.ts    # 方块定义
├── utils/          # 工具函数
│   └── constants.ts # 游戏常量
└── main.ts         # 应用入口
```

## 开发计划

### ✅ Phase 1: 核心引擎
- [x] Three.js 渲染器设置
- [x] 基础相机控制
- [x] 游戏循环系统
- [x] 区块生成系统

### 🚧 Phase 2: 地形优化
- [ ] Perlin 噪声地形生成
- [ ] 贪婪网格算法优化
- [ ] 区块 LOD 系统
- [ ] 视锥剔除优化

### 📋 Phase 3: 玩家交互
- [ ] 物理碰撞检测
- [ ] 方块破坏/放置
- [ ] 物品栏系统
- [ ] 基础 UI/HUD 改进

### 📋 Phase 4: 高级特性
- [ ] 纹理系统
- [ ] 光照和阴影优化
- [ ] 音效系统
- [ ] 多人游戏支持

## 性能目标

- **帧率**: 60 FPS 最低
- **区块加载**: < 16ms 每区块（异步）
- **内存**: < 500MB（8 区块渲染距离）
- **初始加载**: < 3 秒

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**开发状态**: 🚧 初期开发阶段

有关更多开发信息，请查看 [CLAUDE.md](./CLAUDE.md)
