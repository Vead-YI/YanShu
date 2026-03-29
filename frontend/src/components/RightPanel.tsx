import { useState } from 'react'
import { useStore, useNodePath } from '../stores/appStore'
import { 
  Tag,
  Clock,
  Hash,
  FileText,
  Edit2,
  Save,
  X,
  GitBranch,
  Copy,
  MessageSquare,
} from 'lucide-react'

export default function RightPanel() {
  const { currentTree, updateNode, deleteNode } = useStore()
  const path = useNodePath(currentTree?.active_node_id || null)
  const activeNode = path[path.length - 1]
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  
  if (!currentTree || !activeNode) {
    return (
      <aside className={`
        w-80 flex items-center justify-center border-l
        ${currentTree?.theme === 'dark' ? 'bg-[#0f1722] border-white/5' : 'bg-white border-slate-200'}
      `}>
        <div className="text-center px-4">
          <MessageSquare size={32} className={`mx-auto mb-2 opacity-50 ${currentTree?.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={`text-sm ${currentTree?.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            选择一个节点查看详情
          </p>
        </div>
      </aside>
    )
  }
  
  const theme = currentTree.theme || 'dark'
  
  const handleStartEdit = () => {
    setEditedTitle(activeNode.title || '')
    setEditedContent(activeNode.content)
    setEditedTags([...activeNode.tags])
    setIsEditing(true)
  }
  
  const handleSave = async () => {
    await updateNode(activeNode.id, { 
      title: editedTitle || undefined,
      content: editedContent,
      tags: editedTags,
    })
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setEditedTitle('')
    setEditedContent('')
    setEditedTags([])
    setIsEditing(false)
  }
  
  const handleAddTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()])
      setNewTag('')
    }
  }
  
  const handleRemoveTag = (tag: string) => {
    setEditedTags(editedTags.filter(t => t !== tag))
  }
  
  const handleDelete = async () => {
    if (confirm('确定要删除这个节点吗？所有子节点也会被删除。')) {
      await deleteNode(currentTree.id, activeNode.id)
    }
  }
  
  const handleCopy = () => {
    navigator.clipboard.writeText(activeNode.content)
  }

  return (
    <aside className={`
      w-80 flex flex-col border-l overflow-hidden
      ${theme === 'dark' ? 'bg-[#0f1722] border-white/5' : 'bg-white border-slate-200'}
    `}>
      {/* 头部 */}
      <div className={`
        flex items-center justify-between p-4 border-b
        ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}
      `}>
        <h2 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <FileText size={18} />
          节点详情
        </h2>
        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className={`
              p-1.5 rounded transition-colors
              ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}
            `}
            title="编辑"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>
      
      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 角色 */}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>类型:</span>
          <span className={`
            px-2 py-0.5 rounded text-xs font-medium
            ${activeNode.role === 'user' 
              ? 'bg-cyan-400/15 text-cyan-300' 
              : 'bg-slate-400/15 text-slate-300'
            }
          `}>
            {activeNode.role === 'user' ? '👤 用户消息' : '🤖 AI 回复'}
          </span>
        </div>
        
        {/* 标题 */}
        {isEditing ? (
          <div>
            <label className={`flex items-center gap-1 text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <Hash size={12} />
              标题
            </label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="节点标题（可选）"
              className={`
                w-full px-3 py-2 rounded-lg text-sm outline-none
                ${theme === 'dark' 
                  ? 'bg-white/5 border border-white/10 focus:border-cyan-400 text-white' 
                  : 'bg-slate-100 border border-slate-200 focus:border-cyan-500 text-slate-900'
                }
              `}
            />
          </div>
        ) : (
          activeNode.title && (
            <div>
              <label className={`flex items-center gap-1 text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <Hash size={12} />
                标题
              </label>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                {activeNode.title}
              </p>
            </div>
          )
        )}
        
        {/* 内容 */}
        {isEditing ? (
          <div>
            <label className={`flex items-center gap-1 text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <MessageSquare size={12} />
              内容
            </label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={6}
              className={`
                w-full px-3 py-2 rounded-lg text-sm outline-none resize-none
                ${theme === 'dark' 
                  ? 'bg-white/5 border border-white/10 focus:border-cyan-400 text-white' 
                  : 'bg-slate-100 border border-slate-200 focus:border-cyan-500 text-slate-900'
                }
              `}
            />
          </div>
        ) : (
          <div>
            <label className={`flex items-center gap-1 text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <MessageSquare size={12} />
              内容
            </label>
            <div className={`
              p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap
              ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}
            `}>
              {activeNode.content}
            </div>
          </div>
        )}
        
        {/* 标签 */}
        <div>
          <label className={`flex items-center gap-1 text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <Tag size={12} />
            标签
          </label>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {(isEditing ? editedTags : activeNode.tags).map((tag) => (
              <span
                key={tag}
                className={`
                  flex items-center gap-1 px-2 py-0.5 rounded text-xs
                  ${theme === 'dark' ? 'bg-cyan-400/15 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}
                `}
              >
                #{tag}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 ml-0.5"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
            {(isEditing ? editedTags : activeNode.tags).length === 0 && (
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                暂无标签
              </span>
            )}
          </div>
          
          {isEditing && (
            <div className="flex gap-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="添加标签..."
                className={`
                  flex-1 px-2 py-1 rounded text-xs outline-none
                  ${theme === 'dark' 
                    ? 'bg-white/5 border border-white/10 focus:border-cyan-400 text-white' 
                    : 'bg-slate-100 border border-slate-200 focus:border-cyan-500 text-slate-900'
                  }
                `}
              />
              <button
                onClick={handleAddTag}
                className={`
                  px-2 py-1 rounded text-xs transition-colors
                  ${theme === 'dark' 
                    ? 'bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300' 
                    : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'
                  }
                `}
              >
                添加
              </button>
            </div>
          )}
        </div>
        
        {/* AI 摘要 */}
        {activeNode.summary && (
          <div>
            <label className={`flex items-center gap-1 text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <FileText size={12} />
              AI 摘要
            </label>
            <div className={`
              p-3 rounded-lg border
              ${theme === 'dark' 
                ? 'bg-amber-500/10 border-amber-500/20' 
                : 'bg-amber-50 border-amber-200'
              }
            `}>
              <p className={`text-sm ${theme === 'dark' ? 'text-amber-200/80' : 'text-amber-700'}`}>
                {activeNode.summary}
              </p>
            </div>
          </div>
        )}
        
        {/* 时间信息 */}
        <div className={`space-y-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          <div className="flex items-center gap-2">
            <Clock size={12} />
            <span>创建: {new Date(activeNode.created_at).toLocaleString('zh-CN')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} />
            <span>更新: {new Date(activeNode.updated_at).toLocaleString('zh-CN')}</span>
          </div>
          {activeNode.edit_count > 0 && (
            <div className="flex items-center gap-2">
              <Edit2 size={12} />
              <span>已编辑 {activeNode.edit_count} 次</span>
            </div>
          )}
        </div>
        
        {/* 分支信息 */}
        {activeNode.children.length > 0 && (
          <div>
            <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <GitBranch size={12} className="inline mr-1" />
              分支 ({activeNode.children.length})
            </label>
            <div className={`
              p-3 rounded-lg space-y-1
              ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}
            `}>
              {activeNode.children.slice(0, 5).map((childId) => {
                const child = currentTree.nodes[childId]
                return child ? (
                  <button
                    key={childId}
                    onClick={() => useStore.getState().switchNode(childId)}
                    className={`
                      w-full flex items-center gap-2 p-2 rounded text-left text-xs transition-colors
                      ${theme === 'dark' ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-slate-100 text-slate-700'}
                    `}
                  >
                    <GitBranch size={12} className="text-cyan-300 shrink-0" />
                    <span className="truncate">
                      {child.title || child.content.slice(0, 30)}
                    </span>
                  </button>
                ) : null
              })}
              {activeNode.children.length > 5 && (
                <p className={`text-xs text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  还有 {activeNode.children.length - 5} 个分支...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 底部操作 */}
      <div className={`
        p-4 border-t space-y-2
        ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}
      `}>
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm transition-colors
                ${theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10 text-gray-300' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }
              `}
            >
              <X size={14} className="inline mr-1" />
              取消
            </button>
            <button
              onClick={handleSave}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${theme === 'dark' 
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950' 
                  : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950'
                }
              `}
            >
              <Save size={14} className="inline mr-1" />
              保存
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`
                flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors
                ${theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10 text-gray-300' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }
              `}
            >
              <Copy size={14} />
              复制
            </button>
            <button
              onClick={handleDelete}
              className={`
                flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors
                bg-red-500/20 hover:bg-red-500/30 text-red-400
              `}
            >
              <X size={14} />
              删除
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
