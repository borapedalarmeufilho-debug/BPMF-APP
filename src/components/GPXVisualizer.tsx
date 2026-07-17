import React, { useState, useEffect, useRef } from "react";
import { Upload, FileCode, CheckCircle2, AlertCircle, ExternalLink, Map, MapPin, Compass, Info, FileText, Landmark, TrendingUp, Download } from "lucide-react";

interface GPXPoint {
  lat: number;
  lon: number;
  ele: number; // elevation in meters
  dist: number; // cumulative distance in km
  label?: string;
  time?: string;
}

interface GPXWaypoint {
  lat: number;
  lon: number;
  name: string;
  desc?: string;
  ele?: number;
  distFromStart?: number; // Calculated nearest point in route
}

interface GPXVisualizerProps {
  routeId: string;
  routeName: string;
  totalKm: number;
  links: {
    wikiloc_completa: string;
    wikiloc_cicloviagem: string;
    cptm_bike: string;
    strava?: string;
    komoot?: string;
    google_maps?: string;
  };
}

// Helper to calculate distance between coordinates (Haversine formula)
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Pre-generated coordinates & elevations to simulate high-fidelity maps for our routes
const PRELOADED_ROUTES_DATA: Record<string, GPXPoint[]> = {
  rota_da_luz: [
    { lat: -23.5235, lon: -46.1864, ele: 742, dist: 0, label: "Mogi das Cruzes (Largada)" },
    { lat: -23.4981, lon: -46.1245, ele: 710, dist: 10 },
    { lat: -23.4423, lon: -46.0312, ele: 605, dist: 18, label: "Vila de Luís Carlos" },
    { lat: -23.4721, lon: -45.9412, ele: 630, dist: 30 },
    { lat: -23.5189, lon: -45.8821, ele: 652, dist: 45, label: "Ponte Santa Branca" },
    { lat: -23.5412, lon: -45.7921, ele: 720, dist: 60 },
    { lat: -23.5978, lon: -45.6621, ele: 615, dist: 78, label: "Paraibuna (Dia 1)" },
    { lat: -23.5112, lon: -45.5921, ele: 710, dist: 95 },
    { lat: -23.4012, lon: -45.5321, ele: 622, dist: 113, label: "Redenção da Serra" },
    { lat: -23.3212, lon: -45.4721, ele: 998, dist: 135, label: "Morro do Batman ⛰️" },
    { lat: -23.2412, lon: -45.4221, ele: 580, dist: 148 },
    { lat: -22.9235, lon: -45.4412, ele: 550, dist: 159, label: "Pindamonhangaba (Dia 2)" },
    { lat: -22.8912, lon: -45.3121, ele: 540, dist: 170 },
    { lat: -22.8812, lon: -45.2421, ele: 582, dist: 179, label: "Mosteiro Sagrada Face" },
    { lat: -22.8612, lon: -45.1821, ele: 540, dist: 190 },
    { lat: -22.8512, lon: -45.1612, ele: 545, dist: 201.5, label: "Basílica de Aparecida (Fim)" }
  ],
  caminho_da_fe: [
    { lat: -22.0123, lon: -46.7123, ele: 840, dist: 0, label: "Águas da Prata (Largada)" },
    { lat: -22.0521, lon: -46.6812, ele: 1180, dist: 15, label: "Serra dos Lima" },
    { lat: -22.0812, lon: -46.6412, ele: 920, dist: 34, label: "Andradas (Dia 1)" },
    { lat: -22.1412, lon: -46.5121, ele: 1250, dist: 55 },
    { lat: -22.2812, lon: -46.4312, ele: 890, dist: 80, label: "Ouro Fino (Dia 2)" },
    { lat: -22.3112, lon: -46.3512, ele: 1120, dist: 98, label: "Inconfidentes" },
    { lat: -22.4212, lon: -46.2512, ele: 870, dist: 122, label: "Borda da Mata (Dia 3)" },
    { lat: -22.5112, lon: -46.1212, ele: 1380, dist: 150, label: "Serra do Caçador" },
    { lat: -22.6212, lon: -46.0312, ele: 910, dist: 172, label: "Estiva" },
    { lat: -22.7512, lon: -45.9212, ele: 1590, dist: 210, label: "Luminosa ⛰️" },
    { lat: -22.8512, lon: -45.7812, ele: 1780, dist: 245, label: "Topo da Mantiqueira" },
    { lat: -22.9123, lon: -45.6912, ele: 1620, dist: 270, label: "Campos do Jordão" },
    { lat: -22.8512, lon: -45.1612, ele: 545, dist: 318, label: "Basílica de Aparecida (Fim)" }
  ],
  vale_europeu: [
    { lat: -26.8234, lon: -49.2712, ele: 70, dist: 0, label: "Timbó (Largada)" },
    { lat: -26.7812, lon: -49.2012, ele: 120, dist: 12 },
    { lat: -26.7412, lon: -49.1812, ele: 85, dist: 27, label: "Pomerode (Dia 1)" },
    { lat: -26.7112, lon: -49.2512, ele: 210, dist: 50 },
    { lat: -26.6512, lon: -49.3212, ele: 320, dist: 75, label: "Indaial (Dia 2)" },
    { lat: -26.8812, lon: -49.4412, ele: 440, dist: 115, label: "Rodeio" },
    { lat: -26.9812, lon: -49.5112, ele: 560, dist: 150, label: "Doutor Pedrinho (Dia 3)" },
    { lat: -27.0512, lon: -49.6212, ele: 710, dist: 195, label: "Alto Cedros (Dia 4)" },
    { lat: -26.9212, lon: -49.6812, ele: 610, dist: 240, label: "Palmeiras (Dia 5)" },
    { lat: -26.8512, lon: -49.5212, ele: 340, dist: 295, label: "Apiúna (Dia 6)" },
    { lat: -26.8234, lon: -49.2712, ele: 70, dist: 350, label: "Timbó (Retorno - Fim)" }
  ]
};

