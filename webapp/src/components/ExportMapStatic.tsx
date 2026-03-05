import React from 'react';

interface StationData {
    lat?: number;
    lon?: number;
    foundationProgress: number | string;
    poleInstallationProgress: number | string;
}

export default function ExportMapStatic({ stations }: { stations: StationData[] }) {
    const validPoints = stations
        .map(s => [parseFloat(s.lat as any), parseFloat(s.lon as any)])
        .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || validPoints.length === 0) {
        return (
            <div style={{ backgroundColor: '#F3F4F6', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ marginBottom: '8px' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Map Unavailable</div>
            </div>
        );
    }

    // Group markers by status
    const completelyDone = stations.filter(s => (parseFloat(s.foundationProgress as any) || 0) >= 100 && (parseFloat(s.poleInstallationProgress as any) || 0) >= 100);
    const notStarted = stations.filter(s => (parseFloat(s.foundationProgress as any) || 0) === 0 && (parseFloat(s.poleInstallationProgress as any) || 0) === 0);
    const inProgress = stations.filter(s => !completelyDone.includes(s) && !notStarted.includes(s));

    const makeMarkerParam = (color: string, list: StationData[]) => {
        const pts = list.map(s => [parseFloat(s.lat as any), parseFloat(s.lon as any)]).filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0);
        if (pts.length === 0) return '';
        return `&markers=color:${color}|size:small|` + pts.map(p => `${p[0]},${p[1]}`).join('|');
    };

    const markersCmd = [
        makeMarkerParam('green', completelyDone),
        makeMarkerParam('orange', inProgress),
        makeMarkerParam('red', notStarted)
    ].join('');

    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=840x300&scale=2&maptype=roadmap${markersCmd}&key=${apiKey}`;
    const proxiedUrl = `/api/proxy-map?url=${encodeURIComponent(mapUrl)}`;

    return (
        <img
            src={proxiedUrl}
            alt="Static Map"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
            crossOrigin="anonymous"
        />
    );
}
