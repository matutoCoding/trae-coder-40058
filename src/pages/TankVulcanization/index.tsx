import { useState, useEffect } from 'react'
import { Container, Plus, Gauge, Thermometer, Play, Save, X, Clock } from 'lucide-react'
import PageHeader from '../../components/Form/PageHeader'
import DataTable, { type Column } from '../../components/Table/DataTable'
import StatusBadge from '../../components/Card/StatusBadge'
import StatCard from '../../components/Card/StatCard'
import { useVulcanizationStore } from '../../store'
import type { TankVulcanization } from '../../types'

interface FormState {
  semiFinishedId: string
  steamPressure: string
  temperature: string
  duration: string
  operator: string
}

const initialFormState: FormState = {
  semiFinishedId: '',
  steamPressure: '',
  temperature: '',
  duration: '',
  operator: '',
}

const getBatchNoById = (semiFinishedList: Array<{ id: string; batchNo: string }>, id: string) => {
  const item = semiFinishedList.find((s) => s.id === id)
  return item ? item.batchNo : '-'
}

const calculateProgress = (startTime: string, duration: number) => {
  const start = new Date(startTime.replace(/-/g, '/')).getTime()
  const now = Date.now()
  const elapsed = (now - start) / (1000 * 60)
  const progress = Math.min((elapsed / duration) * 100, 100)
  const remaining = Math.max(duration - elapsed, 0)
  return { progress: Math.round(progress), remaining: Math.round(remaining) }
}

export default function TankVulcanizationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [, setTick] = useState(0)

  const tankVulcanization = useVulcanizationStore((state) => state.tankVulcanization)
  const semiFinished = useVulcanizationStore((state) => state.semiFinished)
  const addTankVulcanization = useVulcanizationStore((state) => state.addTankVulcanization)
  const updateTankVulcanization = useVulcanizationStore((state) => state.updateTankVulcanization)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const runningList = tankVulcanization.filter((t) => t.status === 'running')
  const today = new Date().toLocaleDateString('zh-CN')
  const todayCompleted = tankVulcanization.filter(
    (t) => t.status === 'completed' && t.endTime && new Date(t.endTime.replace(/-/g, '/')).toLocaleDateString('zh-CN') === today
  )
  const avgSteamPressure =
    runningList.length > 0
      ? (runningList.reduce((sum, t) => sum + t.steamPressure, 0) / runningList.length).toFixed(2)
      : '0.00'
  const avgTemperature =
    runningList.length > 0
      ? Math.round(runningList.reduce((sum, t) => sum + t.temperature, 0) / runningList.length)
      : 0

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formState.semiFinishedId || !formState.steamPressure || !formState.temperature || !formState.duration || !formState.operator) {
      alert('请填写必填项')
      return
    }

    const newRecord: TankVulcanization = {
      id: '',
      semiFinishedId: formState.semiFinishedId,
      steamPressure: Number(formState.steamPressure),
      temperature: Number(formState.temperature),
      duration: Number(formState.duration),
      operator: formState.operator,
      startTime: new Date().toLocaleString('zh-CN'),
      endTime: undefined,
      status: 'running',
    }

    addTankVulcanization(newRecord)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleComplete = (id: string) => {
    updateTankVulcanization(id, {
      status: 'completed',
      endTime: new Date().toLocaleString('zh-CN'),
    })
  }

  const columns: Column<TankVulcanization>[] = [
    {
      key: 'semiFinishedId',
      title: '批次号',
      width: '160px',
      render: (row) => getBatchNoById(semiFinished, row.semiFinishedId),
    },
    { key: 'steamPressure', title: '蒸汽压(MPa)', width: '130px', align: 'right' },
    { key: 'temperature', title: '温度(℃)', width: '110px', align: 'right' },
    { key: 'duration', title: '时长(min)', width: '110px', align: 'right' },
    { key: 'operator', title: '操作工', width: '110px', align: 'center' },
    { key: 'startTime', title: '开始时间', width: '170px', align: 'center' },
    { key: 'endTime', title: '结束时间', width: '170px', align: 'center', render: (row) => row.endTime || '-' },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '130px',
      align: 'center',
      render: (row) =>
        row.status === 'running' ? (
          <button
            onClick={() => handleComplete(row.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            完成硫化
          </button>
        ) : null,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6">
        <PageHeader
          title="罐式硫化"
          description="管理罐式硫化作业，监控硫化罐运行状态，记录蒸汽压力、温度和硫化时间等关键参数"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition-colors border border-amber-700"
            >
              <Plus className="w-4 h-4" />
              新建罐式硫化
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            title="运行中罐数"
            value={runningList.length}
            unit="罐"
            icon={Container}
            color="blue"
          />
          <StatCard
            title="今日完成批次"
            value={todayCompleted.length}
            unit="批"
            icon={Clock}
            color="green"
          />
          <StatCard
            title="平均蒸汽压"
            value={avgSteamPressure}
            unit="MPa"
            icon={Gauge}
            color="orange"
          />
          <StatCard
            title="平均温度"
            value={avgTemperature}
            unit="℃"
            icon={Thermometer}
            color="purple"
          />
        </div>

        {runningList.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">硫化罐监控面板</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {runningList.map((item, idx) => {
                const { progress, remaining } = calculateProgress(item.startTime, item.duration)
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Container className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">硫化罐 #{idx + 1}</p>
                          <p className="text-xs text-gray-500">{getBatchNoById(semiFinished, item.semiFinishedId)}</p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Gauge className="w-4 h-4 text-orange-500" />
                          <span className="text-xs text-gray-500">蒸汽压力</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800">
                          {item.steamPressure} <span className="text-xs font-normal text-gray-500">MPa</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Thermometer className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-gray-500">当前温度</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800">
                          {item.temperature} <span className="text-xs font-normal text-gray-500">℃</span>
                        </p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-violet-500" />
                          <span className="text-xs text-gray-500">硫化进度</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">剩余约 {remaining} 分钟</p>
                    </div>

                    <button
                      onClick={() => handleComplete(item.id)}
                      className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      完成硫化
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DataTable columns={columns} data={tankVulcanization} emptyText="暂无罐式硫化记录" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-800 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">新建罐式硫化</h3>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    半成品批次 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.semiFinishedId}
                    onChange={(e) => handleInputChange('semiFinishedId', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="">请选择半成品批次</option>
                    {semiFinished.map((sf) => (
                      <option key={sf.id} value={sf.id}>
                        {sf.batchNo} - {sf.rubberType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    蒸汽压力(MPa) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.steamPressure}
                    onChange={(e) => handleInputChange('steamPressure', e.target.value)}
                    placeholder="如：0.6"
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    硫化温度(℃) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                    placeholder="如：155"
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    硫化时间(min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="如：120"
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    操作工 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.operator}
                    onChange={(e) => handleInputChange('operator', e.target.value)}
                    placeholder="请输入操作工姓名"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors border border-amber-700"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
