import { useState } from 'react'
import { Plus, Save, X, Play, RotateCcw, AlertOctagon, CheckCircle2, Clock, Wrench } from 'lucide-react'
import PageHeader from '../../components/Form/PageHeader'
import DataTable, { type Column } from '../../components/Table/DataTable'
import StatusBadge from '../../components/Card/StatusBadge'
import StatCard from '../../components/Card/StatCard'
import { useVulcanizationStore } from '../../store'
import type { Mold } from '../../types'

const STATUS_OPTIONS = [
  { value: 'available', label: '可用' },
  { value: 'in-use', label: '使用中' },
  { value: 'maintenance', label: '维修中' },
]

interface FormState {
  moldNo: string
  productName: string
  preheatTemp: string
  preheatTime: string
  status: Mold['status']
  operator: string
}

const initialFormState: FormState = {
  moldNo: '',
  productName: '',
  preheatTemp: '',
  preheatTime: '',
  status: 'available',
  operator: '',
}

export default function MoldPrepPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const molds = useVulcanizationStore((state) => state.molds)
  const addMold = useVulcanizationStore((state) => state.addMold)
  const updateMoldStatus = useVulcanizationStore((state) => state.updateMoldStatus)

  const availableCount = molds.filter((m) => m.status === 'available').length
  const inUseCount = molds.filter((m) => m.status === 'in-use').length
  const maintenanceCount = molds.filter((m) => m.status === 'maintenance').length

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formState.moldNo || !formState.productName || !formState.preheatTemp || !formState.preheatTime || !formState.operator) {
      alert('请填写必填项')
      return
    }

    const newMold: Mold = {
      id: '',
      moldNo: formState.moldNo,
      productName: formState.productName,
      preheatTemp: Number(formState.preheatTemp),
      preheatTime: Number(formState.preheatTime),
      status: formState.status,
      operator: formState.operator,
      lastUsedTime: undefined,
    }

    addMold(newMold)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleUse = (mold: Mold) => {
    if (mold.status === 'available') {
      updateMoldStatus(mold.id, 'in-use', mold.operator)
    }
  }

  const handleReturn = (mold: Mold) => {
    if (mold.status === 'in-use') {
      updateMoldStatus(mold.id, 'available', mold.operator)
    }
  }

  const handleMaintenance = (mold: Mold) => {
    if (mold.status !== 'maintenance') {
      updateMoldStatus(mold.id, 'maintenance', mold.operator)
    }
  }

  const columns: Column<Mold>[] = [
    { key: 'moldNo', title: '模具编号', width: '140px' },
    { key: 'productName', title: '产品名称', width: '180px' },
    { key: 'preheatTemp', title: '预热温度(℃)', width: '130px', align: 'right' },
    { key: 'preheatTime', title: '预热时间(min)', width: '130px', align: 'right' },
    {
      key: 'status',
      title: '状态',
      width: '120px',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'operator', title: '操作人', width: '120px', align: 'center' },
    { key: 'lastUsedTime', title: '最近使用时间', width: '180px', align: 'center' },
    {
      key: 'actions',
      title: '操作',
      width: '240px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleUse(row)}
            disabled={row.status !== 'available'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" />
            领用
          </button>
          <button
            onClick={() => handleReturn(row)}
            disabled={row.status !== 'in-use'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            归还
          </button>
          <button
            onClick={() => handleMaintenance(row)}
            disabled={row.status === 'maintenance'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            维修
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6">
        <PageHeader
          title="模具准备"
          description="管理硫化车间模具信息，包括模具登记、领用、归还及维修状态跟踪"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition-colors border border-amber-700"
            >
              <Plus className="w-4 h-4" />
              新增模具
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <StatCard
            title="可用模具数"
            value={availableCount}
            unit="套"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="使用中"
            value={inUseCount}
            unit="套"
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="维修中"
            value={maintenanceCount}
            unit="套"
            icon={Wrench}
            color="orange"
          />
        </div>

        <DataTable columns={columns} data={molds} emptyText="暂无模具记录" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-800 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">新增模具</h3>
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
                    模具编号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.moldNo}
                    onChange={(e) => handleInputChange('moldNo', e.target.value)}
                    placeholder="如：MJ-2026-001"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    产品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="请输入产品名称"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    预热温度(℃) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.preheatTemp}
                    onChange={(e) => handleInputChange('preheatTemp', e.target.value)}
                    placeholder="请输入预热温度"
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    预热时间(min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.preheatTime}
                    onChange={(e) => handleInputChange('preheatTime', e.target.value)}
                    placeholder="请输入预热时间"
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    状态 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    操作人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.operator}
                    onChange={(e) => handleInputChange('operator', e.target.value)}
                    placeholder="请输入操作人姓名"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
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
