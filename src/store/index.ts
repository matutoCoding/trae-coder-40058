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

interface VulcanizationStore {
  semiFinished: SemiFinished[]
  molds: Mold[]
  plateVulcanization: PlateVulcanization[]
  tankVulcanization: TankVulcanization[]
  demolding: Demolding[]
  appearanceInspection: AppearanceInspection[]
  physicalInspection: PhysicalInspection[]
  energyStatistics: EnergyStatistics[]

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
}

const generateId = (prefix: string) =>
  `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`

export const useVulcanizationStore = create<VulcanizationStore>((set) => ({
  semiFinished: mockSemiFinished,
  molds: mockMolds,
  plateVulcanization: mockPlateVulcanization,
  tankVulcanization: mockTankVulcanization,
  demolding: mockDemolding,
  appearanceInspection: mockAppearanceInspection,
  physicalInspection: mockPhysicalInspection,
  energyStatistics: mockEnergyStatistics,

  addSemiFinished: (item) =>
    set((state) => ({ semiFinished: [{ ...item, id: generateId('sf') }, ...state.semiFinished] })),

  addMold: (item) =>
    set((state) => ({ molds: [{ ...item, id: generateId('m') }, ...state.molds] })),

  updateMoldStatus: (id, status, operator) =>
    set((state) => ({
      molds: state.molds.map((m) =>
        m.id === id ? { ...m, status, operator: operator ?? m.operator, lastUsedTime: new Date().toLocaleString('zh-CN') } : m
      ),
    })),

  addPlateVulcanization: (item) =>
    set((state) => ({
      plateVulcanization: [{ ...item, id: generateId('pv') }, ...state.plateVulcanization],
    })),

  updatePlateVulcanization: (id, updates) =>
    set((state) => ({
      plateVulcanization: state.plateVulcanization.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  addTankVulcanization: (item) =>
    set((state) => ({
      tankVulcanization: [{ ...item, id: generateId('tv') }, ...state.tankVulcanization],
    })),

  updateTankVulcanization: (id, updates) =>
    set((state) => ({
      tankVulcanization: state.tankVulcanization.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  addDemolding: (item) =>
    set((state) => ({ demolding: [{ ...item, id: generateId('d') }, ...state.demolding] })),

  addAppearanceInspection: (item) =>
    set((state) => ({
      appearanceInspection: [{ ...item, id: generateId('ai') }, ...state.appearanceInspection],
    })),

  addPhysicalInspection: (item) =>
    set((state) => ({
      physicalInspection: [{ ...item, id: generateId('pi') }, ...state.physicalInspection],
    })),

  addEnergyStatistics: (item) =>
    set((state) => ({
      energyStatistics: [{ ...item, id: generateId('e') }, ...state.energyStatistics],
    })),
}))
