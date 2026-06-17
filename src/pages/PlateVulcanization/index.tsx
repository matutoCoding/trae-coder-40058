import { useState, useEffect } from 'react'
import {
  Flame,
  Plus,
  Gauge,
  Thermometer,
  Play,
  Save,
  X,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import PageHeader from '../../components/Form/PageHeader'
import StatCard from '../../components/Card/StatCard'
import StatusBadge from '../../components/Card/StatusBadge'
import DataTable, { type Column } from '../../components/Table/DataTable'
import { useVulcanizationStore } from '../../store'
import type { PlateVulcanization, SemiFinished, Mold } from '../../types'

interface FormState {
  semiFinishedId: string
  moldId: string
  pressure: string
  temperature: string
  duration: string
  operator: string
}

const initialFormState: FormState = {
  semiFinishedId: '',
  moldId: '',
  pressure: '',
  temperature: '',
  duration: '',
  operator: '',
}

const generateTempCurve = (duration: number, targetTemp: number) => {
  const points = []
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const time = (duration / steps) * i
    let temp: number
    if (i < steps * 0.3) {
      temp = (targetTemp / (steps * 0.3)) * i
    } else if (i < steps * 0.85) {
      temp = targetTemp + (Math.random() - 0.5) * 4
    } else {
      temp = targetTemp - ((i - steps * 0.85) / (steps * 0.15)) * targetTemp * 0.3
    }
    points.push({ time: Math.round(time * 10) / 10, temperature: Math.round(temp * 10) / 10 })
  }
  return points
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const calcElapsedMinutes = (startTime: string) => {
  const start = new Date(startTime).getTime()
  const now = new Date().getTime()
  return Math.max(0, Math.floor((now - start) / 60000))
}

export default function PlateVulcanizationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [, setTick] = useState(0)

  const plateVulcanization = useVulcanizationStore((state) => state.plateVulcanization)
  const semiFinished = useVulcanizationStore((state) => state.semiFinished)
  const molds = useVulcanizationStore((state) => state.molds)
  const addPlateVulcanization = useVulcanizationStore((state) => state.addPlateVulcanization)
  const updatePlateVulcanization = useVulcanizationStore((state) => state.updatePlateVulcanization)
  const updateMoldStatus = useVulcanizationStore((state) => state.updateMoldStatus)

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const runningRecords = plateVulcanization.filter((p) => p.status === 'running')
  const todayCompleted = plateVulcanization.filter((p) => p.status === 'completed').length

  const avgPressure =
    runningRecords.length > 0
      ? (runningRecords.reduce((sum, r) => sum + r.pressure, 0) / runningRecords.length).toFixed(1)
      : '0.0'

  const avgTemperature =
    runningRecords.length > 0
      ? (runningRecords.reduce((sum, r) => sum + r.temperature, 0) / runningRecords.length).toFixed(1)
      : '0.0'

  const availableMolds = molds.filter((m) => m.status === 'available')

  const getSemiFinishedByBatchNo = (id: string) => {
    const sf = semiFinished.find((s) => s.id === id)
    return sf ? sf.batchNo : '-'
  }

  const getMoldByMoldNo = (id: string) => {
    const m = molds.find((mm) => mm.id === id)
    return m ? m.moldNo : '-'
  }

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (
      !formState.semiFinishedId ||
      !formState.moldId ||
      !formState.pressure ||
      !formState.temperature ||
      !formState.duration ||
      !formState.operator
    ) {
      alert('请填写必填项')
      return
    }

    const duration = Number(formState.duration)
    const temperature = Number(formState.temperature)

    const newRecord: PlateVulcanization = {
      id: '',
      semiFinishedId: formState.semiFinishedId,
      moldId: formState.moldId,
      pressure: Number(formState.pressure),
      temperature,
      duration,
      temperatureCurve: generateTempCurve(duration, temperature),
      operator: formState.operator,
      startTime: new Date().toLocaleString('zh-CN'),
      status: 'running',
    }

    addPlateVulcanization(newRecord)
    updateMoldStatus(formState.moldId, 'in-use', formState.operator)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleComplete = (record: PlateVulcanization) => {
    if (record.status === 'running') {
      updatePlateVulcanization(record.id, {
        status: 'completed',
        endTime: new Date().toLocaleString('zh-CN'),
      })
      updateMoldStatus(record.moldId, 'available')
    }
  }

  const renderTemperatureGauge = (temperature: number, targetTemp: number) => {
    const percent = Math.min(100, (temperature / (targetTemp * 1.2)) * 100)
    const angle = (percent / 100) * 180 - 90
    const color = temperature >= targetTemp ? '#10b981' : temperature >= targetTemp * 0.8 ? '#f59e0b' : '#ef4444'

    return (
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full border-8 border-gray-200" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
        <div
          className="absolute w-32 h-32 rounded-full border-8"
          style={{
            borderColor: color,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transform: `rotate(${angle}deg)`,
            transformOrigin: '50% 100%',
            transition: 'transform 0.5s ease, border-color 0.3s ease',
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-2xl font-bold" style={{ color }}>{temperature}</span>
          <span className="text-xs text-gray-500 ml-0.5">℃</span>
        </div>
      </div>
    )
  }

  const renderMonitoringPanel = (record: PlateVulcanization) => {
    const elapsed = calcElapsedMinutes(record.startTime)
    const progress = Math.min(100, (elapsed / record.duration) * 100)
    const remaining = Math.max(0, record.duration - elapsed)

    return (
      <div
        key={record.id}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-800">
                {getSemiFinishedByBatchNo(record.semiFinishedId)}
              </span>
              <StatusBadge status={record.status} />
            </div>
            <p className="text-xs text-gray-500">
              模具: {getMoldByMoldNo(record.moldId)} | 操作工: {record.operator}
            </p>
          </div>
          <button
            onClick={() => handleComplete(record)}
            disabled={record.status !== 'running'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            完成
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gauge className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">硫化压力</span>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800">{record.pressure}</span>
              <span className="text-xs text-gray-500 ml-0.5">MPa</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 mb-1">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500">硫化温度</span>
            </div>
            {renderTemperatureGauge(record.temperature, record.temperature)}
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500">剩余时间</span>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800">{remaining}</span>
              <span className="text-xs text-gray-500 ml-0.5">min</span>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">硫化进度</span>
            <span className="text-xs font-medium text-gray-700">
              {elapsed} / {record.duration} min ({progress.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={record.temperatureCurve} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" label={{ value: '时间(min)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} stroke="#d1d5db" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
                formatter={(value: number) => [`${value} ℃`, '温度']}
                labelFormatter={(label) => `时间: ${label} min`}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#f97316' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const columns: Column<PlateVulcanization>[] = [
    {
      key: 'semiFinishedId',
      title: '批次号',
      width: '150px',
      render: (row) => getSemiFinishedByBatchNo(row.semiFinishedId),
    },
    {
      key: 'moldId',
      title: '模具编号',
      width: '120px',
      render: (row) => getMoldByMoldNo(row.moldId),
    },
    { key: 'pressure', title: '压力(MPa)', width: '110px', align: 'right' },
    { key: 'temperature', title: '温度(℃)', width: '100px', align: 'right' },
    { key: 'duration', title: '时长(min)', width: '100px', align: 'right' },
    { key: 'operator', title: '操作工', width: '100px', align: 'center' },
    {
      key: 'startTime',
      title: '开始时间',
      width: '170px',
      align: 'center',
      render: (row) => formatTime(row.startTime),
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6">
        <PageHeader
          title="平板硫化"
          description="平板硫化工艺监控与记录管理，实时跟踪硫化压力、温度和时间参数"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow-sm transition-colors border border-orange-700"
            >
              <Plus className="w-4 h-4" />
              新建平板硫化
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            title="运行中批次"
            value={runningRecords.length}
            unit="批"
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="今日完成"
            value={todayCompleted}
            unit="批"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="平均压力"
            value={avgPressure}
            unit="MPa"
            icon={Gauge}
            color="purple"
          />
          <StatCard
            title="平均温度"
            value={avgTemperature}
            unit="℃"
            icon={Thermometer}
            color="orange"
          />
        </div>

        {runningRecords.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">硫化工艺监控</h3>
              <span className="text-xs text-gray-500">实时监控运行中的硫化批次</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {runningRecords.map((record) => renderMonitoringPanel(record))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">硫化记录</h3>
          </div>
          <DataTable columns={columns} data={plateVulcanization} emptyText="暂无平板硫化记录" />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-800 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">新建平板硫化</h3>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    半成品批次 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.semiFinishedId}
                    onChange={(e) => handleInputChange('semiFinishedId', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  >
                    <option value="">请选择半成品批次</option>
                    {semiFinished.map((sf: SemiFinished) => (
                      <option key={sf.id} value={sf.id}>
                        {sf.batchNo} - {sf.rubberType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    模具编号 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.moldId}
                    onChange={(e) => handleInputChange('moldId', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  >
                    <option value="">请选择可用模具</option>
                    {availableMolds.map((m: Mold) => (
                      <option key={m.id} value={m.id}>
                        {m.moldNo} - {m.productName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    硫化压力(MPa) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.pressure}
                    onChange={(e) => handleInputChange('pressure', e.target.value)}
                    placeholder="请输入硫化压力，如 15.5"
                    min="0"
                    step="0.1"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
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
                    placeholder="请输入硫化温度，如 165"
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
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
                    placeholder="请输入硫化时间，如 45"
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
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
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors border border-orange-700"
              >
                <Save className="w-4 h-4" />
                保存并启动
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