// Preloaded simulated waypoints
const PRELOADED_WAYPOINTS: Record<string, GPXWaypoint[]> = {
  rota_da_luz: [
    { lat: -23.5235, lon: -46.1864, name: "Estação Mogi das Cruzes", desc: "Ponto de partida. Bicicletas liberadas nos finais de semana na CPTM.", ele: 742, distFromStart: 0 },
    { lat: -23.4423, lon: -46.0312, name: "Estação Luís Carlos", desc: "Parada histórica charmosa com cafés e excelente infraestrutura para fotos.", ele: 605, distFromStart: 18 },
    { lat: -23.5189, lon: -45.8821, name: "Ponte de Santa Branca", desc: "Transição sobre o belo Rio Paraíba do Sul. Cuidado com o tráfego nas laterais.", ele: 652, distFromStart: 45 },
    { lat: -23.5978, lon: -45.6621, name: "Centro Histórico de Paraibuna", desc: "Fim do Dia 1. Famosa pelo pastel com geleia de pimenta e cachaças artesanais.", ele: 615, distFromStart: 78 },
    { lat: -23.3212, lon: -45.4721, name: "Início do Morro do Batman", desc: "Subida íngreme e desafiadora por estrada de terra. Desafie suas pernas!", ele: 998, distFromStart: 135 },
    { lat: -22.8812, lon: -45.2421, name: "Mosteiro Sagrada Face", desc: "Local pacífico de oração, carimbo e água fresca no caminho de Aparecida.", ele: 582, distFromStart: 179 },
    { lat: -22.8512, lon: -45.1612, name: "Santuário Nacional de Aparecida", desc: "Chegada triunfal. Celebração na Basílica e abraço oficial do trio!", ele: 545, distFromStart: 201.5 }
  ],
  caminho_da_fe: [
    { lat: -22.0123, lon: -46.7123, name: "Marco Zero (Prata)", desc: "Estação Ferroviária de Águas da Prata. Pegue sua Credencial oficial.", ele: 840, distFromStart: 0 },
    { lat: -22.0521, lon: -46.6812, name: "Serra dos Lima", desc: "Desafio físico pesado logo no início. Mais de 300m de subida direta.", ele: 1180, distFromStart: 15 },
    { lat: -22.2812, lon: -46.4312, name: "Monumento do Menino da Porteira", desc: "Monumento famoso na entrada da acolhedora cidade mineira de Ouro Fino.", ele: 890, distFromStart: 80 },
    { lat: -22.3112, lon: -46.3512, name: "Praça do Crochê (Inconfidentes)", desc: "Lindas árvores e bancos revestidos com crochê colorido feito à mão.", ele: 1120, distFromStart: 98 },
    { lat: -22.7512, lon: -45.9212, name: "Distrito de Luminosa", desc: "Vila charmosa no pé do temido desafio da Serra de Luminosa.", ele: 1590, distFromStart: 210 }
  ],
  vale_europeu: [
    { lat: -26.8234, lon: -49.2712, name: "Pórtico Central de Timbó", desc: "Portal histórico de colonização europeia, onde se emite o passaporte.", ele: 70, distFromStart: 0 },
    { lat: -26.7412, lon: -49.1812, name: "Portal Enxaimel Pomerode", desc: "Entrada da cidade mais alemã do Brasil. Parada obrigatória para cerveja e cuca.", ele: 85, distFromStart: 27 },
    { lat: -26.9812, lon: -49.5112, name: "Cachoeira de Doutor Pedrinho", desc: "Belo salto d'água no meio da mata. Refresco garantido na cicloviagem.", ele: 560, distFromStart: 150 }
  ]
};

