"""
YanShu - FastAPI 应用入口
🌳 让思维像森林一样生长
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.api import router

# 创建应用
app = FastAPI(
    title="YanShu API",
    description="🌳 树状对话系统 API - 让 AI 对话从铁轨变成森林",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router)


@app.get("/")
async def root():
    return {
        "name": "YanShu API",
        "version": "0.2.0",
        "description": "🌳 树状对话系统 - 让思维像森林一样生长",
        "docs": "/docs",
    }


@app.on_event("startup")
async def startup():
    print("🌳 YanShu API 启动中...")
    print("📖 文档地址: http://localhost:8000/docs")
    print("✅ CORS 已启用")


@app.on_event("shutdown")
async def shutdown():
    print("👋 YanShu API 已关闭")
