import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  AI: Ai;
  API_SECRET: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS so the Frontend can talk to the Backend
app.use('/*', cors());

// --- FRONTEND (UI) ---
app.get('/', (c) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Nexarq Task Manager</title>
    <style>
      body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
      .card { border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
      .tag { background: #e0e0e0; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin-right: 5px;}
      input, button, textarea { padding: 8px; margin: 5px 0; width: 100%; box-sizing: border-box; }
      button { background: #007bff; color: white; border: none; cursor: pointer; }
      button:hover { background: #0056b3; }
      .delete-btn { background: #dc3545; width: auto; float: right; }
      .done-btn { background: #28a745; width: auto; float: right; margin-right: 5px;}
    </style>
  </head>
  <body>
    <h1>🤖 AI Task Manager</h1>
    
    <div style="background:#f9f9f9; padding:15px; border-radius:8px;">
      <h3>1. Authentication (Required)</h3>
      <input type="text" id="apiSecret" placeholder="Enter API Secret (Default: my-super-secret-password-123)" value="my-super-secret-password-123">
      <input type="number" id="userId" placeholder="User ID (Default: 1)" value="1">
      <details>
        <summary>Don't have a User ID? Register here</summary>
        <input type="email" id="regEmail" placeholder="Email">
        <button onclick="registerUser()">Create User</button>
      </details>
    </div>

    <h3>2. Create New Task</h3>
    <input type="text" id="title" placeholder="Task Title">
    <textarea id="desc" placeholder="Task Description (AI will analyze this)"></textarea>
    <button onclick="createTask()">Create Task with AI ✨</button>

    <h3>3. Your Tasks</h3>
    <button onclick="loadTasks()" style="background:#6c757d;">Refresh List</button>
    <div id="taskList">Loading...</div>

    <script>
      const API_URL = window.location.origin;

      function getHeaders() {
        return {
          'Content-Type': 'application/json',
          'x-api-secret': document.getElementById('apiSecret').value
        };
      }

      async function registerUser() {
        const email = document.getElementById('regEmail').value;
        const res = await fetch(API_URL + '/auth/register', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email, name: 'New User' })
        });
        const data = await res.json();
        alert(JSON.stringify(data));
        if(data.id) document.getElementById('userId').value = data.id;
      }

      async function loadTasks() {
        const res = await fetch(API_URL + '/tasks');
        const tasks = await res.json();
        const list = document.getElementById('taskList');
        list.innerHTML = '';
        tasks.forEach(task => {
          const div = document.createElement('div');
          div.className = 'card';
          div.style.borderLeft = task.status === 'DONE' ? '5px solid green' : '5px solid orange';
          
          let tagsHtml = task.ai_tags ? task.ai_tags.split(',').map(tag => \`<span class="tag">\${tag.trim()}</span>\`).join('') : '';

          div.innerHTML = \`
            <strong>\${task.title}</strong> (\${task.status})
            <button class="delete-btn" onclick="deleteTask(\${task.id})">Delete</button>
            \${task.status !== 'DONE' ? \`<button class="done-btn" onclick="markDone(\${task.id})">Mark Done</button>\` : ''}
            <p>\${task.description}</p>
            <div>\${tagsHtml}</div>
            <small>ID: \${task.id}</small>
          \`;
          list.appendChild(div);
        });
      }

      async function createTask() {
        const title = document.getElementById('title').value;
        const description = document.getElementById('desc').value;
        const user_id = document.getElementById('userId').value;

        const res = await fetch(API_URL + '/tasks', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ title, description, user_id })
        });
        const data = await res.json();
        alert('Created! Tags: ' + data.tags);
        loadTasks();
      }

      async function markDone(id) {
        await fetch(\`\${API_URL}/tasks/\${id}/status\`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ status: 'DONE' })
        });
        loadTasks();
      }

      async function deleteTask(id) {
        if(!confirm('Delete this task?')) return;
        await fetch(\`\${API_URL}/tasks/\${id}\`, { method: 'DELETE', headers: getHeaders() });
        loadTasks();
      }

      // Load on start
      loadTasks();
    </script>
  </body>
  </html>
  `;
  return c.html(html);
});

// --- API ROUTES ---

// 1. REGISTER USER
app.post('/auth/register', async (c) => {
  try {
    const { email, name } = await c.req.json();
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, name) VALUES (?, ?) RETURNING id'
    ).bind(email, name).first();
    return c.json({ message: 'User registered', id: result.id });
  } catch (e) {
    return c.json({ error: 'User likely already exists' }, 400);
  }
});

// 2. GET TASKS (READ)
app.get('/tasks', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  return c.json(result.results);
});

// 3. CREATE TASK (CREATE)
app.post('/tasks', async (c) => {
  const secret = c.req.header('x-api-secret');
  if (secret !== c.env.API_SECRET) return c.json({ error: 'Unauthorized' }, 401);

  const { title, description, user_id } = await c.req.json();
  
  // AI Generation
  let aiTags = "General";
  try {
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: 'Generate 3 comma-separated tags for this task. Return ONLY tags.' },
        { role: 'user', content: `Title: ${title}. Desc: ${description}` }
      ]
    });
    // @ts-ignore
    aiTags = aiResponse.response || aiTags;
  } catch (e) { console.log("AI Failed"); }

  const result = await c.env.DB.prepare(
    'INSERT INTO tasks (user_id, title, description, ai_tags) VALUES (?, ?, ?, ?)'
  ).bind(user_id, title, description, aiTags).run();

  return c.json({ message: 'Task created', tags: aiTags, id: result.meta.last_row_id }, 201);
});

// 4. UPDATE STATUS (UPDATE)
app.patch('/tasks/:id/status', async (c) => {
  const secret = c.req.header('x-api-secret');
  if (secret !== c.env.API_SECRET) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const { status } = await c.req.json(); // e.g., "DONE"

  await c.env.DB.prepare('UPDATE tasks SET status = ? WHERE id = ?').bind(status, id).run();
  return c.json({ message: 'Updated' });
});

// 5. DELETE TASK (DELETE)
app.delete('/tasks/:id', async (c) => {
  const secret = c.req.header('x-api-secret');
  if (secret !== c.env.API_SECRET) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
  return c.json({ message: 'Deleted' });
});

export default app;