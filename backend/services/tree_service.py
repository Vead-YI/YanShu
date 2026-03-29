"""
YanShu - 树服务
核心业务逻辑
"""

import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from ..database.db import (
    add_node,
    create_branch as db_create_branch,
    create_tree as db_create_tree,
    delete_node as db_delete_node,
    delete_tree as db_delete_tree,
    get_all_trees as db_get_all_trees,
    get_tree as db_get_tree,
    update_node as db_update_node,
    update_tree as db_update_tree,
)
from ..models.models import (
    AICompletionRequest,
    AICompletionResponse,
    BranchCreate,
    BranchResponse,
    ContextInfo,
    ContextMode,
    ConversationTree,
    ConversationTreeCreate,
    ConversationTreeResponse,
    MessageNode,
    MessageNodeCreate,
    MessageNodeUpdate,
    get_node_path,
)
from .ai_service import generate_completion, generate_summary, generate_title


# ============ 树操作 ============

def create_tree(req: ConversationTreeCreate) -> ConversationTree:
    """创建新对话树"""
    title = req.title
    
    if not title or title == "新对话":
        # 如果提供了初始消息，生成标题
        if req.initial_message:
            import asyncio
            try:
                title = asyncio.run(generate_title(req.initial_message))
            except:
                title = "新对话"
        else:
            title = "新对话"
    
    tree = db_create_tree(
        title=title,
        initial_message=req.initial_message,
        tags=req.tags,
    )
    
    return tree


def get_tree(tree_id: str) -> Optional[ConversationTree]:
    """获取对话树"""
    return db_get_tree(tree_id)


def get_all_trees(limit: int = 50, offset: int = 0) -> List[ConversationTree]:
    """获取所有对话树"""
    return db_get_all_trees(limit=limit, offset=offset)


def update_tree_info(tree_id: str, title: Optional[str] = None, tags: Optional[List[str]] = None, theme: Optional[str] = None) -> Optional[ConversationTree]:
    """更新对话树信息"""
    tree = db_get_tree(tree_id)
    if not tree:
        return None
    
    if title is not None:
        tree.title = title
    if tags is not None:
        tree.tags = tags
    if theme is not None:
        tree.theme = theme
    tree.updated_at = datetime.utcnow()
    
    if db_update_tree(tree):
        return tree
    return None


def delete_tree(tree_id: str) -> bool:
    """删除对话树"""
    return db_delete_tree(tree_id)


def list_trees_summary(limit: int = 50, offset: int = 0) -> List[ConversationTreeResponse]:
    """获取对话树列表摘要"""
    trees = db_get_all_trees(limit=limit, offset=offset)
    
    summaries = []
    for tree in trees:
        summaries.append(ConversationTreeResponse(
            id=tree.id,
            title=tree.title,
            root_id=tree.root_id,
            active_node_id=tree.active_node_id,
            node_count=len(tree.nodes),
            created_at=tree.created_at,
            updated_at=tree.updated_at,
            tags=tree.tags,
            theme=getattr(tree, 'theme', 'dark'),
        ))
    
    return summaries


# ============ 节点操作 ============

def add_message_node(tree_id: str, parent_id: Optional[str], role: str, content: str, tags: List[str] = None, title: Optional[str] = None) -> Optional[MessageNode]:
    """添加消息节点"""
    from ..models.models import Role as RoleEnum
    role_enum = RoleEnum(role) if isinstance(role, str) else role
    
    return add_node(
        tree_id=tree_id,
        parent_id=parent_id,
        role=role_enum,
        content=content,
        tags=tags,
        title=title,
        is_checkpoint=False,
    )


def update_node_content(tree_id: str, node_id: str, update: MessageNodeUpdate) -> Optional[MessageNode]:
    """更新节点"""
    kwargs = {}
    fields_set = getattr(update, "model_fields_set", set())
    if update.content is not None:
        kwargs["content"] = update.content
    if update.title is not None:
        kwargs["title"] = update.title
    if update.is_checkpoint is not None:
        kwargs["is_checkpoint"] = update.is_checkpoint
    if "checkpoint_parent_id" in fields_set:
        kwargs["checkpoint_parent_id"] = update.checkpoint_parent_id
    if update.checkpoint_order is not None:
        kwargs["checkpoint_order"] = update.checkpoint_order
    if update.summary is not None:
        kwargs["summary"] = update.summary
    if update.tags is not None:
        kwargs["tags"] = update.tags
    if update.position is not None:
        kwargs["position"] = update.position
    
    if kwargs:
        return db_update_node(tree_id, node_id, **kwargs)
    return None


