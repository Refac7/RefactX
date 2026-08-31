'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import Tooltip, { TooltipProvider } from './Tooltip.tsx'

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

const ERROR_PATTERN = [
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
] as const

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
  const contributions = Array.from(
    { length: 371 },
    (_, index): Contribution => ({
      date: new Date(Date.now() - (371 - index) * 86400000).toISOString().split('T')[0],
      count: 0,
      level: 0,
    })
  )
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

  const weeks =
    data?.contributions.reduce<Contribution[][]>((acc, day, index) => {
      const weekIndex = Math.floor(index / 7)
      if (!acc[weekIndex]) acc[weekIndex] = []
      acc[weekIndex].push(day)
      return acc
    }, []) || []

  const getLevelClass = (count: number) => {
    if (count === 0) return 'bg-muted/30 border-border/40'
    if (count < 5) return 'bg-primary/30 border-primary/20'
    if (count < 10) return 'bg-primary/50 border-primary/30'
    if (count < 20) return 'bg-primary/70 border-primary/50'
    return 'bg-primary border-primary/80'
  }

  return (
    <TooltipProvider>
      <div className="w-full flex flex-col items-center select-none font-sans mt-2">
        <div className="flex justify-between items-end w-full px-1 mb-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Activity</span>
              <span className="text-sm font-semibold text-foreground">@{username}</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={cn('size-1.5 rounded-full', loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-emerald-500')} />
              <span className="text-xs text-muted-foreground font-medium">Contributions</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {loading ? '---' : totalCount} <span className="text-xs font-normal text-muted-foreground">in last year</span>
            </span>
          </div>
        </div>

        <div ref={containerRef} className="w-full overflow-x-auto scrollbar-hide pb-2">
          <div className="grid grid-flow-col gap-0.75 w-max mx-auto">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-0.75">
                {week.map((contribution, dayIndex) => {
                  const { date, count } = contribution
                  const dateStr = date
                    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A'
                  const tooltipText = `${count} contributions on ${dateStr}`

                  return (
                    <Tooltip key={dayIndex} content={tooltipText} disabled={!tooltipEnabled || error}>
                      <div className={cn('size-3 xl:size-4.5 border transition-colors duration-300', getLevelClass(count))} />
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
