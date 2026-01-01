import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  AI: Ai;
  API_SECRET: string;
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

// GET /tasks - List all tasks
app.get('/tasks', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    return c.json(result.results);
  } catch (e) {
    return c.json({ error: 'Failed to fetch tasks' }, 500);
  }
});

// POST /tasks - Create a new task WITH AI
app.post('/tasks', async (c) => {
  try {
    // 1. Security Check
    const secret = c.req.header('x-api-secret');
    if (secret !== c.env.API_SECRET) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 2. Parse Input
    const body = await c.req.json();
    const { title, description, user_id } = body;

    if (!title || !user_id) {
      return c.json({ error: 'Missing title or user_id' }, 400);
    }

    // 3. AI 
    let aiTags = "General"; // Default if AI fails
    try {
      const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are a task manager assistant. Analyze the following task description and generate 3 comma-separated keywords (tags) that categorize it. Return ONLY the tags, no other text.' },
          { role: 'user', content: `Task Title: ${title}. Description: ${description}` }
        ]
      });
      // @ts-ignore - formatting the response
      aiTags = aiResponse.response || aiTags;
    } catch (aiError) {
      console.error("AI Generation failed, using default tags", aiError);
    }

    // 4. Save to Database (including the new tags)
    const result = await c.env.DB.prepare(
      'INSERT INTO tasks (user_id, title, description, ai_tags) VALUES (?, ?, ?, ?)'
    ).bind(user_id, title, description, aiTags).run();

    return c.json({ 
      message: 'Task created with AI tags', 
      tags: aiTags,
      id: result.meta.last_row_id 
    }, 201);

  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

app.get('/', (c) => c.text('Nexarq Task API is Running!'));

export default app;