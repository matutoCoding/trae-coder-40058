import { useState, useMemo } from 'react'
import { Scissors, Plus, CheckCircle2, XCircle, Percent, Save, X } from 'lucide-react'
import PageHeader from '../../components/Form/PageHeader'
import DataTable, { type Column } from '../../components/Table/DataTable'
import StatCard from '../../components/Card/StatCard'
import { useVulcanizationStore } from '../../store'
import type { Demolding, PlateVulcanization, TankVulcanization } from '../../types'

const VULCANIZATION_TYPE_OPTIONS = [
  { value: 'plate', label: '平板硫化' },
  { value: 'tank', label: '罐式硫化' },
]

interface FormState {
  vulcanizationType: 'plate' | 'tank'
  vulcanizationId: string
  productNo: string
  qualifiedQty: string
  defectiveQty: string
  trimmingRecord: string
  operator: string
}

const initialFormState: FormState = {
  vulcanizationType: 'plate',
  vulcanizationId: '',
  productNo: '',
  qualifiedQty: '',
  defectiveQty: '',
  trimmingRecord: '',
  operator: '',
}

export default function DemoldingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const demolding = useVulcanizationStore((state) => state.demolding)
  const plateVulcanization = useVulcanizationStore((state) => state.plateVulcanization)
  const tankVulcanization = useVulcanizationStore((state) => state.tankVulcanization)
  const addDemolding = useVulcanizationStore((state) => state.addDemolding)

  const today = new Date().toLocaleDateString('zh-CN')

  const todayRecords = useMemo(() => {
    return demolding.filter((item) => {
      const itemDate = new Date(item.createTime).toLocaleDateString('zh-CN')
      return itemDate === today
    })
  }, [demolding, today])

  const totalCount = todayRecords.length
  const totalQualified = todayRecords.reduce((sum, item) => sum + item.qualifiedQty, 0)
  const totalDefective = todayRecords.reduce((sum, item) => sum + item.defectiveQty, 0)
  const passRate = totalQualified + totalDefective > 0
    ? ((totalQualified / (totalQualified + totalDefective)) * 100).toFixed(1)
    : '0.0'

  const completedPlateRecords = useMemo(() => {
    return plateVulcanization.filter((item) => item.status === 'completed')
  }, [plateVulcanization])

  const completedTankRecords = useMemo(() => {
    return tankVulcanization.filter((item) => item.status === 'completed')
  }, [tankVulcanization])

  const currentVulcanizationRecords = useMemo(() => {
    return formState.vulcanizationType === 'plate'
      ? completedPlateRecords
      : completedTankRecords
  }, [formState.vulcanizationType, completedPlateRecords, completedTankRecords])

  const getVulcanizationLabel = (record: PlateVulcanization | TankVulcanization) => {
    return `${record.id} - ${record.startTime}`
  }

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => {
      if (field === 'vulcanizationType') {
        return { ...prev, vulcanizationType: value as 'plate' | 'tank', vulcanizationId: '' }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleSubmit = () => {
    if (!formState.vulcanizationId || !formState.productNo || !formState.qualifiedQty || !formState.defectiveQty || !formState.operator) {
      alert('请填写必填项')
      return
    }

    const newRecord: Demolding = {
      id: '',
      vulcanizationId: formState.vulcanizationId,
      vulcanizationType: formState.vulcanizationType,
      productNo: formState.productNo,
      qualifiedQty: Number(formState.qualifiedQty),
      defectiveQty: Number(formState.defectiveQty),
      trimmingRecord: formState.trimmingRecord,
      operator: formState.operator,
      createTime: new Date().toLocaleString('zh-CN'),
    }

    addDemolding(newRecord)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const calculatePassRate = (qualified: number, defective: number) => {
    const total = qualified + defective
    if (total === 0) return 0
    return (qualified / total) * 100
  }

  const columns: Column<Demolding>[] = [
    { key: 'productNo', title: '产品编号', width: '180px' },
    {
      key: 'vulcanizationType',
      title: '硫化类型',
      width: '120px',
      align: 'center',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.vulcanizationType === 'plate' ? '平板' : '罐式'}
        </span>
      ),
    },
    { key: 'qualifiedQty', title: '合格品', width: '100px', align: 'right' },
    { key: 'defectiveQty', title: '废品', width: '100px', align: 'right' },
    {
      key: 'passRate',
      title: '合格率',
      width: '120px',
      align: 'center',
      render: (row) => {
        const rate = calculatePassRate(row.qualifiedQty, row.defectiveQty)
        const isLow = rate < 90
        return (
          <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
            {rate.toFixed(1)}%
          </span>
        )
      },
    },
    {
      key: 'trimmingRecord',
      title: '毛边修整记录',
      width: '250px',
      render: (row) => (
        <div className="truncate max-w-xs" title={row.trimmingRecord}>
          {row.trimmingRecord}
        </div>
      ),
    },
    { key: 'operator', title: '操作工', width: '100px', align: 'center' },
    { key: 'createTime', title: '记录时间', width: '180px', align: 'center' },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6">
        <PageHeader
          title="脱模修边"
          description="管理橡胶制品的脱模与毛边修整工序，记录产品合格情况与修整信息"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition-colors border border-amber-700"
            >
              <Plus className="w-4 h-4" />
              新增脱模记录
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            title="今日脱模总数"
            value={totalCount}
            unit="批"
            icon={Scissors}
            color="blue"
          />
          <StatCard
            title="合格品数"
            value={totalQualified}
            unit="件"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="废品数"
            value={totalDefective}
            unit="件"
            icon={XCircle}
            color="orange"
          />
          <StatCard
            title="合格率"
            value={passRate}
            unit="%"
            icon={Percent}
            color={Number(passRate) >= 90 ? 'green' : 'orange'}
          />
        </div>

        <DataTable columns={columns} data={demolding} emptyText="暂无脱模修边记录" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-800 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">新增脱模记录</h3>
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
                    硫化类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.vulcanizationType}
                    onChange={(e) => handleInputChange('vulcanizationType', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    {VULCANIZATION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    硫化记录 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.vulcanizationId}
                    onChange={(e) => handleInputChange('vulcanizationId', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="">请选择硫化记录</option>
                    {currentVulcanizationRecords.map((record) => (
                      <option key={record.id} value={record.id}>
                        {getVulcanizationLabel(record)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    产品编号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.productNo}
                    onChange={(e) => handleInputChange('productNo', e.target.value)}
                    placeholder="如：CP-20260617-001"
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    合格品数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.qualifiedQty}
                    onChange={(e) => handleInputChange('qualifiedQty', e.target.value)}
                    placeholder="请输入合格品数量"
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    废品数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.defectiveQty}
                    onChange={(e) => handleInputChange('defectiveQty', e.target.value)}
                    placeholder="请输入废品数量"
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  毛边修整记录
                </label>
                <textarea
                  value={formState.trimmingRecord}
                  onChange={(e) => handleInputChange('trimmingRecord', e.target.value)}
                  placeholder="请输入毛边修整记录（选填）"
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white resize-none"
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
