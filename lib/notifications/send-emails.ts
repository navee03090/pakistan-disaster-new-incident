import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { getDepartmentsForEmergencyType } from '@/lib/notifications/dispatch-departments'
import { formatIncidentType, formatSeverity } from '@/lib/format'
import type { CommunicationAgentOutput } from '@/agents/types'

type Client = SupabaseClient<Database>

type SendResult = {
  sent: number
  skipped: number
  errors: string[]
  alreadySent: boolean
}

function getCommunicationOutputs(aiOutputs: unknown): CommunicationAgentOutput | null {
  if (!aiOutputs || typeof aiOutputs !== 'object') return null
  const communication = (aiOutputs as { communication?: CommunicationAgentOutput }).communication
  if (!communication) return null
  return communication
}

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}${path}`
}

async function logNotification(
  supabase: Client,
  incidentId: string,
  recipient: string,
  department: string | null,
  subject: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  await supabase.from('notification_log').insert({
    incident_id: incidentId,
    channel: 'email',
    recipient,
    department,
    subject,
    status,
    error_message: errorMessage ?? null,
  })
}

export async function sendIncidentEmails(
  supabase: Client,
  incidentId: string
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Pakistan Disaster AI <alerts@disaster-response.pk>'

  if (!apiKey) {
    return {
      sent: 0,
      skipped: 0,
      errors: ['RESEND_API_KEY is not configured'],
      alreadySent: false,
    }
  }

  const { data: incident, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', incidentId)
    .single()

  if (error || !incident) {
    return { sent: 0, skipped: 0, errors: ['Incident not found'], alreadySent: false }
  }

  if (incident.notifications_sent_at) {
    return { sent: 0, skipped: 0, errors: [], alreadySent: true }
  }

  const communication = getCommunicationOutputs(incident.ai_agent_outputs)
  const typeLabel = formatIncidentType(incident.emergency_type)
  const severityLabel = formatSeverity(incident.severity)
  const location =
    incident.location_name ??
    `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`
  const incidentUrl = appUrl(`/incident/${incidentId}`)

  const resend = new Resend(apiKey)
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  if (incident.email) {
    const subject = `Emergency report received — ${typeLabel} (${severityLabel})`
    const citizenMessage =
      communication?.citizenMessage ??
      'Your emergency report has been received. Response teams are being coordinated. Stay safe.'

    try {
      const { error: sendError } = await resend.emails.send({
        from: fromEmail,
        to: incident.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0891b2;">Emergency Report Confirmation</h2>
            <p>Dear ${incident.first_name} ${incident.last_name},</p>
            <p>${citizenMessage}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Type</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${typeLabel}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Severity</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${severityLabel}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Location</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${location}</td></tr>
              <tr><td style="padding: 8px;"><strong>Reference ID</strong></td><td style="padding: 8px;">${incidentId}</td></tr>
            </table>
            <p><a href="${incidentUrl}" style="color: #0891b2;">View incident status</a></p>
            <p style="color: #666; font-size: 12px;">If you did not submit this report, please contact emergency services immediately.</p>
          </div>
        `,
      })

      if (sendError) throw new Error(sendError.message)
      await logNotification(supabase, incidentId, incident.email, 'reporter', subject, 'sent')
      sent++
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reporter email'
      errors.push(`Reporter: ${message}`)
      await logNotification(supabase, incidentId, incident.email, 'reporter', subject, 'failed', message)
    }
  } else {
    skipped++
  }

  const departments = getDepartmentsForEmergencyType(incident.emergency_type)
  const dispatchInstructions =
    communication?.dispatchInstructions ??
    `Deploy resources for ${typeLabel} at ${location}. Severity: ${severityLabel}.`
  const governmentReport =
    communication?.governmentReport ??
    `${typeLabel} incident (${severityLabel}) reported at ${location}. Immediate coordination required.`

  for (const dept of departments) {
    const subject = `[${severityLabel.toUpperCase()}] ${typeLabel} — Dispatch alert for ${dept.name}`
    try {
      const { error: sendError } = await resend.emails.send({
        from: fromEmail,
        to: dept.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Emergency Dispatch Alert — ${dept.name}</h2>
            <p><strong>${dept.description}</strong></p>
            <h3>Incident Summary</h3>
            <p>${governmentReport}</p>
            <h3>Dispatch Instructions</h3>
            <p>${dispatchInstructions}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Type</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${typeLabel}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Severity</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${severityLabel}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Location</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${location}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Reporter</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${incident.first_name} ${incident.last_name} — ${incident.phone}</td></tr>
              <tr><td style="padding: 8px;"><strong>Reference</strong></td><td style="padding: 8px;">${incidentId}</td></tr>
            </table>
            <p><a href="${incidentUrl}" style="color: #0891b2;">Open in Command Center</a></p>
          </div>
        `,
      })

      if (sendError) throw new Error(sendError.message)
      await logNotification(supabase, incidentId, dept.email, dept.id, subject, 'sent')
      sent++
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Send failed'
      errors.push(`${dept.name}: ${message}`)
      await logNotification(supabase, incidentId, dept.email, dept.id, subject, 'failed', message)
    }
  }

  if (sent > 0 && errors.length === 0) {
    await supabase
      .from('incidents')
      .update({
        notifications_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId)
  } else if (sent > 0) {
    await supabase
      .from('incidents')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', incidentId)
  }

  return { sent, skipped, errors, alreadySent: false }
}
