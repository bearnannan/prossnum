"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

export default function MapView({ data }: { data: any[] }) {
    // Default center to Thailand or the first station's coordinates
    const center = data.length > 0 && data[0].lat && data[0].lon
        ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number]
        : [15.8700, 100.9925] as [number, number]; // Default to Thailand

    return (
        // @ts-ignore
        <MapContainer center={center} zoom={6} scrollWheelZoom={true} className="h-full w-full rounded-xl z-0">
            {/* @ts-ignore */}
            <TileLayer
                // @ts-ignore
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data.map((station, idx) => {
                if (!station.lat || !station.lon) return null;
                const lat = parseFloat(station.lat);
                const lon = parseFloat(station.lon);
                if (isNaN(lat) || isNaN(lon)) return null;

                return (
                    <Marker key={idx} position={[lat, lon]}>
                        <Popup>
                            <strong>{station.stationName || 'Unknown Station'}</strong><br />
                            อ. {station.district}<br />
                            Type: {station.type}<br />
                            ฐานราก: {station.foundationProgress}%<br />
                            ติดตั้งเสา: {station.poleInstallationProgress}%
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