def delete_node(tree_id: str, node_id: str) -> bool:
    """删除节点"""
    return db_delete_node(tree_id, node_id)


def get_node(tree_id: str, node_id: str) -> Optional[MessageNode]:
    """获取指定节点"""
    tree = db_get_tree(tree_id)
    if not tree:
        return None
    return tree.nodes.get(node_id)


def get_path(tree_id: str, node_id: str) -> List[MessageNode]:
    """获取从根到节点的路径"""
    tree = db_get_tree(tree_id)
    if not tree:
        return []
    return get_node_path(tree, node_id)


def get_context_info(tree_id: str, node_id: str) -> Optional[ContextInfo]:
    """获取上下文信息"""
    tree = db_get_tree(tree_id)
    if not tree or node_id not in tree.nodes:
        return None
    
    path = get_node_path(tree, node_id)
    
    # 估算 token
    from ..models.models import build_context_messages, estimate_tokens
    messages = build_context_messages(tree, node_id, ContextMode.FULL)
    estimated_tokens = estimate_tokens(messages)
    
    return ContextInfo(
        node_id=node_id,
        path=path,
        mode=ContextMode.FULL,
        message_count=len(path),
        estimated_tokens=estimated_tokens,
    )


def move_node(tree_id: str, node_id: str, new_parent_id: Optional[str], position: int = 0) -> Optional[ConversationTree]:
    """移动节点到新的父节点"""
    tree = db_get_tree(tree_id)
    if not tree or node_id not in tree.nodes:
        return None
    
    node = tree.nodes[node_id]
    old_parent_id = node.parent_id
    
    # 如果移动到自身或其子节点下，拒绝（防止循环）
    if new_parent_id:
        check_node = tree.nodes.get(new_parent_id)
        while check_node:
            if check_node.id == node_id:
                raise ValueError("Cannot move node to its own child")
            check_node = tree.nodes.get(check_node.parent_id) if check_node.parent_id else None
    
    # 从旧父节点移除
    if old_parent_id and old_parent_id in tree.nodes:
        old_parent = tree.nodes[old_parent_id]
        old_parent.children = [c for c in old_parent.children if c != node_id]
    
    # 添加到新父节点
    if new_parent_id and new_parent_id in tree.nodes:
        new_parent = tree.nodes[new_parent_id]
        new_parent.children.insert(position, node_id)
    
    # 更新节点
    node.parent_id = new_parent_id
    node.position = position
    node.updated_at = datetime.utcnow()
    
    tree.updated_at = datetime.utcnow()
    db_update_tree(tree)
    
    return tree


# ============ 分支操作 ============

def create_branch(tree_id: str, from_node_id: str, req: BranchCreate) -> Optional[BranchResponse]:
    """从指定节点创建分支"""
    # 创建分支节点
    new_node = db_create_branch(
        tree_id=tree_id,
        from_node_id=from_node_id,
        title=req.title,
        context_mode=req.context_mode,
        initial_message=req.initial_message,
    )
    
    if not new_node:
        return None
    
    # 获取路径
    tree = db_get_tree(tree_id)
    path = get_node_path(tree, new_node.id) if tree else []
    
    return BranchResponse(
        new_node_id=new_node.id,
        tree_id=tree_id,
        parent_id=from_node_id,
        title=req.title,
        context_mode=req.context_mode,
        tags=req.tags or [],
        path=[n.id for n in path],
    )


def switch_active_node(tree_id: str, node_id: str) -> bool:
    """切换活跃节点"""
    tree = db_get_tree(tree_id)
    if not tree or node_id not in tree.nodes:
        return False
    
    tree.active_node_id = node_id
    tree.updated_at = datetime.utcnow()
    
    return db_update_tree(tree)


# ============ AI 操作 ============

