import { useState, useEffect } from 'react'
import { Folder, Play, FileText, Settings, Loader2, CheckCircle, XCircle, Terminal, Save, Code } from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

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
}

function App() {
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

  useEffect(() => {
    loadFolders()
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
      // Load inventory
      if (selectedFolder.has_inventory) {
        const invResponse = await axios.get(`/api/folders/${selectedFolder.name}/inventory`)
        setInventory(invResponse.data.content)
        setInventoryRaw(invResponse.data.raw)
      }

      // Load vars
      if (selectedFolder.has_vars) {
        const varsResponse = await axios.get(`/api/folders/${selectedFolder.name}/vars`)
        setVars(varsResponse.data.content)
        setVarsRaw(varsResponse.data.raw)
      }

      // Select first playbook
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
        completed_at: null
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
        toast.success('✅ Playbook completed successfully')
        setRunning(false)
      } else if (response.data.status === 'failed' || response.data.status === 'error') {
        toast.error('❌ Playbook failed')
        setRunning(false)
      }
    } catch (error) {
      console.error('Failed to check job status', error)
    }
  }

  const updateVarValue = (key: string, value: any) => {
    setVars({ ...vars, [key]: value })
  }

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
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
          <div className="flex items-center space-x-4">
            <Terminal className="w-10 h-10 text-green-500" />
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                Ansible Dashboard
              </h1>
              <p className="text-sm text-gray-400 mt-1">Manage and execute your Ansible playbooks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Sidebar - Folders */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-green-500/20 shadow-xl shadow-green-500/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-green-400 flex items-center">
                  <Folder className="w-5 h-5 mr-2" />
                  Folders
                </h2>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  {folders.length}
                </span>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 mb-4 bg-gray-900 border border-green-500/30 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />

              {/* Folder List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-900">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                  </div>
                ) : (
                  filteredFolders.map((folder) => (
                    <button
                      key={folder.name}
                      onClick={() => setSelectedFolder(folder)}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
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

                {/* Variables Editor */}
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
                      <textarea
                        value={varsRaw}
                        onChange={(e) => setVarsRaw(e.target.value)}
                        className="w-full h-64 px-4 py-3 bg-gray-900 border border-green-500/30 rounded-lg font-mono text-sm text-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
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
                    <textarea
                      value={inventoryRaw}
                      onChange={(e) => setInventoryRaw(e.target.value)}
                      className="w-full h-48 px-4 py-3 bg-gray-900 border border-green-500/30 rounded-lg font-mono text-sm text-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Job Output */}
                {currentJob && (
                  <div className="bg-gray-800 rounded-xl border border-green-500/20 shadow-xl shadow-green-500/5 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                        <Terminal className="w-6 h-6" />
                        {currentJob.status === 'running' && <Loader2 className="w-5 h-5 animate-spin text-green-500" />}
                        {currentJob.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {(currentJob.status === 'failed' || currentJob.status === 'error') && <XCircle className="w-5 h-5 text-red-500" />}
                        Execution Output
                      </h2>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                        currentJob.status === 'running' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        currentJob.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {currentJob.status.toUpperCase()}
                      </span>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto border border-green-500/30 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-900">
                      {currentJob.output || 'Waiting for output...'}
                    </pre>
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
    </div>
  )
}

export default App