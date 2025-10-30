import React from 'react';
import Header from './components/Header';
import EarthquakeMap from './components/EarthquakeMap';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <EarthquakeMap />
      </main>
      <footer className="footer">
        Data from USGS Earthquake API | Built with React & Leaflet
      </footer>
    </div>
  );
}
