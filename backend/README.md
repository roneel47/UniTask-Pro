# UniTask Pro - Backend

This is the Node.js/Express backend for UniTask Pro.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env` file in this directory. You can copy `.env.example` if provided:
    ```
    PORT=3001
    # Add other environment variables like database connection strings, API keys, etc.
    # GOOGLE_API_KEY=your_google_api_key_for_genkit 
    ```
3.  Build the TypeScript code:
    ```bash
    npm run build
    ```
4.  Run the server:
    ```bash
    npm run start
    ```
    Or, for development with auto-reloading:
    ```bash
    npm run dev
    ```
    The API will typically be available at `http://localhost:3001`.

## API Endpoints

(List of API endpoints will be documented here as they are developed)

-   `POST /api/auth/register`: Register a new user.
-   `POST /api/auth/login`: Login an existing user.
-   `GET /api/users`: Get all users (master-admin only).
-   `PATCH /api/users/:userId`: Update a user (master-admin only).
-   `DELETE /api/users/:userId`: Delete a user (master-admin only).
-   `POST /api/tasks/assignments/meta`: Create a task assignment metadata entry.
-   `GET /api/tasks/assignments/meta/admin/:adminUsn`: Get task assignment metadata for a specific admin.
-   `DELETE /api/tasks/assignments/meta/:metaId`: Delete a task assignment metadata entry and associated tasks.
-   `POST /api/tasks`: Create tasks for users based on assignment criteria.
-   `GET /api/tasks/user/:usn`: Get tasks for a specific user.
-   `PATCH /api/tasks/:taskId`: Update a task (e.g., status, submission file).
-   `DELETE /api/tasks/:taskId`: Delete a specific task.

## Data Storage

User and task data is currently stored in JSON files in the `src/data` directory. This is for demonstration purposes and should be replaced with a proper database in a production environment.
Data files (`users.json`, `tasks.json`, `taskAssignmentsMeta.json`) will be created automatically if they don't exist when the server starts or when data is first written.
