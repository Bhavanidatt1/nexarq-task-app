# Nexarq Task App (AI-Powered Task Assistant)

A full-stack, serverless task management application built on **Cloudflare Workers**. This project goes beyond simple CRUD by integrating **Edge Intelligence (Llama-3)** to act as a personal task assistant, along with a secure user authentication system and a real-time Kanban-style status workflow.

**🚀 Live Demo:** [https://nexarq-task-app.dattuchalumuru5236.workers.dev](https://nexarq-task-app.dattuchalumuru5236.workers.dev)

---

## ✨ Key Features

### 1. 🧠 Edge Intelligence (AI Integration)
* **Auto-Tagging:** When a task is created, the Llama-3 AI model analyzes the description and automatically assigns relevant tags (e.g., "Urgent", "Bug", "Personal").
* **AI Chat Assistant (RAG):** A built-in chat interface allows users to ask questions about their own tasks (e.g., *"What is my most urgent work?"*). The AI reads the database context to provide intelligent answers.

### 2. 🔐 Secure Authentication
* **User Accounts:** Full registration and login flow.
* **Session Security:** Tasks are protected at the database level. Users can only view, edit, or delete their own tasks.
* **Password Hashing:** User credentials are validated against the database for every protected action.

### 3. 📋 Workflow Management
* **Kanban Statuses:** Supports a full lifecycle: `TODO` → `IN_PROGRESS` → `DONE`.
* **Visual Indicators:** Color-coded task cards (Orange/Blue/Green) for instant status recognition.
* **Interactive UI:** A server-side rendered HTML dashboard to manage tasks without needing a separate frontend server.

---

## 🏗 System Architecture

The application leverages the **Cloudflare Developer Platform** for a purely serverless architecture:

* **Runtime:** Cloudflare Workers (V8 Isolate) for globally distributed, low-latency execution.
* **Framework:** Hono (Lightweight, web-standard framework).
* **Database:** Cloudflare D1 (Serverless SQLite) for relational data storage and ACID transactions.
* **AI Model:** `@cf/meta/llama-3-8b-instruct` (Running on Workers AI).
* **Frontend:** HTML/CSS served directly from the Worker (Server-Side Rendering).

---

## 🛠 API Documentation

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user with email & password. |
| `POST` | `/auth/login` | Verify credentials and return User ID. |

### Task Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | List all tasks (Filtered by User ID on frontend). |
| `POST` | `/tasks` | Create a new task + Trigger AI Tagging. |
| `PATCH` | `/tasks/:id/status` | Update status (`IN_PROGRESS` or `DONE`). |
| `DELETE` | `/tasks/:id` | Delete a task. |

### AI Features
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/ai/chat` | Ask the AI questions about your specific task list. |

---

## 💻 Local Development

To run this project locally, you need [Node.js](https://nodejs.org/) and [Wrangler](https://developers.cloudflare.com/workers/wrangler/).

1.  **Clone the repository**
    ```bash
    git clone <your-repo-url>
    cd nexarq-task-app
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Local Database**
    ```bash
    npx wrangler d1 execute prod-d1-tutorial --local --file=./schema.sql
    ```

4.  **Run Development Server**
    ```bash
    npx wrangler dev
    ```

---

## 📂 Project Structure