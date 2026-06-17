import { useState } from 'react'
import { Plus, Save, X } from 'lucide-react'
import PageHeader from '../../components/Form/PageHeader'
import DataTable, { type Column } from '../../components/Table/DataTable'
import { useVulcanizationStore } from '../../store'
import type { SemiFinished } from '../../types'

const RUBBER_TYPES = [
  '天然橡胶SVR3L',
  '丁苯橡胶1502',
  '顺丁橡胶BR9000',
  '三元乙丙橡胶',
  '氯丁橡胶CR244',
]

interface FormState {
  batchNo: string
  rubberType: string
  quantity: string
  receiver: string
  receiveDate: string
  remark: string
}

const initialFormState: FormState = {
  batchNo: '',
  rubberType: '',
  quantity: '',
  receiver: '',
  receiveDate: '',
  remark: '',
}

export default function SemiFinishedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const semiFinished = useVulcanizationStore((state) => state.semiFinished)
  const addSemiFinished = useVulcanizationStore((state) => state.addSemiFinished)

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formState.batchNo || !formState.rubberType || !formState.quantity || !formState.receiver || !formState.receiveDate) {
      alert('请填写必填项')
      return
    }

    const newRecord: SemiFinished = {
      id: '',
      batchNo: formState.batchNo,
      rubberType: formState.rubberType,
      quantity: Number(formState.quantity),
      receiver: formState.receiver,
      receiveDate: formState.receiveDate,
      remark: formState.remark,
    }

    addSemiFinished(newRecord)
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const handleClose = () => {
    setFormState(initialFormState)
    setIsModalOpen(false)
  }

  const columns: Column<SemiFinished>[] = [
    { key: 'batchNo', title: '批次号', width: '180px' },
    { key: 'rubberType', title: '胶种', width: '160px' },
    { key: 'quantity', title: '数量(kg)', width: '120px', align: 'right' },
    { key: 'receiver', title: '接收人', width: '120px', align: 'center' },
    { key: 'receiveDate', title: '接收日期', width: '140px', align: 'center' },
    { key: 'remark', title: '备注' },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6">
        <PageHeader
          title="半成品接收"
          description="管理橡胶半成品的入库接收记录，包括胶料批次信息、胶种、数量等数据"
          actions={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition-colors border border-amber-700"
            >
              <Plus className="w-4 h-4" />
              新增接收记录
            </button>
          }
        />

        <DataTable columns={columns} data={semiFinished} emptyText="暂无半成品接收记录" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-800 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">新增半成品接收记录</h3>
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
                    胶料批次号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.batchNo}
                    onChange={(e) => handleInputChange('batchNo', e.target.value)}
                    placeholder="如：JL20260617001"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    胶种 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formState.rubberType}
                    onChange={(e) => handleInputChange('rubberType', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="">请选择胶种</option>
                    {RUBBER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    数量(kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="请输入数量"
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    接收人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.receiver}
                    onChange={(e) => handleInputChange('receiver', e.target.value)}
                    placeholder="请输入接收人姓名"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    接收日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formState.receiveDate}
                    onChange={(e) => handleInputChange('receiveDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
                <textarea
                  value={formState.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  placeholder="请输入备注信息（选填）"
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
