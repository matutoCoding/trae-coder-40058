import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Package,
  Wrench,
  Flame,
  Container,
  Scissors,
  Eye,
  Microscope,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Factory,
  Check,
  ExternalLink,
  Filter,
  Inbox,
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
} from 'recharts'
import StatCard from '@/components/Card/StatCard'
import PageHeader from '@/components/Form/PageHeader'
import { useVulcanizationStore } from '@/store'

const todayStr = new Date().toLocaleDateString('zh-CN')

const isToday = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN') === todayStr
  } catch {
    return false
  }
}

const quickLinks = [
  { path: '/semi-finished', label: '半成品接收', icon: Package, color: 'from-[#2563eb] to-[#3b82f6]' },
  { path: '/mold-prep', label: '模具准备', icon: Wrench, color: 'from-[#7c3aed] to-[#8b5cf6]' },
  { path: '/plate-vulcanization', label: '平板硫化', icon: Flame, color: 'from-[#e85d26] to-[#f97316]' },
  { path: '/tank-vulcanization', label: '罐式硫化', icon: Container, color: 'from-[#0891b2] to-[#06b6d4]' },
  { path: '/demolding', label: '脱模修边', icon: Scissors, color: 'from-[#db2777] to-[#ec4899]' },
  { path: '/appearance-inspection', label: '外观检验', icon: Eye, color: 'from-[#059669] to-[#10b981]' },
  { path: '/physical-inspection', label: '物性抽检', icon: Microscope, color: 'from-[#d97706] to-[#f59e0b]' },
  { path: '/energy-statistics', label: '能耗统计', icon: Zap, color: 'from-[#2e8b57] to-[#34d399]' },
]

