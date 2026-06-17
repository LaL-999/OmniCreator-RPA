# 🚀 OmniCreator 控制台

> 面向个人创作者的**本地化 AI 内容运营调度中枢** —— 前后端分离的全栈 RPA 管理面板。

![License](https://img.shields.io/badge/license-MIT-6366f1.svg)
![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TailwindCSS-22d3ee.svg?logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python)

OmniCreator 控制台用一个深色科技风的可视化看板，统一编排六大社媒自动化任务（图文发帖、评论截流、私信回复、回关互动、视频混剪发布、混沌养号），并集成多账号环境管理、本地视频素材库、内容知识库与运行监控。后端基于 FastAPI + APScheduler 提供工业级定时调度，前端基于 React 18 + TailwindCSS 构建。

---

## ✨ 核心特性

- 🗓️ **工业级调度中心** —— 基于 `APScheduler`，支持「每天 10:00,15:00」「每隔 4 小时」「每周一、三、五 18:00」等中文规则，自动解析为 Cron / Interval 触发器，到点唤醒对应脚本。
- 🎛️ **可视化运营看板** —— 实时统计执行次数、成功率、活跃账号、风控告警；支持在线编辑调度规则并即时生效。
- 🧩 **六大自动化引擎配置** —— 每个引擎独立的矩阵账号队列、防封限流参数、AI 人设池与 System Prompt 编辑器，配置即时持久化到本地。
- 🖼️ **本地素材与知识库** —— 视频素材上传 / 分配 / 状态管理 + 低库存预警；话题与关键词知识库一键复制。
- 🎨 **深色科技仪表盘 UI** —— 统一设计令牌、玻璃拟态卡片、品牌光晕与微交互，全站响应式。

## 🛠️ 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 18 · TypeScript · Vite 5 · TailwindCSS 3 · lucide-react |
| 后端 | Python 3.10+ · FastAPI · Uvicorn · APScheduler |
| 数据 | 本地 JSON 持久化（`configs/`） |

## 📂 目录结构

```
zhiwern/
├─ start.bat                 # 一键启动器（Windows）
└─ omni-dashboard/
   ├─ main.py                # FastAPI 后端 + 调度引擎
   ├─ logger.py              # 脚本运行日志组件
   ├─ requirements.txt       # 后端依赖
   ├─ configs/               # 本地配置与运行数据（JSON）
   ├─ video_assets/          # 视频素材库
   └─ src/                   # React 前端
      ├─ pages/              # 看板 / 素材库 / 全局配置 / 知识库 / 六大脚本配置
      ├─ components/         # 布局与通用组件
      └─ utils/
```

## 🚀 快速开始

### 方式一：一键启动（推荐，Windows）

双击项目根目录的 **`start.bat`** 即可。脚本会自动：

1. 检测 Python / Node 环境；
2. 创建虚拟环境并安装后端依赖；
3. 安装前端依赖（首次）；
4. 同时启动后端（`:8000`）与前端（`:5173`），并自动打开浏览器。

> 前置条件：本机已安装 [Python 3.10+](https://www.python.org/downloads/) 与 [Node.js 16+](https://nodejs.org/)。

### 方式二：手动启动

```bash
cd omni-dashboard

# 后端
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# 前端（另开一个终端）
npm install
npm run dev
```

浏览器访问 <http://localhost:5173>。前端通过 Vite 代理将 `/api` 转发到后端 `:8000`。

## ⚠️ 免责声明

本项目仅作为 **全栈架构设计（FastAPI + React）、任务调度与 RPA 技术的学习交流参考**。其中六大自动化执行脚本（`AutoComment.py` 等）在公开仓库中为**脱敏占位文件**，不包含任何可直接运行的平台自动化逻辑。

严禁将本项目用于违反任何第三方平台用户协议的行为。因不当使用产生的一切后果由使用者自行承担。

## 📄 License

[MIT](https://opensource.org/licenses/MIT)
