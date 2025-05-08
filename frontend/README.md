# UniTask Pro - Frontend

This is the Next.js frontend for UniTask Pro.

## Getting Started

1.  **Ensure the backend server is running.** (See `../backend/README.md` for backend setup instructions).

2.  **Install Dependencies:**
    From the `frontend` directory, run:
    ```bash
    npm install
    ```
    Or, if you are in the root directory of the monorepo:
    ```bash
    npm install --workspace=frontend 
    ```
    (The root `npm install` should also handle this if workspaces are configured correctly).

3.  **Run the Development Server:**
    From the `frontend` directory:
    ```bash
    npm run dev
    ```
    Or, from the root directory of the monorepo:
    ```bash
    npm run dev:frontend
    ```
    The application will typically be available at `http://localhost:9002`.

## Environment Variables

The frontend application requires an environment variable to connect to the backend API.

Create a `.env.local` file in the `frontend` directory (i.e., `frontend/.env.local`).

Add the following line to your `.env.local` file:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```
Adjust the URL if your backend server runs on a different port or host. `NEXT_PUBLIC_` prefix is important for Next.js to expose the variable to the browser.

## Project Structure

-   `src/app/`: Contains the main application routes and pages, using Next.js App Router.
    -   `(auth)/`: Layout and pages for authentication (login, register).
    -   `(main)/`: Layout and pages for the authenticated application (dashboard, task management, etc.).
-   `src/components/`: Reusable UI components.
    -   `auth/`: Components specific to authentication forms.
    -   `common/`: General purpose components like Logo.
    -   `kanban/`: Components for the Kanban board functionality.
    -   `layout/`: Components related to page structure (Header, Sidebar, Theme Toggle).
    -   `ui/`: ShadCN UI components.
-   `src/contexts/`: React Context providers for managing global state (Auth, Data, Theme).
-   `src/hooks/`: Custom React hooks for reusing stateful logic.
-   `src/lib/`: Utility functions, configuration, and constants.
-   `src/types/`: TypeScript type definitions.
-   `public/`: Static assets.
-   `tailwind.config.ts`: Tailwind CSS configuration.
-   `next.config.ts`: Next.js configuration.

## Available Scripts

Within the `frontend/package.json`, you can find scripts like:

-   `npm run dev`: Starts the Next.js development server (typically on port 9002).
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts a Next.js production server.
-   `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.
-   `npm run typecheck`: Runs TypeScript type checking.

Refer to the root `README.md` for commands to manage both frontend and backend workspaces simultaneously.
