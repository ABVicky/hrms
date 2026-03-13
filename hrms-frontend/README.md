# HRMS - Digital Agency Management System

A Progressive Web App (PWA) built with Next.js and Google Apps Script to manage human resources, attendance, leaves, and expenses.

## Features
- **Real-time Attendance**: Check-in and check-out with location tracking.
- **Announcement System**: Broadcast important news with auto-cleanup after 2 days.
- **Leave Management**: Submit and track leave requests with manager approval flow.
- **Expense Tracking**: Upload receipts and track reimbursement status.
- **Employee Directory**: Manage staff profiles and roles.
- **PWA Experience**: Installable on mobile and desktop devices.
- **Real-time Sync**: Automatic data synchronization every 10 seconds.

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS, Lucide Icons.
- **Backend**: Google Apps Script (Google Sheets as Database).
- **Authentication**: Custom AuthContext with persistent sessions.

## Development
1. Configure `.env.local` with `NEXT_PUBLIC_APPS_SCRIPT_URL`.
2. Run `npm run dev` to start the local server.
3. Deploy the backend code in `backend/Code.gs` as a Google Apps Script Web App.
