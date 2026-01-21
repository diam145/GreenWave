
const bbox = [
  45.3850, // south (covers Civic Hospital)
  -75.7300, // west
  45.4350, // north (covers Rideau/Downtown)
  -75.6700  // east
].join(',');

export interface TrafficLight {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    highway: string;
    crossing?: string;
  };
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchMapData = async (retryCount = 0): Promise<{ signals: any[], roads: any[] }> => {
  const query = `
    [out:json][timeout:60];
    (
      node["highway"="traffic_signals"](${bbox});
      way["highway"~"primary|secondary|residential"](${bbox});
    );
    out geom;
  `;

  const endpoint = OVERPASS_ENDPOINTS[retryCount % OVERPASS_ENDPOINTS.length];

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: query,
    });

    if (res.status === 429 && retryCount < 3) {
      await sleep(2000);
      return fetchMapData(retryCount + 1);
    }

    if (!res.ok) {
      if (retryCount < 2) {
        await sleep(1000);
        return fetchMapData(retryCount + 1);
      }
      throw new Error(`Overpass API returned status ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || !data.elements) {
      throw new Error("Invalid data format received from Overpass");
    }

    const signals = data.elements.filter((el: any) => 
      el.type === "node" && el.tags && el.tags.highway === "traffic_signals"
    ).map((el: any) => ({
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      tags: el.tags,
    }));

    const roads = data.elements.filter((el: any) => 
      el.type === "way" && el.tags && el.tags.highway
    );

    return { signals, roads };
  } catch (error) {
    console.error("Overpass Service Error:", error);
    if (retryCount < 2) {
      await sleep(1500);
      return fetchMapData(retryCount + 1);
    }
    throw error;
  }
};
