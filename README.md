# SAM Ambulance Mission Control

A real-time emergency response orchestration system designed for mission-critical ambulance routing and traffic-signal preemption. Built on the **Solace Agent Mesh (SAM)** architecture, this application demonstrates decentralized coordination between AI orchestrators, emergency vehicles, and smart city infrastructure.

## 🚑 Project Overview

The application simulates a high-stakes emergency scenario in Ottawa, Canada. It leverages distributed messaging and generative AI to ensure an ambulance reaches its destination with zero latency from city infrastructure.

### Key Features
- **AI Mission Orchestration**: Uses Google Gemini to analyze terrain, calculate optimal routes, and identify critical intersections for preemption.
- **Smart City Simulation**: Real-time visualization of city-wide traffic signals with autonomous cycles (10s Green, 2s Yellow, 6s Red).
- **Dynamic Preemption**: Responds to MQTT-based commands to force intersections into "Green Extension" mode (+15s) for approaching emergency units.
- **Real-time Telemetry**: Live tracking of ambulance velocity, ETA, and GPS coordinates synchronized via a messaging mesh.
- **Multi-Agent Architecture**: Discrete logic for the Orchestrator, TrafficBrain, and individual Signal agents.

## 🛠 Tech Stack

### Core Frameworks
- **React 19**: Modern frontend architecture using Hooks and functional components.
- **Tailwind CSS**: Utility-first styling for a high-performance, dark-themed mission control aesthetic.
- **Lucide React**: Vector-based iconography for telemetry and status indicators.

### Geospatial & Data
- **Leaflet.js**: High-performance interactive mapping engine.
- **CartoDB Dark Matter**: Specialized map tiles for low-light command center environments.
- **Overpass API (OpenStreetMap)**: Real-time fetching of actual city infrastructure, roads, and traffic signal nodes.

### Intelligence & Messaging
- **Google Gemini API**: Specifically `gemini-3-flash-preview` for low-latency mission planning and complex JSON routing outputs.
- **MQTT (Solace PubSub+)**: Mission-critical messaging backbone for real-time signal commands and location updates.
- **WebSockets (WSS)**: Secure real-time link between the dashboard and the messaging broker.

## 🏗 System Architecture (SAM)

1.  **The Orchestrator**: An AI agent that receives the emergency call, generates the route, and calculates the "Signal Intercept Sequence."
2.  **The Ambulance Agent**: A simulated agent publishing its location and speed to the `sam/ambulance/location` topic.
3.  **The TrafficBrain**: A monitoring agent that listens to the ambulance path and publishes preemption commands to `sam/signals/command/{id}`.
4.  **The Dashboard**: A unified view for human operators to monitor the health of the agent mesh and mission progress.

## Example of Simulation

<img width="1284" height="688" alt="image" src="https://github.com/user-attachments/assets/edde9740-486d-4dc3-8ff0-d78e81f3ef78" />

---

*This project is built for high-performance visualization of distributed intelligent systems.*
