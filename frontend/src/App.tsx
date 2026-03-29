import { useEffect, useRef, useState } from 'react'
import { useStore } from './stores/appStore'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import RightPanel from './components/RightPanel'

function App() {
  const { 
    currentTree, 
    sidebarOpen, 
    rightPanelOpen,
    loadTree,
    setTrees,
    createTree,
    setTheme,
    sidebarWidth,
    setSidebarWidth,
  } = useStore()
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const appRef = useRef<HTMLDivElement>(null)

  // 初始化：加载树列表
  useEffect(() => {
    async function init() {
      try {
        const response = await fetch('http://localhost:8000/api/trees')
        const data = await response.json()
        setTrees(data)
        
        // 如果有树，加载最新的
        if (data.length > 0 && !currentTree) {
          loadTree(data[0].id)
        } else if (data.length === 0) {
          // 创建第一个树
          createTree('我的第一个对话')
        }
      } catch (error) {
        console.error('Failed to load trees:', error)
      }
    }
    
    init()
  }, [])

  // 加载主题设置
  useEffect(() => {
    const savedTheme = (
      localStorage.getItem('yanshu_theme') ||
      localStorage.getItem('mindtree_theme')
    ) as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [setTheme])

  useEffect(() => {
    if (!isResizingSidebar) return

    const handleMouseMove = (event: MouseEvent) => {
      const appLeft = appRef.current?.getBoundingClientRect().left ?? 0
      setSidebarWidth(event.clientX - appLeft)
    }

    const handleMouseUp = () => {
      setIsResizingSidebar(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingSidebar, setSidebarWidth])

  const theme = currentTree?.theme || 'dark'

  return (
    <div
      ref={appRef}
      className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-[#081017]' : 'bg-slate-50'}`}
    >
      {/* 头部 */}
      <Header />
      
      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧树状导航 */}
        {sidebarOpen && (
          <>
            <div style={{ width: `${sidebarWidth}px` }} className="shrink-0 min-w-0">
              <Sidebar />
            </div>
            <div
              className={`
                w-1 shrink-0 cursor-col-resize transition-colors
                ${theme === 'dark' ? 'bg-white/5 hover:bg-cyan-400/40' : 'bg-slate-200 hover:bg-cyan-300'}
              `}
              onMouseDown={() => setIsResizingSidebar(true)}
              title="拖拽调整节点栏宽度"
            />
          </>
        )}
        
        {/* 中间聊天区 */}
        <ChatView />
        
        {/* 右侧节点信息 */}
        {rightPanelOpen && currentTree && <RightPanel />}
      </div>
    </div>
  )
}

export default App
