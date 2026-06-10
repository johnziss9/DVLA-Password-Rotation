# DVLA API Password Rotation Tool — Plan

## Overview

A protected internal web app to manage DVLA API password rotation every 90 days.
Hosted in Azure, accessible to authorised users only.

---

## Problem

The DVLA API password expires every 90 days. The rotation process requires:
1. Calling a DVLA endpoint to trigger a verification code (sent via email)
2. Entering the code and calling a second DVLA endpoint to rotate the password
3. Updating the new password in Azure App Service (production + sandbox deployment slot)

---

## Solution

A Node.js/React web app that:
- Automatically triggers the verification email on a schedule (~day 85)
- Lets an authorised user enter the verification code
- Rotates the password with DVLA
- Updates the Azure App Service env var automatically
- (Future) Shows logs and password history

---

## Architecture

```
[node-cron — every ~85 days]
        |
        v
Call DVLA Endpoint 1  ->  verification email sent to user
        |
        v
[User opens web app — logs in via Entra ID]
        |
        v
User enters verification code from email
        |
        v
Submit -> Call DVLA Endpoint 2  ->  password rotated
        |
        v
Update Azure App Service env var (prod + sandbox slot)
via Azure Management API
        |
        v
Success / failure shown to user
```

---

## Hosting

| Detail | Value |
|---|---|
| Platform | Azure App Service |
| Plan | Existing P0v3 plan (no extra cost) |
| Deployment | New Web App on existing plan |
| Environment | Production + Sandbox (deployment slot) |

---

## Tech Stack

| Concern | Tool |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Auth | MSAL Node (Entra ID / Azure AD) |
| Scheduler | `node-cron` |
| Azure Management | `@azure/arm-appservice` + `@azure/identity` |
| Styling | Tailwind CSS |
| Secrets | App Service Application Settings |

---

## Project Structure

```
dvla-rotation-tool/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.jsx     # Verification code form
│   │   ├── components/
│   │   └── App.jsx
│   └── package.json
├── server/                  # Express backend
│   ├── routes/
│   │   ├── dvla.js          # DVLA endpoint calls
│   │   └── auth.js          # Entra ID / MSAL
│   ├── scheduler.js         # node-cron job
│   ├── azureManager.js      # Azure Management API calls
│   └── index.js
├── package.json
└── .env.example
```

---

## Auth

- **Provider**: Azure Entra ID (formerly Azure AD)
- **Method**: MSAL Node — users log in with their Microsoft account
- **Access control**: Restricted to specific users or a security group via the App Registration

---

## App Settings (Secrets)

These are stored in the **new web app's** Application Settings in Azure — not in code.

### Entra ID (auth)
| Setting | Description |
|---|---|
| `ENTRA_TENANT_ID` | Azure AD tenant ID |
| `ENTRA_CLIENT_ID` | App Registration client ID |
| `ENTRA_CLIENT_SECRET` | App Registration client secret |
| `SESSION_SECRET` | Random secret for Express session |

### Azure Management API (to update existing app's env var)
| Setting | Description |
|---|---|
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_RESOURCE_GROUP` | Resource group of the existing App Service |
| `AZURE_APP_SERVICE_NAME` | Name of the existing App Service |
| `AZURE_SP_CLIENT_ID` | Service principal client ID |
| `AZURE_SP_CLIENT_SECRET` | Service principal client secret |

### DVLA API
| Setting | Description |
|---|---|
| `DVLA_USERNAME` | DVLA API username |
| `DVLA_EMAIL` | Email address that receives verification codes |
| `DVLA_SANDBOX_REQUEST_URL` | Sandbox URL for requesting verification code |
| `DVLA_PROD_REQUEST_URL` | Production URL for requesting verification code |
| `DVLA_SANDBOX_ROTATE_URL` | Sandbox URL for rotating password |
| `DVLA_PROD_ROTATE_URL` | Production URL for rotating password |

---

## DVLA Endpoints

### Endpoint 1 — Request Verification Code
| Field | Value |
|---|---|
| Sandbox URL | `https://uat.driver-vehicle-licensing.api.gov.uk/thirdparty-access/v1/new-password` |
| Production URL | `https://driver-vehicle-licensing.api.gov.uk/thirdparty-access/v1/new-password` |
| Method | POST |
| Headers | None required |
| Body | `{ userName, email }` |
| Trigger | Automated via node-cron (~day 85) + manual button in UI |

