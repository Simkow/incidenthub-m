# IncidentHub

A modern incident management platform for teams and individual operators. Log incidents, assign tasks, track progress, and collaborate — all in one clean workspace.

---

## Features

- **Workspaces & roles** — Create workspaces, invite team members, and manage access control
- **Tasks** — Create, assign, and track tasks with priorities, due dates, and status updates. AI-powered description enhancement included
- **Projects** — Set project goals, track overall completion progress, and manage deadlines
- **Calendar** — Schedule events, link them to tasks, and sync across the workspace
- **Notes** — Capture incident notes and insights with pinning and AI content enhancement
- **Inbox** — Centralized notifications for deadline alerts, invitations, and status changes
- **Themes** — 7 workspace themes (dark/light variants: Default, Blue, Beige, Orange, Purple)
- **i18n** — Full English and Polish localization
- **JWT auth** — Secure cookie-based authentication with middleware route protection

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Neon (serverless PostgreSQL) |
| Auth | JWT via `jose`, bcrypt password hashing |
| AI | OpenAI API (task/note enhancement) |
| Animations | Motion (Framer Motion) |
| UI | Radix UI |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- An OpenAI API key (for AI enhancement features)

### Installation

```bash
git clone https://github.com/your-username/incidenthub-m.git
cd incidenthub-m
npm install
```

### Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=postgres://...   # Neon connection string
JWT_SECRET=your-secret-key    # Random secret for JWT signing
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm run start
```

## Project Structure

```
app/
├── [user]/[workspace]/     # Authenticated workspace routes
│   ├── tasks/              # Task management
│   ├── project/            # Project overview & settings
│   ├── calendar/           # Calendar & event scheduling
│   ├── notes/              # Notes & insights
│   ├── inbox/              # Notifications & invitations
│   ├── members/            # Team member management
│   ├── profile/            # User profile settings
│   └── settings/           # Workspace theme settings
├── api/                    # Next.js API routes (REST)
├── home/                   # Landing page components
├── i18n/                   # EN / PL localization
├── login/ & register/      # Auth pages
└── lib/db.ts               # Database connection
middleware.ts               # JWT route protection
```

## Deployment

The easiest way to deploy is via [Vercel](https://vercel.com):

1. Push your repository to GitHub
2. Import the project in Vercel
3. Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`) in the Vercel dashboard
4. Deploy

## License

MIT
