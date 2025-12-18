import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

import { type points } from "../store/useAdminSpeciesStore";
import { UserPosition } from "./MapUtils";

const markerIcon = L.divIcon({
    html: `<div class="bg-blue-500 size-5 rounded-full border-2 border-white shadow-lg"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
});

const createClusterCustomIcon = function (cluster: { getChildCount: () => number }) {
    const count = cluster.getChildCount();

    return L.divIcon({
        html: `<div>${count}</div>`,
        className: "marker-cluster-custom",
        iconSize: L.point(40, 40, true),
    });
};

function Map({ data }: { data: points[] }) {
    return (
        <MapContainer center={[10, 105]} zoom={6} style={{ width: "100%", height: "100%" }} preferCanvas={true} zoomControl={false}>
            {/* Tile of map */}
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Markers with clustering */}
            <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon}>
                {data.length > 0 &&
                    data.map((point) => (
                        <Marker key={point.id} position={[point.lat, point.lng]} icon={markerIcon}>
                            <Popup>
                                <p className="m-0! text-center font-black">{`Latitude: ${point.lat}`}</p>
                                <p className="m-0! text-center font-black">{`Longitude: ${point.lng}`}</p>
                                <p className="m-2! text-[12px] text-center italic">{`ID: ${point.id}`}</p>
                            </Popup>
                        </Marker>
                    ))}
            </MarkerClusterGroup>

            {/* Functions */}
            <ZoomControl position="topright" />
            <UserPosition data={data} />
        </MapContainer>
    );
}

export default Map;
