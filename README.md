# Nexarq Task App (AI-Powered + Dashboard)

A full-stack serverless task manager built on **Cloudflare Workers**. It features a **Frontend Dashboard** for easy interaction, **Edge Intelligence** (Llama-3) for automatic tagging, and a **D1 Database** for persistence.

**🚀 Live Dashboard:** [https://nexarq-task-app.dattuchalumuru5236.workers.dev](https://nexarq-task-app.dattuchalumuru5236.workers.dev)

---

## 🆕 New Features (Phase 2)
* **Interactive UI:** A built-in HTML dashboard to Create, View, Update, and Delete tasks.
* **User Registration:** New flow to register users directly from the UI.
* **Full CRUD:** Implemented complete Create, Read, Update (Mark Done), and Delete flows.

---

## 🏗 Architecture

* **Frontend:** Server-side rendered HTML (served directly from the Worker).
* **Backend:** Hono framework running on Cloudflare Workers.
* **Database:** Cloudflare D1 (SQLite).
* **AI:** Workers AI (Llama-3) for real-time text analysis.

---

## 🛠 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | **Frontend Dashboard** (HTML) |
| `GET` | `/tasks` | List all tasks |
| `POST` | `/tasks` | Create task + AI Tagging |
| `PATCH` | `/tasks/:id/status` | Mark task as DONE |
| `DELETE` | `/tasks/:id` | Delete a task |
| `POST` | `/auth/register` | Register a new user |

---

## 💻 Local Setup

1.  **Clone & Install**
    ```bash
    git clone <your-repo-url>
    npm install
    ```

2.  **Run Locally**
    ```bash
    npx wrangler dev
    ```