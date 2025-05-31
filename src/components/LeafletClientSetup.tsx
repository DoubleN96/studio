
'use client';

import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css'; // CSS import at the top of a 'use client' component

export default function LeafletClientSetup() {
  useEffect(() => {
    // Dynamically import the JS module to ensure it's client-side only
    // and runs after mount.
    import('leaflet-defaulticon-compatibility')
      .then(() => {
        // Optional: console.log('Leaflet Default Icon Compatibility loaded client-side.');
      })
      .catch(error => {
        // Optional: console.error('Error loading Leaflet Default Icon Compatibility:', error);
      });
  }, []); // Empty dependency array ensures this runs once on mount

  return null; // This component does not render anything visible
}
