# NoAutoPay (NAP)

NoAutoPay is a React Native app (Expo + Expo Router) for tracking subscriptions, upcoming renewals, and spending insights.

## Overview

- Auth flow powered by Clerk (sign in / sign up / email verification).
- Home dashboard with balance, upcoming renewals, and all subscriptions.
- Create-subscription modal with validation, category, frequency, and icon auto-matching.
- Insights screen with spend and renewal analytics.
- Shared subscriptions state across tabs (add/remove updates all views immediately).

## Features

- **Authentication**: Clerk-based auth and protected tab routes.
- **Subscription management**:
  - Create subscriptions from Home.
  - Auto-assign icon based on subscription name.
  - Remove subscriptions with confirmation.
- **Upcoming renewals**:
  - Horizontal cards on Home.
  - Renewal rollover logic for monthly/yearly plans.
- **Insights**:
  - Estimated monthly and annual spend.
  - Category spend breakdown.
  - Billing mix.
  - Upcoming renewal summary.
- **Analytics**:
  - PostHog user identify + screen tracking.

## Tech Stack

- **Framework**: Expo, React Native, Expo Router
- **Language**: TypeScript
- **Styling**: NativeWind + custom utility classes in `global.css`
- **Auth**: Clerk (`@clerk/expo`)
- **Analytics**: PostHog (`posthog-react-native`)
- **Utilities**: `dayjs`, `clsx`

## Project Structure

```text
app/
  _layout.tsx                # Root providers (PostHog, Clerk, fonts)
  onboarding.tsx
  (auth)/                    # Auth routes
    _layout.tsx
    sign-in.tsx
    sign-up.tsx
  (tabs)/                    # Main authenticated app
    _layout.tsx
    index.tsx                # Home
    subscriptions.tsx
    insights.tsx
    settings.tsx
    subscriptions-context.tsx

components/
  CreateSubscriptionModal.tsx
  SubscriptionCard.tsx
  UpcomingSubscriptionCard.tsx
  ListHeading.tsx

constants/
  data.ts
  icons.ts
  theme.ts

lib/
  utils.ts
  subscription-icon.ts
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```dotenv
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
EXPO_PUBLIC_POSTHOG_KEY=your_posthog_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Without these values, app startup will fail in `app/_layout.tsx`.

## Getting Started

### 1) Install dependencies

```powershell
npm install
```

### 2) Start Metro

```powershell
npm run start
```

### 3) Run on platform

```powershell
npm run android
npm run ios
npm run web
```

## Available Scripts

- `npm run start` - start Expo dev server
- `npm run android` - open on Android
- `npm run ios` - open on iOS
- `npm run web` - open on web
- `npm run lint` - run Expo lint checks

## Core Flows

### Auth Flow

- Users enter via `/(auth)` stack.
- Signed-in users are redirected to `/(tabs)`.
- Signed-out access to tabs redirects back to sign-in.

### Create Subscription Flow

- Open modal from Home `+` button.
- Validate name and price.
- Build subscription object (id, billing, start/renewal date, category, icon, color).
- Insert into shared tab-level state.
- New item appears in:
  - Home "All Subscriptions"
  - Home "Upcoming"
  - `Subscriptions` tab
  - `Insights` analytics

### Remove Subscription Flow

- Expand a subscription card.
- Tap "Remove subscription".
- Confirm action in native alert.
- Item is removed from shared state and all screens update.

## Design System

- Global utility classes are defined in `global.css`.
- Main component groups:
  - auth (`auth-*`)
  - modal (`modal-*`)
  - picker/category (`picker-*`, `category-*`)
  - home/subscription cards (`home-*`, `sub-*`, `upcoming-*`)
  - insights (`insights-*`)

## Troubleshooting

- **Error**: `Add your Clerk Publishable Key to your .env file`
  - Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`.
- **Error**: `Add your PostHog key to your .env.local file`
  - Set `EXPO_PUBLIC_POSTHOG_KEY` (and optionally `EXPO_PUBLIC_POSTHOG_HOST`).
- **No upcoming cards visible**
  - Upcoming uses renewal rollover logic (`getNextRenewalDate`) based on billing cadence.
- **Unexpected state reset after reload**
  - Current subscription state is in-memory (not persisted to backend/database yet).

## Notes

- Currency display is currently formatted as INR in `lib/utils.ts`.
- `app-example/` contains starter/sample reference code.
- `reset-project` script is defined in `package.json`, but `scripts/reset-project.js` is not currently present at project root.

## Roadmap

- Persist subscriptions to backend/database.
- Add edit subscription flow.
- Add filters/sorting in Subscriptions tab.
- Add notifications for upcoming renewals.
- Add tests for utility/date logic and core flows.
