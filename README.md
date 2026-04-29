\# 🚀 OmniCreator-RPA: 个人创作者的 AI 自动化调度框架



!\[License](https://img.shields.io/badge/license-MIT-blue.svg)

!\[React](https://img.shields.io/badge/Frontend-React%20%7C%20TailwindCSS-61DAFB.svg?logo=react)

!\[FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)

!\[Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python)

!\[Status](https://img.shields.io/badge/Status-Active\_Development-success.svg)



> \*\*OmniCreator-RPA\*\* 是一个专为个人创作者和独立开发者打造的\*\*本地化 AI 内容管理与自动化操作框架\*\*。

> 结合了现代化的前后端分离架构（React + FastAPI）与强大的本地任务调度引擎，致力于释放创作者的生产力，将繁琐的跨域内容管理、多媒体素材处理及日常社交互动统统交由系统自动化流转。



\## ✨ 核心特性 (Features)



\* 🎭 \*\*多身份环境隔离与统一调度中心\*\*

&#x20;   \* 内置轻量级指纹模拟与本地环境沙盒，支持多组账号/身份凭证的无缝切换与状态隔离。

&#x20;   \* 基于 `APScheduler` 构建的高级任务调度器，支持 Cron 表达式，轻松实现跨时区、分布式的自动化任务分发。

\* 🤖 \*\*基于自然语言理解的社交互动辅助模块\*\*

&#x20;   \* 不再是生硬的机器回复。接入大语言模型（LLM），根据上下文语义智能生成互动回复建议。

&#x20;   \* 提供灵活的钩子（Hooks），可自动化辅助处理日常消息流转与粉丝互动，打造有温度的数字分身。

\* 🎬 \*\*本地多媒体素材智能批处理流水线\*\*

&#x20;   \* 集成 `Whisper AI` 等领先模型，支持本地音视频的自动化转录、切片与重组。

&#x20;   \* 提供工作流引擎，将繁琐的“导入-剪辑-导出”标准化，一键完成多媒体素材的去重、混排与批量生成。

\* ⚡ \*\*开箱即用的现代化全栈架构\*\*

&#x20;   \* \*\*Frontend:\*\* React + TailwindCSS 构建的极客风交互看板，提供直观的节点状态监控与任务编排。

&#x20;   \* \*\*Backend:\*\* FastAPI 提供极致的异步并发性能， SQLite/JSON 实现轻量级、免部署的本地数据持久化。



\## 🛠️ 技术栈速览 (Tech Stack)



\* \*\*前端:\*\* React 18, Vite, TailwindCSS, Zustand

\* \*\*后端:\*\* Python 3.10+, FastAPI, Uvicorn

\* \*\*引擎:\*\* APScheduler (任务编排), OpenAI Whisper (多媒体解析), Playwright/Selenium (可选, Web 驱动)

\* \*\*数据:\*\* SQLite (结构化存储), JSON (轻量级配置)



\## 🚀 快速开始 (Quick Start)



\### 1. 环境准备

确保您的计算机已安装 \[Node.js](https://nodejs.org/) (v16+) 和 \[Python](https://www.python.org/) (3.10+)。



\### 2. 克隆项目

```bash

git clone \[https://github.com/YourName/OmniCreator-RPA.git](https://github.com/YourName/OmniCreator-RPA.git)

cd OmniCreator-RPA

###3. 后端服务启动

Bash

cd backend

python -m venv venv

source venv/bin/activate  # Windows 用户请使用 venv\\Scripts\\activate

pip install -r requirements.txt

uvicorn main:app --reload --port 8000

4\. 前端看板启动

Bash

cd frontend

npm install

npm run dev

打开浏览器访问 http://localhost:5173 即可进入 OmniCreator-RPA 控制中心。



⚠️ 免责声明 (Disclaimer)

学习与交流目的： 本项目仅作为 Python Web 自动化、全栈架构设计（FastAPI + React）以及 RPA 技术的学习交流参考。



禁止非法滥用： 严禁将本项目应用于任何违反第三方平台《用户服务协议》的商业营销、恶意抓取、垃圾信息群发等行为。



责任自负： 因使用者不当使用本项目产生的任何直接或间接的法律后果及连带责任，均由使用者自行承担，项目作者概不负责。



🎁 获取完整核心引擎 (Core Engine Access)

为了贯彻开源社区的安全规范，并防止核心 RPA 底层驱动接口被恶意滥用，目前 GitHub 仓库仅开源了中控看板（前端）、基础调度架构及部分脱敏模块。



完整的 多环境隔离沙盒 与 高并发互动辅助核心执行脚本 未在公共仓库提供。



如果您是高校开发者或 RPA 技术研究人员，对完整底层源码感兴趣：

👉 请添加微信：\[您的微信号/公众号]

👉 发送暗号：【核心代码】

即可获取完整版技术文档与引擎包接入权限，欢迎技术同好交流切磋！

