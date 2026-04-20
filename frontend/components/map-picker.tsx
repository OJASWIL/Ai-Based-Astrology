"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

;(function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl:       "/leaflet/marker-icon.png",
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    shadowUrl:     "/leaflet/marker-shadow.png",
  })
})()

function ClickHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(
        parseFloat(e.latlng.lat.toFixed(4)),
        parseFloat(e.latlng.lng.toFixed(4))
      )
    },
  })
  return null
}

// ✅ FIX: _loaded check + try/catch le unmount error rokxa
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    try {
      if (!map || !(map as any)._loaded) return
      map.flyTo([lat, lng], map.getZoom() < 8 ? 8 : map.getZoom(), {
        animate: true,
        duration: 0.7,
      })
    } catch {
      // map unmount bhaisako — ignore
    }
  }, [lat, lng]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export interface MapPickerProps {
  lat: number
  lng: number
  label?: string
  onMove: (lat: number, lng: number) => void
}

export default function MapPicker({ lat, lng, label, onMove }: MapPickerProps) {
  const safeLat = isNaN(lat) || lat === 0 ? 28.3949 : lat
  const safeLng = isNaN(lng) || lng === 0 ? 84.124  : lng

  return (
    <div className="relative rounded-lg overflow-hidden border border-border" style={{ height: 280 }}>
      <MapContainer
        center={[safeLat, safeLng]}
        zoom={8}
        style={{ height: "100%", width: "100%", cursor: "crosshair" }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={18}
        />
        <FlyTo lat={safeLat} lng={safeLng} />
        <ClickHandler onMove={onMove} />
        <Marker
          position={[safeLat, safeLng]}
          draggable
          eventHandlers={{
            dragend(e) {
              const pos = (e.target as L.Marker).getLatLng()
              onMove(
                parseFloat(pos.lat.toFixed(4)),
                parseFloat(pos.lng.toFixed(4))
              )
            },
          }}
        />
      </MapContainer>

      {label && (
        <div className="absolute top-2 left-2 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 flex items-center gap-1.5 text-xs font-medium text-primary pointer-events-none">
          📍 {label}
        </div>
      )}

      <div className="absolute bottom-2 right-2 z-[1000] bg-card/80 backdrop-blur-sm border border-border rounded px-2 py-0.5 text-xs text-muted-foreground pointer-events-none select-none">
        {safeLat.toFixed(4)}, {safeLng.toFixed(4)}
      </div>
    </div>
  )
}