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
  Settings,
  Eye,
  AlertCircle,
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
  ReferenceLine,
} from 'recharts'
import StatCard from '@/components/Card/StatCard'
import PageHeader from '@/components/Form/PageHeader'
import DataTable, { type Column } from '@/components/Table/DataTable'
import StatusBadge from '@/components/Card/StatusBadge'
import { useVulcanizationStore } from '@/store'
import type { EnergyStatistics, EnergyTarget } from '@/types'

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

interface TargetFormState {
  electricity: string
  steam: string
  water: string
  totalCost: string
}

interface AggregatedData {
  id?: string
  statDate: string
  electricity: number
  steam: number
  water: number
  totalCost: number
  sortKey: string
  isOverTarget?: boolean
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

const getProgressColor = (progress: number) => {
  if (progress < 0.8) return 'bg-emerald-500'
  if (progress <= 1) return 'bg-amber-500'
  return 'bg-red-500'
}

const getProgressBgColor = (progress: number) => {
  if (progress < 0.8) return 'bg-emerald-100'
  if (progress <= 1) return 'bg-amber-100'
  return 'bg-red-100'
}

interface TargetProgressProps {
  current: number
  target: number
  unit: string
}

function TargetProgress({ current, target, unit }: TargetProgressProps) {
  const progress = target > 0 ? current / target : 0
  const displayProgress = Math.min(progress, 1) * 100
  const isOver = progress > 1
  const barColor = getProgressColor(progress)
  const bgColor = getProgressBgColor(progress)

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">目标: {target.toLocaleString()} {unit}</span>
        {isOver && (
          <span className="text-red-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            超标
          </span>
        )}
      </div>
      <div className={`h-2 rounded-full ${bgColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-500 mt-1">
        完成率: {(progress * 100).toFixed(1)}%
      </div>
    </div>
  )
}

export default function EnergyStatisticsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AggregatedData | null>(null)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [targetFormState, setTargetFormState] = useState<TargetFormState>({
    electricity: '',
    steam: '',
    water: '',
    totalCost: '',
  })
  const [period, setPeriod] = useState<PeriodType>('day')
  const [chartView, setChartView] = useState<ChartViewType>('overview')
  const [listView, setListView] = useState<ListViewType>('summary')

  const energyStatistics = useVulcanizationStore((state) => state.energyStatistics)
  const energyTargets = useVulcanizationStore((state) => state.energyTargets)
  const addEnergyStatistics = useVulcanizationStore((state) => state.addEnergyStatistics)
  const updateEnergyTarget = useVulcanizationStore((state) => state.updateEnergyTarget)

  const currentTarget = useMemo(() => {
    return energyTargets[period] as EnergyTarget
  }, [energyTargets, period])

  const aggregatedData = useMemo(
    () => aggregateData(energyStatistics, period),
    [energyStatistics, period]
  )

  const dataWithTargetStatus = useMemo(() => {
    return aggregatedData.map((item) => ({
      ...item,
      isOverTarget: item.totalCost > currentTarget.totalCost,
    }))
  }, [aggregatedData, currentTarget.totalCost])

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
    () => [...dataWithTargetStatus].sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
    [dataWithTargetStatus]
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
    return dataWithTargetStatus.map((e) => ({
      date: e.statDate,
      电耗: e.electricity,
      蒸汽耗: e.steam,
      水耗: e.water,
      isOverTarget: e.isOverTarget,
    }))
  }, [dataWithTargetStatus])

  const electricTrendData = useMemo(() => {
    return dataWithTargetStatus.map((e) => ({
      date: e.statDate,
      电耗: e.electricity,
      isOver: e.electricity > currentTarget.electricity,
    }))
  }, [dataWithTargetStatus, currentTarget.electricity])

  const steamTrendData = useMemo(() => {
    return dataWithTargetStatus.map((e) => ({
      date: e.statDate,
      蒸汽耗: e.steam,
      isOver: e.steam > currentTarget.steam,
    }))
  }, [dataWithTargetStatus, currentTarget.steam])

  const waterTrendData = useMemo(() => {
    return dataWithTargetStatus.map((e) => ({
      date: e.statDate,
      水耗: e.water,
      isOver: e.water > currentTarget.water,
    }))
  }, [dataWithTargetStatus, currentTarget.water])

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
    return dataWithTargetStatus.map((e) => {
      const cost = calcCostBreakdown(e.electricity, e.steam, e.water)
      return {
        date: e.statDate,
        电费: Number(cost.electricCost.toFixed(2)),
        蒸汽费: Number(cost.steamCost.toFixed(2)),
        水费: Number(cost.waterCost.toFixed(2)),
        总费用: Number(cost.total.toFixed(2)),
        isOverTarget: e.isOverTarget,
      }
    })
  }, [dataWithTargetStatus])

  const periodTitle = getPeriodTitle(period)

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleTargetInputChange = (field: keyof TargetFormState, value: string) => {
    setTargetFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenTargetModal = () => {
    setTargetFormState({
      electricity: String(currentTarget.electricity),
      steam: String(currentTarget.steam),
      water: String(currentTarget.water),
      totalCost: String(currentTarget.totalCost),
    })
    setIsTargetModalOpen(true)
  }

  const handleSaveTarget = () => {
    const electricity = Number(targetFormState.electricity)
    const steam = Number(targetFormState.steam)
    const water = Number(targetFormState.water)
    const totalCost = Number(targetFormState.totalCost)

    if (isNaN(electricity) || isNaN(steam) || isNaN(water) || isNaN(totalCost)) {
      alert('请输入有效的数值')
      return
    }

    updateEnergyTarget(period, { electricity, steam, water, totalCost })
    setIsTargetModalOpen(false)
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

  const handleViewDetail = (record: AggregatedData) => {
    setSelectedRecord(record)
    setIsDetailModalOpen(true)
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
      header = '统计周期,电耗(kWh),蒸汽耗(t),水耗(t),总费用(元),是否达标\n'
      rows = sortedAggregated
        .map((e) => {
          const cost = calcCostBreakdown(e.electricity, e.steam, e.water)
          const status = e.isOverTarget ? '超标' : '达标'
          return `${e.statDate},${e.electricity.toFixed(1)},${e.steam.toFixed(1)},${e.water.toFixed(1)},${cost.total.toFixed(1)},${status}`
        })
        .join('\n')
    } else {
      header = '统计周期,电耗(kWh),电费(元),蒸汽耗(t),蒸汽费(元),水耗(t),水费(元),总费用(元),是否达标\n'
      rows = sortedAggregated
        .map((e) => {
          const cost = calcCostBreakdown(e.electricity, e.steam, e.water)
          const status = e.isOverTarget ? '超标' : '达标'
          return `${e.statDate},${e.electricity.toFixed(1)},${cost.electricCost.toFixed(1)},${e.steam.toFixed(1)},${cost.steamCost.toFixed(1)},${e.water.toFixed(1)},${cost.waterCost.toFixed(1)},${cost.total.toFixed(1)},${status}`
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

  const detailChartData = useMemo(() => {
    if (!selectedRecord) return []
    return [
      { name: '电耗', 实际: selectedRecord.electricity, 目标: currentTarget.electricity, unit: 'kWh' },
      { name: '蒸汽耗', 实际: selectedRecord.steam, 目标: currentTarget.steam, unit: 't' },
      { name: '水耗', 实际: selectedRecord.water, 目标: currentTarget.water, unit: 't' },
    ]
  }, [selectedRecord, currentTarget])

  const summaryColumns: Column<AggregatedData & { isOverTarget?: boolean }>[] = [
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
    {
      key: 'status',
      title: '是否达标',
      width: '100px',
      align: 'center',
      render: (row) => (
        <StatusBadge
          status={row.isOverTarget ? 'fail' : 'pass'}
          text={row.isOverTarget ? '超标' : '达标'}
        />
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      align: 'center',
      render: (row) => (
        <button
          onClick={() => handleViewDetail(row)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-md transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          详情
        </button>
      ),
    },
  ]

  const detailColumns: Column<AggregatedData & { isOverTarget?: boolean }>[] = [
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
    {
      key: 'status',
      title: '是否达标',
      width: '100px',
      align: 'center',
      render: (row) => (
        <StatusBadge
          status={row.isOverTarget ? 'fail' : 'pass'}
          text={row.isOverTarget ? '超标' : '达标'}
        />
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      align: 'center',
      render: (row) => (
        <button
          onClick={() => handleViewDetail(row)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-md transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          详情
        </button>
      ),
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

  const CustomDot = (props: Record<string, unknown>) => {
    const { cx, cy, stroke, payload } = props as { cx: number; cy: number; stroke: string; payload?: { isOver?: boolean; isOverTarget?: boolean } }
    if (payload?.isOver || payload?.isOverTarget) {
      return (
        <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
      )
    }
    return (
      <circle cx={cx} cy={cy} r={4} fill={stroke} strokeWidth={2} />
    )
  }

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
                onClick={handleOpenTargetModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg shadow-sm transition-colors border border-slate-300"
              >
                <Settings className="w-4 h-4" />
                目标设置
              </button>
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
          >
            <TargetProgress
              current={currentPeriodData?.electricity ?? 0}
              target={currentTarget.electricity}
              unit="kWh"
            />
          </StatCard>
          <StatCard
            title={`${periodTitle.card}蒸汽耗`}
            value={Number(currentPeriodData?.steam.toFixed(1) ?? 0)}
            unit="t"
            icon={Flame}
            trend={calcTrend(currentPeriodData?.steam, previousPeriodData?.steam)}
            trendLabel={periodTitle.trend}
            color="orange"
          >
            <TargetProgress
              current={currentPeriodData?.steam ?? 0}
              target={currentTarget.steam}
              unit="t"
            />
          </StatCard>
          <StatCard
            title={`${periodTitle.card}水耗`}
            value={Number(currentPeriodData?.water.toFixed(1) ?? 0)}
            unit="t"
            icon={Droplets}
            trend={calcTrend(currentPeriodData?.water, previousPeriodData?.water)}
            trendLabel={periodTitle.trend}
            color="green"
          >
            <TargetProgress
              current={currentPeriodData?.water ?? 0}
              target={currentTarget.water}
              unit="t"
            />
          </StatCard>
          <StatCard
            title={`${periodTitle.card}总能耗`}
            value={Number(currentPeriodCost.total.toFixed(1) ?? 0)}
            unit="元"
            icon={DollarSign}
            trend={calcTrend(currentPeriodCost.total, previousPeriodCost.total)}
            trendLabel={periodTitle.trend}
            color="purple"
          >
            <TargetProgress
              current={currentPeriodCost.total}
              target={currentTarget.totalCost}
              unit="元"
            />
          </StatCard>
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
                          dot={<CustomDot />}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="蒸汽耗"
                          stroke="#e85d26"
                          strokeWidth={2.5}
                          dot={<CustomDot />}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="水耗"
                          stroke="#2e8b57"
                          strokeWidth={2.5}
                          dot={<CustomDot />}
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
                      <ReferenceLine
                        y={currentTarget.totalCost}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{
                          value: '目标',
                          position: 'right',
                          fill: '#ef4444',
                          fontSize: 12,
                        }}
                      />
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
                      <ReferenceLine
                        y={currentTarget.electricity}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: '目标',
                          position: 'right',
                          fill: '#ef4444',
                          fontSize: 10,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="电耗"
                        stroke="#1e3a5f"
                        strokeWidth={2.5}
                        dot={<CustomDot />}
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
                      <ReferenceLine
                        y={currentTarget.steam}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: '目标',
                          position: 'right',
                          fill: '#ef4444',
                          fontSize: 10,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="蒸汽耗"
                        stroke="#e85d26"
                        strokeWidth={2.5}
                        dot={<CustomDot />}
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
                      <ReferenceLine
                        y={currentTarget.water}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                        label={{
                          value: '目标',
                          position: 'right',
                          fill: '#ef4444',
                          fontSize: 10,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="水耗"
                        stroke="#2e8b57"
                        strokeWidth={2.5}
                        dot={<CustomDot />}
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
            rowClassName={(row) =>
              (row as { isOverTarget?: boolean }).isOverTarget ? 'bg-red-50/50 hover:bg-red-50' : ''
            }
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

      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#1e3a5f] rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">目标设置 - {period === 'day' ? '日' : period === 'week' ? '周' : '月'}</h3>
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  电耗目标 (kWh)
                </label>
                <input
                  type="number"
                  value={targetFormState.electricity}
                  onChange={(e) => handleTargetInputChange('electricity', e.target.value)}
                  placeholder="请输入电耗目标"
                  min="0"
                  step="1"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  蒸汽目标 (t)
                </label>
                <input
                  type="number"
                  value={targetFormState.steam}
                  onChange={(e) => handleTargetInputChange('steam', e.target.value)}
                  placeholder="请输入蒸汽目标"
                  min="0"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  水耗目标 (t)
                </label>
                <input
                  type="number"
                  value={targetFormState.water}
                  onChange={(e) => handleTargetInputChange('water', e.target.value)}
                  placeholder="请输入水耗目标"
                  min="0"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  总费用目标 (元)
                </label>
                <input
                  type="number"
                  value={targetFormState.totalCost}
                  onChange={(e) => handleTargetInputChange('totalCost', e.target.value)}
                  placeholder="请输入总费用目标"
                  min="0"
                  step="1"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTarget}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#2a4f7a] rounded-lg shadow-sm transition-colors border border-[#1e3a5f]"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#1e3a5f] rounded-t-xl">
              <div>
                <h3 className="text-lg font-semibold text-white">能耗详情 - {selectedRecord.statDate}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedRecord.isOverTarget ? '超标记录' : '达标记录'}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">电耗</div>
                  <div className="text-xl font-bold text-[#1e3a5f]">
                    {selectedRecord.electricity.toFixed(1)}
                    <span className="text-sm font-normal text-slate-500 ml-1">kWh</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    目标: {currentTarget.electricity} kWh
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">蒸汽耗</div>
                  <div className="text-xl font-bold text-[#e85d26]">
                    {selectedRecord.steam.toFixed(1)}
                    <span className="text-sm font-normal text-slate-500 ml-1">t</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    目标: {currentTarget.steam} t
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">水耗</div>
                  <div className="text-xl font-bold text-[#2e8b57]">
                    {selectedRecord.water.toFixed(1)}
                    <span className="text-sm font-normal text-slate-500 ml-1">t</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    目标: {currentTarget.water} t
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">总费用</div>
                  <div className="text-xl font-bold text-amber-600">
                    ¥{calcCostBreakdown(selectedRecord.electricity, selectedRecord.steam, selectedRecord.water).total.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    目标: ¥{currentTarget.totalCost}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-[#1e3a5f]" />
                  <h4 className="text-base font-semibold text-gray-800">实际与目标对比</h4>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={detailChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
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
                      <Bar dataKey="实际" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="目标" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">电耗达标情况</span>
                  <StatusBadge
                    status={selectedRecord.electricity > currentTarget.electricity ? 'fail' : 'pass'}
                    text={selectedRecord.electricity > currentTarget.electricity ? '超标' : '达标'}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">蒸汽耗达标情况</span>
                  <StatusBadge
                    status={selectedRecord.steam > currentTarget.steam ? 'fail' : 'pass'}
                    text={selectedRecord.steam > currentTarget.steam ? '超标' : '达标'}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">水耗达标情况</span>
                  <StatusBadge
                    status={selectedRecord.water > currentTarget.water ? 'fail' : 'pass'}
                    text={selectedRecord.water > currentTarget.water ? '超标' : '达标'}
                  />
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-medium">总费用达标情况</span>
                  <StatusBadge
                    status={selectedRecord.isOverTarget ? 'fail' : 'pass'}
                    text={selectedRecord.isOverTarget ? '超标' : '达标'}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-[#2a4f7a] rounded-lg shadow-sm transition-colors border border-[#1e3a5f]"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
