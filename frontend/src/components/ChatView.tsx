import { useState, useRef, useEffect } from 'react'
import { useStore, useNodePath, useNodeChildren, MessageNode } from '../stores/appStore'
import { 
  Send,
  GitBranch,
  ChevronRight,
  ChevronDown,
  Loader2,
  Edit2,
  Check,
  X,
} from 'lucide-react'

function getDefaultNodeTitle(node: MessageNode) {
  return node.title || node.content.slice(0, 24) || '新节点'
}

function MessageBubble({
  node,
  activePathIds,
  onCreateNodeRequest,
}: {
  node: MessageNode
  activePathIds: string[]
  onCreateNodeRequest: (node: MessageNode) => void
}) {
  const { currentTree, switchNode, updateNode, createBranch } = useStore()
  const children = useNodeChildren(node.id)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(node.content)
  const [showBranch, setShowBranch] = useState(false)
  const [showChildren, setShowChildren] = useState(false)
  
  const isActive = currentTree?.active_node_id === node.id
  const activeChildId = children.find((child) => activePathIds.includes(child.id))?.id

  useEffect(() => {
    if (activeChildId) {
      setShowChildren(true)
    }
  }, [activeChildId])
  
  const handleSaveEdit = async () => {
    if (editContent.trim() !== node.content) {
      await updateNode(node.id, { content: editContent })
    }
    setIsEditing(false)
  }
  
  const handleCancelEdit = () => {
    setEditContent(node.content)
    setIsEditing(false)
  }
  
  const handleCreateBranch = async () => {
    if (node.role !== 'user') return
    await createBranch(node.content.slice(0, 20) + "...")
    setShowBranch(false)
  }

  return (
    <div
      className={`
        flex gap-3 p-4 rounded-xl transition-all
        ${node.role === 'user' 
          ? isEditing ? 'bg-cyan-400/18' : 'bg-cyan-400/10' 
          : 'bg-white/5'
        }
        ${isActive ? 'ring-2 ring-cyan-400/40' : ''}
      `}
    >
      {/* 头像 */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg
        ${node.role === 'user' ? 'bg-cyan-400/18' : 'bg-slate-400/18'}
      `}>
        {node.role === 'user' ? '👤' : '🤖'}
      </div>
      
      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-300">
            {node.role === 'user' ? '你' : 'YanShu AI'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(node.created_at).toLocaleString('zh-CN', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {node.edit_count > 0 && (
            <span className="text-xs text-gray-600">已编辑</span>
          )}
          {node.is_checkpoint && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
              节点
            </span>
          )}
        </div>
        
        {/* 编辑模式 */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 bg-white/5 border border-cyan-400/40 rounded-lg text-sm resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm text-slate-950"
              >
                <Check size={14} />
                保存
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
              >
                <X size={14} />
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {node.content}
            </div>
            
            {/* 标签 */}
            {node.tags && node.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {node.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded text-xs text-gray-400"
              >
                <Edit2 size={12} />
                编辑
              </button>

              {!node.is_checkpoint && (
                <button
                  onClick={() => onCreateNodeRequest(node)}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded text-xs text-amber-300"
                >
                  <GitBranch size={12} />
                  设为节点
                </button>
              )}
              
              {node.role === 'user' && (
                <button
                  onClick={() => setShowBranch(!showBranch)}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded text-xs text-gray-400"
                >
                  <GitBranch size={12} />
                  分支
                </button>
              )}
            </div>
            
            {/* 创建分支弹窗 */}
            {showBranch && node.role === 'user' && (
              <div className="mt-2 p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">从此消息创建分支？</p>
                <button
                  onClick={handleCreateBranch}
                  className="w-full px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm text-slate-950"
                >
                  <GitBranch size={14} className="inline mr-1" />
                  创建分支
                </button>
              </div>
            )}
            
            {/* 摘要提示 */}
            {node.summary && (
              <div className="mt-2 text-xs text-gray-500 italic border-l-2 border-amber-500/50 pl-2">
                📝 {node.summary}
              </div>
            )}

            {showChildren && children.length > 0 && (
              <div className={`
                mt-3 space-y-2 rounded-xl border p-3
                ${currentTree?.theme === 'dark'
                  ? 'border-white/10 bg-black/20'
                  : 'border-gray-200 bg-gray-50'
                }
              `}>
                <div className={`text-xs font-medium ${currentTree?.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  可选分支
                </div>
                {children.map((child) => {
                  const isCurrentBranch = activeChildId === child.id

                  return (
                    <button
                      key={child.id}
                      onClick={() => switchNode(child.id)}
                      className={`
                        w-full text-left rounded-lg px-3 py-2 transition-colors
                        ${isCurrentBranch
                          ? currentTree?.theme === 'dark'
                            ? 'bg-cyan-400/15 text-cyan-200'
                            : 'bg-cyan-100 text-cyan-700'
                          : currentTree?.theme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-gray-200'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }
                      `}
                    >
                      <div className="text-sm font-medium truncate">
                        {child.title || child.content.slice(0, 24) || '未命名分支'}
                      </div>
                      <div className={`mt-1 text-xs line-clamp-2 ${currentTree?.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {child.content}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 展开分支 */}
      <button
        onClick={() => children.length > 0 && setShowChildren((prev) => !prev)}
        className={`
          shrink-0 p-1 rounded transition-all
          ${children.length > 0
            ? isActive || showChildren
              ? 'opacity-100 bg-cyan-400/15'
              : 'opacity-0 hover:opacity-100'
            : 'opacity-30 cursor-default'
          }
        `}
        title={children.length > 0 ? (showChildren ? '收起分支' : '展开分支') : '暂无分支'}
      >
        {showChildren && children.length > 0
          ? <ChevronDown size={16} className="text-cyan-300" />
          : <ChevronRight size={16} className={children.length > 0 && isActive ? 'text-cyan-300' : 'text-gray-500'} />
        }
      </button>
    </div>
  )
}

export default function ChatView() {
  const { currentTree, addMessage, isLoading, error, theme, contextMode, updateNode } = useStore()
  const [input, setInput] = useState('')
  const [nodeTitleModal, setNodeTitleModal] = useState<{ nodeId: string; title: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // 获取当前路径上的所有消息
  const path = useNodePath(currentTree?.active_node_id || null)
  const activePathIds = path.map((node) => node.id)
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [path])
  
  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const message = input.trim()
    setInput('')
    await addMessage(message)
    
    inputRef.current?.focus()
  }
  
  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleOpenNodeTitleModal = (node: MessageNode) => {
    setNodeTitleModal({
      nodeId: node.id,
      title: getDefaultNodeTitle(node),
    })
  }

  const handleConfirmNodeTitle = async () => {
    if (!currentTree || !nodeTitleModal) return

    const node = currentTree.nodes[nodeTitleModal.nodeId]
    if (!node) return

    const nearestCheckpoint = (() => {
      let current = node.parent_id ? currentTree.nodes[node.parent_id] : undefined
      while (current) {
        if (current.is_checkpoint) return current.id
        current = current.parent_id ? currentTree.nodes[current.parent_id] : undefined
      }
      return null
    })()

    const siblingCount = Object.values(currentTree.nodes).filter((item) => {
      if (!item.is_checkpoint || item.id === node.id) return false
      const parentId = item.checkpoint_parent_id ?? null
      return parentId === nearestCheckpoint
    }).length

    await updateNode(node.id, {
      is_checkpoint: true,
      title: nodeTitleModal.title.trim() || getDefaultNodeTitle(node),
      checkpoint_parent_id: nearestCheckpoint,
      checkpoint_order: siblingCount,
    })
    setNodeTitleModal(null)
  }
  
  // 没有当前树时显示纯空状态
  if (!currentTree) {
    return (
      <main className={`
        flex-1 flex items-center justify-center
        ${theme === 'dark' ? 'bg-[#081017]' : 'bg-slate-50'}
      `}>
        <div className="text-center max-w-md px-4">
          <div className="text-7xl mb-6">🌳</div>
          <h2 className={`text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            开始你的思维探索
          </h2>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            创建一个对话树，让你的想法像树枝一样生长
          </p>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            <p className="mb-2">💡 快捷键提示：</p>
            <p>Ctrl+N 新建对话 | Ctrl+K 搜索 | Ctrl+B 创建分支</p>
          </div>
        </div>
      </main>
    )
  }

  const isEmptyTree = !currentTree.root_id || path.length === 0
  
  return (
    <main className={`
      flex-1 flex flex-col overflow-hidden
      ${theme === 'dark' ? 'bg-[#081017]' : 'bg-slate-50'}
    `}>
      {/* 面包屑 */}
      {!isEmptyTree && (
        <div className={`
          px-4 py-2 border-b flex items-center gap-1 text-sm overflow-x-auto
          ${theme === 'dark' ? 'bg-[#0f1722] border-white/5' : 'bg-white border-slate-200'}
        `}>
          {path.map((node, index) => (
            <div key={node.id} className="flex items-center gap-1 shrink-0">
              {index > 0 && (
                <ChevronRight size={14} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} />
              )}
              <button
                onClick={() => useStore.getState().switchNode(node.id)}
                className={`
                  px-2 py-0.5 rounded text-xs transition-colors whitespace-nowrap
                  ${index === path.length - 1 
                    ? theme === 'dark'
                      ? 'bg-cyan-400/15 text-cyan-300'
                      : 'bg-cyan-100 text-cyan-700'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {node.title || node.content.slice(0, 15)}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmptyTree ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <div className="text-7xl mb-6">🌳</div>
              <h2 className={`text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                开始你的思维探索
              </h2>
              <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                直接在下方输入你的问题，让这棵对话树从第一条消息开始生长
              </p>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="mb-2">💡 快捷键提示：</p>
                <p>Ctrl+N 新建对话 | Ctrl+K 搜索 | Ctrl+B 创建分支</p>
              </div>
            </div>
          </div>
        ) : (
          path.map((node) => (
            <div key={node.id} className="group">
              <MessageBubble
                node={node}
                activePathIds={activePathIds}
                onCreateNodeRequest={handleOpenNodeTitleModal}
              />
            </div>
          ))
        )}
        
        {/* 加载指示器 */}
        {isLoading && (
          <div className={`
            flex items-center gap-3 p-4 rounded-xl
            ${theme === 'dark' ? 'bg-white/5' : 'bg-white'}
          `}>
            <div className="w-10 h-10 rounded-full bg-cyan-400/18 flex items-center justify-center">
              🤖
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  YanShu AI
                </span>
                <Loader2 size={14} className="animate-spin text-cyan-300" />
              </div>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                正在思考...
              </p>
            </div>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className={`
            p-4 rounded-xl border
            ${theme === 'dark' 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-red-50 border-red-200 text-red-600'
            }
          `}>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区 */}
      <div className={`
        p-4 border-t
        ${theme === 'dark' ? 'bg-[#0f1722] border-white/5' : 'bg-white border-slate-200'}
      `}>
        <div className={`
          flex items-end gap-2 p-2 rounded-xl
          ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}
        `}>
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题或想法... (Enter 发送，Shift+Enter 换行)"
              className={`
                w-full px-4 py-3 bg-transparent outline-none text-sm resize-none
                ${theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}
              `}
              rows={1}
              style={{ maxHeight: '150px' }}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`
              p-3 rounded-xl transition-all
              ${input.trim() && !isLoading
                ? theme === 'dark'
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-lg'
                : theme === 'dark'
                  ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Send size={18} />
          </button>
        </div>
        
        {/* 提示 */}
        <div className={`
          mt-2 flex items-center justify-between text-xs
          ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
        `}>
          <div className="flex items-center gap-4">
            <span>💡 Enter 发送</span>
            <span className="hidden sm:inline">上下文: 
              <span className={theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}>
                {contextMode === 'full' ? '完整继承' : contextMode === 'summary' ? '摘要模式' : '冷启动'}
              </span>
            </span>
          </div>
          <span className="hidden md:inline">
            {path.length} 条消息 | 深度 {path.length}
          </span>
        </div>
      </div>

      {nodeTitleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setNodeTitleModal(null)}>
          <div
            className={`w-full max-w-md rounded-xl shadow-2xl p-4 ${theme === 'dark' ? 'bg-[#17212b]' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              设置节点标题
            </h3>
            <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              这条消息会被加入左侧节点树，你可以给它一个更容易识别的名字。
            </p>
            <input
              type="text"
              value={nodeTitleModal.title}
              onChange={(e) => setNodeTitleModal((prev) => prev ? { ...prev, title: e.target.value } : prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleConfirmNodeTitle()
                if (e.key === 'Escape') setNodeTitleModal(null)
              }}
              className={`w-full px-3 py-2 rounded-lg outline-none ${theme === 'dark' ? 'bg-white/5 text-white border border-white/10' : 'bg-gray-50 text-gray-900 border border-gray-200'}`}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setNodeTitleModal(null)}
                className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
              >
                取消
              </button>
              <button
                onClick={() => void handleConfirmNodeTitle()}
                className="px-3 py-2 rounded-lg text-sm bg-cyan-500 hover:bg-cyan-600 text-slate-950"
              >
                创建节点
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
