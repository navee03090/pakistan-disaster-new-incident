import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

const BUCKET = 'incident-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

type Client = SupabaseClient<Database>

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG, WebP, and GIF images are allowed`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: file must be under 5MB`
  }
  return null
}

export async function uploadIncidentPhotos(
  supabase: Client,
  incidentId: string,
  files: File[]
) {
  const uploaded: Database['public']['Tables']['incident_photos']['Insert'][] = []

  for (const file of files) {
    const validationError = validatePhotoFile(file)
    if (validationError) throw new Error(validationError)

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const storagePath = `${incidentId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    uploaded.push({
      incident_id: incidentId,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      file_name: file.name,
    })
  }

  if (uploaded.length > 0) {
    const { error: insertError } = await supabase.from('incident_photos').insert(uploaded)
    if (insertError) throw insertError
  }

  return uploaded
}

export async function fetchIncidentPhotos(supabase: Client, incidentId: string) {
  const { data, error } = await supabase
    .from('incident_photos')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true })

  return { data: data ?? [], error }
}
