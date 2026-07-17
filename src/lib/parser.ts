import { Roteiro, Day, Parada, Pousada, EmergencyContact } from "../types";

/**
 * Intelligent Markdown / TXT parser for ciclotourism routes.
 * Extract headings, bullet points, meta details, stops (paradas), and pousadas.
 */
export function parseRouteMarkdown(text: string): Partial<Roteiro> {
  const lines = text.split("\n");
  const route: Partial<Roteiro> = {
    nome: "",
    descricao: "",
    totalKm: 0,
    totalDays: 0,
    days: [],
    links: {
      wikiloc_completa: "",
      wikiloc_cicloviagem: "",
      cptm_bike: "",
      strava: "",
      komoot: "",
      google_maps: ""
    },
    cidadesEmg: []
  };

  let currentDay: any = null;
  let currentParada: any = null;
  let currentPousada: any = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Detect Route Name (e.g., # ROTA DA LUZ or # Circuito Vale Europeu)
    if (line.startsWith("# ") && !route.nome) {
      route.nome = line.replace("#", "").trim();
      continue;
    }

    const lowerLine = line.toLowerCase();
    
    // General Route metadata (Description, totalKm, totalDays)
    if (lowerLine.startsWith("descrição:") || lowerLine.startsWith("descricao:")) {
      route.descricao = line.substring(line.indexOf(":") + 1).trim();
      continue;
    }
    
    if (lowerLine.includes("total km:") || lowerLine.includes("distância total:") || lowerLine.includes("distancia total:")) {
      const match = line.match(/\d+/);
      if (match) route.totalKm = parseInt(match[0]);
      continue;
    }
    
    if (lowerLine.includes("total dias:") || lowerLine.includes("quantidade de dias:")) {
      const match = line.match(/\d+/);
      if (match) route.totalDays = parseInt(match[0]);
      continue;
    }

    // Links parsing
    if (lowerLine.startsWith("wikiloc:") || lowerLine.includes("wikiloc.com")) {
      const urlMatch = line.match(/https?:\/\/[^\s]+/);
      if (urlMatch && route.links) {
        if (!route.links.wikiloc_completa) {
          route.links.wikiloc_completa = urlMatch[0];
        } else {
          route.links.wikiloc_cicloviagem = urlMatch[0];
        }
      }
      continue;
    }
    if (lowerLine.startsWith("strava:") || lowerLine.includes("strava.com")) {
      const urlMatch = line.match(/https?:\/\/[^\s]+/);
      if (urlMatch && route.links) route.links.strava = urlMatch[0];
      continue;
    }
    if (lowerLine.startsWith("komoot:") || lowerLine.includes("komoot.com")) {
      const urlMatch = line.match(/https?:\/\/[^\s]+/);
      if (urlMatch && route.links) route.links.komoot = urlMatch[0];
      continue;
    }
    if (lowerLine.startsWith("google maps:") || lowerLine.startsWith("google_maps:") || lowerLine.includes("google.com/maps") || lowerLine.includes("google.com.br/maps")) {
      const urlMatch = line.match(/https?:\/\/[^\s]+/);
      if (urlMatch && route.links) route.links.google_maps = urlMatch[0];
      continue;
    }

    // Days (e.g., ## Dia 1: Mogi das Cruzes para Paraibuna)
    if (line.startsWith("## Dia") || line.startsWith("## DIA") || lowerLine.startsWith("dia ") && line.includes(":")) {
      // If we had a previous day, save it
      if (currentDay) {
        if (currentParada) currentDay.paradas.push(currentParada);
        if (currentPousada) currentDay.pousadas.push(currentPousada);
        route.days!.push(currentDay);
      }

      currentParada = null;
      currentPousada = null;

      // Extract day number and path
      const dayNumMatch = line.match(/\d+/);
      const dayNum = dayNumMatch ? parseInt(dayNumMatch[0]) : (route.days!.length + 1);
      
      let from = "Origem";
      let to = "Destino";
      const parts = line.split(":");
      const pathPart = parts[1] || parts[0];
      const fromToParts = pathPart.split(/\s+a\s+|\s+para\s+|\s+&rarr;\s+|\s+-\s+|\s+ate\s+|\s+até\s+/i);
      
      if (fromToParts.length >= 2) {
        from = fromToParts[0].replace(/##\s*Dia\s*\d+\s*/i, "").trim();
        to = fromToParts[1].trim();
      } else {
        from = pathPart.replace(/##\s*Dia\s*\d+\s*/i, "").trim();
      }

      // Add emergency cities mock lookup
      if (from && !route.cidadesEmg!.some(c => c.cidade.includes(from))) {
        route.cidadesEmg!.push({
          cidade: from,
          tel: "(11) 99999-9999",
          fonte: `Suporte ${from}`
        });
      }

      currentDay = {
        n: dayNum,
        from,
        to,
        saida: "07:30",
        km: 0,
        elev: 0,
        tempo: "5h a 7h",
        chegada: "15:00",
        refs: "",
        alerta: null,
        paradas: [],
        pousadas: []
      };
      continue;
    }

    // Parse current Day properties
    if (currentDay && !currentParada && !currentPousada) {
      if (lowerLine.startsWith("- saída:") || lowerLine.startsWith("- saida:") || lowerLine.startsWith("saída:") || lowerLine.startsWith("saida:")) {
        currentDay.saida = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- chegada:") || lowerLine.startsWith("chegada:")) {
        currentDay.chegada = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- distância:") || lowerLine.startsWith("- distancia:") || lowerLine.startsWith("distância:") || lowerLine.startsWith("distancia:") || lowerLine.startsWith("- km:") || lowerLine.startsWith("km:")) {
        const match = line.match(/\d+/);
        if (match) currentDay.km = parseInt(match[0]);
      } else if (lowerLine.startsWith("- altimetria:") || lowerLine.startsWith("altimetria:") || lowerLine.startsWith("- elev:") || lowerLine.startsWith("elev:")) {
        const match = line.match(/\d+/);
        if (match) currentDay.elev = parseInt(match[0]);
      } else if (lowerLine.startsWith("- tempo:") || lowerLine.startsWith("tempo:")) {
        currentDay.tempo = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- referências:") || lowerLine.startsWith("- referencias:") || lowerLine.startsWith("referências:") || lowerLine.startsWith("referencias:") || lowerLine.startsWith("- refs:") || lowerLine.startsWith("refs:")) {
        currentDay.refs = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- alerta:") || lowerLine.startsWith("alerta:")) {
        currentDay.alerta = line.substring(line.indexOf(":") + 1).trim();
      }
    }

    // Paradas / Strategic Stops (e.g., ### Parada: Vila de Luís Carlos (KM 18))
    if (line.startsWith("### Parada:") || line.startsWith("### PARADA:") || line.startsWith("### Spot:") || lowerLine.startsWith("parada:")) {
      if (currentDay) {
        if (currentParada) {
          currentDay.paradas.push(currentParada);
        }
        currentParada = {
          km: "",
          nome: line.substring(line.indexOf(":") + 1).trim(),
          tag: "Ponto Turístico",
          desc: "",
          ideia: "Registrar foto marcante do trio aqui.",
          fonte: "Informação do Roteiro"
        };
        currentPousada = null; // Clear active pousada context
        
        // Extract KM from name if written like (KM 18)
        const kmMatch = currentParada.nome.match(/\((?:km|~)\s*(\d+)\s*(?:km)?\)/i);
        if (kmMatch) {
          currentParada.km = `~${kmMatch[1]} km`;
          currentParada.nome = currentParada.nome.replace(kmMatch[0], "").trim();
        } else {
          currentParada.km = `~${currentDay.km / 2} km`; // Mock middle distance if not set
        }
      }
      continue;
    }

    // Parada properties
    if (currentParada) {
      if (lowerLine.startsWith("- descrição:") || lowerLine.startsWith("- descricao:") || lowerLine.startsWith("descrição:") || lowerLine.startsWith("descricao:")) {
        currentParada.desc = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- ideia reel:") || lowerLine.startsWith("- ideia:") || lowerLine.startsWith("ideia:") || lowerLine.startsWith("ideia de reel:")) {
        currentParada.ideia = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- fonte:") || lowerLine.startsWith("fonte:")) {
        currentParada.fonte = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- km:") || lowerLine.startsWith("km:")) {
        currentParada.km = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- tag:") || lowerLine.startsWith("tag:")) {
        currentParada.tag = line.substring(line.indexOf(":") + 1).trim();
      }
    }

    // Pousadas (e.g., ### Pousada: Pousada 3 Rios)
    if (line.startsWith("### Pousada:") || line.startsWith("### POUSADA:") || line.startsWith("### Hospedagem:") || lowerLine.startsWith("pousada:")) {
      if (currentDay) {
        if (currentPousada) {
          currentDay.pousadas.push(currentPousada);
        }
        currentPousada = {
          nome: line.substring(line.indexOf(":") + 1).trim(),
          desc: "Hospedagem confortável para ciclistas.",
          tel: null,
          rec: true
        };
        currentParada = null; // Clear active parada context
        
        // Auto recommend if has "Recomendada" in name
        if (lowerLine.includes("recomendada") || lowerLine.includes("top")) {
          currentPousada.rec = true;
          currentPousada.nome = currentPousada.nome.replace(/\(recomendada\)/i, "").replace(/\(recomendado\)/i, "").trim();
        }
      }
      continue;
    }

    // Pousada properties
    if (currentPousada) {
      if (lowerLine.startsWith("- descrição:") || lowerLine.startsWith("- descricao:") || lowerLine.startsWith("descrição:") || lowerLine.startsWith("descricao:")) {
        currentPousada.desc = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- telefone:") || lowerLine.startsWith("- tel:") || lowerLine.startsWith("telefone:") || lowerLine.startsWith("tel:")) {
        currentPousada.tel = line.substring(line.indexOf(":") + 1).trim();
      } else if (lowerLine.startsWith("- recomendada:") || lowerLine.startsWith("recomendada:") || lowerLine.startsWith("rec:")) {
        currentPousada.rec = lowerLine.includes("sim") || lowerLine.includes("true");
      }
    }
  }

  // Push final items
  if (currentDay) {
    if (currentParada) currentDay.paradas.push(currentParada);
    if (currentPousada) currentDay.pousadas.push(currentPousada);
    route.days!.push(currentDay);
  }

  // If we have days, recalculate total days & total KM if they are 0
  if (route.days && route.days.length > 0) {
    if (!route.totalDays) route.totalDays = route.days.length;
    if (!route.totalKm) route.totalKm = route.days.reduce((sum, d) => sum + (d.km || 0), 0);
  }

  return route;
}
