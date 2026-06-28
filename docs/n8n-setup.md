# n8n Cloud Integration Guide

This project uses **n8n Cloud** to orchestrate AI processing and email notifications on Vercel.

## Architecture

```
Supabase INSERT (incidents)
  → n8n Workflow 1: Process Incident
       → Wait 3s (photos upload)
       → POST /api/process-incident
       → POST /api/notifications/send-emails
  → Emails via Resend (reporter + departments)
```

Emails are sent by your **Vercel app** (Resend SDK), not inside n8n. n8n only triggers the API after AI completes.

---

## Step 1 — Vercel environment variables

Add these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Example | Required |
|----------|---------|----------|
| `PROCESS_INCIDENT_SECRET` | `openssl rand -hex 32` | Yes |
| `RESEND_API_KEY` | `re_...` from [resend.com](https://resend.com) | Yes |
| `RESEND_FROM_EMAIL` | `Pakistan Disaster AI <alerts@yourdomain.com>` | Yes |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Yes |
| `DISPATCH_EMAIL_NDMA` | `ndma@disaster-response.pk` | Optional (placeholder default) |
| `DISPATCH_EMAIL_PDMA` | `pdma@disaster-response.pk` | Optional |
| `DISPATCH_EMAIL_MUNICIPAL` | `municipal@disaster-response.pk` | Optional |
| `DISPATCH_EMAIL_WAPDA` | `wapda@disaster-response.pk` | Optional |
| `DISPATCH_EMAIL_WASA` | `wasa@disaster-response.pk` | Optional |

Redeploy after saving env vars.

### Resend setup

1. Create account at [resend.com](https://resend.com)
2. Add and verify your sending domain (or use Resend sandbox for testing)
3. Create API key → paste into `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to a verified sender address

---

## Step 2 — Supabase Database Webhook

1. Open **Supabase Dashboard → Database → Webhooks**
2. Create webhook:
   - **Name:** `new-incident-n8n`
   - **Table:** `incidents`
   - **Events:** `INSERT`
   - **HTTP method:** POST
   - **URL:** n8n Workflow 1 webhook URL (from Step 3)
   - **Headers:** `Content-Type: application/json`

Payload will include `record.id` (incident UUID).

---

## Step 3 — n8n Cloud Workflow 1: Process + Notify

Create a new workflow in [n8n.cloud](https://n8n.cloud):

### Node 1: Webhook (Trigger)

- **HTTP Method:** POST
- **Path:** `pakistan-disaster-new-incident`
- Copy the **Production URL** → use in Supabase webhook

### Node 2: Wait

- **Amount:** 3 seconds  
- Allows photo uploads to finish after incident insert

### Node 3: HTTP Request — Process Incident

- **Method:** POST
- **URL:** `https://YOUR-APP.vercel.app/api/process-incident`
- **Headers:**
  - `Authorization`: `Bearer YOUR_PROCESS_INCIDENT_SECRET`
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "incidentId": "={{ $json.body.record.id }}"
}
```

> If Supabase sends payload at root, use `$json.record.id` instead of `$json.body.record.id`.

### Node 4: IF — Processing succeeded

- Condition: `{{ $json.success }}` equals `true`

### Node 5: HTTP Request — Send Emails

- **Method:** POST
- **URL:** `https://YOUR-APP.vercel.app/api/notifications/send-emails`
- **Headers:**
  - `Authorization`: `Bearer YOUR_PROCESS_INCIDENT_SECRET`
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "incidentId": "={{ $('Webhook').item.json.body.record.id }}"
}
```

### Node 6 (Error branch): Send ops alert (optional)

Use n8n **Send Email** or **Slack** node to notify you if processing fails.

### Activate workflow

Toggle workflow **Active** in n8n Cloud.

---

## Who receives emails

| Recipient | When | Content |
|-----------|------|---------|
| **Reporter** | If they entered email on `/report` | AI `citizenMessage` + incident summary |
| **NDMA** | Most incident types | Dispatch alert + government report |
| **PDMA** | Most incident types | Dispatch alert |
| **Municipal Corporation** | Urban / local coordination | Dispatch alert |
| **WAPDA** | Flood, fire, cyclone | Utility emergency alert |
| **WASA** | Flood | Water/sewerage alert |

Department routing is defined in `lib/notifications/dispatch-departments.ts`.

---

## API reference (for n8n)

All protected routes require:

```
Authorization: Bearer <PROCESS_INCIDENT_SECRET>
```

### POST `/api/process-incident`

Runs the 6-agent AI pipeline.

**Body:** `{ "incidentId": "uuid" }`

**Responses:**
- `200` — success
- `202` — already processing
- `200` + `alreadyProcessed: true` — idempotent skip

### POST `/api/notifications/send-emails`

Sends reporter + department emails via Resend. Idempotent (won't resend if already sent).

**Body:** `{ "incidentId": "uuid" }`

### GET `/api/notifications/dispatch-targets?emergencyType=flood`

Returns department list for an emergency type (debugging).

---

## Testing

1. Submit a test report at `/report` with **your real email**
2. Check n8n **Executions** tab — workflow should run
3. Check Vercel **Functions** logs for API calls
4. Check inbox for reporter confirmation
5. Check Resend dashboard for delivery status
6. Query Supabase `notification_log` table for audit trail

### Manual test (curl)

```bash
curl -X POST https://YOUR-APP.vercel.app/api/process-incident \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"incidentId":"INCIDENT-UUID-HERE"}'

curl -X POST https://YOUR-APP.vercel.app/api/notifications/send-emails \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"incidentId":"INCIDENT-UUID-HERE"}'
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Match `PROCESS_INCIDENT_SECRET` in Vercel and n8n |
| No reporter email | User must fill email field on report form |
| Resend domain error | Verify domain in Resend or use sandbox |
| AI runs but no email | Check n8n Node 5 runs after Node 3 success |
| Duplicate emails | API is idempotent via `notifications_sent_at` |
| Webhook not firing | Confirm Supabase webhook URL matches n8n production URL |

---

## Optional Workflow 2: Retry stuck incidents

Schedule trigger every 5 minutes:

1. Supabase REST: incidents where `status = 'reported'` and `created_at < now() - 5 min`
2. Loop → POST `/api/process-incident` → POST `/api/notifications/send-emails`

Import template: `n8n/workflows/retry-stuck-incidents.json` (create in n8n UI following above pattern).
