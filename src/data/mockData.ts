import type {
  SemiFinished,
  Mold,
  PlateVulcanization,
  TankVulcanization,
  Demolding,
  AppearanceInspection,
  PhysicalInspection,
  EnergyStatistics,
  TemperaturePoint,
} from '../types'

const generateTempCurve = (duration: number, targetTemp: number): TemperaturePoint[] => {
  const points: TemperaturePoint[] = []
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const time = (duration / steps) * i
    let temp: number
    if (i < steps * 0.3) {
      temp = (targetTemp / (steps * 0.3)) * i
    } else if (i < steps * 0.85) {
      temp = targetTemp + (Math.random() - 0.5) * 4
    } else {
      temp = targetTemp - ((i - steps * 0.85) / (steps * 0.15)) * targetTemp * 0.3
    }
    points.push({ time: Math.round(time * 10) / 10, temperature: Math.round(temp * 10) / 10 })
  }
  return points
}

export const mockSemiFinished: SemiFinished[] = [
  { id: 'sf1', batchNo: 'JL20260615001', rubberType: '天然橡胶SVR3L', quantity: 500, receiver: '张工', receiveDate: '2026-06-15', remark: '合格入库' },
  { id: 'sf2', batchNo: 'JL20260616002', rubberType: '丁苯橡胶1502', quantity: 300, receiver: '李工', receiveDate: '2026-06-16', remark: '' },
  { id: 'sf3', batchNo: 'JL20260617003', rubberType: '顺丁橡胶BR9000', quantity: 450, receiver: '王工', receiveDate: '2026-06-17', remark: '待检' },
  { id: 'sf4', batchNo: 'JL20260617004', rubberType: '三元乙丙橡胶', quantity: 200, receiver: '张工', receiveDate: '2026-06-17', remark: '' },
  { id: 'sf5', batchNo: 'JL20260617005', rubberType: '氯丁橡胶CR244', quantity: 350, receiver: '赵工', receiveDate: '2026-06-17', remark: '合格' },
]

export const mockMolds: Mold[] = [
  { id: 'm1', moldNo: 'MJ-A001', productName: '汽车密封垫', preheatTemp: 165, preheatTime: 30, status: 'available', operator: '', lastUsedTime: '2026-06-16 18:00' },
  { id: 'm2', moldNo: 'MJ-A002', productName: 'O型密封圈', preheatTemp: 170, preheatTime: 25, status: 'in-use', operator: '李师傅', lastUsedTime: '2026-06-17 08:30' },
  { id: 'm3', moldNo: 'MJ-B003', productName: '减震橡胶块', preheatTemp: 160, preheatTime: 35, status: 'available', operator: '', lastUsedTime: '2026-06-15 14:20' },
  { id: 'm4', moldNo: 'MJ-B004', productName: '橡胶软管接头', preheatTemp: 168, preheatTime: 28, status: 'maintenance', operator: '', lastUsedTime: '2026-06-14 10:00' },
  { id: 'm5', moldNo: 'MJ-C005', productName: '工业胶辊', preheatTemp: 155, preheatTime: 40, status: 'available', operator: '', lastUsedTime: '2026-06-16 16:30' },
]

export const mockPlateVulcanization: PlateVulcanization[] = [
  {
    id: 'pv1',
    semiFinishedId: 'sf1',
    moldId: 'm2',
    pressure: 15.5,
    temperature: 165,
    duration: 45,
    temperatureCurve: generateTempCurve(45, 165),
    operator: '李师傅',
    startTime: '2026-06-17 08:30',
    status: 'running',
  },
  {
    id: 'pv2',
    semiFinishedId: 'sf2',
    moldId: 'm1',
    pressure: 16.0,
    temperature: 170,
    duration: 40,
    temperatureCurve: generateTempCurve(40, 170),
    operator: '王师傅',
    startTime: '2026-06-17 06:00',
    endTime: '2026-06-17 06:40',
    status: 'completed',
  },
]

export const mockTankVulcanization: TankVulcanization[] = [
  {
    id: 'tv1',
    semiFinishedId: 'sf3',
    steamPressure: 0.6,
    temperature: 155,
    duration: 120,
    operator: '赵师傅',
    startTime: '2026-06-17 07:00',
    status: 'running',
  },
  {
    id: 'tv2',
    semiFinishedId: 'sf5',
    steamPressure: 0.55,
    temperature: 150,
    duration: 90,
    operator: '张师傅',
    startTime: '2026-06-17 05:00',
    endTime: '2026-06-17 06:30',
    status: 'completed',
  },
]

export const mockDemolding: Demolding[] = [
  { id: 'd1', vulcanizationId: 'pv2', vulcanizationType: 'plate', productNo: 'CP-20260617-001', qualifiedQty: 48, defectiveQty: 2, trimmingRecord: '毛边已修剪，合格率96%', operator: '刘师傅', createTime: '2026-06-17 07:10' },
  { id: 'd2', vulcanizationId: 'tv2', vulcanizationType: 'tank', productNo: 'CP-20260617-002', qualifiedQty: 95, defectiveQty: 5, trimmingRecord: '毛边较大，已逐一修整', operator: '陈师傅', createTime: '2026-06-17 07:00' },
]

export const mockAppearanceInspection: AppearanceInspection[] = [
  { id: 'ai1', demoldingId: 'd1', bubbleDefect: '无明显气泡', lackGlueDefect: '轻微缺胶2处，已标记', dimensionCheck: '尺寸符合公差要求', result: 'pass', inspector: '质检员王', inspectTime: '2026-06-17 07:30' },
  { id: 'ai2', demoldingId: 'd2', bubbleDefect: '气泡缺陷3个', lackGlueDefect: '无缺胶', dimensionCheck: '外径偏差0.02mm，合格', result: 'pass', inspector: '质检员李', inspectTime: '2026-06-17 07:45' },
]

export const mockPhysicalInspection: PhysicalInspection[] = [
  { id: 'pi1', appearanceId: 'ai1', hardness: 68, hardnessResult: 'pass', agingTestCondition: '100℃×72h热空气老化', agingTestResult: '硬度变化+3度，拉伸强度变化率-8%，合格', inspector: '质检员王', inspectTime: '2026-06-17 09:00' },
]

export const mockEnergyStatistics: EnergyStatistics[] = [
  { id: 'e1', statDate: '2026-06-11', electricity: 1250, steam: 8.5, water: 12, totalCost: 1850 },
  { id: 'e2', statDate: '2026-06-12', electricity: 1380, steam: 9.2, water: 14, totalCost: 2010 },
  { id: 'e3', statDate: '2026-06-13', electricity: 1100, steam: 7.8, water: 10, totalCost: 1620 },
  { id: 'e4', statDate: '2026-06-14', electricity: 1450, steam: 10.1, water: 15, totalCost: 2180 },
  { id: 'e5', statDate: '2026-06-15', electricity: 1320, steam: 8.8, water: 13, totalCost: 1950 },
  { id: 'e6', statDate: '2026-06-16', electricity: 1480, steam: 9.5, water: 14, totalCost: 2120 },
  { id: 'e7', statDate: '2026-06-17', electricity: 820, steam: 5.6, water: 8, totalCost: 1180 },
]
