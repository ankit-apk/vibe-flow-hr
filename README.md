# Vibe Flow HR

A modern HR management system with leave and expense tracking.

## Architecture

This project uses a custom backend and PostgreSQL, all managed with Docker Compose:

- **Backend**: Express.js API handling business logic and authentication (JWT-based).
- **Database**: PostgreSQL running in a Docker container.
- **Frontend**: React + Vite.

## Setup

1.  **Clone the repository**
2.  **Environment Variables**:
    - Copy `.env.example` to `.env`.
    - **Crucially, set a strong unique `JWT_SECRET` in your `.env` file.**
    - Review other variables like database credentials if you need to change defaults.
3.  **Install Frontend Dependencies** (if you plan to run Vite dev server separately):

    ```bash
    npm install
    ```

    (Note: The API server dependencies are installed within its Docker image.)

4.  **Run the Application using Docker Compose**:
    This command will build the API image (if not already built), start the API server and the PostgreSQL database, and apply database migrations.

    ```bash
    docker-compose up --build -d
    ```

    - `--build`: Forces a rebuild of the api image if `Dockerfile` or related files changed.
    - `-d`: Runs in detached mode.

5.  **Accessing the Application**:
    - The API server will be available at `http://localhost:3001` (or your `API_PORT`).
    - The Vite frontend (if you run it separately) typically runs on `http://localhost:8080`.

## Development

- **Run Everything with Docker Compose (Recommended for Backend Development)**:

  ```bash
  docker-compose up --build
  ```

  (View logs in the terminal. Use `docker-compose down` to stop.)

- **Run Frontend Vite Dev Server Separately**:
  Make sure your API is running (e.g., via `docker-compose up -d api postgres`).

  ```bash
  npm run dev
  ```

  This connects to the API specified by `VITE_API_URL` in your `.env` file.

- **Stopping Docker Compose Services**:
  ```bash
  docker-compose down
  ```
  To remove volumes (like database data):
  ```bash
  docker-compose down -v
  ```

## Database Migrations

The `init.sql` script in `scripts/db/` is automatically executed by the PostgreSQL container on its first start, creating the necessary tables.
If you modify `init.sql` after the database has been initialized, you'll need to stop and remove the `pgdata` volume and restart the containers for the changes to apply:

```bash
docker-compose down -v
docker-compose up --build -d
```

## API Endpoints (Examples)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Requires Auth Token)
- `POST /api/query` (Requires Auth Token)

## Testing

Database connection (from host, if API is running and port is exposed):

```bash
node scripts/db/test-connection.js
```

## Features

- Custom JWT-based user authentication.
- Role-based access for employees, managers, and HR.
- Leave request management.
- Expense tracking.
- Leave balance management.

## Tech Stack

- React 18, TypeScript, Vite
- Express.js, Node.js
- PostgreSQL
- Docker, Docker Compose
- Tailwind CSS, shadcn/ui components
- JWT for authentication
- bcrypt for password hashing
- React Router, React Hook Form, Zod, React Query

## Getting Started (Legacy - Supabase related, remove/update as needed)

### Prerequisites (Legacy)

- Supabase account and project (No longer needed)

### Authentication Setup (Legacy)

(Details about Supabase auth - remove or heavily revise)

## Deployment

1.  Ensure your `.env` file on the server has production-ready settings (especially `JWT_SECRET` and `NODE_ENV=production`).
2.  Build the API Docker image.
3.  Deploy the API container and PostgreSQL container using a similar `docker-compose.yml` or your platform's deployment mechanism.
4.  Build the frontend for production:
    ```bash
    npm run build
    ```
5.  Deploy the static assets from the `dist` folder to your preferred hosting platform.
