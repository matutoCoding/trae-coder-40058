import { create } from 'zustand'
import type {
  SemiFinished,
  Mold,
  PlateVulcanization,
  TankVulcanization,
  Demolding,
  AppearanceInspection,
  PhysicalInspection,
  EnergyStatistics,
  EnergyTarget,
  DefectHandlingRecord,
} from '../types'
import {
  mockSemiFinished,
  mockMolds,
  mockPlateVulcanization,
  mockTankVulcanization,
  mockDemolding,
  mockAppearanceInspection,
  mockPhysicalInspection,
  mockEnergyStatistics,
} from '../data/mockData'

const STORAGE_KEY = 'vulcanization_store_v1'

const defaultEnergyTargets: Record<string, EnergyTarget> = {
  day: { period: 'day', electricity: 1500, steam: 10, water: 15, totalCost: 2500 },
  week: { period: 'week', electricity: 9000, steam: 60, water: 90, totalCost: 14000 },
  month: { period: 'month', electricity: 38000, steam: 250, water: 380, totalCost: 58000 },
}

interface VulcanizationStore {
  semiFinished: SemiFinished[]
  molds: Mold[]
  plateVulcanization: PlateVulcanization[]
  tankVulcanization: TankVulcanization[]
  demolding: Demolding[]
  appearanceInspection: AppearanceInspection[]
  physicalInspection: PhysicalInspection[]
  energyStatistics: EnergyStatistics[]
  energyTargets: Record<string, EnergyTarget>
  defectHandlings: DefectHandlingRecord[]

  addSemiFinished: (item: SemiFinished) => void
  addMold: (item: Mold) => void
  updateMoldStatus: (id: string, status: Mold['status'], operator?: string) => void
  addPlateVulcanization: (item: PlateVulcanization) => void
  updatePlateVulcanization: (id: string, updates: Partial<PlateVulcanization>) => void
  addTankVulcanization: (item: TankVulcanization) => void
  updateTankVulcanization: (id: string, updates: Partial<TankVulcanization>) => void
  addDemolding: (item: Demolding) => void
  addAppearanceInspection: (item: AppearanceInspection) => void
  addPhysicalInspection: (item: PhysicalInspection) => void
  addEnergyStatistics: (item: EnergyStatistics) => void
  addDefectHandling: (item: DefectHandlingRecord) => void
  updateEnergyTarget: (period: 'day' | 'week' | 'month', target: Partial<EnergyTarget>) => void

  getAvailableSemiFinishedForVulcanization: () => SemiFinished[]
  getCompletedVulcanizationForDemolding: (type: 'plate' | 'tank') => (PlateVulcanization | TankVulcanization)[]
  getDemoldingForAppearance: () => Demolding[]
  getAppearanceForPhysical: () => AppearanceInspection[]
  getFailedAppearanceForReference: () => AppearanceInspection[]
  getSemiFinishedIdByAppearanceId: (appearanceId: string) => string | null
  getRunningVulcanizationBatches: () => Array<{
    id: string
    semiFinishedId: string
    batchNo: string
    startTime: string
    type: 'plate' | 'tank'
  }>
  getBatchFlowStatus: () => Array<{
    batchNo: string
    semiFinishedId: string
    currentStep: string
    stepIndex: number
    timestamp: string
    details: Record<string, unknown>
  }>
  getDefectHandlingByBatchId: (batchId: string) => DefectHandlingRecord[]
  getDefectHandlingBySourceId: (sourceId: string) => DefectHandlingRecord | undefined
  resetToMock: () => void
}

const generateId = (prefix: string) =>
  `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`

const loadFromStorage = (): Partial<{
  semiFinished: SemiFinished[]
  molds: Mold[]
  plateVulcanization: PlateVulcanization[]
  tankVulcanization: TankVulcanization[]
  demolding: Demolding[]
  appearanceInspection: AppearanceInspection[]
  physicalInspection: PhysicalInspection[]
  energyStatistics: EnergyStatistics[]
  energyTargets: Record<string, EnergyTarget>
  defectHandlings: DefectHandlingRecord[]
}> | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.warn('加载本地存储数据失败:', e)
  }
  return null
}

