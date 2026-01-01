import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  AI: Ai;
}

const app = new Hono<{ Bindings: Bindings }>();

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
      .card { border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px; position: relative; }
      .tag { background: #e0e0e0; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin-right: 5px;}
      input, button, textarea { padding: 10px; margin: 5px 0; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
      
      /* Button Styles */
      button { background: #007bff; color: white; border: none; cursor: pointer; font-weight: bold; }
      button:hover { background: #0056b3; }
      .delete-btn { background: #dc3545; width: auto; float: right; padding: 5px 10px; margin-left: 5px; }
      .done-btn { background: #28a745; width: auto; float: right; padding: 5px 10px; margin-left: 5px; }
      .start-btn { background: #17a2b8; width: auto; float: right; padding: 5px 10px; margin-left: 5px; }

      /* Layout Styles */
      #login-screen { text-align: center; margin-top: 50px; }
      #dashboard { display: none; }
      .auth-box { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; }
      .chat-box { background: #e8f4f8; padding: 15px; border-radius: 8px; margin-top: 30px; border: 1px solid #bce0fd; }
      #aiResponse { white-space: pre-wrap; background: white; padding: 10px; border-radius: 4px; margin-top: 10px; display: none; border: 1px solid #ddd;}
    </style>
  </head>
  <body>

    <div id="login-screen">
      <h1>🔐 Nexarq Login</h1>
      <div class="auth-box" id="loginForm">
        <h3>Sign In</h3>
        <input type="email" id="loginEmail" placeholder="Email">
        <input type="password" id="loginPass" placeholder="Password">
        <button onclick="login()">Login</button>
        <p><small>New here? <a href="#" onclick="toggleAuth()">Create an account</a></small></p>
      </div>

      <div class="auth-box" id="registerForm" style="display:none;">
        <h3>Register New User</h3>
        <input type="email" id="regEmail" placeholder="New Email">
        <input type="password" id="regPass" placeholder="New Password">
        <button onclick="register()" style="background: #28a745;">Register</button>
        <p><small>Has account? <a href="#" onclick="toggleAuth()">Back to Login</a></small></p>
      </div>
    </div>

    <div id="dashboard">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h1>🤖 My Task Manager</h1>
        <button onclick="logout()" style="width:auto; background:#6c757d;">Logout</button>
      </div>
      <p>Welcome, <b id="displayEmail">User</b> (ID: <span id="displayId"></span>)</p>

      <div style="background:#f0f8ff; padding:15px; border-radius:8px; margin-bottom:20px;">
        <h3>Create New Task</h3>
        <input type="text" id="title" placeholder="Task Title">
        <textarea id="desc" placeholder="Task Description (AI will analyze this)"></textarea>
        <button onclick="createTask()">Create Task with AI ✨</button>
      </div>

      <h3>My Tasks</h3>
      <button onclick="loadTasks()" style="background: #6c757d; width: auto; margin-bottom: 10px;">Refresh List</button>
      <div id="taskList">Loading...</div>

      <div class="chat-box">
        <h3>🧠 Ask Your Assistant</h3>
        <p><small>Ask questions like: "What is in progress?" or "Summarize my work."</small></p>
        <div style="display:flex; gap:10px;">
          <input type="text" id="chatQuery" placeholder="Ask a question about your tasks...">
          <button onclick="askAI()" style="width:100px; background:#6610f2;">Ask AI</button>
        </div>
        <div id="aiResponse"></div>
      </div>
    </div>

    <script>
      const API_URL = window.location.origin;
      let currentUser = { id: null, email: null, password: null };

      function toggleAuth() {
        const login = document.getElementById('loginForm');
        const reg = document.getElementById('registerForm');
        if(login.style.display === 'none') { login.style.display = 'block'; reg.style.display = 'none'; }
        else { login.style.display = 'none'; reg.style.display = 'block'; }
      }

      async function login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;
        const res = await fetch(API_URL + '/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.error) { alert(data.error); return; }
        currentUser = { id: data.id, email: email, password: password };
        showDashboard();
      }

      async function register() {
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;
        const res = await fetch(API_URL + '/auth/register', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.error) alert(data.error);
        else { alert('Registered! Login now.'); toggleAuth(); }
      }

      function logout() {
        currentUser = null;
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('login-screen').style.display = 'block';
      }

      function showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('displayEmail').innerText = currentUser.email;
        document.getElementById('displayId').innerText = currentUser.id;
        loadTasks();
      }

      function getAuthHeaders() {
        return { 'Content-Type': 'application/json', 'x-auth-id': currentUser.id, 'x-auth-pass': currentUser.password };
      }

      async function loadTasks() {
        const res = await fetch(API_URL + '/tasks');
        const tasks = await res.json();
        const list = document.getElementById('taskList');
        list.innerHTML = '';
        
        const myTasks = tasks.filter(t => t.user_id == currentUser.id);
        if (myTasks.length === 0) list.innerHTML = '<p>No tasks found.</p>';
        
        myTasks.forEach(task => {
          const div = document.createElement('div');
          div.className = 'card';
          
          // Color Logic: Todo (Orange), In Progress (Blue), Done (Green)
          let borderColor = 'orange';
          if (task.status === 'IN_PROGRESS') borderColor = '#007bff'; // Blue
          if (task.status === 'DONE') borderColor = 'green';
          div.style.borderLeft = \`5px solid \${borderColor}\`;

          let tagsHtml = task.ai_tags ? task.ai_tags.split(',').map(tag => \`<span class="tag">\${tag.trim()}</span>\`).join('') : '';

          // Button Logic
          let buttons = \`<button class="delete-btn" onclick="deleteTask(\${task.id})">Delete</button>\`;
          
          if (task.status !== 'DONE') {
            buttons += \`<button class="done-btn" onclick="updateStatus(\${task.id}, 'DONE')">Done</button>\`;
          }
          if (task.status !== 'IN_PROGRESS' && task.status !== 'DONE') {
             buttons += \`<button class="start-btn" onclick="updateStatus(\${task.id}, 'IN_PROGRESS')">Start</button>\`;
          }

          div.innerHTML = \`
            <strong>\${task.title}</strong> <small>(\${task.status || 'TODO'})</small>
            \${buttons}
            <p>\${task.description}</p>
            <div>\${tagsHtml}</div>
          \`;
          list.appendChild(div);
        });
      }

      async function createTask() {
        const title = document.getElementById('title').value;
        const description = document.getElementById('desc').value;
        const res = await fetch(API_URL + '/tasks', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ title, description })
        });
        const data = await res.json();
        if(data.error) alert(data.error);
        else { alert('Created!'); loadTasks(); }
      }

      // Replaced "markDone" with generic "updateStatus"
      async function updateStatus(id, newStatus) {
        await fetch(\`\${API_URL}/tasks/\${id}/status\`, { 
          method: 'PATCH', 
          headers: getAuthHeaders(), 
          body: JSON.stringify({ status: newStatus }) 
        });
        loadTasks();
      }

      async function deleteTask(id) {
        if(!confirm('Delete?')) return;
        await fetch(\`\${API_URL}/tasks/\${id}\`, { method: 'DELETE', headers: getAuthHeaders() });
        loadTasks();
      }

      async function askAI() {
        const question = document.getElementById('chatQuery').value;
        const responseBox = document.getElementById('aiResponse');
        responseBox.style.display = 'block';
        responseBox.innerText = 'Thinking...';
        
        const res = await fetch(API_URL + '/ai/chat', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ question })
        });
        const data = await res.json();
        responseBox.innerText = data.answer || "AI Error";
      }
    </script>
  </body>
  </html>
  `;
  return c.html(html);
});

// --- BACKEND API ---

async function verifyUser(c: any) {
  const id = c.req.header('x-auth-id');
  const pass = c.req.header('x-auth-pass');
  if (!id || !pass) return null;
  return await c.env.DB.prepare('SELECT * FROM users WHERE id = ? AND password_hash = ?').bind(id, pass).first();
}

app.post('/auth/register', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Missing fields' }, 400);
    const result = await c.env.DB.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id').bind(email, password).first();
    return c.json({ message: 'Registered', id: result.id });
  } catch (e) { return c.json({ error: 'Email exists' }, 400); }
});

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND password_hash = ?').bind(email, password).first();
  if (!user) return c.json({ error: 'Invalid creds' }, 401);
  return c.json({ message: 'Success', id: user.id });
});

app.get('/tasks', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  return c.json(result.results);
});

app.post('/tasks', async (c) => {
  const user = await verifyUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { title, description } = await c.req.json();
  let aiTags = "General";
  try {
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'system', content: 'Generate 3 tags, comma-separated' }, { role: 'user', content: description }]
    });
    // @ts-ignore
    aiTags = aiResponse.response || aiTags;
  } catch (e) {}
  const result = await c.env.DB.prepare('INSERT INTO tasks (user_id, title, description, ai_tags) VALUES (?, ?, ?, ?)').bind(user.id, title, description, aiTags).run();
  return c.json({ message: 'Created', tags: aiTags }, 201);
});

app.patch('/tasks/:id/status', async (c) => {
  const user = await verifyUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const taskId = c.req.param('id');
  const { status } = await c.req.json();
  await c.env.DB.prepare('UPDATE tasks SET status = ? WHERE id = ?').bind(status, taskId).run();
  return c.json({ message: 'Updated' });
});

app.delete('/tasks/:id', async (c) => {
  const user = await verifyUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const taskId = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run();
  return c.json({ message: 'Deleted' });
});

app.post('/ai/chat', async (c) => {
  const user = await verifyUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { question } = await c.req.json();
  const tasks = await c.env.DB.prepare('SELECT title, description, status, ai_tags FROM tasks WHERE user_id = ?').bind(user.id).all();
  const taskContext = JSON.stringify(tasks.results);
  try {
    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: `You are a helpful task assistant. Answer based ONLY on this task list: ${taskContext}` },
        { role: 'user', content: question }
      ]
    });
    // @ts-ignore
    return c.json({ answer: response.response });
  } catch (e) {
    return c.json({ answer: "I couldn't think of an answer right now." });
  }
});

export default app;