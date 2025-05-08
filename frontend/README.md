# UniTask Pro - Frontend

This is the Next.js frontend for UniTask Pro.

## Getting Started

1.  Ensure the backend server is running (see `../backend/README.md`).
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## Environment Variables

The frontend may require environment variables to configure the API endpoint. Create a `.env.local` file in this directory if needed:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

(Adjust the URL if your backend runs on a different port or host).
