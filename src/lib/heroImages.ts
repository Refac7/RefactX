export interface HeroImageCredit {
  title: string
  author: string
  url: string
}

/** Pixiv source information for the hero illustrations in /public/hero-images. */
export const HERO_IMAGE_CREDITS: Record<string, HeroImageCredit> = {
  '/hero-images/hero-blue-01.webp': {
    title: '旅立ち',
    author: 'isat',
    url: 'https://www.pixiv.net/artworks/150966388',
  },
  '/hero-images/hero-blue-02.webp': {
    title: '【仕事絵】Alice in 冷凍庫',
    author: '柳眞ユウ',
    url: 'https://www.pixiv.net/artworks/150573001',
  },
  '/hero-images/hero-blue-03.webp': {
    title: 'しゅわしゅわアクアリウム',
    author: '†にゃ†',
    url: 'https://www.pixiv.net/artworks/151477207',
  },
  '/hero-images/hero-blue-04.webp': {
    title: 'ネビュラ・ホエール',
    author: 'うらき神楽KI',
    url: 'https://www.pixiv.net/artworks/151569003',
  },
  '/hero-images/hero-blue-05.webp': {
    title: '月夜の海',
    author: '星降る夜の工房',
    url: 'https://www.pixiv.net/artworks/151633890',
  },
  '/hero-images/hero-blue-06.webp': {
    title: 'ずっと空を見ていた',
    author: '白い雪',
    url: 'https://www.pixiv.net/artworks/151147356',
  },
  '/hero-images/hero-blue-07.webp': {
    title: '🚉🏙️☁️',
    author: 'Ki',
    url: 'https://www.pixiv.net/artworks/150767113',
  },
  '/hero-images/hero-blue-08.webp': {
    title: '和風と星空',
    author: '星降る夜の工房',
    url: 'https://www.pixiv.net/artworks/151634048',
  },
  '/hero-images/hero-blue-09.webp': {
    title: '夢の中の花火',
    author: '风辞晚歌',
    url: 'https://www.pixiv.net/artworks/151318698',
  },
  '/hero-images/hero-blue-10.webp': {
    title: 'blue',
    author: '赭鳞_Zhelin',
    url: 'https://www.pixiv.net/artworks/149508297',
  },
  '/hero-images/hero-blue-11.webp': {
    title: 'クラゲと少女。',
    author: '竜巻事務所',
    url: 'https://www.pixiv.net/artworks/151653764',
  },
  '/hero-images/hero-blue-12.webp': {
    title: 'Internet',
    author: 'ＣｙｂｅｒＡｌａｔｕｍ８４',
    url: 'https://www.pixiv.net/artworks/149811275',
  },
  '/hero-images/hero-blue-13.webp': {
    title: 'キャンバス',
    author: '木染あお',
    url: 'https://www.pixiv.net/artworks/150412968',
  },
}

export function getHeroImageCredit(image: string): HeroImageCredit | undefined {
  return HERO_IMAGE_CREDITS[image]
}
