
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { fetchMapData } from '../services/overpassService';
import { AmbulanceSimulation, SimulationState } from '../types';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface MapViewProps {
  simulation: AmbulanceSimulation | null;
  state: SimulationState;
  currentTime: number;
  liveAmbulancePos: [number, number] | null;
  liveSignals: Record<string, { active: boolean, timestamp: number, extension: number }>;
}

const MapView: React.FC<MapViewProps> = ({ 
  simulation, 
  state, 
  currentTime,
  liveSignals
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const signalMarkersRef = useRef<Record<string, L.CircleMarker>>({});
  const signalCyclesRef = useRef<Record<string, { timer: any, state: 'green' | 'yellow' | 'red' }>>({});
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const getSignalColor = (s: 'green' | 'yellow' | 'red') => {
    switch(s) {
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      default: return '#ef4444';
    }
  };

  const startAutonomousCycle = (id: string, initialOffset = 0, forceGreen = false) => {
    const cycleRef = signalCyclesRef.current[id];
    if (cycleRef?.timer) clearTimeout(cycleRef.timer);

    const sequence: ('green' | 'yellow' | 'red')[] = ['green', 'yellow', 'red'];
    let currentIndex = forceGreen ? 0 : initialOffset % 3;

    const run = () => {
      const liveState = liveSignals[id];
      const currentState = liveState?.active ? 'green' : sequence[currentIndex];
      const marker = signalMarkersRef.current[id];
      
      if (marker) {
        const color = getSignalColor(currentState);
        marker.setStyle({ color, fillColor: color, fillOpacity: 0.8 });
      }

      signalCyclesRef.current[id] = { ...signalCyclesRef.current[id], state: currentState };

      // Timings: 10s Green, 2s Yellow, 6s Red
      let delay = 0;
      if (currentState === 'green') {
        delay = 10000;
        if (liveState?.active) delay += (liveState.extension * 1000); // extension +15s -> 25s
      } else if (currentState === 'yellow') {
        delay = 2000;
      } else {
        delay = 6000;
      }

      currentIndex = (currentIndex + 1) % 3;
      signalCyclesRef.current[id].timer = setTimeout(run, delay);
    };

    run();
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [45.421, -75.697],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    const loadData = async () => {
      try {
        const { signals, roads } = await fetchMapData();
        roads.forEach((road: any) => {
          if (road.geometry) {
            L.polyline(road.geometry.map((g: any) => [g.lat, g.lon]), {
              color: '#1e293b',
              weight: 2,
              opacity: 0.2
            }).addTo(map);
          }
        });

        signals.forEach((signal: any, index: number) => {
          const idStr = signal.id.toString();
          const marker = L.circleMarker([signal.lat, signal.lon], {
            radius: 5,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.8,
            weight: 2
          }).addTo(map);
          marker.bindTooltip(`Signal: ${signal.id}`, { direction: 'top', className: 'signal-tooltip' });
          signalMarkersRef.current[idStr] = marker;
          startAutonomousCycle(idStr, index);
        });
        setIsLoaded(true);
      } catch (err: any) {
        setError(err.message || "City Grid service is currently unavailable.");
      }
    };

    loadData();

    return () => {
      Object.values(signalCyclesRef.current).forEach((c: any) => {
        if (c?.timer) clearTimeout(c.timer);
      });
    };
  }, []);

  useEffect(() => {
    Object.keys(signalMarkersRef.current).forEach(id => {
      const marker = signalMarkersRef.current[id];
      const liveState = liveSignals[id];
      const cycle = signalCyclesRef.current[id];
      if (liveState && liveState.active) {
        if (cycle?.state !== 'green') startAutonomousCycle(id, 0, true);
        marker.getElement()?.classList.add('signal-glow');
      } else {
        marker.getElement()?.classList.remove('signal-glow');
      }
    });
  }, [liveSignals]);

  useEffect(() => {
    if (!mapRef.current || !simulation || !simulation.polyline) return;
    if (routePolylineRef.current) routePolylineRef.current.remove();
    routePolylineRef.current = L.polyline(simulation.polyline, {
      color: '#ef4444',
      weight: 5,
      opacity: 0.2,
      dashArray: '5, 10'
    }).addTo(mapRef.current);

    if (!ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current = L.marker(simulation.polyline[0], {
        icon: L.divIcon({
          className: 'hero-marker hero-els',
          html: `<div style="background: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 25px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">🚑</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(mapRef.current);
    }
    mapRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [80, 80] });
  }, [simulation]);

  useEffect(() => {
    if (!simulation || !simulation.route || !ambulanceMarkerRef.current || state !== SimulationState.RUNNING) return;
    const totalTime = simulation.route.totalTimeSeconds || 1;
    const progress = Math.min(1, (currentTime - (simulation.startTimestamp || 0)) / totalTime);
    const index = Math.floor(progress * (simulation.polyline.length - 1));
    const pos = simulation.polyline[index];
    if (pos) ambulanceMarkerRef.current.setLatLng(pos);
  }, [currentTime, simulation, state]);

  return (
    <div className="relative w-full h-full">
      <div id="status-overlay" className="absolute top-4 right-4 z-[1000] bg-slate-900/90 border border-slate-700 p-3 rounded font-mono text-[10px] text-slate-300 pointer-events-none backdrop-blur-sm">
        <strong>GRID STATUS</strong><br/>
        {error ? '❌ GRID OFFLINE' : (isLoaded ? '✅ MESH ACTIVE' : '⏳ CONNECTING...')}
      </div>
      {error && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-[1001] p-6 text-center">
          <div className="bg-slate-900 border border-red-900/50 p-8 rounded-2xl max-w-md shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Grid Sync Failure</h2>
            <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">Retry Sync</button>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      <style>{`
        .signal-glow { filter: drop-shadow(0 0 15px #22c55e); stroke-width: 4px; }
        .signal-tooltip { background-color: #0f172a !important; border-color: #334155 !important; color: #94a3b8 !important; font-family: monospace; font-size: 10px; }
      `}</style>
    </div>
  );
};

export default MapView;
