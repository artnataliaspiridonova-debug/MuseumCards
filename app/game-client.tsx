"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { AdventureCard, Language, RoundId, getRound, rounds } from "./game-data";

type Phase = "welcome" | "setup" | "game" | "summary" | "leaderboard";
type PlayerMode = "solo" | "together" | "family" | "group";
type Duration = "quick" | "full";
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type City = { id: string; ru: string; en: string; country: string };
type Museum = { id: string; cityId: string; ru: string; en: string };
type LeaderboardEntry = { playerId: string; nickname: string; points: number; routes: number; rank: number };
type RankingResult = {
  routeId: string;
  cityId: string;
  museumId: string;
  cityName: string;
  museumName: string;
  pointsEarned: number;
  totalPoints: number;
  globalRank: number | null;
  cityRank: number | null;
  museumRank: number | null;
  bonuses: { stages: number; answers: number; photos: number; download: number; share: number };
};

type Memory = {
  roundId: RoundId;
  cardId: string;
  note: string;
  photo?: string;
  elapsedSeconds: number;
  qualified: boolean;
};

type SavedAdventure = {
  phase: "game" | "summary";
  language: Language;
  playerMode: PlayerMode;
  duration: Duration;
  cityName?: string;
  museumName: string;
  nickname?: string;
  cityId?: string;
  museumId?: string;
  rankingResult?: RankingResult | null;
  selectedRounds: RoundId[];
  deckOrders?: Partial<Record<RoundId, string[]>>;
  currentRoundIndex: number;
  memories: Memory[];
  startedAt: number;
};

const STORAGE_KEY = "museum-adventure-v2";
const PLAYER_NAME_KEY = "museum-adventure-player-name";
const MIN_CARD_SECONDS = 180;

function shuffleCards(cards: AdventureCard[]) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled.map((item) => item.id);
}

function createDeckOrders(): Record<RoundId, string[]> {
  return Object.fromEntries(rounds.map((round) => [round.id, shuffleCards(round.cards)])) as Record<RoundId, string[]>;
}

const ui = {
  ru: {
    gameName: "Museum Adventure",
    tagline: "Превратите посещение музея в путешествие",
    intro: "Играйте самостоятельно, вдвоём, всей семьёй или компанией. Выполняйте задания, замечайте детали и открывайте искусство заново в любом художественном музее.",
    start: "Начать игру",
    resume: "Продолжить маршрут",
    private: "Без регистрации. Фото и заметки останутся только на этом телефоне.",
    who: "С кем вы сегодня в музее?",
    time: "Сколько у вас времени?",
    museum: "Название музея",
    optional: "необязательно",
    next: "Продолжить",
    begin: "Начать маршрут",
    draw: "Вытяните карту",
    of: "из",
    tinyMission: "Как выполнить",
    memory: "Сохранить впечатление",
    memoryHint: "Этот шаг необязателен. Его можно пропустить и продолжить игру.",
    addPhoto: "Добавить фото",
    changePhoto: "Заменить фото",
    notePlaceholder: "Запишите мысль, название или неожиданное открытие",
    another: "Вытянуть другую карту",
    done: "Готово. Следующий этап",
    finish: "Завершить приключение",
    completed: "Маршрут пройден",
    passport: "Ваше музейное приключение",
    savePassport: "Сохранить музейный маршрут",
    share: "Поделиться приключением",
    again: "Начать новый маршрут",
    noNote: "Без заметки",
    quickLabel: "Короткий маршрут",
    quickMeta: "3 этапа · 15–20 минут",
    fullLabel: "Полный маршрут",
    fullMeta: "5 этапов · 35–60 минут",
    addHome: "Добавить на главный экран",
    homeHint: "Добавьте игру на главный экран и открывайте её как обычное приложение во время следующих посещений музея.",
  },
  en: {
    gameName: "Museum Adventure",
    tagline: "A new way to look at art",
    intro: "Five small missions turn any art museum into a personal adventure.",
    start: "Start an adventure",
    resume: "Continue your route",
    private: "No sign-up. Photos and thoughts stay on this phone.",
    who: "Who is playing today?",
    time: "How much time do you have?",
    museum: "Museum name",
    optional: "optional",
    next: "Continue",
    begin: "Enter the museum",
    draw: "Choose a hidden card",
    of: "of",
    tinyMission: "How to do it",
    memory: "Save this moment",
    memoryHint: "This is optional—you can simply continue the game.",
    addPhoto: "Add a photo",
    changePhoto: "Change photo",
    notePlaceholder: "Write a thought, a title or a surprising discovery…",
    another: "Choose another card",
    done: "Done, next round",
    finish: "Complete the adventure",
    completed: "Adventure completed",
    explored: "artworks explored",
    memoriesSaved: "memories saved",
    passport: "Your Museum Passport",
    savePassport: "Save Museum Passport",
    share: "Share the adventure",
    again: "Start a new route",
    noNote: "A moment saved without a note",
    quickLabel: "Quick",
    quickMeta: "3 rounds · 15–20 minutes",
    fullLabel: "Full",
    fullMeta: "5 rounds · 35–60 minutes",
    addHome: "Add to your home screen",
    homeHint: "Open the adventure like an app on your next museum visit.",
  },
} as const;

const modeOptions: Array<{
  id: PlayerMode;
  icon: string;
  label: { ru: string; en: string };
  text: { ru: string; en: string };
}> = [
  { id: "solo", icon: "◯", label: { ru: "Соло", en: "Solo" }, text: { ru: "Следуйте своим ассоциациям и интуиции", en: "Follow your own associations" } },
  { id: "together", icon: "◯◯", label: { ru: "Вместе", en: "Together" }, text: { ru: "Отвечайте отдельно, решайте вместе", en: "Answer alone, decide together" } },
  { id: "family", icon: "⌂", label: { ru: "Семья", en: "Family" }, text: { ru: "Ребёнок ведёт, взрослые помогают", en: "The child leads, adults support" } },
  { id: "group", icon: "✦", label: { ru: "Группа", en: "Group" }, text: { ru: "Команды, ведущий и голосование", en: "Teams, a host and a vote" } },
];

