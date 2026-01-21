
import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';

interface MissionLogProps {
  logs: AgentLog[];
}

const MissionLog: React.FC<MissionLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Orchestrator': return 'text-purple-400';
      case 'Ambulance': return 'text-emerald-400';
      case 'TrafficBrain': return 'text-amber-400';
      case 'TrafficSignal': return 'text-rose-400';
      case 'MQTT': return 'text-sky-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/10">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]"
      >
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Waiting for unit dispatch...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="border-l-2 border-slate-700 pl-3 py-1 bg-slate-800/20 rounded-r">
            <div className="flex justify-between items-start mb-1">
              <span className={`font-bold uppercase tracking-tighter ${getAgentColor(log.agent)}`}>{log.agent}</span>
              <span className="text-slate-500 text-[9px]">{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{log.message}</p>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
         <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[9px] text-slate-500 uppercase font-black">Agent Mesh Active</span>
         </div>
         <span className="text-[9px] text-slate-700 font-mono">ID: {Math.random().toString(16).substr(2, 6).toUpperCase()}</span>
      </div>
    </div>
  );
};

export default MissionLog;
