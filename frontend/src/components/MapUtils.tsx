import { useState, useEffect, useCallback } from "react";
import L from "leaflet";
import { useMap, useMapEvent, Marker } from "react-leaflet";
import { ScanEye, LocateFixed, LocateOff } from "lucide-react";

interface Position {
    lat: number;
    lng: number;
}

const userLocationMarker = L.divIcon({
    html: `<div class="bg-red-500 size-5 rounded-full border-2 border-white shadow-lg animate-ping"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
});

export function UserPosition({ data }: { data: Position[] }) {
    const [position, setPosition] = useState<Position | null>(null);
    const map = useMap();

    const fitAllMarkers = useCallback(() => {
        if (data.length === 0) return;

        // Create bounds from all marker positions
        const bounds = L.latLngBounds(data.map((point) => [point.lat, point.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [data, map]);

    const requestUserPosition = () => {
        // Request location
        map.locate({ setView: true, maxZoom: 9, timeout: 30000, enableHighAccuracy: false });
    };

    const removeUserPosition = () => {
        if (!position) return;
        setPosition(null);
    };

    useMapEvent("locationfound", (e) => {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
    });

    useEffect(() => {
        fitAllMarkers();
        // Clean up on unmount
        return () => {
            setPosition(null);
        };
    }, [fitAllMarkers]);

    return (
        <div className="absolute top-20 right-3 flex flex-col space-y-0.5 z-1000 [&>button]:size-8 [&>button]:p-0 [&>button]:border-2 [&>button]:border-gray-400/70">
            <button className="btn" onClick={fitAllMarkers}>
                <ScanEye size={20} />
            </button>
            <button className="btn" onClick={requestUserPosition}>
                <LocateFixed size={20} />
                {position && <Marker position={position} icon={userLocationMarker} />}
            </button>
            <button className="btn" onClick={removeUserPosition}>
                <LocateOff size={20} />
            </button>
        </div>
    );
}
