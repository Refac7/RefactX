export const prerender = false;
import type { APIRoute } from 'astro';

const parseRichText = (richTextArr: any[]) => {
  if (!richTextArr || richTextArr.length === 0) return '';
  return richTextArr.map((t: any) => {
    let text = t.plain_text;
    if (t.annotations.bold) text = `**${text}**`;
    if (t.annotations.italic) text = `*${text}*`;
    if (t.annotations.strikethrough) text = `~~${text}~~`;
    if (t.annotations.code) text = `\`${text}\``;
    if (t.href) text = `[${text}](${t.href})`;
    return text;
  }).join('');
};

async function getPageBlocksAsMarkdown(pageId: string, apiKey: string) {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
      }
    });
    if (!res.ok) return '';
    
    const data = await res.json();
    
    return data.results.map((block: any) => {
      const type = block.type;
      const blockData = block[type];
      
      switch (type) {
        case 'paragraph': return `${parseRichText(blockData.rich_text)}\n\n`;
        case 'heading_1': return `# ${parseRichText(blockData.rich_text)}\n\n`;
        case 'heading_2': return `## ${parseRichText(blockData.rich_text)}\n\n`;
        case 'heading_3': return `### ${parseRichText(blockData.rich_text)}\n\n`;
        case 'bulleted_list_item': return `- ${parseRichText(blockData.rich_text)}\n`;
        case 'numbered_list_item': return `1. ${parseRichText(blockData.rich_text)}\n`;
        case 'quote': return `> ${parseRichText(blockData.rich_text)}\n\n`;
        case 'code': return `\`\`\`${blockData.language || ''}\n${parseRichText(blockData.rich_text)}\n\`\`\`\n\n`;
        case 'image': 
          const url = blockData.type === 'external' ? blockData.external.url : blockData.file?.url;
          const caption = parseRichText(blockData.caption || []);
          return url ? `![${caption}](${url})\n\n` : '';
        case 'divider': return `---\n\n`;
        default: return '';
      }
    }).join('');
  } catch (e) {
    return '';
  }
}

export const GET: APIRoute = async () => {
  try {
    const apiKey = import.meta.env.NOTION_API_KEY;
    const databaseId = import.meta.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) {
      throw new Error('Missing Notion API Key or Database ID in .env file');
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'Status', select: { equals: 'Published' } },
        sorts: [{ property: 'Date', direction: 'descending' }],
        page_size: 20,
      })
    });

    if (!response.ok) throw new Error(`Notion API Error (${response.status})`);

    const data = await response.json();

    const feed = await Promise.all(data.results.map(async (page: any) => {
      const props = page.properties;
      const content = await getPageBlocksAsMarkdown(page.id, apiKey);
      
      return {
        id: page.id,
        content: content.trim() || '*(No content)*',
        date: props.Date?.date?.start || page.created_time,
        mood: props.Mood?.select?.name || 'Update',
        link: props.Link?.url || null,
      };
    }));

    return new Response(JSON.stringify({ success: true, data: feed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('============ [NOTION API ERROR] ============');
    console.error(error.message || error);
    
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};