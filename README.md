# Codex Couples - Admin Dashboard

A web-based admin panel to manage the Codex Couples app.

## Features

- 📊 **Dashboard** - Overview of app statistics
- 👥 **Users Management** - View, search, and delete users
- 💕 **Couples Management** - View and manage connected couples
- 📸 **Memories** - View and moderate shared photos
- 💬 **Messages** - View and moderate chat messages
- ⚙️ **Settings** - Configure admin preferences

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment (optional):
   - The admin dashboard connects to the backend at `http://localhost:8000` by default
   - Modify `src/services/api.ts` for production

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3001 in your browser

## Admin Login

Default credentials (configure in backend `.env`):
- Email: `admin@codex-couples.com`
- Password: `admin123`

**Important:** Change these credentials in production!

Set in your backend `.env` file:
```
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready for deployment.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- Axios (API calls)

