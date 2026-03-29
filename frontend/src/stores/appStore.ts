import { create } from 'zustand'

// ============ 类型定义 ============

export type Role = 'user' | 'assistant' | 'system'
export type ContextMode = 'full' | 'summary' | 'cold'
export type Theme = 'dark' | 'light'

export interface MessageNode {
  id: string
  tree_id: string
  parent_id: string | null
  children: string[]
  role: Role
  content: string
  title?: string
  is_checkpoint: boolean
  checkpoint_parent_id: string | null
  checkpoint_order: number
  position: number
  created_at: string
  updated_at: string
  summary?: string
  tags: string[]
  edit_count: number
}

export interface ConversationTree {
  id: string
  title: string
  root_id: string | null
  nodes: Record<string, MessageNode>
  active_node_id: string | null
  created_at: string
  updated_at: string
  tags: string[]
  theme: Theme
  default_context_mode: ContextMode
}

export interface TreeSummary {
  id: string
  title: string
  root_id: string | null
  active_node_id: string | null
  node_count: number
  created_at: string
  updated_at: string
  tags: string[]
  theme: Theme
}

export interface SearchResult {
  node: MessageNode
  score: number
  tree_id: string
}

export type ExportResult = Record<string, unknown> | { content: string } | null

// ============ Store 定义 ============

interface AppState {
  // 数据
  trees: TreeSummary[]
  currentTree: ConversationTree | null
  isLoading: boolean
  error: string | null
  
  // UI 状态
  sidebarOpen: boolean
  rightPanelOpen: boolean
  showSearch: boolean
  showSettings: boolean
  showExport: boolean
  theme: Theme
  contextMode: ContextMode
  sidebarWidth: number
  
  // 操作
  setTrees: (trees: TreeSummary[]) => void
  setCurrentTree: (tree: ConversationTree | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  toggleSidebar: () => void
  toggleRightPanel: () => void
  toggleSearch: () => void
  toggleSettings: () => void
  toggleExport: () => void
  setTheme: (theme: Theme) => void
  setContextMode: (mode: ContextMode) => void
  setSidebarWidth: (width: number) => void
  
  // 树操作
  createTree: (title?: string) => Promise<void>
  loadTree: (treeId: string) => Promise<void>
  deleteTree: (treeId: string) => Promise<void>
  renameTree: (treeId: string, title: string) => Promise<void>
  
  // 节点操作
  addMessage: (content: string) => Promise<void>
  createBranch: (title: string, contextMode?: ContextMode) => Promise<void>
  switchNode: (nodeId: string) => void
  updateNode: (nodeId: string, updates: Partial<MessageNode>) => Promise<void>
  deleteNode: (treeId: string, nodeId: string) => Promise<void>
  moveNode: (treeId: string, nodeId: string, newParentId: string | null, position?: number) => Promise<void>
  
  // 搜索
  search: (query: string, treeId?: string) => Promise<SearchResult[]>
  
  // 导出
  exportTree: (treeId: string, format?: string) => Promise<ExportResult>
}

// ============ API 函数 ============

const API_BASE = 'http://localhost:8000/api'

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }
  
  return response.json()
}

// ============ Store 实现 ============

