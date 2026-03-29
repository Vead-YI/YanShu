import { useState, useEffect, useRef } from 'react'
import { useStore } from '../stores/appStore'
import { Search, X, MessageSquare, ChevronRight } from 'lucide-react'

export default function SearchModal() {
  const { toggleSearch, search, loadTree, switchNode, theme } = useStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const res = await search(value)
      setResults(res)
    } finally {
      setIsSearching(false)
    }
  }
  
  const handleSelect = async (result: any) => {
    await loadTree(result.tree_id)
    switchNode(result.node.id)
    toggleSearch()
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      toggleSearch()
    }
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50"
      onClick={toggleSearch}
    >
      <div 
        className={`
          w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl
          ${theme === 'dark' ? 'bg-[#17212b]' : 'bg-white'}
        `}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* 搜索框 */}
        <div className={`
          flex items-center gap-3 p-4 border-b
          ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}
        `}>
          <Search size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索所有对话内容..."
            className={`
              flex-1 bg-transparent outline-none text-lg
              ${theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}
            `}
          />
          <button
            onClick={toggleSearch}
            className={`
              p-1 rounded hover:bg-white/10
              ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
            `}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 结果列表 */}
        <div className="max-h-96 overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className={`
              p-8 text-center
              ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
            `}>
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p>输入关键词搜索...</p>
            </div>
          ) : isSearching ? (
            <div className={`
              p-8 text-center
              ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
            `}>
              <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-2">搜索中...</p>
            </div>
          ) : results.length === 0 ? (
            <div className={`
              p-8 text-center
              ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
            `}>
              <p>没有找到相关结果</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.tree_id}-${result.node.id}-${index}`}
                  onClick={() => handleSelect(result)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors
                    ${theme === 'dark' 
                      ? 'hover:bg-white/5' 
                      : 'hover:bg-slate-50'
                    }
                  `}
                >
                  <MessageSquare size={18} className={`
                    mt-0.5 shrink-0
                    ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
                  `} />
                  <div className="flex-1 min-w-0">
                    <div className={`
                      text-sm truncate
                      ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}
                    `}>
                      {result.node.content.slice(0, 100)}
                      {result.node.content.length > 100 && '...'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`
                        text-xs
                        ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
                      `}>
                        {result.node.role === 'user' ? '用户' : 'AI'}
                      </span>
                      <ChevronRight size={12} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} />
                      <span className={`
                        text-xs
                        ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
                      `}>
                        {new Date(result.node.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <span className={`
                    text-xs px-2 py-0.5 rounded
                    ${theme === 'dark' ? 'bg-cyan-400/15 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}
                  `}>
                    {Math.round(result.score * 100)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* 底部提示 */}
        <div className={`
          flex items-center justify-between px-4 py-2 text-xs border-t
          ${theme === 'dark' ? 'border-white/10 text-gray-500' : 'border-slate-200 text-slate-400'}
        `}>
          <div className="flex items-center gap-4">
            <span>↑↓ 导航</span>
            <span>Enter 选择</span>
            <span>Esc 关闭</span>
          </div>
          <span>{results.length} 个结果</span>
        </div>
      </div>
    </div>
  )
}
