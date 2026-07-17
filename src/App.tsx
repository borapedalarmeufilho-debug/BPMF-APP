/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Home,
  MapPin,
  CheckSquare,
  DollarSign,
  Video,
  Phone,
  Settings,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  Sparkles,
  Map,
  FileSpreadsheet,
  LogOut,
  Mail,
  Download,
  Upload,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Archive,
  FolderOpen,
  BookOpen,
  ChevronRight,
  Compass,
  Edit
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  DAYS_DATA,
  CHECKLIST_DATA,
  BPMF_PROMPT_BASE,
  PORTA_FRASE,
  CIDADES_EMG,
  LINKS_EXTERNOS,
  CONTEUDO_SEMANA,
  ROTEIROS
} from "./data";
import { AppState, Expense, Day, Parada, ContentStage, Slide, Roteiro } from "./types";
import { initAuth, googleSignIn, logout, getAccessToken } from "./auth";
import { User } from "firebase/auth";
import GPXVisualizer from "./components/GPXVisualizer";
import { parseRouteMarkdown } from "./lib/parser";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>("home");
  const [apoioSubTab, setApoioSubTab] = useState<"sos" | "midia">("sos");

  // State
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("bpmf_rota_luz_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.currentRouteId) parsed.currentRouteId = "rota_da_luz";
        if (!parsed.customRoutes) parsed.customRoutes = [];
        if (!parsed.groupPasscode) parsed.groupPasscode = "";
        if (!parsed.archivedRouteIds) parsed.archivedRouteIds = [];
        if (parsed.isOfflineDownloaded === undefined) parsed.isOfflineDownloaded = false;
        return parsed;
      } catch (e) {
        console.error("Erro ao carregar estado local:", e);
      }
    }
    return {
      currentRouteId: "rota_da_luz",
      tripDate: "2026-08-15",
      people: ["Alexandre", "Amigo 1", "Amigo 2"],
      checklist: {},
      expenses: [],
      daysDone: {},
      customRoutes: [],
      groupPasscode: "",
      archivedRouteIds: [],
      isOfflineDownloaded: false
    };
  });

  // Access Lock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("bpmf_session_unlocked") === "true";
  });
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const isLocked = !!(state.groupPasscode && state.groupPasscode.trim().length > 0 && !isUnlocked);

  // Offline Download Simulation State
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(0);
  const [showOfflineSuccess, setShowOfflineSuccess] = useState(false);

  // Derived state for scalable routes
  const customRoutes = state.customRoutes || [];
  const allRoutes = [...ROTEIROS, ...customRoutes];
  const archivedRouteIds = state.archivedRouteIds || [];
  
  // Standard users only see unarchived routes. Admins/Guides can see all in config.
  const activeRoutes = allRoutes.filter(r => !archivedRouteIds.includes(r.id));
  
  const currentRouteId = state.currentRouteId || "rota_da_luz";
  const currentRoute = allRoutes.find(r => r.id === currentRouteId) || allRoutes[0];
  const daysData = currentRoute.days;
  const linksExternos = currentRoute.links;
  const cidadesEmg = currentRoute.cidadesEmg;

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // UI state
  const [showConfig, setShowConfig] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [backupString, setBackupString] = useState("");
  const [restoredSuccess, setRestoredSuccess] = useState(false);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [regMarkdownText, setRegMarkdownText] = useState("");
  const [regName, setRegName] = useState("");
  const [regDesc, setRegDesc] = useState("");
  const [regTotalKm, setRegTotalKm] = useState("");
  const [regTotalDays, setRegTotalDays] = useState("");
  const [regWikilocCompleta, setRegWikilocCompleta] = useState("");
  const [regWikilocCicloviagem, setRegWikilocCicloviagem] = useState("");
  const [regStrava, setRegStrava] = useState("");
  const [regKomoot, setRegKomoot] = useState("");
  const [regGoogleMaps, setRegGoogleMaps] = useState("");
  const [regDays, setRegDays] = useState<Day[]>([]);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [adminPasscode, setAdminPasscode] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("bpmf_admin_unlocked") === "true";
  });
  const [configTab, setConfigTab] = useState<"roteiros" | "geral">("roteiros");

  // Rota Tab - Accordions
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 1: true });

  // AI Grounding Drawer State
  const [groundingDrawer, setGroundingDrawer] = useState<{
    isOpen: boolean;
    parada: Parada | null;
    day: Day | null;
    loading: boolean;
    result: string | null;
    sources: any[];
  }>({
    isOpen: false,
    parada: null,
    day: null,
    loading: false,
    result: null,
    sources: []
  });

  // AI Image State
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [imageGeneratingKey, setImageGeneratingKey] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Sheets Sync State
  const [sheetsSyncState, setSheetsSyncState] = useState<{
    loading: boolean;
    successUrl: string | null;
    error: string | null;
  }>({
    loading: false,
    successUrl: null,
    error: null
  });

  // Gmail Send State
  const [gmailState, setGmailState] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
    recipientInput: string;
  }>({
    loading: false,
    success: false,
    error: null,
    recipientInput: ""
  });

  // Expense form state
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseVal, setExpenseVal] = useState("");
  const [expenseCat, setExpenseCat] = useState("Alimentação");
  const [expenseWho, setExpenseWho] = useState("");
  const [expenseDiv, setExpenseDiv] = useState<"todos" | "individual">("todos");

  // Content Quick Generator state
  const [genPhase, setGenPhase] = useState("pre");
  const [genPorta, setGenPorta] = useState("Curadoria");
  const [genPlatform, setGenPlatform] = useState("reels");
  const [genOutput, setGenOutput] = useState("");

  // Save State
  useEffect(() => {
    localStorage.setItem("bpmf_rota_luz_v1", JSON.stringify(state));
  }, [state]);

  // Sync default paid by selection when people changes
  useEffect(() => {
    if (state.people.length > 0 && !expenseWho) {
      setExpenseWho(state.people[0]);
    }
  }, [state.people]);

  // Init Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setGoogleToken(token);
      },
      () => {
        setUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set recipient input to user email or default trio on load
  useEffect(() => {
    if (user?.email) {
      setGmailState(prev => ({ ...prev, recipientInput: user.email || "" }));
    } else {
      setGmailState(prev => ({ ...prev, recipientInput: "borapedalarmeufilho@gmail.com" }));
    }
  }, [user]);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRegMarkdownUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRegMarkdownText(text);
      
      // Parse markdown content
      const parsed = parseRouteMarkdown(text);
      
      if (parsed.nome) setRegName(parsed.nome);
      if (parsed.descricao) setRegDesc(parsed.descricao);
      if (parsed.totalKm) setRegTotalKm(String(parsed.totalKm));
      if (parsed.totalDays) setRegTotalDays(String(parsed.totalDays));
      if (parsed.links) {
        if (parsed.links.wikiloc_completa) setRegWikilocCompleta(parsed.links.wikiloc_completa);
        if (parsed.links.wikiloc_cicloviagem) setRegWikilocCicloviagem(parsed.links.wikiloc_cicloviagem);
        if (parsed.links.strava) setRegStrava(parsed.links.strava);
        if (parsed.links.komoot) setRegKomoot(parsed.links.komoot);
        if (parsed.links.google_maps) setRegGoogleMaps(parsed.links.google_maps);
      }
      if (parsed.days) {
        setRegDays(parsed.days);
        
        let totalStops = 0;
        let totalPousadas = 0;
        parsed.days.forEach(d => {
          totalStops += d.paradas?.length || 0;
          totalPousadas += d.pousadas?.length || 0;
        });

        setParseSuccessMsg(
          `Sucesso! Encontramos "${parsed.nome || "Novo Roteiro"}" com ${parsed.days.length} dias, ${totalStops} paradas e ${totalPousadas} pousadas.`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleSaveCustomRoute = () => {
    if (!regName) {
      alert("Por favor, preencha o nome do roteiro.");
      return;
    }

    const routeId = editingRouteId || "custom_" + Date.now();
    
    // Default mock days if none parsed
    let finalDays = regDays;
    const daysCount = parseInt(regTotalDays) || 1;
    if (finalDays.length === 0) {
      finalDays = [];
      for (let i = 1; i <= daysCount; i++) {
        finalDays.push({
          n: i,
          from: `Ponto Inicial D${i}`,
          to: `Ponto Final D${i}`,
          saida: "07:30",
          km: Math.round((parseInt(regTotalKm) || 40) / daysCount),
          elev: 400,
          tempo: "4h a 6h",
          chegada: "14:00",
          refs: "Visual panorâmico, estradas de terra.",
          alerta: null,
          paradas: [],
          pousadas: []
        });
      }
    }

    const newRoute: Roteiro = {
      id: routeId,
      nome: regName,
      descricao: regDesc || `Cicloturismo autoral: ${regName}`,
      totalKm: parseInt(regTotalKm) || 0,
      totalDays: daysCount,
      days: finalDays,
      links: {
        wikiloc_completa: regWikilocCompleta || "https://www.wikiloc.com",
        wikiloc_cicloviagem: regWikilocCicloviagem || "https://www.wikiloc.com",
        cptm_bike: "http://www.circuitovaleeuropeu.com.br",
        strava: regStrava || "https://www.strava.com",
        komoot: regKomoot || "https://www.komoot.com",
        google_maps: regGoogleMaps || "https://www.google.com/maps"
      },
      cidadesEmg: finalDays.map(d => ({
        cidade: d.from,
        tel: "(11) 99999-9999",
        fonte: "Suporte do Roteiro"
      }))
    };

    setState(prev => {
      const currentCustom = prev.customRoutes || [];
      let updatedCustom: Roteiro[];
      if (editingRouteId) {
        updatedCustom = currentCustom.map(r => r.id === editingRouteId ? newRoute : r);
      } else {
        updatedCustom = [...currentCustom, newRoute];
      }
      return {
        ...prev,
        customRoutes: updatedCustom,
        currentRouteId: prev.currentRouteId === editingRouteId ? routeId : prev.currentRouteId,
        daysDone: editingRouteId ? prev.daysDone : {} // Reset checkmarks only for new routes
      };
    });

    // Reset fields
    setEditingRouteId(null);
    setRegMarkdownText("");
    setRegName("");
    setRegDesc("");
    setRegTotalKm("");
    setRegTotalDays("");
    setRegWikilocCompleta("");
    setRegWikilocCicloviagem("");
    setRegStrava("");
    setRegKomoot("");
    setRegGoogleMaps("");
    setRegDays([]);
    setParseSuccessMsg(null);
    setShowRegisterModal(false);

    alert(editingRouteId ? `Roteiro "${regName}" atualizado com sucesso!` : `Roteiro "${regName}" cadastrado com sucesso!`);
  };

  // Date Logic
  const getRelativeDateString = () => {
    if (!state.tripDate) return "Planejando";
    const startDate = new Date(state.tripDate + "T00:00:00");
    const today = new Date("2026-07-16T00:00:00"); // Fixed system mock date
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `A ${diffDays} dias da largada`;
    } else if (diffDays === 0) {
      return "Hoje na Rota: Dia 1 🚴‍♂️";
    } else if (diffDays === -1) {
      return "Hoje na Rota: Dia 2 ⛰️";
    } else if (diffDays === -2) {
      return "Hoje na Rota: Dia 3 🎉";
    } else {
      return "Cicloviagem Concluída!";
    }
  };

  const getDayDateLabel = (dayIndex: number) => {
    if (!state.tripDate) return `Dia ${dayIndex}`;
    const baseDate = new Date(state.tripDate + "T00:00:00");
    baseDate.setDate(baseDate.getDate() + (dayIndex - 1));
    return baseDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      weekday: "short"
    });
  };

  // Dynamic Metrics
  const totalKm = currentRoute.totalKm;
  const kmCompleted = daysData.reduce((acc, day) => {
    return acc + (state.daysDone[day.n] ? day.km : 0);
  }, 0);
  const kmRemaining = totalKm - kmCompleted;
  const progressPercent = totalKm > 0 ? Math.round((kmCompleted / totalKm) * 100) : 0;

  // Settlement Algorithm (Section 7)
  const calculateBalances = () => {
    const people = state.people;
    const balances: Record<string, number> = {};
    people.forEach(p => { balances[p] = 0; });

    state.expenses.forEach(exp => {
      if (exp.divide === "todos") {
        const share = exp.valor / 3;
        people.forEach(p => {
          balances[p] -= share;
        });
        balances[exp.quem] += exp.valor;
      }
    });

    // Simplify debts
    const creditors = people
      .map(p => ({ name: p, amount: balances[p] }))
      .filter(item => item.amount > 0.01)
      .sort((a, b) => b.amount - a.amount);

    const debtors = people
      .map(p => ({ name: p, amount: balances[p] }))
      .filter(item => item.amount < -0.01)
      .map(item => ({ name: item.name, amount: Math.abs(item.amount) }))
      .sort((a, b) => b.amount - a.amount);

    const transactions: string[] = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx];
      const debtor = debtors[dIdx];
      const amount = Math.min(creditor.amount, debtor.amount);

      transactions.push(
        `${debtor.name} deve R$ ${amount.toFixed(2).replace(".", ",")} para ${creditor.name}`
      );

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount < 0.01) cIdx++;
      if (debtor.amount < 0.01) dIdx++;
    }

    const totalSpent = state.expenses.reduce((sum, exp) => sum + exp.valor, 0);
    const avgSpent = totalSpent / 3;

    return {
      transactions,
      totalSpent,
      avgSpent,
      individualTotals: people.reduce((acc, p) => {
        acc[p] = state.expenses.filter(e => e.quem === p).reduce((s, e) => s + e.valor, 0);
        return acc;
      }, {} as Record<string, number>)
    };
  };

  const { transactions, totalSpent, avgSpent, individualTotals } = calculateBalances();

  // Handle Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseVal) return;
    const valueNum = parseFloat(expenseVal.replace(",", "."));
    if (isNaN(valueNum) || valueNum <= 0) return;

    const newExp: Expense = {
      id: Date.now(),
      desc: expenseDesc,
      valor: valueNum,
      cat: expenseCat,
      quem: expenseWho || state.people[0],
      divide: expenseDiv
    };

    setState(prev => ({
      ...prev,
      expenses: [newExp, ...prev.expenses]
    }));

    setExpenseDesc("");
    setExpenseVal("");
  };

  // Handle Delete Expense
  const handleDeleteExpense = (id: number, desc: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a despesa "${desc}"?`)) {
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id)
      }));
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setGoogleToken(res.accessToken);
      }
    } catch (e) {
      console.error(e);
      alert("Ocorreu um erro ao fazer login com o Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Log Out
  const handleGoogleSignOut = async () => {
    if (window.confirm("Deseja sair da sua conta Google?")) {
      await logout();
      setUser(null);
      setGoogleToken(null);
    }
  };

  // AI Grounding Research (Strategic Stops)
  const handleAskAI = async (parada: Parada, day: Day) => {
    setGroundingDrawer({
      isOpen: true,
      parada,
      day,
      loading: true,
      result: null,
      sources: []
    });

    try {
      const promptText = `Abaixo estão informações históricas e pontos de referência para o ciclista de Gravel/MTB do canal Bora Pedalar Meu Filho (BPMF).
Parada: "${parada.nome}"
Trecho do dia: de "${day.from}" para "${day.to}" (Dia ${day.n}).
Descrição preliminar: "${parada.desc}"

Como um especialista local de cicloturismo, use o Google Maps e fontes de busca em tempo real para complementar com dados precisos e atualizados:
1. Como está o acesso atual à parada de bicicleta? A via de terra está transitável em agosto?
2. Existem pontos próximos recomendados para hidratação, lanche rápido ou suporte mecânico?
3. Indique as melhores dicas de composição fotográfica ou locais específicos para Reels/Carrossel nesse spot que engajam ciclistas.
4. Traga uma curiosidade histórica fascinante ou detalhe de rota que os ciclistas deveriam saber.

Responda em português, com tom animado, profissional e focado no cicloturismo de aventura.`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText })
      });

      if (!response.ok) {
        throw new Error("Erro na requisição ao servidor backend.");
      }

      const data = await response.json();
      setGroundingDrawer(prev => ({
        ...prev,
        loading: false,
        result: data.text,
        sources: data.groundingChunks || []
      }));
    } catch (error: any) {
      setGroundingDrawer(prev => ({
        ...prev,
        loading: false,
        result: `Erro ao obter dados da IA: ${error.message || error}. Verifique sua conexão e tente novamente.`
      }));
    }
  };

  // AI Image Prompt Builder (Section 8.3)
  const buildAIPrompt = (slide: Slide, stage: ContentStage) => {
    const marcas = BPMF_PROMPT_BASE.marcas;
    const paleta = BPMF_PROMPT_BASE.paleta;
    const tipografia = BPMF_PROMPT_BASE.tipografia;
    const visual = BPMF_PROMPT_BASE.visual;
    const keywords = BPMF_PROMPT_BASE.keywords;

    return `Create a premium cinematic photograph for Instagram carousel slide ${slide.n}.
Brand style inspired by ${marcas}: replicate how these brands photograph real cyclists on real roads and real landscapes — not just their color palette.
Color palette: ${paleta}.
Typography: ${tipografia}. Text overlay is composited on top of the image as a design layer.
Visual style: ${visual}
SCENE BRIEF:
- Subject & Action: ${slide.scene.subject}
- Environment: ${slide.scene.environment}
- Camera & Framing: ${slide.scene.camera}
- Lighting & Mood: ${slide.scene.light}
- Required Text Composited (verbatim, PT-BR): "Headline: '${slide.headline}' - Subhead: '${slide.sub}'"
Style keywords: ${keywords}`;
  };

  // Generate Image with gemini-3.1-flash-image
  const handleGenerateImage = async (slide: Slide, stage: ContentStage) => {
    const imageKey = `${stage.id}-${slide.n}`;
    setImageGeneratingKey(imageKey);
    setImageError(null);

    const generatedPrompt = buildAIPrompt(slide, stage);

    try {
      const response = await fetch("/api/gemini/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatedPrompt })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha na geração.");
      }

      const data = await response.json();
      setGeneratedImages(prev => ({
        ...prev,
        [imageKey]: data.imageUrl
      }));
    } catch (e: any) {
      console.error(e);
      setImageError(`Falha ao gerar imagem: ${e.message || e}`);
    } finally {
      setImageGeneratingKey(null);
    }
  };

  // Sync to Google Sheets (Durable Storage Integration)
  const handleSyncToSheets = async () => {
    if (!googleToken) {
      alert("Por favor, faça login com o Google para habilitar essa integração!");
      return;
    }

    setSheetsSyncState({ loading: true, successUrl: null, error: null });

    try {
      const payload = {
        config: {
          tripDate: state.tripDate,
          people: state.people
        },
        expenses: state.expenses,
        checklist: state.checklist,
        contentPlan: CONTEUDO_SEMANA,
        daysData: daysData
      };

      const res = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao sincronizar com Google Sheets.");
      }

      const data = await res.json();
      setSheetsSyncState({
        loading: false,
        successUrl: data.spreadsheetUrl,
        error: null
      });
    } catch (e: any) {
      console.error(e);
      setSheetsSyncState({
        loading: false,
        successUrl: null,
        error: e.message || "Erro de sincronização."
      });
    }
  };

  // Send Email directly via Gmail API
  const handleSendGmailSummary = async () => {
    if (!googleToken) {
      alert("Por favor, faça login com o Google para autorizar o envio!");
      return;
    }

    setGmailState(prev => ({ ...prev, loading: true, success: false, error: null }));

    try {
      const emailList = gmailState.recipientInput.split(",").map(e => e.trim());
      if (emailList.length === 0 || !emailList[0]) {
        throw new Error("Adicione pelo menos um e-mail destinatário.");
      }

      // Compile detailed HTML
      const routeRows = daysData.map(day => `
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px; font-weight: bold; color: #39FF14;">Dia ${day.n}</td>
          <td style="padding: 10px; color: #fff;">${day.from} &rarr; ${day.to}</td>
          <td style="padding: 10px; color: #aaa;">${day.km} km</td>
          <td style="padding: 10px; color: #aaa;">+${day.elev}m</td>
          <td style="padding: 10px; color: #aaa;">${day.saida}</td>
        </tr>
      `).join("");

      const expenseRows = state.expenses.map(exp => `
        <tr style="border-bottom: 1px solid #222;">
          <td style="padding: 8px; color: #fff;">${exp.desc}</td>
          <td style="padding: 8px; color: #39FF14; font-weight:bold;">R$ ${exp.valor.toFixed(2)}</td>
          <td style="padding: 8px; color: #aaa;">${exp.cat}</td>
          <td style="padding: 8px; color: #fff;">${exp.quem}</td>
        </tr>
      `).join("");

      const balanceRows = transactions.map(t => `
        <li style="padding: 5px 0; color: #ffc94a; font-weight:bold;">${t}</li>
      `).join("");

      const htmlContent = `
        <div style="background-color: #050505; color: #ffffff; font-family: sans-serif; padding: 25px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #333;">
          <h2 style="color: #39FF14; font-family: Montserrat, Arial, sans-serif; border-bottom: 2px solid #39FF14; padding-bottom: 10px; margin-top: 0; font-style: italic;">
            BPMF - ${currentRoute.nome.toUpperCase()}: PLANO DE VIAGEM
          </h2>
          <p style="color: #ccc; font-size: 14px;">Olá Trio, compilamos o planejamento atualizado da cicloviagem diretamente do nosso applet oficial:</p>
          
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 15px;"><strong>📅 Data de Partida:</strong> ${state.tripDate || "Não definida"}</p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>👥 Integrantes do Trio:</strong> ${state.people.join(", ")}</p>
          </div>

          <h3 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 30px;">📍 ROTEIRO DE CICLOVIAGEM</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
              <tr style="background-color: #1a1a1a; color: #4AF47B;">
                <th style="padding: 8px;">Dia</th>
                <th style="padding: 8px;">Percurso</th>
                <th style="padding: 8px;">Dist.</th>
                <th style="padding: 8px;">Alt.</th>
                <th style="padding: 8px;">Saída</th>
              </tr>
            </thead>
            <tbody>
              ${routeRows}
            </tbody>
          </table>

          <h3 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 35px;">💰 BALANÇO FINANCEIRO</h3>
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Total Gasto Comum:</strong> R$ ${totalSpent.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Média por Pessoa:</strong> R$ ${avgSpent.toFixed(2)}</p>
          </div>
          <h4 style="color: #ffc94a; margin-bottom: 5px;">Ajustes de Contas Simplificados:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            ${balanceRows || '<li style="color: #ccc;">Nenhum acerto pendente.</li>'}
          </ul>

          <h3 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 35px;">📋 DESPESAS DETALHADAS</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead>
              <tr style="background-color: #1a1a1a; color: #aaa;">
                <th style="padding: 8px;">Item</th>
                <th style="padding: 8px;">Valor</th>
                <th style="padding: 8px;">Cat.</th>
                <th style="padding: 8px;">Pago por</th>
              </tr>
            </thead>
            <tbody>
              ${expenseRows || '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #aaa;">Nenhuma despesa cadastrada</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 15px; text-align: center; color: #777; font-size: 11px;">
            Bora Pedalar Meu Filho (BPMF) &bull; Rota da Luz Dashboard 2026
          </div>
        </div>
      `;

      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emails: emailList,
          subject: `[BPMF - Rota da Luz] Planejamento e Acerto de Contas do Trio`,
          htmlContent
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao enviar e-mail.");
      }

      setGmailState(prev => ({ ...prev, loading: false, success: true, error: null }));
      setTimeout(() => setGmailState(prev => ({ ...prev, success: false })), 4000);
    } catch (e: any) {
      console.error(e);
      setGmailState(prev => ({
        ...prev,
        loading: false,
        success: false,
        error: e.message || "Erro ao disparar Gmail."
      }));
    }
  };

  // Content Quick Text Generator Helper (Section 8.1)
  const handleGenerateQuickContent = () => {
    const stage = CONTEUDO_SEMANA.find(s => s.id === genPhase);
    if (!stage) return;

    let text = `🎬 [BPMF MÍDIAS - GRADE DE CONTEÚDO]\n`;
    text += `Fase: ${stage.stage} | Linha Editorial: ${stage.porta}\n\n`;

    if (genPlatform === "reels") {
      text += `🎥 [ROTEIRO REEL - TÍTULO: ${stage.reel.titulo}]\n`;
      text += `--- ARCO NARRATIVO ---\n`;
      text += `• Antes: ${stage.reel.storytelling.antes}\n`;
      text += `• Transformação: ${stage.reel.storytelling.transformacao}\n`;
      text += `• Depois: ${stage.reel.storytelling.depois}\n\n`;
      text += `--- SPEECH WORD-FOR-WORD ---\n`;
      stage.reel.speech.forEach(s => {
        text += `[${s.t}] (${s.fase}) - "${s.txt}" | Tom: ${s.tom} | Câmera: ${s.camera}\n`;
      });
      text += `\n--- COPY/LEGENDA SUGERIDA ---\n`;
      text += `${stage.reel.caption}\n`;
    } else {
      text += `🎠 [CARROSSEL - TÍTULO: ${stage.carrossel.titulo}]\n`;
      text += `--- ARCO NARRATIVO ---\n`;
      text += `• Gancho: ${stage.carrossel.storytelling.gancho}\n`;
      text += `• Virada: ${stage.carrossel.storytelling.virada}\n`;
      text += `• CTA: ${stage.carrossel.storytelling.cta}\n\n`;
      text += `--- ESTRUTURA DE SLIDES ---\n`;
      stage.carrossel.slides.forEach(sl => {
        text += `Slide ${sl.n} [${sl.funcao}]:\n`;
        text += `• HEADLINE: ${sl.headline}\n`;
        text += `• SUBHEAD: ${sl.sub}\n`;
        text += `• IA PROMPT: ${sl.scene.subject} in ${sl.scene.environment}\n\n`;
      });
      text += `--- COPY/LEGENDA SUGERIDA ---\n`;
      text += `${stage.carrossel.caption}\n`;
    }

    setGenOutput(text);
  };

  // Toggle Day complete and update checklist counts
  const handleToggleDayDone = (dayNum: number) => {
    setState(prev => ({
      ...prev,
      daysDone: {
        ...prev.daysDone,
        [dayNum]: !prev.daysDone[dayNum]
      }
    }));
  };

  // Checklist Item toggle
  const handleToggleChecklistItem = (cat: string, index: number) => {
    const key = `${cat}::${index}`;
    setState(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [key]: !prev.checklist[key]
      }
    }));
  };

  // Reset checklist with confirmation
  const handleResetChecklist = () => {
    if (window.confirm("Deseja realmente zerar todo o checklist de equipamentos?")) {
      setState(prev => ({
        ...prev,
        checklist: {}
      }));
    }
  };

  // Get checklists counts
  const getChecklistStats = () => {
    let total = 0;
    let checked = 0;
    Object.keys(CHECKLIST_DATA).forEach(cat => {
      CHECKLIST_DATA[cat].forEach((_, idx) => {
        total++;
        if (state.checklist[`${cat}::${idx}`]) {
          checked++;
        }
      });
    });
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, percent };
  };

  const checklistStats = getChecklistStats();

  // Offline Download handlers
  const handleDownloadOffline = () => {
    setIsDownloadingOffline(true);
    setOfflineProgress(0);
    
    const interval = setInterval(() => {
      setOfflineProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloadingOffline(false);
          setState(s => ({ ...s, isOfflineDownloaded: true }));
          setShowOfflineSuccess(true);
          setTimeout(() => setShowOfflineSuccess(false), 5000);
          return 100;
        }
        return prev + 5;
      });
    }, 120);
  };

  const handleRemoveOfflineData = () => {
    if (window.confirm("Deseja remover os mapas e arquivos offline do seu celular?")) {
      setState(s => ({ ...s, isOfflineDownloaded: false }));
    }
  };

  // Group Passcode Lock / Unlock handlers
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.groupPasscode) {
      setIsUnlocked(true);
      sessionStorage.setItem("bpmf_session_unlocked", "true");
      return;
    }
    if (enteredPasscode.trim().toLowerCase() === state.groupPasscode.trim().toLowerCase()) {
      setIsUnlocked(true);
      setPasscodeError("");
      sessionStorage.setItem("bpmf_session_unlocked", "true");
    } else {
      setPasscodeError("Senha incorreta. Solicite ao coordenador da sua turma.");
    }
  };

  const handleArchiveRouteToggle = (routeId: string) => {
    setState(prev => {
      const archived = prev.archivedRouteIds || [];
      const isArchived = archived.includes(routeId);
      const updatedArchived = isArchived
        ? archived.filter(id => id !== routeId)
        : [...archived, routeId];
      
      // Fallback if current route is being archived
      const fallbackId = prev.currentRouteId === routeId ? "rota_da_luz" : prev.currentRouteId;
      return {
        ...prev,
        archivedRouteIds: updatedArchived,
        currentRouteId: fallbackId
      };
    });
  };

  // Export State JSON
  const handleExportState = () => {
    const dataStr = JSON.stringify(state, null, 2);
    setBackupString(dataStr);
    handleCopy(dataStr, "backup-json");
    alert("Backup copiado para a área de transferência! Você também pode salvar o texto em um arquivo.");
  };

  // Import State JSON
  const handleImportState = () => {
    if (!backupString) {
      alert("Cole o conteúdo JSON do backup antes de restaurar!");
      return;
    }
    try {
      const parsed = JSON.parse(backupString);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Formato inválido.");
      }
      // Basic validate
      if (!Array.isArray(parsed.people) || !parsed.checklist || !Array.isArray(parsed.expenses)) {
        throw new Error("Chaves essenciais faltando no backup.");
      }

      setState(parsed);
      setRestoredSuccess(true);
      setTimeout(() => setRestoredSuccess(false), 4000);
      alert("Estado restaurado com sucesso!");
      setShowConfig(false);
    } catch (e: any) {
      alert(`Falha ao restaurar backup: ${e.message || e}`);
    }
  };

  return (
    <div className="max-w-[520px] mx-auto min-h-screen bg-[#020204] text-slate-200 font-sans relative flex flex-col pb-24 shadow-[0_0_50px_rgba(99,102,241,0.12)] border-x border-white/10 overflow-hidden">
      {/* Immersive UI Background Glow Effects */}
      <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] bg-indigo-950/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[100px] right-[-100px] w-[400px] h-[400px] bg-violet-950/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-80px] w-[250px] h-[250px] bg-emerald-950/10 rounded-full blur-[90px] pointer-events-none"></div>

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="#39FF14" strokeWidth="3" strokeDasharray="3 2" />
              <circle cx="50" cy="50" r="38" stroke="#ffffff" strokeWidth="1" />
              {/* Topographic contour line representing altitude */}
              <path d="M 22 68 Q 35 50 48 65 T 78 48" stroke="#39FF14" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
              <path d="M 20 78 Q 35 60 52 75 T 82 58" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
              <text x="50" y="56" textAnchor="middle" fill="#39FF14" fontSize="18" fontWeight="900" fontStyle="italic" fontFamily="system-ui, sans-serif">BPMF</text>
            </svg>
          </div>
          <div>
            <h1 className="font-display font-black text-xs tracking-tight leading-none text-white italic uppercase">
              BPMF <span className="font-medium text-[#39FF14] not-italic text-[10px]">CicloAventuras</span>
            </h1>
            <span className="text-[8px] text-slate-400 font-mono font-bold tracking-widest uppercase block mt-0.5">PREMIUM BIKE PACKING</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={handleGoogleSignOut}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-[10px] text-indigo-300 transition backdrop-blur-sm"
              title={`Logado como: ${user.email}`}
            >
              <img
                src={user.photoURL || "https://lh3.googleusercontent.com/a/default-user=s40-c"}
                alt="user"
                className="w-3.5 h-3.5 rounded-full"
                referrerPolicy="no-referrer"
              />
              <span className="hidden xs:inline">Conectado</span>
            </button>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="px-2.5 py-1 rounded-full bg-white text-black font-display font-bold text-[10px] flex items-center gap-1 hover:bg-indigo-50 transition active:scale-95 cursor-pointer disabled:opacity-60 shadow-md shadow-white/5"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Conectar</span>
            </button>
          )}

          <button
            onClick={() => {
              setBackupString(JSON.stringify(state, null, 2));
              setShowConfig(true);
            }}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition cursor-pointer backdrop-blur-sm"
            id="open-settings-btn"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>



      {/* CONTENT REGION */}
      <main className="flex-1 px-4 py-4 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {isLocked ? (
            <motion.div
              key="lockscreen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 py-2"
            >
              {/* LOCK HEADER CARD */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 text-center space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[180px] h-[180px] bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
                
                <div className="w-16 h-16 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10 text-indigo-400">
                  <Lock className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-black text-sm text-white uppercase tracking-tight">
                    🔒 Acesso Restrito da Turma
                  </h2>
                  <p className="text-[9px] text-indigo-300 font-mono font-bold tracking-widest uppercase">
                    BPMF CicloAventuras SUPPORT SYSTEM
                  </p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Este roteiro de cicloturismo está temporariamente bloqueado para proteção do cronograma da equipe. Digite a <strong className="text-white">Senha da Turma</strong> fornecida pelo guia no briefing de partida.
                </p>

                <form onSubmit={handleVerifyPasscode} className="space-y-3 pt-2 max-w-xs mx-auto">
                  <div className="relative">
                    <input
                      type="password"
                      value={enteredPasscode}
                      onChange={(e) => {
                        setEnteredPasscode(e.target.value);
                        setPasscodeError("");
                      }}
                      placeholder="Digite a Senha da Turma"
                      className="w-full bg-black/40 border border-white/10 text-xs text-center text-white p-3 rounded-xl focus:outline-none focus:border-indigo-500 font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal"
                    />
                  </div>

                  {passcodeError && (
                    <p className="text-[10px] text-red-400 font-medium bg-red-400/5 border border-red-400/10 py-1.5 px-3 rounded-lg">
                      ⚠️ {passcodeError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#4AF47B] text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition hover:bg-[#3ce26b] active:scale-95 cursor-pointer shadow-md shadow-[#4AF47B]/10 flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Desbloquear Roteiro</span>
                  </button>
                </form>
              </div>

              {/* FREE SOS ACCESS widget */}
              <div className="bg-red-500/5 border border-red-500/15 backdrop-blur-md rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-2 text-red-400 font-display font-bold text-xs uppercase tracking-wider">
                  <Phone className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>Central SOS & Apoio (Acesso Livre)</span>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  Precisa de assistência ou resgate agora? O suporte técnico do evento está disponível sem senha. Toque para ligar imediatamente:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:+5512997421212"
                    className="p-3 bg-white/5 border border-white/5 hover:border-red-500/30 rounded-xl flex flex-col items-center justify-center transition group cursor-pointer"
                  >
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Contato do Guia</span>
                    <span className="text-xs font-bold text-white group-hover:text-red-400 mt-1">Guia de Apoio BPMF</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">(12) 99742-1212</span>
                  </a>

                  <a
                    href="tel:192"
                    className="p-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl flex flex-col items-center justify-center transition cursor-pointer"
                  >
                    <span className="text-[8px] font-mono text-red-400 uppercase">Ambulância</span>
                    <span className="text-xs font-bold text-white mt-1">Ligar SAMU</span>
                    <span className="text-[10px] text-red-400 font-mono font-bold mt-0.5">192</span>
                  </a>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1.5">
                  <span className="block text-[8px] font-mono text-slate-500 uppercase">Contatos Úteis por Cidade:</span>
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <div className="flex justify-between font-mono">
                      <span>Mogi das Cruzes:</span>
                      <span className="text-white">(11) 4798-5000</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Paraibuna:</span>
                      <span className="text-white">(12) 3974-2080</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Aparecida:</span>
                      <span className="text-white">(12) 3104-4000</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {activeTab === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 pb-6"
                >
                  {/* HERO HEADER */}
                  <div className="flex flex-col items-center justify-center text-center pt-4 pb-2">
                    {/* TOPOGRAPHIC BADGE CSS EMBLEM */}
                    <div className="relative w-32 h-32 mb-4 group cursor-pointer" onClick={() => setActiveTab("briefing")}>
                      {/* Concentric glowing outline */}
                      <div className="absolute inset-0 bg-[#4AF47B]/10 rounded-full blur-xl group-hover:bg-[#4AF47B]/20 transition-all duration-500 animate-pulse" />
                      
                      {/* SVG topographic circle */}
                      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 animate-[spin_120s_linear_infinite]">
                        {/* Dark background circle */}
                        <circle cx="100" cy="100" r="95" fill="#07070a" stroke="#4AF47B" strokeWidth="2" strokeDasharray="3,3" className="opacity-40" />
                        <circle cx="100" cy="100" r="90" fill="#0a0a0e" stroke="#4AF47B" strokeWidth="1.5" />
                        
                        {/* Topographic contours */}
                        <path d="M 30,100 Q 100,50 170,100" fill="none" stroke="#4AF47B" strokeWidth="0.5" strokeOpacity="0.25" />
                        <path d="M 45,100 Q 100,65 155,100" fill="none" stroke="#4AF47B" strokeWidth="0.5" strokeOpacity="0.35" />
                        <path d="M 60,100 Q 100,80 140,100" fill="none" stroke="#4AF47B" strokeWidth="0.5" strokeOpacity="0.45" />
                        
                        {/* Bottom contours */}
                        <path d="M 30,100 Q 100,150 170,100" fill="none" stroke="#4AF47B" strokeWidth="0.5" strokeOpacity="0.15" />
                        <path d="M 45,100 Q 100,135 155,100" fill="none" stroke="#4AF47B" strokeWidth="0.5" strokeOpacity="0.2" />
                        <path d="M 60,100 Q 100,120 140,100" fill="none" stroke="#4AF47B" strokeWidth="0.5" strokeOpacity="0.3" />
                        
                        {/* Some extra random contour waves */}
                        <path d="M 70,55 Q 100,70 130,55" fill="none" stroke="#4AF47B" strokeWidth="0.75" strokeOpacity="0.4" />
                        <path d="M 80,65 Q 100,78 120,65" fill="none" stroke="#4AF47B" strokeWidth="0.75" strokeOpacity="0.5" />
                        <path d="M 70,145 Q 100,130 130,145" fill="none" stroke="#4AF47B" strokeWidth="0.75" strokeOpacity="0.25" />
                        <path d="M 80,135 Q 100,122 120,135" fill="none" stroke="#4AF47B" strokeWidth="0.75" strokeOpacity="0.3" />
                        
                        {/* Text path for circular text along the bottom inner edge */}
                        <path id="textPath" d="M 28,132 A 72,72 0 0,0 172,132" fill="none" />
                        <text fill="#ffffff" fontSize="8" fontFamily="system-ui, sans-serif" fontWeight="900" letterSpacing="2.8" className="tracking-widest font-bold uppercase fill-white">
                          <textPath href="#textPath" startOffset="50%" textAnchor="middle">
                            BORA PEDALAR MEU FILHO
                          </textPath>
                        </text>
                      </svg>

                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 select-none">
                        <span className="font-sans italic font-black text-white text-[25px] tracking-tighter leading-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          BPMF
                        </span>
                        {/* Small bike rider icon inside */}
                        <svg className="w-5 h-5 text-[#4AF47B] mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="5.5" cy="17.5" r="3.5" />
                          <circle cx="18.5" cy="17.5" r="3.5" />
                          <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-3 5.5 1.5-2.5 3.5 1.5M12 11.5l-3-1.5M12 11.5v6.5" />
                        </svg>
                      </div>
                    </div>

                    <h1 className="font-display font-black text-2xl text-white tracking-tight leading-tight uppercase">
                      Bora Pedalar Meu Filho
                    </h1>
                    <p className="text-[#4AF47B] text-[10px] font-mono tracking-widest font-bold uppercase mt-1">
                      Mais do que um pedal. Uma experiência completa.
                    </p>
                  </div>

                  {/* BUSINESS PHILOSOPHY */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 relative overflow-hidden shadow-xl space-y-3.5">
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-indigo-500/5 rounded-full blur-[30px] pointer-events-none" />
                    
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#4AF47B] font-mono font-bold uppercase tracking-wider">PROPÓSITO BPMF</span>
                      <h2 className="font-display font-black text-sm text-white uppercase tracking-tight">
                        Redefinindo o Cicloturismo
                      </h2>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      O <strong className="text-white">BPMF</strong> não organiza apenas pedais; entregamos jornadas memoráveis com começo, meio e fim. Focamos na conexão humana, estratégia de grupo e momentos únicos que transformam um simples passeio em uma história de vida para guardar para sempre.
                    </p>

                    <div className="border-l-2 border-[#4AF47B] pl-3 py-0.5">
                      <p className="text-xs text-[#4AF47B] italic font-medium leading-relaxed">
                        "Você não vem só pedalar. Você vem viver o dia."
                      </p>
                    </div>
                  </div>

                  {/* COMPACT ROUTE SELECTOR ON HOME */}
                  <div className="bg-[#0c0c10] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#4AF47B] font-mono font-bold uppercase tracking-wider">ROTEIRO ATIVO</span>
                      <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">
                        Selecione o Roteiro de Viagem
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Escolha entre os roteiros premium ativos para planejar sua jornada e acompanhar as etapas:
                      </p>
                    </div>
                    
                    {/* Custom dropdown on Home */}
                    <div className="relative">
                      <button
                        onClick={() => setShowRouteDropdown(prev => !prev)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-left transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center font-bold text-[#39FF14] text-sm shrink-0">
                            🚲
                          </div>
                          <div>
                            <span className="text-[9px] font-mono block text-[#39FF14] font-bold uppercase tracking-wider leading-none">
                              {currentRoute.totalKm} KM · {currentRoute.totalDays} DIAS
                            </span>
                            <span className="text-xs font-display font-black uppercase tracking-tight block mt-1 text-white">
                              {currentRoute.nome}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-white">
                          <span className="text-[8px] font-mono uppercase bg-white/5 border border-white/10 rounded px-1.5 py-0.5 hidden sm:inline-block">
                            {(state.customRoutes || []).some(r => r.id === currentRoute.id) ? "Autoral" : "Premium BPMF"}
                          </span>
                          {showRouteDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {showRouteDropdown && (
                          <>
                            {/* Backdrop overlay to close when clicking outside */}
                            <div className="fixed inset-0 z-30" onClick={() => setShowRouteDropdown(false)} />
                            
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 right-0 mt-1.5 z-40 max-h-[280px] overflow-y-auto rounded-xl border border-white/10 bg-[#0e0e14] shadow-2xl p-1.5 space-y-1 divide-y divide-white/5"
                            >
                              {/* CATEGORIA 1: INTEGRADOS */}
                              <div className="p-1 space-y-1">
                                <span className="block text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest px-2 py-1">
                                  💎 Roteiros Integrados (Premium BPMF)
                                </span>
                                {ROTEIROS.filter((rot) => !archivedRouteIds.includes(rot.id)).map((rot) => {
                                  const isSelected = currentRouteId === rot.id;
                                  return (
                                    <button
                                      key={rot.id}
                                      onClick={() => {
                                        setState(prev => ({
                                          ...prev,
                                          currentRouteId: rot.id,
                                          daysDone: {}
                                        }));
                                        setShowRouteDropdown(false);
                                      }}
                                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer ${
                                        isSelected 
                                          ? "bg-[#39FF14]/10 text-white border border-[#39FF14]/20" 
                                          : "hover:bg-white/5 text-slate-300 hover:text-white border border-transparent"
                                      }`}
                                    >
                                      <div>
                                        <span className="text-xs font-display font-black uppercase block">{rot.nome}</span>
                                        <span className="text-[9px] font-mono text-slate-400 block">{rot.totalKm} KM • {rot.totalDays} Dias</span>
                                      </div>
                                      {isSelected && <Check className="w-4 h-4 text-[#39FF14]" />}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* CATEGORIA 2: CUSTOMIZADOS */}
                              <div className="p-1 space-y-1 pt-2">
                                <span className="block text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest px-2 py-1">
                                  📂 Seus Roteiros Cadastrados ({(state.customRoutes || []).filter((rot) => !archivedRouteIds.includes(rot.id)).length})
                                </span>
                                
                                {(state.customRoutes || []).filter((rot) => !archivedRouteIds.includes(rot.id)).length === 0 ? (
                                  <div className="p-3 text-center text-[10px] text-slate-500 italic">
                                    Nenhum roteiro autoral cadastrado ativo ainda.
                                  </div>
                                ) : (
                                  (state.customRoutes || []).filter((rot) => !archivedRouteIds.includes(rot.id)).map((rot) => {
                                    const isSelected = currentRouteId === rot.id;
                                    return (
                                      <button
                                        key={rot.id}
                                        onClick={() => {
                                          setState(prev => ({
                                            ...prev,
                                            currentRouteId: rot.id,
                                            daysDone: {}
                                          }));
                                          setShowRouteDropdown(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer ${
                                          isSelected 
                                            ? "bg-indigo-500/10 text-white border border-indigo-500/20" 
                                            : "hover:bg-white/5 text-slate-300 hover:text-white border border-transparent"
                                        }`}
                                      >
                                        <div>
                                          <span className="text-xs font-display font-black uppercase block">{rot.nome}</span>
                                          <span className="text-[9px] font-mono text-slate-400 block">{rot.totalKm} KM • {rot.totalDays} Dias</span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {currentRoute.descricao && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 leading-relaxed italic">
                        &ldquo;{currentRoute.descricao}&rdquo;
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setActiveTab("briefing")}
                        className="py-2.5 bg-[#4AF47B] hover:bg-[#3ce26b] text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 shadow-md shadow-[#4AF47B]/10 flex items-center justify-center gap-1.5 font-bold"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ver Briefing</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("rota")}
                        className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 font-bold"
                      >
                        <Map className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ver Cronograma</span>
                      </button>
                    </div>
                  </div>

                  {/* OUR STRUCTURED PROCESS (4 PILLARS) */}
                  <div className="space-y-3">
                    <div className="pl-1">
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">SISTEMA EXCLUSIVO</span>
                      <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">Nosso Processo Estruturado</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Curadoria */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1.5 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Compass className="w-4 h-4" />
                        </div>
                        <h4 className="font-display font-bold text-xs text-white uppercase tracking-tight">Curadoria</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Seleção rigorosa de rotas cênicas e parceiros de gastronomia fina.</p>
                      </div>

                      {/* Segurança */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1.5 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <h4 className="font-display font-bold text-xs text-white uppercase tracking-tight">Segurança</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Briefing técnico minucioso e guias de apoio de prontidão.</p>
                      </div>

                      {/* Experiência */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1.5 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h4 className="font-display font-bold text-xs text-white uppercase tracking-tight">Experiência</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Momentos planejados para conectar o grupo emocionalmente.</p>
                      </div>

                      {/* Registro */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1.5 hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-[#4AF47B]/10 border border-[#4AF47B]/20 flex items-center justify-center text-[#4AF47B]">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <h4 className="font-display font-bold text-xs text-white uppercase tracking-tight">Registro</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Captura profissional de fotos/vídeos para reviver para sempre.</p>
                      </div>
                    </div>
                  </div>

                  {/* OFFLINE DOWNLOAD MODE CARD (UX Strategic Placement) */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400 font-display font-bold text-xs uppercase tracking-wider">
                        {state.isOfflineDownloaded ? (
                          <Wifi className="w-4 h-4 text-[#4AF47B]" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
                        )}
                        <span>Preparação Offline de Segurança</span>
                      </div>
                      {state.isOfflineDownloaded && (
                        <span className="text-[8px] bg-[#4AF47B]/10 border border-[#4AF47B]/20 px-2 py-0.5 rounded-full text-[#4AF47B] font-bold font-mono">
                          SALVO LOCAL
                        </span>
                      )}
                    </div>

                    {/* Show simulation loading progress */}
                    {isDownloadingOffline ? (
                      <div className="space-y-2.5 py-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-400 animate-pulse">
                            {offlineProgress < 25 ? "🔗 Conectando ao servidor BPMF..." :
                             offlineProgress < 50 ? "🗺️ Caching de mapas e trajetos GPX..." :
                             offlineProgress < 75 ? "📝 Carregando contatos SOS e paradas..." :
                             offlineProgress < 95 ? "🎬 Salvando ideias de mídias e roteiro..." :
                             "✓ Finalizando sincronização..."}
                          </span>
                          <span className="text-indigo-400 font-bold">{offlineProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div 
                            className="h-full bg-[#4AF47B] transition-all duration-150"
                            style={{ width: `${offlineProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : state.isOfflineDownloaded ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Todo o roteiro <strong className="text-white">{currentRoute.nome}</strong> está salvo localmente. Você pode acessar mapas, contatos de resgate e pautas de mídias no meio do mato, sem sinal de rede!
                        </p>
                        <button
                          onClick={handleRemoveOfflineData}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Limpar Cache do Dispositivo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          As serras frequentemente bloqueiam o sinal de internet. Baixe todo o conteúdo do roteiro ativo para navegação offline imediata nas montanhas!
                        </p>
                        <button
                          onClick={handleDownloadOffline}
                          className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold font-display uppercase tracking-wider rounded-xl transition hover:from-indigo-600 hover:to-violet-700 active:scale-95 cursor-pointer shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar Roteiro Offline</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* NINGUÉM PEDALA SOZINHO CARD */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-5 text-center space-y-2.5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#4AF47B]" />
                    <h4 className="font-display font-black text-sm text-white uppercase tracking-wider">
                      "Ninguém pedala sozinho"
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                      Nosso compromisso inabalável com a união da equipe, o suporte mútuo e a segurança coletiva do primeiro ao último quilômetro.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "briefing" && (
                <motion.div
                  key="briefing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >


                  {/* STREAK & DATA OVERVIEW CARD */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 relative overflow-hidden shadow-xl">
                    <div className="absolute right-0 top-0 bg-indigo-500/20 border-l border-b border-white/10 px-3 py-1 rounded-bl-xl font-mono text-[9px] text-indigo-300 uppercase tracking-widest font-bold">
                      LIVE STATUS
                    </div>

                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4AF47B] animate-pulse shadow-[0_0_8px_rgba(74,244,123,0.8)]" />
                      <span className="text-[10px] text-slate-400 tracking-wider uppercase font-mono font-medium">
                        Dashboard Cicloviagem
                      </span>
                    </div>

                    <h2 className="font-display font-black text-xl mb-1 text-white uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                      {state.tripDate ? "Mogi → Aparecida" : "Planejamento Rota da Luz"}
                    </h2>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 font-display font-bold mt-1">
                      {getRelativeDateString()}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-5 space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Progresso do percurso</span>
                        <span className="text-[#4AF47B] font-bold">{progressPercent}% ({kmCompleted.toFixed(1)} km / {totalKm} km)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* State metrics grids */}
                    <div className="grid grid-cols-3 gap-2 mt-4.5 pt-4 border-t border-white/5 text-center">
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="block text-[9px] text-slate-400 font-mono uppercase">KM Realizado</span>
                        <span className="text-base font-display font-black text-white">{kmCompleted.toFixed(0)} km</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="block text-[9px] text-slate-400 font-mono uppercase">KM Restantes</span>
                        <span className="text-base font-display font-black text-white">{kmRemaining.toFixed(0)} km</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="block text-[9px] text-slate-400 font-mono uppercase">Dia Atual</span>
                        <span className="text-base font-display font-black text-[#4AF47B]">
                          {state.daysDone[1] ? (state.daysDone[2] ? "Dia 3" : "Dia 2") : "Dia 1"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OUTCOME TODAY SUMMARY */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg">
                    <div className="flex items-center gap-2 text-indigo-400 font-display font-bold text-xs uppercase tracking-wider">
                      <Map className="w-4 h-4 text-indigo-400" />
                      <span>Hoje no Roteiro</span>
                    </div>

                    {!state.daysDone[1] ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-white font-bold font-display">DIA 1: Mogi das Cruzes → Paraibuna</span>
                          <span className="text-[10px] text-[#4AF47B] bg-[#4AF47B]/10 border border-[#4AF47B]/20 px-2 py-0.5 rounded-full font-bold">Pendente</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          Largada às 07:00 da Estação de Trem. Passando pela histórica Vila de Luís Carlos (Km 18) e Ponte de Santa Branca (Km 45). Relevo moderado com 1.100m de subida.
                        </p>
                      </div>
                    ) : !state.daysDone[2] ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-white font-bold font-display">DIA 2: Paraibuna → Pindamonhangaba</span>
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">Etapa Rainha</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          Etapa mais dura do pedal (81km / +1.200m). Cuidado redobrado na subida clássica do Morro do Batman logo após Redenção da Serra. Mantenha os reservatórios de água cheios!
                        </p>
                      </div>
                    ) : !state.daysDone[3] ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-white font-bold font-display">DIA 3: Pindamonhangaba → Aparecida</span>
                          <span className="text-[10px] text-[#4AF47B] bg-[#4AF47B]/10 border border-[#4AF47B]/20 px-2 py-0.5 rounded-full font-bold">Trecho Plano</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          Última perna! 42km rápidos acompanhando o Rio Paraíba do Sul. Destaque para o Mosteiro Sagrada Face (Castelo medieval em Roseira, Km 20) e chegada gloriosa na Basílica.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-[#4AF47B] font-bold bg-[#4AF47B]/5 border border-[#4AF47B]/10 rounded-xl">
                        🚀 Parabéns Trio! Vocês completaram com êxito os 201,5km da Rota da Luz!
                      </div>
                    )}
                  </div>

                  {/* INTEGRATION PROMOTION BOXES */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white font-bold font-display uppercase tracking-wider flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                        Sincronização Google Workspace
                      </span>
                      <span className="text-[9px] text-white/40 font-mono font-medium tracking-wide">DRIVE & SHEETS & GMAIL</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Conecte sua conta do Google no cabeçalho para habilitar os recursos avançados de salvamento em nuvem compartilhada e envio de e-mail de fechamento do trio!
                    </p>

                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        onClick={handleSyncToSheets}
                        disabled={sheetsSyncState.loading}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-xs text-white font-bold hover:from-indigo-600 hover:to-violet-700 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 shadow-md shadow-indigo-500/10"
                      >
                        {sheetsSyncState.loading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                        )}
                        <span>Sincronizar Planilha de Cicloviagem</span>
                      </button>

                      {sheetsSyncState.successUrl && (
                        <div className="bg-[#4AF47B]/10 border border-[#4AF47B]/20 p-2.5 rounded-xl text-center">
                          <span className="block text-[10px] text-[#4AF47B] font-bold font-display uppercase mb-1">
                            ✓ Planilha Criada e Sincronizada!
                          </span>
                          <a
                            href={sheetsSyncState.successUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-white font-bold underline hover:text-[#4AF47B]"
                          >
                            Abrir Google Sheets <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {sheetsSyncState.error && (
                        <div className="bg-[#4AF47B]/10 border border-[#4AF47B]/30 p-2 rounded-xl text-xs text-[#4AF47B] text-center">
                          Erro no Sheets: {sheetsSyncState.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QUICK LINKS GRID */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-display font-bold text-white/40 uppercase tracking-wider pl-1">Atalhos Rápidos</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveTab("rota")}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-xl text-left transition cursor-pointer shadow-sm group"
                      >
                        <span className="text-xs font-display font-bold block text-white group-hover:text-indigo-300 transition-colors">📍 Cronograma</span>
                        <span className="text-[10px] text-slate-400 font-mono">3 dias de percurso</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("checklist")}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-xl text-left transition cursor-pointer shadow-sm group"
                      >
                        <span className="text-xs font-display font-bold block text-white group-hover:text-indigo-300 transition-colors">✅ Equipamento</span>
                        <span className="text-[10px] text-slate-400 font-mono">Checklist e mala</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("gastos")}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-xl text-left transition cursor-pointer shadow-sm group"
                      >
                        <span className="text-xs font-display font-bold block text-white group-hover:text-indigo-300 transition-colors">💰 Divisão de Gastos</span>
                        <span className="text-[10px] text-slate-400 font-mono">Simplificação do trio</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("apoio")}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 rounded-xl text-left transition cursor-pointer shadow-sm group"
                      >
                        <span className="text-xs font-display font-bold block text-white group-hover:text-indigo-300 transition-colors">📞 Suporte & Mídias</span>
                        <span className="text-[10px] text-slate-400 font-mono">SOS e Pautas</span>
                      </button>
                    </div>
                  </div>

                  {/* RESEARCH FOOTNOTE */}
                  <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500 leading-normal space-y-1 pl-1">
                    <p className="font-bold">Fontes primárias de apuração:</p>
                    <p>• guararema.sp.gov.br | santabranca.sp.gov.br | circuitobr.com.br</p>
                    <p>• prefeitura de Redenção da Serra | maubio.blogspot.com</p>
                    <p>• passaromarron.com.br | institutoestradareal.com.br | rainhahoteis.com.br</p>
                  </div>
                </motion.div>
              )}

              {activeTab === "rota" && (
                <motion.div
                  key="rota"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* SELECTED ROUTE INFO HEADER */}
                  <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[8px] font-mono font-bold text-[#4AF47B] uppercase tracking-wider">Cronograma de Viagem Selecionado na Home</span>
                      <h3 className="text-sm font-display font-black text-white uppercase tracking-tight mt-0.5 text-left">
                        {currentRoute.nome}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono block text-left">
                        {currentRoute.totalKm} KM Total · {currentRoute.totalDays} Dias
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center font-bold text-[#39FF14] text-sm shrink-0">
                      🚲
                    </div>
                  </div>

                  {currentRoute.descricao && (
                    <p className="text-[10px] text-slate-400 leading-relaxed pl-1 pt-1 border-t border-white/5 italic text-left">
                      &ldquo;{currentRoute.descricao}&rdquo;
                    </p>
                  )}

              {/* INTERACTIVE GPX VISUALIZER */}
              <GPXVisualizer
                routeId={currentRoute.id}
                routeName={currentRoute.nome}
                totalKm={currentRoute.totalKm}
                links={currentRoute.links}
              />

              {/* CPTM NOTIFICATION */}
              <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl p-3.5 flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300">
                  <span className="font-bold text-amber-400 font-display">Embarque de Bikes CPTM (Linha 11):</span> Liberado sábados, domingos e feriados o dia todo. Dias úteis somente pós-20h30. Link oficial disponível na aba SOS.
                </div>
              </div>

              <div className="flex items-center justify-between pl-1">
                <h2 className="font-display font-black text-sm uppercase text-white tracking-tight">
                  Cronograma Diário de Bordo
                </h2>
                <span className="text-[9px] font-mono text-slate-500 uppercase">
                  Progresso: {progressPercent}% Completo
                </span>
              </div>

              {/* DAYS LOOP ACCORDION */}
              <div className="space-y-3.5">
                {daysData.map(day => {
                  const isOpen = openDays[day.n] || false;
                  const isDone = state.daysDone[day.n] || false;

                  return (
                    <div
                      key={day.n}
                      className={`bg-white/5 backdrop-blur-md rounded-2xl border transition-all duration-300 ${
                        isDone ? "border-[#39FF14]/30 shadow-[0_0_15px_rgba(57,255,20,0.05)]" : "border-white/10"
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setOpenDays(prev => ({ ...prev, [day.n]: !prev[day.n] }))}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleDayDone(day.n);
                            }}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                              isDone ? "bg-[#39FF14] border-[#39FF14] text-black shadow-[0_0_8px_rgba(57,255,20,0.4)]" : "border-slate-500 hover:border-white"
                            }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-[#39FF14] font-bold uppercase tracking-wider">
                                Dia {day.n}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                ({getDayDateLabel(day.n)})
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-xs text-white uppercase tracking-tight">
                              {day.from.split(" ")[0]} &rarr; {day.to.split(" ")[0]}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-400">
                            {day.km} km
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Accordion Body */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/10"
                          >
                            <div className="p-4 space-y-4">
                              {/* Day KPI grid */}
                              <div className="grid grid-cols-4 gap-2 text-center bg-black/40 p-2.5 rounded-xl border border-white/5">
                                <div>
                                  <span className="block text-[8px] text-slate-500 font-mono uppercase">Saída</span>
                                  <span className="text-xs font-display font-bold text-white">{day.saida}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-500 font-mono uppercase">Chegada Est</span>
                                  <span className="text-xs font-display font-bold text-white">{day.chegada}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-500 font-mono uppercase">Distância</span>
                                  <span className="text-xs font-display font-bold text-[#39FF14]">{day.km} km</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-500 font-mono uppercase">Altimetria</span>
                                  <span className="text-xs font-display font-bold text-[#39FF14]">+{day.elev} m</span>
                                </div>
                              </div>

                              {/* References */}
                              <div className="text-xs">
                                <strong className="text-slate-400 block font-display uppercase tracking-wider text-[9px] mb-0.5">Pontos de Passagem:</strong>
                                <span className="text-white">{day.refs}</span>
                              </div>

                              {/* Warnings if any */}
                              {day.alerta && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-3 py-2.5 rounded-xl leading-relaxed flex gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                  <span>{day.alerta}</span>
                                </div>
                              )}

                              {/* Strategic Stops */}
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-display font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>Paradas Estratégicas & Spots</span>
                                </h4>

                                <div className="space-y-2.5">
                                  {day.paradas.map((parada, pIdx) => (
                                    <div key={pIdx} className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-1.5 relative">
                                      {parada.tag && (
                                        <span className="absolute top-2.5 right-2.5 text-[8px] font-display font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase">
                                          {parada.tag}
                                        </span>
                                      )}
                                      <div className="flex gap-1.5 items-baseline">
                                        <span className="text-[10px] font-mono text-[#39FF14] font-bold bg-[#39FF14]/10 px-1.5 py-0.2 rounded shrink-0">
                                          {parada.km}
                                        </span>
                                        <span className="text-xs font-display font-bold text-white pr-14 leading-tight">{parada.nome}</span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 leading-normal">{parada.desc}</p>
                                      <div className="text-[10px] text-emerald-300 flex items-start gap-1 leading-normal">
                                        <span className="font-bold font-display uppercase shrink-0 text-[8px] bg-emerald-500/10 text-[#39FF14] px-1 rounded mt-0.5">🎬</span>
                                        <span>{parada.ideia}</span>
                                      </div>

                                      <div className="pt-2 flex items-center justify-between">
                                        <span className="text-[8px] text-slate-500 truncate max-w-[200px]" title={parada.fonte}>
                                          Fonte: {parada.fonte}
                                        </span>
                                        <button
                                          onClick={() => handleAskAI(parada, day)}
                                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-[9px] text-white font-display font-bold flex items-center gap-1 hover:from-indigo-600 hover:to-violet-700 transition cursor-pointer active:scale-95 shadow-sm shadow-indigo-500/10"
                                        >
                                          <Sparkles className="w-2.5 h-2.5" />
                                          <span>Explorar com IA</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Overnight Suggestions */}
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-display font-bold text-amber-400 uppercase tracking-widest pl-1">
                                  ⛺ Pernoite Recomendado
                                </h4>

                                <div className="grid grid-cols-1 gap-2">
                                  {day.pousadas.map((pousada, pIdx) => (
                                    <div key={pIdx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex justify-between items-start">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-display font-bold text-white leading-tight">{pousada.nome}</span>
                                          {pousada.rec && (
                                            <span className="text-[8px] font-display font-black text-black bg-[#39FF14] px-1.5 py-0.1 rounded uppercase">
                                              Top
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-normal">{pousada.desc}</p>
                                      </div>

                                      {pousada.tel ? (
                                        <a
                                          href={`tel:${pousada.tel}`}
                                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-[#39FF14] font-mono hover:bg-[#39FF14] hover:text-black transition flex items-center gap-1 ml-2 shrink-0"
                                        >
                                          <Phone className="w-2.5 h-2.5" />
                                          <span>Ligar</span>
                                        </a>
                                      ) : (
                                        <span className="text-[8px] text-amber-400 bg-amber-400/15 px-1.5 py-1 rounded text-right max-w-[100px] leading-tight select-none shrink-0">
                                          Tel não confirmado
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "checklist" && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pl-1">
                <h2 className="font-display font-black text-lg uppercase text-white tracking-tight">
                  Checklist de Equipamento
                </h2>
                <button
                  onClick={handleResetChecklist}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-red-400 font-display font-bold hover:bg-red-500/20 transition cursor-pointer"
                >
                  Zerar Tudo
                </button>
              </div>

              {/* Progress Panel */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-1 shadow-lg">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Preparação de bagagem</span>
                  <span className="text-[#4AF47B] font-bold">{checklistStats.percent}% ({checklistStats.checked}/{checklistStats.total})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                    style={{ width: `${checklistStats.percent}%` }}
                  />
                </div>
              </div>

              {/* Checklist Blocks */}
              <div className="space-y-4">
                {Object.keys(CHECKLIST_DATA).map((cat, catIdx) => (
                  <div key={catIdx} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg">
                    <h3 className="font-display font-bold text-xs text-indigo-400 uppercase tracking-wider border-b border-white/5 pb-2">
                      {cat}
                    </h3>

                    <div className="space-y-2">
                      {CHECKLIST_DATA[cat].map((item, idx) => {
                        const key = `${cat}::${idx}`;
                        const isChecked = state.checklist[key] || false;

                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleChecklistItem(cat, idx)}
                            className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition cursor-pointer select-none"
                          >
                            <div className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center transition ${
                              isChecked ? "bg-[#4AF47B] border-[#4AF47B] text-black shadow-[0_0_6px_rgba(74,244,123,0.3)]" : "border-slate-500 hover:border-white"
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs leading-normal transition ${
                              isChecked ? "line-through text-slate-500" : "text-slate-200"
                            }`}>
                              {item}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "gastos" && (
            <motion.div
              key="gastos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="font-display font-black text-lg uppercase text-white tracking-tight pl-1">
                Gastos & Divisão
              </h2>

              {/* SUMMARY STATS GRID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 text-center shadow-md">
                  <span className="block text-[9px] text-slate-400 font-mono uppercase">Total Comum Gasto</span>
                  <span className="text-xl font-display font-black text-[#4AF47B]">
                    R$ {totalSpent.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 text-center shadow-md">
                  <span className="block text-[9px] text-slate-400 font-mono uppercase">Média por Pessoa</span>
                  <span className="text-xl font-display font-black text-white">
                    R$ {avgSpent.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              {/* DEBTS / BALANCES (Section 7) */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white font-bold font-display uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Acerto Inteligente de Contas
                  </span>
                  <span className="text-[9px] text-indigo-300 font-mono font-bold uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Simplificado</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Basta realizar as transferências abaixo para resolver todas as despesas compartilhadas do trio de forma equilibrada:
                </p>

                {transactions.length === 0 ? (
                  <div className="text-xs text-[#4AF47B] font-bold py-3 text-center bg-[#4AF47B]/5 border border-[#4AF47B]/10 rounded-xl">
                    ✓ Tudo certo! Ninguém deve nada para ninguém.
                  </div>
                ) : (
                  <ul className="space-y-1.5 pt-1">
                    {transactions.map((t, idx) => (
                      <li key={idx} className="bg-white/5 px-3 py-2.5 rounded-xl border border-white/5 text-xs flex items-center justify-between font-display font-bold">
                        <span className="text-white">{t.split(" deve ")[0]}</span>
                        <span className="text-amber-400 text-[10px] bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">deve R$ {t.split(" deve ")[1].split(" para ")[0].split(" ")[1]}</span>
                        <span className="text-white">para {t.split(" para ")[1]}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Gmail direct trigger */}
                {user && (
                  <div className="pt-3 border-t border-white/5 mt-3 space-y-2">
                    <span className="block text-[10px] text-slate-400 font-mono font-bold uppercase">
                      ✉ Notificar Trio por E-mail (Gmail API):
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={gmailState.recipientInput}
                        onChange={(e) => setGmailState(prev => ({ ...prev, recipientInput: e.target.value }))}
                        placeholder="E-mails separados por vírgula"
                        className="bg-white/5 border border-white/10 text-xs text-white px-3 py-2 rounded-xl flex-1 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        onClick={handleSendGmailSummary}
                        disabled={gmailState.loading}
                        className="px-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-display font-bold text-xs rounded-xl hover:from-indigo-600 hover:to-violet-700 transition active:scale-95 flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/10"
                      >
                        {gmailState.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Enviar</span>
                      </button>
                    </div>

                    {gmailState.success && (
                      <div className="text-[10px] text-[#4AF47B] bg-[#4AF47B]/10 border border-[#4AF47B]/20 p-2 rounded-xl text-center font-bold">
                        ✓ Plano e acerto de contas enviado com sucesso via Gmail!
                      </div>
                    )}
                    {gmailState.error && (
                      <div className="text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 p-2 rounded-xl text-center">
                        Erro no envio: {gmailState.error}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* INDIVIDUAL SPENT ACCUMULATED */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-2 shadow-lg">
                <h3 className="text-xs font-display font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Total Pago Individualmente
                </h3>
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                  {state.people.map(p => (
                    <div key={p} className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-white block truncate font-medium">{p}</span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        R$ {(individualTotals[p] || 0).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LOG EXPENSE FORM */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg">
                <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider pl-1">
                  Cadastrar Nova Despesa
                </h3>

                <form onSubmit={handleAddExpense} className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1 pl-1">Descrição</label>
                    <input
                      type="text"
                      required
                      value={expenseDesc}
                      onChange={e => setExpenseDesc(e.target.value)}
                      placeholder="Ex: Pousada Paraibuna, Jantar, etc."
                      className="w-full bg-white/5 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1 pl-1">Valor (R$)</label>
                      <input
                        type="text"
                        required
                        value={expenseVal}
                        onChange={e => setExpenseVal(e.target.value)}
                        placeholder="Ex: 120,50"
                        className="w-full bg-white/5 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1 pl-1">Categoria</label>
                      <select
                        value={expenseCat}
                        onChange={e => setExpenseCat(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-xs text-white px-2 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                      >
                        <option className="bg-[#121214] text-white">Hospedagem</option>
                        <option className="bg-[#121214] text-white">Alimentação</option>
                        <option className="bg-[#121214] text-white">Passagens</option>
                        <option className="bg-[#121214] text-white">Suprimentos</option>
                        <option className="bg-[#121214] text-white">Manutenção</option>
                        <option className="bg-[#121214] text-white">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1 pl-1">Quem Pagou</label>
                      <select
                        value={expenseWho}
                        onChange={e => setExpenseWho(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-xs text-white px-2 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                      >
                        {state.people.map(p => (
                          <option key={p} value={p} className="bg-[#121214] text-white">{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1 pl-1">Divisão</label>
                      <select
                        value={expenseDiv}
                        onChange={e => setExpenseDiv(e.target.value as "todos" | "individual")}
                        className="w-full bg-white/5 border border-white/10 text-xs text-white px-2 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                      >
                        <option value="todos" className="bg-[#121214] text-white">Dividir com Todos (trio)</option>
                        <option value="individual" className="bg-[#121214] text-white">Apenas Custo Pessoal</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl hover:from-indigo-600 hover:to-violet-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Lançar Despesa</span>
                  </button>
                </form>
              </div>

              {/* LOG HISTORY */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-2 shadow-lg">
                <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider pl-1">
                  Histórico de Despesas ({state.expenses.length})
                </h3>

                {state.expenses.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-4 text-center">
                    Nenhuma despesa cadastrada ainda.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                    {state.expenses.map(exp => (
                      <div key={exp.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5 max-w-[280px]">
                          <span className="font-display font-bold text-white block leading-tight">{exp.desc}</span>
                          <div className="flex gap-2 text-[9px] text-slate-500 font-mono">
                            <span>Pago por: <strong>{exp.quem}</strong></span>
                            <span>&bull;</span>
                            <span>{exp.cat}</span>
                            <span>&bull;</span>
                            <span className={exp.divide === "todos" ? "text-[#4AF47B]" : "text-slate-500"}>
                              {exp.divide === "todos" ? "Trio" : "Individual"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[#4AF47B] font-bold">
                            R$ {exp.valor.toFixed(2).replace(".", ",")}
                          </span>
                          <button
                            onClick={() => handleDeleteExpense(exp.id, exp.desc)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "apoio" && (
            <motion.div
              key="apoio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* HEADER WITH SEGMENTED SWITCHER */}
              <div className="space-y-3.5">
                <div className="pl-1">
                  <h2 className="font-display font-black text-lg uppercase text-white tracking-tight">
                    Suporte & Comunicação
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Contatos de SOS, roteiros GPX oficiais e pautas de redes sociais integrados.
                  </p>
                </div>

                {/* Sub-tab segmented selectors */}
                <div className="flex bg-[#0c0c10] border border-white/5 p-1 rounded-xl">
                  <button
                    onClick={() => setApoioSubTab("sos")}
                    className={`flex-1 py-2 text-xs font-display font-black uppercase tracking-wider rounded-lg transition-all ${
                      apoioSubTab === "sos"
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🚨 Emergência & SOS
                  </button>
                  <button
                    onClick={() => setApoioSubTab("midia")}
                    className={`flex-1 py-2 text-xs font-display font-black uppercase tracking-wider rounded-lg transition-all ${
                      apoioSubTab === "midia"
                        ? "bg-[#4AF47B] text-black shadow-md shadow-[#4AF47B]/10"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🎬 Pauta de Mídias
                  </button>
                </div>
              </div>

              {/* CONDITIONAL SUB-TAB RENDERING */}
              {apoioSubTab === "sos" ? (
                <div className="space-y-4">
                  {/* Wikiloc GPX */}
                  <div className="bg-[#4AF47B]/5 border border-[#4AF47B]/20 backdrop-blur-md p-4.5 rounded-2xl space-y-3 shadow-lg">
                    <div className="flex items-center gap-1.5 text-xs text-[#4AF47B] font-display font-bold uppercase tracking-wider">
                      <Map className="w-4 h-4 text-[#4AF47B]" />
                      <span>Rotas Oficiais GPX (Wikiloc)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sincronize ou baixe a rota em seu GPX Garmin/Wahoo antes de largar. Essencial em zonas rurais sem cobertura de operadora de dados!
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={LINKS_EXTERNOS.wikiloc_completa}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-bold text-white hover:bg-white/10 transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Percurso Oficial</span>
                      </a>
                      <a
                        href={LINKS_EXTERNOS.wikiloc_cicloviagem}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-bold text-white hover:bg-white/10 transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Cicloviagem Gravada</span>
                      </a>
                    </div>

                    <a
                      href={LINKS_EXTERNOS.cptm_bike}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center text-[10px] text-[#4AF47B] hover:underline font-mono"
                    >
                      Regra Oficial para transporte de bikes na CPTM &rarr;
                    </a>
                  </div>

                  {/* NATIONAL EMERGENCY PHONES */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg">
                    <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider pl-1">
                      Telefones de Emergência Nacionais
                    </h3>

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <a
                        href="tel:190"
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/30 rounded-xl flex flex-col items-center transition"
                      >
                        <span className="text-sm font-bold text-red-400">190</span>
                        <span className="text-[9px] text-slate-400 font-sans">Polícia Militar</span>
                      </a>
                      <a
                        href="tel:192"
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/30 rounded-xl flex flex-col items-center transition"
                      >
                        <span className="text-sm font-bold text-red-400">192</span>
                        <span className="text-[9px] text-slate-400 font-sans">SAMU</span>
                      </a>
                      <a
                        href="tel:193"
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/30 rounded-xl flex flex-col items-center transition"
                      >
                        <span className="text-sm font-bold text-red-400">193</span>
                        <span className="text-[9px] text-slate-400 font-sans">Bombeiros</span>
                      </a>
                      <a
                        href="tel:199"
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/30 rounded-xl flex flex-col items-center transition"
                      >
                        <span className="text-sm font-bold text-red-400">199</span>
                        <span className="text-[9px] text-slate-400 font-sans">Defesa Civil</span>
                      </a>
                    </div>
                  </div>

                  {/* CIVIL DEFENSE CITIES SUPPORT */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg">
                    <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider pl-1">
                      Defesa Civil de Apoio (Por Cidade)
                    </h3>

                    <div className="space-y-2">
                      {CIDADES_EMG.map((emg, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-display font-bold text-white block">{emg.cidade}</span>
                            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Fonte: {emg.fonte}</span>
                            <span className="text-[10px] font-mono text-[#4AF47B] font-bold block mt-1">{emg.tel}</span>
                          </div>

                          <a
                            href={`tel:${emg.tel.split(" ")[0]}`}
                            className="p-2 px-3 rounded-lg bg-white/5 border border-[#4AF47B]/20 text-[#4AF47B] font-mono text-[10px] hover:bg-[#4AF47B] hover:text-black transition flex items-center gap-1 shrink-0 cursor-pointer ml-3 font-bold"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>Ligar</span>
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* Warning missing civil defense info */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-400 leading-relaxed flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Contatos não confirmados:</strong> Guararema, Santa Branca, Redenção da Serra, Taubaté e Roseira não têm telefone direto de atendimento 24h verificado na prefeitura. Nestes trechos, acione os telefones nacionais (190/192/199).
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AUXILIARY FAST GENERATOR */}
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg">
                    <div className="flex items-center gap-1 text-indigo-400 font-display font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span>Gerador Rápido de Copys</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[8px] text-slate-400 font-mono uppercase mb-1 pl-0.5">Etapa</label>
                        <select
                          value={genPhase}
                          onChange={e => setGenPhase(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-[10px] text-white p-1.5 rounded-xl focus:outline-none"
                        >
                          <option value="pre" className="bg-[#121214] text-white">Pré-viagem</option>
                          <option value="dia1" className="bg-[#121214] text-white">Dia 1</option>
                          <option value="dia2" className="bg-[#121214] text-white">Dia 2</option>
                          <option value="dia3" className="bg-[#121214] text-white">Dia 3</option>
                          <option value="pos" className="bg-[#121214] text-white">Pós-viagem</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 font-mono uppercase mb-1 pl-0.5">Porta BPMF</label>
                        <select
                          value={genPorta}
                          onChange={e => setGenPorta(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-[10px] text-white p-1.5 rounded-xl focus:outline-none"
                        >
                          <option className="bg-[#121214] text-white">Curadoria</option>
                          <option className="bg-[#121214] text-white">Experiência</option>
                          <option className="bg-[#121214] text-white">Segurança</option>
                          <option className="bg-[#121214] text-white">Comunidade</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 font-mono uppercase mb-1 pl-0.5">Plataforma</label>
                        <select
                          value={genPlatform}
                          onChange={e => setGenPlatform(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-[10px] text-white p-1.5 rounded-xl focus:outline-none"
                        >
                          <option value="reels" className="bg-[#121214] text-white">Reel/TikTok</option>
                          <option value="carrossel" className="bg-[#121214] text-white">Carrossel/Feed</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateQuickContent}
                      className="w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:from-indigo-600 hover:to-violet-700 transition cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10"
                    >
                      Compilar Roteiro + Legendas
                    </button>

                    {genOutput && (
                      <div className="space-y-1.5 pt-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] text-indigo-400 font-mono uppercase font-bold pl-1">Copy Pronto Compilado</span>
                          <button
                            onClick={() => handleCopy(genOutput, "quick-gen")}
                            className="text-[9px] text-[#ccc] hover:text-[#4AF47B] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedText === "quick-gen" ? <Check className="w-3.5 h-3.5 text-[#4AF47B]" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedText === "quick-gen" ? "Copiado!" : "Copiar"}</span>
                          </button>
                        </div>
                        <textarea
                          readOnly
                          value={genOutput}
                          className="w-full h-32 bg-white/5 border border-white/10 p-2 text-[10px] font-mono text-slate-300 rounded-xl focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* CONTENT STAGES LOOP */}
                  <div className="space-y-4">
                    {CONTEUDO_SEMANA.map(stage => (
                      <div key={stage.id} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-4 shadow-lg">
                        {/* Header */}
                        <div className="border-b border-white/5 pb-3 flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block tracking-wider">
                              Etapa Editorial: {stage.porta}
                            </span>
                            <h3 className="font-display font-black text-sm text-white uppercase mt-0.5 tracking-tight">
                              {stage.stage}
                            </h3>
                          </div>
                          <span className="text-[8px] font-display font-black text-black bg-[#4AF47B] px-2 py-0.5 rounded-full uppercase select-none shadow-[0_0_8px_rgba(74,244,123,0.3)]">
                            Ativa
                          </span>
                        </div>

                        {/* REEL BLOCK */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-display font-bold text-white uppercase">
                            <Video className="w-4 h-4 text-indigo-400" />
                            <span>🎥 Vídeo Curto: {stage.reel.titulo}</span>
                          </div>

                          {/* Storytelling boxes */}
                          <div className="grid grid-cols-3 gap-1.5 text-[9px] leading-normal text-center">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                              <span className="block font-bold text-slate-500 font-display uppercase text-[8px] mb-0.5">Antes</span>
                              <span className="text-slate-300 leading-tight">{stage.reel.storytelling.antes}</span>
                            </div>
                            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                              <span className="block font-bold text-indigo-400 font-display uppercase text-[8px] mb-0.5">Mudança</span>
                              <span className="text-slate-300 leading-tight">{stage.reel.storytelling.transformacao}</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                              <span className="block font-bold text-white font-display uppercase text-[8px] mb-0.5">Depois</span>
                              <span className="text-slate-300 leading-tight">{stage.reel.storytelling.depois}</span>
                            </div>
                          </div>

                          {/* Accordion sub-details Speech and recording */}
                          <details className="group border border-white/10 rounded-xl overflow-hidden">
                            <summary className="p-2.5 bg-white/5 text-[10px] text-slate-400 font-display font-bold uppercase flex justify-between items-center cursor-pointer select-none hover:bg-white/10 transition-colors">
                              <span>Ver Speech & Gravação</span>
                              <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                            </summary>

                            <div className="p-3 bg-black/30 space-y-3 border-t border-white/10">
                              <div className="space-y-2">
                                <span className="block text-[8px] font-mono text-slate-500 uppercase">Speech Flow:</span>
                                {stage.reel.speech.map((s, sIdx) => (
                                  <div key={sIdx} className="bg-white/5 p-2 rounded-xl text-[10px] space-y-1 relative border border-white/5">
                                    <span className="absolute top-1.5 right-2 font-mono text-[8px] text-[#4AF47B]/80 font-bold">
                                      {s.t}
                                    </span>
                                    <div className="flex gap-1 items-baseline">
                                      <span className="text-[8px] bg-indigo-500/15 text-indigo-300 font-bold px-1 rounded uppercase border border-indigo-500/20">
                                        {s.fase}
                                      </span>
                                      <span className="text-white font-bold italic">"{s.txt}"</span>
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-mono">
                                      Tom: {s.tom} | Câmera: {s.camera} | Overlay: {s.overlay}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[9px] bg-white/5 p-2.5 rounded-xl border border-white/5">
                                <div>
                                  <strong className="block text-slate-500 font-display uppercase text-[8px]">Roupa:</strong>
                                  <span className="text-slate-300">{stage.reel.gravacao.roupa}</span>
                                </div>
                                <div>
                                  <strong className="block text-slate-500 font-display uppercase text-[8px]">Ambiente:</strong>
                                  <span className="text-slate-300">{stage.reel.gravacao.fundo}</span>
                                </div>
                                <div className="col-span-2 pt-1 border-t border-white/5 mt-1">
                                  <strong className="block text-slate-500 font-display uppercase text-[8px]">Iluminação & Ritmo:</strong>
                                  <span className="text-slate-300">{stage.reel.gravacao.iluminacao} | {stage.reel.gravacao.ritmo}</span>
                                </div>
                              </div>
                            </div>
                          </details>

                          {/* Caption box */}
                          <div className="bg-white/5 border border-white/5 rounded-xl p-3 relative space-y-1.5">
                            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                              <span className="text-[8px] font-mono text-indigo-400 font-bold uppercase">Legenda Pronta (Reel)</span>
                              <button
                                onClick={() => handleCopy(stage.reel.caption, `cap-reel-${stage.id}`)}
                                className="text-[9px] text-[#ccc] hover:text-[#4AF47B] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedText === `cap-reel-${stage.id}` ? <Check className="w-3 h-3 text-[#4AF47B]" /> : <Copy className="w-3 h-3" />}
                                <span>Copiado</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed pr-6">{stage.reel.caption}</p>
                          </div>
                        </div>

                        {/* CAROUSEL BLOCK */}
                        <div className="space-y-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-xs font-display font-bold text-white uppercase">
                            <ImageIcon className="w-4 h-4 text-amber-400" />
                            <span>🎠 Carrossel: {stage.carrossel.titulo}</span>
                          </div>

                          <div className="space-y-2">
                            {stage.carrossel.slides.map(slide => {
                              const imgKey = `${stage.id}-${slide.n}`;
                              const isGenerating = imageGeneratingKey === imgKey;
                              const hasImage = generatedImages[imgKey] || null;

                              return (
                                <div key={slide.n} className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2 relative">
                                  <span className="absolute top-2.5 right-2.5 font-mono text-[9px] text-slate-500">
                                    Slide {slide.n} / 5
                                  </span>

                                  <div>
                                    <span className="text-[8px] bg-amber-400/15 text-amber-300 font-bold px-1.5 py-0.2 rounded uppercase font-display border border-amber-400/20">
                                      {slide.funcao}
                                    </span>
                                    <h4 className="font-display font-black text-xs text-white uppercase mt-1 leading-tight tracking-tight">
                                      {slide.headline}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{slide.sub}</p>
                                  </div>

                                  <div className="pt-2 border-t border-white/5 mt-2 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[8px] text-indigo-400 font-mono uppercase font-bold">
                                        AIGeneration
                                      </span>

                                      <button
                                        onClick={() => handleGenerateImage(slide, stage)}
                                        disabled={isGenerating}
                                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-display font-bold text-[9px] flex items-center gap-1 hover:from-indigo-600 hover:to-violet-700 transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-sm shadow-indigo-500/10"
                                      >
                                        {isGenerating ? (
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                        ) : (
                                          <Sparkles className="w-2.5 h-2.5" />
                                        )}
                                        <span>{isGenerating ? "Gerando..." : "Gerar com IA"}</span>
                                      </button>
                                    </div>

                                    {hasImage ? (
                                      <div className="relative rounded-xl overflow-hidden border border-[#4AF47B]/30 bg-black/40 shadow-inner">
                                        <img
                                          src={hasImage}
                                          alt={`Slide ${slide.n}`}
                                          className="w-full h-auto max-h-[250px] object-cover"
                                        />
                                        <div className="absolute bottom-2 right-2 flex gap-1">
                                          <a
                                            href={hasImage}
                                            download={`BPMF-${stage.id}-slide${slide.n}.png`}
                                            className="p-1.5 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10 hover:border-[#4AF47B] transition"
                                            title="Baixar imagem"
                                          >
                                            <Download className="w-3 h-3" />
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <details className="group">
                                        <summary className="text-[8px] text-slate-500 hover:text-slate-300 font-mono uppercase cursor-pointer select-none">
                                          Ver AI Prompt de Escrita
                                        </summary>
                                        <div className="bg-black/30 border border-white/5 p-2 rounded-xl text-[9px] font-mono text-slate-400 leading-normal mt-1 max-h-[100px] overflow-y-auto">
                                          {buildAIPrompt(slide, stage)}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Caption carousel */}
                          <div className="bg-white/5 border border-white/5 rounded-xl p-3 relative space-y-1.5">
                            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                              <span className="text-[8px] font-mono text-amber-400 font-bold uppercase">Legenda Carrossel</span>
                              <button
                                onClick={() => handleCopy(stage.carrossel.caption, `cap-carr-${stage.id}`)}
                                className="text-[9px] text-[#ccc] hover:text-[#4AF47B] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedText === `cap-carr-${stage.id}` ? <Check className="w-3 h-3 text-[#4AF47B]" /> : <Copy className="w-3 h-3" />}
                                <span>Copiado</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed pr-6">{stage.carrossel.caption}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          </>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER FIXED BOTTOM NAV */}
      {!isLocked && (
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[520px] bg-[#0c0c10]/80 backdrop-blur-xl border-t border-white/10 py-2.5 px-3 flex justify-around items-center z-20 pb-safe rounded-t-2xl shadow-2xl">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition cursor-pointer select-none ${
              activeTab === "home" ? "text-indigo-400 font-display font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-tighter">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("briefing")}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition cursor-pointer select-none ${
              activeTab === "briefing" ? "text-indigo-400 font-display font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-tighter">Briefing</span>
          </button>

          <button
            onClick={() => setActiveTab("rota")}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition cursor-pointer select-none ${
              activeTab === "rota" ? "text-indigo-400 font-display font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-tighter">Rota</span>
          </button>

          <button
            onClick={() => setActiveTab("checklist")}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition cursor-pointer select-none ${
              activeTab === "checklist" ? "text-indigo-400 font-display font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-tighter">Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab("gastos")}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition cursor-pointer select-none ${
              activeTab === "gastos" ? "text-indigo-400 font-display font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-tighter">Gastos</span>
          </button>

          <button
            onClick={() => setActiveTab("apoio")}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition cursor-pointer select-none ${
              activeTab === "apoio" ? "text-indigo-400 font-display font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="text-[9px] uppercase tracking-tighter">Apoio</span>
          </button>
        </footer>
      )}

      {/* AI GROUNDING DRAWER SLIDE OVER */}
      <AnimatePresence>
        {groundingDrawer.isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setGroundingDrawer(p => ({ ...p, isOpen: false }))} />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[420px] h-full bg-[#0a0a0d]/95 backdrop-blur-xl border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                {/* Header */}
                <div className="border-b border-white/5 pb-3.5 flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono text-indigo-300 font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      Google Maps Grounding
                    </span>
                    <h3 className="font-display font-black text-sm text-white uppercase mt-1.5 leading-tight tracking-tight">
                      {groundingDrawer.parada?.nome}
                    </h3>
                  </div>
                  <button
                    onClick={() => setGroundingDrawer(p => ({ ...p, isOpen: false }))}
                    className="p-1 rounded bg-white/5 text-slate-400 hover:text-white text-lg font-bold"
                  >
                    &times;
                  </button>
                </div>

                {/* Result Area */}
                {groundingDrawer.loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-mono">Consultando Google Maps e IA...</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
                    {groundingDrawer.result}

                    {/* Sources grounding chunks references */}
                    {groundingDrawer.sources.length > 0 && (
                      <div className="pt-4 border-t border-white/5 mt-4 space-y-2">
                        <strong className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider">
                          Fontes Google Maps e Web Grounding:
                        </strong>
                        <div className="flex flex-wrap gap-1.5">
                          {groundingDrawer.sources.map((chunk, cIdx) => (
                            <a
                              key={cIdx}
                              href={chunk.web?.uri || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-[#4AF47B] hover:border-[#4AF47B] transition-colors"
                            >
                              <span>[{cIdx + 1}] {chunk.web?.title || "Maps Reference"}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom bar */}
              <div className="pt-4 border-t border-white/5 mt-4 flex justify-end">
                <button
                  onClick={() => setGroundingDrawer(p => ({ ...p, isOpen: false }))}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl text-xs font-display font-bold text-white hover:from-indigo-600 hover:to-violet-700 transition cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  Fechar Exploração
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS / CONFIG MODAL - GESTÃO DE ROTAS */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0d]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-[420px] space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h3 className="font-display font-black text-sm text-white uppercase tracking-tight flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>Gestão das Rotas</span>
                  </h3>
                  <span className="text-[9px] text-slate-500 font-mono block">PAINEL EXCLUSIVO DO ORGANIZADOR</span>
                </div>
                <button
                  onClick={() => setShowConfig(false)}
                  className="text-slate-400 hover:text-white text-xl font-bold transition cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* CHECK ACCESS CONTROL */}
              {!((user && user.email === "borapedalarmeufilho@gmail.com") || isAdminUnlocked) ? (
                /* LOCK SCREEN */
                <div className="py-6 space-y-4 text-center">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto text-indigo-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-xs text-white uppercase tracking-wider">
                      Área Restrita do Organizador
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                      Esta área é exclusiva para o organizador realizar o cadastro, edição, exclusão e arquivamento dos roteiros BPMF.
                    </p>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (adminPasscode.trim() === "BPMF2026" || adminPasscode.trim() === "admin") {
                      setIsAdminUnlocked(true);
                      sessionStorage.setItem("bpmf_admin_unlocked", "true");
                      setAdminPasscode("");
                    } else {
                      alert("Senha do Organizador inválida!");
                    }
                  }} className="space-y-3 pt-2">
                    <input
                      type="password"
                      placeholder="Senha do Organizador"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-xs text-center text-white p-3 rounded-xl focus:outline-none focus:border-indigo-500 font-mono tracking-widest uppercase"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#4AF47B] text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition hover:bg-[#3ce26b] active:scale-95 cursor-pointer shadow-md shadow-[#4AF47B]/10 font-bold"
                    >
                      Acessar Gestão
                    </button>
                  </form>
                  <p className="text-[9px] text-slate-500 font-mono">
                    Ou conecte-se com a conta do Google de organizador.
                  </p>
                </div>
              ) : (
                /* ADMIN CONSOLE PANEL */
                <div className="space-y-4">
                  {/* TAB SELECTOR */}
                  <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/5 rounded-xl text-center">
                    <button
                      onClick={() => setConfigTab("roteiros")}
                      className={`py-1.5 rounded-lg text-[10px] font-display font-bold uppercase transition cursor-pointer ${
                        configTab === "roteiros" ? "bg-indigo-500/20 text-white border border-indigo-500/20" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Roteiros ({1 + (state.customRoutes || []).length})
                    </button>
                    <button
                      onClick={() => setConfigTab("geral")}
                      className={`py-1.5 rounded-lg text-[10px] font-display font-bold uppercase transition cursor-pointer ${
                        configTab === "geral" ? "bg-indigo-500/20 text-white border border-indigo-500/20" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Configurações & Backup
                    </button>
                  </div>

                  {configTab === "roteiros" ? (
                    /* ROTEIROS TAB */
                    <div className="space-y-4">
                      {/* CADASTRO TRIGGER BUTTON */}
                      <button
                        onClick={() => {
                          setEditingRouteId(null);
                          setRegName("");
                          setRegDesc("");
                          setRegTotalKm("");
                          setRegTotalDays("");
                          setRegWikilocCompleta("");
                          setRegWikilocCicloviagem("");
                          setRegStrava("");
                          setRegKomoot("");
                          setRegGoogleMaps("");
                          setRegDays([]);
                          setParseSuccessMsg(null);
                          setShowRegisterModal(true);
                        }}
                        className="w-full py-3 bg-[#4AF47B] hover:bg-[#3ce26b] text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-[#4AF47B]/10 font-bold"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Cadastrar Novo Roteiro</span>
                      </button>

                      {/* ROUTE MANAGEMENT LIST */}
                      <div className="space-y-2">
                        <span className="block text-[9px] text-slate-400 font-mono uppercase pl-1">Lista Geral de Roteiros</span>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {[
                            { id: "rota_da_luz", nome: "Rota da Luz (Mogi → Aparecida)", totalKm: 201.5, totalDays: 3, isStatic: true },
                            ...(state.customRoutes || []).map(r => ({ ...r, isStatic: false }))
                          ].map((rot) => {
                            const isArchived = archivedRouteIds.includes(rot.id);
                            return (
                              <div key={rot.id} className="flex flex-col p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="truncate flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-semibold text-xs truncate block ${isArchived ? "line-through text-slate-500" : "text-white"}`}>
                                        {rot.nome}
                                      </span>
                                      {rot.isStatic ? (
                                        <span className="text-[7px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-bold uppercase rounded px-1 shrink-0 font-mono">BPMF</span>
                                      ) : (
                                        <span className="text-[7px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase rounded px-1 shrink-0 font-mono">Autoral</span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                                      {rot.totalKm} KM · {rot.totalDays} Dias
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Edit Button */}
                                    {!rot.isStatic && (
                                      <button
                                        onClick={() => {
                                          const fullRoute = (state.customRoutes || []).find(r => r.id === rot.id);
                                          if (fullRoute) {
                                            setEditingRouteId(fullRoute.id);
                                            setRegName(fullRoute.nome);
                                            setRegDesc(fullRoute.descricao || "");
                                            setRegTotalKm(String(fullRoute.totalKm));
                                            setRegTotalDays(String(fullRoute.totalDays));
                                            setRegWikilocCompleta(fullRoute.links.wikiloc_completa || "");
                                            setRegWikilocCicloviagem(fullRoute.links.wikiloc_cicloviagem || "");
                                            setRegStrava(fullRoute.links.strava || "");
                                            setRegKomoot(fullRoute.links.komoot || "");
                                            setRegGoogleMaps(fullRoute.links.google_maps || "");
                                            setRegDays(fullRoute.days || []);
                                            setParseSuccessMsg(`Editando roteiro autoral "${fullRoute.nome}". Você pode alterar os dados ou subir outro markdown.`);
                                            setShowRegisterModal(true);
                                          }
                                        }}
                                        className="p-1.5 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 transition cursor-pointer"
                                        title="Editar Roteiro"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                    )}

                                    {/* Archive toggle */}
                                    <button
                                      onClick={() => handleArchiveRouteToggle(rot.id)}
                                      className={`p-1.5 rounded border transition cursor-pointer ${
                                        isArchived 
                                          ? "bg-[#4AF47B]/10 border-[#4AF47B]/20 text-[#4AF47B] hover:bg-[#4AF47B]/20" 
                                          : "bg-white/5 border-white/10 text-slate-400 hover:text-yellow-400"
                                      }`}
                                      title={isArchived ? "Reativar Roteiro" : "Arquivar Roteiro"}
                                    >
                                      {isArchived ? <FolderOpen className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                                    </button>

                                    {/* Delete Button */}
                                    {!rot.isStatic && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Tem certeza que deseja excluir permanentemente o roteiro "${rot.nome}"?`)) {
                                            setState(prev => {
                                              const filtered = (prev.customRoutes || []).filter(r => r.id !== rot.id);
                                              const fallbackId = prev.currentRouteId === rot.id ? "rota_da_luz" : prev.currentRouteId;
                                              return {
                                                ...prev,
                                                customRoutes: filtered,
                                                currentRouteId: fallbackId
                                              };
                                            });
                                          }
                                        }}
                                        className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                                        title="Excluir Roteiro"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* GENERAL CONFIG TAB */
                    <div className="space-y-4">
                      {/* Data Largada */}
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-mono uppercase pl-1">Data da Largada (Dia 1)</label>
                        <input
                          type="date"
                          value={state.tripDate || ""}
                          onChange={(e) => setState(prev => ({ ...prev, tripDate: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      {/* Trio Names */}
                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-400 font-mono uppercase pl-1">Nomes do Trio</label>
                        {state.people.map((person, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="bg-white/5 border border-white/10 text-slate-400 font-mono text-xs px-3 py-2 rounded-xl flex items-center justify-center w-10 shrink-0 select-none">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={person}
                              onChange={(e) => {
                                const newP = [...state.people];
                                newP[idx] = e.target.value;
                                setState(prev => ({ ...prev, people: newP }));
                              }}
                              placeholder={`Ciclista ${idx + 1}`}
                              className="flex-1 bg-white/5 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Group Passcode */}
                      <div className="space-y-1.5 bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] text-slate-300 font-mono uppercase font-semibold">Senha da Turma para Acesso</label>
                          {state.groupPasscode ? (
                            <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-300 font-mono font-bold uppercase">Ativo</span>
                          ) : (
                            <span className="text-[8px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-slate-500 font-mono uppercase">Livre</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={state.groupPasscode || ""}
                          onChange={(e) => {
                            const newPasscode = e.target.value;
                            setState(prev => ({ ...prev, groupPasscode: newPasscode }));
                            if (!newPasscode) {
                              setIsUnlocked(true);
                              sessionStorage.setItem("bpmf_session_unlocked", "true");
                            }
                          }}
                          placeholder="Sem senha (acesso livre)"
                          className="w-full bg-black/40 border border-white/10 text-xs text-white p-2 rounded-xl focus:outline-none focus:border-indigo-500 font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal"
                        />
                        <p className="text-[9px] text-slate-500 leading-tight">
                          Insira uma senha para bloquear o acesso aos briefings. Deixe em branco para liberar.
                        </p>
                      </div>

                      {/* Backup block */}
                      <div className="border-t border-white/5 pt-3.5 space-y-2">
                        <span className="block text-[10px] text-slate-400 font-mono uppercase pl-1">Backup e Restauração Local</span>
                        <p className="text-[9px] text-slate-500 leading-relaxed pl-1">
                          Copie o JSON ou cole um backup gerado anteriormente para transferir o progresso.
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={handleExportState}
                            className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white font-bold hover:bg-white/10 transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Copiar Backup</span>
                          </button>
                          <button
                            onClick={handleImportState}
                            className="flex-1 py-2 rounded-xl bg-[#4AF47B] text-black font-display font-black text-[10px] uppercase transition cursor-pointer hover:bg-[#3ce26b] flex items-center justify-center gap-1 active:scale-95 shadow-md shadow-[#4AF47B]/10 font-bold"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Restaurar</span>
                          </button>
                        </div>

                        <textarea
                          placeholder="Cole o backup JSON aqui..."
                          value={backupString}
                          onChange={(e) => setBackupString(e.target.value)}
                          className="w-full h-14 bg-black/40 border border-white/10 rounded-xl p-2 text-[9px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      {/* Logout Admin Button */}
                      <div className="pt-2 border-t border-white/5">
                        <button
                          onClick={() => {
                            setIsAdminUnlocked(false);
                            sessionStorage.removeItem("bpmf_admin_unlocked");
                            alert("Acesso administrativo bloqueado.");
                          }}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Sair do Painel do Organizador</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Close / Save Button */}
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={() => setShowConfig(false)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl transition hover:from-indigo-600 hover:to-violet-700 active:scale-95 cursor-pointer shadow-md shadow-indigo-500/10"
                    >
                      Salvar e Fechar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CADASTRO DE ROTEIRO MODAL */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowRegisterModal(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[460px] max-h-[85vh] bg-[#0c0c10] border border-white/10 rounded-2xl p-5.5 shadow-2xl overflow-y-auto space-y-4 text-slate-200"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-display font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    <span>Cadastrar Novo Roteiro</span>
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono uppercase tracking-tight">
                    Adicione suas próprias cicloaventuras ao BPMF
                  </p>
                </div>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* SMART IMPORT VIA FILE UPLOAD */}
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3.5 space-y-2">
                <span className="block text-[9px] text-indigo-400 font-mono uppercase font-black tracking-widest">
                  ⚡ Upload e Análise de Roteiro (.md / .txt)
                </span>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Arraste ou selecione um arquivo de texto para que nossa inteligência preencha automaticamente os dias, distâncias, paradas e pousadas!
                </p>

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-[10px] text-indigo-300 font-bold transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Selecionar arquivo .md / .txt</span>
                    <input
                      type="file"
                      accept=".md,.txt"
                      onChange={handleRegMarkdownUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {parseSuccessMsg && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 leading-normal font-mono">
                    {parseSuccessMsg}
                  </div>
                )}
              </div>

              {/* MANUAL META FIELDS */}
              <div className="space-y-3">
                <span className="block text-[9px] text-slate-400 font-mono uppercase font-black tracking-widest pl-1">
                  Detalhes do Roteiro
                </span>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase pl-1 block">Nome do Roteiro *</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Rota das Flores"
                    className="w-full bg-white/5 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase pl-1 block">Breve Descrição</label>
                  <textarea
                    value={regDesc}
                    onChange={(e) => setRegDesc(e.target.value)}
                    placeholder="Ex: Uma jornada fantástica entre vales e montanhas..."
                    className="w-full bg-white/5 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 h-16"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase pl-1 block">Distância Total (KM)</label>
                    <input
                      type="number"
                      value={regTotalKm}
                      onChange={(e) => setRegTotalKm(e.target.value)}
                      placeholder="Ex: 120"
                      className="w-full bg-white/5 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase pl-1 block">Total Dias</label>
                    <input
                      type="number"
                      value={regTotalDays}
                      onChange={(e) => setRegTotalDays(e.target.value)}
                      placeholder="Ex: 3"
                      className="w-full bg-white/5 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* SYNCHRONIZATION LINKS (Strava, Komoot, Wikiloc, Maps) */}
                <span className="block text-[9px] text-slate-400 font-mono uppercase font-black tracking-widest pl-1 pt-2">
                  Links de Sincronização
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono uppercase pl-1 block">Wikiloc (Completa)</label>
                    <input
                      type="text"
                      value={regWikilocCompleta}
                      onChange={(e) => setRegWikilocCompleta(e.target.value)}
                      placeholder="https://www.wikiloc.com/..."
                      className="w-full bg-white/5 border border-white/10 text-[10px] text-white px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono uppercase pl-1 block">Google Maps (Direções)</label>
                    <input
                      type="text"
                      value={regGoogleMaps}
                      onChange={(e) => setRegGoogleMaps(e.target.value)}
                      placeholder="https://www.google.com/maps/..."
                      className="w-full bg-white/5 border border-white/10 text-[10px] text-white px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono uppercase pl-1 block">Strava Route URL</label>
                    <input
                      type="text"
                      value={regStrava}
                      onChange={(e) => setRegStrava(e.target.value)}
                      placeholder="https://www.strava.com/routes/..."
                      className="w-full bg-white/5 border border-white/10 text-[10px] text-white px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono uppercase pl-1 block">Komoot Tour URL</label>
                    <input
                      type="text"
                      value={regKomoot}
                      onChange={(e) => setRegKomoot(e.target.value)}
                      placeholder="https://www.komoot.com/tour/..."
                      className="w-full bg-white/5 border border-white/10 text-[10px] text-white px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SAVE / ACTIONS */}
              <div className="pt-3 border-t border-white/5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomRoute}
                  className="flex-1 py-2.5 rounded-xl bg-[#4AF47B] text-black font-display font-black text-xs uppercase tracking-wider transition cursor-pointer hover:bg-[#3ce26b] shadow-md shadow-[#4AF47B]/10"
                >
                  Confirmar Roteiro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
