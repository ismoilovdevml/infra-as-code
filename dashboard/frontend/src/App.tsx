import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  Folder, Play, FileText, Settings, Loader2, CheckCircle, XCircle,
  Terminal, Save, Code, History, BarChart3, Star, Download, Copy,
  Clock, TrendingUp, Activity, Home, Bell
} from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import Convert from 'ansi-to-html'
import { formatDistanceToNow, format } from 'date-fns'

const convert = new Convert({
  fg: '#e5e7eb',  // Light gray (default text)
  bg: '#111827',  // Dark background
  colors: {
    0: '#1f2937',   // Black -> Dark gray
    1: '#ef4444',   // Red
    2: '#10b981',   // Green
    3: '#f59e0b',   // Yellow
    4: '#3b82f6',   // Blue
    5: '#a855f7',   // Magenta
    6: '#06b6d4',   // Cyan
    7: '#f3f4f6',   // White -> Light gray
  }
})

interface AnsibleFolder {
  name: string
  path: string
  has_inventory: boolean
  has_vars: boolean
  has_playbooks: boolean
  playbooks: string[]
}

interface JobStatus {
  job_id: string
  status: string
  output: string
  started_at: string
  completed_at: string | null
  duration: number | null
  return_code: number | null
  folder: string
  playbook: string
}

interface HistoryItem {
  job_id: string
  folder: string
  playbook: string
  status: string
  started_at: string
  completed_at: string
  duration: number
  return_code: number
  output_preview: string
}

interface Statistics {
  total_executions: number
  successful: number
  failed: number
  success_rate: number
  average_duration: number
  most_used_folders: Array<{ name: string; count: number }>
  recent_activity: HistoryItem[]
}

// Local storage helpers
const getFavorites = (): string[] => {
  const stored = localStorage.getItem('ansible_favorites')
  return stored ? JSON.parse(stored) : []
}

const saveFavorites = (favorites: string[]) => {
  localStorage.setItem('ansible_favorites', JSON.stringify(favorites))
}

const toggleFavorite = (folderName: string) => {
  const favorites = getFavorites()
  const index = favorites.indexOf(folderName)
  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push(folderName)
  }
  saveFavorites(favorites)
  return favorites
}

// Navigation component
function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="flex items-center space-x-1 bg-gray-800/50 px-4 py-2 rounded-lg">
      <Link
        to="/"
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
          isActive('/')
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
        }`}
      >
        <Home className="w-4 h-4" />
        Dashboard
      </Link>
      <Link
        to="/history"
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
          isActive('/history')
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
        }`}
      >
        <History className="w-4 h-4" />
        History
      </Link>
      <Link
        to="/statistics"
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
          isActive('/statistics')
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        Statistics
      </Link>
    </nav>
  )
}

