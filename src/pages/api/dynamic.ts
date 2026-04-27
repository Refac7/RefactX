export const prerender = false;
import type { APIRoute } from 'astro';

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
        page_size: 50,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // 解析数据
    const feed = data.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        // 兼容中英文标题字段，防止没改全
        content: props.Content?.title?.[0]?.plain_text || props['名称']?.title?.[0]?.plain_text || '',
        date: props.Date?.date?.start || page.created_time,
        mood: props.Mood?.select?.name || 'Update',
        link: props.Link?.url || null,
      };
    });

    return new Response(JSON.stringify({ success: true, data: feed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('============ [NOTION API ERROR] ============');
    console.error(error.message || error);
    console.error('============================================');
    
    return new Response(JSON.stringify({ success: false, error: error.message || 'Fetch failed' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};