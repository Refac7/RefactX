import readingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

/**
 * Remark 插件：自动计算文章的阅读时间
 * 将计算结果添加到 frontmatter 的 minutesRead 字段
 */
function remarkReadingTime() {
  return (tree: any, file: any) => {
    const { frontmatter } = file.data.astro;

    // 如果已有 minutesRead 值（包括 0），则跳过计算
    if (frontmatter.minutesRead !== undefined) return;

    const textOnPage = toString(tree);
    const stats = readingTime(textOnPage);

    // 最少显示 1 分钟
    frontmatter.minutesRead = Math.max(1, Math.round(stats.minutes));
  };
}

export default remarkReadingTime;
