# PostPartner AI

AI-powered social media content creation, scheduling, and analytics platform.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blue?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)

---

## Overview

PostPartner AI is a full-stack social media management tool that helps creators, marketers, and agencies generate on-brand content at scale. It combines AI-powered post generation with scheduling, analytics, team collaboration, and multi-platform publishing.

## Features

- **AI Content Generation** — Generate captions, carousels, stories, and video content with AI tailored to your brand voice
- **Brand Analysis** — AI-powered brand voice extraction from any website URL
- **Multi-Platform Support** — Instagram, LinkedIn, Facebook, Twitter/X, TikTok, YouTube, Pinterest, Threads, BlueSky
- **Content Calendar** — Visual planner with drag-and-drop scheduling
- **Bulk Scheduling** — Schedule multiple posts across optimal time slots
- **Post Previews** — Live mockups for each platform (feed, story, carousel, video)
- **Analytics Dashboard** — Track views, clicks, likes, comments, shares, and engagement rates
- **Team Collaboration** — Invite team members, assign roles, share posts for approval
- **Media Library** — Upload and manage images/videos with Supabase storage
- **Dark Mode** — Full dark/light theme support
- **AI Content Suggestions** — Get trending content ideas based on your brand and industry
- **Export & Share** — Export posts as images, copy captions, share review links

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | OpenAI via Supabase Edge Functions |
| Charts | Recharts |
| Routing | React Router DOM v6 |
| State | TanStack React Query |
| Forms | React Hook Form + Zod |

## Project Structure

```
src/
├── components/
│   ├── dashboard/          # Dashboard widgets (Hero, Stats, QuickActions, ConnectedAccounts)
│   ├── icons/              # Social platform SVG icons
│   ├── schedule/           # Schedule calendar & timeline views
│   ├── ui/                 # shadcn/ui primitives (48 components)
│   ├── AppLayout.tsx       # Main layout with sidebar + mobile nav
│   ├── AppSidebar.tsx      # Desktop sidebar navigation
│   ├── BulkScheduleDialog.tsx
│   ├── CalendarGrid.tsx
│   ├── CarouselPreview.tsx
│   ├── ContentSuggestions.tsx
│   ├── ExportPostButton.tsx
│   ├── PlatformMockups.tsx
│   ├── PostPreview.tsx
│   ├── ScheduleDialog.tsx
│   ├── ShareComments.tsx
│   ├── SocialConnectDialog.tsx
│   ├── StoryPreview.tsx
│   └── VideoPreview.tsx
├── hooks/
│   ├── useAuth.ts          # Authentication hook
│   ├── useProfile.ts       # User profile management
│   ├── useSharePost.ts     # Post sharing functionality
│   ├── use-mobile.tsx      # Mobile detection
│   └── use-toast.ts        # Toast notifications
├── integrations/
│   └── supabase/
│       ├── client.ts       # Supabase client config
│       └── types.ts        # Auto-generated DB types
├── pages/
│   ├── Index.tsx           # Dashboard
│   ├── Auth.tsx            # Sign in / Sign up
│   ├── Onboarding.tsx      # New user onboarding flow
│   ├── Brands.tsx          # Brand management
│   ├── Generate.tsx        # AI post generation
│   ├── Planner.tsx         # Content calendar
│   ├── Schedule.tsx        # Post scheduling
│   ├── Analytics.tsx       # Performance analytics
│   ├── Media.tsx           # Media library
│   ├── Team.tsx            # Team management
│   ├── Settings.tsx        # User settings & social connections
│   ├── SharedPost.tsx      # Public shared post view
│   └── NotFound.tsx        # 404 page
├── lib/
│   └── utils.ts            # Utility functions (cn)
├── App.tsx                 # Root component with routes
├── main.tsx                # Entry point
└── index.css               # Global styles & CSS variables
supabase/
├── config.toml             # Supabase project config
├── functions/              # Edge functions
│   ├── analyze-brand/      # AI brand analysis
│   ├── auto-publish/       # Auto-publish scheduled posts
│   ├── generate-image/     # AI image generation
│   ├── generate-post/      # AI post content generation
│   ├── generate-video/     # AI video/animation generation
│   ├── linkedin-oauth/     # LinkedIn OAuth helper
│   ├── notify-comment/     # Comment notification emails
│   └── suggest-content/    # AI content suggestions
└── migrations/             # SQL migrations (10 files)
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ and npm
- A [Supabase](https://supabase.com/) project (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/MalikZeeshan1122/postpartner-connect-33930429.git

# Navigate to the project
cd postpartner-connect-33930429

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## Database Schema

The app uses 12 Supabase tables:

- `profiles` — User profiles (role, goal, avatar, notification preferences)
- `brands` — Brand configurations with AI-extracted voice
- `content_plans` — Content planning containers
- `plan_items` — Individual content plan entries
- `post_variations` — AI-generated post variations
- `scheduled_posts` — Posts scheduled for publishing
- `post_analytics` — Performance tracking metrics
- `shared_posts` — Posts shared for team review
- `share_comments` — Comments on shared posts
- `social_connections` — Connected social media accounts
- `team_invitations` — Team member invitations
- `user_roles` — Team member roles and permissions

## License

This project is private. All rights reserved.
