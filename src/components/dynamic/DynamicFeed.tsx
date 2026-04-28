import { useState, useEffect } from 'react';
import { cn } from '~/lib/utils';
import Captcha from '~/components/ui/Captcha';
import Waline from '~/components/ui/Waline';

interface FeedItem {
  id: string; content: string; date: string; mood: string; link: string | null;
}

const CACHE_KEY = 'refactx_dynamic_cache';
const VERIFY_KEY = 'refactx_dynamic_verified';
const CACHE_TIME_MS = 30 * 60 * 1000;       // 数据缓存 30 分钟
const VERIFY_TIME_MS = 24 * 60 * 60 * 1000; // 人机验证记忆 24 小时
const ITEMS_PER_PAGE = 8;

export default function DynamicFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isVerified, setIsVerified] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // 1. 初始化检查 24小时 验证状态
  useEffect(() => {
    const verifiedData = localStorage.getItem(VERIFY_KEY);
    if (verifiedData && Date.now() - JSON.parse(verifiedData).timestamp < VERIFY_TIME_MS) {
      setIsVerified(true);
      fetchFeed();
    } else {
      setLoading(true); // 未验证时保持加载状态，展示底层骨架屏
    }
  }, []);

  // 2. 真实数据拉取逻辑
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

  // 3. 处理人机验证通过
  const handleVerifySuccess = (token: string) => {
    setIsVerified(true);
    localStorage.setItem(VERIFY_KEY, JSON.stringify({ timestamp: Date.now(), token }));
    fetchFeed(); // 验证通过后，立刻拉取真实数据
  };

  const toggleComment = (id: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const visibleFeed = feed.slice(0, visibleCount);
  const hasMore = visibleCount < feed.length;

  return (
    <div className="flex flex-col relative min-h-[400px]">
      
      {!isVerified && (
        <div className="absolute flex items-center justify-center p-2 animate-in fade-in duration-500">
          <div className="flex flex-col items-start text-start mx-auto">
            <span className="icon-[ph--shield-check-bold] size-10 mb-4 text-primary animate-pulse"></span>
            <h3 className="text-lg font-bold tracking-tight text-foreground mb-2">Attentions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              你真的想要访问这个页面吗？其中可能包括了情绪化信息，未经审查的观点，以及其他一些不适合所有观众的内容。<br />
              请确认你已经做好心理准备，并且理解这些内容可能会引起不适。如果你觉得自己准备好了，请点击下面的按钮进行人机验证，证明你不是机器人。<br />
              你的确认将在24小时内有效，之后你可能需要再次验证。谢谢你的理解和配合。
            </p>
            {/* 调用 PoW 验证组件 */}
            <Captcha onVerify={handleVerifySuccess} className="w-full shadow-sm" />
          </div>
        </div>
      )}

      <div className={cn(
        "transition-all duration-1000 flex flex-col", 
        !isVerified && "blur-[8px] pointer-events-none select-none opacity-80 grayscale-[0.5]"
      )}>
        {loading || !isVerified ? (
          // 骨架屏
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
            {/* 真实数据渲染 */}
            <div className="grid grid-cols-1 gap-6 relative">
              {visibleFeed.map((item, index) => {
                const isCommentOpen = expandedComments.has(item.id);
                return (
                  <div key={item.id} className="group relative flex flex-col bg-background border border-border/40 rounded-lg hover:bg-muted/20 hover:border-border hover:shadow-xs transition-all duration-300 fade-up hover:-translate-y-0.5" style={{ animationDelay: `${(index % ITEMS_PER_PAGE) * 50}ms` }}>
                    <div className="p-5 pb-3 flex justify-between items-start gap-4">
                      <span className="inline-flex items-center rounded-full bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-foreground tracking-tight select-none">{item.mood}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="px-5 pt-1 flex-1">
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                    </div>
                    <div className="px-5 pb-4 mt-4 flex items-center gap-4">
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                          <span className="icon-[ph--link-bold] size-3.5"></span> Attachment Link
                        </a>
                      )}
                      <button onClick={() => toggleComment(item.id)} className={cn("inline-flex items-center gap-1.5 text-xs font-medium transition-colors ml-auto", isCommentOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                        <span className={cn("size-3.5", isCommentOpen ? "icon-[ph--chat-teardrop-text-fill]" : "icon-[ph--chat-teardrop-text]")}></span>
                        {isCommentOpen ? "Close Discussion" : "Discuss"}
                      </button>
                    </div>

                    {/* 评论区调用 */}
                    {isCommentOpen && (
                      <div className="p-5 bg-muted/5 rounded-b-lg border-t border-border/40 animate-in fade-in slide-in-from-top-2">
                        <Waline path={`/dynamic/?id=${item.id}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 加载更多按钮 */}
            {hasMore && (
              <div className="mt-10 mb-4 flex justify-center ml-12 fade-up" style={{ animationDelay: '100ms' }}>
                <button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)} className="group flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-border/60 bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-primary/40 transition-all select-none">
                  <span>Load More</span><span className="icon-[ph--arrow-down] size-3.5 group-hover:translate-y-0.5 transition-transform"></span>
                </button>
              </div>
            )}
            
            {!hasMore && feed.length > 0 && (
              <div className="mt-10 mb-4 flex justify-center ml-12 fade-up"><span className="text-[11px] font-medium text-muted-foreground/50 select-none">— End of signals —</span></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}