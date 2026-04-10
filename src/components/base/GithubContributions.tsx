'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import Tooltip, { TooltipProvider } from './Tooltip.tsx'

// --- Types ---
interface Contribution {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface Response {
  total: {
    [year: number]: number
    [year: string]: number 
  }
  contributions: Array<Contribution>
}

interface ErrorData {
  error: string
}

interface Props {
  username: string
  tooltipEnabled: boolean
}

// --- Configuration ---
const ERROR_PATTERN = [
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
] as const

// --- Helpers ---
function generateErrorContributions(): Response {
  const contributions = Array.from({ length: 371 }, (_, index): Contribution => {
    const weekIndex = Math.floor(index / 7)
    const dayIndex = index % 7
    const patternStartWeek = Math.floor((53 - 19) / 2)
    const patternStartRow = Math.floor((7 - 5) / 2)
    const relativeWeek = weekIndex - patternStartWeek
    const relativeRow = dayIndex - patternStartRow
    let count = 0
    if (relativeWeek >= 0 && relativeWeek < 19 && relativeRow >= 0 && relativeRow < 5) {
      count = ERROR_PATTERN[relativeRow]?.[relativeWeek] === 1 ? 10 : 0
    }
    return { date: '', count, level: 0 }
  })
  return { contributions, total: { lastYear: 0 } }
}

function generatePlaceholderContributions(): Response {
  const contributions = Array.from({ length: 371 }, (_, index): Contribution => ({
    date: new Date(Date.now() - (371 - index) * 86400000).toISOString().split('T')[0],
    count: 0,
    level: 0,
  }))
  return { contributions, total: { lastYear: 0 } }
}

async function fetchContributions(username: string): Promise<Response> {
  const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
  const data: Response | ErrorData = await response.json()
  if (!response.ok) throw Error((data as ErrorData).error)
  return data as Response
}

export default function GithubContributions({ username, tooltipEnabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Response | null>(generatePlaceholderContributions())
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const scrollToRight = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [])

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(false)
    fetchContributions(username)
      .then((res) => {
        setData(res)
        const total = res.total?.lastYear ?? res.contributions.reduce((acc, curr) => acc + curr.count, 0) ?? 0
        setTotalCount(total)
        setLoading(false)
      })
      .then(scrollToRight)
      .catch(() => {
        setData(generateErrorContributions())
        setTotalCount(0)
        setError(true)
        setLoading(false)
      })
  }, [username, scrollToRight])

  useEffect(fetchData, [fetchData])

  const weeks = data?.contributions.reduce<Contribution[][]>((acc, day, index) => {
    const weekIndex = Math.floor(index / 7)
    if (!acc[weekIndex]) acc[weekIndex] = []
    acc[weekIndex].push(day)
    return acc
  }, []) || []

  // 极简配色逻辑：只使用 Primary 色，通过透明度区分
  const getLevelClass = (count: number) => {
    // 0: 极淡的背景色，作为占位符
    if (count === 0) return 'bg-primary/5' 
    // 有数据: 实心色块，透明度递增
    if (count < 5) return 'bg-primary/40'
    if (count < 10) return 'bg-primary/60'
    if (count < 20) return 'bg-primary/80'
    return 'bg-primary'
  }

  return (
    <TooltipProvider>
      {/* 
        主容器：无边框，无背景 
        w-full: 占满 5xl 宽度
      */}
      <div className="w-full flex flex-col items-center select-none font-mono mt-4">
        
        {/* 
          顶部信息栏：悬浮文字风格
          使用 w-full max-w-[53*gap] 来尝试和下方图表对齐，或者直接居中
        */}
        <div className="flex justify-between items-end w-full px-1 mb-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col">
             <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Target</span>
             <span className="text-xs font-bold text-foreground">@{username}</span>
          </div>

          {/* 中间装饰线条，可选 */}
          <div className="flex-1 mx-4 border-b border-dashed border-primary/20 h-[1px] mb-1.5" />

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              Status
              <span className={cn("size-1 rounded-full", loading ? "bg-yellow-500" : error ? "bg-red-500" : "bg-primary")} />
            </span>
             <span className="text-xs font-bold text-foreground">{loading ? '---' : totalCount} <span className="text-[9px] font-normal text-muted-foreground">OPS</span></span>
          </div>
        </div>

        <div 
          ref={containerRef} 
          className="w-full overflow-x-auto scrollbar-hide"
        >
          <div className="grid grid-flow-col gap-1 w-max mx-auto">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-1">
                {week.map((contribution, dayIndex) => {
                  const { date, count } = contribution
                  const dateStr = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : 'N/A'
                  const tooltipText = `${dateStr} — ${count} LOGS`

                  return (
                    <Tooltip key={dayIndex} content={tooltipText} disabled={!tooltipEnabled || error}>
                      <div
                        className={cn(
                          'size-4 lg:size-6 transition-all duration-300',
                          getLevelClass(count)
                        )}
                      />
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}