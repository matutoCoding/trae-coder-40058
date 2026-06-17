import type { ReactNode } from 'react'

export interface Column<T> {
  key: keyof T | string
  title: string
  width?: string
  render?: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyText?: string
  rowClassName?: (row: T) => string
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  emptyText = '暂无数据',
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={(row as { id?: string }).id || idx}
                  className={`hover:bg-gray-50/80 transition-colors ${rowClassName ? rowClassName(row) : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-sm text-gray-700 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
