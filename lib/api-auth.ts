import { NextResponse } from 'next/server'

export function verifyApiSecret(request: Request): NextResponse | null {
  const secret = process.env.PROCESS_INCIDENT_SECRET
  if (!secret) return null

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.headers.get('x-api-secret')

  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
