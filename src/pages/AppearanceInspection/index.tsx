import { useState, useMemo } from 'react'
import { Eye, Plus, CheckCircle2, XCircle, Save, X, AlertCircle } from 'lucide-react'
import PageHeader from '../../components/Form/PageHeader'
import DataTable, { type Column } from '../../components/Table/DataTable'
import StatCard from '../../components/Card/StatCard'
import StatusBadge from '../../components/Card/StatusBadge'
import { useVulcanizationStore } from '../../store'
import type { AppearanceInspection, Demolding } from '../../types'

const RESULT_OPTIONS = [
  { value: 'pass', label: '合格' },
  { value: 'fail', label: '不合格' },
]

interface FormState {
  demoldingId: string
  bubbleDefect: string
  lackGlueDefect: string
  dimensionCheck: string
  result: 'pass' | 'fail'
  inspector: string
}

const initialFormState: FormState = {
  demoldingId: '',
  bubbleDefect: '',
  lackGlueDefect: '',
  dimensionCheck: '',
  result: 'pass',
  inspector: '',
}

export default function AppearanceInspectionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const appearanceInspection = useVulcanizationStore((state) => state.appearanceInspection)
  const demolding = useVulcanizationStore((state) => state.demolding)
  const addAppearanceInspection = useVulcanizationStore((state) => state.addAppearanceInspection)

  const today = new Date().toLocaleDateString('zh-CN')

  const todayRecords = useMemo(() => {
    return appearanceInspection.filter((item) => {
      const itemDate = new Date(item.inspectTime).toLocaleDateString('zh-CN')
      return itemDate === today
    })
  }, [appearanceInspection, today])

  const totalCount = todayRecords.length
  const passCount = todayRecords.filter((item) => item.result === 'pass').length
  const failCount = todayRecords.filter((item) => item.result === 'fail').length
  const passRate = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : '0.0'

  const getDemoldingById = (id: string): Demolding | undefined => {
    return demolding.find((d) => d.id === id)
  }

  const getDemoldingLabel = (record: Demolding) => {
    return `${record.productNo} - ${record.createTime}`
  }

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formState.demoldingId || !formState.inspector) {
      alert('请填写必填项')
      return
    }

    const newRecord: AppearanceInspection = {
      id: '',
      demoldingId: formState.demoldingId,
      bubbleDefect: formState.bubbleDefect,
      lackGlueDefect: formState.lackGlueDefect,
      dimensionCheck: formState.dimensionCheck,
      result: formState.result,
      inspector: formState.inspector,
      inspectTime: new Date().toLocaleString('zh-CN'),
    }

    addAppearanceInspection(newRecord)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const getProductTooltip = (row: AppearanceInspection) => {
    const d = getDemoldingById(row.demoldingId)
    if (!d) return '暂无关联产品信息'
    return `产品编号：${d.productNo}\n硫化类型：${d.vulcanizationType === 'plate' ? '平板硫化' : '罐式硫化'}\n合格品：${d.qualifiedQty}件\n废品：${d.defectiveQty}件\n操作工：${d.operator}\n记录时间：${d.createTime}`
  }

  const columns: Column<AppearanceInspection>[] = [
    {
      key: 'demoldingId',
      title: '产品编号',
      width: '180px',
      render: (row) => {
        const d = getDemoldingById(row.demoldingId)
        return (
          <div className="group relative inline-flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-blue-500" />
            <span
              className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-medium"
              title={getProductTooltip(row)}
            >
              {d?.productNo || row.demoldingId}
            </span>
          </div>
        )
      },
    },
    {
      key: 'bubbleDefect',
      title: '气泡检查',
      width: '200px',
      render: (row) => (
        <div className="truncate max-w-[180px]" title={row.bubbleDefect}>
          {row.bubbleDefect}
        </div>
      ),
    },
    {
      key: 'lackGlueDefect',
      title: '缺胶检查',
      width: '200px',
      render: (row) => (
        <div className="truncate max-w-[180px]" title={row.lackGlueDefect}>
          {row.lackGlueDefect}
        </div>
      ),
    },
    {
      key: 'dimensionCheck',
      title: '尺寸检查',
      width: '200px',
      render: (row) => (
        <div className="truncate max-w-[180px]" title={row.dimensionCheck}>
          {row.dimensionCheck}
        </div>
      ),
    },
    {
      key: 'result',
      title: '检验结果',
      width: '100px',
      align: 'center',
      render: (row) => <StatusBadge status={row.result} />,
    },
    { key: 'inspector', title: '质检员', width: '100px', align: 'center' },
    { key: 'inspectTime', title: '检验时间', width: '180px', align: 'center' },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6">
        <PageHeader
          title="外观检验"
          description="管理橡胶制品的外观质量检验，记录气泡、缺胶、尺寸等缺陷情况及检验结果"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors border border-emerald-700"
            >
              <Plus className="w-4 h-4" />
              新增外观检验
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            title="今日检验数"
            value={totalCount}
            unit="件"
            icon={Eye}
            color="blue"
          />
          <StatCard
            title="合格数"
            value={passCount}
            unit="件"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="不合格数"
            value={failCount}
            unit="件"
            icon={XCircle}
            color="orange"
          />
          <StatCard
            title="合格率"
            value={passRate}
            unit="%"
            icon={AlertCircle}
            color={Number(passRate) >= 90 ? 'green' : 'orange'}
          />
        </div>

        <DataTable columns={columns} data={appearanceInspection} emptyText="暂无外观检验记录" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-800 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">新增外观检验</h3>
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
                    脱模记录 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.demoldingId}
                    onChange={(e) => handleInputChange('demoldingId', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">请选择脱模记录</option>
                    {demolding.map((record) => (
                      <option key={record.id} value={record.id}>
                        {getDemoldingLabel(record)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    检验结果 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.result}
                    onChange={(e) => handleInputChange('result', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    {RESULT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  气泡缺陷记录
                </label>
                <textarea
                  value={formState.bubbleDefect}
                  onChange={(e) => handleInputChange('bubbleDefect', e.target.value)}
                  placeholder="请输入气泡缺陷检查记录（选填）"
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  缺胶缺陷记录
                </label>
                <textarea
                  value={formState.lackGlueDefect}
                  onChange={(e) => handleInputChange('lackGlueDefect', e.target.value)}
                  placeholder="请输入缺胶缺陷检查记录（选填）"
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  尺寸符合性记录
                </label>
                <textarea
                  value={formState.dimensionCheck}
                  onChange={(e) => handleInputChange('dimensionCheck', e.target.value)}
                  placeholder="请输入尺寸符合性检查记录（选填）"
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white resize-none"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors border border-emerald-700"
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
