import { NavLink } from 'react-router-dom'
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
  LayoutDashboard,
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

const quickLinks = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard, color: 'from-[#1e3a5f] to-[#2a4f7a]' },
  { path: '/semi-finished', label: '半成品接收', icon: Package, color: 'from-[#2563eb] to-[#3b82f6]' },
  { path: '/mold-prep', label: '模具准备', icon: Wrench, color: 'from-[#7c3aed] to-[#8b5cf6]' },
  { path: '/plate-vulcanization', label: '平板硫化', icon: Flame, color: 'from-[#e85d26] to-[#f97316]' },
  { path: '/tank-vulcanization', label: '罐式硫化', icon: Container, color: 'from-[#0891b2] to-[#06b6d4]' },
  { path: '/demolding', label: '脱模修边', icon: Scissors, color: 'from-[#db2777] to-[#ec4899]' },
  { path: '/appearance-inspection', label: '外观检验', icon: Eye, color: 'from-[#059669] to-[#10b981]' },
  { path: '/physical-inspection', label: '物性抽检', icon: Microscope, color: 'from-[#d97706] to-[#f59e0b]' },
  { path: '/energy-statistics', label: '能耗统计', icon: Zap, color: 'from-[#2e8b57] to-[#34d399]' },
]

const processStatus = [
  { name: '半成品接收', count: 12, total: 30, color: 'bg-[#3b82f6]' },
  { name: '模具准备', count: 8, total: 30, color: 'bg-[#8b5cf6]' },
  { name: '平板硫化', count: 15, total: 30, color: 'bg-[#e85d26]' },
  { name: '罐式硫化', count: 6, total: 30, color: 'bg-[#06b6d4]' },
  { name: '脱模修边', count: 10, total: 30, color: 'bg-[#ec4899]' },
  { name: '外观检验', count: 5, total: 30, color: 'bg-[#10b981]' },
  { name: '物性抽检', count: 3, total: 30, color: 'bg-[#f59e0b]' },
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
  const store = useVulcanizationStore()

  const todayProduction =
    store.demolding.reduce((sum, d) => sum + d.qualifiedQty + d.defectiveQty, 0) * 10

  const totalDemolded = store.demolding.reduce(
    (sum, d) => sum + d.qualifiedQty + d.defectiveQty,
    0
  )
  const qualifiedDemolded = store.demolding.reduce((sum, d) => sum + d.qualifiedQty, 0)
  const passRate = totalDemolded > 0 ? ((qualifiedDemolded / totalDemolded) * 100).toFixed(1) : '0.0'

  const todayEnergyCost =
    store.energyStatistics.length > 0
      ? store.energyStatistics[store.energyStatistics.length - 1].totalCost
      : 0

  const activeBatches =
    store.plateVulcanization.filter((p) => p.status === 'running').length +
    store.tankVulcanization.filter((t) => t.status === 'running').length

  const pendingTasks =
    store.molds.filter((m) => m.status === 'available').length +
    store.plateVulcanization.filter((p) => p.status === 'pending').length +
    store.tankVulcanization.filter((t) => t.status === 'pending').length

  const completedToday =
    store.plateVulcanization.filter((p) => p.status === 'completed').length +
    store.tankVulcanization.filter((t) => t.status === 'completed').length +
    store.demolding.length

  const energyData = store.energyStatistics.slice(-7).map((e) => ({
    date: e.statDate.slice(5),
    电力: e.electricity,
    蒸汽: e.steam * 100,
    水费: e.water * 50,
  }))

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
          trend={5.2}
          trendLabel="较昨日"
          color="blue"
        />
        <StatCard
          title="合格率"
          value={passRate}
          unit="%"
          icon={CheckCircle2}
          trend={1.8}
          trendLabel="较昨日"
          color="green"
        />
        <StatCard
          title="今日能耗"
          value={todayEnergyCost}
          unit="元"
          icon={Zap}
          trend={-3.1}
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
          unit="单"
          icon={TrendingUp}
          trend={8.5}
          trendLabel="较昨日"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
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
                    style={{ width: `${(item.count / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
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
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="w-5 h-5" />
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
