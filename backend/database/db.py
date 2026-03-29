"""
YanShu - 数据库层
SQLite 数据库操作
"""

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..models.models import (
    ConversationTree,
    MessageNode,
    Role,
    generate_id,
)

# 数据库路径
DB_PATH = Path(__file__).parent.parent.parent / "database" / "yanshu.db"


def init_database():
    """初始化数据库"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    with get_db() as db:
        # 创建 trees 表
        db.execute("""
            CREATE TABLE IF NOT EXISTS trees (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                root_id TEXT,
                active_node_id TEXT,
                nodes_json TEXT NOT NULL DEFAULT '{}',
                default_context_mode TEXT DEFAULT 'full',
                theme TEXT DEFAULT 'dark',
                tags_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        # 创建索引
        db.execute("CREATE INDEX IF NOT EXISTS idx_trees_created ON trees(created_at)")
        # with 块退出时自动 commit，不需要手动调用


@contextmanager
def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ============ 树操作 ============

def create_tree(title: str = "新对话", initial_message: Optional[str] = None, tags: List[str] = None) -> ConversationTree:
    """创建新的对话树"""
    tree_id = generate_id("tree")
    now = datetime.utcnow()
    
    # 创建根节点
    root_id = None
    nodes = {}
    
    if initial_message:
        root_node = MessageNode(
            id=generate_id("node"),
            tree_id=tree_id,
            parent_id=None,
            role=Role.USER,
            content=initial_message,
            title=initial_message[:50] + ("..." if len(initial_message) > 50 else ""),
        )
        root_id = root_node.id
        nodes[root_node.id] = root_node
    
    tree = ConversationTree(
        id=tree_id,
        title=title,
        root_id=root_id,
        nodes=nodes,
        active_node_id=root_id,
        tags=tags or [],
        created_at=now,
        updated_at=now,
    )
    
    # 保存到数据库
    with get_db() as db:
        db.execute("""
            INSERT INTO trees (id, title, root_id, active_node_id, nodes_json, 
                             default_context_mode, theme, tags_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tree.id,
            tree.title,
            tree.root_id,
            tree.active_node_id,
            json.dumps(_tree_to_json(tree), ensure_ascii=False),
            tree.default_context_mode,
            tree.theme,
            json.dumps(tree.tags, ensure_ascii=False),
            tree.created_at.isoformat(),
            tree.updated_at.isoformat(),
        ))
    
    return tree


def get_tree(tree_id: str) -> Optional[ConversationTree]:
    """获取对话树"""
    with get_db() as db:
        db.execute("SELECT * FROM trees WHERE id = ?", (tree_id,))
        row = db.fetchone()
        
        if not row:
            return None
        
        return _row_to_tree(row)


def get_all_trees(limit: int = 50, offset: int = 0) -> List[ConversationTree]:
    """获取所有对话树"""
    with get_db() as db:
        db.execute("""
            SELECT * FROM trees 
            ORDER BY updated_at DESC 
            LIMIT ? OFFSET ?
        """, (limit, offset))
        rows = db.fetchall()
        
        return [_row_to_tree(row) for row in rows]


def update_tree(tree: ConversationTree) -> bool:
    """更新对话树"""
    tree.updated_at = datetime.utcnow()
    
    with get_db() as db:
        db.execute("""
            UPDATE trees SET 
                title = ?,
                root_id = ?,
                active_node_id = ?,
                nodes_json = ?,
                default_context_mode = ?,
                theme = ?,
                tags_json = ?,
                updated_at = ?
            WHERE id = ?
        """, (
            tree.title,
            tree.root_id,
            tree.active_node_id,
            json.dumps(_tree_to_json(tree), ensure_ascii=False),
            tree.default_context_mode,
            tree.theme,
            json.dumps(tree.tags, ensure_ascii=False),
            tree.updated_at.isoformat(),
            tree.id,
        ))
        
        return db.rowcount > 0


def delete_tree(tree_id: str) -> bool:
    """删除对话树"""
    with get_db() as db:
        db.execute("DELETE FROM trees WHERE id = ?", (tree_id,))
        return db.rowcount > 0


# ============ 节点操作 ============

def add_node(
    tree_id: str,
    parent_id: Optional[str],
    role: Role,
    content: str,
    tags: List[str] = None,
    title: Optional[str] = None,
    is_checkpoint: bool = False,
) -> Optional[MessageNode]:
    """在树中添加新节点"""
    tree = get_tree(tree_id)
    if not tree:
        return None
    
    # 计算位置
    position = 0
    if parent_id and parent_id in tree.nodes:
        position = len(tree.nodes[parent_id].children)
    
    node = MessageNode(
        id=generate_id("node"),
        tree_id=tree_id,
        parent_id=parent_id,
        role=role,
        content=content,
        title=title,
        is_checkpoint=is_checkpoint,
        checkpoint_parent_id=None,
        checkpoint_order=position,
        tags=tags or [],
        position=position,
    )
    
    # 更新树结构
    tree.nodes[node.id] = node
    if parent_id and parent_id in tree.nodes:
        if node.id not in tree.nodes[parent_id].children:
            tree.nodes[parent_id].children.append(node.id)
    if not tree.root_id:
        tree.root_id = node.id
    
    tree.active_node_id = node.id
    tree.updated_at = datetime.utcnow()
    
    update_tree(tree)
    return node


def update_node(tree_id: str, node_id: str, **kwargs) -> Optional[MessageNode]:
    """更新节点"""
    tree = get_tree(tree_id)
    if not tree or node_id not in tree.nodes:
        return None
    
    node = tree.nodes[node_id]
    
    # 更新字段
    if "content" in kwargs:
        node.content = kwargs["content"]
        node.edit_count += 1
    if "title" in kwargs:
        node.title = kwargs["title"]
    if "is_checkpoint" in kwargs:
        node.is_checkpoint = kwargs["is_checkpoint"]
    if "summary" in kwargs:
        node.summary = kwargs["summary"]
    if "tags" in kwargs:
        node.tags = kwargs["tags"]
    if "position" in kwargs:
        node.position = kwargs["position"]
    if "checkpoint_parent_id" in kwargs:
        node.checkpoint_parent_id = kwargs["checkpoint_parent_id"]
    if "checkpoint_order" in kwargs:
        node.checkpoint_order = kwargs["checkpoint_order"]
    
    node.updated_at = datetime.utcnow()
    
    update_tree(tree)
    return node


def delete_node(tree_id: str, node_id: str) -> bool:
    """删除节点及其所有子节点"""
    tree = get_tree(tree_id)
    if not tree or node_id not in tree.nodes:
        return False
    
    # 递归收集所有要删除的节点
    def collect_children(nid: str) -> List[str]:
        children = [nid]
        for child_id in tree.nodes[nid].children:
            children.extend(collect_children(child_id))
        return children
    
    nodes_to_delete = collect_children(node_id)
    
    # 从父节点移除引用
    parent_id = tree.nodes[node_id].parent_id
    if parent_id and parent_id in tree.nodes:
        tree.nodes[parent_id].children = [
            c for c in tree.nodes[parent_id].children if c != node_id
        ]
    
    # 删除所有节点
    for nid in nodes_to_delete:
        del tree.nodes[nid]
    
    # 更新活跃节点
    if tree.active_node_id in nodes_to_delete:
        tree.active_node_id = parent_id or tree.root_id
    
    # 更新根节点
    if tree.root_id in nodes_to_delete:
        tree.root_id = tree.active_node_id
    
    tree.updated_at = datetime.utcnow()
    return update_tree(tree)


def create_branch(
    tree_id: str,
    from_node_id: str,
    title: str,
    context_mode: str = "full",
    initial_message: Optional[str] = None
) -> Optional[MessageNode]:
    """从指定节点创建分支"""
    tree = get_tree(tree_id)
    if not tree or from_node_id not in tree.nodes:
        return None
    
    # 创建新节点作为分支起点
    node = MessageNode(
        id=generate_id("node"),
        tree_id=tree_id,
        parent_id=from_node_id,
        role=Role.USER,
        content=initial_message or title,
        title=title,
        is_checkpoint=True,
        checkpoint_parent_id=from_node_id,
        checkpoint_order=len(tree.nodes[from_node_id].children),
        summary=f"分支: {title}",
    )
    
    # 更新树结构
    tree.nodes[node.id] = node
    tree.nodes[from_node_id].children.append(node.id)
    tree.active_node_id = node.id
    tree.updated_at = datetime.utcnow()
    
    update_tree(tree)
    return node


# ============ 辅助函数 ============

def _tree_to_json(tree: ConversationTree) -> Dict[str, Any]:
    """将树转换为可序列化的字典"""
    return {
        "id": tree.id,
        "title": tree.title,
        "root_id": tree.root_id,
        "nodes": {
            nid: {
                "id": node.id,
                "tree_id": node.tree_id,
                "parent_id": node.parent_id,
                "children": node.children,
                "role": node.role,
                "content": node.content,
                "title": getattr(node, 'title', None),
                "is_checkpoint": getattr(node, 'is_checkpoint', True),
                "checkpoint_parent_id": getattr(node, 'checkpoint_parent_id', None),
                "checkpoint_order": getattr(node, 'checkpoint_order', 0),
                "position": getattr(node, 'position', 0),
                "created_at": node.created_at.isoformat(),
                "updated_at": node.updated_at.isoformat(),
                "summary": node.summary,
                "embedding": node.embedding,
                "tags": node.tags,
                "edit_count": node.edit_count,
            }
            for nid, node in tree.nodes.items()
        },
        "active_node_id": tree.active_node_id,
    }


def _row_to_tree(row: sqlite3.Row) -> ConversationTree:
    """将数据库行转换为 ConversationTree"""
    data = json.loads(row["nodes_json"])
    row_keys = set(row.keys())
    
    nodes = {}
    for nid, ndata in data.get("nodes", {}).items():
        nodes[nid] = MessageNode(
            id=ndata["id"],
            tree_id=ndata["tree_id"],
            parent_id=ndata.get("parent_id"),
            children=ndata.get("children", []),
            role=Role(ndata["role"]),
            content=ndata["content"],
            title=ndata.get("title"),
            is_checkpoint=ndata.get("is_checkpoint", True),
            checkpoint_parent_id=ndata.get("checkpoint_parent_id"),
            checkpoint_order=ndata.get("checkpoint_order", ndata.get("position", 0)),
            position=ndata.get("position", 0),
            created_at=datetime.fromisoformat(ndata["created_at"]),
            updated_at=datetime.fromisoformat(ndata["updated_at"]),
            summary=ndata.get("summary"),
            embedding=ndata.get("embedding"),
            tags=ndata.get("tags", []),
            edit_count=ndata.get("edit_count", 0),
        )
    
    tags = json.loads(row["tags_json"]) if "tags_json" in row_keys and row["tags_json"] else []
    
    return ConversationTree(
        id=row["id"],
        title=row["title"],
        root_id=row["root_id"] if "root_id" in row_keys else None,
        nodes=nodes,
        active_node_id=row["active_node_id"] if "active_node_id" in row_keys else None,
        default_context_mode=row["default_context_mode"] if "default_context_mode" in row_keys else "full",
        theme=row["theme"] if "theme" in row_keys else "dark",
        tags=tags,
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


# 初始化数据库
init_database()