const modeCue: Record<PlayerMode, { ru: string; en: string }> = {
  solo: { ru: "Не спешите. Сформулируйте свой ответ и обратите внимание на то, что привлекло именно вас.", en: "Take your time. Form your own response and notice what drew your attention." },
  together: { ru: "Сначала каждый обдумывает свой ответ молча. Затем участники делятся ответами по очереди, находят одно совпадение и одно различие и формулируют общий ответ.", en: "First, everyone answers silently. Then take turns sharing: find one similarity and one difference. Finish with a shared response." },
  family: { ru: "Ребёнок отвечает первым. Взрослые помогают уточняющими вопросами и предлагают свои версии, не исправляя ответ ребёнка. В конце ребёнок выбирает понравившийся вариант или соединяет несколько идей в одну.", en: "The child answers first. One adult asks a follow-up question, the other adds a version. The child chooses or combines the family answers." },
  group: { ru: "Разделитесь на команды по 2–3 человека. Каждая команда готовит один ответ, затем представляет его группе. Выберите общий ответ голосованием — за свой голосовать нельзя.", en: "Split into teams of 2–3. Each team prepares one answer and presents it. Vote for a shared answer—you cannot vote for your own." },
};

const modeDetails: Record<PlayerMode, { ru: { title: string; steps: string[] }; en: { title: string; steps: string[] } }> = {
  solo: {
    ru: { title: "Как проходит соло-игра", steps: ["В первом этапе вытяните карту и найдите подходящее произведение.", "Выполняйте следующие задания у этой же работы в своём темпе.", "Меняйте произведение, только если этого требует карта или вам хочется продолжить путь."] },
    en: { title: "How Solo works", steps: ["Draw a card in the first stage and find a matching artwork.", "Complete the following tasks with the same artwork at your own pace.", "Change the artwork only when a card asks you to or when you want to move on."] },
  },
  together: {
    ru: { title: "Как проходит игра вместе", steps: ["В первом этапе вытяните карту и найдите подходящее произведение.", "На каждом следующем этапе новый участник вытягивает карту для этой же работы.", "Сначала каждый обдумывает свой ответ, затем сравните версии и сформулируйте один общий вариант. Меняйте произведение, только если этого требует задание или вам самим хочется продолжить путь."] },
    en: { title: "How Together works", steps: ["Draw a card in the first stage and find a matching artwork.", "At each following stage, a new player draws a card for the same artwork.", "Everyone thinks separately, then compares ideas and creates one shared answer. Change the artwork only when a card asks you to or when you want to move on."] },
  },
  family: {
    ru: { title: "Подходит для одного или нескольких взрослых и детей", steps: ["В первом этапе ребёнок вытягивает карту и находит подходящее произведение.", "На следующих этапах ребёнок вытягивает новую карту для этой же работы и отвечает первым.", "Взрослые помогают вопросами, не исправляя ребёнка. Меняйте произведение, только если этого требует задание или ребёнок захочет выбрать другое."] },
    en: { title: "For one or more adults and children", steps: ["In the first stage, the child draws a card and finds a matching artwork.", "In the following stages, the child draws a new card for the same artwork and answers first.", "Adults help with questions without correcting the child. Change the artwork only when a card asks you to or the child wants another one."] },
  },
  group: {
    ru: { title: "Сценарий: группа от четырёх человек", steps: ["В первом этапе ведущий вытягивает карту, а группа находит подходящее произведение.", "На каждом следующем этапе новый ведущий вытягивает и читает карту для этой же работы.", "Команды по 2–3 человека готовят ответы и голосуют. Меняйте произведение, только если этого требует задание или группа решит двигаться дальше."] },
    en: { title: "Scenario: a group of four or more", steps: ["In the first stage, the host draws a card and the group finds a matching artwork.", "At each following stage, a new host draws and reads a card for the same artwork.", "Teams of 2–3 prepare answers and vote. Change the artwork only when a card asks you to or the group wants to move on."] },
  },
};

const summaryRoundLabels: Record<RoundId, { ru: string; en: string }> = {
  find: { ru: "Поиск", en: "Find" },
  observe: { ru: "Наблюдение", en: "Observe" },
  imagine: { ru: "Воображение", en: "Imagine" },
  create: { ru: "Творчество", en: "Create" },
  challenge: { ru: "Испытание", en: "Challenge" },
};

function randomDifferentCard(roundId: RoundId, current?: string) {
  const cards = getRound(roundId).cards.filter((item) => item.id !== current);
  return cards[Math.floor(Math.random() * cards.length)];
}

function russianCount(count: number, one: string, few: string, many: string) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function completedTasksLabel(count: number, language: Language) {
  if (language === "en") return count === 1 ? "mission completed" : "missions completed";
  return russianCount(count, "задание выполнено", "задания выполнено", "заданий выполнено");
}

function savedImpressionsLabel(count: number, language: Language) {
  if (language === "en") return count === 1 ? "memory saved" : "memories saved";
  return russianCount(count, "впечатление сохранено", "впечатления сохранено", "впечатлений сохранено");
}

async function compressPhoto(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await loadImage(source);
  const maxSide = 1100;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((item, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "…" : "";
    context.fillText(item + suffix, x, y + index * lineHeight);
  });
  return Math.min(lines.length, maxLines) * lineHeight;
}

