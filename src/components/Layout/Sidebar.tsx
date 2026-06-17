import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Wrench,
  Flame,
  Container,
  Scissors,
  Eye,
  Microscope,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/semi-finished', label: '半成品接收', icon: Package },
  { path: '/mold-prep', label: '模具准备', icon: Wrench },
  { path: '/plate-vulcanization', label: '平板硫化', icon: Flame },
  { path: '/tank-vulcanization', label: '罐式硫化', icon: Container },
  { path: '/demolding', label: '脱模修边', icon: Scissors },
  { path: '/appearance-inspection', label: '外观检验', icon: Eye },
  { path: '/physical-inspection', label: '物性抽检', icon: Microscope },
  { path: '/energy-statistics', label: '能耗统计', icon: Zap },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`bg-gradient-to-b from-[#1e3a5f] to-[#152a45] text-white h-screen flex flex-col transition-all duration-300 flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className={`h-16 flex items-center border-b border-white/10 ${collapsed ? 'justify-center' : 'px-5'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#e85d26] to-[#c94a1a] flex items-center justify-center shadow-lg">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-wide">硫化车间</div>
              <div className="text-[10px] text-blue-200">Vulcanization MES</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#e85d26] to-[#c94a1a] flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#e85d26] text-white shadow-md shadow-orange-900/30'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">收起菜单</span>}
        </button>
      </div>
    </aside>
  )
}