const saveToStorage = (state: Partial<VulcanizationStore>) => {
  try {
    const toSave = {
      semiFinished: state.semiFinished,
      molds: state.molds,
      plateVulcanization: state.plateVulcanization,
      tankVulcanization: state.tankVulcanization,
      demolding: state.demolding,
      appearanceInspection: state.appearanceInspection,
      physicalInspection: state.physicalInspection,
      energyStatistics: state.energyStatistics,
      energyTargets: state.energyTargets,
      defectHandlings: state.defectHandlings,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.warn('保存本地存储数据失败:', e)
  }
}

const persisted = loadFromStorage()

export const useVulcanizationStore = create<VulcanizationStore>((set, get) => {
  const initialState = persisted ? {
    semiFinished: persisted.semiFinished ?? mockSemiFinished,
    molds: persisted.molds ?? mockMolds,
    plateVulcanization: persisted.plateVulcanization ?? mockPlateVulcanization,
    tankVulcanization: persisted.tankVulcanization ?? mockTankVulcanization,
    demolding: persisted.demolding ?? mockDemolding,
    appearanceInspection: persisted.appearanceInspection ?? mockAppearanceInspection,
    physicalInspection: persisted.physicalInspection ?? mockPhysicalInspection,
    energyStatistics: persisted.energyStatistics ?? mockEnergyStatistics,
    energyTargets: persisted.energyTargets ?? defaultEnergyTargets,
    defectHandlings: persisted.defectHandlings ?? [],
  } : {
    semiFinished: mockSemiFinished,
    molds: mockMolds,
    plateVulcanization: mockPlateVulcanization,
    tankVulcanization: mockTankVulcanization,
    demolding: mockDemolding,
    appearanceInspection: mockAppearanceInspection,
    physicalInspection: mockPhysicalInspection,
    energyStatistics: mockEnergyStatistics,
    energyTargets: defaultEnergyTargets,
    defectHandlings: [],
  }

  const persistMiddleware = (newState: Partial<VulcanizationStore>) => {
    saveToStorage({ ...get(), ...newState })
  }

  return {
    ...initialState,

    addSemiFinished: (item) => {
      const newItem = { ...item, id: generateId('sf') }
      const newState = { semiFinished: [newItem, ...get().semiFinished] }
      set(newState)
      persistMiddleware(newState)
    },

    addMold: (item) => {
      const newItem = { ...item, id: generateId('m') }
      const newState = { molds: [newItem, ...get().molds] }
      set(newState)
      persistMiddleware(newState)
    },

    updateMoldStatus: (id, status, operator) => {
      const newState = {
        molds: get().molds.map((m) =>
          m.id === id ? { ...m, status, operator: operator ?? m.operator, lastUsedTime: new Date().toLocaleString('zh-CN') } : m
        ),
      }
      set(newState)
      persistMiddleware(newState)
    },

    addPlateVulcanization: (item) => {
      const newItem = { ...item, id: generateId('pv') }
      const newMolds = get().molds.map((m) =>
        m.id === item.moldId ? { ...m, status: 'in-use' as const, operator: item.operator, lastUsedTime: new Date().toLocaleString('zh-CN') } : m
      )
      const newState = {
        plateVulcanization: [newItem, ...get().plateVulcanization],
        molds: newMolds,
      }
      set(newState)
      persistMiddleware(newState)
    },

    updatePlateVulcanization: (id, updates) => {
      const updated = get().plateVulcanization.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      )
      let newMolds = get().molds
      const target = updated.find((p) => p.id === id)
      if (target && updates.status === 'completed') {
        newMolds = newMolds.map((m) =>
          m.id === target.moldId ? { ...m, status: 'available' as const, operator: '' } : m
        )
      }
      const newState = { plateVulcanization: updated, molds: newMolds }
      set(newState)
      persistMiddleware(newState)
    },

    addTankVulcanization: (item) => {
      const newItem = { ...item, id: generateId('tv') }
      const newState = { tankVulcanization: [newItem, ...get().tankVulcanization] }
      set(newState)
      persistMiddleware(newState)
    },

    updateTankVulcanization: (id, updates) => {
      const newState = {
        tankVulcanization: get().tankVulcanization.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }
      set(newState)
      persistMiddleware(newState)
    },

    addDemolding: (item) => {
      const newItem = { ...item, id: generateId('d') }
      const newState = { demolding: [newItem, ...get().demolding] }
      set(newState)
      persistMiddleware(newState)
    },

    addAppearanceInspection: (item) => {
      const newItem = { ...item, id: generateId('ai') }
      const newState = { appearanceInspection: [newItem, ...get().appearanceInspection] }
      set(newState)
      persistMiddleware(newState)
    },

    addPhysicalInspection: (item) => {
      const newItem = { ...item, id: generateId('pi') }
      const newState = { physicalInspection: [newItem, ...get().physicalInspection] }
      set(newState)
      persistMiddleware(newState)
    },

    addDefectHandling: (item) => {
      const newItem = { ...item, id: generateId('dh') }
      const newState = { defectHandlings: [newItem, ...get().defectHandlings] }
      set(newState)
      persistMiddleware(newState)
    },

    addEnergyStatistics: (item) => {
      const newItem = { ...item, id: generateId('e') }
      const newState = { energyStatistics: [newItem, ...get().energyStatistics] }
      set(newState)
      persistMiddleware(newState)
    },

    updateEnergyTarget: (period, target) => {
      const current = get().energyTargets[period]
      const newState = {
        energyTargets: {
          ...get().energyTargets,
          [period]: { ...current, ...target, period },
        },
      }
      set(newState)
      persistMiddleware(newState)
    },

    getAvailableSemiFinishedForVulcanization: () => {
      const state = get()
      const usedIds = new Set<string>()
      state.plateVulcanization.forEach((p) => usedIds.add(p.semiFinishedId))
      state.tankVulcanization.forEach((t) => usedIds.add(t.semiFinishedId))
      return state.semiFinished.filter((sf) => !usedIds.has(sf.id))
    },

    getCompletedVulcanizationForDemolding: (type) => {
      const state = get()
      const usedIds = new Set(state.demolding.map((d) => d.vulcanizationId))
      if (type === 'plate') {
        return state.plateVulcanization.filter(
          (p) => p.status === 'completed' && !usedIds.has(p.id)
        )
      } else {
        return state.tankVulcanization.filter(
          (t) => t.status === 'completed' && !usedIds.has(t.id)
        )
      }
    },

    getDemoldingForAppearance: () => {
      const state = get()
      const usedIds = new Set(state.appearanceInspection.map((a) => a.demoldingId))
      return state.demolding.filter((d) => !usedIds.has(d.id))
    },

    getAppearanceForPhysical: () => {
      const state = get()
      const usedIds = new Set(state.physicalInspection.map((p) => p.appearanceId))
      return state.appearanceInspection.filter((a) => !usedIds.has(a.id) && a.result === 'pass')
    },

    getFailedAppearanceForReference: () => {
      const state = get()
      const usedIds = new Set(state.physicalInspection.map((p) => p.appearanceId))
      return state.appearanceInspection.filter((a) => !usedIds.has(a.id) && a.result === 'fail')
    },

    getSemiFinishedIdByAppearanceId: (appearanceId) => {
      const state = get()
      const appearance = state.appearanceInspection.find((a) => a.id === appearanceId)
      if (!appearance) return null
      const demold = state.demolding.find((d) => d.id === appearance.demoldingId)
      if (!demold) return null
      if (demold.vulcanizationType === 'plate') {
        const vulc = state.plateVulcanization.find((p) => p.id === demold.vulcanizationId)
        return vulc?.semiFinishedId ?? null
      } else {
        const vulc = state.tankVulcanization.find((t) => t.id === demold.vulcanizationId)
        return vulc?.semiFinishedId ?? null
      }
    },

    getDefectHandlingByBatchId: (batchId) => {
      const state = get()
      return state.defectHandlings.filter((d) => d.batchId === batchId)
    },

    getDefectHandlingBySourceId: (sourceId) => {
      const state = get()
      return state.defectHandlings.find((d) => d.sourceRecordId === sourceId)
    },

    getRunningVulcanizationBatches: () => {
      const state = get()
      const result: Array<{
        id: string
        semiFinishedId: string
        batchNo: string
        startTime: string
        type: 'plate' | 'tank'
      }> = []
      state.plateVulcanization
        .filter((p) => p.status === 'running')
        .forEach((p) => {
          const sf = state.semiFinished.find((s) => s.id === p.semiFinishedId)
          result.push({
            id: p.id,
            semiFinishedId: p.semiFinishedId,
            batchNo: sf?.batchNo ?? '-',
            startTime: p.startTime,
            type: 'plate',
          })
        })
      state.tankVulcanization
        .filter((t) => t.status === 'running')
        .forEach((t) => {
          const sf = state.semiFinished.find((s) => s.id === t.semiFinishedId)
          result.push({
            id: t.id,
            semiFinishedId: t.semiFinishedId,
            batchNo: sf?.batchNo ?? '-',
            startTime: t.startTime,
            type: 'tank',
          })
        })
      return result
    },

    getBatchFlowStatus: () => {
      const state = get()
      const steps = [
        '半成品接收',
        '硫化工序',
        '脱模修边',
        '外观检验',
        '物性抽检',
        '全部完成',
      ]
      const result: Array<{
        batchNo: string
        semiFinishedId: string
        currentStep: string
        stepIndex: number
        timestamp: string
        details: Record<string, unknown>
      }> = []

      for (const sf of state.semiFinished) {
        let stepIndex = 0
        let timestamp = sf.receiveDate
        const details: Record<string, unknown> = { semiFinished: sf }

        const pv = state.plateVulcanization.find((p) => p.semiFinishedId === sf.id)
        const tv = state.tankVulcanization.find((t) => t.semiFinishedId === sf.id)
        const vulc = pv || tv
        const vulcType = pv ? 'plate' : 'tank'

        if (vulc) {
          stepIndex = 1
          timestamp = vulc.startTime
          details.vulcanization = vulc
          details.vulcanizationType = vulcType
          if (vulc.status === 'completed') {
            const dm = state.demolding.find(
              (d) => d.vulcanizationId === vulc.id && d.vulcanizationType === vulcType
            )
            if (dm) {
              stepIndex = 2
              timestamp = dm.createTime
              details.demolding = dm
              const ai = state.appearanceInspection.find((a) => a.demoldingId === dm.id)
              if (ai) {
                stepIndex = 3
                timestamp = ai.inspectTime
                details.appearance = ai
                const pi = state.physicalInspection.find((p) => p.appearanceId === ai.id)
                if (pi) {
                  stepIndex = 5
                  timestamp = pi.inspectTime
                  details.physical = pi
                } else if (ai.result === 'fail') {
                  stepIndex = 3
                }
              }
            }
          }
        }

        result.push({
          batchNo: sf.batchNo,
          semiFinishedId: sf.id,
          currentStep: steps[Math.min(stepIndex, steps.length - 1)],
          stepIndex,
          timestamp,
          details,
        })
      }

      return result.sort((a, b) => {
        if (a.stepIndex !== b.stepIndex) return a.stepIndex - b.stepIndex
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
    },

    resetToMock: () => {
      localStorage.removeItem(STORAGE_KEY)
      set({
        semiFinished: mockSemiFinished,
        molds: mockMolds,
        plateVulcanization: mockPlateVulcanization,
        tankVulcanization: mockTankVulcanization,
        demolding: mockDemolding,
        appearanceInspection: mockAppearanceInspection,
        physicalInspection: mockPhysicalInspection,
        defectHandlings: [],
        energyStatistics: mockEnergyStatistics,
        energyTargets: defaultEnergyTargets,
      })
    },
  }
})