// Main Dashboard Component
function Dashboard() {
  const [folders, setFolders] = useState<AnsibleFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<AnsibleFolder | null>(null)
  const [selectedPlaybook, setSelectedPlaybook] = useState<string>('')
  const [inventory, setInventory] = useState<any>({})
  const [vars, setVars] = useState<any>({})
  const [inventoryRaw, setInventoryRaw] = useState<string>('')
  const [varsRaw, setVarsRaw] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null)
  const [editMode, setEditMode] = useState<'structured' | 'raw'>('structured')
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState<string[]>(getFavorites())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    loadFolders()

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (selectedFolder) {
      loadFolderData()
    }
  }, [selectedFolder])

  useEffect(() => {
    if (currentJob && currentJob.status === 'running') {
      const interval = setInterval(() => {
        checkJobStatus(currentJob.job_id)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [currentJob])

  const loadFolders = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/folders')
      setFolders(response.data)
      toast.success(`Loaded ${response.data.length} folders`)
    } catch (error) {
      toast.error('Failed to load folders')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadFolderData = async () => {
    if (!selectedFolder) return

    setLoading(true)
    try {
      if (selectedFolder.has_inventory) {
        const invResponse = await axios.get(`/api/folders/${selectedFolder.name}/inventory`)
        setInventory(invResponse.data.content)
        setInventoryRaw(invResponse.data.raw)
      }

      if (selectedFolder.has_vars) {
        const varsResponse = await axios.get(`/api/folders/${selectedFolder.name}/vars`)
        setVars(varsResponse.data.content)
        setVarsRaw(varsResponse.data.raw)
      }

      if (selectedFolder.playbooks.length > 0) {
        setSelectedPlaybook(selectedFolder.playbooks[0])
      }
    } catch (error) {
      toast.error('Failed to load folder data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const saveInventory = async () => {
    if (!selectedFolder) return

    try {
      await axios.post(`/api/folders/${selectedFolder.name}/inventory`,
        editMode === 'raw' ? { raw: inventoryRaw } : inventory
      )
      toast.success('✅ Inventory saved')
    } catch (error) {
      toast.error('Failed to save inventory')
    }
  }

  const saveVars = async () => {
    if (!selectedFolder) return

    try {
      await axios.post(`/api/folders/${selectedFolder.name}/vars`,
        editMode === 'raw' ? { raw: varsRaw } : vars
      )
      toast.success('✅ Variables saved')
    } catch (error) {
      toast.error('Failed to save variables')
    }
  }

  const runPlaybook = async () => {
    if (!selectedFolder || !selectedPlaybook) return

    setRunning(true)
    try {
      const response = await axios.post('/api/run', {
        folder: selectedFolder.name,
        playbook: selectedPlaybook,
        inventory: 'inventory.ini',
        vars: vars
      })

      setCurrentJob({
        job_id: response.data.job_id,
        status: 'running',
        output: '',
        started_at: new Date().toISOString(),
        completed_at: null,
        duration: null,
        return_code: null,
        folder: selectedFolder.name,
        playbook: selectedPlaybook
      })

      toast.success('🚀 Playbook started')
    } catch (error) {
      toast.error('Failed to start playbook')
      setRunning(false)
    }
  }

  const checkJobStatus = async (jobId: string) => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`)
      setCurrentJob(response.data)

      if (response.data.status === 'completed') {
        toast.success(`✅ Playbook completed in ${response.data.duration}s`)
        setRunning(false)

        // Show desktop notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Playbook Completed', {
            body: `${response.data.folder}/${response.data.playbook} completed successfully`,
            icon: '/favicon.ico'
          })
        }
      } else if (response.data.status === 'failed' || response.data.status === 'error') {
        toast.error(`❌ Playbook failed (${response.data.duration}s)`)
        setRunning(false)

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Playbook Failed', {
            body: `${response.data.folder}/${response.data.playbook} failed`,
            icon: '/favicon.ico'
          })
        }
      }
    } catch (error) {
      console.error('Failed to check job status', error)
    }
  }

  const updateVarValue = (key: string, value: any) => {
    setVars({ ...vars, [key]: value })
  }

  const handleFavoriteToggle = (folderName: string) => {
    const newFavorites = toggleFavorite(folderName)
    setFavorites(newFavorites)
    toast.success(newFavorites.includes(folderName) ? '⭐ Added to favorites' : 'Removed from favorites')
  }

  const exportOutput = (format: 'txt' | 'json') => {
    if (!currentJob) return

    const data = format === 'json'
      ? JSON.stringify(currentJob, null, 2)
      : currentJob.output

    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentJob.folder}_${currentJob.playbook}_${Date.now()}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`📥 Downloaded as ${format.toUpperCase()}`)
  }

  const copyOutput = () => {
    if (!currentJob) return
    navigator.clipboard.writeText(currentJob.output)
    toast.success('📋 Copied to clipboard')
  }

  const filteredFolders = folders
    .filter(folder => folder.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(folder => !showFavoritesOnly || favorites.includes(folder.name))
    .sort((a, b) => {
      const aFav = favorites.includes(a.name)
      const bFav = favorites.includes(b.name)
      if (aFav && !bFav) return -1
      if (!aFav && bFav) return 1
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border border-green-500/20 shadow-xl shadow-green-500/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-400 flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                Folders
              </h2>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                {filteredFolders.length}
              </span>
            </div>

            <input
              type="text"
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 mb-2 bg-gray-900 border border-green-500/30 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`w-full mb-4 px-3 py-2 rounded-lg text-sm flex items-center gap-2 justify-center transition-all ${
                showFavoritesOnly
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-green-400' : ''}`} />
              Favorites Only
            </button>

            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-900">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                </div>
              ) : (
                filteredFolders.map((folder) => (
                  <div key={folder.name} className="relative group">
                    <button
                      onClick={() => setSelectedFolder(folder)}
                      className={`w-full text-left px-3 py-3 pr-10 rounded-lg transition-all duration-200 ${
                        selectedFolder?.name === folder.name
                          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 shadow-lg shadow-green-500/20'
                          : 'bg-gray-900 border border-gray-700 hover:border-green-500/50 hover:bg-gray-900/80'
                      }`}
                    >
                      <div className="font-medium text-gray-200">{folder.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {folder.playbooks.length} playbook(s)
                        </span>
                        {folder.has_vars && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">vars</span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleFavoriteToggle(folder.name)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          favorites.includes(folder.name)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedFolder ? (
            <>
              {/* Playbook Execution */}
              <div className="bg-gray-800 rounded-xl border border-green-500/20 shadow-xl shadow-green-500/5 p-6">
                <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center">
                  <Play className="w-6 h-6 mr-2" />
                  Execute Playbook
                </h2>
                <div className="flex gap-4">
                  <select
                    value={selectedPlaybook}
                    onChange={(e) => setSelectedPlaybook(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-900 border border-green-500/30 rounded-lg text-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {selectedFolder.playbooks.map((playbook) => (
                      <option key={playbook} value={playbook}>
                        {playbook}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={runPlaybook}
                    disabled={running || !selectedPlaybook}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/30 transition-all"
                  >
                    {running ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Run
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Variables Editor with Monaco */}
              {selectedFolder.has_vars && (
                <div className="bg-gray-800 rounded-xl border border-green-500/20 shadow-xl shadow-green-500/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-green-400 flex items-center">
                      <Settings className="w-6 h-6 mr-2" />
                      Variables
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditMode('structured')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                          editMode === 'structured'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Form
                      </button>
                      <button
                        onClick={() => setEditMode('raw')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1 ${
                          editMode === 'raw'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        YAML
                      </button>
                      <button
                        onClick={saveVars}
                        className="px-4 py-1.5 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-1 shadow-lg shadow-green-500/20"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>

                  {editMode === 'structured' ? (
                    <div className="space-y-4">
                      {Object.entries(vars).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {key}
                          </label>
                          <input
                            type="text"
                            value={String(value)}
                            onChange={(e) => updateVarValue(key, e.target.value)}
                            className="w-full px-4 py-3 bg-gray-900 border border-green-500/30 rounded-lg text-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-green-500/30 rounded-lg overflow-hidden">
                      <Editor
                        height="300px"
                        language="yaml"
                        value={varsRaw}
                        onChange={(value) => setVarsRaw(value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Editor */}
              {selectedFolder.has_inventory && (
                <div className="bg-gray-800 rounded-xl border border-green-500/20 shadow-xl shadow-green-500/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-green-400 flex items-center">
                      <FileText className="w-6 h-6 mr-2" />
                      Inventory
                    </h2>
                    <button
                      onClick={saveInventory}
                      className="px-4 py-1.5 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-1 shadow-lg shadow-green-500/20"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                  <div className="border border-green-500/30 rounded-lg overflow-hidden">
                    <Editor
                      height="200px"
                      language="ini"
                      value={inventoryRaw}
                      onChange={(value) => setInventoryRaw(value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Job Output with ANSI colors and timestamps */}
              {currentJob && (
                <div className="bg-gray-800 rounded-xl border border-green-500/20 shadow-xl shadow-green-500/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                        <Terminal className="w-6 h-6" />
                        {currentJob.status === 'running' && <Loader2 className="w-5 h-5 animate-spin text-green-500" />}
                        {currentJob.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {(currentJob.status === 'failed' || currentJob.status === 'error') && <XCircle className="w-5 h-5 text-red-500" />}
                        Execution Output
                      </h2>
                      {currentJob.duration !== null && (
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {currentJob.duration}s
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                        currentJob.status === 'running' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        currentJob.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {currentJob.status.toUpperCase()}
                      </span>
                      {currentJob.status !== 'running' && (
                        <>
                          <button
                            onClick={copyOutput}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4 text-gray-300" />
                          </button>
                          <button
                            onClick={() => exportOutput('txt')}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Download as TXT"
                          >
                            <Download className="w-4 h-4 text-gray-300" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="bg-[#111827] p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto border border-green-500/30 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-900"
                    dangerouslySetInnerHTML={{
                      __html: convert.toHtml(currentJob.output || 'Waiting for output...')
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-green-500/20 shadow-xl shadow-green-500/5 p-12 text-center">
              <Folder className="w-20 h-20 mx-auto mb-6 text-green-500/50" />
              <p className="text-xl text-gray-400">Select a folder to get started</p>
              <p className="text-sm text-gray-500 mt-2">Choose an Ansible project from the sidebar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// History Page Component
function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [fullOutput, setFullOutput] = useState<string>('')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/history?limit=100')
      setHistory(response.data)
    } catch (error) {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const loadFullOutput = async (jobId: string) => {
    try {
      const response = await axios.get(`/api/history/${jobId}`)
      setFullOutput(response.data.output || response.data.output_preview)
    } catch (error) {
      toast.error('Failed to load full output')
    }
  }

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return

    try {
      await axios.delete('/api/history')
      setHistory([])
      toast.success('History cleared')
    } catch (error) {
      toast.error('Failed to clear history')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
          Execution History
        </h1>
        <button
          onClick={clearHistory}
          className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Clear History
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-green-500/20 p-12 text-center">
          <History className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No execution history yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 max-h-[800px] overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.job_id}
                onClick={() => {
                  setSelectedItem(item)
                  loadFullOutput(item.job_id)
                }}
                className={`bg-gray-800 rounded-lg border p-4 cursor-pointer transition-all ${
                  selectedItem?.job_id === item.job_id
                    ? 'border-green-500 shadow-lg shadow-green-500/20'
                    : 'border-gray-700 hover:border-green-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-200">{item.folder}</h3>
                    <p className="text-sm text-gray-400">{item.playbook}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    item.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.duration}s
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(item.started_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-xl border border-green-500/20 p-6 sticky top-6">
            {selectedItem ? (
              <>
                <h3 className="text-xl font-semibold text-green-400 mb-4">
                  {selectedItem.folder} / {selectedItem.playbook}
                </h3>
                <div className="space-y-2 mb-4 text-sm">
                  <p className="text-gray-400">
                    <span className="text-gray-500">Started:</span> {format(new Date(selectedItem.started_at), 'PPpp')}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-500">Duration:</span> {selectedItem.duration}s
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-500">Return Code:</span> {selectedItem.return_code}
                  </p>
                </div>
                <div
                  className="bg-[#111827] p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto border border-green-500/30"
                  dangerouslySetInnerHTML={{
                    __html: convert.toHtml(fullOutput || selectedItem.output_preview)
                  }}
                />
              </>
            ) : (
              <div className="text-center py-20 text-gray-500">
                Select an item to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Statistics Page Component
function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/statistics')
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-8">
        Statistics
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl border border-green-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Executions</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.total_executions}</p>
            </div>
            <Activity className="w-12 h-12 text-green-500/30" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-green-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.success_rate}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500/30" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-green-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Duration</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.average_duration}s</p>
            </div>
            <Clock className="w-12 h-12 text-green-500/30" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-green-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Successful</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.successful}</p>
              <p className="text-sm text-red-400 mt-1">Failed: {stats.failed}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500/30" />
          </div>
        </div>
      </div>

      {/* Most Used Folders */}
      <div className="bg-gray-800 rounded-xl border border-green-500/20 p-6 mb-8">
        <h2 className="text-xl font-semibold text-green-400 mb-4">Most Used Folders</h2>
        <div className="space-y-3">
          {stats.most_used_folders.map((folder, index) => (
            <div key={folder.name} className="flex items-center gap-4">
              <span className="text-2xl font-bold text-gray-600 w-8">#{index + 1}</span>
              <div className="flex-1 bg-gray-900 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-200 font-medium">{folder.name}</span>
                  <span className="text-green-400 font-semibold">{folder.count} runs</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                    style={{ width: `${(folder.count / stats.most_used_folders[0].count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl border border-green-500/20 p-6">
        <h2 className="text-xl font-semibold text-green-400 mb-4">Recent Activity (Last 24h)</h2>
        {stats.recent_activity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {stats.recent_activity.map((item) => (
              <div key={item.job_id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-gray-200">{item.folder} / {item.playbook}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(item.started_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{item.duration}s</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Main App with Router
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #10b981',
            },
          }}
        />

        {/* Header */}
        <div className="bg-gray-900 border-b border-green-500/30 shadow-lg shadow-green-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Terminal className="w-10 h-10 text-green-500" />
                <div>
                  <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                    Ansible Dashboard
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">Manage and execute your Ansible playbooks</p>
                </div>
              </div>
              <Navigation />
            </div>
          </div>
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App