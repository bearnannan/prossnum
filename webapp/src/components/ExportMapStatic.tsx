import React from 'react';

interface StationData {
    lat?: number;
    lon?: number;
    foundationProgress: number | string;
    poleInstallationProgress: number | string;
    electricProgress?: number | string;
    groundProgress?: number | string;
    feederProgress?: number | string;
    towerProgress?: number | string;
    radioProgress?: number | string;
}

const toNumber = (value: number | string | undefined) => parseFloat(String(value ?? 0)) || 0;

export default function ExportMapStatic({ stations, category = 'station' }: { stations: StationData[], category?: 'station' | 'client' }) {
    const isClient = category === 'client';
    const validPoints = stations
        .map(s => [toNumber(s.lat), toNumber(s.lon)])
        .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || validPoints.length === 0) {
        return (
            <div style={{ backgroundColor: 'rgba(10,10,15,0.88)', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid rgba(0,240,255,0.18)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" strokeWidth="2" style={{ marginBottom: '8px', filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.45))' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Map Unavailable</div>
            </div>
        );
    }

    // Group markers by status
    let completelyDone: StationData[] = [];
    let notStarted: StationData[] = [];
    let inProgress: StationData[] = [];

    if (isClient) {
        completelyDone = stations.filter(s => 
            toNumber(s.electricProgress) >= 100 && 
            toNumber(s.groundProgress) >= 100 && 
            toNumber(s.feederProgress) >= 100 &&
            toNumber(s.towerProgress) >= 100 &&
            toNumber(s.radioProgress) >= 100
        );
        notStarted = stations.filter(s => 
            toNumber(s.electricProgress) === 0 && 
            toNumber(s.groundProgress) === 0 && 
            toNumber(s.feederProgress) === 0 &&
            toNumber(s.towerProgress) === 0 &&
            toNumber(s.radioProgress) === 0
        );
    } else {
        completelyDone = stations.filter(s => toNumber(s.foundationProgress) >= 100 && toNumber(s.poleInstallationProgress) >= 100);
        notStarted = stations.filter(s => toNumber(s.foundationProgress) === 0 && toNumber(s.poleInstallationProgress) === 0);
    }
    
    inProgress = stations.filter(s => !completelyDone.includes(s) && !notStarted.includes(s));

    const makeMarkerParam = (color: string, list: StationData[]) => {
        const pts = list.map(s => [toNumber(s.lat), toNumber(s.lon)]).filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0);
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', filter: 'saturate(1.15) contrast(1.02)', opacity: 0.92 }}
            crossOrigin="anonymous"
        />
    );
}
