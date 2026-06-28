'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, ArrowLeft, Upload, MapPin, Phone, Mail, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadIncidentPhotos, validatePhotoFile } from '@/lib/supabase/storage'
import type { LocationValue } from '@/components/report/location-map-picker'

const LocationMapPicker = dynamic(
  () => import('@/components/report/location-map-picker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 flex items-center justify-center rounded-lg border border-border bg-card/50">
        <span className="text-muted-foreground text-sm">Loading map...</span>
      </div>
    ),
  }
)

export default function EmergencyReportPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emergencyType: 'earthquake',
    latitude: '',
    longitude: '',
    locationName: '',
    description: '',
    severity: 'high',
    affectedPeople: '',
    injuries: '',
    photos: [] as File[],
  })

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const errors = files.map(validatePhotoFile).filter(Boolean)
    if (errors.length > 0) {
      setError(errors[0]!)
      return
    }
    setError(null)
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files].slice(0, 5) }))
    setPhotoPreviews(prev => [
      ...prev,
      ...files.map(f => URL.createObjectURL(f)),
    ].slice(0, 5))
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: insertError } = await supabase.from('incidents').insert({
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      email: formData.email || null,
      emergency_type: formData.emergencyType,
      severity: formData.severity,
      description: formData.description,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      location_name: formData.locationName || null,
      affected_people: formData.affectedPeople ? parseInt(formData.affectedPeople, 10) : 0,
      injuries: formData.injuries ? parseInt(formData.injuries, 10) : 0,
      reporter_id: user?.id ?? null,
    }).select('id').single()

    if (insertError || !data) {
      setSubmitting(false)
      setError(insertError?.message ?? 'Failed to submit report')
      return
    }

    if (formData.photos.length > 0) {
      try {
        await uploadIncidentPhotos(supabase, data.id, formData.photos)
      } catch (photoError) {
        setSubmitting(false)
        setError(photoError instanceof Error ? photoError.message : 'Photo upload failed')
        return
      }
    }

    setSubmitting(false)
    router.push(`/processing/${data.id}`)
  }

  const emergencyTypes = [
    { value: 'earthquake', label: '🌍 Earthquake' },
    { value: 'flood', label: '💧 Flooding' },
    { value: 'landslide', label: '⛰️ Landslide' },
    { value: 'cyclone', label: '🌪️ Cyclone' },
    { value: 'fire', label: '🔥 Fire' },
    { value: 'accident', label: '🚗 Accident' },
    { value: 'other', label: '❓ Other' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Report Emergency</h1>
              <p className="text-muted-foreground text-sm mt-1">Help us respond faster by providing accurate information</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <section className="p-6 rounded-lg border border-border bg-card/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-cyan-400">👤</span>
              Your Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  required
                  className="bg-card border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  required
                  className="bg-card border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+92..."
                  required
                  className="bg-card border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="bg-card border-border"
                />
              </div>
            </div>
          </section>

          {/* Emergency Details */}
          <section className="p-6 rounded-lg border border-border bg-card/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-orange-400">🚨</span>
              Emergency Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type of Emergency</label>
                <select
                  name="emergencyType"
                  value={formData.emergencyType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground"
                  required
                >
                  {emergencyTypes.map(type => (
                    <option key={type.value} value={type.value} className="bg-card">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Severity Level</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground"
                  required
                >
                  <option value="low" className="bg-card">🟢 Low - Minor incident</option>
                  <option value="medium" className="bg-card">🟡 Medium - Moderate impact</option>
                  <option value="high" className="bg-card">🔴 High - Serious incident</option>
                  <option value="critical" className="bg-card">⛔ Critical - Life-threatening</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what is happening, affected areas, and any visible damage..."
                  rows={4}
                  required
                  className="w-full px-3 py-2 rounded-md bg-card border border-border text-foreground placeholder-muted-foreground"
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="p-6 rounded-lg border border-border bg-card/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Location
            </h2>

            <div className="mb-6">
              <LocationMapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                locationName={formData.locationName}
                onChange={(value: LocationValue) =>
                  setFormData(prev => ({
                    ...prev,
                    latitude: value.latitude,
                    longitude: value.longitude,
                    locationName: value.locationName,
                  }))
                }
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Latitude</label>
                <Input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="24.8607"
                  step="0.000001"
                  required
                  className="bg-card border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Longitude</label>
                <Input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="67.0011"
                  step="0.000001"
                  required
                  className="bg-card border-border"
                />
              </div>
            </div>
            {formData.locationName && (
              <p className="text-sm text-muted-foreground mb-2">
                <span className="text-cyan-400 font-medium">Address:</span> {formData.locationName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Use GPS, click the map, or enter coordinates manually for the affected location
            </p>
          </section>

          {/* Impact Assessment */}
          <section className="p-6 rounded-lg border border-border bg-card/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-red-400">📊</span>
              Impact Assessment
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Affected People</label>
                <Input
                  type="number"
                  name="affectedPeople"
                  value={formData.affectedPeople}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="bg-card border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Injuries</label>
                <Input
                  type="number"
                  name="injuries"
                  value={formData.injuries}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="bg-card border-border"
                />
              </div>
            </div>
          </section>

          {/* Photo Upload */}
          <section className="p-6 rounded-lg border border-border bg-card/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              Photos & Evidence
            </h2>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500/50 transition block"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Upload photos of the incident</p>
              <p className="text-xs text-muted-foreground">Up to 5 images, max 5MB each (JPEG, PNG, WebP, GIF)</p>
            </label>
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {photoPreviews.map((preview, idx) => (
                  <div key={preview} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-red-500/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Photos help our AI agents better understand the situation and prioritize response
            </p>
          </section>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-background h-12 text-base font-semibold"
            >
              {submitting ? 'Submitting...' : submitted ? '✓ Report Submitted' : 'Submit Emergency Report'}
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full border-border h-12 text-base">
                Cancel
              </Button>
            </Link>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10">
              <p className="text-sm text-red-400">Failed to submit report: {error}</p>
            </div>
          )}

          {submitted && (
            <div className="p-4 rounded-lg border border-cyan-500/50 bg-cyan-500/10">
              <p className="text-sm text-cyan-400">
                ✓ Your emergency report has been received. AI agents are now analyzing the information and emergency services are being notified.
              </p>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
