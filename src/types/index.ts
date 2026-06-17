export interface SemiFinished {
  id: string
  batchNo: string
  rubberType: string
  quantity: number
  receiver: string
  receiveDate: string
  remark: string
}

export interface Mold {
  id: string
  moldNo: string
  productName: string
  preheatTemp: number
  preheatTime: number
  status: 'available' | 'in-use' | 'maintenance'
  operator: string
  lastUsedTime?: string
}

export interface TemperaturePoint {
  time: number
  temperature: number
}

export interface PlateVulcanization {
  id: string
  semiFinishedId: string
  moldId: string
  pressure: number
  temperature: number
  duration: number
  temperatureCurve: TemperaturePoint[]
  operator: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'pending'
}

export interface TankVulcanization {
  id: string
  semiFinishedId: string
  steamPressure: number
  temperature: number
  duration: number
  operator: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'pending'
}

export interface Demolding {
  id: string
  vulcanizationId: string
  vulcanizationType: 'plate' | 'tank'
  productNo: string
  qualifiedQty: number
  defectiveQty: number
  trimmingRecord: string
  operator: string
  createTime: string
}

export interface AppearanceInspection {
  id: string
  demoldingId: string
  bubbleDefect: string
  lackGlueDefect: string
  dimensionCheck: string
  result: 'pass' | 'fail'
  inspector: string
  inspectTime: string
}

export interface PhysicalInspection {
  id: string
  appearanceId: string
  hardness: number
  hardnessResult: 'pass' | 'fail'
  agingTestCondition: string
  agingTestResult: string
  inspector: string
  inspectTime: string
}

export interface DefectHandlingRecord {
  id: string
  batchId: string
  sourceType: 'appearance' | 'physical'
  sourceRecordId: string
  handlingType: 'rework' | 'scrap' | 'concession'
  conclusion: string
  handler: string
  createTime: string
}

export interface EnergyStatistics {
  id: string
  statDate: string
  electricity: number
  steam: number
  water: number
  totalCost: number
}

export interface EnergyTarget {
  period: 'day' | 'week' | 'month'
  electricity: number
  steam: number
  water: number
  totalCost: number
}

export interface DashboardStats {
  todayProduction: number
  passRate: number
  todayEnergyCost: number
  activeBatches: number
  pendingTasks: number
  completedToday: number
}

export type ProcessStatus = 'pending' | 'running' | 'completed' | 'failed'