export const useStore = create<AppState>((set, get) => ({
  // 初始状态
  trees: [],
  currentTree: null,
  isLoading: false,
  error: null,
  sidebarOpen: true,
  rightPanelOpen: true,
  showSearch: false,
  showSettings: false,
  showExport: false,
  theme: 'dark',
  contextMode: 'full',
  sidebarWidth: Number(localStorage.getItem('yanshu_sidebar_width') || 288),
  
  // 设置方法
  setTrees: (trees) => set({ trees }),
  setCurrentTree: (tree) => set({ currentTree: tree }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  toggleSearch: () => set((state) => ({ showSearch: !state.showSearch })),
  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
  toggleExport: () => set((state) => ({ showExport: !state.showExport })),
  setTheme: (theme) => {
    localStorage.setItem('yanshu_theme', theme)
    set({ theme })
  },
  setContextMode: (contextMode) => set({ contextMode }),
  setSidebarWidth: (sidebarWidth) => {
    const nextWidth = Math.min(520, Math.max(240, sidebarWidth))
    localStorage.setItem('yanshu_sidebar_width', String(nextWidth))
    set({ sidebarWidth: nextWidth })
  },
  
  // 创建新对话树
  createTree: async (title?: string) => {
    set({ isLoading: true, error: null })
    try {
      const tree = await apiRequest<ConversationTree>('/trees', {
        method: 'POST',
        body: JSON.stringify({
          title: title || '新对话',
          tags: [],
        }),
      })
      set((state) => ({
        trees: [
          {
            id: tree.id,
            title: tree.title,
            root_id: tree.root_id,
            active_node_id: tree.active_node_id,
            node_count: Object.keys(tree.nodes).length,
            created_at: tree.created_at,
            updated_at: tree.updated_at,
            tags: tree.tags,
            theme: tree.theme || 'dark',
          },
          ...state.trees,
        ],
        currentTree: tree,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建失败' })
    } finally {
      set({ isLoading: false })
    }
  },
  
  // 加载对话树
  loadTree: async (treeId: string) => {
    set({ isLoading: true, error: null })
    try {
      const tree = await apiRequest<ConversationTree>(`/trees/${treeId}`)
      set({ currentTree: tree })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载失败' })
    } finally {
      set({ isLoading: false })
    }
  },
  
  // 删除对话树
  deleteTree: async (treeId: string) => {
    try {
      await apiRequest(`/trees/${treeId}`, { method: 'DELETE' })
      set((state) => ({
        trees: state.trees.filter((t) => t.id !== treeId),
        currentTree: state.currentTree?.id === treeId ? null : state.currentTree,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除失败' })
    }
  },
  
  // 重命名对话树
  renameTree: async (treeId: string, title: string) => {
    try {
      await apiRequest(`/trees/${treeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })
      set((state) => ({
        trees: state.trees.map((t) =>
          t.id === treeId ? { ...t, title } : t
        ),
        currentTree: state.currentTree?.id === treeId
          ? { ...state.currentTree, title }
          : state.currentTree,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '重命名失败' })
    }
  },
  
  // 发送消息并获取回复
  addMessage: async (content: string) => {
    const { currentTree, contextMode } = get()
    if (!currentTree) {
      await get().createTree()
    }
    
    const tree = get().currentTree
    if (!tree) return
    
    set({ isLoading: true, error: null })
    
    try {
      await apiRequest<{
        user_node_id: string
        assistant_node_id: string
        tree_id: string
      }>('/ai/completion', {
        method: 'POST',
        body: JSON.stringify({
          tree_id: tree.id,
          node_id: tree.active_node_id,
          message: content,
          context_mode: contextMode,
        }),
      })
      
      // 重新加载树以获取最新状态
      await get().loadTree(tree.id)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '发送失败' })
    } finally {
      set({ isLoading: false })
    }
  },
  
  // 创建分支
  createBranch: async (title: string, contextMode?: ContextMode) => {
    const { currentTree } = get()
    if (!currentTree) return
    
    const activeNodeId = currentTree.active_node_id
    if (!activeNodeId) return
    
    try {
      await apiRequest(`/trees/${currentTree.id}/nodes/${activeNodeId}/branch`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          context_mode: contextMode || get().contextMode,
          tags: [],
        }),
      })
      
      // 重新加载树
      await get().loadTree(currentTree.id)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建分支失败' })
    }
  },
  
  // 切换节点
  switchNode: (nodeId: string) => {
    const { currentTree } = get()
    if (!currentTree) return
    
    set({
      currentTree: {
        ...currentTree,
        active_node_id: nodeId,
      },
    })
    
    // 通知后端
    apiRequest(`/trees/${currentTree.id}/switch/${nodeId}`, { method: 'POST' }).catch(() => {})
  },
  
  // 更新节点
  updateNode: async (nodeId: string, updates: Partial<MessageNode>) => {
    const { currentTree } = get()
    if (!currentTree || !currentTree.nodes[nodeId]) return
    
    try {
      await apiRequest(`/trees/${currentTree.id}/nodes/${nodeId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      
      // 更新本地状态
      set({
        currentTree: {
          ...currentTree,
          nodes: {
            ...currentTree.nodes,
            [nodeId]: {
              ...currentTree.nodes[nodeId],
              ...updates,
            },
          },
        },
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新失败' })
    }
  },
  
  // 删除节点
  deleteNode: async (treeId: string, nodeId: string) => {
    try {
      await apiRequest(`/trees/${treeId}/nodes/${nodeId}`, { method: 'DELETE' })
      await get().loadTree(treeId)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除失败' })
    }
  },
  
  // 移动节点
  moveNode: async (treeId: string, nodeId: string, newParentId: string | null, position: number = 0) => {
    try {
      await apiRequest(`/trees/${treeId}/nodes/${nodeId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ new_parent_id: newParentId, position }),
      })
      await get().loadTree(treeId)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '移动失败' })
    }
  },
  
  // 搜索
  search: async (query: string, treeId?: string) => {
    try {
      const response = await apiRequest<{ results: SearchResult[] }>('/search', {
        method: 'POST',
        body: JSON.stringify({ query, tree_id: treeId, limit: 20 }),
      })
      return response.results
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '搜索失败' })
      return []
    }
  },
  
  // 导出
  exportTree: async (treeId: string, format: string = 'json') => {
    try {
      const data = await apiRequest<ExportResult>(`/trees/${treeId}/export?format=${format}`)
      return data
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '导出失败' })
      return null
    }
  },
}))

// ============ 辅助 Hooks ============

export function useNodePath(nodeId: string | null): MessageNode[] {
  const currentTree = useStore((state) => state.currentTree)
  
  if (!currentTree || !nodeId) return []
  
  const path: MessageNode[] = []
  let current = currentTree.nodes[nodeId]
  
  while (current) {
    path.unshift(current)
    current = current.parent_id ? currentTree.nodes[current.parent_id] : undefined as any
  }
  
  return path
}

export function useNodeChildren(nodeId: string | null): MessageNode[] {
  const currentTree = useStore((state) => state.currentTree)
  
  if (!currentTree || !nodeId || !currentTree.nodes[nodeId]) return []
  
  return currentTree.nodes[nodeId].children
    .map((id) => currentTree.nodes[id])
    .filter(Boolean)
}
