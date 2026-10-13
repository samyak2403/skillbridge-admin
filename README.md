# skillbridge-admin

## SkillBridge Admin Mobile & Web Portal (React Native / Expo)

A comprehensive, production-grade **React Native** Admin Application for the **SkillBridge Student Freelance Marketplace**.

---

## 🚀 Key Admin Features

### 1. Platform Dashboard & KPIs (`DashboardScreen`)
- **Live Marketplace Metrics**: Total Users, Verified Freelancers, Total Job Listings, Active Contracts, Gross Escrow Volume.
- **Urgent Action Alerts**: Instant highlight of pending bank withdrawal requests needing review.
- **Quick Action Hub**: 1-tap shortcuts to verify users, moderate jobs, release escrow, and dispatch broadcasts.
- **Real-Time Feeds**: Displays latest user signups and newly posted projects live from Firestore.

### 2. User Management & Verification (`UsersScreen`)
- **Dynamic Filtering**: View All, Freelancers, Clients, Unverified, or Verified.
- **Search**: Instant filter by Name, Email, College/University, or Course.
- **Verification Badge Control**: 1-tap toggle to grant or revoke the official verified badge (`isVerified: true/false`).
- **Role Switching**: Seamlessly change user role between `FREELANCER` and `CLIENT`.
- **Account Actions**: Deep profile modal inspection and user deletion.

### 3. Job Catalog & Content Moderation (`ProjectsScreen`)
- **Project Oversight**: Real-time supervision of all posted student freelance jobs.
- **Status Filter**: `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- **Lifecycle Overrides**: Manually update project status directly from admin dashboard.
- **Moderation Actions**: Inspect scope of work, budget range, required skills, and remove inappropriate postings.

### 4. Contracts & Escrow Oversight (`ContractsScreen`)
- **Escrow Supervision**: Tracks agreed budgets, client-freelancer pairing, and milestone progress.
- **Manual Escrow Release**: Directly release milestone or full contract funds to the freelancer's wallet.
- **Dispute Resolution**: Override and mark contracts as `COMPLETED` or `CANCELLED` with refund logic.
- **Milestone Breakdown**: View delivery notes and submission details.

### 5. Financial Ledger & Payout Approvals (`TransactionsScreen`)
- **Platform Ledger**: Tracks all transactions (`EARNING`, `WITHDRAWAL`, `ESCROW`).
- **Withdrawal Approvals**: Approve bank payouts and dispatch completion notifications.
- **Withdrawal Rejections**: Reject invalid payout requests with custom reason notes.

### 6. Push Announcements & Broadcasts (`BroadcastScreen`)
- **Audience Targeting**: Send in-app system notifications to `All Users`, `Freelancers Only`, or `Clients Only`.
- **Quick Templates**: One-tap templates for Maintenance Notices, Milestone Reminders, and Gig Alerts.
- **Multi-user Dispatch**: Writes real-time notifications across all target users in Firestore.

### 7. Reviews & Ratings Moderation (`ReviewsScreen`)
- **Review Oversight**: Monitor freelancer and client feedback across the platform.
- **Abuse Moderation**: Delete fake or abusive ratings.


### 8. Proposals & Bids Management (`ProposalsScreen`)
- **Campus Bids Oversight**: Search and inspect candidate student applications across all posted jobs.
- **Bid Terms Inspection**: Monitor proposed bid pricing (₹), timeline turnaround in days, cover letters, and applicant skill tags.
- **Lifecycle Overrides**: Accept, Shortlist, or Reject proposals directly from the admin panel.
- **Spam Moderation**: Permanently remove fraudulent bids or duplicate proposals.

### 9. Deep Project Inspection (`ProjectDetailScreen`)
- **Full Project Specification**: Deep drill-down with budget range, deadlines, required skills, attachments, and client background.
- **Attached Proposals Tab**: Real-time list of all bids submitted specifically for the project.
- **Contract & Milestones Tab**: Track assigned student, milestone roadmaps, delivery links, and escrow protection.
- **Moderation Actions**: Override project lifecycle or transmit direct admin notifications to the client.

### 10. Disputes & Escrow Mediation (`DisputesScreen`)
- **Dispute Supervision**: Monitor contested contracts, revision loops, and stalled milestone deliverables.
- **Vault Escrow Overview**: Real-time ledger of funds held in escrow pending arbitration.
- **Arbitration Verdicts**: 
  - *Arbitrate & Release*: Force-release escrow to student freelancer wallet upon verified delivery.
  - *Arbitrate & Refund*: Cancel contract and refund escrow funds to client.
- **Mediation Directives**: Dispatch formal platform mediator instructions to both counterparties.

### 11. Marketplace Analytics & KPIs (`AnalyticsScreen`)
- **Gross Merchandise Value (GMV)**: Real-time platform gross transaction volume.
- **Student-to-Client Ratios**: Visual bar breakdown of marketplace supply and demand.
- **Category Specialization**: Distribution across Web, Mobile, UI/UX, Content, and AI projects.
- **Pipeline Health**: Funnel tracking from posted jobs to funded contracts and completed work.

### 12. Global Platform Settings (`PlatformSettingsScreen`)
- **Marketplace Economics**: Student commission percentage (0%), client handling fee (%), and minimum project listing budget.
- **Campus Domain Whitelist**: Manage institutional email domains eligible for verified student badges (e.g. `@amietv.org`, `@unipune.ac.in`).
- **Maintenance Controls**: Global maintenance mode toggle with customizable outage message banner.
- **Cloud Diagnostics**: Real-time status indicators for Firebase Firestore, Auth, and Security Rules.

---

## 🛠️ Setup & Running

From the `admin` folder:

```bash
cd admin

