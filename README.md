# VibeFlow HR

A modern HR management application built with React, TypeScript, and Supabase.

## Features

- User authentication and role-based access control
- Leave management (request, approve, reject)
- Expense management (submit, approve, reject)
- Dashboard with analytics
- Modern UI with shadcn/ui components

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Supabase (Authentication, Database)
- React Router
- React Hook Form with Zod validation
- React Query

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vibe-flow-hr.git
cd vibe-flow-hr
```

2. Install dependencies:

```bash
npm install
```

3. Set up your Supabase project:

   - Create a new project on [Supabase](https://supabase.com)
   - Run the setup script:

   ```bash
   npm run setup
   ```

   - Follow the prompts to enter your Supabase URL and anon key
   - The script will help you apply the database migrations

4. Start the development server:

```bash
npm run dev
```

### Authentication Setup

1. Enable email/password authentication in your Supabase project.
2. **Important**: For users to be active immediately after registration (without email verification), go to your Supabase project settings -> Authentication -> Providers, and disable "Confirm email".
3. Configure email templates (e.g., for password reset) as needed.
4. Create test users through the Supabase authentication UI or programmatically if desired.

## Deployment

1. Build the application:

```

```
