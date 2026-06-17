import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, string> = {
  '/dashboard': '工作台',
  '/semi-finished': '半成品接收',
  '/mold-prep': '模具准备',
  '/plate-vulcanization': '平板硫化',
  '/tank-vulcanization': '罐式硫化',
  '/demolding': '脱模修边',
  '/appearance-inspection': '外观检验',
  '/physical-inspection': '物性抽检',
  '/energy-statistics': '能耗统计',
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const title = pageTitles[location.pathname] || '硫化车间管理系统'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
