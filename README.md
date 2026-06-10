# GreenWave — SAM Ambulance Mission Control

A real-time emergency response orchestration system that simulates AI-driven ambulance routing and smart traffic signal preemption. Built on the **Solace Agent Mesh (SAM)** architecture, it demonstrates decentralized coordination between AI orchestrators, emergency vehicles, and smart city infrastructure.

---

## Overview

GreenWave (SAM Ambulance Mission Control) simulates emergency vehicle dispatch in Ottawa, Canada. When an ambulance is dispatched, an AI orchestrator (powered by Google Gemini) calculates the optimal route in real time. As the ambulance approaches intersections, MQTT messages are sent to force traffic signals into a Green Extension mode (+15 seconds), clearing the path. A live dashboard shows telemetry, route, and signal states.

---

## Features

- **AI Mission Orchestration** — Google Gemini analyzes terrain and calculates optimal ambulance routes
- **Smart Traffic Signal Preemption** — MQTT commands force intersections into Green Extension mode (+15s)
- **Real-time Telemetry** — live tracking of ambulance velocity, ETA, and GPS coordinates
- **Interactive Map** — Leaflet.js with CartoDB Dark Matter tiles showing Ottawa roads and signals
- **Multi-Agent Architecture** — Orchestrator, TrafficBrain, and Signal agents with distinct roles
- **Autonomous Signal Cycles** — traffic lights run independently until overridden by preemption

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Lucide React |
| Map | Leaflet.js + CartoDB Dark Matter |
| Road data | OpenStreetMap via Overpass API |
| AI / LLM | Google Gemini (`gemini-2.0-flash-preview`) |
| Messaging | MQTT over WSS (Solace PubSub+) |
| Dashboard conn. | WebSockets (WSS) |

---

## Project Structure

```
GreenWave/
├── components/             # React UI components (map, dashboard, signal overlay)
├── services/
│   ├── geminiService.ts    # AI orchestration via Google Gemini
│   ├── mqttService.ts      # MQTT client for Solace PubSub+
│   └── overpassService.ts  # OpenStreetMap road data queries
├── App.tsx                 # Root application component
├── index.tsx               # Entry point
├── index.html
├── metadata.json           # Project metadata
└── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Google AI Studio](https://aistudio.google.com/) API key (for Gemini)
- A [Solace PubSub+](https://solace.com/products/event-broker/cloud/) account (for MQTT broker)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/diam145/GreenWave.git
cd GreenWave
```

2. Install dependencies:

```bash
npm install
```

3. Configure your API keys:

   - In `services/geminiService.ts`, replace the `apiKey` value with your Google Gemini API key.
   - In `services/mqttService.ts`, update `BROKER_URL`, `USERNAME`, and `PASSWORD` with your Solace PubSub+ broker credentials.

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## System Architecture

```
[Google Gemini AI]
    ↓ route calculation
[Orchestrator Agent]
    ↓ MQTT commands (Solace PubSub+)
[TrafficBrain Agent] → [Signal Agents]
    ↓ preemption events
[React Dashboard] ← [WebSocket telemetry]
```

---

## Author

**[@diam145](https://github.com/diam145)**

---

## License

This project does not currently have a license. All rights reserved by the author.
