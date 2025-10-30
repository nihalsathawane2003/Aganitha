import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';

const USGS_URLS = {
  hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  day: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
};

function MapAutoZoom({ features }) {
  const map = useMap();
  useEffect(() => {
    if (!features.length) return;
    const bounds = features.map(f => {
      const [lon, lat] = f.geometry.coordinates;
      return [lat, lon];
    });
    map.fitBounds(bounds, { maxZoom: 6, padding: [40, 40] });
  }, [features]);
  return null;
}

export default function EarthquakeMap() {
  const [period, setPeriod] = useState('day');
  const [minMag, setMinMag] = useState(0);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(USGS_URLS[period])
      .then(res => res.json())
      .then(json => setData(json.features || []))
      .catch(() => setError('Failed to fetch earthquake data'))
      .finally(() => setLoading(false));
  }, [period]);

  const filtered = useMemo(
    () => data.filter(f => f.properties.mag >= minMag),
    [data, minMag]
  );

  const magToRadius = m => Math.max(4, Math.pow(2, m / 1.5));
  const magToColor = m =>
    m >= 6 ? '#800026' :
    m >= 5 ? '#BD0026' :
    m >= 4 ? '#E31A1C' :
    m >= 3 ? '#FC4E2A' :
    m >= 2 ? '#FD8D3C' : '#FEB24C';

  return (
    <div className="map-wrapper">
      <section className="controls">
        <label>
          Period:
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="hour">Past Hour</option>
            <option value="day">Past Day</option>
            <option value="week">Past Week</option>
          </select>
        </label>

        <label>
          Min Magnitude: <strong>{minMag}</strong>
          <input
            type="range"
            min="0"
            max="7"
            step="0.1"
            value={minMag}
            onChange={e => setMinMag(Number(e.target.value))}
          />
        </label>

        <div className="stats">
          {loading ? (
            <span>Loading...</span>
          ) : error ? (
            <span className="error">{error}</span>
          ) : (
            <span>{filtered.length} events</span>
          )}
        </div>
      </section>

      <div className="map-container">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom
          style={{ height: '70vh', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapAutoZoom features={filtered} />

          {filtered.map(f => {
            const { id, properties, geometry } = f;
            const [lon, lat, depth] = geometry.coordinates;
            const mag = properties.mag;
            const time = properties.time
              ? format(new Date(properties.time), 'PPPp')
              : 'Unknown';
            return (
              <CircleMarker
                key={id}
                center={[lat, lon]}
                radius={magToRadius(mag)}
                pathOptions={{
                  color: magToColor(mag),
                  fillColor: magToColor(mag),
                  fillOpacity: 0.7
                }}
              >
                <Popup>
                  <strong>{properties.place}</strong>
                  <br />
                  Magnitude: {mag} | Depth: {depth} km
                  <br />
                  Time: {time}
                  <br />
                  <a href={properties.url} target="_blank" rel="noopener noreferrer">
                    View on USGS
                  </a>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