async def ai_completion(req: AICompletionRequest) -> Optional[AICompletionResponse]:
    """处理 AI 对话请求"""
    tree = db_get_tree(req.tree_id)
    if not tree:
        return None
    
    # 确定父节点
    parent_id = req.node_id or tree.active_node_id
    
    # 生成节点标题
    try:
        node_title = await generate_node_title(req.message)
    except:
        node_title = None
    
    # 添加用户消息节点
    user_node = add_node(
        tree_id=req.tree_id,
        parent_id=parent_id,
        role="user",
        content=req.message,
        title=node_title,
        is_checkpoint=False,
    )
    
    if not user_node:
        return None
    
    # 生成 AI 回复
    try:
        assistant_message, usage = await generate_completion(
            tree=tree,
            node_id=parent_id,
            user_message=req.message,
            context_mode=req.context_mode,
            system_prompt=req.system_prompt,
        )
    except Exception as e:
        # 删除用户节点
        db_delete_node(req.tree_id, user_node.id)
        raise Exception(f"AI 服务错误: {str(e)}")
    
    # 添加 AI 回复节点
    assistant_node = add_node(
        tree_id=req.tree_id,
        parent_id=user_node.id,
        role="assistant",
        content=assistant_message,
        title="AI 回复",
        is_checkpoint=False,
    )
    
    if not assistant_node:
        return None
    
    # 如果需要，生成摘要（异步，不阻塞）
    if len(tree.nodes) % 5 == 0:
        try:
            path = get_node_path(tree, assistant_node.id)
            summary = await generate_summary([
                {"role": n.role, "content": n.content}
                for n in path[-5:]
            ])
            if summary:
                db_update_node(req.tree_id, assistant_node.id, summary=summary)
        except Exception:
            pass
    
    return AICompletionResponse(
        user_node_id=user_node.id,
        assistant_node_id=assistant_node.id,
        tree_id=req.tree_id,
        usage=usage,
    )


# ============ 搜索操作 ============

def search_nodes(tree_id: Optional[str], query: str, tags: Optional[List[str]] = None, limit: int = 20) -> List[Tuple[MessageNode, float, str]]:
    """搜索节点（简单实现，后续可升级为向量搜索）"""
    results = []
    query_lower = query.lower()
    
    trees = [db_get_tree(tree_id)] if tree_id else db_get_all_trees(limit=100)
    
    for tree in trees:
        if not tree:
            continue
        
        for node in tree.nodes.values():
            # 文本匹配
            score = 0.0
            content_lower = node.content.lower()
            title_lower = (node.title or "").lower()
            
            if query_lower in content_lower:
                score = 0.8
            elif query_lower in title_lower:
                score = 0.9
            elif query_lower in node.summary.lower() if node.summary else False:
                score = 0.6
            
            # 标签匹配
            if tags:
                if any(tag in node.tags for tag in tags):
                    score = max(score, 0.7)
            
            if score > 0:
                results.append((node, score, tree.id))
    
    # 按分数排序
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:limit]


# ============ 导出/导入 ============

def export_tree(tree_id: str, format: str = "json") -> Optional[Dict]:
    """导出对话树"""
    tree = db_get_tree(tree_id)
    if not tree:
        return None
    
    if format == "json":
        return {
            "id": tree.id,
            "title": tree.title,
            "created_at": tree.created_at.isoformat(),
            "updated_at": tree.updated_at.isoformat(),
            "tags": tree.tags,
            "nodes": [
                {
                    "id": node.id,
                    "parent_id": node.parent_id,
                    "children": node.children,
                    "role": node.role,
                    "content": node.content,
                    "title": getattr(node, 'title', None),
                    "summary": node.summary,
                    "tags": node.tags,
                    "created_at": node.created_at.isoformat(),
                }
                for node in tree.nodes.values()
            ],
        }
    
    elif format == "markdown":
        # 生成 Markdown 格式
        lines = [f"# {tree.title}\n"]
        lines.append(f"创建时间: {tree.created_at}\n")
        
        if tree.tags:
            lines.append(f"标签: {', '.join(tree.tags)}\n")
        
        lines.append("\n---\n\n")
        
        def render_node(node_id: str, depth: int = 0):
            node = tree.nodes.get(node_id)
            if not node:
                return
            
            prefix = "  " * depth
            title = getattr(node, 'title', None) or node.content[:50]
            lines.append(f"{prefix}- **{node.role}**: {title}\n")
            
            for child_id in node.children:
                render_node(child_id, depth + 1)
        
        if tree.root_id:
            render_node(tree.root_id)
        
        return {"content": "".join(lines)}
    
    return None


def import_tree(data: Dict) -> Optional[ConversationTree]:
    """导入对话树"""
    from ..models.models import Role, generate_id
    
    tree_id = data.get("id", generate_id("tree"))
    
    # 创建树
    tree = ConversationTree(
        id=tree_id,
        title=data.get("title", "导入的对话"),
        tags=data.get("tags", []),
    )
    
    # 解析节点
    for node_data in data.get("nodes", []):
        node = MessageNode(
            id=node_data["id"],
            tree_id=tree_id,
            parent_id=node_data.get("parent_id"),
            children=node_data.get("children", []),
            role=Role(node_data["role"]),
            content=node_data["content"],
            title=node_data.get("title"),
            summary=node_data.get("summary"),
            tags=node_data.get("tags", []),
        )
        tree.nodes[node.id] = node
        
        if not node.parent_id:
            tree.root_id = node.id
    
    # 保存
    from ..database.db import update_tree as db_save_tree
    db_save_tree(tree)
    
    return tree
