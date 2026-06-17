import { useState, useMemo } from 'react'
import { Microscope, Plus, Activity, Gauge, Save, X, CheckCircle2, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import PageHeader from '@/components/Form/PageHeader'
import DataTable, { type Column } from '@/components/Table/DataTable'
import StatCard from '@/components/Card/StatCard'
import StatusBadge from '@/components/Card/StatusBadge'
import { useVulcanizationStore } from '@/store'
import type { PhysicalInspection, AppearanceInspection } from '@/types'

interface FormState {
  appearanceId: string
  hardness: string
  hardnessResult: 'pass' | 'fail'
  agingTestCondition: string
  agingTestResult: string
  inspector: string
}

const initialFormState: FormState = {
  appearanceId: '',
  hardness: '',
  hardnessResult: 'pass',
  agingTestCondition: '',
  agingTestResult: '',
  inspector: '',
}

const HARDNESS_MIN = 60
const HARDNESS_MAX = 75

export default function PhysicalInspectionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const physicalInspection = useVulcanizationStore((state) => state.physicalInspection)
  const appearanceInspection = useVulcanizationStore((state) => state.appearanceInspection)
  const demolding = useVulcanizationStore((state) => state.demolding)
  const addPhysicalInspection = useVulcanizationStore((state) => state.addPhysicalInspection)
  const getAppearanceForPhysical = useVulcanizationStore((state) => state.getAppearanceForPhysical)

  const today = new Date().toLocaleDateString('zh-CN')

  const todayRecords = useMemo(() => {
    return physicalInspection.filter((item) => {
      const itemDate = new Date(item.inspectTime).toLocaleDateString('zh-CN')
      return itemDate === today
    })
  }, [physicalInspection, today])

  const todayCount = todayRecords.length
  const hardnessPassCount = todayRecords.filter((item) => item.hardnessResult === 'pass').length
  const agingTestCompletedCount = todayRecords.filter((item) => item.agingTestResult.trim() !== '').length

  const getProductNoByAppearanceId = (appearanceId: string): string => {
    const appearance = appearanceInspection.find((a) => a.id === appearanceId)
    if (!appearance) return '-'
    const demold = demolding.find((d) => d.id === appearance.demoldingId)
    return demold?.productNo || '-'
  }

  const getAppearanceLabel = (appearance: AppearanceInspection) => {
    const demold = demolding.find((d) => d.id === appearance.demoldingId)
    const productNo = demold?.productNo || '-'
    return `[${productNo}] 外观检验于 ${appearance.inspectTime}`
  }

  const hardnessChartData = useMemo(() => {
    return physicalInspection.slice(0, 10).reverse().map((item, index) => ({
      name: `#${index + 1}`,
      hardness: item.hardness,
      time: item.inspectTime,
    }))
  }, [physicalInspection])

  const isHardnessOutOfRange = (value: number) => value < HARDNESS_MIN || value > HARDNESS_MAX

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => {
      if (field === 'hardnessResult') {
        return { ...prev, hardnessResult: value as 'pass' | 'fail' }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleHardnessChange = (value: string) => {
    const numValue = Number(value)
    let result: 'pass' | 'fail' = 'pass'
    if (value !== '' && !isNaN(numValue)) {
      result = isHardnessOutOfRange(numValue) ? 'fail' : 'pass'
    }
    setFormState((prev) => ({ ...prev, hardness: value, hardnessResult: result }))
  }

  const handleSubmit = () => {
    if (!formState.appearanceId || !formState.hardness || !formState.inspector) {
      alert('请填写必填项')
      return
    }

    const hardnessNum = Number(formState.hardness)
    if (isNaN(hardnessNum)) {
      alert('请输入有效的硬度值')
      return
    }

    const newRecord: PhysicalInspection = {
      id: '',
      appearanceId: formState.appearanceId,
      hardness: hardnessNum,
      hardnessResult: isHardnessOutOfRange(hardnessNum) ? 'fail' : formState.hardnessResult,
      agingTestCondition: formState.agingTestCondition,
      agingTestResult: formState.agingTestResult,
      inspector: formState.inspector,
      inspectTime: new Date().toLocaleString('zh-CN'),
    }

    addPhysicalInspection(newRecord)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const columns: Column<PhysicalInspection>[] = [
    {
      key: 'productNo',
      title: '产品编号',
      width: '180px',
      render: (row) => getProductNoByAppearanceId(row.appearanceId),
    },
    {
      key: 'hardness',
      title: '邵氏硬度',
      width: '120px',
      align: 'center',
      render: (row) => (
        <span className={`font-semibold ${isHardnessOutOfRange(row.hardness) ? 'text-red-600' : 'text-gray-800'}`}>
          {row.hardness}
        </span>
      ),
    },
    {
      key: 'hardnessResult',
      title: '硬度判定',
      width: '120px',
      align: 'center',
      render: (row) => <StatusBadge status={row.hardnessResult} />,
    },
    {
      key: 'agingTestCondition',
      title: '老化试验条件',
      width: '200px',
      render: (row) => (
        <div className="truncate max-w-xs" title={row.agingTestCondition}>
          {row.agingTestCondition || '-'}
        </div>
      ),
    },
    {
      key: 'agingTestResult',
      title: '老化试验结果',
      width: '250px',
      render: (row) => (
        <div className="truncate max-w-xs" title={row.agingTestResult}>
          {row.agingTestResult || '-'}
        </div>
      ),
    },
    { key: 'inspector', title: '质检员', width: '100px', align: 'center' },
    { key: 'inspectTime', title: '检验时间', width: '180px', align: 'center' },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6">
        <PageHeader
          title="物性抽检"
          description="管理橡胶制品的物性抽检工作，包括邵氏硬度检测、老化试验等物理性能检验记录"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors border border-indigo-700"
            >
              <Plus className="w-4 h-4" />
              新增物性抽检
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <StatCard
            title="今日抽检数"
            value={todayCount}
            unit="批"
            icon={Microscope}
            color="blue"
          />
          <StatCard
            title="硬度合格数"
            value={hardnessPassCount}
            unit="批"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="老化试验完成数"
            value={agingTestCompletedCount}
            unit="批"
            icon={Activity}
            color="purple"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-800">硬度抽检趋势</h3>
            <span className="text-xs text-gray-500 ml-2">（合格范围：{HARDNESS_MIN} - {HARDNESS_MAX}）</span>
          </div>
          <div className="h-72">
            {hardnessChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hardnessChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis
                    domain={[Math.min(HARDNESS_MIN - 10, ...hardnessChartData.map((d) => d.hardness) as number[]), Math.max(HARDNESS_MAX + 10, ...hardnessChartData.map((d) => d.hardness) as number[])]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} 度`, '邵氏硬度']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <ReferenceLine
                    y={HARDNESS_MIN}
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ value: '下限 60', position: 'right', fill: '#10b981', fontSize: 11 }}
                  />
                  <ReferenceLine
                    y={HARDNESS_MAX}
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ value: '上限 75', position: 'right', fill: '#10b981', fontSize: 11 }}
                  />
                  <Bar dataKey="hardness" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {hardnessChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={isHardnessOutOfRange(entry.hardness) ? '#ef4444' : '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无硬度抽检数据
              </div>
            )}
          </div>
        </div>

        <DataTable columns={columns} data={physicalInspection} emptyText="暂无物性抽检记录" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-800 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">新增物性抽检</h3>
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
                    外观检验记录 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.appearanceId}
                    onChange={(e) => handleInputChange('appearanceId', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">请选择外观检验记录</option>
                    {getAppearanceForPhysical().map((item) => (
                      <option key={item.id} value={item.id}>
                        {getAppearanceLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    邵氏硬度值 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.hardness}
                    onChange={(e) => handleHardnessChange(e.target.value)}
                    placeholder="请输入邵氏硬度值"
                    min="0"
                    max="100"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">合格范围：{HARDNESS_MIN} - {HARDNESS_MAX}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    硬度判定 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4 pt-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <CheckCircle2 className={`w-5 h-5 ${formState.hardnessResult === 'pass' ? 'text-emerald-500' : 'text-gray-400'}`} />
                      <input
                        type="radio"
                        name="hardnessResult"
                        value="pass"
                        checked={formState.hardnessResult === 'pass'}
                        onChange={(e) => handleInputChange('hardnessResult', e.target.value)}
                        className="sr-only"
                      />
                      <span className={`text-sm ${formState.hardnessResult === 'pass' ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>
                        合格
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <XCircle className={`w-5 h-5 ${formState.hardnessResult === 'fail' ? 'text-red-500' : 'text-gray-400'}`} />
                      <input
                        type="radio"
                        name="hardnessResult"
                        value="fail"
                        checked={formState.hardnessResult === 'fail'}
                        onChange={(e) => handleInputChange('hardnessResult', e.target.value)}
                        className="sr-only"
                      />
                      <span className={`text-sm ${formState.hardnessResult === 'fail' ? 'text-red-700 font-medium' : 'text-gray-600'}`}>
                        不合格
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    老化试验条件
                  </label>
                  <input
                    type="text"
                    value={formState.agingTestCondition}
                    onChange={(e) => handleInputChange('agingTestCondition', e.target.value)}
                    placeholder="如：100℃×72h热空气老化"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    质检员 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.inspector}
                    onChange={(e) => handleInputChange('inspector', e.target.value)}
                    placeholder="请输入质检员姓名"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  老化试验结果
                </label>
                <textarea
                  value={formState.agingTestResult}
                  onChange={(e) => handleInputChange('agingTestResult', e.target.value)}
                  placeholder="请输入老化试验结果（选填）"
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none"
                />
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
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors border border-indigo-700"
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
