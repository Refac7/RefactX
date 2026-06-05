import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '~/lib/utils';
import Captcha from '~/components/ui/Captcha';

interface FeedItem {
  id: string; content: string; date: string; mood: string; link: string | null;
}

const CACHE_KEY = 'refactx_dynamic_cache';
const VERIFY_KEY = 'refactx_dynamic_verified';
const CACHE_TIME_MS = 30 * 60 * 1000;
const VERIFY_TIME_MS = 24 * 60 * 60 * 1000;
const ITEMS_PER_PAGE = 8;
const COLLAPSE_HEIGHT = 160;

function FeedItemCard({ item, animationDelay }: { item: FeedItem; animationDelay: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setHasOverflow(el.scrollHeight > COLLAPSE_HEIGHT);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [item.content]);

  return (
    <div 
      className="group relative flex flex-col bg-background border border-border/40 rounded-lg fade-up" 
      style={{ animationDelay }}
    >
      <div className="p-5 pb-3 flex justify-between items-start gap-4">
        <span className="inline-flex items-center rounded-full bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-foreground tracking-tight select-none">
          {item.mood}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
          {new Date(item.date).toLocaleString('zh-CN', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 如果你想用AM/PM制，可以改成 true
          })}
        </span>
      </div>
      
      <div className="px-5 pt-1 flex-1 flex flex-col">
        <div 
          className={cn(
            "relative transition-[max-height] duration-500 ease-in-out overflow-hidden",
            isExpanded ? "max-h-[3000px]" : "max-h-[160px]"
          )}
        >
          <div
            ref={contentRef}
            className="prose prose-sm dark:prose-invert max-w-none prose-img:rounded-lg prose-img:border prose-img:border-border/40 prose-a:text-primary prose-p:leading-relaxed"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {item.content}
            </ReactMarkdown>
          </div>

          {!isExpanded && hasOverflow && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          )}
        </div>
        
        {hasOverflow && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors select-none self-start"
          >
            {isExpanded ? (
              <><span className="icon-[ph--caret-up-bold] size-3.5"></span> Show less</>
            ) : (
              <><span className="icon-[ph--caret-down-bold] size-3.5"></span> Read more</>
            )}
          </button>
        )}
      </div>

      <div className="px-5 pb-4 mt-4 flex items-center gap-4">
        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            <span className="icon-[ph--link-bold] size-3.5"></span> Attachment Link
          </a>
        )}
      </div>
    </div>
  );
}

export default function DynamicFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkVerification = () => {
      try {
        const verifiedData = localStorage.getItem(VERIFY_KEY);
        if (verifiedData && Date.now() - JSON.parse(verifiedData).timestamp < VERIFY_TIME_MS) {
          setIsVerified(true);
          fetchFeed();
        } else {
          setLoading(true);
        }
      } catch (e) {
        setLoading(true);
      }
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(checkVerification);
    } else {
      checkVerification();
    }
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && Date.now() - JSON.parse(cached).timestamp < CACHE_TIME_MS) {
      setFeed(JSON.parse(cached).data);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/dynamic');
      if (res.ok) {
        const json = await res.json();
        setFeed(json.data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.data, timestamp: Date.now() }));
      }
    } catch (e) {
      if (cached) setFeed(JSON.parse(cached).data); 
    } finally { setLoading(false); }
  };

  const handleVerifySuccess = (token: string) => {
    setIsVerified(true);
    localStorage.setItem(VERIFY_KEY, JSON.stringify({ timestamp: Date.now(), token }));
    fetchFeed();
  };

  const visibleFeed = feed.slice(0, visibleCount);
  const hasMore = visibleCount < feed.length;

  return (
    <div className="flex flex-col relative min-h-[400px]">
      {!isVerified && (
        <div className="absolute flex items-center justify-center p-2 animate-in fade-in duration-500 z-10">
          <div className="flex flex-col items-start text-start mx-auto">
            <span className="icon-[ph--shield-check-bold] size-10 mb-4 text-primary animate-pulse"></span>
            <h3 className="text-lg font-bold tracking-tight text-foreground mb-2">Attentions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              你真的想要访问这个页面吗？其中可能包括了情绪化信息，未经审查的观点，以及其他一些不适合所有观众的内容。<br />
              请确认你已经做好心理准备，并且理解这些内容可能会引起不适。如果你觉得自己准备好了，请点击下面的按钮进行人机验证，证明你不是机器人。<br />
              你的确认将在24小时内有效，之后你可能需要再次验证。谢谢你的理解和配合。
            </p>
            <Captcha onVerify={handleVerifySuccess} className="w-full shadow-sm" />
          </div>
        </div>
      )}

      <div className={cn(
        "transition-all duration-1000 flex flex-col", 
        !isVerified && "blur-[8px] pointer-events-none select-none opacity-80 grayscale-[0.5]"
      )}>
        {loading || !isVerified ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col bg-background/50 border border-border/40 rounded-lg p-6 min-h-[140px] animate-pulse">
                <div className="flex justify-between items-center mb-4"><div className="h-5 w-16 bg-muted/50 rounded-full"></div><div className="h-3 w-20 bg-muted/30 rounded"></div></div>
                <div className="space-y-2 flex-1"><div className="h-4 w-full bg-muted/40 rounded"></div><div className="h-4 w-4/5 bg-muted/40 rounded"></div></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 relative">
              {visibleFeed.map((item, index) => (
                <FeedItemCard 
                  key={item.id} 
                  item={item} 
                  animationDelay={`${(index % ITEMS_PER_PAGE) * 50}ms`} 
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 mb-4 flex justify-center fade-up" style={{ animationDelay: '100ms' }}>
                <button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)} className="group flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-border/60 bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-primary/40 transition-all select-none">
                  <span>Load More</span><span className="icon-[ph--arrow-down] size-3.5 group-hover:translate-y-0.5 transition-transform"></span>
                </button>
              </div>
            )}
            
            {!hasMore && feed.length > 0 && (
              <div className="mt-10 mb-4 flex justify-center fade-up"><span className="text-[11px] font-medium text-muted-foreground/50 select-none">— End of signals —</span></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}