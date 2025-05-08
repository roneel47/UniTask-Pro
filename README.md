# UniTask Pro - Monorepo with Split Frontend/Backend

This project has been restructured into a separate frontend (Next.js) and backend (Node.js/Express), managed as a monorepo using npm workspaces.

## Project Structure

- `frontend/`: Contains the Next.js application.
- `backend/`: Contains the Node.js/Express API server.
- `package.json`: Root package file to manage workspaces and root-level scripts.

## Getting Started

1.  **Install Dependencies:**
    From the root directory of the project, run:
    ```bash
    npm install
    ```
    This command will install dependencies for both the `frontend` and `backend` workspaces defined in the root `package.json`, as well as any root-level development tools (like `concurrently`).

2.  **Environment Variables:**
    -   **Backend:** Navigate to the `backend` directory (`cd backend`). Create a `.env` file. You can copy `backend/.env.example` if it exists, or follow instructions in `backend/README.md`. A typical backend `.env` might look like:
        ```
        PORT=3001
        # GOOGLE_API_KEY=your_google_api_key_for_genkit 
        # Add other environment variables as needed
        ```
    -   **Frontend:** Navigate to the `frontend` directory (`cd frontend`). Create a `.env.local` file if needed for frontend-specific environment variables, as described in `frontend/README.md`. A typical frontend `.env.local` might include:
        ```
        NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
        ```
    After setting up environment variables in the respective subdirectories, you can return to the root directory (`cd ..`) to use the root-level npm scripts.

3.  **Running Development Servers:**

    You have multiple options to run the development servers:

    *   **Concurrently (from the root directory):**
        To run both frontend and backend development servers simultaneously with a single command from the root:
        ```bash
        npm run dev
        ```
        - The backend server will typically run on `http://localhost:3001`.
        - The Next.js frontend development server will typically run on `http://localhost:9002`.

    *   **Individually (from the root directory):**
        To run only the frontend development server:
        ```bash
        npm run dev:frontend
        ```
        To run only the backend development server:
        ```bash
        npm run dev:backend
        ```

    *   **Individually (from subdirectories):**
        You can also navigate into each project's directory and run its development server directly:
        - For the backend:
          ```bash
          cd backend
          npm run dev
          # cd .. (to return to root)
          ```
        - For the frontend:
          ```bash
          cd frontend
          npm run dev
          # cd .. (to return to root)
          ```

4.  **Other Useful Scripts (from root):**
    The root `package.json` provides other convenience scripts to manage both workspaces:
    - `npm run build`: Builds both frontend and backend applications for production.
    - `npm run build:frontend`: Builds only the frontend application.
    - `npm run build:backend`: Builds only the backend application.
    - `npm run start`: Starts the production versions of both frontend and backend.
    - `npm run lint:frontend`: Lints the frontend codebase.
    - `npm run typecheck:frontend`: Typechecks the frontend codebase.
    - `npm run genkit:dev:backend`: Starts Genkit development server for the backend.
    - `npm run genkit:watch:backend`: Starts Genkit development server with watch mode for the backend.

    Explore the `scripts` section in the root `package.json` for all available commands.

Refer to the README files within the `frontend` (`frontend/README.md`) and `backend` (`backend/README.md`) directories for more specific instructions, configurations, and details pertaining to each part of the application.
