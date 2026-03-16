# 🚀 ASPIRE Portal - Final Launch Checklist

Congratulations! Your HR Management System (HRMS) is now feature-complete and ready for production launch. Follow this guide to ensure a smooth deployment.

## 1. Backend Finalization (Google Apps Script)
- [ ] **Sync Code**: Ensure the latest `Code.gs` from your local folder is copied into the Apps Script editor.
- [ ] **Deploy as Web App**:
    - Click **Deploy** > **New Deployment**.
    - Type: **Web App**.
    - Configuration:
        - **Execute as**: Me (Your Account).
        - **Who has access**: Internal/Anyone (Internal recommended for security).
- [ ] **Permissions**: Make sure you have authorized the script to access Google Sheets, Drive, and the Cache Service.

## 2. Frontend Configuration
- [ ] **Check API URL**: In your `hrms-frontend`, verify that the backend API URL matches your latest Apps Script deployment URL.
- [ ] **Test Admin Access**: Log in as a 'Super Admin' and verify you can see the **System Diagnostics (v1.5)** in Settings.
- [ ] **Notification Test**: Trigger the "Test Notification" in Settings to verify Chrome/Safari/Edge permissions.

## 3. SEO & Branding
- [ ] **Manifest Proofing**: Verified that `manifest.ts` correctly identifies the app as 'ASPIRE Digital Agency'.
- [ ] **Icons**: All 192/512 icons are in the `public` folder and loaded by the browser.

## 4. Maintenance Highlights (v1.5)
- **Auto-Cleanup**: The system now automatically prunes older data:
    - **Notifications**: Deleted after 7 days to keep the sheet light.
    - **Announcements**: Deleted after 14 days.
- **Hierarchical Approval**: Leave and Expense workflows are verified: Employee -> Manager -> HR/Finance.
- **PWA Ready**: The app is fully installable on mobile devices via the browser options menu.

## 5. Hosting (Production)
- [ ] **Build Command**: Run `npm run build` locally to ensure no TypeScript errors.
- [ ] **Deploy**: Push to your preferred hosting provider (Vercel, Netlify, etc.).

---
**Launch Note**: Once the first set of employees is imported, remind them to enable browser notifications on their first login for the full "Push" experience.
