import "mapbox-gl/dist/mapbox-gl.css";
import Map, { NavigationControl } from "react-map-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN";

export default function MapView({ latitude = 37.7749, longitude = -122.4194, zoom = 10, children, ...props }) {
  return (
    <Map
      initialViewState={{
        latitude,
        longitude,
        zoom,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      {...props}
    >
      <NavigationControl position="top-left" />
      {children}
    </Map>
  );
}
