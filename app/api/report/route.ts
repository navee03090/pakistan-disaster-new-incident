import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadIncidentPhotos, validatePhotoFile } from '@/lib/supabase/storage'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const firstName = String(formData.get('firstName') ?? '').trim()
    const lastName = String(formData.get('lastName') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim() || null
    const emergencyType = String(formData.get('emergencyType') ?? '').trim()
    const severity = String(formData.get('severity') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const latitude = parseFloat(String(formData.get('latitude') ?? ''))
    const longitude = parseFloat(String(formData.get('longitude') ?? ''))
    const locationName = String(formData.get('locationName') ?? '').trim() || null
    const affectedPeople = parseInt(String(formData.get('affectedPeople') ?? '0'), 10) || 0
    const injuries = parseInt(String(formData.get('injuries') ?? '0'), 10) || 0
    const reporterId = String(formData.get('reporterId') ?? '').trim() || null

    if (!firstName || !lastName || !phone || !emergencyType || !severity || !description) {
      return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: 'Valid latitude and longitude are required.' }, { status: 400 })
    }

    const photoFiles = formData.getAll('photos').filter((entry): entry is File => entry instanceof File && entry.size > 0)

    for (const file of photoFiles) {
      const validationError = validatePhotoFile(file)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }
    }

    if (photoFiles.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 photos allowed.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error: insertError } = await supabase
      .from('incidents')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        emergency_type: emergencyType,
        severity,
        description,
        latitude,
        longitude,
        location_name: locationName,
        affected_people: affectedPeople,
        injuries,
        reporter_id: reporterId,
      })
      .select('id')
      .single()

    if (insertError || !data) {
      return NextResponse.json(
        { error: insertError?.message ?? 'Failed to save incident report.' },
        { status: 500 }
      )
    }

    if (photoFiles.length > 0) {
      try {
        await uploadIncidentPhotos(supabase, data.id, photoFiles)
      } catch (photoError) {
        return NextResponse.json(
          {
            error:
              photoError instanceof Error ? photoError.message : 'Photo upload failed.',
            incidentId: data.id,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ id: data.id })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.includes('SUPABASE_SERVICE_ROLE_KEY')
          ? 'Server configuration error: Supabase credentials missing on Vercel. Add SUPABASE_SERVICE_ROLE_KEY and redeploy.'
          : error.message
        : 'Failed to submit report.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
