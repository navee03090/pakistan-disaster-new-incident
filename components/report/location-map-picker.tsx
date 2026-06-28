'use client'

import { useCallback, useMemo, useState } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, Navigation } from 'lucide-react'

const PAKISTAN_CENTER = { lat: 24.8607, lng: 67.0011 }

const mapContainerStyle = {
  width: '100%',
  height: '320px',
  borderRadius: '0.5rem',
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
}

export type LocationValue = {
  latitude: string
  longitude: string
  locationName: string
}

type LocationMapPickerProps = {
  latitude: string
  longitude: string
  locationName: string
  onChange: (value: LocationValue) => void
}

export default function LocationMapPicker({
  latitude,
  longitude,
  locationName,
  onChange,
}: LocationMapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  })

  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const markerPosition = useMemo(() => {
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng }
    }
    return null
  }, [latitude, longitude])

  const mapCenter = markerPosition ?? PAKISTAN_CENTER

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!window.google?.maps) return ''
    const geocoder = new google.maps.Geocoder()
    try {
      const response = await geocoder.geocode({ location: { lat, lng } })
      return response.results[0]?.formatted_address ?? ''
    } catch {
      return ''
    }
  }, [])

  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      const address = await reverseGeocode(lat, lng)
      onChange({
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        locationName: address,
      })
    },
    [onChange, reverseGeocode]
  )

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      async position => {
        await updateLocation(position.coords.latitude, position.coords.longitude)
        setLocating(false)
      },
      error => {
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Allow GPS access in your browser settings.')
        } else if (error.code === error.TIMEOUT) {
          setGeoError('Location request timed out. Try again or pick a point on the map.')
        } else {
          setGeoError('Unable to get your location. Pick a point on the map instead.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return
    updateLocation(event.latLng.lat(), event.latLng.lng())
  }

  const handleMarkerDrag = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return
    updateLocation(event.latLng.lat(), event.latLng.lng())
  }

  if (!apiKey) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-background"
        >
          {locating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Use My Current Location
            </>
          )}
        </Button>
        {geoError && <p className="text-sm text-red-400">{geoError}</p>}
        <p className="text-xs text-amber-400/90 p-3 rounded border border-amber-500/30 bg-amber-500/10">
          Add <code className="text-cyan-400">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local to enable the interactive map.
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <p className="text-sm text-red-400">
        Failed to load Google Maps. Check your API key and ensure Maps JavaScript API is enabled.
      </p>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-80 flex items-center justify-center rounded-lg border border-border bg-card/50">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-background"
        >
          {locating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Use My Current Location
            </>
          )}
        </Button>
      </div>

      {geoError && (
        <p className="text-sm text-red-400">{geoError}</p>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={markerPosition ? 15 : 6}
          options={mapOptions}
          onClick={handleMapClick}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable
              onDragEnd={handleMarkerDrag}
            />
          )}
        </GoogleMap>
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-2">
        <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        Tap the map or drag the pin to set the exact incident location. Use the GPS button for your current position.
      </p>

      {locationName && (
        <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
          <p className="text-xs text-muted-foreground mb-1">Detected address</p>
          <p className="text-sm">{locationName}</p>
        </div>
      )}
    </div>
  )
}
