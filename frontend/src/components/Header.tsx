import { useEffect } from 'react'
import { useStore } from '../stores/appStore'
import { 
  Menu, 
  Plus, 
  Search, 
  Settings,
  PanelLeftClose,
  PanelRightClose,
  Sun,
  Moon,
} from 'lucide-react'
import SearchModal from './SearchModal'
import SettingsModal from './SettingsModal'

export default function Header() {
  const { 
    currentTree,
    toggleSidebar, 
    toggleRightPanel,
    sidebarOpen,
    rightPanelOpen,
    createTree,
    showSearch,
    showSettings,
    toggleSearch,
    toggleSettings,
    theme,
    setTheme,
  } = useStore()
  
  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: 新建对话
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        createTree()
      }
      
      // Ctrl/Cmd + K: 搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggleSearch()
      }
      
      // Ctrl/Cmd + ,: 设置
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        toggleSettings()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createTree, toggleSearch, toggleSettings])
  
  return (
    <>
      <header className={`
        h-14 border-b flex items-center justify-between px-4
        ${theme === 'dark' ? 'bg-[#0f1722] border-white/5' : 'bg-white border-slate-200'}
      `}>
        {/* 左侧 */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className={`
              p-2 rounded-lg transition-colors
              ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'}
            `}
            title={sidebarOpen ? '隐藏侧边栏' : '显示侧边栏'}
          >
            {sidebarOpen 
              ? <PanelLeftClose size={18} className={theme === 'dark' ? '' : 'text-gray-700'} /> 
              : <Menu size={18} className={theme === 'dark' ? '' : 'text-gray-700'} />
            }
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xl">🌳</span>
            <h1 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              YanShu
            </h1>
          </div>
        </div>

        {/* 中间 - 当前对话标题 */}
        <div className="flex items-center gap-2">
          {currentTree && (
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentTree.title}
            </span>
          )}
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-2">
          {/* 搜索按钮 */}
          <button 
            onClick={toggleSearch}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
              ${theme === 'dark' 
                ? 'bg-white/5 hover:bg-white/10 text-gray-300' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }
            `}
            title="搜索 (Ctrl+K)"
          >
            <Search size={16} />
            <span className="hidden sm:inline">搜索</span>
            <kbd className={`
              hidden md:inline px-1.5 py-0.5 text-xs rounded
              ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}
            `}>
              ⌘K
            </kbd>
          </button>
          
          <button
            onClick={() => createTree()}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
              ${theme === 'dark' 
                ? 'bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300' 
                : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'
              }
            `}
            title="新对话 (Ctrl+N)"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">新对话</span>
          </button>
          
          {/* 主题切换 */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`
              p-2 rounded-lg transition-colors
              ${theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-slate-600'}
            `}
            title="切换主题"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={toggleSettings}
            className={`
              p-2 rounded-lg transition-colors
              ${theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-slate-600'}
            `}
            title="设置 (Ctrl+,)"
          >
            <Settings size={18} />
          </button>
          
          <button
            onClick={toggleRightPanel}
            className={`
              p-2 rounded-lg transition-colors
              ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'}
            `}
            title={rightPanelOpen ? '隐藏信息面板' : '显示信息面板'}
          >
            {rightPanelOpen 
              ? <PanelRightClose size={18} className={theme === 'dark' ? '' : 'text-gray-700'} /> 
              : <PanelRightClose size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
            }
          </button>
        </div>
      </header>

      {/* 搜索弹窗 */}
      {showSearch && <SearchModal />}
      
      {/* 设置弹窗 */}
      {showSettings && <SettingsModal />}
    </>
  )
}