const recentActivities = [
  { id: 1, action: '平板硫化批次 PV-20260617-001 完成', operator: '李师傅', time: '10分钟前', type: 'success' },
  { id: 2, action: '半成品批次 JL20260617005 入库', operator: '张工', time: '25分钟前', type: 'info' },
  { id: 3, action: '模具 MJ-A002 开始预热', operator: '王师傅', time: '35分钟前', type: 'warning' },
  { id: 4, action: '外观检验批次 AI-20260617-002 通过', operator: '质检员李', time: '1小时前', type: 'success' },
  { id: 5, action: '罐式硫化 TV-20260617-001 启动', operator: '赵师傅', time: '1.5小时前', type: 'info' },
  { id: 6, action: '物性抽检硬度超标，需复检', operator: '质检员王', time: '2小时前', type: 'error' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const store = useVulcanizationStore()

  const todayDemoldingList = store.demolding.filter((d) => isToday(d.createTime))
  const todayProduction = todayDemoldingList.reduce((sum, d) => sum + d.qualifiedQty, 0)
  const todayQualifiedTotal = todayDemoldingList.reduce((sum, d) => sum + d.qualifiedQty, 0)
  const todayDefectiveTotal = todayDemoldingList.reduce((sum, d) => sum + d.defectiveQty, 0)
  const todayTotal = todayQualifiedTotal + todayDefectiveTotal
  const passRate = todayTotal > 0 ? ((todayQualifiedTotal / todayTotal) * 100).toFixed(1) : '0.0'

  const todayEnergyList = store.energyStatistics.filter((e) => isToday(e.statDate))
  const todayElectricity = todayEnergyList.reduce((sum, e) => sum + e.electricity, 0)
  const todaySteam = todayEnergyList.reduce((sum, e) => sum + e.steam, 0)
  const todayWater = todayEnergyList.reduce((sum, e) => sum + e.water, 0)
  const todayEnergyCost = todayElectricity * 0.8 + todaySteam * 200 + todayWater * 5

  const activeBatches =
    store.plateVulcanization.filter((p) => p.status === 'running').length +
    store.tankVulcanization.filter((t) => t.status === 'running').length

  const pendingTasks =
    store.getAvailableSemiFinishedForVulcanization().length +
    store.getCompletedVulcanizationForDemolding('plate').length +
    store.getCompletedVulcanizationForDemolding('tank').length +
    store.getDemoldingForAppearance().length +
    store.getAppearanceForPhysical().length

  const todayCompletedPlate = store.plateVulcanization.filter(
    (p) => p.status === 'completed' && p.endTime && isToday(p.endTime)
  ).length
  const todayCompletedTank = store.tankVulcanization.filter(
    (t) => t.status === 'completed' && t.endTime && isToday(t.endTime)
  ).length
  const completedToday = todayCompletedPlate + todayCompletedTank

  const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('zh-CN')
  const isYesterday = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN') === yesterdayStr
    } catch {
      return false
    }
  }

  const yesterdayDemoldingList = store.demolding.filter((d) => isYesterday(d.createTime))
  const yesterdayProduction = yesterdayDemoldingList.reduce((sum, d) => sum + d.qualifiedQty, 0)
  const productionTrend =
    yesterdayProduction > 0 ? ((todayProduction - yesterdayProduction) / yesterdayProduction) * 100 : undefined

  const yesterdayQualified = yesterdayDemoldingList.reduce((sum, d) => sum + d.qualifiedQty, 0)
  const yesterdayDefective = yesterdayDemoldingList.reduce((sum, d) => sum + d.defectiveQty, 0)
  const yesterdayTotal = yesterdayQualified + yesterdayDefective
  const yesterdayPassRate = yesterdayTotal > 0 ? (yesterdayQualified / yesterdayTotal) * 100 : 0
  const todayPassRateNum = todayTotal > 0 ? (todayQualifiedTotal / todayTotal) * 100 : 0
  const passRateTrend =
    yesterdayTotal > 0 ? todayPassRateNum - yesterdayPassRate : undefined

  const yesterdayEnergyList = store.energyStatistics.filter((e) => isYesterday(e.statDate))
  const yesterdayElectricity = yesterdayEnergyList.reduce((sum, e) => sum + e.electricity, 0)
  const yesterdaySteam = yesterdayEnergyList.reduce((sum, e) => sum + e.steam, 0)
  const yesterdayWater = yesterdayEnergyList.reduce((sum, e) => sum + e.water, 0)
  const yesterdayEnergyCost = yesterdayElectricity * 0.8 + yesterdaySteam * 200 + yesterdayWater * 5
  const energyTrend =
    yesterdayEnergyCost > 0 ? ((todayEnergyCost - yesterdayEnergyCost) / yesterdayEnergyCost) * 100 : undefined

  const yesterdayCompletedPlate = store.plateVulcanization.filter(
    (p) => p.status === 'completed' && p.endTime && isYesterday(p.endTime)
  ).length
  const yesterdayCompletedTank = store.tankVulcanization.filter(
    (t) => t.status === 'completed' && t.endTime && isYesterday(t.endTime)
  ).length
  const yesterdayCompleted = yesterdayCompletedPlate + yesterdayCompletedTank
  const completedTrend =
    yesterdayCompleted > 0 ? ((completedToday - yesterdayCompleted) / yesterdayCompleted) * 100 : undefined

  const energyData = store.energyStatistics.slice(-7).map((e) => ({
    date: e.statDate.slice(5),
    电力: e.electricity,
    蒸汽: e.steam * 100,
    水费: e.water * 50,
  }))

  const processStatus = [
    { name: '半成品接收', count: store.semiFinished.length, total: Math.max(store.semiFinished.length, 30), color: 'bg-[#3b82f6]' },
    { name: '模具准备', count: store.molds.filter((m) => m.status === 'available').length, total: Math.max(store.molds.length, 30), color: 'bg-[#8b5cf6]' },
    { name: '平板硫化', count: store.plateVulcanization.filter((p) => p.status === 'running').length, total: Math.max(store.plateVulcanization.length, 30), color: 'bg-[#e85d26]' },
    { name: '罐式硫化', count: store.tankVulcanization.filter((t) => t.status === 'running').length, total: Math.max(store.tankVulcanization.length, 30), color: 'bg-[#06b6d4]' },
    { name: '脱模修边', count: store.getCompletedVulcanizationForDemolding('plate').length + store.getCompletedVulcanizationForDemolding('tank').length, total: Math.max(store.demolding.length, 30), color: 'bg-[#ec4899]' },
    { name: '外观检验', count: store.getDemoldingForAppearance().length, total: Math.max(store.appearanceInspection.length, 30), color: 'bg-[#10b981]' },
    { name: '物性抽检', count: store.getAppearanceForPhysical().length, total: Math.max(store.physicalInspection.length, 30), color: 'bg-[#f59e0b]' },
  ]

  const [batchFilter, setBatchFilter] = useState<'all' | 'demolding' | 'appearance' | 'physical' | 'abnormal'>('all')

  const batchFlowList = store.getBatchFlowStatus()
  const flowSteps = ['半成品接收', '硫化工序', '脱模修边', '外观检验', '物性抽检', '全部完成']

  const demoldingCount =
    store.getCompletedVulcanizationForDemolding('plate').length +
    store.getCompletedVulcanizationForDemolding('tank').length
  const appearanceCount = store.getDemoldingForAppearance().length
  const physicalCount = store.getAppearanceForPhysical().length
  const failedAppearanceCount = store.getFailedAppearanceForReference().length
  const failedPhysicalCount = store.physicalInspection.filter(
    (p) => p.hardnessResult === 'fail'
  ).length
  const abnormalCount = failedAppearanceCount + failedPhysicalCount

  const filterTabs = [
    { key: 'all' as const, label: '全部', count: batchFlowList.length },
    { key: 'demolding' as const, label: '待脱模', count: demoldingCount },
    { key: 'appearance' as const, label: '待外观', count: appearanceCount },
    { key: 'physical' as const, label: '待物性', count: physicalCount },
    { key: 'abnormal' as const, label: '异常批次', count: abnormalCount },
  ]

  const getFilteredBatchList = () => {
    if (batchFilter === 'all') {
      return batchFlowList
    }
    return batchFlowList.filter((batch) => {
      const { stepIndex, details } = batch
      const vulc = details.vulcanization as { status?: string } | undefined
      const appearance = details.appearance as { result?: string } | undefined
      const physical = details.physical as { hardnessResult?: string } | undefined

      switch (batchFilter) {
        case 'demolding':
          return stepIndex === 1 && vulc?.status === 'completed'
        case 'appearance':
          return stepIndex === 2
        case 'physical':
          return stepIndex === 3 && appearance?.result === 'pass'
        case 'abnormal':
          return (
            (stepIndex === 3 && appearance?.result === 'fail') ||
            (physical && physical.hardnessResult === 'fail')
          )
        default:
          return true
      }
    })
  }

  const filteredBatchList = getFilteredBatchList()
  const displayBatchList = filteredBatchList.slice(0, 8)

  const getBadgeCounts = () => ({
    '/semi-finished': store.semiFinished.length,
    '/mold-prep': store.molds.filter((m) => m.status === 'available').length,
    '/plate-vulcanization': store.getAvailableSemiFinishedForVulcanization().length,
    '/tank-vulcanization': store.getAvailableSemiFinishedForVulcanization().length,
    '/demolding':
      store.getCompletedVulcanizationForDemolding('plate').length +
      store.getCompletedVulcanizationForDemolding('tank').length,
    '/appearance-inspection': store.getDemoldingForAppearance().length,
    '/physical-inspection': store.getAppearanceForPhysical().length,
    '/energy-statistics': store.energyStatistics.length,
  })

  const badgeCounts = getBadgeCounts()

  const getBatchStatusInfo = (batch: typeof batchFlowList[0]) => {
    const { stepIndex, details } = batch
    const vulc = details.vulcanization as { status?: string } | undefined
    const appearance = details.appearance as { result?: string } | undefined

    if (stepIndex === 0) {
      return { title: '待安排硫化', color: 'amber', label: '待办' }
    }
    if (stepIndex === 1) {
      if (vulc?.status === 'running') {
        return { title: '正在硫化中', color: 'blue', label: '进行' }
      }
      return { title: '待脱模', color: 'amber', label: '待办' }
    }
    if (stepIndex === 2) {
      return { title: '待外观检验', color: 'amber', label: '待办' }
    }
    if (stepIndex === 3) {
      if (appearance?.result === 'fail') {
        return { title: '外观不合格', color: 'red', label: '异常' }
      }
      return { title: '待物性抽检', color: 'amber', label: '待办' }
    }
    if (stepIndex === 5) {
      return { title: '全部完成', color: 'green', label: '完成' }
    }
    return { title: batch.currentStep, color: 'blue' as const, label: '进行' }
  }

  const getStatusStyles = (color: string) => {
    switch (color) {
      case 'amber':
        return {
          badgeBg: 'bg-amber-100 text-amber-700',
          dotBg: 'bg-amber-500',
          titleColor: 'text-amber-700',
        }
      case 'blue':
        return {
          badgeBg: 'bg-blue-100 text-blue-700',
          dotBg: 'bg-blue-500',
          titleColor: 'text-blue-700',
        }
      case 'green':
        return {
          badgeBg: 'bg-emerald-100 text-emerald-700',
          dotBg: 'bg-emerald-500',
          titleColor: 'text-emerald-700',
        }
      case 'red':
        return {
          badgeBg: 'bg-red-100 text-red-700',
          dotBg: 'bg-red-500',
          titleColor: 'text-red-700',
        }
      default:
        return {
          badgeBg: 'bg-gray-100 text-gray-700',
          dotBg: 'bg-gray-500',
          titleColor: 'text-gray-700',
        }
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#2e8b57]" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#e85d26]" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-[#1e3a5f]" />
    }
  }

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50'
      case 'warning':
        return 'bg-orange-50'
      case 'error':
        return 'bg-red-50'
      default:
        return 'bg-blue-50'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        description="橡胶硫化车间生产概览，实时监控各项指标"
        actions={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleString('zh-CN')}</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="今日产量"
          value={todayProduction}
          unit="件"
          icon={Factory}
          trend={productionTrend}
          trendLabel="较昨日"
          color="blue"
        />
        <StatCard
          title="合格率"
          value={passRate}
          unit="%"
          icon={CheckCircle2}
          trend={passRateTrend}
          trendLabel="较昨日"
          color="green"
        />
        <StatCard
          title="今日能耗"
          value={todayEnergyCost}
          unit="元"
          icon={Zap}
          trend={energyTrend}
          trendLabel="较昨日"
          color="orange"
        />
        <StatCard
          title="在制批次"
          value={activeBatches}
          unit="批"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="待办任务"
          value={pendingTasks}
          unit="项"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="今日完成"
          value={completedToday}
          unit="批"
          icon={TrendingUp}
          trend={completedTrend}
          trendLabel="较昨日"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">在制状态看板</h3>
              <span className="text-xs text-gray-500">各工序在制数量分布</span>
            </div>
            <div className="space-y-4">
              {processStatus.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm text-gray-500">
                      {item.count} / {item.total}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">批次流转追踪</h3>
                <span className="text-xs text-gray-500">实时追踪各批次当前工序进度</span>
              </div>
              {filteredBatchList.length > 8 && (
                <NavLink to="/dashboard" className="text-xs text-[#1e3a5f] hover:underline">
                  查看全部 {filteredBatchList.length} 个批次
                </NavLink>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {filterTabs.map((tab) => {
                const isActive = batchFilter === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setBatchFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#1e3a5f] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-xs font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {displayBatchList.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                {batchFilter === 'abnormal' ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    <div className="text-gray-400 text-sm">暂无异常批次 🎉</div>
                  </>
                ) : (
                  <>
                    <Inbox className="w-12 h-12 text-gray-300" />
                    <div className="text-gray-400 text-sm">
                      {batchFilter === 'demolding' && '暂无待脱模批次'}
                      {batchFilter === 'appearance' && '暂无待外观检验批次'}
                      {batchFilter === 'physical' && '暂无待物性抽检批次'}
                      {batchFilter === 'all' && '暂无批次流转数据'}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayBatchList.map((batch) => {
                  const statusInfo = getBatchStatusInfo(batch)
                  const statusStyles = getStatusStyles(statusInfo.color)
                  const isRunning = statusInfo.color === 'blue'
                  const isFail = statusInfo.color === 'red'
                  return (
                    <div
                      key={batch.semiFinishedId}
                      onClick={() => navigate(`/batch-detail?id=${batch.semiFinishedId}`)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#1e3a5f]/30 hover:shadow-sm hover:bg-gray-50 transition-all cursor-pointer relative group"
                    >
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between mb-3 pr-6">
                        <span className="font-semibold text-gray-800 text-sm">{batch.batchNo}</span>
                        <div className="flex items-center gap-2">
                          {isFail && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles.badgeBg}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusStyles.dotBg} ${isRunning ? 'animate-pulse' : ''}`}
                            />
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className={`text-sm font-medium mb-2 ${statusStyles.titleColor}`}>
                        {statusInfo.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">更新于 {batch.timestamp}</div>
                      <div className="relative">
                        {flowSteps.map((step, idx) => {
                          const isCompleted = idx <= batch.stepIndex
                          const isCurrent = idx === batch.stepIndex + 1 && batch.stepIndex !== 5
                          const useCustomColor = idx === batch.stepIndex && statusInfo.color !== 'blue'
                          const dotColor = useCustomColor
                            ? statusInfo.color === 'amber'
                              ? 'bg-amber-500'
                              : statusInfo.color === 'red'
                              ? 'bg-red-500'
                              : statusInfo.color === 'green'
                              ? 'bg-emerald-500'
                              : 'bg-emerald-500'
                            : isCompleted
                            ? 'bg-emerald-500'
                            : isCurrent
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                          const ringColor = useCustomColor
                            ? statusInfo.color === 'amber'
                              ? 'ring-amber-100'
                              : statusInfo.color === 'red'
                              ? 'ring-red-100'
                              : statusInfo.color === 'green'
                              ? 'ring-emerald-100'
                              : 'ring-blue-100'
                            : 'ring-blue-100'
                          const textColor = useCustomColor
                            ? statusInfo.color === 'amber'
                              ? 'text-amber-700'
                              : statusInfo.color === 'red'
                              ? 'text-red-700'
                              : statusInfo.color === 'green'
                              ? 'text-emerald-700'
                              : 'text-emerald-700'
                            : isCompleted
                            ? 'text-emerald-700'
                            : isCurrent
                            ? 'text-blue-700'
                            : 'text-gray-400'
                          const lineColor =
                            idx < batch.stepIndex
                              ? useCustomColor && statusInfo.color !== 'green'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              : 'bg-gray-200'
                          return (
                            <div key={step} className="flex items-start gap-3 mb-2 last:mb-0">
                              <div className="relative flex flex-col items-center">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${dotColor} ${isCurrent && !useCustomColor ? `ring-4 ${ringColor}` : ''}`}
                                >
                                  {isCompleted && !isCurrent && <Check className="w-3 h-3 text-white" />}
                                  {isCurrent && !useCustomColor && (
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                  )}
                                </div>
                                {idx < flowSteps.length - 1 && (
                                  <div className={`w-0.5 h-4 mt-0.5 ${lineColor}`} />
                                )}
                              </div>
                              <span className={`text-xs leading-5 font-medium ${textColor}`}>
                                {step}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">最近活动</h3>
            <NavLink to="/dashboard" className="text-xs text-[#1e3a5f] hover:underline">
              查看全部
            </NavLink>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg ${getActivityBg(activity.type)} flex items-center justify-center flex-shrink-0`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.operator}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">能耗趋势</h3>
            <span className="text-xs text-gray-500">最近7天</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                  dataKey="电力"
                  stroke="#1e3a5f"
                  strokeWidth={2.5}
                  dot={{ fill: '#1e3a5f', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="蒸汽"
                  stroke="#e85d26"
                  strokeWidth={2.5}
                  dot={{ fill: '#e85d26', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="水费"
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">快速入口</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon
              const count = badgeCounts[link.path as keyof typeof badgeCounts] || 0
              const showBadge = count > 0
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 group relative"
                >
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">
                    {link.label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
