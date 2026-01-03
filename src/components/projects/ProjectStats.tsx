import React, { useState, useEffect } from 'react';
import { cn } from '~/lib/utils';

// 本地缓存时长 (24小时)
const CACHE_DURATION = 24 * 60 * 60 * 1000; 

interface ProjectStatsProps {
  repoUrl?: string;
  initialStar?: number;
  initialFork?: number;
}

export default function ProjectStats({ repoUrl, initialStar = 0, initialFork = 0 }: ProjectStatsProps) {
  const [stats, setStats] = useState({ stars: initialStar, forks: initialFork });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!repoUrl) {
      setLoading(false);
      return;
    }

    // 1. 提取 repo 路径 (兼容末尾斜杠)
    // https://github.com/user/repo -> user/repo
    const repoPath = repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    
    // 简单的格式检查
    if (!repoPath || !repoPath.includes('/')) {
        console.warn(`[Stats] Invalid Repo URL: ${repoUrl}`);
        setLoading(false);
        return;
    }

    const cacheKey = `gh_stats_${repoPath}`;

    const fetchStats = async () => {
      try {
        // 2. 检查 LocalStorage 缓存
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            // console.log(`[Stats] Loaded from cache: ${repoPath}`);
            setStats(data);
            setLoading(false);
            return;
          }
        }

        // 3. 请求我们自己的代理 API (解决速率限制问题)
        // console.log(`[Stats] Fetching: ${repoPath}`);
        const res = await fetch(`/api/repo-stats?repo=${repoPath}`);
        
        if (!res.ok) {
            // 如果 403/429，说明即使是后端也限流了，或者 Token 无效
            console.error(`[Stats] API Error ${res.status} for ${repoPath}`);
            throw new Error('API Failed');
        }
        
        const data = await res.json();

        // 4. 更新状态
        const newStats = {
          stars: data.stars,
          forks: data.forks
        };

        setStats(newStats);
        
        // 5. 写入缓存
        localStorage.setItem(cacheKey, JSON.stringify({
          data: newStats,
          timestamp: Date.now()
        }));

      } catch (e) {
        setError(true);
        // 出错时保持默认值，不破坏 UI
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [repoUrl]);

  return (
    <div className={cn("flex gap-4 transition-all duration-500", loading ? "opacity-50" : "opacity-100")}>
      <div className="flex items-center gap-1" title="Stars">
        <span className={cn("icon-[ph--star-fill] size-3", error ? "text-muted-foreground" : "text-yellow-500/80")}></span>
        <span className="font-mono">{stats.stars}</span>
      </div>
      <div className="flex items-center gap-1" title="Forks">
        <span className="icon-[ph--git-fork-fill] size-3 text-muted-foreground"></span>
        <span className="font-mono">{stats.forks}</span>
      </div>
    </div>
  );
}