# Install dependencies
npm install

# Start development server
npx expo start

# Run on Web (Browser)
npm run web

# Build for Web production (exports to dist/)
npm run build

# Run on Android Emulator or Device
npm run android
```

---

## 📂 Architecture & Directory Structure

```
admin/
├── App.js                         # Application root with SafeArea & Navigation
├── app.json                       # Expo project configuration
├── package.json                   # Dependencies & scripts
├── src/
│   ├── config/
│   │   └── firebase.js            # Live Firebase Firestore & Auth connection
│   ├── theme/
│   │   └── colors.js              # SkillBridge brand color tokens
│   ├── services/
│   │   └── adminService.js        # Real-time Firestore admin queries & operations
│   ├── navigation/
│   │   └── RootNavigator.js       # Desktop & Mobile Navigation Controller
│   ├── components/
│   │   ├── AdminHeader.js         # Admin branding and live status indicator
│   │   ├── AdminSidebar.js        # Collapsible responsive navigation drawer
│   │   ├── StatCard.js            # KPI metrics cards
│   │   ├── StatusBadge.js         # Color-coded status pills
│   │   └── SearchBar.js           # Search and tab filter bar
│       ├── AdminLoginScreen.js    # Split-screen Admin Login & Admin Registration hub
│       ├── AdminProfileScreen.js  # Root admin account, staff directory & provision modal
│       ├── DashboardScreen.js     # Platform KPIs and quick action hub
│       ├── UsersScreen.js         # User catalog, verification & role toggles
│       ├── UserDetailScreen.js    # Deep user profile, portfolio & activity
│       ├── ProjectsScreen.js      # Project catalog & status overrides
│       ├── ProjectDetailScreen.js # Full project brief, bids & milestones
│       ├── ProposalsScreen.js     # Student proposal bids & acceptance hub
│       ├── ContractsScreen.js     # Active contracts & milestone escrow releases
│       ├── DisputesScreen.js      # Escrow arbitration & mediation console
│       ├── TransactionsScreen.js  # Financial ledger & payout approvals
│       ├── BroadcastScreen.js     # Targeted push notification broadcaster
│       ├── ReviewsScreen.js       # Rating moderation & abuse prevention
│       ├── AnalyticsScreen.js     # GMV, funnel metrics & category demand
│       └── PlatformSettingsScreen.js # Global policies, fees & campus whitelist
```

---

## 🔐 Administrator Authentication & Registration

The Admin Web portal provides a dual-mode authentication center:

1. **Sign In Mode (`AdminLoginScreen.js`)**:
   - Access console with official admin email & password.
   - Real-time Firebase Authentication verification with Firestore `admins` profile synchronization.
   - Quick Demo Access shortcuts (`Super Admin`, `Manuel Elizondo`).

2. **Register Admin Mode (`AdminLoginScreen.js`)**:
   - Self-provision administrator accounts with full name, official email, and credentials.
   - **Role Assignment**: Super Administrator, Operations Director, Trust & Safety Lead, Dispute Arbitrator, Finance & Compliance Officer, Customer Support Lead.
   - **Security Master Key**: Protected by platform authorization key (`SKILLBRIDGE2026`) preventing unauthorized signups.
   - Immediate automatic login & Firestore/Local persistence.

3. **Staff Directory & Provisioning (`AdminProfileScreen.js` -> Staff Directory Tab)**:
   - View all registered administrators, active roles, departments, email addresses, and assigned permissions.
   - Provision additional administrator accounts directly from within the console using the built-in modal.

---

## 🌐 Deploying to Vercel

The SkillBridge Admin Web Portal is pre-configured for seamless, zero-config deployment on **[Vercel](https://vercel.com)**.

### Option 1: Git Integration (Vercel Dashboard)

1. **Import the Repository**:
   - Navigate to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub account and import the repository: `samyak2403/skillbridge-admin`.

2. **Configure Project Settings**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` *(or `admin` if imported from a monorepo)*
   - **Build Command**: `npm run build` *(or `npx expo export -p web`)*
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables** *(Optional)*:
   If configuring custom Firebase credentials, add the following under **Project Settings > Environment Variables**:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`

   > *Note: If no environment variables are set, the portal safely falls back to default project credentials.*

4. **Deploy**:
   - Click **Deploy**. Vercel will export the web bundle to `dist/` and serve it globally with edge caching.

---

### Option 2: Deploy via Vercel CLI

Deploy directly from your terminal in seconds:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy a preview build
vercel

# Deploy to production
vercel --prod
```

---

### ⚙️ Vercel Configuration Highlights (`vercel.json`)

- **Single Page App (SPA) Rewrites**: All deep routes (e.g. `/users`, `/projects`, `/disputes`) rewrite to `/index.html`, eliminating 404 errors on browser page reloads.
- **Edge Cache Optimization**: Long-term immutable caching (`Cache-Control: public, max-age=31536000, immutable`) for `/_expo/static/**` JavaScript bundles and `/assets/**` fonts & images.
- **Build Output**: Targets the `dist` directory generated by `expo export -p web`.
