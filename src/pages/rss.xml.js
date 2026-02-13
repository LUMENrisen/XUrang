import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  const validPosts = posts
    .filter(post => {
      // 确保 title、description 存在且为字符串
      const hasTitle = post.data.title && typeof post.data.title === 'string';
      const hasDescription = post.data.description && typeof post.data.description === 'string';
      // 确保 pubDate 存在且能转换为有效日期
      const hasPubDate = post.data.pubDate && !isNaN(new Date(post.data.pubDate).getTime());
      return hasTitle && hasDescription && hasPubDate;
    })
    .map(post => ({
      title: post.data.title,
      pubDate: new Date(post.data.pubDate), // 转换为 Date 对象
      description: post.data.description,
      link: `/blog/${post.id.replace(/\.md$/, '')}/`, // 去掉 .md 后缀
    }));
  return rss({
    title: 'Lumen Atelier',
    description: '建筑研究 · 数字宅邸',
    site: context.site,
    items: validPosts,
    customData: '<language>zh-cn</language>',
  });
}