export default function GameClient({ clerkUserId }: { clerkUserId: string }) {
  const [language, setLanguage] = useState<Language>("ru");
  const [phase, setPhase] = useState<Phase>("welcome");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [playerMode, setPlayerMode] = useState<PlayerMode>("solo");
  const [duration, setDuration] = useState<Duration>("full");
  const [cityName, setCityName] = useState("");
  const [museumName, setMuseumName] = useState("");
  const [nickname, setNickname] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [museums, setMuseums] = useState<Museum[]>([]);
  const [cityId, setCityId] = useState("");
  const [museumId, setMuseumId] = useState("");
  const [rankingResult, setRankingResult] = useState<RankingResult | null>(null);
  const [resultStatus, setResultStatus] = useState<"idle" | "sending" | "saved" | "local" | "duplicate">("idle");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState<"idle" | "loading" | "ready" | "empty" | "unavailable">("idle");
  const [rankingPeriod, setRankingPeriod] = useState<"month" | "all">("month");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState<RoundId[]>(rounds.map((round) => round.id));
  const [deckOrders, setDeckOrders] = useState<Record<RoundId, string[]>>(createDeckOrders);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<AdventureCard | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [savedDraft, setSavedDraft] = useState<SavedAdventure | null>(null);
  const [isCreatingPassport, setIsCreatingPassport] = useState(false);
  const [cardElapsedSeconds, setCardElapsedSeconds] = useState(0);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const submittedRoute = useRef(0);
  const t = ui[language];
  const storageKey = `${STORAGE_KEY}:${clerkUserId}`;
  const playerNameKey = `${PLAYER_NAME_KEY}:${clerkUserId}`;

  const currentRoundId = selectedRounds[currentRoundIndex] ?? "find";
  const currentRound = getRound(currentRoundId);
  const currentDeck = (deckOrders[currentRoundId] ?? currentRound.cards.map((cardItem) => cardItem.id))
    .map((id) => currentRound.cards.find((cardItem) => cardItem.id === id))
    .filter((cardItem): cardItem is AdventureCard => Boolean(cardItem));
  const filteredMuseums = museums.filter((museum) => museum.cityId === cityId);
  const qualifiedCount = memories.filter((memory) => memory.qualified).length;
  const answerCount = memories.filter((memory) => memory.qualified && memory.note.trim()).length;
  const photoCount = memories.filter((memory) => memory.qualified && memory.photo).length;
  const localPoints = qualifiedCount * 10 + answerCount * 5 + photoCount * 10;
  const awardedPoints = rankingResult?.pointsEarned ?? localPoints;
  const elapsedSeconds = selectedCard ? cardElapsedSeconds : 0;
  const secondsRemaining = Math.max(0, MIN_CARD_SECONDS - elapsedSeconds);
  const prizeTitle = duration === "quick"
    ? (language === "ru" ? "Искатель деталей" : "Detail Seeker")
    : (language === "ru" ? "Музейный исследователь" : "Museum Explorer");

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const existingName = localStorage.getItem(playerNameKey) || "";
    const saved = localStorage.getItem(storageKey);
    let parsedDraft: SavedAdventure | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedAdventure;
        if (parsed.phase === "game" || parsed.phase === "summary") parsedDraft = parsed;
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    const timer = window.setTimeout(() => {
      setSavedDraft(parsedDraft);
      setIsStandalone(standalone);
      setIsIOS(ios);
      setPlayerId(clerkUserId);
      setNickname(existingName);
    }, 0);

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setIsStandalone(true);
      setInstallPrompt(null);
      setInstallHelpOpen(false);
    };
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);

    fetch("/api/locations")
      .then((response) => {
        if (!response.ok) throw new Error("locations unavailable");
        return response.json();
      })
      .then((data: { cities?: City[]; museums?: Museum[] }) => {
        setCities(data.cities || []);
        setMuseums(data.museums || []);
      })
      .catch(() => undefined);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, [clerkUserId, playerNameKey, storageKey]);

  useEffect(() => {
    if (phase !== "game" && phase !== "summary") return;
    const state: SavedAdventure = {
      phase,
      language,
      playerMode,
      duration,
      cityName,
      museumName,
      nickname,
      cityId,
      museumId,
      rankingResult,
      selectedRounds,
      deckOrders,
      currentRoundIndex,
      memories,
      startedAt,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // The adventure remains usable even when the browser storage quota is full.
    }
  }, [phase, language, playerMode, duration, cityName, museumName, nickname, cityId, museumId, rankingResult, selectedRounds, deckOrders, currentRoundIndex, memories, startedAt, storageKey]);

  useEffect(() => {
    if (phase !== "game" || !selectedCard) return;
    const timer = window.setInterval(() => {
      setCardElapsedSeconds((seconds) => Math.min(MIN_CARD_SECONDS, seconds + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, selectedCard]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, currentRoundIndex, selectedCard?.id]);

  useEffect(() => {
    if (phase !== "summary" || !startedAt || submittedRoute.current === startedAt) return;
    submittedRoute.current = startedAt;

    if (!playerId || nickname.trim().length < 2 || cityName.trim().length < 2 || museumName.trim().length < 2) {
      const timer = window.setTimeout(() => setResultStatus("local"), 0);
      return () => window.clearTimeout(timer);
    }

    queueMicrotask(() => setResultStatus("sending"));
    localStorage.setItem(playerNameKey, nickname.trim());
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        nickname: nickname.trim(),
        cityName: cityName.trim(),
        museumName: museumName.trim(),
        duration,
        stages: selectedRounds.length,
        qualifiedStages: qualifiedCount,
        answerCount,
        photoCount,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 409) {
          setResultStatus("duplicate");
          return;
        }
        if (!response.ok) throw new Error("result unavailable");
        const savedResult = data as RankingResult;
        setRankingResult(savedResult);
        setCityId(savedResult.cityId);
        setMuseumId(savedResult.museumId);
        setCityName(savedResult.cityName);
        setMuseumName(savedResult.museumName);
        setLeaderboardRefresh((value) => value + 1);
        setResultStatus("saved");
      })
      .catch(() => setResultStatus("local"));
  }, [phase, startedAt, playerId, nickname, cityName, museumName, duration, selectedRounds.length, qualifiedCount, answerCount, photoCount, playerNameKey]);

  useEffect(() => {
    if (phase !== "leaderboard") return;
    const controller = new AbortController();
    queueMicrotask(() => setLeaderboardStatus("loading"));
    const parameters = new URLSearchParams({ period: rankingPeriod });
    if (cityId) parameters.set("cityId", cityId);
    if (museumId) parameters.set("museumId", museumId);
    if (playerId) parameters.set("playerId", playerId);
    fetch(`/api/leaderboard?${parameters}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("leaderboard unavailable");
        return response.json();
      })
      .then((data: { entries?: LeaderboardEntry[] }) => {
        const entries = data.entries || [];
        setLeaderboardEntries(entries);
        setLeaderboardStatus(entries.length ? "ready" : "empty");
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setLeaderboardStatus("unavailable");
      });
    return () => controller.abort();
  }, [phase, cityId, museumId, rankingPeriod, playerId, leaderboardRefresh]);

  const savedMemoryCount = useMemo(
    () => memories.filter((memory) => memory.note.trim() || memory.photo).length,
    [memories],
  );

  function startAdventure() {
    setSelectedRounds(duration === "quick" ? ["find", "observe", "challenge"] : rounds.map((round) => round.id));
    setDeckOrders(createDeckOrders());
    setCurrentRoundIndex(0);
    setMemories([]);
    setSelectedCard(null);
    setCardElapsedSeconds(0);
    setNote("");
    setPhoto(undefined);
    setRankingResult(null);
    setResultStatus("idle");
    submittedRoute.current = 0;
    setStartedAt(Date.now());
    setPhase("game");
  }

  function resumeAdventure() {
    if (!savedDraft) return;
    setLanguage(savedDraft.language);
    setPlayerMode(savedDraft.playerMode);
    setDuration(savedDraft.duration);
    setCityName(savedDraft.cityName || "");
    setMuseumName(savedDraft.museumName);
    setNickname(savedDraft.nickname || nickname);
    setCityId(savedDraft.cityId || "");
    setMuseumId(savedDraft.museumId || "");
    setRankingResult(savedDraft.rankingResult || null);
    if (savedDraft.rankingResult) {
      submittedRoute.current = savedDraft.startedAt;
      setResultStatus("saved");
    }
    setSelectedRounds(savedDraft.selectedRounds);
    setDeckOrders(savedDraft.deckOrders
      ? { ...createDeckOrders(), ...savedDraft.deckOrders }
      : createDeckOrders());
    setCurrentRoundIndex(savedDraft.currentRoundIndex);
    setMemories(savedDraft.memories.map((memory) => ({
      ...memory,
      elapsedSeconds: memory.elapsedSeconds || 0,
      qualified: Boolean(memory.qualified),
    })));
    setStartedAt(savedDraft.startedAt);
    setSelectedCard(null);
    setPhase(savedDraft.phase);
  }

  function chooseCard(cardIndex: number) {
    setSelectedCard(currentDeck[cardIndex]);
    setCardElapsedSeconds(0);
    setNote("");
    setPhoto(undefined);
    setMemoryOpen(false);
  }

  function chooseAnotherCard() {
    setSelectedCard(randomDifferentCard(currentRoundId, selectedCard?.id));
    setCardElapsedSeconds(0);
    setNote("");
    setPhoto(undefined);
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhoto(await compressPhoto(file));
  }

  function completeRound(skipTimer = false) {
    if (!selectedCard || (secondsRemaining > 0 && !skipTimer)) return;
    const qualified = !skipTimer && elapsedSeconds >= MIN_CARD_SECONDS;
    const nextMemories = [
      ...memories.filter((item) => item.roundId !== currentRoundId),
      {
        roundId: currentRoundId,
        cardId: selectedCard.id,
        note: note.trim(),
        photo,
        elapsedSeconds,
        qualified,
      },
    ];
    setMemories(nextMemories);
    setSelectedCard(null);
    setNote("");
    setPhoto(undefined);
    setMemoryOpen(false);
    setCardElapsedSeconds(0);
    if (currentRoundIndex === selectedRounds.length - 1) {
      setPhase("summary");
    } else {
      setCurrentRoundIndex((index) => index + 1);
    }
  }

  function resetAdventure() {
    localStorage.removeItem(storageKey);
    setSavedDraft(null);
    setMemories([]);
    setSelectedCard(null);
    setCurrentRoundIndex(0);
    setSetupStep(1);
    setRankingResult(null);
    setResultStatus("idle");
    setPhase("setup");
  }

  function goHome() {
    if (phase === "game" || phase === "summary") {
      setSavedDraft({
        phase,
        language,
        playerMode,
        duration,
        cityName,
        museumName,
        nickname,
        cityId,
        museumId,
        rankingResult,
        selectedRounds,
        deckOrders,
        currentRoundIndex,
        memories,
        startedAt,
      });
    }
    setPhase("welcome");
  }

  function selectCity(nextCityId: string) {
    setCityId(nextCityId);
    const city = cities.find((item) => item.id === nextCityId);
    setCityName(city ? city[language] : "");
    setMuseumId("");
    setMuseumName("");
  }

  function selectMuseum(nextMuseumId: string) {
    setMuseumId(nextMuseumId);
    const museum = museums.find((item) => item.id === nextMuseumId);
    if (museum) setMuseumName(museum[language]);
  }

  function openLeaderboard() {
    setPhase("leaderboard");
  }

  function changeCityName(value: string) {
    setCityName(value);
    const match = cities.find((city) => city.ru.toLocaleLowerCase() === value.trim().toLocaleLowerCase() || city.en.toLocaleLowerCase() === value.trim().toLocaleLowerCase());
    setCityId(match?.id || "");
    setMuseumId("");
  }

  function changeMuseumName(value: string) {
    setMuseumName(value);
    const match = museums.find((museum) =>
      (!cityId || museum.cityId === cityId) &&
      (museum.ru.toLocaleLowerCase() === value.trim().toLocaleLowerCase() || museum.en.toLocaleLowerCase() === value.trim().toLocaleLowerCase()));
    setMuseumId(match?.id || "");
  }

  async function installApp() {
    if (isStandalone) return;
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstallPrompt(null);
      else setInstallHelpOpen(true);
      return;
    }
    setInstallHelpOpen((open) => !open);
  }

  async function createPassportBlob() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#f5efe2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#173f67";
    context.lineWidth = 10;
    context.strokeRect(38, 38, 1004, 1844);
    context.fillStyle = "#173f67";
    context.textAlign = "center";
    context.font = "700 38px Arial";
    context.fillText("MUSEUM ADVENTURE", 540, 115);
    context.font = language === "ru" ? "800 58px Arial" : "800 78px Arial";
    context.fillText(language === "ru" ? "МУЗЕЙНОЕ ПРИКЛЮЧЕНИЕ" : "MUSEUM PASSPORT", 540, 205);
    context.font = "32px Arial";
    context.fillStyle = "#2f3b45";
    const subtitle = museumName || (language === "ru" ? "Мой музейный маршрут" : "My museum route");
    context.fillText(subtitle.slice(0, 48), 540, 260);
    context.font = "24px Arial";
    context.fillStyle = "#6c6b64";
    context.fillText(new Date(startedAt).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric" }), 540, 302);

    for (let index = 0; index < memories.length; index += 1) {
      const memory = memories[index];
      const round = getRound(memory.roundId);
      const selected = round.cards.find((item) => item.id === memory.cardId)!;
      const y = 355 + index * 285;
      context.fillStyle = "#fffaf1";
      context.fillRect(76, y, 928, 248);
      context.fillStyle = round.color;
      context.fillRect(76, y, 18, 248);
      context.textAlign = "left";
      context.fillStyle = round.color;
      context.font = "700 25px Arial";
      context.fillText(`${round.icon}  ${summaryRoundLabels[round.id][language].toUpperCase()}`, 125, y + 43);
      const textWidth = memory.photo ? 610 : 805;
      context.fillStyle = "#172633";
      context.font = "700 33px Arial";
      wrapText(context, selected.prompt[language], 125, y + 93, textWidth, 40, 3);
      context.fillStyle = "#6b6259";
      context.font = "25px Arial";
      wrapText(context, memory.note || t.noNote, 125, y + 202, textWidth, 30, 2);
      if (memory.photo) {
        try {
          const image = await loadImage(memory.photo);
          const targetX = 790;
          const targetY = y + 28;
          const targetW = 180;
          const targetH = 192;
          const scale = Math.max(targetW / image.width, targetH / image.height);
          const sourceW = targetW / scale;
          const sourceH = targetH / scale;
          context.drawImage(image, (image.width - sourceW) / 2, (image.height - sourceH) / 2, sourceW, sourceH, targetX, targetY, targetW, targetH);
        } catch {
          // Keep the rest of the passport if a local image cannot be decoded.
        }
      }
    }

    context.textAlign = "center";
    context.fillStyle = "#173f67";
    context.font = "700 26px Arial";
    context.fillText("museum adventure cards", 540, 1830);
    return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed")), "image/png"));
  }

  async function awardActionBonus(bonusType: "download" | "share") {
    if (!rankingResult?.routeId || !playerId) return;
    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addBonus",
          playerId,
          routeId: rankingResult.routeId,
          bonusType,
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setRankingResult((previous) => previous ? {
        ...previous,
        pointsEarned: data.pointsEarned,
        totalPoints: data.totalPoints,
        globalRank: data.globalRank,
        cityRank: data.cityRank,
        museumRank: data.museumRank,
        bonuses: {
          ...previous.bonuses,
          [bonusType]: data.bonusValue ?? previous.bonuses[bonusType],
        },
      } : previous);
      setLeaderboardRefresh((value) => value + 1);
    } catch {
      // The downloaded or shared passport remains available if the online bonus cannot be saved.
    }
  }

  async function savePassport() {
    setIsCreatingPassport(true);
    try {
      const blob = await createPassportBlob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "museum-adventure-passport.png";
      link.click();
      URL.revokeObjectURL(link.href);
      await awardActionBonus("download");
    } finally {
      setIsCreatingPassport(false);
    }
  }

  async function shareAdventure() {
    setIsCreatingPassport(true);
    try {
      const blob = await createPassportBlob();
      const file = new File([blob], "museum-adventure-passport.png", { type: "image/png" });
      const text = language === "ru"
        ? `Моё музейное приключение завершено: ${memories.length} ${completedTasksLabel(memories.length, "ru")} и ${savedMemoryCount} ${savedImpressionsLabel(savedMemoryCount, "ru")}.`
        : `I completed a Museum Adventure: ${memories.length} ${completedTasksLabel(memories.length, "en")} and ${savedMemoryCount} ${savedImpressionsLabel(savedMemoryCount, "en")}.`;
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: "Museum Adventure", text, files: [file] });
        await awardActionBonus("share");
      } else {
        await savePassport();
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") await savePassport();
    } finally {
      setIsCreatingPassport(false);
    }
  }

  return (
    <main className={`app-shell phase-${phase}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="phone-stage">
        <header className="topbar">
          <button className="brand" onClick={goHome} aria-label="Museum Adventure home">
            <span className="brand-mark">MA</span>
            <span>Museum Adventure</span>
          </button>
          <div className="topbar-actions">
            <div className="language-switch" aria-label="Language">
              <button className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>RU</button>
              <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
            </div>
            <UserButton />
          </div>
        </header>

        {phase === "welcome" && (
          <div className="screen welcome-screen">
            <div className="hero-emblem" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="hero-star">✦</span>
            </div>
            <p className="eyebrow">{t.gameName} · {language === "ru" ? "игра для музея" : "a game for art museums"}</p>
            <p className="author-credit">{language === "ru" ? "Игра создана культурологом и исследователем Натальей Спиридоновой" : "Created by cultural researcher Natalia Spiridonova"}</p>
            <h1>{t.tagline}</h1>
            <p className="lead">{t.intro}</p>
            <div className="round-ribbon" aria-label={language === "ru" ? "Пять категорий игры" : "Five game categories"}>
              {rounds.map((round) => (
                <span key={round.id} style={{ "--label-color": round.color } as React.CSSProperties}><i style={{ backgroundColor: round.color }}>{round.icon}</i><small>{round.label[language]}</small></span>
              ))}
            </div>
            <div className="welcome-actions">
              <button className="primary-button" onClick={() => setPhase("setup")}>{t.start}<span>→</span></button>
              {savedDraft && <button className="text-button" onClick={resumeAdventure}>{t.resume}</button>}
            </div>
            <button className={`install-card ${isStandalone ? "installed" : ""}`} onClick={installApp}>
              <span className="install-icon">{isStandalone ? "✓" : "↓"}</span>
              <span><strong>{isStandalone ? (language === "ru" ? "Приложение установлено" : "App installed") : t.addHome}</strong><small>{isStandalone ? (language === "ru" ? "Открывается на весь экран" : "Opens full screen") : t.homeHint}</small></span>
              {!isStandalone && <b>›</b>}
            </button>
            {installHelpOpen && !isStandalone && (
              <div className="install-help">
                <strong>{language === "ru" ? "Как установить" : "How to install"}</strong>
                <p>{isIOS
                  ? (language === "ru" ? "Откройте игру в Safari, нажмите «Поделиться» □↑ и выберите «На экран Домой»." : "Open the game in Safari, tap Share □↑ and choose “Add to Home Screen”.")
                  : (language === "ru" ? "Откройте меню браузера ⋮ и выберите «Установить приложение» или «Добавить на главный экран»." : "Open the browser menu ⋮ and choose “Install app” or “Add to Home screen”.")}</p>
              </div>
            )}
            <p className="privacy-note"><span>⌁</span>{t.private}</p>
          </div>
        )}

        {phase === "setup" && (
          <div className="screen setup-screen">
            <div className="step-indicator"><span className="active" /><span className={setupStep === 2 ? "active" : ""} /></div>
            {setupStep === 1 ? (
              <>
                <p className="eyebrow">01 · {language === "ru" ? "Участники" : "Your company"}</p>
                <h2>{t.who}</h2>
                <div className="option-grid">
                  {modeOptions.map((option) => (
                    <button key={option.id} className={`mode-card ${playerMode === option.id ? "selected" : ""}`} onClick={() => setPlayerMode(option.id)}>
                      <span className="mode-icon">{option.icon}</span>
                      <strong>{option.label[language]}</strong>
                      <small>{option.text[language]}</small>
                      <span className="check">✓</span>
                    </button>
                  ))}
                </div>
                <section className="mode-explainer">
                  <strong>{modeDetails[playerMode][language].title}</strong>
                  <ol>{modeDetails[playerMode][language].steps.map((step) => <li key={step}>{step}</li>)}</ol>
                </section>
                <button className="primary-button bottom-button" onClick={() => setSetupStep(2)}>{t.next}<span>→</span></button>
              </>
            ) : (
              <>
                <button className="back-button" onClick={() => setSetupStep(1)}>← {language === "ru" ? "Назад" : "Back"}</button>
                <p className="eyebrow">02 · {language === "ru" ? "Маршрут" : "Your route"}</p>
                <h2>{t.time}</h2>
                <div className="duration-stack">
                  <button className={`duration-card ${duration === "quick" ? "selected" : ""}`} onClick={() => setDuration("quick")}>
                    <span className="duration-number">3</span><span><strong>{t.quickLabel}</strong><small>{t.quickMeta}</small></span><span className="radio" />
                  </button>
                  <button className={`duration-card ${duration === "full" ? "selected" : ""}`} onClick={() => setDuration("full")}>
                    <span className="duration-number">5</span><span><strong>{t.fullLabel}</strong><small>{t.fullMeta}</small></span><span className="radio" />
                  </button>
                </div>
                <section className="ranking-setup">
                  <div className="ranking-setup-title">
                    <span>🏆</span>
                    <div><strong>{language === "ru" ? "Участвовать в рейтинге" : "Join the leaderboard"}</strong><small>{language === "ru" ? "Необязательно. Нужны имя, город и музей." : "Optional. Add your name, city and museum."}</small></div>
                  </div>
                  <label className="app-field">
                    <span>{language === "ru" ? "Ваше имя в рейтинге" : "Leaderboard name"}</span>
                    <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} placeholder={language === "ru" ? "Например, Наташа" : "For example, Alex"} />
                  </label>
                  <div className="location-fields">
                    <label className="app-field">
                      <span>{language === "ru" ? "Город" : "City"}</span>
                      <input list="city-options" value={cityName} onChange={(event) => changeCityName(event.target.value)} placeholder={language === "ru" ? "Например, Москва" : "For example, London"} />
                    </label>
                    <label className="app-field">
                      <span>{t.museum}</span>
                      <input list="museum-options" value={museumName} onChange={(event) => changeMuseumName(event.target.value)} placeholder={language === "ru" ? "Например, Новая Третьяковка" : "For example, Tate Modern"} />
                    </label>
                  </div>
                  <datalist id="city-options">{cities.map((city) => <option key={city.id} value={city[language]} />)}</datalist>
                  <datalist id="museum-options">{(cityId ? filteredMuseums : museums).map((museum) => <option key={museum.id} value={museum[language]} />)}</datalist>
                  <p className="connection-note">{language === "ru" ? "Имя, город и музей обязательны только для рейтинга. Если места ещё нет в списке, просто напишите его — оно добавится автоматически." : "Name, city and museum are only required for the leaderboard. New places are added automatically."}</p>
                  <p className="author-note"><span>НС</span><span><strong>{language === "ru" ? "Наталья Спиридонова · культуролог и исследователь" : "Natalia Spiridonova · cultural researcher"}</strong>{language === "ru" ? " Не спешите увидеть весь музей. Одного произведения достаточно, чтобы начать настоящее путешествие." : " Do not rush to see the whole museum. One artwork is enough to begin a real adventure."}</span></p>
                </section>
                <button className="primary-button bottom-button" onClick={startAdventure}>{t.begin}<span>→</span></button>
              </>
            )}
          </div>
        )}

        {phase === "game" && (
          <div className="screen game-screen" style={{ "--round-color": currentRound.color, "--round-soft": currentRound.soft } as React.CSSProperties}>
            <div className="game-progress">
              <span>{language === "ru" ? "Этап" : "Round"} {currentRoundIndex + 1} {t.of} {selectedRounds.length}</span>
              <div>{selectedRounds.map((id, index) => <i key={id} className={index <= currentRoundIndex ? "active" : ""} style={{ backgroundColor: index <= currentRoundIndex ? getRound(id).color : undefined }} />)}</div>
            </div>

            {!selectedCard ? (
              <div className="deck-screen">
                <div className="round-heading"><span>{currentRound.icon}</span><p>{currentRound.label[language]}</p></div>
                <h2>{t.draw}</h2>
                <p>{currentRound.instruction[language]}</p>
                {currentRoundIndex === 0 && (
                  <section className="game-start-guide">
                    <strong>{language === "ru" ? "Перед началом маршрута" : "Before you begin"}</strong>
                    <p>{language === "ru"
                      ? "На первом этапе карта поможет выбрать произведение. В следующих этапах оставайтесь у этой же работы, пока задание прямо не предложит найти другую. К каждой карте есть короткое уточнение — оно помогает начать, но не задаёт правильного ответа."
                      : "In the first stage, a card helps you choose an artwork. Stay with the same work in the following stages unless a task explicitly asks you to find another. Each card includes a short way to begin, but there is no single correct answer."}</p>
                    <p>{modeCue[playerMode][language]}</p>
                  </section>
                )}
                {playerMode === "together" && (
                  <p className="scenario-cue">{language === "ru"
                    ? `Карту вытягивает ${currentRoundIndex === 0 ? "первый участник" : "следующий участник"}. Выполните её у выбранной работы; новое произведение ищите, только если этого требует задание.`
                    : `The ${currentRoundIndex === 0 ? "first player" : "next player"} draws the card. Complete it with your chosen artwork; find another only when the task asks you to.`}</p>
                )}
                {playerMode === "family" && (
                  <p className="scenario-cue">{language === "ru"
                    ? `Главный исследователь — ребёнок: он вытягивает карту${currentRoundIndex === 0 ? " и находит подходящую работу" : " для выбранной работы"}. Взрослые пока не подсказывают.`
                    : `The child is the lead explorer: they draw the card${currentRoundIndex === 0 ? " and find a matching artwork" : " for the chosen artwork"}. Adults do not give hints yet.`}</p>
                )}
                {playerMode === "group" && (
                  <p className="scenario-cue">{language === "ru"
                    ? `${currentRoundIndex === 0 ? "Первый ведущий" : "Новый ведущий"} вытягивает и читает карту. Остальные делятся на команды по 2–3 человека и выполняют её у выбранной работы.`
                    : `The ${currentRoundIndex === 0 ? "first host" : "new host"} draws and reads the card. Everyone else splits into teams of 2–3 and completes it with the chosen artwork.`}</p>
                )}
                <div className="card-deck" aria-label={t.draw}>
                  {currentDeck.map((cardItem, index) => (
                    <button key={cardItem.id} onClick={() => chooseCard(index)} aria-label={`${t.draw} ${index + 1}`}>
                      <span>{currentRound.icon}</span><small>{String(index + 1).padStart(2, "0")}</small>
                    </button>
                  ))}
                </div>
                {currentRoundIndex === 0 && <p className="deck-hint">{language === "ru" ? "Доверьтесь случаю: все задания подходят для любого художественного музея." : "Trust chance—every card works in any art museum."}</p>}
              </div>
            ) : (
              <div className="mission-screen">
                <article className="mission-card">
                  <div className="mission-card-top"><span className="mission-icon">{currentRound.icon}</span><span>{currentRound.label[language]}</span><small>{selectedCard.id.split("-")[1].padStart(2, "0")} / 10</small></div>
                  <h2>{selectedCard.prompt[language]}</h2>
                  <div className="tiny-mission"><span>✦</span><div><small>{t.tinyMission}</small><p>{selectedCard.mission[language]}</p></div></div>
                </article>
                <div className={`card-timer ${secondsRemaining === 0 ? "ready" : ""}`}>
                  <div>
                    <span>{secondsRemaining === 0 ? "✓" : "◷"}</span>
                    <strong>{secondsRemaining === 0
                      ? (language === "ru" ? "Карта принесёт 10 баллов" : "This card earns 10 points")
                      : (language === "ru"
                        ? `Уделите заданию ещё ${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`
                        : `Stay with this task for ${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")} more`)}</strong>
                  </div>
                  <p>{language === "ru" ? "Баллы начисляются после 3 минут внимательной работы с каждой картой." : "Points unlock after 3 minutes of focused work with each card."}</p>
                  <i><span style={{ width: `${Math.min(100, (elapsedSeconds / MIN_CARD_SECONDS) * 100)}%` }} /></i>
                </div>

                <button className={`memory-toggle ${memoryOpen ? "open" : ""}`} onClick={() => setMemoryOpen((open) => !open)}>
                  <span className="memory-plus">{memoryOpen ? "−" : "+"}</span><span><strong>{t.memory}</strong><small>{t.memoryHint}</small></span><span>⌄</span>
                </button>
                {memoryOpen && (
                  <div className="memory-panel">
                    <input ref={fileInput} className="file-input" type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
                    {photo ? (
                      <button className="photo-preview" onClick={() => fileInput.current?.click()}><img src={photo} alt={language === "ru" ? "Сохранённое впечатление из музея" : "Museum memory"} /><span>{t.changePhoto}</span></button>
                    ) : (
                      <button className="photo-button" onClick={() => fileInput.current?.click()}><span>▣</span>{t.addPhoto}</button>
                    )}
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.notePlaceholder} maxLength={240} />
                    <small className="character-count">{note.length}/240</small>
                  </div>
                )}
                <div className="mission-actions">
                  <button className="secondary-button" onClick={chooseAnotherCard}>↻ {t.another}</button>
                  {secondsRemaining > 0 && (
                    <button className="skip-timer-button" onClick={() => completeRound(true)}>
                      {currentRoundIndex === selectedRounds.length - 1
                        ? (language === "ru" ? "Пропустить таймер и завершить" : "Skip timer and finish")
                        : (language === "ru" ? "Пропустить таймер и продолжить" : "Skip timer and continue")}
                      <small>{language === "ru" ? "За эту карту будет начислено 0 баллов" : "This card will earn 0 points"}</small>
                    </button>
                  )}
                  <button className="primary-button" disabled={secondsRemaining > 0} onClick={() => completeRound(false)}>{secondsRemaining > 0 ? (language === "ru" ? "Продолжить после таймера" : "Continue after timer") : (currentRoundIndex === selectedRounds.length - 1 ? t.finish : t.done)}<span>→</span></button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === "summary" && (
          <div className="screen summary-screen">
            <div className="success-mark">✓</div>
            <p className="eyebrow">Museum Adventure</p>
            <h1>{t.completed}</h1>
            {museumName && <p className="museum-title">{museumName}</p>}
            <div className="summary-stats"><span><strong>{memories.length}</strong>{completedTasksLabel(memories.length, language)}</span><i /><span><strong>{savedMemoryCount}</strong>{savedImpressionsLabel(savedMemoryCount, language)}</span></div>
            <section className="prize-card">
              <div className="prize-medal"><span>✦</span></div>
              <p>{language === "ru" ? "Ваш приз" : "Your prize"}</p>
              <h2>{prizeTitle}</h2>
              <div className="points-award">+{awardedPoints} <span>{language === "ru" ? "баллов" : "points"}</span></div>
              {resultStatus === "sending" && <small>{language === "ru" ? "Добавляем результат в рейтинг…" : "Adding your result to the leaderboard…"}</small>}
              {resultStatus === "saved" && rankingResult && (
                <>
                  <div className="rank-chips">
                    {rankingResult.globalRank && <span>🌍 № {rankingResult.globalRank} {language === "ru" ? "в общем рейтинге" : "overall"}</span>}
                    {rankingResult.museumRank && <span>🏛 № {rankingResult.museumRank} {language === "ru" ? "в музее" : "in the museum"}</span>}
                    {rankingResult.cityRank && <span>⌖ № {rankingResult.cityRank} {language === "ru" ? "в городе" : "in the city"}</span>}
                  </div>
                  <div className="score-breakdown">
                    <span>{rankingResult.bonuses.stages} · {language === "ru" ? "время" : "time"}</span>
                    <span>{rankingResult.bonuses.answers} · {language === "ru" ? "ответы" : "answers"}</span>
                    <span>{rankingResult.bonuses.photos} · {language === "ru" ? "фото" : "photos"}</span>
                    <span>{rankingResult.bonuses.download} · {language === "ru" ? "скачивание" : "download"}</span>
                    <span>{rankingResult.bonuses.share} · {language === "ru" ? "поделиться" : "sharing"}</span>
                  </div>
                </>
              )}
              {resultStatus === "local" && <small>{language === "ru" ? "Результат сохранён на телефоне, но не отправлен в общий рейтинг. Для рейтинга нужны имя, город и музей." : "Saved on this phone, but not added online. Name, city and museum are required."}</small>}
              {resultStatus === "duplicate" && <small>{language === "ru" ? "Приз ваш. В общий рейтинг засчитывается один маршрут в одном музее за день." : "The prize is yours. One route per museum per day counts toward the public leaderboard."}</small>}
              <button className="ranking-button" onClick={openLeaderboard}>🏆 {language === "ru" ? "Посмотреть рейтинг" : "View leaderboard"} <span>→</span></button>
            </section>
            <section className="passport-preview">
              <div className="passport-header"><span>{t.passport}</span><small>{new Date(startedAt).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long" })}</small></div>
              <div className="passport-route">
                {memories.map((memory, index) => {
                  const round = getRound(memory.roundId);
                  const savedCard = round.cards.find((item) => item.id === memory.cardId)!;
                  return (
                    <article key={memory.roundId}>
                      <div className="route-marker" style={{ backgroundColor: round.color }}>{round.icon}</div>
                      {index < memories.length - 1 && <span className="route-line" />}
                      <div className="route-copy"><small style={{ color: round.color }}>{summaryRoundLabels[round.id][language]}</small><strong>{savedCard.prompt[language]}</strong><p>{memory.note || t.noNote}</p></div>
                      {memory.photo && <img src={memory.photo} alt={language === "ru" ? "Сохранённое впечатление из музея" : "Saved museum moment"} />}
                    </article>
                  );
                })}
              </div>
            </section>
            <div className="summary-actions">
              <button className="primary-button" disabled={isCreatingPassport} onClick={savePassport}>{isCreatingPassport ? "…" : "↓"} {t.savePassport}</button>
              <button className="share-button" disabled={isCreatingPassport} onClick={shareAdventure}>↗ {t.share}</button>
              <button className="text-button" onClick={resetAdventure}>{t.again}</button>
            </div>
            <p className="author-thanks">{language === "ru" ? "Спасибо, что отправились в это приключение вместе со мной. До встречи в следующем музее! — Наталья Спиридонова, культуролог и исследователь" : "Thank you for taking this adventure with me. See you at the next museum! — Natalia Spiridonova, cultural researcher"}</p>
            <button className={`home-tip ${isStandalone ? "installed" : ""}`} onClick={installApp}><span className="brand-mark">{isStandalone ? "✓" : "MA"}</span><div><strong>{isStandalone ? (language === "ru" ? "Приложение установлено" : "App installed") : t.addHome}</strong><p>{isStandalone ? (language === "ru" ? "Museum Adventure открывается как обычное приложение." : "Museum Adventure now opens like a regular app.") : t.homeHint}</p></div><b>›</b></button>
            {installHelpOpen && !isStandalone && (
              <div className="install-help summary-install-help">
                <strong>{language === "ru" ? "Как установить" : "How to install"}</strong>
                <p>{isIOS
                  ? (language === "ru" ? "В Safari нажмите «Поделиться» □↑, затем «На экран Домой»." : "In Safari, tap Share □↑, then “Add to Home Screen”.")
                  : (language === "ru" ? "В меню браузера ⋮ выберите «Установить приложение» или «Добавить на главный экран»." : "In the browser menu ⋮ choose “Install app” or “Add to Home screen”.")}</p>
              </div>
            )}
          </div>
        )}

        {phase === "leaderboard" && (
          <div className="screen leaderboard-screen">
            <p className="eyebrow">Museum Adventure · {language === "ru" ? "рейтинг" : "leaderboard"}</p>
            <h1>{language === "ru" ? "Общий рейтинг" : "Overall leaderboard"}</h1>
            <p className="leaderboard-lead">{language === "ru" ? "Здесь видны все участники. При желании отфильтруйте рейтинг по городу или музею." : "Every participant appears here. You can optionally filter by city or museum."}</p>

            <>
              {cities.length > 0 && (
                <div className="leaderboard-filters">
                  <label className="app-field">
                    <span>{language === "ru" ? "Город" : "City"}</span>
                    <select value={cityId} onChange={(event) => selectCity(event.target.value)}>
                      <option value="">{language === "ru" ? "Все города" : "All cities"}</option>
                      {cities.map((city) => <option key={city.id} value={city.id}>{city[language]}</option>)}
                    </select>
                  </label>
                  <label className="app-field">
                    <span>{language === "ru" ? "Музей" : "Museum"}</span>
                    <select value={museumId} onChange={(event) => selectMuseum(event.target.value)} disabled={!cityId}>
                      <option value="">{language === "ru" ? "Все музеи города" : "All city museums"}</option>
                      {filteredMuseums.map((museum) => <option key={museum.id} value={museum.id}>{museum[language]}</option>)}
                    </select>
                  </label>
                </div>
              )}
              <div className="period-switch">
                <button className={rankingPeriod === "month" ? "active" : ""} onClick={() => setRankingPeriod("month")}>{language === "ru" ? "Этот месяц" : "This month"}</button>
                <button className={rankingPeriod === "all" ? "active" : ""} onClick={() => setRankingPeriod("all")}>{language === "ru" ? "За всё время" : "All time"}</button>
              </div>

              {leaderboardStatus === "loading" && <div className="leaderboard-message"><span className="loader">✦</span><strong>{language === "ru" ? "Собираем результаты…" : "Loading results…"}</strong></div>}
              {leaderboardStatus === "empty" && <div className="leaderboard-message"><span>🏆</span><strong>{language === "ru" ? "Первое место пока свободно" : "First place is still open"}</strong><p>{language === "ru" ? "Первый завершённый маршрут появится здесь автоматически." : "The first completed route will appear here automatically."}</p></div>}
              {leaderboardStatus === "unavailable" && <div className="leaderboard-message"><span>⌁</span><strong>{language === "ru" ? "Рейтинг временно недоступен" : "Leaderboard temporarily unavailable"}</strong><p>{language === "ru" ? "Попробуйте ещё раз немного позже." : "Please try again a little later."}</p></div>}
              {leaderboardStatus === "ready" && (
                  <div className="ranking-list">
                    {leaderboardEntries.slice(0, 3).length > 0 && (
                      <div className="podium">
                        {leaderboardEntries.slice(0, 3).map((entry) => (
                          <article key={entry.playerId} className={`place-${entry.rank} ${entry.playerId === playerId ? "current" : ""}`}>
                            <span>{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
                            <strong>{entry.nickname}</strong>
                            <small>{entry.points} {language === "ru" ? "баллов" : "points"}</small>
                          </article>
                        ))}
                      </div>
                    )}
                    <div className="ranking-table">
                      {leaderboardEntries.map((entry) => (
                        <article key={entry.playerId} className={entry.playerId === playerId ? "current" : ""}>
                          <b>{entry.rank}</b>
                          <span><strong>{entry.nickname}</strong><small>{entry.routes} {language === "ru" ? "маршр." : "routes"}</small></span>
                          <em>{entry.points}</em>
                        </article>
                      ))}
                    </div>
                  </div>
              )}
            </>
          </div>
        )}

        {(phase === "welcome" || phase === "summary" || phase === "leaderboard") && (
          <nav className="app-tabs" aria-label={language === "ru" ? "Навигация приложения" : "App navigation"}>
            <button className={phase === "welcome" ? "active" : ""} onClick={goHome}><span>⌂</span>{language === "ru" ? "Главная" : "Home"}</button>
            <button onClick={() => setPhase("setup")}><span>✦</span>{language === "ru" ? "Играть" : "Play"}</button>
            <button className={phase === "leaderboard" ? "active" : ""} onClick={openLeaderboard}><span>🏆</span>{language === "ru" ? "Рейтинг" : "Ranking"}</button>
          </nav>
        )}
      </section>
    </main>
  );
}
