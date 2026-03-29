# YanShu API 文档

> 🌲 树状对话系统 REST API

---

## 基础信息

- **Base URL**: `http://localhost:8000/api`
- **Content-Type**: `application/json`
- **认证**: 当前版本无需认证（后续版本将添加 API Key）

---

## 对话树 (Trees)

### 获取所有对话树

```
GET /api/trees
```

**查询参数:**
- `limit` (int, optional): 返回数量，默认 50
- `offset` (int, optional): 跳过数量，默认 0

**响应示例:**
```json
[
  {
    "id": "tree_abc123",
    "title": "MLIP 研究",
    "root_id": "node_root",
    "active_node_id": "node_xyz",
    "node_count": 12,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z",
    "tags": ["MLIP", "research"]
  }
]
```

---

### 创建对话树

```
POST /api/trees
```

**请求体:**
```json
{
  "title": "新对话",
  "initial_message": "你好，帮我解释一下 Transformer",
  "tags": ["AI", "NLP"]
}
```

**响应:**
```json
{
  "id": "tree_abc123",
  "title": "新对话",
  "root_id": "node_root",
  "nodes": {...},
  "active_node_id": "node_root",
  ...
}
```

---

### 获取指定对话树

```
GET /api/trees/{tree_id}
```

---

### 删除对话树

```
DELETE /api/trees/{tree_id}
```

---

## 节点 (Nodes)

### 获取节点

```
GET /api/trees/{tree_id}/nodes/{node_id}
```

---

### 获取节点路径

```
GET /api/trees/{tree_id}/nodes/{node_id}/path
```

返回从根到该节点的完整路径。

---

### 获取上下文信息

```
GET /api/trees/{tree_id}/nodes/{node_id}/context
```

返回上下文统计信息（消息数量、估算 token 等）。

---

### 更新节点

```
PATCH /api/trees/{tree_id}/nodes/{node_id}
```

**请求体:**
```json
{
  "content": "更新后的内容",
  "summary": "AI 生成的摘要",
  "tags": ["tag1", "tag2"]
}
```

---

### 删除节点

```
DELETE /api/trees/{tree_id}/nodes/{node_id}
```

删除节点及其所有子节点。

---

## 分支 (Branches)

### 从节点创建分支

```
POST /api/trees/{tree_id}/nodes/{node_id}/branch
```

**请求体:**
```json
{
  "title": "探索 Attention 机制",
  "context_mode": "full",
  "tags": ["Transformer", "attention"]
}
```

**context_mode 选项:**
- `full`: 完整继承上下文
- `summary`: 只继承 AI 摘要
- `cold`: 冷启动，不继承上下文

---

## AI 对话

### 发送消息

```
POST /api/ai/completion
```

**请求体:**
```json
{
  "tree_id": "tree_abc123",
  "node_id": "node_xyz",
  "message": "什么是自注意力机制？",
  "context_mode": "full",
  "system_prompt": "你是一个专业的 AI 研究助手"
}
```

**响应:**
```json
{
  "user_node_id": "node_new1",
  "assistant_node_id": "node_new2",
  "tree_id": "tree_abc123",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

---

## 搜索

### 搜索节点

```
POST /api/search
```

**请求体:**
```json
{
  "query": "transformer",
  "tree_id": "tree_abc123",
  "tags": ["MLIP"],
  "limit": 20
}
```

---

## 辅助

### 健康检查

```
GET /api/health
```

---

## 错误响应

```json
{
  "detail": "错误描述"
}
```

**状态码:**
- `200`: 成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误
