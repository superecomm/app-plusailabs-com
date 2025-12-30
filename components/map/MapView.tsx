"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Filter } from "lucide-react";
import { NeuralBox } from "@/components/viim/NeuralBox";
import mapboxgl from 'mapbox-gl';

// Note: CSS is imported in global styles

interface MapViewProps {
  theme?: "light" | "dark";
}

export function MapView({ theme = "light" }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Set Mapbox access token
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoicGx1c2FpIiwiYSI6ImNtajZpdWVzNzBjc2EzbG93M2twZG1hNmQifQ.NdC8foaYkRc63z7Nxtu1xw';
  }, []);

  // Get user location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to San Francisco
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      // Default location
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!userLocation || !mapContainerRef.current || mapRef.current) return;

    console.log('[Map] Initializing with location:', userLocation);

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11' 
          : 'mapbox://styles/mapbox/streets-v12',
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
      });

      map.on('load', () => {
        console.log('[Map] Loaded successfully');
      });

      map.on('error', (e) => {
        console.error('[Map] Error:', e);
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add user location marker
      new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (error) {
      console.error('[Map] Initialization error:', error);
    }
  }, [userLocation, theme]);

  // Recenter on user location
  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newLocation);
        
        // Recenter map
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [newLocation.lng, newLocation.lat],
            zoom: 13,
          });
        }
      });
    }
  };

  return (
    <div className="absolute inset-0">
      {/* Map Container - Full screen edge-to-edge */}
      <div 
        ref={mapContainerRef}
        className="absolute inset-0 bg-gray-100 dark:bg-gray-900"
        style={{ width: '100%', height: '100%' }}
      >
        {!userLocation && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-10">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
              <p>Getting your location...</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Controls (overlay) - lowered to avoid header */}
      <div className="absolute top-20 right-4 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-10 h-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="My location"
        >
          <Navigation className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        
        <button
          className="w-10 h-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Filter"
        >
          <Filter className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Neural Box at bottom - input only, hide animation */}
      <div className="absolute bottom-0 left-0 right-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="[&>div>div:first-child]:hidden">
          <NeuralBox
            variant="assistant"
            theme={theme}
            showInputPanel={true}
            forcePromptVisible={true}
            blurInput={false}
            disableInteractions={false}
          />
        </div>
      </div>
    </div>
  );
}