export default function GPXVisualizer({ routeId, routeName, totalKm, links }: GPXVisualizerProps) {
  const [points, setPoints] = useState<GPXPoint[]>([]);
  const [waypoints, setWaypoints] = useState<GPXWaypoint[]>([]);
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [selectedPoint, setSelectedPoint] = useState<GPXPoint | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUserUploaded, setIsUserUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showDocumentation, setShowDocumentation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats derived from points
  const [calculatedStats, setCalculatedStats] = useState({
    cumulativeClimb: 0,
    cumulativeDescent: 0,
    highestPt: 0,
    lowestPt: 0,
    pointsCount: 0,
    totalDuration: "",
    distanceReal: 0,
    avgSpeed: 0
  });

  // Load appropriate default points & waypoints
  useEffect(() => {
    const defaultPoints = PRELOADED_ROUTES_DATA[routeId] || PRELOADED_ROUTES_DATA["rota_da_luz"];
    const smoothPoints = interpolatePoints(defaultPoints);
    const defaultWaypoints = PRELOADED_WAYPOINTS[routeId] || PRELOADED_WAYPOINTS["rota_da_luz"];

    setPoints(smoothPoints);
    setWaypoints(defaultWaypoints);
    setSliderVal(0);
    setSelectedPoint(smoothPoints[0] || null);
    setIsUserUploaded(false);
    setUploadedFileName("");
    setUploadError(null);
  }, [routeId]);

  // Calculate detailed elevation stats whenever points change
  useEffect(() => {
    if (points.length < 2) return;

    let climb = 0;
    let descent = 0;
    const elevations = points.map(p => p.ele);
    const highest = Math.max(...elevations);
    const lowest = Math.min(...elevations);

    for (let i = 1; i < points.length; i++) {
      const diff = points[i].ele - points[i - 1].ele;
      if (diff > 0) {
        climb += diff;
      } else {
        descent += Math.abs(diff);
      }
    }

    // Parse timestamps
    let durationStr = "";
    let speed = 0;
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const distTotal = lastPoint.dist;

    if (firstPoint?.time && lastPoint?.time) {
      try {
        const start = new Date(firstPoint.time).getTime();
        const end = new Date(lastPoint.time).getTime();
        const diffMs = end - start;
        if (diffMs > 0) {
          const totalSecs = Math.floor(diffMs / 1000);
          const hrs = Math.floor(totalSecs / 3600);
          const mins = Math.floor((totalSecs % 3600) / 60);
          durationStr = `${hrs}h ${mins}m`;
          
          const hrsNum = diffMs / (1000 * 60 * 60);
          if (hrsNum > 0) {
            speed = Number((distTotal / hrsNum).toFixed(1));
          }
        }
      } catch (e) {
        console.error("Error parsing duration from GPX:", e);
      }
    }

    setCalculatedStats({
      cumulativeClimb: Math.round(climb),
      cumulativeDescent: Math.round(descent),
      highestPt: Math.round(highest),
      lowestPt: Math.round(lowest),
      pointsCount: points.length,
      totalDuration: durationStr,
      distanceReal: Number(distTotal.toFixed(1)),
      avgSpeed: speed
    });
  }, [points]);

  // Update selected point based on slider value
  useEffect(() => {
    if (points.length === 0) return;
    const index = Math.min(
      Math.floor((sliderVal / 100) * points.length),
      points.length - 1
    );
    setSelectedPoint(points[index]);
  }, [sliderVal, points]);

  // Interpolate for smoother SVG lines
  function interpolatePoints(rawPoints: GPXPoint[]): GPXPoint[] {
    if (rawPoints.length < 2) return rawPoints;
    const result: GPXPoint[] = [];
    
    for (let i = 0; i < rawPoints.length - 1; i++) {
      const p1 = rawPoints[i];
      const p2 = rawPoints[i+1];
      const segments = 8;
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const lat = p1.lat + (p2.lat - p1.lat) * t;
        const lon = p1.lon + (p2.lon - p1.lon) * t;
        const ele = p1.ele + (p2.ele - p1.ele) * t;
        const dist = p1.dist + (p2.dist - p1.dist) * t;
        const label = j === 0 ? p1.label : undefined;
        result.push({ lat, lon, ele, dist, label });
      }
    }
    result.push(rawPoints[rawPoints.length - 1]);
    return result;
  }

  // Parse GPX XML
  const parseGPXFile = (text: string, filename: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        throw new Error("Formato de arquivo XML/GPX inválido. Verifique se o XML está íntegro.");
      }

      // 1. Parse Waypoints (<wpt>) - These are crucial for POIs/Checkpoints!
      const wptNodes = xmlDoc.getElementsByTagName("wpt");
      const parsedWaypoints: GPXWaypoint[] = [];
      
      for (let i = 0; i < wptNodes.length; i++) {
        const wpt = wptNodes[i];
        const lat = parseFloat(wpt.getAttribute("lat") || "0");
        const lon = parseFloat(wpt.getAttribute("lon") || "0");
        const nameNode = wpt.getElementsByTagName("name")[0];
        const descNode = wpt.getElementsByTagName("desc")[0];
        const eleNode = wpt.getElementsByTagName("ele")[0];
        
        parsedWaypoints.push({
          lat,
          lon,
          name: nameNode?.textContent || `Ponto de Interesse #${i + 1}`,
          desc: descNode?.textContent || "Ponto de passagem marcado via GPS.",
          ele: eleNode ? parseFloat(eleNode.textContent || "0") : undefined
        });
      }

      // 2. Parse Trackpoints (<trkpt>)
      const trkptNodes = xmlDoc.getElementsByTagName("trkpt");
      if (trkptNodes.length === 0) {
        throw new Error("Nenhum ponto de trilha (<trkpt>) encontrado no arquivo GPX.");
      }

      const parsedPoints: GPXPoint[] = [];
      let cumulativeDistance = 0;

      for (let i = 0; i < trkptNodes.length; i++) {
        const trkpt = trkptNodes[i];
        const lat = parseFloat(trkpt.getAttribute("lat") || "0");
        const lon = parseFloat(trkpt.getAttribute("lon") || "0");
        
        const eleNode = trkpt.getElementsByTagName("ele")[0];
        const ele = eleNode ? parseFloat(eleNode.textContent || "0") : 0;

        const timeNode = trkpt.getElementsByTagName("time")[0];
        const time = timeNode?.textContent || undefined;

        if (i > 0) {
          const prev = parsedPoints[i - 1];
          const segmentDist = getHaversineDistance(prev.lat, prev.lon, lat, lon);
          cumulativeDistance += segmentDist;
        }

        parsedPoints.push({
          lat,
          lon,
          ele,
          dist: Number(cumulativeDistance.toFixed(2)),
          time
        });
      }

      // Match Waypoints to their closest Trackpoint to find the exact distance (distFromStart)
      parsedWaypoints.forEach(wpt => {
        let minDistance = Infinity;
        let bestDistance = 0;
        
        parsedPoints.forEach(pt => {
          const d = getHaversineDistance(wpt.lat, wpt.lon, pt.lat, pt.lon);
          if (d < minDistance) {
            minDistance = d;
            bestDistance = pt.dist;
          }
        });
        
        wpt.distFromStart = Number(bestDistance.toFixed(1));
      });

      // Sort waypoints by distance
      parsedWaypoints.sort((a, b) => (a.distFromStart || 0) - (b.distFromStart || 0));

      // Downsample trackpoints if excessive for performance
      let finalPoints = parsedPoints;
      const targetPointsCount = 200;
      if (parsedPoints.length > targetPointsCount) {
        const step = Math.ceil(parsedPoints.length / targetPointsCount);
        finalPoints = [];
        for (let i = 0; i < parsedPoints.length; i += step) {
          finalPoints.push(parsedPoints[i]);
        }
        if (finalPoints[finalPoints.length - 1] !== parsedPoints[parsedPoints.length - 1]) {
          finalPoints.push(parsedPoints[parsedPoints.length - 1]);
        }
      }

      // Assign labels from matching waypoints to the trackpoints
      finalPoints.forEach(pt => {
        const closeWpt = parsedWaypoints.find(w => Math.abs((w.distFromStart || 0) - pt.dist) < 1.0);
        if (closeWpt) {
          pt.label = closeWpt.name;
        }
      });

      setPoints(finalPoints);
      setWaypoints(parsedWaypoints);
      setSliderVal(0);
      setSelectedPoint(finalPoints[0]);
      setIsUserUploaded(true);
      setUploadedFileName(filename);
      setUploadError(null);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Ocorreu um erro ao decodificar o arquivo GPX.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseGPXFile(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setUploadError(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".gpx")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseGPXFile(text, file.name);
      };
      reader.readAsText(file);
    } else {
      setUploadError("Formato de arquivo inválido. Por favor, envie um arquivo .gpx");
    }
  };

  // Generate Sample GPX text to assist the user
  const handleDownloadSampleGPX = () => {
    const sampleText = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="BPMF CicloAventuras" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Exemplo Rota Premiada BPMF</name>
    <desc>Arquivo GPX modelo com Trackpoints e Waypoints de parada</desc>
  </metadata>
  
  <!-- Waypoints (Seus Pontos de Interesse e Paradas!) -->
  <wpt lat="-23.5235" lon="-46.1864">
    <ele>742</ele>
    <name>Mogi das Cruzes (Parada Inicial)</name>
    <desc>Estação ferroviária onde o trio se reúne. Ponto de largada!</desc>
  </wpt>
  <wpt lat="-23.4423" lon="-46.0312">
    <ele>605</ele>
    <name>Vila de Luís Carlos (Almoço)</name>
    <desc>Cafés históricos deliciosos e excelente ponto de fotos.</desc>
  </wpt>
  <wpt lat="-22.8512" lon="-45.1612">
    <ele>545</ele>
    <name>Santuário de Aparecida (Chegada)</name>
    <desc>Fim do roteiro. Momento de comemoração e bênção!</desc>
  </wpt>

  <!-- Track (Sua trilha navegável de GPS) -->
  <trk>
    <name>Trilha Completa</name>
    <trkseg>
      <trkpt lat="-23.5235" lon="-46.1864"><ele>742</ele></trkpt>
      <trkpt lat="-23.4981" lon="-46.1245"><ele>710</ele></trkpt>
      <trkpt lat="-23.4423" lon="-46.0312"><ele>605</ele></trkpt>
      <trkpt lat="-23.4721" lon="-45.9412"><ele>630</ele></trkpt>
      <trkpt lat="-22.8512" lon="-45.1612"><ele>545</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([sampleText], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bpmf_exemplo_completo.gpx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export current loaded track as GPX
  const handleExportActiveGPX = () => {
    if (points.length === 0) return;
    
    let gpxText = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    gpxText += `<gpx version="1.1" creator="Bora Pedalar Meu Filho" xmlns="http://www.topografix.com/GPX/1/1"\n`;
    gpxText += `     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
    gpxText += `     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n`;
    
    gpxText += `  <metadata>\n`;
    gpxText += `    <name>${routeName || "Roteiro BPMF"}</name>\n`;
    gpxText += `    <desc>Roteiro exportado em tempo real do app Bora Pedalar Meu Filho (BPMF)</desc>\n`;
    gpxText += `  </metadata>\n`;
    
    // Add waypoints
    waypoints.forEach(wpt => {
      const escapedName = (wpt.name || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const escapedDesc = (wpt.desc || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      gpxText += `  <wpt lat="${wpt.lat}" lon="${wpt.lon}">\n`;
      gpxText += `    <name>${escapedName}</name>\n`;
      if (escapedDesc) {
        gpxText += `    <desc>${escapedDesc}</desc>\n`;
      }
      if (wpt.ele !== undefined) {
        gpxText += `    <ele>${wpt.ele}</ele>\n`;
      }
      gpxText += `  </wpt>\n`;
    });
    
    // Add track
    gpxText += `  <trk>\n`;
    gpxText += `    <name>${routeName || "Trilha BPMF"}</name>\n`;
    gpxText += `    <trkseg>\n`;
    
    points.forEach(pt => {
      gpxText += `      <trkpt lat="${pt.lat}" lon="${pt.lon}">\n`;
      gpxText += `        <ele>${pt.ele || 0}</ele>\n`;
      if (pt.time) {
        gpxText += `        <time>${pt.time}</time>\n`;
      }
      gpxText += `      </trkpt>\n`;
    });
    
    gpxText += `    </trkseg>\n`;
    gpxText += `  </trk>\n`;
    gpxText += `</gpx>\n`;
    
    const blob = new Blob([gpxText], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    const cleanName = (routeName || "roteiro_atual").toLowerCase().replace(/[^a-z0-9]/g, "_");
    a.href = url;
    a.download = `${cleanName}_sincronizado.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Graph and Map math
  const distances = points.map(p => p.dist);
  const elevations = points.map(p => p.ele);

  const maxDist = distances.length > 0 ? Math.max(...distances) : 100;
  const maxEle = elevations.length > 0 ? Math.max(...elevations) : 1000;
  const minEle = elevations.length > 0 ? Math.min(...elevations) : 0;
  
  const elevationSpan = maxEle - minEle;
  const yAxisMin = Math.max(0, minEle - elevationSpan * 0.1);
  const yAxisMax = maxEle + elevationSpan * 0.1;

  const chartWidth = 500;
  const chartHeight = 110;

  const getSvgCoordinates = (): string => {
    if (points.length === 0) return "";
    return points.map((p, idx) => {
      const x = (p.dist / maxDist) * chartWidth;
      const y = chartHeight - ((p.ele - yAxisMin) / (yAxisMax - yAxisMin)) * chartHeight;
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  };

  const svgLinePath = getSvgCoordinates();
  const svgAreaPath = svgLinePath 
    ? `${svgLinePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`
    : "";

  const lats = points.map(p => p.lat);
  const lons = points.map(p => p.lon);
  const maxLat = Math.max(...lats);
  const minLat = Math.min(...lats);
  const maxLon = Math.max(...lons);
  const minLon = Math.min(...lons);

  const mapWidth = 220;
  const mapHeight = 130;

  const getMapCoordinates = (): string => {
    if (points.length < 2) return "";
    return points.map((p, idx) => {
      const latRatio = maxLat === minLat ? 0.5 : (p.lat - minLat) / (maxLat - minLat);
      const lonRatio = maxLon === minLon ? 0.5 : (p.lon - minLon) / (maxLon - minLon);
      
      const x = 20 + lonRatio * (mapWidth - 40);
      const y = mapHeight - 20 - latRatio * (mapHeight - 40);
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  };

  const mapLinePath = getMapCoordinates();

  const activeXCoord = selectedPoint && maxDist > 0
    ? (selectedPoint.dist / maxDist) * chartWidth 
    : 0;
  const activeYCoord = selectedPoint && (yAxisMax !== yAxisMin)
    ? chartHeight - ((selectedPoint.ele - yAxisMin) / (yAxisMax - yAxisMin)) * chartHeight 
    : 0;

  const activeMapX = selectedPoint && maxLon !== minLon
    ? 20 + ((selectedPoint.lon - minLon) / (maxLon - minLon)) * (mapWidth - 40)
    : mapWidth / 2;
  const activeMapY = selectedPoint && maxLat !== minLat
    ? mapHeight - 20 - ((selectedPoint.lat - minLat) / (maxLat - minLat)) * (mapHeight - 40)
    : mapHeight / 2;

  const getSimulatedSlope = (): number => {
    if (!selectedPoint || points.length < 5) return 0;
    const index = points.indexOf(selectedPoint);
    if (index < 2 || index > points.length - 3) return 0;
    
    const pPrev = points[index - 2];
    const pNext = points[index + 2];
    const run = (pNext.dist - pPrev.dist) * 1000;
    const rise = pNext.ele - pPrev.ele;
    
    if (run === 0) return 0;
    const pct = Math.round((rise / run) * 100);
    return Math.min(Math.max(pct, -25), 25);
  };

  const slope = getSimulatedSlope();

  const jumpToWaypoint = (wpt: GPXWaypoint) => {
    if (points.length === 0) return;
    // Find closest point by distance
    const targetDist = wpt.distFromStart || 0;
    const bestPoint = points.reduce((prev, curr) => 
      Math.abs(curr.dist - targetDist) < Math.abs(prev.dist - targetDist) ? curr : prev
    );
    
    // Calculate progress percentage
    const index = points.indexOf(bestPoint);
    const progressPercent = (index / points.length) * 100;
    setSliderVal(progressPercent);
    setSelectedPoint(bestPoint);
  };

  // Dynamically build Google Maps directions using currently loaded coordinates
  let googleMapsUrl = "";
  if (points && points.length > 0) {
    const origin = points[0];
    const dest = points[points.length - 1];
    
    // Select up to 8 intermediate points distributed evenly
    const waypointsArr: string[] = [];
    if (points.length > 5) {
      const count = Math.min(8, points.length - 2);
      const step = Math.floor((points.length - 2) / (count + 1)) || 1;
      for (let i = 1; i <= count; i++) {
        const idx = i * step;
        if (idx < points.length - 1) {
          waypointsArr.push(`${points[idx].lat},${points[idx].lon}`);
        }
      }
    }
    
    const waypointsStr = waypointsArr.length > 0 ? `&waypoints=${waypointsArr.join("%7C")}` : "";
    googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lon}&destination=${dest.lat},${dest.lon}${waypointsStr}&travelmode=bicycling`;
  } else {
    googleMapsUrl = links.google_maps || `https://www.google.com/maps/dir/?api=1&origin=Mogi+das+Cruzes&destination=Aparecida`;
  }

  return (
    <div className="bg-[#050508] border border-white/10 rounded-2xl p-4.5 space-y-4 shadow-xl">
      
      {/* Header with info toggle */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center">
            <Compass className="w-4 h-4 text-[#39FF14] animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">
              Analisador de GPX Premium & Waypoints
            </h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wide">
              {isUserUploaded ? `ATIVO: ${uploadedFileName.substring(0, 32)}` : `PERFIL OFICIAL: ${routeName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDocumentation(!showDocumentation)}
            className="text-[9px] font-mono font-bold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span>Guia de GPX</span>
          </button>

          {isUserUploaded && (
            <button
              onClick={() => {
                const defaultPoints = PRELOADED_ROUTES_DATA[routeId] || PRELOADED_ROUTES_DATA["rota_da_luz"];
                const smoothPoints = interpolatePoints(defaultPoints);
                setPoints(smoothPoints);
                setWaypoints(PRELOADED_WAYPOINTS[routeId] || PRELOADED_WAYPOINTS["rota_da_luz"]);
                setSliderVal(0);
                setSelectedPoint(smoothPoints[0]);
                setIsUserUploaded(false);
                setUploadedFileName("");
              }}
              className="text-[9px] font-mono font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded hover:bg-red-400/20 transition cursor-pointer"
            >
              Resetar
            </button>
          )}
        </div>
      </div>

      {/* GPX FORMAT EXPLAINER & HELP (If toggled) */}
      {showDocumentation && (
        <div className="bg-[#0b0c10] border border-[#39FF14]/20 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <h4 className="font-display font-black text-[#39FF14] text-[10px] uppercase tracking-wider flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5" /> Como preparar seu GPX para renderização máxima?
            </h4>
            <button
              onClick={handleDownloadSampleGPX}
              className="text-[9px] font-mono font-bold text-[#39FF14] bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/20 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-2.5 h-2.5" /> Baixar GPX Modelo
            </button>
          </div>
          
          <p className="text-[11px] text-slate-400">
            O aplicativo BPMF lê arquivos <strong>GPX (.gpx)</strong> estruturados em XML. Para extrair altimetria impecável e marcar seus pontos de parada (pousadas, subidas, restaurantes), configure seu arquivo com os seguintes blocos principais:
          </p>

          <div className="space-y-2 font-mono text-[9px] bg-black/50 p-2.5 rounded border border-white/5 text-emerald-400 overflow-x-auto max-h-[140px]">
            <div>&lt;!-- 1. Use tags &lt;wpt&gt; para marcar suas paradas ao longo do caminho --&gt;</div>
            <div>&lt;wpt lat="-23.4423" lon="-46.0312"&gt;</div>
            <div className="pl-4">&lt;ele&gt;605&lt;/ele&gt;</div>
            <div className="pl-4">&lt;name&gt;Vila de Luís Carlos (Almoço)&lt;/name&gt;</div>
            <div className="pl-4">&lt;desc&gt;Cafés históricos deliciosos no km 18.&lt;/desc&gt;</div>
            <div>&lt;/wpt&gt;</div>
            <div className="mt-1.5">&lt;!-- 2. Use tags &lt;trkpt&gt; dentro de &lt;trkseg&gt; para o traçado --&gt;</div>
            <div>&lt;trkpt lat="-23.5235" lon="-46.1864"&gt;&lt;ele&gt;742&lt;/ele&gt;&lt;/trkpt&gt;</div>
          </div>

          <p className="text-[10px] text-slate-500">
            💡 <strong>Dica Premium:</strong> Exportando direto do Strava, Garmin, ou desenhando no Wikiloc, o arquivo já trará todos os trackpoints. Se você colocar nomes nos seus POIs nessas plataformas, eles aparecerão automaticamente na nossa lista de waypoints abaixo!
          </p>
        </div>
      )}

      {/* DROPZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xl p-3.5 text-center transition-all ${
          isDragOver
            ? "border-[#39FF14] bg-[#39FF14]/5"
            : "border-white/10 hover:border-white/20 bg-white/[0.02]"
        }`}
      >
        <input
          type="file"
          accept=".gpx"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center gap-1.5 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Upload className={`w-5 h-5 ${isDragOver ? "text-[#39FF14]" : "text-slate-400"}`} />
          <div className="text-[10px] text-slate-300">
            <span className="text-[#39FF14] font-bold">Arraste seu mapa de viagem (.gpx)</span> ou <span className="underline">clique para enviar</span>
          </div>
          <p className="text-[8px] text-slate-500 max-w-[420px]">
            O arquivo GPX injetará altimetria em tempo real, marcará paradas e recalculará as estatísticas de subida para o trio!
          </p>
        </div>

        {uploadError && (
          <div className="mt-2 text-[9px] text-red-400 font-medium flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* RENDER MAP & METRICS */}
      {points.length > 0 && (
        <div className="space-y-4">
          
          {/* HIGH-FIDELITY SUMMARY PANEL (Section 4/5) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0c0c12] border border-white/5 rounded-xl p-3">
            <div className="text-center sm:text-left border-r border-white/5 last:border-0 pr-1">
              <span className="text-[8px] text-slate-500 font-mono uppercase block">Subida Acumulada</span>
              <span className="text-xs font-display font-black text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                +{calculatedStats.cumulativeClimb}m
              </span>
            </div>

            <div className="text-center sm:text-left border-r border-white/5 last:border-0 pr-1">
              <span className="text-[8px] text-slate-500 font-mono uppercase block">Descida Acumulada</span>
              <span className="text-xs font-display font-bold text-sky-400">
                -{calculatedStats.cumulativeDescent}m
              </span>
            </div>

            <div className="text-center sm:text-left border-r border-white/5 last:border-0 pr-1">
              <span className="text-[8px] text-slate-500 font-mono uppercase block">Ponto Mais Alto</span>
              <span className="text-xs font-display font-bold text-[#39FF14]">
                {calculatedStats.highestPt}m
              </span>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-[8px] text-slate-500 font-mono uppercase block">Dificuldade Estimada</span>
              <span className="text-[9px] font-mono font-bold text-white uppercase px-1.5 py-0.2 rounded bg-white/5 inline-block mt-0.5">
                {calculatedStats.cumulativeClimb > 2000 ? "🔴 Dura (Insana)" : calculatedStats.cumulativeClimb > 1000 ? "🟡 Média (Exige Treino)" : "🟢 Leve (Giro Suave)"}
              </span>
            </div>
          </div>

          {/* GPX METADATA PANEL (EXTRA DETAILS FOR DETAILED INFORMATION) */}
          <div className="grid grid-cols-3 gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center sm:text-left">
            <div>
              <span className="text-[8px] text-slate-500 font-mono uppercase block">Distância Calculada</span>
              <span className="text-xs font-display font-black text-white">
                {calculatedStats.distanceReal > 0 ? `${calculatedStats.distanceReal} km` : `${totalKm} km (Est.)`}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-mono uppercase block">Duração de Pedal</span>
              <span className="text-xs font-display font-bold text-indigo-400">
                {calculatedStats.totalDuration || "Disponível em GPX gravados"}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-mono uppercase block">Velocidade Média</span>
              <span className="text-xs font-display font-bold text-amber-400">
                {calculatedStats.avgSpeed > 0 ? `${calculatedStats.avgSpeed} km/h` : "Disponível em GPX gravados"}
              </span>
            </div>
          </div>

          {/* MAIN VISUAL: 2D TRAJECTORY & METRIC BOX */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-center">
            
            {/* 2D Trajectory View */}
            <div className="md:col-span-3 bg-black/50 rounded-xl p-3.5 border border-white/5 flex flex-col items-center justify-center relative min-h-[145px]">
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/5 text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                <MapPin className="w-2.5 h-2.5 text-[#39FF14]" />
                <span>Traçado Geográfico 2D</span>
              </div>
              
              <svg width="100%" height="115" viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="max-w-[230px]">
                {/* Visual grid lines for geographic space */}
                <line x1="0" y1={mapHeight/2} x2={mapWidth} y2={mapHeight/2} stroke="rgba(255,255,255,0.01)" />
                <line x1={mapWidth/2} y1="0" x2={mapWidth/2} y2={mapHeight} stroke="rgba(255,255,255,0.01)" />
                
                {mapLinePath && (
                  <path
                    d={mapLinePath}
                    fill="none"
                    stroke="#39FF14"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                    className="drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]"
                  />
                )}

                {/* Plot Waypoints on the map path */}
                {waypoints.map((wpt, idx) => {
                  if (maxLon === minLon || maxLat === minLat) return null;
                  const x = 20 + ((wpt.lon - minLon) / (maxLon - minLon)) * (mapWidth - 40);
                  const y = mapHeight - 20 - ((wpt.lat - minLat) / (maxLat - minLat)) * (mapHeight - 40);
                  return (
                    <g key={idx} className="cursor-pointer" onClick={() => jumpToWaypoint(wpt)}>
                      <title>{wpt.name}</title>
                      <circle cx={x} cy={y} r="3.5" fill="#000000" stroke="#39FF14" strokeWidth="1.2" />
                      <circle cx={x} cy={y} r="1.5" fill="#ffffff" />
                    </g>
                  );
                })}

                {/* Current Active Marker Position */}
                {selectedPoint && activeMapX > 0 && (
                  <g className="animate-pulse">
                    <circle cx={activeMapX} cy={activeMapY} r="8.5" fill="rgba(57,255,20,0.25)" />
                    <circle cx={activeMapX} cy={activeMapY} r="5.5" fill="#39FF14" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                )}
              </svg>
            </div>

            {/* Quick Metrics Details */}
            <div className="md:col-span-2 space-y-2 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
              <div>
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider block">KM Atual no Cursor</span>
                <span className="text-sm font-display font-black text-white">{selectedPoint ? selectedPoint.dist.toFixed(1) : "0.0"} km</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[8px] text-slate-500 font-mono uppercase block">Altitude Instantânea</span>
                  <span className="text-xs font-display font-bold text-[#39FF14]">{selectedPoint ? Math.round(selectedPoint.ele) : "0"}m</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-mono uppercase block">Rampa / Slope</span>
                  <span className={`text-xs font-display font-bold font-mono ${slope > 0 ? "text-red-400" : slope < 0 ? "text-emerald-400" : "text-slate-400"}`}>
                    {slope > 0 ? `+${slope}` : slope}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider block">Elemento mais próximo</span>
                <span className="text-[10px] text-white font-bold leading-tight line-clamp-2 min-h-[30px] flex items-center">
                  {selectedPoint?.label ? (
                    <span className="text-[#39FF14] flex items-center gap-1">
                      <Landmark className="w-3 h-3 text-[#39FF14]" /> {selectedPoint.label}
                    </span>
                  ) : (
                    "Trecho de pedal livre (Estrada rural de terra batida)"
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* ALTIMETRIA SVG BOX */}
          <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
              <span className="tracking-wider uppercase">Gráfico de Relevo / Altimetria Dinâmica</span>
              <span className="text-slate-500">Mova o cursor para navegar no tempo e espaço</span>
            </div>

            <div className="relative">
              <svg width="100%" height="110" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#39FF14" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#39FF14" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.03)" strokeDasharray="1 3" />
                <line x1="0" y1={chartHeight * 0.15} x2={chartWidth} y2={chartHeight * 0.15} stroke="rgba(255,255,255,0.02)" strokeDasharray="1 3" />
                <line x1="0" y1={chartHeight * 0.85} x2={chartWidth} y2={chartHeight * 0.85} stroke="rgba(255,255,255,0.02)" strokeDasharray="1 3" />

                {/* Area under curve */}
                {svgAreaPath && (
                  <path d={svgAreaPath} fill="url(#elevationGrad)" />
                )}

                {/* Stroke line */}
                {svgLinePath && (
                  <path
                    d={svgLinePath}
                    fill="none"
                    stroke="#39FF14"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_3px_rgba(57,255,20,0.4)]"
                  />
                )}

                {/* Vertical indicator line */}
                {selectedPoint && activeXCoord > 0 && (
                  <g>
                    <line
                      x1={activeXCoord}
                      y1="0"
                      x2={activeXCoord}
                      y2={chartHeight}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={activeXCoord}
                      cy={activeYCoord}
                      r="4"
                      fill="#39FF14"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                    />
                  </g>
                )}
              </svg>

              <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1 pt-1 border-t border-white/5">
                <span>0 km</span>
                <span>{Math.round(maxDist / 2)} km</span>
                <span>{Math.round(maxDist)} km (Fim)</span>
              </div>
            </div>

            {/* Slider bar */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={sliderVal}
                onChange={(e) => setSliderVal(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#39FF14] focus:outline-none"
              />
            </div>
          </div>

          {/* DYNAMIC LIST OF EXTRACTED WAYPOINTS (Requested to show more info) */}
          {waypoints.length > 0 && (
            <div className="space-y-2 bg-[#0c0c12]/50 border border-white/5 p-3 rounded-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-[9px] font-display font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-[#39FF14]" /> Pontos de Interesse Extratados ({waypoints.length})
                </span>
                <span className="text-[8px] text-slate-500 font-mono">Clique para pular ao local</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[145px] overflow-y-auto pr-1">
                {waypoints.map((wpt, idx) => {
                  const isCurrent = selectedPoint && wpt.distFromStart !== undefined && Math.abs(selectedPoint.dist - wpt.distFromStart) < 2.0;
                  return (
                    <button
                      key={idx}
                      onClick={() => jumpToWaypoint(wpt)}
                      className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between ${
                        isCurrent 
                          ? "bg-[#39FF14]/10 border-[#39FF14]/30 text-white" 
                          : "bg-black/30 border-white/5 text-slate-300 hover:border-white/10 hover:bg-black/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-display font-bold truncate pr-2 text-white block">
                          {wpt.name}
                        </span>
                        <span className="text-[8px] font-mono text-[#39FF14] font-bold bg-[#39FF14]/10 px-1 py-0.2 rounded shrink-0">
                          KM {wpt.distFromStart !== undefined ? wpt.distFromStart : "0.0"}
                        </span>
                      </div>
                      
                      {wpt.desc && (
                        <p className="text-[9px] text-slate-400 line-clamp-1 mt-1 font-mono">
                          {wpt.desc}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* EXTERNAL PLATFORMS SYNC (Customized links are editable in registry!) */}
      <div className="space-y-3 pt-4 border-t border-white/5 bg-[#0c0c12]/45 p-4 rounded-2xl border border-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-center sm:text-left">
            <h4 className="text-[10px] font-display font-black text-[#39FF14] uppercase tracking-widest">
              🔗 Sincronizar com Plataformas Externas
            </h4>
            <p className="text-[9px] text-slate-400 font-mono">
              {isUserUploaded 
                ? `Usando seu GPX: "${uploadedFileName || "personalizado"}"` 
                : "Aproveite a rota atual em outros dispositivos e GPS."}
            </p>
          </div>
          {points.length > 0 && (
            <button
              onClick={handleExportActiveGPX}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#39FF14]/15 border border-[#39FF14]/30 hover:bg-[#39FF14]/25 text-[10px] text-[#39FF14] font-display font-bold transition active:scale-95 cursor-pointer shrink-0 shadow-md shadow-[#39FF14]/5"
              title="Baixar o arquivo GPX atualizado com os waypoints"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo GPX</span>
            </button>
          )}
        </div>

        {isUserUploaded && (
          <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1 text-[9px] text-slate-400 leading-normal">
            <span className="font-bold text-indigo-400 font-mono block">💡 COMO ENVIAR SEU GPX CARREGADO PARA SEU GPS / APP:</span>
            <p>
              1. Clique acima em <strong className="text-white">Baixar Arquivo GPX</strong> para obter o mapa atualizado.
            </p>
            <p>
              2. Escolha uma plataforma abaixo (Wikiloc, Strava, Komoot) para abrir direto a página de upload/importação.
            </p>
            <p>
              3. Envie o arquivo baixado lá e pronto! O percurso estará sincronizado com sua conta.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          
          <a
            href={isUserUploaded ? "https://www.strava.com/upload/select" : (links.strava || "https://www.strava.com")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#FC6100]/10 border border-[#FC6100]/20 hover:bg-[#FC6100]/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🧡</span>
              <div className="text-left">
                <span className="text-[10px] font-display font-black text-white group-hover:text-[#FC6100] block leading-none">STRAVA</span>
                <span className="text-[7px] text-slate-500 font-mono">{isUserUploaded ? "Página de Upload" : "Link da Rota"}</span>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-[#FC6100]" />
          </a>

          <a
            href={isUserUploaded ? "https://www.wikiloc.com/wikiloc/upload.do" : (links.wikiloc_completa || "https://www.wikiloc.com")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#85b922]/10 border border-[#85b922]/20 hover:bg-[#85b922]/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">💚</span>
              <div className="text-left">
                <span className="text-[10px] font-display font-black text-white group-hover:text-[#85b922] block leading-none">WIKILOC</span>
                <span className="text-[7px] text-slate-500 font-mono">{isUserUploaded ? "Página de Upload" : "Link da Rota"}</span>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-[#85b922]" />
          </a>

          <a
            href={isUserUploaded ? "https://www.komoot.com/upload" : (links.komoot || "https://www.komoot.com")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#2ea2f8]/10 border border-[#2ea2f8]/20 hover:bg-[#2ea2f8]/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">💙</span>
              <div className="text-left">
                <span className="text-[10px] font-display font-black text-white group-hover:text-[#2ea2f8] block leading-none">KOMOOT</span>
                <span className="text-[7px] text-slate-500 font-mono">{isUserUploaded ? "Página de Importar" : "Link da Rota"}</span>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-[#2ea2f8]" />
          </a>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#4285F4]/10 border border-[#4285F4]/20 hover:bg-[#4285F4]/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🗺️</span>
              <div className="text-left">
                <span className="text-[10px] font-display font-black text-white group-hover:text-[#4285F4] block leading-none">GOOGLE MAPS</span>
                <span className="text-[7px] text-slate-500 font-mono">{isUserUploaded ? "Percurso Dinâmico" : "Rota Oficial"}</span>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-[#4285F4]" />
          </a>

        </div>
      </div>

    </div>
  );
}
