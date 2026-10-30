import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '~/lib/utils'
import Captcha from '~/components/ui/Captcha'
import MarkdownTable from '~/components/base/MarkdownTable'

interface FeedItem {
  id: string
  content: string
  date: string
  mood: string
  link: string | null
}

const CACHE_KEY = 'refactx_dynamic_cache'
const VERIFY_KEY = 'refactx_dynamic_verified'
const CACHE_TIME_MS = 30 * 60 * 1000
const VERIFY_TIME_MS = 24 * 60 * 60 * 1000
const ITEMS_PER_PAGE = 8
const COLLAPSE_HEIGHT = 160

function FeedItemCard({ item, animationDelay }: { item: FeedItem; animationDelay: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const checkOverflow = () => {
      setHasOverflow(el.scrollHeight > COLLAPSE_HEIGHT)
    }

    checkOverflow()

    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [item.content])

  return (
    <div
      className="group relative flex flex-col border border-foreground/25 bg-background transition-colors duration-200 fade-up hover:border-primary"
      style={{ animationDelay }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-foreground/15 p-5 pb-3">
        <span className="inline-flex select-none items-center bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary-foreground">
          {item.mood}
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          {new Date(item.date).toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-4">
        <div
          className={cn(
            'relative overflow-hidden transition-[max-height] duration-500 ease-in-out',
            isExpanded ? 'max-h-[3000px]' : 'max-h-40'
          )}
        >
          <div ref={contentRef} className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: MarkdownTable }}>
              {item.content}
            </ReactMarkdown>
          </div>

          {!isExpanded && hasOverflow && <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-background" />}
        </div>

        {hasOverflow && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 inline-flex select-none items-center gap-1 self-start font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary"
          >
            {isExpanded ? (
              <>
                <span className="icon-[ph--caret-up-bold] size-3.5"></span> Show less
              </>
            ) : (
              <>
                <span className="icon-[ph--caret-down-bold] size-3.5"></span> Read more
              </>
            )}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 px-5 pb-4">
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary transition-colors hover:text-foreground"
          >
            <span className="icon-[ph--link-bold] size-3.5"></span> Attachment Link
          </a>
        )}
      </div>
    </div>
  )
}

export default function DynamicFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const checkVerification = () => {
      try {
        const verifiedData = localStorage.getItem(VERIFY_KEY)
        if (verifiedData && Date.now() - JSON.parse(verifiedData).timestamp < VERIFY_TIME_MS) {
          setIsVerified(true)
          fetchFeed()
        } else {
          setLoading(true)
        }
      } catch (e) {
        setLoading(true)
      }
    }
    if ('requestIdleCallback' in window) {
      requestIdleCallback(checkVerification)
    } else {
      checkVerification()
    }
  }, [])

  const fetchFeed = async () => {
    setLoading(true)
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached && Date.now() - JSON.parse(cached).timestamp < CACHE_TIME_MS) {
      setFeed(JSON.parse(cached).data)
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/dynamic')
      if (res.ok) {
        const json = await res.json()
        setFeed(json.data)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.data, timestamp: Date.now() }))
      }
    } catch (e) {
      if (cached) setFeed(JSON.parse(cached).data)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySuccess = (token: string) => {
    setIsVerified(true)
    localStorage.setItem(VERIFY_KEY, JSON.stringify({ timestamp: Date.now(), token }))
    fetchFeed()
  }

  const visibleFeed = feed.slice(0, visibleCount)
  const hasMore = visibleCount < feed.length

  return (
    <div className="flex flex-col relative min-h-100">
      {!isVerified && (
        <div className="absolute flex items-center justify-center p-2 animate-in fade-in duration-500 z-10">
          <div className="flex flex-col items-start text-start mx-auto">
            <span className="icon-[ph--shield-check-bold] mb-4 size-10 text-primary"></span>
            <h3 className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.14em] text-foreground">Attentions</h3>
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              你真的想要访问这个页面吗？其中可能包括了情绪化信息，未经审查的观点，以及其他一些不适合所有观众的内容。
              <br />
              请确认你已经做好心理准备，并且理解这些内容可能会引起不适。如果你觉得自己准备好了，请点击下面的按钮进行人机验证，证明你不是机器人。
              <br />
              你的确认将在24小时内有效，之后你可能需要再次验证。谢谢你的理解和配合。
            </p>
            <Captcha onVerify={handleVerifySuccess} className="w-full" />
          </div>
        </div>
      )}

      <div
        className={cn(
          'transition-all duration-1000 flex flex-col',
          !isVerified && 'blur-sm pointer-events-none select-none opacity-80 grayscale-[0.5]'
        )}
      >
        {loading || !isVerified ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex min-h-35 animate-pulse flex-col border border-foreground/25 bg-background p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-5 w-16 bg-muted"></div>
                  <div className="h-3 w-20 bg-muted/70"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full bg-muted/80"></div>
                  <div className="h-4 w-4/5 bg-muted/80"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 relative">
              {visibleFeed.map((item, index) => (
                <FeedItemCard key={item.id} item={item} animationDelay={`${(index % ITEMS_PER_PAGE) * 50}ms`} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 mb-4 flex justify-center fade-up" style={{ animationDelay: '100ms' }}>
                <button
                  onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                  className="group flex select-none items-center justify-center gap-2 border border-foreground px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  <span>Load More</span>
                  <span className="icon-[ph--arrow-down] size-3.5 transition-transform group-hover:translate-y-0.5"></span>
                </button>
              </div>
            )}

            {!hasMore && feed.length > 0 && (
              <div className="mt-10 mb-4 flex justify-center fade-up">
                <span className="select-none font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
                  — End of signals —
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
