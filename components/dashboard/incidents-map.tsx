'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Loader2, MapPin } from 'lucide-react'
import type { Incident } from '@/lib/supabase/queries'
import { formatIncidentType, formatSeverity, formatStatusLabel } from '@/lib/format'

const PAKISTAN_CENTER = { lat: 24.8607, lng: 67.0011 }

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
}

function markerIcon(severity: string, selected: boolean) {
  if (selected) return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  if (severity === 'critical' || severity === 'high') {
    return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
  }
  if (severity === 'medium') {
    return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
  }
  return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
}

type IncidentsMapProps = {
  incidents: Incident[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export default function IncidentsMap({ incidents, selectedId, onSelect }: IncidentsMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [infoWindowId, setInfoWindowId] = useState<string | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey })

  const mappableIncidents = useMemo(
    () =>
      incidents.filter(
        incident =>
          Number.isFinite(incident.latitude) &&
          Number.isFinite(incident.longitude) &&
          !(incident.latitude === 0 && incident.longitude === 0)
      ),
    [incidents]
  )

  useEffect(() => {
    if (!map || mappableIncidents.length === 0 || selectedId) return

    if (mappableIncidents.length === 1) {
      map.setCenter({ lat: mappableIncidents[0].latitude, lng: mappableIncidents[0].longitude })
      map.setZoom(10)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    mappableIncidents.forEach(incident => {
      bounds.extend({ lat: incident.latitude, lng: incident.longitude })
    })
    map.fitBounds(bounds, 48)
  }, [map, mappableIncidents, selectedId])

  useEffect(() => {
    if (!map || !selectedId) return

    const incident = mappableIncidents.find(item => item.id === selectedId)
    if (!incident) return

    map.panTo({ lat: incident.latitude, lng: incident.longitude })
    map.setZoom(Math.max(map.getZoom() ?? 6, 11))
    setInfoWindowId(selectedId)
  }, [selectedId, map, mappableIncidents])

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Add <code className="text-cyan-400">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the live map.
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-sm text-red-400">
          Failed to load Google Maps. Check your API key and ensure Maps JavaScript API is enabled.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    )
  }

  if (mappableIncidents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No incidents with GPS coordinates yet.</p>
          <p className="text-xs text-muted-foreground mt-2">Reports with a map location will appear here.</p>
        </div>
      </div>
    )
  }

  const activeInfoIncident = mappableIncidents.find(incident => incident.id === infoWindowId)

  return (
    <div className="h-full overflow-hidden rounded-lg">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={PAKISTAN_CENTER}
        zoom={6}
        options={mapOptions}
        onLoad={setMap}
        onClick={() => {
          setInfoWindowId(null)
          onSelect(null)
        }}
      >
        {mappableIncidents.map(incident => {
          const selected = selectedId === incident.id
          return (
            <Marker
              key={incident.id}
              position={{ lat: incident.latitude, lng: incident.longitude }}
              icon={markerIcon(incident.severity, selected)}
              onClick={event => {
                event.domEvent.stopPropagation()
                onSelect(incident.id)
                setInfoWindowId(incident.id)
              }}
            />
          )
        })}

        {activeInfoIncident && (
          <InfoWindow
            position={{
              lat: activeInfoIncident.latitude,
              lng: activeInfoIncident.longitude,
            }}
            onCloseClick={() => {
              setInfoWindowId(null)
              onSelect(null)
            }}
          >
            <div className="text-sm text-gray-900 max-w-[220px]">
              <p className="font-semibold">{formatIncidentType(activeInfoIncident.emergency_type)}</p>
              <p className="text-xs mt-1 text-gray-600">
                {activeInfoIncident.location_name ??
                  `${activeInfoIncident.latitude.toFixed(4)}, ${activeInfoIncident.longitude.toFixed(4)}`}
              </p>
              <p className="text-xs mt-2">
                <span className="font-medium">Severity:</span> {formatSeverity(activeInfoIncident.severity)}
              </p>
              <p className="text-xs">
                <span className="font-medium">Status:</span> {formatStatusLabel(activeInfoIncident.status)}
              </p>
              <Link
                href={`/incident/${activeInfoIncident.id}`}
                className="inline-block mt-2 text-xs text-blue-600 hover:underline"
              >
                View details →
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}
