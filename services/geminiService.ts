
import { GoogleGenAI, Type } from "@google/genai";
import { AmbulanceSimulation, TrafficSignalAction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const orchestrateMission = async (origin: string, destination: string): Promise<{
  simulation: AmbulanceSimulation;
  signals: TrafficSignalAction[];
}> => {
  // Switched to gemini-3-flash-preview for speed and reliability to fix "hang" issues
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the SAM Orchestrator. Direct an ambulance from ${origin} to ${destination} in Ottawa.
    
    Output a JSON object with:
    1. simulation: totalDistanceMeters, totalTimeSeconds, segments (array), polyline (coord array).
    2. signals: array of preemption intersections along the route with traffic_light_id, lat, lon.
    
    Rules:
    - Segments MUST include street name, start/end [lat, lon], and length.
    - Speed ~70km/h.
    - Segments are sequential.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          simulation: {
            type: Type.OBJECT,
            properties: {
              route: {
                type: Type.OBJECT,
                properties: {
                  totalDistanceMeters: { type: Type.NUMBER },
                  totalTimeSeconds: { type: Type.NUMBER },
                  segments: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        street: { type: Type.STRING },
                        start: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        end: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        lengthMeters: { type: Type.NUMBER },
                        expectedTimeSeconds: { type: Type.NUMBER },
                        arrivalTimestamp: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              },
              polyline: {
                type: Type.ARRAY,
                items: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              },
              startTimestamp: { type: Type.NUMBER }
            }
          },
          signals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                traffic_light_id: { type: Type.NUMBER },
                lat: { type: Type.NUMBER },
                lon: { type: Type.NUMBER },
                duration_seconds: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  });

  try {
    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr.trim());
    if (!data.simulation.startTimestamp) data.simulation.startTimestamp = 0;
    return data;
  } catch (error) {
    console.error("Failed to parse Gemini SAM response", error);
    throw error;
  }
};
