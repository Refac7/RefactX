import { useState, useEffect } from 'react';

interface FeedItem {
  id: string; content: string; date: string; mood: string; link: string | null;
}

const CACHE_KEY = 'refactx_dynamic_cache';
const CACHE_TIME_MS = 30 * 60 * 1000; // 30 分钟
const ITEMS_PER_PAGE = 8; // 每次显示/加载的数量

export default function DynamicFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    const fetchFeed = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME_MS) {
          setFeed(data);
          setLoading(false);
          return;
        }
      }

      try {
        const res = await fetch('/api/dynamic');
        if (!res.ok) throw new Error();
        const json = await res.json();
        
        if (json.success) {
          setFeed(json.data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.data, timestamp: Date.now() }));
        }
      } catch (e) {
        if (cached) setFeed(JSON.parse(cached).data); 
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col bg-background/50 border border-border/40 rounded-lg p-6 min-h-[140px] animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-5 w-16 bg-muted/50 rounded-full"></div>
              <div className="h-3 w-20 bg-muted/30 rounded"></div>
            </div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-full bg-muted/40 rounded"></div>
              <div className="h-4 w-4/5 bg-muted/40 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 截取当前需要显示的数据
  const visibleFeed = feed.slice(0, visibleCount);
  const hasMore = visibleCount < feed.length;

  return (
    <div className="flex flex-col">
      {/* 动态列表 */}
      <div className="grid grid-cols-1 gap-6 mt-8 relative before:absolute before:inset-y-0 before:left-[27px] before:w-[2px] before:bg-border/30">
        {visibleFeed.map((item, index) => (
          <div 
            key={item.id}
            className="group relative flex flex-col bg-background border border-border/40 rounded-lg hover:bg-muted/10 hover:shadow-sm transition-all duration-300 fade-up ml-12"
            // 取余计算延迟，保证点击加载更多时新数据也会有渐次入场动画，而不会因为延迟太长导致卡顿
            style={{ animationDelay: `${(index % ITEMS_PER_PAGE) * 50}ms` }}
          >
            {/* 时间轴圆点 */}
            <div className="absolute top-6 -left-[25px] size-3 rounded-full bg-background border-2 border-primary z-10 shadow-[0_0_0_4px_hsl(var(--background))]"></div>

            <div className="p-5 pb-3 flex justify-between items-start gap-4">
              <span className="inline-flex items-center rounded-full bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-foreground tracking-tight select-none">
                {item.mood}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="p-5 pt-1 flex-1">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{item.content}</p>
            </div>

            {item.link && (
              <div className="px-5 pb-5 mt-auto">
                <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  <span className="icon-[ph--link-bold] size-3.5"></span>
                  Attachment Link
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 加载更多按钮 */}
      {hasMore && (
        <div className="mt-10 mb-4 flex justify-center ml-12 fade-up" style={{ animationDelay: '100ms' }}>
          <button 
            onClick={handleLoadMore}
            className="group flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-border/60 bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-primary/40 transition-all select-none"
          >
            <span>Load More</span>
            <span className="icon-[ph--arrow-down] size-3.5 group-hover:translate-y-0.5 transition-transform"></span>
          </button>
        </div>
      )}

      {/* 到底提示 */}
      {!hasMore && feed.length > 0 && (
        <div className="mt-10 mb-4 flex justify-center ml-12 fade-up">
          <span className="text-[11px] font-medium text-muted-foreground/50 select-none">
            — End of signals —
          </span>
        </div>
      )}
    </div>
  );
}