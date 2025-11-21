import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { SITE } from '~/config'

export async function GET(context) {
  const posts = await getCollection('posts')

  const sortedPosts = posts.sort((a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf())

  // 添加验证项目
  const verificationItem = {
    title: "Feed Ownership Verification",
    pubDate: new Date(),
    description: "This message is used to verify that this feed (feedId:214506202364687360) belongs to me (userId:214505808796365824). Join me in enjoying the next generation information browser https://folo.is.",
    link: '/verification',
    customData: `<author>${SITE.author}</author>`,
  }

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: [verificationItem, ...sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/posts/${post.slug}/`,
      customData: `<author>${post.data.author || SITE.author}</author>`,
      updatedDate: post.data.updatedDate,
    }))],
    stylesheet: '/rss/styles.xsl',
  })
}