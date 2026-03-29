-- YanShu Database Schema
-- SQLite 3

-- 对话树表
CREATE TABLE IF NOT EXISTS trees (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    root_id TEXT,
    active_node_id TEXT,
    nodes_json TEXT NOT NULL DEFAULT '{}',
    default_context_mode TEXT DEFAULT 'full',
    tags_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_trees_created ON trees(created_at);
CREATE INDEX IF NOT EXISTS idx_trees_updated ON trees(updated_at);

-- 用户表 (未来用于账号系统)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    created_at TEXT NOT NULL
);

-- 用户与树的关联
CREATE TABLE IF NOT EXISTS user_trees (
    user_id TEXT NOT NULL,
    tree_id TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, tree_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tree_id) REFERENCES trees(id)
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    user_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 节点标签关联
CREATE TABLE IF NOT EXISTS node_tags (
    node_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (node_id, tag_id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);
