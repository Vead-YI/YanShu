# 言枢 YanShu

<div align="center">

**言为枢，心为机**

*A Branching Conversation Interface for AI*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek-purple.svg)](https://deepseek.com/)

</div>

---

## 🧠 核心理念

> **言为枢，心为机 — 言语是思维的枢纽**

**问题：** 人类思维本质上是**非线性的**，但现有 AI 聊天都是线性对话。

**解决：** 言枢将对话从「一条铁轨」变成「一棵生长思维之树」。

```
传统聊天：
A → B → C → D → E → F → ...

言枢：
                   A
                  / \
                 B   C
                /|\   \
               D E F   G
```

**一句话总结：对话不再是时间流，而是认知空间。**

---

## ✨ 功能特性

### 🌳 核心功能

| 功能 | 描述 |
|------|------|
| 🌳 **树状对话** | 告别线性，从任意节点创建分支 |
| 🔀 **分支探索** | 像 Git 一样管理你的思维分支 |
| 📍 **快速导航** | 面包屑路径 + 树状可视化 |
| 🧠 **智能上下文** | 完整继承 / 摘要模式 / 冷启动 |
| 🏷️ **标签系统** | 给节点打标签，全局搜索 |

### 🆕 最新更新 (v0.2)

| 功能 | 描述 |
|------|------|
| ✏️ **节点重命名** | 双击节点标题即可编辑 |
| ⌨️ **快捷键** | `Ctrl+B` 新建分支, `Ctrl+N` 新对话等 |
| 🔍 **全局搜索** | 搜索所有对话内容 |
| 🎛️ **完整设置** | API Key、主题、上下文模式 |
| 🎨 **主题切换** | 暗色/亮色模式 |
| 📥 **导出功能** | 导出对话为 JSON/Markdown |
| 🗑️ **删除确认** | 删除前二次确认 |

---

## 🚀 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- DeepSeek API Key

### 1. 克隆项目

```bash
git clone https://github.com/Vead-YI/YanShu.git
cd YanShu
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 设置 API Key
export DEEPSEEK_API_KEY="your-api-key"

# 启动服务器
uvicorn backend.main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 4. 打开浏览器

访问 [http://localhost:5173](http://localhost:5173)

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + N` | 新建对话 |
| `Ctrl/Cmd + B` | 从当前节点创建分支 |
| `Ctrl/Cmd + Enter` | 发送消息 |
| `Ctrl/Cmd + K` | 打开全局搜索 |
| `Ctrl/Cmd + ,` | 打开设置 |
| `Escape` | 关闭弹窗 |

---

## 🎯 使用场景

### 学术研究

```
📚 论文研究
├── 📄 Transformer 论文
│   ├── Self-Attention 机制
│   │   ├── Multi-Head Attention
│   │   └── 与 CNN 对比
│   └── 位置编码
│       ├── 绝对位置编码
│       └── 相对位置编码
└── 📄 BERT 论文
    ├── 预训练任务
    └── 下游任务
```

### 代码调试

```
🐛 Bug 排查
├── 尝试方案 A
│   ├── 成功但性能差
│   └── 放弃原因
├── 尝试方案 B
│   └── ✅ 最终方案
└── 📝 经验总结
```

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (React + TypeScript)                 │
│                                                                  │
│   ┌────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│   │  🌳 森林导航 │    │   💬 聊天界面  │    │   📋 节点详情   │   │
│   └────────────┘    └──────────────┘    └─────────────────┘   │
│                                                                  │
│                    Zustand (状态管理)                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API
┌──────────────────────────────▼──────────────────────────────────┐
│                        后端 (FastAPI + Python)                   │
│                                                                  │
│   ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│   │  🌳 枢服务   │  │   🤖 AI 服务   │  │   🔍 搜索服务       │  │
│   └─────────────┘  └──────────────┘  └─────────────────────┘  │
│                                                                  │
│                    SQLite / PostgreSQL                            │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 状态管理 | Zustand |
| UI 组件 | Tailwind CSS |
| 后端框架 | FastAPI |
| 数据库 | SQLite (开发) |
| AI 集成 | DeepSeek API |

---

## 🔮 未来规划

### 近期 (v0.3-v0.4)
- [ ] 节点拖拽功能
- [ ] 导出为 Markdown
- [ ] 键盘快捷键优化

### 中期 (v1.0)
- [ ] Context Compression
- [ ] 知识图谱集成
- [ ] 分支对比视图

### 长期
- [ ] 学术论文发表
- [ ] 多人协作
- [ ] 认知效率分析

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 👤 作者

**Zuyang Li** — PhD 申请者，MLIP 研究方向

[![GitHub](https://img.shields.io/badge/GitHub-Vead--YI-blue.svg)](https://github.com/Vead-YI)

---

<div align="center">

**言为枢，心为机 — 让思维自由生长**

</div>
