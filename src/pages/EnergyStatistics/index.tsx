import { useState, useMemo } from 'react'
import {
  Zap,
  Droplets,
  Flame,
  DollarSign,
  Plus,
  Save,
  X,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Download,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import StatCard from '@/components/Card/StatCard'
import PageHeader from '@/components/Form/PageHeader'
import DataTable, { type Column } from '@/components/Table/DataTable'
import { useVulcanizationStore } from '@/store'
import type { EnergyStatistics } from '@/types'

const ELECTRICITY_PRICE = 0.8
const STEAM_PRICE = 200
const WATER_PRICE = 5

const PIE_COLORS = ['#1e3a5f', '#e85d26', '#2e8b57']

type PeriodType = 'day' | 'week' | 'month'

interface FormState {
  statDate: string
  electricity: string
  steam: string
  water: string
}

const initialFormState: FormState = {
  statDate: new Date().toISOString().slice(0, 10),
  electricity: '',
  steam: '',
  water: '',
}

const calculateTotalCost = (electricity: number, steam: number, water: number) => {
  return electricity * ELECTRICITY_PRICE + steam * STEAM_PRICE + water * WATER_PRICE
}

export default function EnergyStatisticsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [period, setPeriod] = useState<PeriodType>('day')

  const energyStatistics = useVulcanizationStore((state) => state.energyStatistics)
  const addEnergyStatistics = useVulcanizationStore((state) => state.addEnergyStatistics)

  const todayData = useMemo(() => {
    if (energyStatistics.length === 0) return null
    return energyStatistics[energyStatistics.length - 1]
  }, [energyStatistics])

  const yesterdayData = useMemo(() => {
    if (energyStatistics.length < 2) return null
    return energyStatistics[energyStatistics.length - 2]
  }, [energyStatistics])

  const calcTrend = (today: number | undefined, yesterday: number | undefined) => {
    if (!today || !yesterday || yesterday === 0) return undefined
    return Number((((today - yesterday) / yesterday) * 100).toFixed(1))
  }

  const trendData = useMemo(() => {
    const sorted = [...energyStatistics].sort(
      (a, b) => new Date(a.statDate).getTime() - new Date(b.statDate).getTime()
    )
    return sorted.slice(-7).map((e) => ({
      date: e.statDate.slice(5),
      电耗: e.electricity,
      蒸汽耗: e.steam,
      水耗: e.water,
    }))
  }, [energyStatistics])

  const pieData = useMemo(() => {
    const totalElectricityCost = energyStatistics.reduce((sum, e) => sum + e.electricity * ELECTRICITY_PRICE, 0)
    const totalSteamCost = energyStatistics.reduce((sum, e) => sum + e.steam * STEAM_PRICE, 0)
    const totalWaterCost = energyStatistics.reduce((sum, e) => sum + e.water * WATER_PRICE, 0)
    return [
      { name: '电费', value: Number(totalElectricityCost.toFixed(2)) },
      { name: '蒸汽费', value: Number(totalSteamCost.toFixed(2)) },
      { name: '水费', value: Number(totalWaterCost.toFixed(2)) },
    ]
  }, [energyStatistics])

  const barData = useMemo(() => {
    const sorted = [...energyStatistics].sort(
      (a, b) => new Date(a.statDate).getTime() - new Date(b.statDate).getTime()
    )
    return sorted.slice(-7).map((e) => ({
      date: e.statDate.slice(5),
      电费: Number((e.electricity * ELECTRICITY_PRICE).toFixed(2)),
      蒸汽费: Number((e.steam * STEAM_PRICE).toFixed(2)),
      水费: Number((e.water * WATER_PRICE).toFixed(2)),
    }))
  }, [energyStatistics])

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formState.statDate || !formState.electricity || !formState.steam || !formState.water) {
      alert('请填写所有必填项')
      return
    }

    const electricity = Number(formState.electricity)
    const steam = Number(formState.steam)
    const water = Number(formState.water)

    const newRecord: EnergyStatistics = {
      id: '',
      statDate: formState.statDate,
      electricity,
      steam,
      water,
      totalCost: calculateTotalCost(electricity, steam, water),
    }

    addEnergyStatistics(newRecord)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleExport = () => {
    const header = '统计日期,电耗(kWh),蒸汽耗(t),水耗(t),电费(元),蒸汽费(元),水费(元),总费用(元)\n'
    const rows = energyStatistics
      .map((e) => {
        const ec = (e.electricity * ELECTRICITY_PRICE).toFixed(2)
        const sc = (e.steam * STEAM_PRICE).toFixed(2)
        const wc = (e.water * WATER_PRICE).toFixed(2)
        return `${e.statDate},${e.electricity},${e.steam},${e.water},${ec},${sc},${wc},${e.totalCost.toFixed(2)}`
      })
      .join('\n')
    const csv = header + rows
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `能耗统计报表_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    alert('报表导出成功！')
  }

  const estimatedTotalCost = useMemo(() => {
    const e = Number(formState.electricity) || 0
    const s = Number(formState.steam) || 0
    const w = Number(formState.water) || 0
    return calculateTotalCost(e, s, w).toFixed(2)
  }, [formState])

  const columns: Column<EnergyStatistics>[] = [
    { key: 'statDate', title: '统计日期', width: '140px', align: 'center' },
    {
      key: 'electricity',
      title: '电耗(kWh)',
      width: '140px',
      align: 'right',
      render: (row) => <span className="text-[#1e3a5f] font-medium">{row.electricity}</span>,
    },
    {
      key: 'steam',
      title: '蒸汽耗(t)',
      width: '140px',
      align: 'right',
      render: (row) => <span className="text-[#e85d26] font-medium">{row.steam}</span>,
    },
    {
      key: 'water',
      title: '水耗(t)',
      width: '140px',
      align: 'right',
      render: (row) => <span className="text-[#2e8b57] font-medium">{row.water}</span>,
    },
    {
      key: 'totalCost',
      title: '总费用(元)',
      width: '140px',
      align: 'right',
      render: (row) => (
        <span className="text-amber-600 font-semibold">¥{row.totalCost.toFixed(2)}</span>
      ),
    },
  ]

  const periodButtons: { key: PeriodType; label: string }[] = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6 space-y-6">
        <PageHeader
          title="能耗统计"
          description="监控车间电、蒸汽、水等能源消耗情况，分析能耗趋势与费用占比"
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-lg border border-slate-300 p-0.5">
                {periodButtons.map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => setPeriod(btn.key)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      period === btn.key
                        ? 'bg-[#1e3a5f] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg shadow-sm transition-colors border border-slate-300"
              >
                <Download className="w-4 h-4" />
                导出报表
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#2a4f7a] text-white font-medium rounded-lg shadow-sm transition-colors border border-[#1e3a5f]"
              >
                <Plus className="w-4 h-4" />
                新增能耗记录
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="今日电耗"
            value={todayData?.electricity ?? 0}
            unit="kWh"
            icon={Zap}
            trend={calcTrend(todayData?.electricity, yesterdayData?.electricity)}
            trendLabel="较昨日"
            color="blue"
          />
          <StatCard
            title="今日蒸汽耗"
            value={todayData?.steam ?? 0}
            unit="t"
            icon={Flame}
            trend={calcTrend(todayData?.steam, yesterdayData?.steam)}
            trendLabel="较昨日"
            color="orange"
          />
          <StatCard
            title="今日水耗"
            value={todayData?.water ?? 0}
            unit="t"
            icon={Droplets}
            trend={calcTrend(todayData?.water, yesterdayData?.water)}
            trendLabel="较昨日"
            color="green"
          />
          <StatCard
            title="今日总能耗"
            value={todayData?.totalCost ?? 0}
            unit="元"
            icon={DollarSign}
            trend={calcTrend(todayData?.totalCost, yesterdayData?.totalCost)}
            trendLabel="较昨日"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1e3a5f]" />
                <h3 className="text-lg font-semibold text-gray-800">能耗趋势</h3>
              </div>
              <span className="text-xs text-gray-500">最近7天</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#d1d5db" />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#d1d5db" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="电耗"
                    stroke="#1e3a5f"
                    strokeWidth={2.5}
                    dot={{ fill: '#1e3a5f', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="蒸汽耗"
                    stroke="#e85d26"
                    strokeWidth={2.5}
                    dot={{ fill: '#e85d26', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="水耗"
                    stroke="#2e8b57"
                    strokeWidth={2.5}
                    dot={{ fill: '#2e8b57', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-[#1e3a5f]" />
              <h3 className="text-lg font-semibold text-gray-800">能耗费用占比</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '费用']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#1e3a5f]" />
            <h3 className="text-lg font-semibold text-gray-800">日均能耗费用对比</h3>
            <span className="text-xs text-gray-500 ml-2">最近7天</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#d1d5db" />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#d1d5db"
                  tickFormatter={(v) => `¥${v}`}
                />
                <Tooltip
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="电费" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="蒸汽费" fill="#e85d26" radius={[4, 4, 0, 0]} />
                <Bar dataKey="水费" fill="#2e8b57" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">能耗记录列表</h3>
          <DataTable columns={columns} data={energyStatistics} emptyText="暂无能耗记录" />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#1e3a5f] rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">新增能耗记录</h3>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  统计日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.statDate}
                  onChange={(e) => handleInputChange('statDate', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    电耗(kWh) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.electricity}
                    onChange={(e) => handleInputChange('electricity', e.target.value)}
                    placeholder="请输入"
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    蒸汽耗(t) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.steam}
                    onChange={(e) => handleInputChange('steam', e.target.value)}
                    placeholder="请输入"
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    水耗(t) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.water}
                    onChange={(e) => handleInputChange('water', e.target.value)}
                    placeholder="请输入"
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] bg-white"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-600 mb-2">费用估算</div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-slate-500">电费</div>
                    <div className="text-[#1e3a5f] font-semibold">
                      ¥{((Number(formState.electricity) || 0) * ELECTRICITY_PRICE).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">蒸汽费</div>
                    <div className="text-[#e85d26] font-semibold">
                      ¥{((Number(formState.steam) || 0) * STEAM_PRICE).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">水费</div>
                    <div className="text-[#2e8b57] font-semibold">
                      ¥{((Number(formState.water) || 0) * WATER_PRICE).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">合计</div>
                    <div className="text-amber-600 font-bold text-base">¥{estimatedTotalCost}</div>
                  </div>
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
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#2a4f7a] rounded-lg shadow-sm transition-colors border border-[#1e3a5f]"
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
