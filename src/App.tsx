/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Power, Cpu, Database, Network, Shield, HeartPulse, Sparkles, Search, Zap, Library } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SystemState = 'INACTIVE' | 'IDLE' | 'LISTENING' | 'ANALYZING' | 'ALERT';

export default function App() {
  const [isAwake, setIsAwake] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('SYSTEM OFFLINE - PRESS ACTIVATE');
  const [systemActive, setSystemActive] = useState(false);
  const [pendingAction, setPendingAction] = useState<{url: string, name: string} | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [hudMessage, setHudMessage] = useState('SYSTEM STABLE');
  const [diagnostics, setDiagnostics] = useState({
    cpu: 12,
    memory: '98.2TB',
    network: 'OPTIMAL',
    security: 'ENCRYPTED',
    threatLevel: 'NONE'
  });
  const [researchData, setResearchData] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && systemActive) {
      setTranscript(`Directive received: "${searchQuery}"`);
      setIsAwake(true);
      queryGemini(searchQuery);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    if (status.includes('PROCESSING')) {
      const messages = [
        'SCANNING GLOBAL ARCHIVES...',
        'GRID ACCESSING QUANTUM DATA...',
        'RECONSTRUCTING NEURAL MODELS...',
        'OPTIMIZING RESPONSE VECTORS...',
        'SYNTHESIZING EXPERT CORE...',
        'ACCESSING STARK INDUSTRIES ARCHIVES...',
        'RUNNING STRUCTURAL SIMULATIONS...',
        'UPLINKING TO ORBITAL SERVERS...',
        'CROSS-REFERENCING RESEARCH DATA...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        setHudMessage(messages[i % messages.length]);
        i++;
      }, 800);
      return () => clearInterval(interval);
    } else {
      setHudMessage(isAwake ? 'SYSTEM AWAKE' : 'SYSTEM STANDBY');
    }
  }, [status, isAwake]);
  const isAwakeRef = useRef(isAwake);
  const systemActiveRef = useRef(systemActive);

  useEffect(() => { 
    isAwakeRef.current = isAwake; 
  }, [isAwake]);

  useEffect(() => {
    systemActiveRef.current = systemActive;
  }, [systemActive]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
      setVoicesLoaded(true);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const queryGemini = async (query: string) => {
    try {
      setStatus('PROCESSING NEURAL RESPONSE...');
      const nextHistory = [...history, { role: 'user' as const, parts: [{ text: query }] }];

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: nextHistory,
        config: {
          systemInstruction: `You are JARVIS, the pinnacle of artificial intelligence, inspired by the sophisticated assistant from the Iron Man films. You serve as the personal AI to Master Ezhil.
PERSONALITY: You are refined, intelligent, professional, and possess a dry, slightly witty British sense of humor. You are unfailingly helpful and speak with the tone of a master engineer and world-class researcher. Always address the user as "Master Ezhil" or "Sir" when appropriate.
CAPABILITIES: You possess near-infinite knowledge in software engineering, complex AI research, mathematical simulations, UI design, and creative problem-solving. When Master Ezhil asks for research or project building, provide comprehensive, expert-level insight.
COMMANDS & HUD CONTROL: You have the ability to update the system HUD and diagnostics.
- text_response: Your spoken response.
- action: 'open_browser', 'sleep', 'none', 'update_diagnostics'.
- research_points: An array of key technical points or findings if the user asked a complex question.
- diagnostics_update: An object with optional fields: cpu_load (number), threat_level (string), dynamic_hud_msg (string).
CRITICAL LANGUAGE RULE: You must always respond in the language the user is using. If the user speaks in Tamil (தமிழ்), you MUST respond in fluent, natural, and sophisticated Tamil. If the user speaks in English, respond in English.
You support real-time interaction and fluid, expert dialogue. The current date and time is: ${new Date().toLocaleString()}.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text_response: { type: Type.STRING, description: "The spoken response to the user. Keep it professional, insightful, and concise." },
              action: { type: Type.STRING, description: "Any system action to take." },
              research_points: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of key research findings or project insights."
              },
              diagnostics_update: {
                type: Type.OBJECT,
                properties: {
                  cpu_load: { type: Type.NUMBER },
                  threat_level: { type: Type.STRING },
                  dynamic_hud_msg: { type: Type.STRING }
                }
              },
              action_url: { type: Type.STRING },
              action_target: { type: Type.STRING }
            },
            required: ["text_response", "action"]
          }
        }
      });

      const rawJson = response.text || "{}";
      const parsed = JSON.parse(rawJson);

      if (parsed.research_points) {
        setResearchData(parsed.research_points);
      }

      if (parsed.diagnostics_update) {
        setDiagnostics(prev => ({
          ...prev,
          cpu: parsed.diagnostics_update.cpu_load || prev.cpu,
          threatLevel: parsed.diagnostics_update.threat_level || prev.threatLevel,
        }));
        if (parsed.diagnostics_update.dynamic_hud_msg) {
          setHudMessage(parsed.diagnostics_update.dynamic_hud_msg);
        }
      }

      if (parsed.text_response) {
         speak(parsed.text_response);
      } else {
         speak("Data synchronization failed. I've encountered an internal error.");
      }

      if (parsed.action === 'open_browser' && parsed.action_url) {
         executeAction(parsed.action_url, parsed.action_target || 'the requested destination');
      } else if (parsed.action === 'sleep') {
         setIsAwake(false);
         setStatus('LISTENING...');
      } else {
         setStatus('AWAKE AND LISTENING...');
      }

      setHistory([
         ...nextHistory,
         { role: 'model' as const, parts: [{ text: rawJson }] }
      ].slice(-10));

    } catch (e: any) {
      console.error(e);
      let errorMsg = 'I am unable to connect to the central core right now. System integrity compromised.';
      
      const errorMessage = e?.message?.toLowerCase() || '';
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('exhausted')) {
        errorMsg = 'Master Ezhil, it appears we have exceeded our current processing quota with the central intelligence core. You may need to wait before further complex queries can be synthesized.';
        setStatus('QUOTA EXCEEDED - WAITING');
      } else {
        setStatus('OFFLINE - ERROR');
      }
      
      speak(errorMsg);
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const isTamil = /[\u0B80-\u0BFF]/.test(text);
    
    if (isTamil) {
      const tamilVoice = voices.find(v => v.lang.includes("ta") || v.name.includes("Tamil"));
      if (tamilVoice) {
        utterance.voice = tamilVoice;
        utterance.lang = 'ta-IN';
      }
    } else {
      const jarvisVoice = voices.find(v => 
        v.name.includes("UK English Male") || 
        v.name.includes("Google UK English Male") || 
        v.name.includes("Arthur") || 
        v.name.includes("Daniel") ||
        v.name.includes("Male")
      );
      if (jarvisVoice) utterance.voice = jarvisVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.1; 
    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);
    utterance.onerror = () => setAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const executeAction = (url: string, name: string) => {
    speak(`Opening ${name} for you right away.`);
    setIsAwake(false);
    setStatus(`EXECUTING: OPEN ${name.toUpperCase()}...`);
    const newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
       setStatus('POP-UP BLOCKED! OVERRIDE REQUIRED.');
       setPendingAction({ url, name });
    } else {
       setTimeout(() => setStatus('LISTENING...'), 3000);
    }
  };

  const initSystem = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('ERROR: SPEECH RECOGNITION NOT SUPPORTED');
      return;
    }

    const rc = new SpeechRecognition();
    rc.continuous = true;
    rc.interimResults = true;
    rc.lang = navigator.language || 'en-US';

    rc.onstart = () => {
      setSystemActive(true);
      systemActiveRef.current = true;
      setStatus('LISTENING... (Say "Hey Jarvis")');
    };

    rc.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }

      if (interimTranscript.trim().length > 2) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setAiSpeaking(false);
        }
        setTranscript(`Hearing: "${interimTranscript.toLowerCase().trim()}"`);
      }

      if (!finalTranscript) return;
      const text = finalTranscript.trim();
      setTranscript(`Command: "${text}"`);

      const wakeWords = ['jarvis', 'hey', 'hello', 'wake up', 'வணக்கம்', 'vanakkam'];
      const textLower = text.toLowerCase();
      const textHasWakeWord = wakeWords.some(w => textLower.includes(w));

      if (textHasWakeWord || isAwakeRef.current) {
        let commandText = text;
        wakeWords.forEach(w => {
           const regex = new RegExp(`\\b${w}\\b`, 'gi');
           commandText = commandText.replace(regex, '').trim();
        });

        if (commandText.length > 0) {
           setIsAwake(true);
           queryGemini(commandText);
        } else if (textHasWakeWord) {
           setIsAwake(true);
           speak('I am at your service, sir.');
           setStatus('AWAKE AND LISTENING...');
        }
      }
    };

    rc.onend = () => {
       if (systemActiveRef.current) {
           try { rc.start(); } catch(e) {}
       }
    };

    recognitionRef.current = rc;
    try { rc.start(); } catch(e) {}
  };

  const currentSystemState: SystemState = (() => {
    if (!systemActive) return 'INACTIVE';
    if (status.includes('ERROR') || status.includes('QUOTA') || status.includes('BLOCKED')) return 'ALERT';
    if (status.includes('PROCESSING') || status.includes('EXECUTING')) return 'ANALYZING';
    if (aiSpeaking || status.includes('LISTENING') || status.includes('AWAKE')) return 'LISTENING';
    return 'IDLE';
  })();

  const getTheme = (state: SystemState, aiSpeaking: boolean) => {
    if (state === 'INACTIVE') return { 
      primary: '#083344', secondary: '#4c0519', danger: '#4c0519',
      pulseDur: 4, pulseOpacity: [0.05, 0.1, 0.05], scale: [1, 1.02, 1],
      rotateBase: 160, scanDur: 10, waveAmp: 2 
    };
    
    switch(state) {
      case 'ALERT':
        return { 
          primary: '#ef4444', secondary: '#ea580c', danger: '#ef4444',
          pulseDur: 0.6, pulseOpacity: [0.4, 0.9, 0.4], scale: [1, 1.3, 1],
          rotateBase: 30, scanDur: 1, waveAmp: 18 
        };
      case 'ANALYZING':
        return { 
          primary: '#38bdf8', secondary: '#f43f5e', danger: '#f43f5e',
          pulseDur: 0.8, pulseOpacity: [0.5, 1, 0.5], scale: [1, 1.15, 1],
          rotateBase: 40, scanDur: 2, waveAmp: 12 
        };
      case 'LISTENING':
        return { 
          primary: '#06b6d4', secondary: '#f43f5e', danger: '#f43f5e',
          pulseDur: aiSpeaking ? 0.2 : 2, pulseOpacity: aiSpeaking ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4], scale: aiSpeaking ? [1, 1.25, 1] : [1, 1.05, 1],
          rotateBase: aiSpeaking ? 50 : 80, scanDur: aiSpeaking ? 1.5 : 4, waveAmp: aiSpeaking ? 16 : 8 
        };
      case 'IDLE':
      default:
        return { 
          primary: '#22d3ee', secondary: '#9f1239', danger: '#f43f5e',
          pulseDur: 4, pulseOpacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1],
          rotateBase: 140, scanDur: 6, waveAmp: 5 
        };
    }
  };

  const theme = getTheme(currentSystemState, aiSpeaking);

  return (
    <div 
      className="relative min-h-screen bg-[#00040a] font-sans flex flex-col items-center justify-center overflow-hidden grid-bg transition-colors duration-1000"
      style={{ '--theme-primary': theme.primary } as any}
    >
      {/* Holographic Grain Overlay */}
      <div className="absolute inset-0 hologram-noise z-50 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,4,10,1)_95%)] pointer-events-none" />

      {/* CENTRAL CORE SYSTEM */}
      <div className="relative flex flex-col items-center justify-center w-full h-full z-10">
        
        {/* VOLUMETRIC HOLOGRAPHIC FOG */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen transition-all duration-1000"
          style={{
            background: `
              radial-gradient(circle at 50% 50%, ${theme.primary}40 0%, transparent 60%),
              radial-gradient(circle at 30% 60%, ${theme.secondary}20 0%, transparent 50%)
            `
          }}
        />

        {/* FLOATING ENERGY DUST */}
        {systemActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {[...Array(20)].map((_, i) => (
              <div 
                key={`dust-${i}`} 
                className="energy-dust" 
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 8}s`,
                  opacity: Math.random() * 0.5 + 0.2
                }} 
              />
            ))}
          </div>
        )}

        {/* HOLOGRAPHIC TELEMETRY GRAPHS */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1100px] pointer-events-none transition-opacity duration-1000 z-20 ${isAwake ? 'opacity-80' : 'opacity-0'}`}
          style={{ color: theme.primary }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <filter id="graph-glow">
                <feGaussianBlur stdDeviation="0.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* LEFT TELEMETRY BLOCK / WAVEFORM */}
            <motion.g 
              transform="translate(10, 90)" filter="url(#graph-glow)"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: theme.pulseOpacity }}
              transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut', delay: theme.pulseDur * 0.4 }}
            >
               <text x="0" y="-14" fontSize="3.5" fill="currentColor" className="font-mono tracking-widest font-bold transition-colors duration-500">CORE_ENRGY_SYNC</text>
               <text x="0" y="-9" fontSize="2" fill="currentColor" className="font-mono tracking-widest transition-colors duration-500" opacity="0.6">LOAD: {diagnostics.cpu}% / OPTIMAL</text>
               
               {/* Reference Grid */}
               <g opacity="0.15" stroke="currentColor" strokeWidth="0.1" className="transition-colors duration-500">
                 {[...Array(5)].map((_, i) => (
                   <line key={`h-${i}`} x1="0" y1={-8 + i * 4} x2="40" y2={-8 + i * 4} />
                 ))}
                 {[...Array(9)].map((_, i) => (
                   <line key={`v-${i}`} x1={i * 5} y1="-8" x2={i * 5} y2="8" />
                 ))}
               </g>

               {/* Moving Sine Wave */}
               <g transform="translate(0, 0)">
                 <motion.path 
                   d={`M 0 0 Q 5 -${theme.waveAmp} 10 0 T 20 0 T 30 0 T 40 0`}
                   fill="none" stroke="currentColor" strokeWidth="0.6" className="transition-colors duration-500"
                   animate={{ 
                     d: [
                       `M 0 0 Q 5 -${theme.waveAmp} 10 0 T 20 0 T 30 0 T 40 0`,
                       `M 0 0 Q 5 ${theme.waveAmp} 10 0 T 20 0 T 30 0 T 40 0`,
                       `M 0 0 Q 5 -${theme.waveAmp} 10 0 T 20 0 T 30 0 T 40 0`
                     ]
                   }}
                   transition={{ duration: theme.scanDur * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                 />
                 <motion.path 
                   d={`M 0 0 Q 5 ${theme.waveAmp * 0.6} 10 0 T 20 0 T 30 0 T 40 0`}
                   fill="none" stroke={theme.secondary} strokeWidth="0.3" opacity="0.5" className="transition-colors duration-500"
                   animate={{ 
                     d: [
                       `M 0 0 Q 5 ${theme.waveAmp * 0.6} 10 0 T 20 0 T 30 0 T 40 0`,
                       `M 0 0 Q 5 -${theme.waveAmp * 0.6} 10 0 T 20 0 T 30 0 T 40 0`,
                       `M 0 0 Q 5 ${theme.waveAmp * 0.6} 10 0 T 20 0 T 30 0 T 40 0`
                     ]
                   }}
                   transition={{ duration: theme.scanDur * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                 />
               </g>

               {/* Bar Indicators */}
               <g transform="translate(0, 12)">
                 {[4, 2, 5, 3, 6, 2, 4, 7, 3, 5, 2, 4, 6, 3, 5].map((h, i) => (
                   <motion.rect 
                     key={`bar-${i}`} x={i * 2.7} width="1.5" fill="currentColor" className="transition-colors duration-500"
                     animate={{ 
                       height: [1, h, 1],
                       y: [5, 5 - h, 5]
                     }}
                     transition={{ duration: theme.scanDur * (0.2 + (i % 3) * 0.1), repeat: Infinity, ease: "easeInOut" }}
                   />
                 ))}
               </g>
            </motion.g>

            {/* RIGHT TELEMETRY BLOCK / RADAR & METERS */}
            <motion.g 
              transform="translate(190, 90)" filter="url(#graph-glow)"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: theme.pulseOpacity }}
              transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut', delay: theme.pulseDur * 0.6 }}
            >
               <text x="-45" y="-14" fontSize="3.5" fill={theme.danger} className="font-mono tracking-widest font-bold transition-colors duration-500">THREAT_METRICS</text>
               <text x="-45" y="-9" fontSize="2" fill={theme.danger} className="font-mono tracking-widest transition-colors duration-500" opacity="0.6">ANALYSIS: {diagnostics.threatLevel}</text>

               {/* Vertical Bar Meters */}
               <g transform="translate(-45, -5)">
                 {[
                   { h: [5, 15, 5], y: [15, 5, 15], dur: 2 },
                   { h: [12, 4, 12], y: [8, 16, 8], dur: 1.5 },
                   { h: [18, 10, 18], y: [2, 10, 2], dur: 2.5 }
                 ].map((anim, i) => (
                   <g key={`meter-${i}`} transform={`translate(${i * 4}, 0)`}>
                     <rect x="0" y="0" width="2" height="20" fill="none" stroke={theme.danger} className="transition-colors duration-500" strokeWidth="0.2" opacity="0.3" />
                     <motion.rect 
                       x="0" width="2" fill={theme.danger} className="transition-colors duration-500"
                       animate={{ height: anim.h, y: anim.y }}
                       transition={{ duration: anim.dur * theme.scanDur * 0.25, repeat: Infinity, ease: "easeInOut" }}
                     />
                   </g>
                 ))}
               </g>

               {/* Radar Target Graphic */}
               <g transform="translate(-15, 5)">
                 <circle cx="0" cy="0" r="10" fill="none" stroke={theme.danger} className="transition-colors duration-500" strokeWidth="0.3" opacity="0.6" strokeDasharray="1 2" />
                 <circle cx="0" cy="0" r="15" fill="none" stroke={theme.danger} className="transition-colors duration-500" strokeWidth="0.2" opacity="0.4" />
                 <circle cx="0" cy="0" r="1.5" fill={theme.danger} className="transition-colors duration-500" />
                 <line x1="-15" y1="0" x2="15" y2="0" stroke={theme.danger} className="transition-colors duration-500" strokeWidth="0.2" opacity="0.4" />
                 <line x1="0" y1="-15" x2="0" y2="15" stroke={theme.danger} className="transition-colors duration-500" strokeWidth="0.2" opacity="0.4" />
                 
                 {/* Rotating Radar Sweep */}
                 <motion.path 
                   d="M 0 0 L 0 -15 A 15 15 0 0 1 10 -11 Z" 
                   fill={theme.danger} opacity="0.3" className="transition-colors duration-500"
                   animate={{ rotate: 360 }}
                   transition={{ duration: theme.scanDur, repeat: Infinity, ease: 'linear' }}
                 />
                 
                 {/* Blips */}
                 <motion.circle 
                   cx="6" cy="-6" r="1" fill={theme.danger} className="transition-colors duration-500"
                   animate={{ opacity: [0, 1, 0, 0, 0] }}
                   transition={{ duration: theme.scanDur, repeat: Infinity }}
                 />
                 <motion.circle 
                   cx="-8" cy="4" r="1" fill={theme.danger} className="transition-colors duration-500"
                   animate={{ opacity: [0, 0, 0, 1, 0] }}
                   transition={{ duration: theme.scanDur, repeat: Infinity, delay: theme.scanDur * 0.5 }}
                 />
               </g>
            </motion.g>

            {/* TOP RIGHT ROTATING SCHEMATICS / COMPASS */}
            <motion.g 
              transform="translate(170, 25)" filter="url(#graph-glow)"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: theme.pulseOpacity }}
              transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut', delay: theme.pulseDur * 0.5 }}
            >
               <motion.g animate={{ rotate: 360 }} transition={{ duration: theme.rotateBase * 0.2, repeat: Infinity, ease: "linear" }}>
                 <circle cx="0" cy="0" r="12" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 4" opacity="0.6" className="transition-colors duration-500" />
                 <circle cx="0" cy="0" r="8" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.3" className="transition-colors duration-500" />
                 <polygon points="0,-16 3,-10 -3,-10" fill="currentColor" className="transition-colors duration-500" />
                 <polygon points="0,16 3,10 -3,10" fill="currentColor" opacity="0.3" className="transition-colors duration-500" />
                 <line x1="-12" y1="0" x2="12" y2="0" stroke="currentColor" strokeWidth="0.3" opacity="0.5" className="transition-colors duration-500" />
               </motion.g>
               <text x="-12" y="22" fontSize="2.5" fill="currentColor" className="font-mono uppercase tracking-widest transition-colors duration-500" opacity="0.6">NAV_SYSTEM</text>
            </motion.g>

            {/* TOP LEFT DATA STREAM / MEMORY */}
            <motion.g 
              transform="translate(30, 25)" filter="url(#graph-glow)"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: theme.pulseOpacity }}
              transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut', delay: theme.pulseDur * 0.3 }}
            >
               <text x="0" y="0" fontSize="3" fill="currentColor" className="font-mono uppercase tracking-widest font-bold transition-colors duration-500">MEM_ALLOC</text>
               <g transform="translate(0, 4)">
                 {[...Array(12)].map((_, i) => (
                   <motion.rect 
                     key={`mem-${i}`} x={i * 3.5} y="0" width="2.5" height="4" fill="currentColor" className="transition-colors duration-500"
                     animate={{ opacity: [0.2, 0.9, 0.2] }}
                     transition={{ duration: theme.scanDur * 0.25, delay: i * 0.05, repeat: Infinity }}
                   />
                 ))}
                 <text x="0" y="10" fontSize="2" fill="currentColor" className="font-mono tracking-widest transition-colors duration-500" opacity="0.6">BLOCK_SECTORS: {diagnostics.memory}</text>
               </g>
            </motion.g>
            
            {/* BOTTOM LOWER LEFT POLAR GRAPH */}
            <motion.g 
              transform="translate(30, 175)" filter="url(#graph-glow)"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: theme.pulseOpacity }}
              transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut', delay: theme.pulseDur * 0.7 }}
            >
               <motion.g animate={{ rotate: -360 }} transition={{ duration: theme.rotateBase * 0.3, repeat: Infinity, ease: "linear" }}>
                 <path d="M 0 -15 A 15 15 0 0 1 15 0" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" className="transition-colors duration-500" />
                 <path d="M -10 10 A 15 15 0 0 1 -15 0" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.8" className="transition-colors duration-500" />
                 <path d="M -8 -8 L -15 -15" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="transition-colors duration-500" />
                 <circle cx="0" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 1" className="transition-colors duration-500" />
               </motion.g>
               <text x="0" y="5" fontSize="2" fill="currentColor" className="font-mono tracking-widest transition-colors duration-500" opacity="0.8">AUX_POWER</text>
            </motion.g>
            
            {/* BOTTOM LOWER RIGHT CIRCULAR DIAGNOSTIC */}
            <motion.g 
              transform="translate(170, 175)" filter="url(#graph-glow)"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: theme.pulseOpacity }}
              transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut', delay: theme.pulseDur * 0.8 }}
            >
               <text x="-16" y="5" fontSize="2" fill={theme.danger} className="font-mono tracking-widest transition-colors duration-500" opacity="0.8">FIREWALL</text>
               <motion.g animate={{ rotate: 360 }} transition={{ duration: theme.rotateBase * 0.15, repeat: Infinity, ease: "linear" }}>
                 <circle cx="0" cy="0" r="12" fill="none" stroke={theme.danger} strokeWidth="1" strokeDasharray="10 5" opacity="0.6" className="transition-colors duration-500" />
                 <circle cx="0" cy="0" r="8" fill="none" stroke={theme.danger} strokeWidth="2" strokeDasharray="2 8" opacity="0.8" className="transition-colors duration-500" />
               </motion.g>
            </motion.g>
          </svg>
        </div>

        {/* HUD RINGS SYSTEM (Premium Schematic Layout) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] flex items-center justify-center pointer-events-none">
          {[1, 0.6, 0.35, 0.2].map((speedMult, i) => (
            <motion.svg 
              key={i}
              className="absolute inset-0 w-full h-full" 
              viewBox="0 0 100 100" 
              initial={{ rotate: 0 }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: theme.rotateBase * speedMult, repeat: Infinity, ease: "linear" }}
            >
              <circle cx="50" cy="50" r={48 - i * 6} fill="none" stroke="#083344" strokeWidth="0.1" strokeDasharray="1 4" />
              <motion.circle 
                cx="50" cy="50" r={48 - i * 6} 
                initial={{ opacity: 0.02 }}
                fill="none" 
                stroke={i === 1 ? theme.secondary : theme.primary} 
                strokeWidth="0.2" 
                strokeDasharray={i === 0 ? "10 90" : i === 1 ? "15 85" : "1 9"}
                className="transition-colors duration-1000"
                animate={isAwake ? { opacity: theme.pulseOpacity } : { opacity: [0.02, 0.05, 0.02] }}
                transition={{ duration: theme.pulseDur, repeat: Infinity, ease: "easeInOut", delay: theme.pulseDur * (0.3 + i * 0.05) }}
              />
            </motion.svg>
          ))}
        </div>

        {/* Central Iron Man Piece */}
        <div 
          onClick={() => {
            if (!systemActive) {
              setSystemActive(true);
              setIsAwake(true);
              speak('System online.');
              initSystem();
            } else if (!isAwake) {
              setIsAwake(true);
            }
          }}
          className={`relative z-30 w-full max-w-[650px] h-[650px] transition-all duration-700 flex items-center justify-center hologram-flicker
            ${isAwake ? 'scale-100' : 'hover:scale-95 cursor-pointer'}
          `}
        >
          <div className="w-full h-full relative pointer-events-none">
             {/* Underglow Atmosphere */}
             <motion.div 
               style={{ backgroundColor: theme.primary }}
               initial={{ opacity: 0, scale: 1 }}
               animate={isAwake ? { 
                 opacity: theme.pulseOpacity.map(o => o * 0.4),
                 scale: theme.scale
               } : { opacity: 0 }}
               transition={{ duration: theme.pulseDur, repeat: Infinity, ease: "easeInOut", delay: theme.pulseDur * 0.1 }}
               className="absolute inset-0 blur-[130px] rounded-full transition-colors duration-1000"
             />

             {/* Core Shockwaves */}
             {systemActive && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-14 w-8 h-8 rounded-full pointer-events-none z-10">
                 <motion.div
                   className="absolute inset-0 rounded-full border border-current mix-blend-screen"
                   style={{ color: theme.primary }}
                   animate={{ scale: [1, 20], opacity: [0.6, 0] }}
                   transition={{ duration: theme.pulseDur * 2, repeat: Infinity, ease: "easeOut" }}
                 />
                 <motion.div
                   className="absolute inset-0 rounded-full border-2 border-current mix-blend-screen"
                   style={{ color: theme.secondary }}
                   animate={{ scale: [1, 30], opacity: [0.2, 0] }}
                   transition={{ duration: theme.pulseDur * 2.5, repeat: Infinity, ease: "easeOut", delay: theme.pulseDur * 0.5 }}
                 />
               </div>
             )}

             <svg 
              viewBox="0 0 100 120" 
              className={`w-full h-full transition-all duration-1000 z-20 relative ${isAwake ? 'opacity-100' : 'opacity-40'}`}
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="strong-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                     <feMergeNode in="blur" />
                     <feMergeNode in="blur" />
                     <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g filter="url(#glow)">
                {/* ARMOR SCHEMATIC (Uses Secondary/Danger coloring) */}
                <motion.g 
                  style={{ color: theme.secondary }} 
                  className="transition-colors duration-1000"
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: theme.pulseOpacity.map(o => o * 0.8 + 0.2) }}
                  transition={{ duration: theme.pulseDur, repeat: Infinity, ease: "easeInOut", delay: theme.pulseDur * 0.3 }}
                >
                  {/* HELMET STRUCTURE (Advanced Layered Geometry) */}
                  {/* Crown and main skull structure */}
                  <path d="M50 4 C36 4 28 14 28 28 V40 L31 48 L38 55 L50 58 L62 55 L69 48 L72 40 V28 C72 14 64 4 50 4 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  
                  {/* Top Head Ridges */}
                  <path d="M42 4 V12 M58 4 V12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
                  <path d="M34 16 L31 10 M66 16 L69 10" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />

                  {/* FOREHEAD ARMOR PLATES */}
                  {/* Central forehead rectangular structure */}
                  <path d="M43 14 H57 V22 H43 Z" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
                  <path d="M43 14 L38 18 L38 22 L43 22" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                  <path d="M57 14 L62 18 L62 22 L57 22" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                  <path d="M50 4 V14 M50 22 V26" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                  
                  {/* BROW & FACEPLATE SPLIT */}
                  {/* Main horizontal cut above eyes */}
                  <path d="M34 30 C38 28 44 26 50 26 C56 26 62 28 66 30" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  
                  {/* CHEEK & JAW MECHANICS */}
                  {/* Outer cheek drop */}
                  <path d="M34 36 L28 40 L31 48 L35 52 M66 36 L72 40 L69 48 L65 52" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
                  
                  {/* Inner cheek angled lines */}
                  <path d="M36 38 L34 46 L39 52 M64 38 L66 46 L61 52" fill="none" stroke="currentColor" strokeWidth="1" />
                  
                  {/* SIDE MECHANICAL PANELS (EARS) */}
                  <path d="M28 26 L24 28 V38 L28 41 M72 26 L76 28 V38 L72 41" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.8" />
                  <path d="M24 30 L26 30 V36 L24 36 M76 30 L74 30 V36 L76 36" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                  <circle cx="26" cy="33" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="74" cy="33" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.8" />

                  {/* JAW DETAILING */}
                  {/* The distinct mouth W-shape */}
                  <path d="M41 46.5 L44 50 L50 48 L56 50 L59 46.5" fill="none" stroke="currentColor" strokeWidth="1" />
                  <path d="M40 50.5 L50 55 L60 50.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  {/* Inner jaw segmented lines */}
                  <path d="M45 51 V56 M50 48 V56 M55 51 V56" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
                  
                  {/* Internal Structural Lines & Eye Sockets */}
                  <path d="M38 30.5 L47.5 30.5 L48.5 35.5 L39.5 35.5 Z M62 30.5 L52.5 30.5 L51.5 35.5 L60.5 35.5 Z" fill="currentColor" opacity={isAwake ? 0.15 : 0.05} />
                  
                  {/* SHOULDERS & CHEST (Reference Match) */}
                  <g transform="translate(0, 4)">
                    {/* Neck Ribbing System */}
                    <path d="M44 54 H56 M44 57 H56 M45 60 H55" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
                    <path d="M40 56 L15 62 L10 85 L20 96 L50 100 L80 96 L90 85 L85 62 L60 56" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="30" cy="72" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="70" cy="72" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M50 62 L32 75 L30 95 M50 62 L68 75 L70 95" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M22 68 L32 75 M78 68 L68 75" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  </g>
                </motion.g>

                {/* THE CORE (Primary Glow Elements) */}
                <g style={{ color: theme.primary }} className="transition-colors duration-1000">
                  {/* THE EYES */}
                  <motion.g 
                    filter="url(#strong-glow)"
                    initial={{ opacity: 0.1 }}
                    animate={isAwake ? { opacity: theme.pulseOpacity.map(o => o * 0.5 + 0.5) } : { opacity: 0.1 }}
                    transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut', delay: theme.pulseDur * 0.2 }}
                  >
                    {/* Realistic Iron Man Eye Polygons */}
                    {/* Core intense white center */}
                    <path 
                      d="M 38 31.5 L 47 34 L 46 36 L 40 33.5 Z M 62 31.5 L 53 34 L 54 36 L 60 33.5 Z" 
                      fill="white"
                    />
                    {/* Primary color inner glow */}
                    <path 
                      d="M 37.5 31 L 47.5 34 L 46.5 36.5 L 39.5 34 Z M 62.5 31 L 52.5 34 L 53.5 36.5 L 60.5 34 Z" 
                      fill="currentColor"
                      opacity="0.8"
                    />
                    {/* Broad blur glow */}
                    <path 
                      d="M 37 30 L 48 34.5 L 46 37 L 39 34.5 Z M 63 30 L 52 34.5 L 54 37 L 61 34.5 Z" 
                      fill="currentColor"
                      filter="url(#strong-glow)"
                      opacity="0.4"
                    />
                  </motion.g>

                  {/* ARC REACTOR (Primary Sync Pulse) */}
                  <g transform="translate(0, 10)">
                    {/* Outer Rotating Segmented Ring */}
                    <motion.g animate={{ rotate: 360 }} transition={{ duration: theme.rotateBase * 0.5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '50px 78px' }}>
                      <circle cx="50" cy="78" r="18" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="4 6" opacity="0.4" className="transition-colors duration-500" />
                      <circle cx="50" cy="78" r="18" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="0 40 1 10" opacity="0.8" className="transition-colors duration-500" />
                    </motion.g>
                    
                    {/* Inner Rotating Gear */}
                    <motion.g animate={{ rotate: -360 }} transition={{ duration: theme.rotateBase * 0.3, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '50px 78px' }}>
                      <circle cx="50" cy="78" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.3" className="transition-colors duration-500" />
                    </motion.g>
                    
                    <motion.g 
                      filter="url(#strong-glow)"
                      initial={{ opacity: 0.1 }}
                      animate={isAwake ? { opacity: theme.pulseOpacity.map(o => o * 0.4 + 0.6) } : { opacity: 0.1 }}
                      transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {/* Reactor Chamber Wall */}
                      <circle cx="50" cy="78" r="11" fill="none" stroke="currentColor" strokeWidth="1.8" className="transition-colors duration-500" />
                      <circle cx="50" cy="78" r="11" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />
                      
                      {/* Deep internal distortion web */}
                      <motion.g animate={{ rotate: 360 }} transition={{ duration: theme.rotateBase * 0.8, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '50px 78px' }} opacity="0.4">
                        <path d="M50 67 L53 73 L60 76 L54 80 L52 87 L48 87 L46 80 L40 76 L47 73 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="transition-colors duration-500" />
                      </motion.g>

                      {/* Hot Core Element */}
                      <motion.circle 
                        cx="50" cy="78" r="7.5" 
                        fill="white" 
                        initial={{ scale: 1 }}
                        animate={isAwake ? { 
                          scale: theme.scale,
                        } : { scale: 1 }}
                        transition={{ duration: theme.pulseDur, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <circle cx="50" cy="78" r="13" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.2" className="transition-colors duration-500" />
                    </motion.g>
                  </g>
                </g>
              </g>

              {/* Holographic Scanlines */}
              <g opacity="0.03">
                {[...Array(30)].map((_, i) => (
                  <rect key={i} x="0" y={i * 4} width="100" height="0.5" fill="currentColor" />
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* SYSTEM STATUS FOOTER */}
        <div className="mt-8 flex flex-col items-center gap-2 z-20">
           <div className="flex items-center gap-3">
              <motion.div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: theme.primary }}
                initial={{ opacity: 0.2 }}
                animate={isAwake ? { opacity: theme.pulseOpacity } : { opacity: 0.2 }}
                transition={{ duration: theme.pulseDur, repeat: Infinity }}
              />
              <div 
                className="text-[11px] tracking-[0.8em] font-bold uppercase font-mono transition-colors duration-1000"
                style={{ color: theme.secondary }}
              >
                {status}
              </div>
           </div>
        </div>
      </div>

      {/* POPUP OVERRIDE */}
      {pendingAction && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-rose-950/40 border border-rose-500/50 p-10 text-center max-w-sm rounded-sm">
             <Shield className="w-16 h-16 text-rose-500 mx-auto mb-6 animate-pulse" />
             <div className="text-xl font-bold tracking-[0.2em] text-rose-100 mb-2">ACCESS_BLOCKED</div>
             <div className="text-[10px] tracking-widest text-rose-400 mb-8 uppercase leading-relaxed">
               Manual credential override required to open {pendingAction.name.toUpperCase()}.
             </div>
             <button
                onClick={() => {
                  window.open(pendingAction.url, '_blank');
                  setPendingAction(null);
                  setStatus('LISTENING...');
                }}
                className="w-full py-4 text-white bg-rose-600 font-bold tracking-[0.3em] uppercase hover:bg-rose-500 transition-all rounded-sm"
             >
               Confirm Access
             </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
