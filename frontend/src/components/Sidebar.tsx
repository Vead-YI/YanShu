import { useMemo, useState } from 'react'
import { useStore, MessageNode, ConversationTree } from '../stores/appStore'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  GripVertical,
} from 'lucide-react'

type DropPosition = 'before' | 'inside' | 'after'

function getDisplayTitle(node: MessageNode) {
  return node.title || node.summary?.slice(0, 30) || node.content.slice(0, 30)
}

function getEffectiveCheckpointParentId(tree: ConversationTree, node: MessageNode): string | null {
  if (node.checkpoint_parent_id !== null && node.checkpoint_parent_id !== undefined) {
    return node.checkpoint_parent_id
  }

  let current = node.parent_id ? tree.nodes[node.parent_id] : undefined
  while (current) {
    if (current.is_checkpoint) return current.id
    current = current.parent_id ? tree.nodes[current.parent_id] : undefined
  }

  return null
}

function getCheckpointChildren(tree: ConversationTree, parentCheckpointId: string | null): MessageNode[] {
  return Object.values(tree.nodes)
    .filter((node) => node.is_checkpoint && getEffectiveCheckpointParentId(tree, node) === parentCheckpointId)
    .sort((a, b) => {
      if (a.checkpoint_order !== b.checkpoint_order) {
        return a.checkpoint_order - b.checkpoint_order
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
}

function findNearestCheckpointId(tree: ConversationTree, nodeId: string | null): string | null {
  if (!nodeId) return null

  let current: MessageNode | undefined = tree.nodes[nodeId]
  while (current) {
    if (current.is_checkpoint) return current.id
    current = current.parent_id ? tree.nodes[current.parent_id] : undefined
  }

  return null
}

function reindexCheckpointSiblings(
  tree: ConversationTree,
  updates: Record<string, Partial<MessageNode>>,
  parentCheckpointId: string | null,
  insertedNodeId?: string,
  insertedPosition?: number,
) {
  const existing = getCheckpointChildren(tree, parentCheckpointId)
    .filter((node) => node.id !== insertedNodeId)
    .map((node) => node.id)

  const safePosition = insertedPosition === undefined
    ? existing.length
    : Math.max(0, Math.min(insertedPosition, existing.length))

  if (insertedNodeId) {
    existing.splice(safePosition, 0, insertedNodeId)
  }

  existing.forEach((id, index) => {
    updates[id] = {
      ...(updates[id] || {}),
      checkpoint_parent_id: parentCheckpointId,
      checkpoint_order: index,
    }
  })
}

function TreeNode({
  nodeId,
  level,
  activeCheckpointId,
  draggedNodeId,
  dropTarget,
  onStartRename,
  onRequestDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  nodeId: string
  level: number
  activeCheckpointId: string | null
  draggedNodeId: string | null
  dropTarget: { nodeId: string; position: DropPosition } | null
  onStartRename: (node: MessageNode) => void
  onRequestDelete: (node: MessageNode) => void
  onDragStart: (nodeId: string) => void
  onDragOver: (nodeId: string, position: DropPosition) => void
  onDrop: (nodeId: string, position: DropPosition) => void
}) {
  const { currentTree, switchNode, theme } = useStore()
  const [expanded, setExpanded] = useState(true)
  const [showActions, setShowActions] = useState(false)

  if (!currentTree || !currentTree.nodes[nodeId]) return null

  const node = currentTree.nodes[nodeId]
  const children = getCheckpointChildren(currentTree, node.id)
  const isActive = activeCheckpointId === nodeId
  const isDragged = draggedNodeId === nodeId

  const renderDropZone = (position: DropPosition) => {
    const isVisible = dropTarget?.nodeId === nodeId && dropTarget.position === position
    if (!isVisible) return null

    return (
      <div
        className={`absolute left-2 right-2 h-0.5 rounded-full ${theme === 'dark' ? 'bg-cyan-300' : 'bg-cyan-500'}`}
        style={position === 'before' ? { top: 0 } : { bottom: 0 }}
      />
    )
  }

  return (
    <div className="select-none">
      <div
        className="relative"
        onDragOver={(e) => {
          e.preventDefault()
          onDragOver(nodeId, 'before')
        }}
        onDrop={(e) => {
          e.preventDefault()
          onDrop(nodeId, 'before')
        }}
      >
        {renderDropZone('before')}
      </div>

      <div
        draggable
        className={`
          flex items-center gap-1 py-1 px-1.5 rounded-md cursor-pointer transition-all group relative
          ${isActive
            ? theme === 'dark'
              ? 'bg-white/6 border-l border-cyan-400/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
              : 'bg-cyan-50 border-l border-cyan-500/70'
            : theme === 'dark'
              ? 'hover:bg-white/4 border-l border-transparent'
              : 'hover:bg-gray-50 border-l border-transparent'
          }
          ${isDragged ? 'opacity-50' : ''}
        `}
        style={{ marginLeft: `${level * 12}px` }}
        onClick={() => switchNode(nodeId)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onDragStart={() => onDragStart(nodeId)}
        onDragOver={(e) => {
          e.preventDefault()
          onDragOver(nodeId, 'inside')
        }}
        onDrop={(e) => {
          e.preventDefault()
          onDrop(nodeId, 'inside')
        }}
      >
        <button
          className={`w-4 h-4 flex items-center justify-center rounded shrink-0 transition-colors ${children.length > 0 ? 'text-gray-500 hover:bg-white/8' : 'invisible'}`}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <button
          className={`shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-gray-600 hover:bg-white/8' : 'text-gray-400 hover:bg-gray-100'}`}
          title="拖拽调整节点层级或顺序"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </button>

        <span className={`text-[12px] shrink-0 ${theme === 'dark' ? 'opacity-75' : 'opacity-80'}`}>
          {node.role === 'user' ? '◦' : '•'}
        </span>

        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <div className={`flex-1 min-w-0 text-[12.5px] truncate tracking-[0.01em] ${isActive ? theme === 'dark' ? 'text-cyan-100' : 'text-cyan-700' : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {getDisplayTitle(node)}
          </div>
          {children.length > 0 && (
            <span className={`
              shrink-0 min-w-[18px] text-center px-1.5 py-0.5 rounded-full text-[10px]
              ${isActive
                ? theme === 'dark'
                  ? 'bg-cyan-400/10 text-cyan-200'
                  : 'bg-cyan-100 text-cyan-700'
                : theme === 'dark'
                  ? 'bg-white/6 text-gray-500'
                  : 'bg-gray-100 text-gray-500'
              }
            `}>
              {children.length}
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartRename(node)
              }}
              className={`p-0.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/8 text-gray-500' : 'hover:bg-gray-200 text-gray-500'}`}
              title="重命名节点"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRequestDelete(node)
              }}
              className="p-0.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
              title="删除节点"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div
        className="relative"
        onDragOver={(e) => {
          e.preventDefault()
          onDragOver(nodeId, 'after')
        }}
        onDrop={(e) => {
          e.preventDefault()
          onDrop(nodeId, 'after')
        }}
      >
        {renderDropZone('after')}
      </div>

      {children.length > 0 && expanded && (
        <div className={`ml-3 border-l pl-1 ${theme === 'dark' ? 'border-white/8' : 'border-gray-200/90'}`}>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              nodeId={child.id}
              level={level + 1}
              activeCheckpointId={activeCheckpointId}
              draggedNodeId={draggedNodeId}
              dropTarget={dropTarget}
              onStartRename={onStartRename}
              onRequestDelete={onRequestDelete}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const {
    currentTree,
    trees,
    loadTree,
    deleteTree,
    createTree,
    renameTree,
    updateNode,
    deleteNode,
    theme,
  } = useStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingTreeId, setEditingTreeId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ nodeId: string; position: DropPosition } | null>(null)
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null)
  const [renamingNodeTitle, setRenamingNodeTitle] = useState('')

  const filteredTrees = trees.filter((tree) =>
    tree.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const checkpointRoots = useMemo(
    () => (currentTree ? getCheckpointChildren(currentTree, null) : []),
    [currentTree]
  )

  const activeNode = currentTree?.active_node_id ? currentTree.nodes[currentTree.active_node_id] : null
  const activeCheckpointId = currentTree ? findNearestCheckpointId(currentTree, currentTree.active_node_id) : null
  const canCreateNodeFromCurrent = Boolean(activeNode && !activeNode.is_checkpoint)

  const handleStartEdit = (tree: { id: string; title: string }, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTreeId(tree.id)
    setEditingTitle(tree.title)
  }

  const handleSaveEdit = async () => {
    if (editingTreeId && editingTitle.trim()) {
      await renameTree(editingTreeId, editingTitle.trim())
    }
    setEditingTreeId(null)
    setEditingTitle('')
  }

  const handleCancelEdit = () => {
    setEditingTreeId(null)
    setEditingTitle('')
  }

  const handleDeleteTree = async (tree: { id: string; title: string }, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确定要删除「${tree.title}」吗？此操作不可撤销。`)) {
      await deleteTree(tree.id)
    }
  }

  const handleCreateNodeFromCurrent = async () => {
    if (!activeNode || !currentTree) return

    const siblings = getCheckpointChildren(currentTree, activeCheckpointId)
    await updateNode(activeNode.id, {
      is_checkpoint: true,
      title: activeNode.title || getDisplayTitle(activeNode),
      checkpoint_parent_id: activeCheckpointId,
      checkpoint_order: siblings.length,
    })
  }

  const handleStartRenameNode = (node: MessageNode) => {
    setRenamingNodeId(node.id)
    setRenamingNodeTitle(node.title || getDisplayTitle(node))
  }

  const handleSaveRenameNode = async () => {
    if (!renamingNodeId) return
    await updateNode(renamingNodeId, { title: renamingNodeTitle.trim() || undefined })
    setRenamingNodeId(null)
    setRenamingNodeTitle('')
  }

  const handleDeleteNode = async (node: MessageNode) => {
    if (!currentTree) return
    if (confirm(`确定要删除「${getDisplayTitle(node)}」吗？所有子节点也会被删除。`)) {
      await deleteNode(currentTree.id, node.id)
    }
  }

  const handleDrop = async (targetNodeId: string, position: DropPosition) => {
    if (!currentTree || !draggedNodeId || draggedNodeId === targetNodeId) {
      setDraggedNodeId(null)
      setDropTarget(null)
      return
    }

    const draggedNode = currentTree.nodes[draggedNodeId]
    const targetNode = currentTree.nodes[targetNodeId]
    if (!draggedNode || !targetNode) {
      setDraggedNodeId(null)
      setDropTarget(null)
      return
    }

    const updates: Record<string, Partial<MessageNode>> = {}
    const draggedCurrentParent = getEffectiveCheckpointParentId(currentTree, draggedNode)
    const targetParent = position === 'inside'
      ? targetNode.id
      : getEffectiveCheckpointParentId(currentTree, targetNode)

    if (position === 'inside') {
      let current: MessageNode | undefined = targetNode
      while (current) {
        if (current.id === draggedNodeId) {
          setDraggedNodeId(null)
          setDropTarget(null)
          return
        }
        current = current.checkpoint_parent_id ? currentTree.nodes[current.checkpoint_parent_id] : undefined
      }
    }

    const siblings = getCheckpointChildren(currentTree, targetParent)
      .filter((node) => node.id !== draggedNodeId)

    const targetIndex = position === 'inside'
      ? siblings.length
      : siblings.findIndex((node) => node.id === targetNodeId) + (position === 'after' ? 1 : 0)

    reindexCheckpointSiblings(currentTree, updates, draggedCurrentParent)
    reindexCheckpointSiblings(currentTree, updates, targetParent, draggedNodeId, targetIndex)

    for (const [id, payload] of Object.entries(updates)) {
      await updateNode(id, payload)
    }

    setDraggedNodeId(null)
    setDropTarget(null)
  }

  return (
    <aside className={`
      h-full flex flex-col border-r overflow-hidden
      ${theme === 'dark' ? 'bg-[#0f1722] border-white/5' : 'bg-white border-slate-200'}
    `}>
      <div className="p-3">
        <input
          type="text"
          placeholder="搜索对话..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`
            w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors
            ${theme === 'dark'
              ? 'bg-white/5 border border-transparent focus:border-cyan-400/50 text-gray-300 placeholder-gray-500'
              : 'bg-slate-100 border border-transparent focus:border-cyan-500 text-slate-900 placeholder-slate-400'
            }
          `}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          🌲 森林 ({filteredTrees.length})
        </div>

        <div className="space-y-1 px-2">
          {filteredTrees.map((tree) => (
            <div
              key={tree.id}
              className={`
                group rounded-md transition-colors cursor-pointer
                ${currentTree?.id === tree.id
                  ? theme === 'dark'
                    ? 'bg-white/6 text-cyan-100 border border-white/6'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                  : theme === 'dark'
                    ? 'hover:bg-white/4 text-gray-300 border border-transparent'
                    : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                }
              `}
              onClick={() => loadTree(tree.id)}
            >
              <div className="flex items-center gap-2 p-1.5">
                {editingTreeId === tree.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className={`flex-1 px-2 py-1 rounded text-sm outline-none ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-slate-900 border border-cyan-200'}`}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); void handleSaveEdit() }} className="p-1 rounded hover:bg-green-500/20 text-green-400">
                      <Check size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleCancelEdit() }} className="p-1 rounded hover:bg-red-500/20 text-red-400">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] truncate font-medium tracking-[0.01em]">{tree.title}</div>
                      <div className={`text-[11px] ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>
                        {tree.node_count} 消息 · {new Date(tree.updated_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleStartEdit(tree, e)}
                        className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}
                        title="重命名"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => void handleDeleteTree(tree, e)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={`mx-3 my-3 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`} />

        {currentTree && (
          <div className="px-3 mb-3">
            <button
              onClick={() => void handleCreateNodeFromCurrent()}
              disabled={!canCreateNodeFromCurrent}
              className={`
                w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                ${canCreateNodeFromCurrent
                  ? theme === 'dark'
                    ? 'bg-cyan-400/12 hover:bg-cyan-400/20 text-cyan-300'
                    : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'
                  : theme === 'dark'
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              <Plus size={14} />
              {canCreateNodeFromCurrent ? '将当前消息设为节点' : '当前消息已是节点'}
            </button>
          </div>
        )}

        {currentTree && (
          <div className="px-3 pb-4">
            <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              🌳 节点树
            </div>
            <div className={`mb-3 px-2 py-1.5 rounded-md text-[10.5px] leading-relaxed border ${theme === 'dark' ? 'bg-white/3 text-gray-500 border-white/6' : 'bg-slate-50 text-slate-500 border-slate-200/80'}`}>
              默认聊天保持线性，只有你主动设为节点的消息才会出现在这里。拖拽节点可以调整层级和顺序。
            </div>
            {checkpointRoots.length > 0 ? (
              <div
                className="space-y-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (!draggedNodeId || !currentTree) return
                  const updates: Record<string, Partial<MessageNode>> = {}
                  const draggedNode = currentTree.nodes[draggedNodeId]
                  if (!draggedNode) return
                  reindexCheckpointSiblings(currentTree, updates, getEffectiveCheckpointParentId(currentTree, draggedNode))
                  reindexCheckpointSiblings(currentTree, updates, null, draggedNodeId, checkpointRoots.length)
                  void (async () => {
                    for (const [id, payload] of Object.entries(updates)) {
                      await updateNode(id, payload)
                    }
                    setDraggedNodeId(null)
                    setDropTarget(null)
                  })()
                }}
              >
                {checkpointRoots.map((node) => (
                  <TreeNode
                    key={node.id}
                    nodeId={node.id}
                    level={0}
                    activeCheckpointId={activeCheckpointId}
                    draggedNodeId={draggedNodeId}
                    dropTarget={dropTarget}
                    onStartRename={handleStartRenameNode}
                    onRequestDelete={(target) => void handleDeleteNode(target)}
                    onDragStart={(id) => setDraggedNodeId(id)}
                    onDragOver={(id, position) => setDropTarget({ nodeId: id, position })}
                    onDrop={(id, position) => void handleDrop(id, position)}
                  />
                ))}
              </div>
            ) : (
              <div className={`px-2 py-3 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>
                <p>当前还没有手动创建的节点。</p>
                <p className="mt-1 text-xs">在聊天消息上点击“设为节点”，并输入自定义标题后，它就会出现在这里。</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`p-3 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
        <button
          onClick={() => void createTree()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-cyan-500 hover:bg-cyan-600 text-slate-950"
        >
          <Plus size={18} />
          新建对话
        </button>
      </div>

      {renamingNodeId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRenamingNodeId(null)}>
          <div
            className={`w-full max-w-md rounded-xl shadow-2xl p-4 ${theme === 'dark' ? 'bg-[#17212b]' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>重命名节点</h3>
            <input
              type="text"
              value={renamingNodeTitle}
              onChange={(e) => setRenamingNodeTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg outline-none ${theme === 'dark' ? 'bg-white/5 text-white border border-white/10' : 'bg-slate-50 text-slate-900 border border-slate-200'}`}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRenamingNodeId(null)} className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                取消
              </button>
              <button onClick={() => void handleSaveRenameNode()} className="px-3 py-2 rounded-lg text-sm bg-cyan-500 hover:bg-cyan-600 text-slate-950">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
