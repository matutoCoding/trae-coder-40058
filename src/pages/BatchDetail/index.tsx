import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  Minus,
  Package,
  Flame,
  Container,
  Scissors,
  Eye,
  Microscope,
  Flag,
  AlertTriangle,
  RefreshCw,
  Save,
  ThumbsUp,
  XCircle,
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
import PageHeader from '@/components/Form/PageHeader'
import StatusBadge from '@/components/Card/StatusBadge'
import { useVulcanizationStore } from '@/store'
import type {
  SemiFinished,
  PlateVulcanization,
  TankVulcanization,
  Demolding,
  AppearanceInspection,
  PhysicalInspection,
  Mold,
  DefectHandlingRecord,
} from '@/types'

type TimelineStep =
  | 'semiFinished'
  | 'vulcanization'
  | 'demolding'
  | 'appearance'
  | 'physical'
  | 'finished'

type TimelineStatus = 'completed' | 'running' | 'pending' | 'skipped'

interface TimelineItem {
  key: TimelineStep
  title: string
  icon: typeof Package
  status: TimelineStatus
  time?: string
  operator?: string
  summary?: string
}

export default function BatchDetail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const semiFinishedId = searchParams.get('id') || ''

  const [handlingType, setHandlingType] = useState<'rework' | 'scrap' | 'concession'>('rework')
  const [conclusion, setConclusion] = useState('')
  const [handler, setHandler] = useState('')
  const [editingSourceType, setEditingSourceType] = useState<'appearance' | 'physical' | null>(null)

  const store = useVulcanizationStore()

  const {
    semiFinished,
    vulcanization,
    vulcanizationType,
    mold,
    demolding,
    appearance,
    physical,
    defectHandlings,
  } = useMemo(() => {
    const sf = store.semiFinished.find((s) => s.id === semiFinishedId) as SemiFinished | undefined

    const pv = store.plateVulcanization.find((p) => p.semiFinishedId === semiFinishedId) as
      | PlateVulcanization
      | undefined
    const tv = store.tankVulcanization.find((t) => t.semiFinishedId === semiFinishedId) as
      | TankVulcanization
      | undefined

    const vulc: PlateVulcanization | TankVulcanization | undefined = pv || tv
    const vulcType: 'plate' | 'tank' | undefined = pv ? 'plate' : tv ? 'tank' : undefined

    let moldItem: Mold | undefined
    if (pv) {
      moldItem = store.molds.find((m) => m.id === pv.moldId)
    }

    let dm: Demolding | undefined
    if (vulc && vulcType) {
      dm = store.demolding.find(
        (d) => d.vulcanizationId === vulc.id && d.vulcanizationType === vulcType
      )
    }

    let ai: AppearanceInspection | undefined
    if (dm) {
      ai = store.appearanceInspection.find((a) => a.demoldingId === dm.id)
    }

    let pi: PhysicalInspection | undefined
    if (ai) {
      pi = store.physicalInspection.find((p) => p.appearanceId === ai.id)
    }

    const dh = store.getDefectHandlingByBatchId(semiFinishedId)

    return {
      semiFinished: sf,
      vulcanization: vulc,
      vulcanizationType: vulcType,
      mold: moldItem,
      demolding: dm,
      appearance: ai,
      physical: pi,
      defectHandlings: dh,
    }
  }, [store, semiFinishedId])

  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!semiFinished) return []

    const items: TimelineItem[] = []

    items.push({
      key: 'semiFinished',
      title: '半成品接收',
      icon: Package,
      status: 'completed',
      time: semiFinished.receiveDate,
      operator: semiFinished.receiver,
      summary: `${semiFinished.rubberType} · ${semiFinished.quantity}kg`,
    })

    let vulcStatus: TimelineStatus = 'pending'
    let vulcTime: string | undefined
    let vulcOperator: string | undefined
    let vulcSummary: string | undefined

    if (vulcanization) {
      if (vulcanization.status === 'running') {
        vulcStatus = 'running'
      } else if (vulcanization.status === 'completed') {
        vulcStatus = 'completed'
      } else {
        vulcStatus = 'pending'
      }
      vulcTime = vulcanization.endTime || vulcanization.startTime
      vulcOperator = vulcanization.operator
      vulcSummary = vulcanizationType === 'plate' ? `平板硫化 · ${vulcanization.temperature}℃` : `罐式硫化 · ${vulcanization.temperature}℃`
    }

    items.push({
      key: 'vulcanization',
      title: vulcanizationType === 'plate' ? '平板硫化' : vulcanizationType === 'tank' ? '罐式硫化' : '硫化工序',
      icon: vulcanizationType === 'tank' ? Container : Flame,
      status: vulcStatus,
      time: vulcTime,
      operator: vulcOperator,
      summary: vulcSummary,
    })

    items.push({
      key: 'demolding',
      title: '脱模修边',
      icon: Scissors,
      status: demolding ? 'completed' : vulcanization?.status === 'completed' ? 'pending' : 'pending',
      time: demolding?.createTime,
      operator: demolding?.operator,
      summary: demolding ? `合格${demolding.qualifiedQty} · 废品${demolding.defectiveQty}` : undefined,
    })

    let appearanceStatus: TimelineStatus = 'pending'
    if (appearance) {
      appearanceStatus = appearance.result === 'pass' ? 'completed' : 'skipped'
    }

    items.push({
      key: 'appearance',
      title: '外观检验',
      icon: Eye,
      status: appearanceStatus,
      time: appearance?.inspectTime,
      operator: appearance?.inspector,
      summary: appearance ? (appearance.result === 'pass' ? '外观合格' : '外观不合格') : undefined,
    })

    let physicalStatus: TimelineStatus = 'pending'
    if (appearance && appearance.result === 'fail') {
      physicalStatus = 'skipped'
    } else if (physical) {
      physicalStatus = 'completed'
    }

    items.push({
      key: 'physical',
      title: '物性抽检',
      icon: Microscope,
      status: physicalStatus,
      time: physical?.inspectTime,
      operator: physical?.inspector,
      summary: physical ? `硬度 ${physical.hardness}°` : appearance?.result === 'fail' ? '已中止，无需抽检' : undefined,
    })

    const hasDefect = appearance?.result === 'fail' || (physical && (physical.hardnessResult === 'fail'))
    const appearanceDefectHandled = appearance && appearance.result === 'fail' &&
      defectHandlings.some(d => d.sourceType === 'appearance' && d.sourceRecordId === appearance.id)
    const physicalDefectHandled = physical && physical.hardnessResult === 'fail' &&
      defectHandlings.some(d => d.sourceType === 'physical' && d.sourceRecordId === physical.id)
    const allDefectsHandled = !hasDefect ||
      (appearance?.result === 'fail' ? appearanceDefectHandled : true) &&
      (physical && physical.hardnessResult === 'fail' ? physicalDefectHandled : true)

    let finishedStatus: TimelineStatus = 'pending'
    let finishedTitle = '流程完结'
    let finishedSummary: string | undefined
    let finishedTime: string | undefined

    if (!hasDefect && physical) {
      finishedStatus = 'completed'
      finishedTitle = '全部完成'
      finishedSummary = '全部工序已完成'
      finishedTime = physical.inspectTime
    } else if (hasDefect) {
      if (allDefectsHandled) {
        finishedStatus = 'completed'
        finishedTitle = '异常处理已完成'
        finishedSummary = '不合格项已处理完毕'
        const latestHandling = defectHandlings
          .filter(d => d.batchId === semiFinishedId)
          .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())[0]
        finishedTime = latestHandling?.createTime
      } else {
        finishedStatus = 'running'
        finishedTitle = '待异常处理'
        finishedSummary = '存在不合格项，需登记处理结论'
      }
    } else if (appearance?.result === 'fail' && !physical) {
      finishedStatus = 'skipped'
      finishedSummary = '已转入不合格品处理'
    }

    items.push({
      key: 'finished',
      title: finishedTitle,
      icon: Flag,
      status: finishedStatus,
      time: finishedTime,
      summary: finishedSummary,
    })

    return items
  }, [semiFinished, vulcanization, vulcanizationType, demolding, appearance, physical, defectHandlings, semiFinishedId])

  const nextAction = useMemo(() => {
    if (!semiFinished) return null

    if (!vulcanization) {
      return {
        type: 'action',
        text: '下一步：前往平板/罐式硫化开始生产',
        buttons: [
          { label: '平板硫化', path: '/plate-vulcanization', color: 'bg-[#e85d26] hover:bg-[#d14a1a]' },
          { label: '罐式硫化', path: '/tank-vulcanization', color: 'bg-[#0891b2] hover:bg-[#0e7490]' },
        ],
      }
    }

    if (vulcanization.status === 'running') {
      return {
        type: 'info',
        text: '当前：正在硫化，请等待完成',
      }
    }

    if (vulcanization.status === 'completed' && !demolding) {
      return {
        type: 'action',
        text: '下一步：前往脱模修边进行处理',
        buttons: [{ label: '脱模修边', path: '/demolding', color: 'bg-[#db2777] hover:bg-[#be185d]' }],
      }
    }

    if (demolding && !appearance) {
      return {
        type: 'action',
        text: '下一步：前往外观检验',
        buttons: [
          { label: '外观检验', path: '/appearance-inspection', color: 'bg-[#059669] hover:bg-[#047857]' },
        ],
      }
    }

    const hasDefect = appearance?.result === 'fail' || (physical && physical.hardnessResult === 'fail')
    const appearanceDefectHandled = appearance && appearance.result === 'fail' &&
      defectHandlings.some(d => d.sourceType === 'appearance' && d.sourceRecordId === appearance.id)
    const physicalDefectHandled = physical && physical.hardnessResult === 'fail' &&
      defectHandlings.some(d => d.sourceType === 'physical' && d.sourceRecordId === physical.id)
    const allDefectsHandled = !hasDefect ||
      (appearance?.result === 'fail' ? appearanceDefectHandled : true) &&
      (physical && physical.hardnessResult === 'fail' ? physicalDefectHandled : true)

    if (appearance) {
      if (appearance.result === 'fail' && !appearanceDefectHandled) {
        return {
          type: 'warning',
          text: '警告：外观检验不合格，请登记异常处理结论',
        }
      }
      if (!physical && appearance.result === 'pass') {
        return {
          type: 'action',
          text: '下一步：前往物性抽检',
          buttons: [
            { label: '物性抽检', path: '/physical-inspection', color: 'bg-[#d97706] hover:bg-[#b45309]' },
          ],
        }
      }
    }

    if (physical && physical.hardnessResult === 'fail' && !physicalDefectHandled) {
      return {
        type: 'warning',
        text: '警告：物性抽检不合格，请登记异常处理结论',
      }
    }

    if (hasDefect && allDefectsHandled) {
      return {
        type: 'success',
        text: '异常处理已完成，批次已关闭',
      }
    }

    if (physical && physical.hardnessResult === 'pass') {
      return {
        type: 'success',
        text: '全部工序已完成！',
      }
    }

    return null
  }, [semiFinished, vulcanization, demolding, appearance, physical, defectHandlings])

  const getTimelineIconStyle = (status: TimelineStatus, key?: TimelineStep) => {
    if (key === 'finished' && status === 'running') {
      return 'bg-[#e85d26] text-white ring-4 ring-[#e85d26]/20'
    }
    switch (status) {
      case 'completed':
        return 'bg-[#2e8b57] text-white'
      case 'running':
        return 'bg-[#1e3a5f] text-white ring-4 ring-[#1e3a5f]/20'
      case 'skipped':
        return 'bg-[#e85d26] text-white'
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-400 border-2 border-gray-300'
    }
  }

  const getTimelineLineStyle = (status: TimelineStatus, isLast: boolean, key?: TimelineStep) => {
    if (isLast) return ''
    if (key === 'physical' && status === 'skipped') {
      return 'bg-[#e85d26]'
    }
    switch (status) {
      case 'completed':
      case 'running':
        return 'bg-[#2e8b57]'
      case 'skipped':
        return 'bg-[#e85d26]'
      case 'pending':
      default:
        return 'bg-gray-200 border-t-2 border-dashed border-gray-300'
    }
  }

  const getStatusBadge = (status: TimelineStatus) => {
    switch (status) {
      case 'completed':
        return <StatusBadge status="completed" text="已完成" />
      case 'running':
        return <StatusBadge status="running" text="进行中" />
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-orange-50 text-orange-700 border-orange-200">
            <Minus className="w-3 h-3" />
            已中止
          </span>
        )
      case 'pending':
      default:
        return <StatusBadge status="pending" text="待处理" />
    }
  }

  if (!semiFinished) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="p-6">
          <PageHeader
            title="批次详情"
            description="未找到对应批次"
            actions={
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回工作台
              </button>
            }
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">未找到该批次记录，请检查ID是否正确</p>
          </div>
        </div>
      </div>
    )
  }

  const passRate =
    demolding && demolding.qualifiedQty + demolding.defectiveQty > 0
      ? ((demolding.qualifiedQty / (demolding.qualifiedQty + demolding.defectiveQty)) * 100).toFixed(1)
      : null

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6 space-y-6">
        <PageHeader
          title={`批次详情：${semiFinished.batchNo}`}
          description={`${semiFinished.rubberType} · ${semiFinished.quantity}kg`}
          actions={
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#16304f] text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回工作台
            </button>
          }
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">批次流转时间轴</h3>
          <div className="relative">
            {timelineItems.map((item, idx) => {
              const Icon = item.icon
              const isLast = idx === timelineItems.length - 1
              const isRunning = item.status === 'running'
              const isDefectRunning = isRunning && item.key === 'finished'
              return (
                <div key={item.key} className="flex items-start gap-4 mb-6 last:mb-0">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${getTimelineIconStyle(
                        item.status,
                        item.key
                      )}`}
                    >
                      {item.status === 'completed' ? (
                        <Check className="w-5 h-5" />
                      ) : item.status === 'skipped' ? (
                        <Minus className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      {isRunning && (
                        <span
                          className={`absolute inline-flex h-11 w-11 rounded-full animate-ping ${
                            isDefectRunning ? 'bg-[#e85d26]/30' : 'bg-[#1e3a5f]/30'
                          }`}
                        />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-14 mt-2 ${getTimelineLineStyle(
                          item.status,
                          isLast,
                          item.key
                        )}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4
                        className={`text-base font-semibold ${
                          item.status === 'pending' ? 'text-gray-400' : 'text-gray-800'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {getStatusBadge(item.status)}
                    </div>
                    {(item.time || item.operator || item.summary) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {item.time && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {item.time}
                          </span>
                        )}
                        {item.operator && (
                          <span className="text-gray-500">
                            负责人：<span className="text-gray-700">{item.operator}</span>
                          </span>
                        )}
                        {item.summary && (
                          <span
                            className={`${
                              item.status === 'pending' ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {item.summary}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1e3a5f]" />
              半成品接收
            </h4>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500 mb-0.5">批次号</dt>
                <dd className="font-medium text-gray-800">{semiFinished.batchNo}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-0.5">胶种</dt>
                <dd className="font-medium text-gray-800">{semiFinished.rubberType}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-0.5">数量(kg)</dt>
                <dd className="font-medium text-gray-800">{semiFinished.quantity}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-0.5">接收人</dt>
                <dd className="font-medium text-gray-800">{semiFinished.receiver}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-0.5">接收日期</dt>
                <dd className="font-medium text-gray-800">{semiFinished.receiveDate}</dd>
              </div>
              {semiFinished.remark && (
                <div className="col-span-2">
                  <dt className="text-gray-500 mb-0.5">备注</dt>
                  <dd className="font-medium text-gray-800">{semiFinished.remark}</dd>
                </div>
              )}
            </dl>
          </div>

          {!vulcanization ? (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 flex flex-col items-center justify-center">
              <Flame className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">等待上一步完成</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                {vulcanizationType === 'plate' ? (
                  <Flame className="w-5 h-5 text-[#e85d26]" />
                ) : (
                  <Container className="w-5 h-5 text-[#0891b2]" />
                )}
                {vulcanizationType === 'plate' ? '平板硫化' : '罐式硫化'}
                <span className="ml-1">
                  {vulcanizationType === 'plate' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                      平板
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700">
                      罐式
                    </span>
                  )}
                </span>
                <span className="ml-auto">
                  <StatusBadge status={vulcanization.status} />
                </span>
              </h4>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {vulcanizationType === 'plate' && mold && (
                  <div>
                    <dt className="text-gray-500 mb-0.5">模具号</dt>
                    <dd className="font-medium text-gray-800">{mold.moldNo}</dd>
                  </div>
                )}
                {vulcanizationType === 'plate' ? (
                  <div>
                    <dt className="text-gray-500 mb-0.5">硫化压力(MPa)</dt>
                    <dd className="font-medium text-gray-800">
                      {(vulcanization as PlateVulcanization).pressure}
                    </dd>
                  </div>
                ) : (
                  <div>
                    <dt className="text-gray-500 mb-0.5">蒸汽压(MPa)</dt>
                    <dd className="font-medium text-gray-800">
                      {(vulcanization as TankVulcanization).steamPressure}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500 mb-0.5">温度(℃)</dt>
                  <dd className="font-medium text-gray-800">{vulcanization.temperature}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">时长(min)</dt>
                  <dd className="font-medium text-gray-800">{vulcanization.duration}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">操作工</dt>
                  <dd className="font-medium text-gray-800">{vulcanization.operator}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">开始时间</dt>
                  <dd className="font-medium text-gray-800">{vulcanization.startTime}</dd>
                </div>
                {vulcanization.endTime && (
                  <div>
                    <dt className="text-gray-500 mb-0.5">结束时间</dt>
                    <dd className="font-medium text-gray-800">{vulcanization.endTime}</dd>
                  </div>
                )}
              </dl>
              {vulcanizationType === 'plate' &&
                (vulcanization as PlateVulcanization).temperatureCurve &&
                (vulcanization as PlateVulcanization).temperatureCurve.length > 0 && (
                  <div className="mt-4">
                    <dt className="text-gray-500 mb-2 text-xs">温度曲线</dt>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(vulcanization as PlateVulcanization).temperatureCurve}
                          margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            stroke="#e5e7eb"
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            stroke="#e5e7eb"
                            domain={['dataMin - 5', 'dataMax + 5']}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#e85d26"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
            </div>
          )}

          {!demolding ? (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 flex flex-col items-center justify-center">
              <Scissors className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">等待上一步完成</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#db2777]" />
                脱模修边
              </h4>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500 mb-0.5">产品编号</dt>
                  <dd className="font-medium text-gray-800">{demolding.productNo}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">合格品</dt>
                  <dd className="font-medium text-[#2e8b57]">{demolding.qualifiedQty}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">废品</dt>
                  <dd className="font-medium text-red-500">{demolding.defectiveQty}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">合格率</dt>
                  <dd
                    className={`font-medium ${
                      passRate && Number(passRate) < 90 ? 'text-red-500' : 'text-[#2e8b57]'
                    }`}
                  >
                    {passRate ? `${passRate}%` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">操作工</dt>
                  <dd className="font-medium text-gray-800">{demolding.operator}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">记录时间</dt>
                  <dd className="font-medium text-gray-800">{demolding.createTime}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500 mb-0.5">毛边修整记录</dt>
                  <dd className="font-medium text-gray-800">{demolding.trimmingRecord}</dd>
                </div>
              </dl>
            </div>
          )}

          {!appearance ? (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 flex flex-col items-center justify-center">
              <Eye className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">等待上一步完成</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#059669]" />
                外观检验
                <span className="ml-auto">
                  <StatusBadge status={appearance.result} />
                </span>
              </h4>
              <dl className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500 mb-0.5">气泡检查</dt>
                  <dd className="font-medium text-gray-800">{appearance.bubbleDefect}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">缺胶检查</dt>
                  <dd className="font-medium text-gray-800">{appearance.lackGlueDefect}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">尺寸检查</dt>
                  <dd className="font-medium text-gray-800">{appearance.dimensionCheck}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <dt className="text-gray-500 mb-0.5">质检员</dt>
                    <dd className="font-medium text-gray-800">{appearance.inspector}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 mb-0.5">检验时间</dt>
                    <dd className="font-medium text-gray-800">{appearance.inspectTime}</dd>
                  </div>
                </div>
              </dl>
            </div>
          )}

          {appearance?.result === 'fail' ? (
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-5 flex flex-col items-center justify-center text-center">
              <Minus className="w-10 h-10 text-[#e85d26] mb-2" />
              <p className="text-sm text-[#e85d26] font-medium">外观不合格，已中止</p>
              <p className="text-xs text-orange-600 mt-1">无需进行物性抽检</p>
            </div>
          ) : !physical ? (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 flex flex-col items-center justify-center">
              <Microscope className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">等待上一步完成</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2">
              <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-[#d97706]" />
                物性抽检
              </h4>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 mb-0.5">邵氏硬度</dt>
                  <dd className="font-medium text-gray-800 text-lg">{physical.hardness}°</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">硬度判定</dt>
                  <dd className="font-medium pt-1">
                    <StatusBadge status={physical.hardnessResult} />
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500 mb-0.5">老化试验条件</dt>
                  <dd className="font-medium text-gray-800">{physical.agingTestCondition}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500 mb-0.5">老化试验结果</dt>
                  <dd className="font-medium text-gray-800">{physical.agingTestResult}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">质检员</dt>
                  <dd className="font-medium text-gray-800">{physical.inspector}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-0.5">检验时间</dt>
                  <dd className="font-medium text-gray-800">{physical.inspectTime}</dd>
                </div>
              </dl>
            </div>
          )}

          {(() => {
            const hasDefect = appearance?.result === 'fail' || (physical && physical.hardnessResult === 'fail')
            const appearanceHandling = appearance && appearance.result === 'fail'
              ? defectHandlings.find(d => d.sourceType === 'appearance' && d.sourceRecordId === appearance.id)
              : undefined
            const physicalHandling = physical && physical.hardnessResult === 'fail'
              ? defectHandlings.find(d => d.sourceType === 'physical' && d.sourceRecordId === physical.id)
              : undefined

            if (!hasDefect) {
              return (
                <div className="md:col-span-2 bg-emerald-50 rounded-xl border border-emerald-200 p-5 flex flex-col items-center justify-center">
                  <ThumbsUp className="w-10 h-10 text-[#2e8b57] mb-2" />
                  <p className="text-sm text-[#2e8b57] font-medium">本批次无不合格项，流程正常</p>
                </div>
              )
            }

            const handleSubmit = (sourceType: 'appearance' | 'physical', sourceRecordId: string) => {
              if (!conclusion.trim() || !handler.trim()) return
              store.addDefectHandling({
                id: '',
                batchId: semiFinishedId,
                sourceType,
                sourceRecordId,
                handlingType,
                conclusion,
                handler,
                createTime: new Date().toLocaleString('zh-CN'),
              })
              setConclusion('')
              setHandler('')
              setEditingSourceType(null)
            }

            const handleReEdit = (sourceType: 'appearance' | 'physical', record: DefectHandlingRecord) => {
              setHandlingType(record.handlingType)
              setConclusion(record.conclusion)
              setHandler(record.handler)
              setEditingSourceType(sourceType)
            }

            const getHandlingTypeLabel = (type: 'rework' | 'scrap' | 'concession') => {
              switch (type) {
                case 'rework': return '返工'
                case 'scrap': return '报废'
                case 'concession': return '让步接收'
              }
            }

            const getHandlingTypeColor = (type: 'rework' | 'scrap' | 'concession') => {
              switch (type) {
                case 'rework': return 'bg-blue-100 text-blue-700 border-blue-200'
                case 'scrap': return 'bg-red-100 text-red-700 border-red-200'
                case 'concession': return 'bg-amber-100 text-amber-700 border-amber-200'
              }
            }

            const renderDefectItem = (
              sourceType: 'appearance' | 'physical',
              sourceRecordId: string,
              sourceName: string,
              handling: DefectHandlingRecord | undefined
            ) => {
              const isEditing = editingSourceType === sourceType

              if (handling && !isEditing) {
                return (
                  <div key={sourceType} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-[#e85d26]" />
                        <span className="font-medium text-gray-800">{sourceName}</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getHandlingTypeColor(handling.handlingType)}`}>
                        {getHandlingTypeLabel(handling.handlingType)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">处理结论：</span>
                        <span className="text-gray-800">{handling.conclusion}</span>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-gray-500">处理人：</span>
                          <span className="text-gray-800">{handling.handler}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">处理时间：</span>
                          <span className="text-gray-800">{handling.createTime}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReEdit(sourceType, handling)}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-[#1e3a5f] hover:text-[#16304f] font-medium transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      重新登记
                    </button>
                  </div>
                )
              }

              return (
                <div key={sourceType} className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-[#e85d26]" />
                    <span className="font-medium text-[#e85d26]">{sourceName} - 异常处理登记</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">不合格来源</label>
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">
                        {sourceName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">处理方式</label>
                      <select
                        value={isEditing ? handlingType : 'rework'}
                        onChange={(e) => setHandlingType(e.target.value as 'rework' | 'scrap' | 'concession')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e85d26]/30 focus:border-[#e85d26]"
                      >
                        <option value="rework">返工</option>
                        <option value="scrap">报废</option>
                        <option value="concession">让步接收</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">处理结论</label>
                      <textarea
                        value={isEditing ? conclusion : ''}
                        onChange={(e) => setConclusion(e.target.value)}
                        rows={3}
                        placeholder="请输入处理结论说明"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e85d26]/30 focus:border-[#e85d26] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">处理人</label>
                      <input
                        type="text"
                        value={isEditing ? handler : ''}
                        onChange={(e) => setHandler(e.target.value)}
                        placeholder="请输入处理人姓名"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e85d26]/30 focus:border-[#e85d26]"
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(sourceType, sourceRecordId)}
                      disabled={!conclusion.trim() || !handler.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#e85d26] hover:bg-[#d14a1a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      提交处理
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#e85d26]" />
                  不合格处理
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appearance?.result === 'fail' && appearance.id && renderDefectItem('appearance', appearance.id, '外观检验', appearanceHandling)}
                  {physical && physical.hardnessResult === 'fail' && physical.id && renderDefectItem('physical', physical.id, '物性抽检', physicalHandling)}
                </div>
              </div>
            )
          })()}
        </div>

        {nextAction && (
          <div
            className={`rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              nextAction.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200'
                : nextAction.type === 'warning'
                ? 'bg-orange-50 border border-orange-200'
                : nextAction.type === 'info'
                ? 'bg-gray-50 border border-gray-200'
                : 'bg-[#1e3a5f] border border-[#1e3a5f]'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                nextAction.type === 'success'
                  ? 'text-emerald-700'
                  : nextAction.type === 'warning'
                  ? 'text-orange-700'
                  : nextAction.type === 'info'
                  ? 'text-gray-600'
                  : 'text-white'
              }`}
            >
              {nextAction.text}
            </p>
            {'buttons' in nextAction && nextAction.buttons && (
              <div className="flex flex-wrap items-center gap-2">
                {nextAction.buttons.map((btn) => (
                  <button
                    key={btn.path}
                    onClick={() => navigate(btn.path)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${btn.color}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
