"""
YanShu - API 路由
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..services.tree_service import (
    add_message_node,
    create_branch,
    create_tree,
    delete_node,
    delete_tree,
    export_tree,
    get_all_trees,
    get_context_info,
    get_node,
    get_path,
    get_tree,
    import_tree,
    list_trees_summary,
    move_node,
    search_nodes,
    switch_active_node,
    update_node_content,
    update_tree_info,
)
from ..models.models import (
    AICompletionRequest,
    AICompletionResponse,
    BranchCreate,
    BranchResponse,
    ConversationTree,
    ConversationTreeCreate,
    ConversationTreeResponse,
    ConversationTreeUpdate,
    MessageNode,
    MessageNodeUpdate,
    MoveNodeRequest,
    SearchQuery,
    SearchResult,
)

router = APIRouter(prefix="/api")


# ============ 树路由 ============

@router.get("/trees", response_model=List[ConversationTreeResponse])
async def api_list_trees(limit: int = 50, offset: int = 0):
    """获取对话树列表"""
    return list_trees_summary(limit=limit, offset=offset)


@router.post("/trees", response_model=ConversationTree)
async def api_create_tree(req: ConversationTreeCreate):
    """创建新对话树"""
    return create_tree(req)


@router.get("/trees/{tree_id}", response_model=ConversationTree)
async def api_get_tree(tree_id: str):
    """获取指定对话树"""
    tree = get_tree(tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return tree


@router.patch("/trees/{tree_id}", response_model=ConversationTree)
async def api_update_tree(tree_id: str, update: ConversationTreeUpdate):
    """更新对话树"""
    tree = update_tree_info(
        tree_id=tree_id,
        title=update.title,
        tags=update.tags,
        theme=update.theme,
    )
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return tree


@router.delete("/trees/{tree_id}")
async def api_delete_tree(tree_id: str):
    """删除对话树"""
    if not delete_tree(tree_id):
        raise HTTPException(status_code=404, detail="Tree not found")
    return {"status": "deleted"}


# ============ 节点路由 ============

@router.get("/trees/{tree_id}/nodes/{node_id}", response_model=MessageNode)
async def api_get_node(tree_id: str, node_id: str):
    """获取节点"""
    node = get_node(tree_id, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.get("/trees/{tree_id}/nodes/{node_id}/path")
async def api_get_node_path(tree_id: str, node_id: str):
    """获取从根到节点的路径"""
    path = get_path(tree_id, node_id)
    return {"path": path}


@router.get("/trees/{tree_id}/nodes/{node_id}/context")
async def api_get_node_context(tree_id: str, node_id: str):
    """获取节点上下文信息"""
    ctx = get_context_info(tree_id, node_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Node or tree not found")
    return ctx


@router.patch("/trees/{tree_id}/nodes/{node_id}", response_model=MessageNode)
async def api_update_node(tree_id: str, node_id: str, update: MessageNodeUpdate):
    """更新节点"""
    node = update_node_content(tree_id, node_id, update)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.delete("/trees/{tree_id}/nodes/{node_id}")
async def api_delete_node(tree_id: str, node_id: str):
    """删除节点"""
    if not delete_node(tree_id, node_id):
        raise HTTPException(status_code=404, detail="Node not found")
    return {"status": "deleted"}


@router.patch("/trees/{tree_id}/nodes/{node_id}/move", response_model=ConversationTree)
async def api_move_node(tree_id: str, node_id: str, req: MoveNodeRequest):
    """移动节点"""
    try:
        tree = move_node(tree_id, node_id, req.new_parent_id, req.position)
        if not tree:
            raise HTTPException(status_code=404, detail="Tree or node not found")
        return tree
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ 分支路由 ============

@router.post("/trees/{tree_id}/nodes/{node_id}/branch", response_model=BranchResponse)
async def api_create_branch(tree_id: str, node_id: str, req: BranchCreate):
    """从节点创建分支"""
    result = create_branch(tree_id, node_id, req)
    if not result:
        raise HTTPException(status_code=404, detail="Tree or node not found")
    return result


@router.post("/trees/{tree_id}/switch/{node_id}")
async def api_switch_node(tree_id: str, node_id: str):
    """切换活跃节点"""
    if not switch_active_node(tree_id, node_id):
        raise HTTPException(status_code=404, detail="Tree or node not found")
    return {"status": "ok", "active_node_id": node_id}


# ============ AI 路由 ============

@router.post("/ai/completion", response_model=AICompletionResponse)
async def api_ai_completion(req: AICompletionRequest):
    """发送消息并获取 AI 回复"""
    from ..services.tree_service import ai_completion
    
    result = await ai_completion(req)
    if not result:
        raise HTTPException(status_code=404, detail="Tree not found")
    return result


# ============ 搜索路由 ============

@router.post("/search")
async def api_search(query: SearchQuery):
    """搜索节点"""
    results = search_nodes(
        tree_id=query.tree_id,
        query=query.query,
        tags=query.tags,
        limit=query.limit,
    )
    return {
        "results": [
            SearchResult(node=node, score=score, tree_id=tree_id)
            for node, score, tree_id in results
        ]
    }


# ============ 导出/导入路由 ============

@router.get("/trees/{tree_id}/export")
async def api_export_tree(tree_id: str, format: str = "json"):
    """导出对话树"""
    result = export_tree(tree_id, format)
    if not result:
        raise HTTPException(status_code=404, detail="Tree not found")
    return result


@router.post("/import", response_model=ConversationTree)
async def api_import_tree(data: dict):
    """导入对话树"""
    tree = import_tree(data)
    if not tree:
        raise HTTPException(status_code=400, detail="Import failed")
    return tree


# ============ 辅助路由 ============

@router.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "service": "YanShu API"}
