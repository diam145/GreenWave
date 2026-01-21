
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SimulationState, 
  AgentLog, 
  AmbulanceSimulation 
} from './types';
import MapView from './components/MapView';
import MissionLog from './components/MissionLog';
import { orchestrateMission } from './services/geminiService';
import { MQTTService } from './services/mqttService';
import { Shield, Radio, RefreshCcw, Wifi, Zap, Clock, Gauge, ChevronLeft, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>(SimulationState.IDLE);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [origin, setOrigin] = useState("Civic Hospital, Ottawa");
  const [destination, setDestination] = useState("Nicholas Street & Rideau St");
  const [simulation, setSimulation] = useState<AmbulanceSimulation | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  
  const [liveAmbulancePos, setLiveAmbulancePos] = useState<[number, number] | null>(null);
  const [liveSignals, setLiveSignals] = useState<Record<string, { active: boolean, timestamp: number, extension: number }>>({});
  
  const timerRef = useRef<any>(null);
  const mqttServiceRef = useRef<MQTTService | null>(null);

  const addLog = useCallback((agent: AgentLog['agent'], message: string, type: AgentLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      agent,
      message,
      timestamp: new Date(),
      type
    }]);
  }, []);

  useEffect(() => {
    mqttServiceRef.current = new MQTTService({
      onConnect: () => {
        setMqttConnected(true);
        addLog('MQTT', 'Solace Agent Mesh Connected', 'mesh');
      },
      onDisconnect: () => setMqttConnected(false),
      onMessage: (topic, data) => {
        if (topic === 'sam/ambulance/location') {
          setLiveAmbulancePos([data.lat, data.lon]);
        } else if (topic.startsWith('sam/signals/command/')) {
          const intersectionId = data.intersectionId.toString();
          const duration = data.durationSeconds || 15;
          addLog('TrafficBrain', `EMERGENCY PREEMPTION: Signal ${intersectionId} EXTENSION +${duration}s`, 'success');
          setLiveSignals(prev => ({ ...prev, [intersectionId]: { active: true, timestamp: Date.now(), extension: duration } }));
          setTimeout(() => {
            setLiveSignals(prev => {
              const next = { ...prev };
              if (next[intersectionId]) next[intersectionId] = { ...next[intersectionId], active: false };
              return next;
            });
            addLog('TrafficSignal', `Preemption window closed for Signal ${intersectionId}.`, 'info');
          }, (10 + duration) * 1000); 
        }
      }
    });
    mqttServiceRef.current.connect();
    return () => mqttServiceRef.current?.disconnect();
  }, []);

  const handleStartMission = async () => {
    if (state === SimulationState.RUNNING || state === SimulationState.ORCHESTRATING) return;
    setState(SimulationState.ORCHESTRATING);
    addLog('Orchestrator', `Connecting to Flash routing engine...`, 'info');
    try {
      const missionData = await orchestrateMission(origin, destination);
      if (missionData && missionData.simulation && missionData.simulation.route) {
        setSimulation(missionData.simulation);
        setCurrentTime(missionData.simulation.startTimestamp || 0);
        setState(SimulationState.RUNNING);
        setIsPlaying(true);
        addLog('Orchestrator', `Mission sync complete. Route distance: ${(missionData.simulation.route.totalDistanceMeters/1000).toFixed(2)}km`, 'success');
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      addLog('Orchestrator', 'Mission sequence aborted - Simulation sync failed.', 'error');
      setState(SimulationState.IDLE);
    }
  };

  useEffect(() => {
    if (isPlaying && state === SimulationState.RUNNING && simulation?.route) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const totalSeconds = simulation.route.totalTimeSeconds || 0;
          if (prev >= ((simulation.startTimestamp || 0) + totalSeconds)) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            setState(SimulationState.COMPLETED);
            addLog('Ambulance', 'MISSION ACCOMPLISHED: Units arriving at target.', 'success');
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, state, simulation]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(Math.abs(totalSeconds) / 60);
    const secs = Math.floor(Math.abs(totalSeconds) % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeLeftSeconds = (simulation && simulation.route) 
    ? Math.max(0, (simulation.route.totalTimeSeconds || 0) - (currentTime - (simulation.startTimestamp || 0))) 
    : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 font-sans">
      <aside className="w-80 flex flex-col border-r border-slate-800 bg-slate-900/40 backdrop-blur-md z-30 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Shield className="text-red-500 w-9 h-9" />
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">SAM OPS</h1>
            <p className="text-[10px] uppercase text-slate-500 font-bold">Grid Control</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-l-2 border-red-500 pl-3">PARAMETERS</h3>
            <div className="space-y-4">
              <input value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3.5 text-sm" placeholder="Origin" />
              <input value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3.5 text-sm" placeholder="Destination" />
            </div>
            <button onClick={handleStartMission} disabled={state === SimulationState.RUNNING || state === SimulationState.ORCHESTRATING} className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-black flex items-center justify-center gap-2 transition-all disabled:opacity-30">
              {state === SimulationState.ORCHESTRATING ? <RefreshCcw className="animate-spin w-5 h-5"/> : <Zap className="w-5 h-5"/>}
              {state === SimulationState.RUNNING ? "MISSION ACTIVE" : "INITIATE RESPONSE"}
            </button>
          </section>
          {simulation && simulation.route && (
            <div className="pt-6 border-t border-slate-800 space-y-4">
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/50">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Velocity</div>
                    <div className="text-xl font-mono font-black text-white">{(65 + Math.random()*15).toFixed(1)} KM/H</div>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/50">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Arrival</div>
                    <div className="text-xl font-mono font-black text-white">{formatTime(timeLeftSeconds)}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-950/80 border-t border-slate-800 mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mqttConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-black uppercase text-slate-400">SAM_MESH: {mqttConnected ? "LINKED" : "OFFLINE"}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between px-8 backdrop-blur-lg z-20">
          <div className="flex items-center gap-6">
            <Radio className={`w-4 h-4 ${mqttConnected ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
            <span className="text-xs font-black uppercase tracking-widest tracking-tighter">MESSAGING INFRASTRUCTURE MONITOR</span>
          </div>
        </header>
        <div className="flex-1 relative">
          <MapView simulation={simulation} state={state} currentTime={currentTime} liveAmbulancePos={liveAmbulancePos} liveSignals={liveSignals} />
        </div>
        {!showLogs && (
          <button onClick={() => setShowLogs(true)} className="absolute top-1/2 right-0 translate-y-[-50%] bg-slate-900 border border-slate-700 p-2 rounded-l-lg z-50 shadow-xl">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </main>

      {showLogs && (
        <aside className="w-1/4 min-w-[300px] border-l border-slate-800 bg-slate-950/40 backdrop-blur-md z-30 shrink-0 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent Mesh Monitor</span>
            <button onClick={() => setShowLogs(false)}><ChevronRight className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="flex-1 overflow-hidden"><MissionLog logs={logs} /></div>
        </aside>
      )}
    </div>
  );
};

export default App;
