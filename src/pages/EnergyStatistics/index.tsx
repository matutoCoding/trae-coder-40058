import { useState, useMemo, useEffect } from 'react'
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
type ChartViewType = 'overview' | 'breakdown'
type ListViewType = 'summary' | 'detail'

interface FormState {
  statDate: string
  electricity: string
  steam: string
  water: string
}

interface AggregatedData {
  id?: string
  statDate: string
  electricity: number
  steam: number
  water: number
  totalCost: number
  sortKey: string
}

interface CostBreakdown {
  electricCost: number
  steamCost: number
  waterCost: number
  total: number
}

const initialFormState: FormState = {
  statDate: new Date().toISOString().slice(0, 10),
  electricity: '',
  steam: '',
  water: '',
}

const calcCostBreakdown = (electricity: number, steam: number, water: number): CostBreakdown => {
  const electricCost = electricity * ELECTRICITY_PRICE
  const steamCost = steam * STEAM_PRICE
  const waterCost = water * WATER_PRICE
  return {
    electricCost,
    steamCost,
    waterCost,
    total: electricCost + steamCost + waterCost,
  }
}

const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`)

const getISOWeekInfo = (dateStr: string) => {
  const date = new Date(dateStr)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const year = d.getUTCFullYear()

  const monday = new Date(date)
  const currentDay = monday.getDay() || 7
  monday.setDate(monday.getDate() - currentDay + 1)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const weekLabel = `${year}年第${weekNum}周 (${monday.getMonth() + 1}/${monday.getDate()}-${sunday.getMonth() + 1}/${sunday.getDate()})`
  const sortKey = `${year}-W${padZero(weekNum)}`

  return { year, weekNum, weekLabel, sortKey }
}

const getMonthInfo = (dateStr: string) => {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const monthLabel = `${year}年${month}月`
  const sortKey = `${year}-${padZero(month)}`
  return { year, month, monthLabel, sortKey }
}

const aggregateData = (
  rawData: EnergyStatistics[],
  period: PeriodType
): AggregatedData[] => {
  if (rawData.length === 0) return []

  const sorted = [...rawData].sort(
    (a, b) => new Date(a.statDate).getTime() - new Date(b.statDate).getTime()
  )

  if (period === 'day') {
    return sorted.slice(-7).map((item) => {
      const cost = calcCostBreakdown(item.electricity, item.steam, item.water)
      return {
        statDate: item.statDate,
        electricity: Number(item.electricity.toFixed(1)),
        steam: Number(item.steam.toFixed(1)),
        water: Number(item.water.toFixed(1)),
        totalCost: Number(cost.total.toFixed(1)),
        sortKey: item.statDate,
      }
    })
  }

  const groups = new Map<string, Omit<AggregatedData, 'totalCost'> & { totalCost: number }>()

  for (const item of sorted) {
    let key: string
    let label: string

    if (period === 'week') {
      const info = getISOWeekInfo(item.statDate)
      key = info.sortKey
      label = info.weekLabel
    } else {
      const info = getMonthInfo(item.statDate)
      key = info.sortKey
      label = info.monthLabel
    }

    const existing = groups.get(key)
    if (existing) {
      existing.electricity += item.electricity
      existing.steam += item.steam
      existing.water += item.water
    } else {
      groups.set(key, {
        statDate: label,
        electricity: item.electricity,
        steam: item.steam,
        water: item.water,
        totalCost: 0,
        sortKey: key,
      })
    }
  }

  const result = Array.from(groups.values()).map((item) => {
    const cost = calcCostBreakdown(item.electricity, item.steam, item.water)
    return {
      statDate: item.statDate,
      sortKey: item.sortKey,
      electricity: Number(item.electricity.toFixed(1)),
      steam: Number(item.steam.toFixed(1)),
      water: Number(item.water.toFixed(1)),
      totalCost: Number(cost.total.toFixed(1)),
    }
  })

  return result.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
}

const getPeriodTitle = (period: PeriodType) => {
  switch (period) {
    case 'day':
      return { card: '今日', trend: '较昨日' }
    case 'week':
      return { card: '本周', trend: '较上周' }
    case 'month':
      return { card: '本月', trend: '较上月' }
  }
}

export default function EnergyStatisticsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [period, setPeriod] = useState<PeriodType>('day')
  const [chartView, setChartView] = useState<ChartViewType>('overview')
  const [listView, setListView] = useState<ListViewType>('summary')

  const energyStatistics = useVulcanizationStore((state) => state.energyStatistics)
  const addEnergyStatistics = useVulcanizationStore((state) => state.addEnergyStatistics)

  const aggregatedData = useMemo(
    () => aggregateData(energyStatistics, period),
    [energyStatistics, period]
  )

  useEffect(() => {
    if (aggregatedData.length > 0) {
      const last = aggregatedData[aggregatedData.length - 1]
      const breakdown = calcCostBreakdown(last.electricity, last.steam, last.water)
      const isConsistent = Math.abs(breakdown.total - last.totalCost) < 0.1
      console.log('[费用口径校验] 最后一条聚合数据:', {
        周期: last.statDate,
        记录totalCost: last.totalCost,
        公式计算totalCost: Number(breakdown.total.toFixed(1)),
        电费: Number(breakdown.electricCost.toFixed(1)),
        蒸汽费: Number(breakdown.steamCost.toFixed(1)),
        水费: Number(breakdown.waterCost.toFixed(1)),
        一致性: isConsistent ? 'PASS' : 'FAIL',
      })

      const pieElectric = aggregatedData.reduce((s, e) => s + calcCostBreakdown(e.electricity, e.steam, e.water).electricCost, 0)
      const pieSteam = aggregatedData.reduce((s, e) => s + calcCostBreakdown(e.electricity, e.steam, e.water).steamCost, 0)
      const pieWater = aggregatedData.reduce((s, e) => s + calcCostBreakdown(e.electricity, e.steam, e.water).waterCost, 0)
      console.log('[费用口径校验] 饼图合计费用:', {
        电费合计: Number(pieElectric.toFixed(2)),
        蒸汽费合计: Number(pieSteam.toFixed(2)),
        水费合计: Number(pieWater.toFixed(2)),
        总计: Number((pieElectric + pieSteam + pieWater).toFixed(2)),
      })
    }
  }, [aggregatedData])

  const sortedAggregated = useMemo(
    () => [...aggregatedData].sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
    [aggregatedData]
  )

  const currentPeriodData = useMemo(() => {
    if (aggregatedData.length === 0) return null
    return aggregatedData[aggregatedData.length - 1]
  }, [aggregatedData])

  const currentPeriodCost = useMemo(() => {
    if (!currentPeriodData) return calcCostBreakdown(0, 0, 0)
    return calcCostBreakdown(currentPeriodData.electricity, currentPeriodData.steam, currentPeriodData.water)
  }, [currentPeriodData])

  const previousPeriodData = useMemo(() => {
    if (aggregatedData.length < 2) return null
    return aggregatedData[aggregatedData.length - 2]
  }, [aggregatedData])

  const previousPeriodCost = useMemo(() => {
    if (!previousPeriodData) return calcCostBreakdown(0, 0, 0)
    return calcCostBreakdown(previousPeriodData.electricity, previousPeriodData.steam, previousPeriodData.water)
  }, [previousPeriodData])

  const calcTrend = (
    current: number | undefined,
    previous: number | undefined
  ): number | undefined => {
    if (current === undefined || previous === undefined || previous === 0) return undefined
    return Number((((current - previous) / previous) * 100).toFixed(1))
  }

  const trendData = useMemo(() => {
    return aggregatedData.map((e) => ({
      date: e.statDate,
      电耗: e.electricity,
      蒸汽耗: e.steam,
      水耗: e.water,
    }))
  }, [aggregatedData])

  const electricTrendData = useMemo(() => {
    return aggregatedData.map((e) => ({ date: e.statDate, 电耗: e.electricity }))
  }, [aggregatedData])

  const steamTrendData = useMemo(() => {
    return aggregatedData.map((e) => ({ date: e.statDate, 蒸汽耗: e.steam }))
  }, [aggregatedData])

  const waterTrendData = useMemo(() => {
    return aggregatedData.map((e) => ({ date: e.statDate, 水耗: e.water }))
  }, [aggregatedData])

  const pieData = useMemo(() => {
    const totalElectricCost = aggregatedData.reduce(
      (sum, e) => sum + calcCostBreakdown(e.electricity, e.steam, e.water).electricCost,
      0
    )
    const totalSteamCost = aggregatedData.reduce(
      (sum, e) => sum + calcCostBreakdown(e.electricity, e.steam, e.water).steamCost,
      0
    )
    const totalWaterCost = aggregatedData.reduce(
      (sum, e) => sum + calcCostBreakdown(e.electricity, e.steam, e.water).waterCost,
      0
    )
    return [
      { name: '电费', value: Number(totalElectricCost.toFixed(2)) },
      { name: '蒸汽费', value: Number(totalSteamCost.toFixed(2)) },
      { name: '水费', value: Number(totalWaterCost.toFixed(2)) },
    ]
  }, [aggregatedData])

  const barData = useMemo(() => {
    return aggregatedData.map((e) => {
      const cost = calcCostBreakdown(e.electricity, e.steam, e.water)
      return {
        date: e.statDate,
        电费: Number(cost.electricCost.toFixed(2)),
        蒸汽费: Number(cost.steamCost.toFixed(2)),
        水费: Number(cost.waterCost.toFixed(2)),
      }
    })
  }, [aggregatedData])

  const periodTitle = getPeriodTitle(period)

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (
      !formState.statDate ||
      !formState.electricity ||
      !formState.steam ||
      !formState.water
    ) {
      alert('请填写所有必填项')
      return
    }

    const electricity = Number(formState.electricity)
    const steam = Number(formState.steam)
    const water = Number(formState.water)

    const cost = calcCostBreakdown(electricity, steam, water)

    const newRecord: EnergyStatistics = {
      id: '',
      statDate: formState.statDate,
      electricity,
      steam,
      water,
      totalCost: cost.total,
    }

    addEnergyStatistics(newRecord)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const getExportFileName = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = padZero(now.getMonth() + 1)
    const d = padZero(now.getDate())
    const dateSuffix = `${y}${m}${d}`

    if (period === 'day') {
      return `能耗报表_日_${dateSuffix}.csv`
    } else if (period === 'week') {
      const info = getISOWeekInfo(now.toISOString().slice(0, 10))
      return `能耗报表_周_${y}W${padZero(info.weekNum)}_${dateSuffix}.csv`
    } else {
      return `能耗报表_月_${y}${m}_${dateSuffix}.csv`
    }
  }

  const handleExport = () => {
    let header = ''
    let rows = ''

    if (listView === 'summary') {
      header = '统计周期,电耗(kWh),蒸汽耗(t),水耗(t),总费用(元)\n'
      rows = sortedAggregated
        .map((e) => {
          const cost = calcCostBreakdown(e.electricity, e.steam, e.water)
          return `${e.statDate},${e.electricity.toFixed(1)},${e.steam.toFixed(1)},${e.water.toFixed(1)},${cost.total.toFixed(1)}`
        })
        .join('\n')
    } else {
      header = '统计周期,电耗(kWh),电费(元),蒸汽耗(t),蒸汽费(元),水耗(t),水费(元),总费用(元)\n'
      rows = sortedAggregated
        .map((e) => {
          const cost = calcCostBreakdown(e.electricity, e.steam, e.water)
          return `${e.statDate},${e.electricity.toFixed(1)},${cost.electricCost.toFixed(1)},${e.steam.toFixed(1)},${cost.steamCost.toFixed(1)},${e.water.toFixed(1)},${cost.waterCost.toFixed(1)},${cost.total.toFixed(1)}`
        })
        .join('\n')
    }

    const csv = header + rows
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = getExportFileName()
    link.click()
    URL.revokeObjectURL(url)
    alert('报表导出成功！')
  }

  const estimatedCostBreakdown = useMemo(() => {
    const e = Number(formState.electricity) || 0
    const s = Number(formState.steam) || 0
    const w = Number(formState.water) || 0
    return calcCostBreakdown(e, s, w)
  }, [formState])

  const summaryColumns: Column<AggregatedData>[] = [
    { key: 'statDate', title: '统计周期', width: '180px', align: 'center' },
    {
      key: 'electricity',
      title: '电耗(kWh)',
      width: '140px',
      align: 'right',
      render: (row) => (
        <span className="text-[#1e3a5f] font-medium">
          {row.electricity.toFixed(1)}
        </span>
      ),
    },
    {
      key: 'steam',
      title: '蒸汽耗(t)',
      width: '140px',
      align: 'right',
      render: (row) => (
        <span className="text-[#e85d26] font-medium">{row.steam.toFixed(1)}</span>
      ),
    },
    {
      key: 'water',
      title: '水耗(t)',
      width: '140px',
      align: 'right',
      render: (row) => (
        <span className="text-[#2e8b57] font-medium">{row.water.toFixed(1)}</span>
      ),
    },
    {
      key: 'totalCost',
      title: '总费用(元)',
      width: '140px',
      align: 'right',
      render: (row) => {
        const cost = calcCostBreakdown(row.electricity, row.steam, row.water)
        return (
          <span className="text-amber-600 font-semibold">¥{cost.total.toFixed(1)}</span>
        )
      },
    },
  ]

  const detailColumns: Column<AggregatedData>[] = [
    { key: 'statDate', title: '统计周期', width: '180px', align: 'center' },
    {
      key: 'electricity',
      title: '电耗(kWh)',
      width: '120px',
      align: 'right',
      render: (row) => (
        <span className="text-[#1e3a5f] font-medium">
          {row.electricity.toFixed(1)}
        </span>
      ),
    },
    {
      key: 'electricCost',
      title: '电费(元)',
      width: '120px',
      align: 'right',
      render: (row) => {
        const cost = calcCostBreakdown(row.electricity, row.steam, row.water)
        return (
          <span className="text-[#1e3a5f] font-medium">
            ¥{cost.electricCost.toFixed(1)}
          </span>
        )
      },
    },
    {
      key: 'steam',
      title: '蒸汽耗(t)',
      width: '120px',
      align: 'right',
      render: (row) => (
        <span className="text-[#e85d26] font-medium">{row.steam.toFixed(1)}</span>
      ),
    },
    {
      key: 'steamCost',
      title: '蒸汽费(元)',
      width: '120px',
      align: 'right',
      render: (row) => {
        const cost = calcCostBreakdown(row.electricity, row.steam, row.water)
        return (
          <span className="text-[#e85d26] font-medium">
            ¥{cost.steamCost.toFixed(1)}
          </span>
        )
      },
    },
    {
      key: 'water',
      title: '水耗(t)',
      width: '120px',
      align: 'right',
      render: (row) => (
        <span className="text-[#2e8b57] font-medium">{row.water.toFixed(1)}</span>
      ),
    },
    {
      key: 'waterCost',
      title: '水费(元)',
      width: '120px',
      align: 'right',
      render: (row) => {
        const cost = calcCostBreakdown(row.electricity, row.steam, row.water)
        return (
          <span className="text-[#2e8b57] font-medium">
            ¥{cost.waterCost.toFixed(1)}
          </span>
        )
      },
    },
    {
      key: 'totalCost',
      title: '总费用(元)',
      width: '140px',
      align: 'right',
      render: (row) => {
        const cost = calcCostBreakdown(row.electricity, row.steam, row.water)
        return (
          <span className="text-amber-600 font-semibold">¥{cost.total.toFixed(1)}</span>
        )
      },
    },
  ]

  const columns = listView === 'summary' ? summaryColumns : detailColumns

  const periodButtons: { key: PeriodType; label: string }[] = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' },
  ]

  const chartViewButtons: { key: ChartViewType; label: string }[] = [
    { key: 'overview', label: '综合视图' },
    { key: 'breakdown', label: '分项趋势视图' },
  ]

  const listViewButtons: { key: ListViewType; label: string }[] = [
    { key: 'summary', label: '综合数据' },
    { key: 'detail', label: '费用明细' },
  ]

  const chartSubtitle =
    period === 'day'
      ? '最近7天'
      : period === 'week'
      ? `共${aggregatedData.length}周`
      : `共${aggregatedData.length}月`

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
            title={`${periodTitle.card}电耗`}
            value={Number(currentPeriodData?.electricity.toFixed(1) ?? 0)}
            unit="kWh"
            icon={Zap}
            trend={calcTrend(currentPeriodData?.electricity, previousPeriodData?.electricity)}
            trendLabel={periodTitle.trend}
            color="blue"
          />
          <StatCard
            title={`${periodTitle.card}蒸汽耗`}
            value={Number(currentPeriodData?.steam.toFixed(1) ?? 0)}
            unit="t"
            icon={Flame}
            trend={calcTrend(currentPeriodData?.steam, previousPeriodData?.steam)}
            trendLabel={periodTitle.trend}
            color="orange"
          />
          <StatCard
            title={`${periodTitle.card}水耗`}
            value={Number(currentPeriodData?.water.toFixed(1) ?? 0)}
            unit="t"
            icon={Droplets}
            trend={calcTrend(currentPeriodData?.water, previousPeriodData?.water)}
            trendLabel={periodTitle.trend}
            color="green"
          />
          <StatCard
            title={`${periodTitle.card}总能耗`}
            value={Number(currentPeriodCost.total.toFixed(1) ?? 0)}
            unit="元"
            icon={DollarSign}
            trend={calcTrend(currentPeriodCost.total, previousPeriodCost.total)}
            trendLabel={periodTitle.trend}
            color="purple"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg border border-slate-300 p-0.5">
              {chartViewButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setChartView(btn.key)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    chartView === btn.key
                      ? 'bg-[#1e3a5f] text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500">{chartSubtitle}</span>
          </div>

          {chartView === 'overview' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-[#1e3a5f]" />
                    <h4 className="text-base font-semibold text-gray-800">能耗趋势</h4>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          stroke="#d1d5db"
                          interval={period === 'month' ? 0 : 'preserveStartEnd'}
                        />
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

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <PieChartIcon className="w-5 h-5 text-[#1e3a5f]" />
                    <h4 className="text-base font-semibold text-gray-800">能耗费用占比</h4>
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

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-[#1e3a5f]" />
                  <h4 className="text-base font-semibold text-gray-800">能耗费用对比</h4>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        interval={period === 'month' ? 0 : 'preserveStartEnd'}
                      />
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
                      <Bar dataKey="电费" stackId="cost" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="蒸汽费" stackId="cost" fill="#e85d26" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="水费" stackId="cost" fill="#2e8b57" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-[#1e3a5f]" />
                  <h4 className="text-base font-semibold text-[#1e3a5f]">电耗趋势</h4>
                  <span className="text-xs text-gray-500 ml-auto">单位: kWh</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={electricTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        interval={period === 'month' ? 0 : 'preserveStartEnd'}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)} kWh`, '电耗']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="电耗"
                        stroke="#1e3a5f"
                        strokeWidth={2.5}
                        dot={{ fill: '#1e3a5f', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-[#e85d26]" />
                  <h4 className="text-base font-semibold text-[#e85d26]">蒸汽耗趋势</h4>
                  <span className="text-xs text-gray-500 ml-auto">单位: t</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={steamTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        interval={period === 'month' ? 0 : 'preserveStartEnd'}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)} t`, '蒸汽耗']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="蒸汽耗"
                        stroke="#e85d26"
                        strokeWidth={2.5}
                        dot={{ fill: '#e85d26', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-5 h-5 text-[#2e8b57]" />
                  <h4 className="text-base font-semibold text-[#2e8b57]">水耗趋势</h4>
                  <span className="text-xs text-gray-500 ml-auto">单位: t</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={waterTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        interval={period === 'month' ? 0 : 'preserveStartEnd'}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)} t`, '水耗']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
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
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">能耗记录列表</h3>
            <div className="flex items-center bg-white rounded-lg border border-slate-300 p-0.5">
              {listViewButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setListView(btn.key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    listView === btn.key
                      ? 'bg-[#1e3a5f] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <DataTable
            columns={columns}
            data={sortedAggregated}
            emptyText="暂无能耗记录"
          />
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
                      ¥{estimatedCostBreakdown.electricCost.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">蒸汽费</div>
                    <div className="text-[#e85d26] font-semibold">
                      ¥{estimatedCostBreakdown.steamCost.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">水费</div>
                    <div className="text-[#2e8b57] font-semibold">
                      ¥{estimatedCostBreakdown.waterCost.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">合计</div>
                    <div className="text-amber-600 font-bold text-base">
                      ¥{estimatedCostBreakdown.total.toFixed(2)}
                    </div>
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