### Endpoint 2 — Rotate Password
| Field | Value |
|---|---|
| Sandbox URL | `https://uat.driver-vehicle-licensing.api.gov.uk/thirdparty-access/v1/password` |
| Production URL | `https://driver-vehicle-licensing.api.gov.uk/thirdparty-access/v1/password` |
| Method | POST |
| Headers | `Content-Type: application/json` |
| Body | `{ userName, verifyCode, newPassword }` |
| New password | Auto-generated server-side (12 chars, upper/lower/digit/special) |
| Trigger | On user form submission |

---

## Azure Resource Details

| Detail | Value |
|---|---|
| App Service Name | TBD |
| Resource Group | TBD |
| Subscription ID | TBD |
| Sandbox Slot Name | TBD |

---

## Build Steps

Each step is independently testable before moving to the next.

**Step 1 — Project scaffold** ✅
Set up the monorepo structure, initialise `package.json` for both `client/` and `server/`, install dependencies.

**Step 2 — Express server (bare bones)** ✅
Basic Express app running on a port, health check route, `.env` config loading.

**Step 3 — Entra ID auth** ✅
Wire up MSAL Node on the server, protect routes, add login/logout flow. Test that unauthenticated users get redirected. Access restricted to assigned users via Enterprise Application assignment.

**Step 4 — React frontend** ✅
Vite + React + Tailwind set up. UI includes explicit environment selector (Production/Sandbox) with colour differentiation — form is gated until environment is chosen. Production shown in red with warning banner, sandbox in blue.

**Step 5 — DVLA Endpoint 1 (trigger verification email)** ✅
`POST /api/dvla/request-code` — calls DVLA with `userName` and `email` from env vars. Environment-aware (sandbox vs production URLs).

**Step 6 — DVLA Endpoint 2 (rotate password)** ✅
`POST /api/dvla/rotate` — accepts verification code from user, auto-generates a secure password server-side (12 chars, upper/lower/digit/special), calls DVLA to rotate. Azure update stubbed with TODO for Step 7.

**Step 7 — Azure Management API**
After successful rotation, update the env var on the App Service (prod + sandbox slot).

**Step 8 — node-cron scheduler**
Automate Step 5 to run every ~85 days.

**Step 9 — Deploy to Azure**
Create the new Web App on the existing P0v3 plan, configure App Settings, deploy.

---

## Development Notes & Issues Encountered

### Node.js Version Incompatibility
Vite 8 requires Node.js 20.19+ or 22.12+. The local machine runs 20.18.1. Rather than upgrading Node (which could break other projects), Vite was downgraded to v5 which is fully compatible and functionally identical for this project.

### Entra ID — Client Secret ID vs Client Secret Value
When creating a client secret in Azure, the portal shows two columns: **Secret ID** (a GUID) and **Value** (the actual secret string). The `.env` must contain the **Value**, not the Secret ID. If the value is hidden (`***`) after leaving the page, delete the secret and create a new one — copy the Value immediately before navigating away.

### MSAL PKCE Requirement
MSAL Node uses PKCE (Proof Key for Code Exchange) by default. The initial auth implementation was missing the PKCE code verifier/challenge, causing `Authentication failed` errors on callback. Fix: generate PKCE codes during `/auth/login`, store the verifier in the session, and pass it back during `/auth/callback`.

### Development Session / Cross-Port Cookie Issue
Running Express on port 3000 and Vite on port 5173 simultaneously caused session cookies to not be shared across the two origins, resulting in `requireAuth` always redirecting API calls to `/auth/login` even after logging in. The fix was to route everything through Express on port 3000 — Express proxies non-API, non-auth requests to the Vite dev server using `http-proxy-middleware`. In development, only `http://localhost:3000` should be used; port 5173 should not be accessed directly.

### Dev Workflow
- Start Vite first: `npm run dev:client` (runs on 5173 but is accessed via 3000)
- Start Express: `npm run dev:server` (runs on 3000, proxies to Vite)
- Always open the app at `http://localhost:3000`

---

## Future Features (not in scope now)

- Rotation history / audit log
- Password history view
- Email/Teams notification on successful rotation
- Auto-generate new password (vs user-defined)
- Dashboard with next rotation due date

---

## Outstanding Items

- [ ] Azure App Service name + resource group + subscription ID (needed for Step 7)
- [ ] Sandbox deployment slot name (needed for Step 7)
- [ ] Create service principal with App Service contributor permissions (needed for Step 7)
