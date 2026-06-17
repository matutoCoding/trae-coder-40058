import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  color?: 'blue' | 'green' | 'orange' | 'purple'
  children?: ReactNode
}

const colorMap = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-600',
  },
  green: {
    bg: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-600',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-600',
  },
  purple: {
    bg: 'from-violet-500 to-violet-600',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-600',
  },
}

export default function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  children,
}: StatCardProps) {
  const colors = colorMap[color]
  const trendUp = trend !== undefined && trend >= 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800 tracking-tight">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trendUp ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                {trendUp ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
            </div>
          )}
          {children}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center ml-3`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  )
}
