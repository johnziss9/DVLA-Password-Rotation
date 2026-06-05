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
| TBD | To be confirmed once endpoint details are shared |

---

## DVLA Endpoints

### Endpoint 1 — Request Verification Code
| Field | Value |
|---|---|
| URL | TBD |
| Method | TBD |
| Headers | TBD |
| Body | TBD |
| Trigger | Automated via node-cron (~day 85 of 90-day cycle) |

### Endpoint 2 — Rotate Password
| Field | Value |
|---|---|
| URL | TBD |
| Method | TBD |
| Headers | TBD |
| Body | TBD (includes verification code + new password) |
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

**Step 1 — Project scaffold**
Set up the monorepo structure, initialise `package.json` for both `client/` and `server/`, install dependencies.

**Step 2 — Express server (bare bones)**
Basic Express app running on a port, health check route, `.env` config loading.

**Step 3 — Entra ID auth**
Wire up MSAL Node on the server, protect routes, add login/logout flow. Test that unauthenticated users get redirected.

**Step 4 — React frontend (bare bones)**
Vite + React + Tailwind set up, Express serves the built client. Single page with the verification code form.

**Step 5 — DVLA Endpoint 1 (trigger verification email)**
Server route that calls the DVLA API to request the code. Test it manually first via a button in the UI.

**Step 6 — DVLA Endpoint 2 (rotate password)**
Server route that takes the verification code and calls DVLA to rotate the password.

**Step 7 — Azure Management API**
After successful rotation, update the env var on the App Service (prod + sandbox slot).

**Step 8 — node-cron scheduler**
Automate Step 5 to run every ~85 days.

**Step 9 — Deploy to Azure**
Create the new Web App on the existing P0v3 plan, configure App Settings, deploy.

---

## Future Features (not in scope now)

- Rotation history / audit log
- Password history view
- Email/Teams notification on successful rotation
- Auto-generate new password (vs user-defined)
- Dashboard with next rotation due date

---

## Outstanding Items Before Build

- [ ] DVLA Endpoint 1 details (URL, method, headers, body)
- [ ] DVLA Endpoint 2 details (URL, method, headers, body)
- [ ] Azure App Service name + resource group + subscription ID
- [ ] Sandbox deployment slot name
- [ ] Confirm which email receives the DVLA verification code
- [ ] Create Entra ID App Registration (or confirm one exists)
- [ ] Create service principal with App Service contributor permissions
