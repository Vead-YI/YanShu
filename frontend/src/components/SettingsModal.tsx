import { useState } from 'react'
import { useStore } from '../stores/appStore'
import { Settings, X, Download, Upload, Trash2, Info } from 'lucide-react'

type ExportData = Record<string, unknown> | { content: string } | null

export default function SettingsModal() {
  const { 
    toggleSettings, 
    theme, 
    setTheme, 
    contextMode, 
    setContextMode,
    currentTree,
    exportTree,
    deleteTree,
  } = useStore()
  
  const [exportLoading, setExportLoading] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  
  const handleExport = async (format: string) => {
    if (!currentTree) return
    
    setExportLoading(true)
    try {
      const data = await exportTree(currentTree.id, format) as ExportData
      if (data) {
        if (format === 'json') {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${currentTree.title}.json`
          a.click()
          URL.revokeObjectURL(url)
        } else if (format === 'markdown' && 'content' in data && typeof data.content === 'string') {
          const blob = new Blob([data.content], { type: 'text/markdown' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${currentTree.title}.md`
          a.click()
          URL.revokeObjectURL(url)
        }
      }
    } finally {
      setExportLoading(false)
    }
  }
  
  const handleImport = async () => {
    if (!importFile) return
    
    try {
      const text = await importFile.text()
      const data = JSON.parse(text)
      
      const response = await fetch('http://localhost:8000/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        alert('导入成功！')
        window.location.reload()
      } else {
        alert('导入失败')
      }
    } catch (error) {
      alert('导入失败：文件格式错误')
    }
  }
  
  const handleDeleteAll = async () => {
    if (!currentTree) return
    
    if (confirm(`确定要删除「${currentTree.title}」吗？此操作不可撤销！`)) {
      await deleteTree(currentTree.id)
      toggleSettings()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={toggleSettings}
    >
      <div 
        className={`
          w-full max-w-md rounded-xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto
          ${theme === 'dark' ? 'bg-[#17212b]' : 'bg-white'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className={`
          flex items-center justify-between p-4 border-b
          ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}
        `}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Settings size={20} />
            设置
          </h2>
          <button
            onClick={toggleSettings}
            className={`
              p-1 rounded hover:bg-white/10
              ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
            `}
          >
            <X size={20} />
          </button>
        </div>

        {/* 设置内容 */}
        <div className="p-4 space-y-6">
          {/* 主题 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              🎨 主题
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('dark')}
                className={`
                  flex-1 p-3 rounded-lg border-2 transition-all
                  ${theme === 'dark' 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : theme === 'light' 
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-200 bg-slate-50'
                  }
                `}
              >
                <div className="text-2xl mb-1">🌙</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>暗色</div>
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`
                  flex-1 p-3 rounded-lg border-2 transition-all
                  ${theme === 'light' 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-slate-200 bg-slate-50'
                  }
                `}
              >
                <div className="text-2xl mb-1">☀️</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>亮色</div>
              </button>
            </div>
          </div>

          {/* 上下文模式 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              🧠 默认上下文继承模式
            </label>
            <div className="space-y-2">
              {[
                { value: 'full', label: '✓ 完整继承', desc: '包含全部对话历史，适合延续性探索' },
                { value: 'summary', label: '🧠 摘要模式', desc: '只包含 AI 摘要，节省 Token' },
                { value: 'cold', label: '❄️ 冷启动', desc: '不继承任何上下文，完全重新开始' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setContextMode(opt.value as any)}
                  className={`
                    w-full p-3 rounded-lg border-2 text-left transition-all
                    ${contextMode === opt.value 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : theme === 'dark' 
                        ? 'border-white/10 hover:border-white/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <div className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    {opt.label}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 导出 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              📥 导出对话
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                disabled={!currentTree || exportLoading}
                className={`
                  flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors
                  ${theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-50' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50'
                  }
                `}
              >
                <Download size={16} />
                JSON
              </button>
              <button
                onClick={() => handleExport('markdown')}
                disabled={!currentTree || exportLoading}
                className={`
                  flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors
                  ${theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-50' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50'
                  }
                `}
              >
                <Download size={16} />
                Markdown
              </button>
            </div>
          </div>

          {/* 导入 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              📤 导入对话
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className={`
                  flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors
                  ${theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10 text-gray-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }
                `}
              >
                <Upload size={16} />
                {importFile ? importFile.name : '选择文件'}
              </label>
              <button
                onClick={handleImport}
                disabled={!importFile}
                className={`
                  px-4 py-2 rounded-lg text-sm transition-colors
                  ${theme === 'dark' 
                    ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 disabled:opacity-50' 
                    : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 disabled:opacity-50'
                  }
                `}
              >
                导入
              </button>
            </div>
          </div>

          {/* 删除 */}
          {currentTree && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                🗑️ 删除当前对话
              </label>
              <button
                onClick={handleDeleteAll}
                className={`
                  w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors
                  bg-red-500/20 hover:bg-red-500/30 text-red-400
                `}
              >
                <Trash2 size={16} />
                删除「{currentTree.title}」
              </button>
            </div>
          )}

          {/* 关于 */}
          <div className={`
            p-4 rounded-lg
            ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}
          `}>
            <h3 className={`text-sm font-medium mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Info size={16} />
              关于 YanShu
            </h3>
            <div className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              <p>版本 0.2.0</p>
              <p>🌳 让思维像森林一样生长</p>
              <p>
                <a 
                  href="https://github.com/Vead-YI/YanShu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  GitHub
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
