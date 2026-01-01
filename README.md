# Nexarq Task App (AI-Powered Serverless API)

A serverless task management API built on **Cloudflare Workers**. This application leverages **Edge Intelligence** to automatically categorize tasks using the **Llama-3** AI model and ensures data persistence with **Cloudflare D1** (SQLite).

**🚀 Live Demo:** [https://nexarq-task-app.dattuchalumuru5236.workers.dev](https://nexarq-task-app.dattuchalumuru5236.workers.dev)

---

## 🏗 System Architecture

The application follows a modern serverless architecture designed for low latency and global scalability:

* **Runtime:** Cloudflare Workers (V8 Isolate) for near-instant cold starts.
* **Framework:** Hono (Lightweight web framework for the Edge).
* **Database:** Cloudflare D1 (Serverless SQLite) for relational data and ACID transactions.
* **AI Inference:** Workers AI (@cf/meta/llama-3-8b-instruct) for real-time task analysis.
* **Caching:** Cloudflare KV (Key-Value Store) for high-speed data retrieval.
* **Security:** API Secret authentication for write operations.

---

## ✨ Key Features

1.  **Edge Intelligence (AI Integration)**
    * Automatically analyzes task descriptions upon creation.
    * Uses **Llama-3** to generate relevant tags (e.g., "Bug", "Critical", "Feature") without user intervention.
    
2.  **CRUD Operations**
    * **GET /tasks**: Fetches all tasks, ordered by creation date.
    * **POST /tasks**: Securely creates new tasks with automatic AI tagging.

3.  **Security & Robustness**
    * Protected by `x-api-secret` header authentication.
    * Environment variable management for secrets.
    * Input validation and error handling for all endpoints.

---

## 🛠 API Documentation

### 1. List All Tasks
Fetches the list of tasks from the D1 database.

* **Endpoint:** `GET /tasks`
* **Auth:** Public
* **Example Request:**
    ```bash
    curl [https://nexarq-task-app.dattuchalumuru5236.workers.dev/tasks](https://nexarq-task-app.dattuchalumuru5236.workers.dev/tasks)
    ```

### 2. Create a Task (AI Powered)
Creates a new task and triggers the AI model to generate tags based on the description.

* **Endpoint:** `POST /tasks`
* **Auth:** Required (`x-api-secret`)
* **Headers:**
    * `Content-Type: application/json`
    * `x-api-secret: my-super-secret-password-123`
* **Body:**
    ```json
    {
      "user_id": 1,
      "title": "Fix Login Bug",
      "description": "Users on Firefox cannot login to the dashboard."
    }
    ```
* **Example Response:**
    ```json
    {
      "message": "Task created with AI tags",
      "tags": "Bug, Firefox, Critical",
      "id": 42
    }
    ```

---

## 💻 Local Development Setup

To run this project locally, you need [Node.js](https://nodejs.org/) and [Wrangler](https://developers.cloudflare.com/workers/wrangler/) installed.

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