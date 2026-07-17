"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdventureCard, Language, RoundId, getRound, rounds } from "./game-data";

type Phase = "welcome" | "setup" | "game" | "summary";
type PlayerMode = "solo" | "together" | "family" | "group";
type Duration = "quick" | "full";

type Memory = {
  roundId: RoundId;
  cardId: string;
  note: string;
  photo?: string;
};

type SavedAdventure = {
  phase: Phase;
  language: Language;
  playerMode: PlayerMode;
  duration: Duration;
  museumName: string;
  selectedRounds: RoundId[];
  currentRoundIndex: number;
  memories: Memory[];
  startedAt: number;
};

const STORAGE_KEY = "museum-adventure-v1";

const ui = {
  ru: {
    tagline: "Твоё искусство смотреть внимательнее",
    intro: "Пять маленьких заданий превращают любой художественный музей в личное приключение.",
    start: "Начать приключение",
    resume: "Продолжить маршрут",
    private: "Без регистрации. Фото и мысли остаются на этом телефоне.",
    who: "Кто сегодня играет?",
    time: "Сколько у вас времени?",
    museum: "Название музея",
    optional: "необязательно",
    next: "Дальше",
    begin: "Войти в музей",
    draw: "Выбери закрытую карту",
    of: "из",
    tinyMission: "Маленькая миссия",
    memory: "Сохранить момент",
    memoryHint: "Это необязательно — можно просто продолжить игру.",
    addPhoto: "Добавить фото",
    changePhoto: "Заменить фото",
    notePlaceholder: "Запиши мысль, название или неожиданное открытие…",
    another: "Выбрать другую карту",
    done: "Готово, следующий раунд",
    finish: "Завершить приключение",
    completed: "Приключение завершено",
    explored: "произведений исследовано",
    memoriesSaved: "воспоминаний сохранено",
    passport: "Твой Museum Passport",
    savePassport: "Сохранить Museum Passport",
    share: "Поделиться приключением",
    again: "Начать новый маршрут",
    noNote: "Момент сохранён без заметки",
    quickLabel: "Быстрое",
    quickMeta: "3 раунда · 15–20 минут",
    fullLabel: "Полное",
    fullMeta: "5 раундов · 35–60 минут",
    addHome: "Добавить на главный экран",
    homeHint: "Открывай игру как обычное приложение во время следующих посещений.",
  },
  en: {
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
    tinyMission: "Tiny mission",
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
  { id: "solo", icon: "◯", label: { ru: "Solo", en: "Solo" }, text: { ru: "Личное путешествие", en: "A personal journey" } },
  { id: "together", icon: "◯◯", label: { ru: "Вместе", en: "Together" }, text: { ru: "Для пары или друзей", en: "For a pair or friends" } },
  { id: "family", icon: "⌂", label: { ru: "Семья", en: "Family" }, text: { ru: "Понятно детям", en: "Child-friendly prompts" } },
  { id: "group", icon: "✦", label: { ru: "Группа", en: "Group" }, text: { ru: "Один телефон на всех", en: "One phone for everyone" } },
];

const modeCue: Record<PlayerMode, { ru: string; en: string }> = {
  solo: { ru: "Ответь себе — здесь нет правильного варианта.", en: "Answer for yourself—there is no correct response." },
  together: { ru: "Сначала ответьте отдельно, затем сравните, что увидели по-разному.", en: "Answer separately, then compare what you saw differently." },
  family: { ru: "Пусть первым ответит самый младший участник. Любой ответ подходит.", en: "Let the youngest explorer answer first. Every answer works." },
  group: { ru: "Каждый предлагает ответ, затем группа выбирает самый неожиданный.", en: "Everyone suggests an answer, then choose the most surprising one." },
};

function randomDifferentCard(roundId: RoundId, current?: string) {
  const cards = getRound(roundId).cards.filter((item) => item.id !== current);
  return cards[Math.floor(Math.random() * cards.length)];
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

export default function Home() {
  const [language, setLanguage] = useState<Language>("ru");
  const [phase, setPhase] = useState<Phase>("welcome");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [playerMode, setPlayerMode] = useState<PlayerMode>("solo");
  const [duration, setDuration] = useState<Duration>("full");
  const [museumName, setMuseumName] = useState("");
  const [selectedRounds, setSelectedRounds] = useState<RoundId[]>(rounds.map((round) => round.id));
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<AdventureCard | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [savedDraft, setSavedDraft] = useState<SavedAdventure | null>(null);
  const [isCreatingPassport, setIsCreatingPassport] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const t = ui[language];

  const currentRoundId = selectedRounds[currentRoundIndex] ?? "find";
  const currentRound = getRound(currentRoundId);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const saved = localStorage.getItem(STORAGE_KEY);
    let parsedDraft: SavedAdventure | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedAdventure;
        if (parsed.phase === "game" || parsed.phase === "summary") parsedDraft = parsed;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    const timer = window.setTimeout(() => setSavedDraft(parsedDraft), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "game" && phase !== "summary") return;
    const state: SavedAdventure = {
      phase,
      language,
      playerMode,
      duration,
      museumName,
      selectedRounds,
      currentRoundIndex,
      memories,
      startedAt,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The adventure remains usable even when the browser storage quota is full.
    }
  }, [phase, language, playerMode, duration, museumName, selectedRounds, currentRoundIndex, memories, startedAt]);

  const savedMemoryCount = useMemo(
    () => memories.filter((memory) => memory.note.trim() || memory.photo).length,
    [memories],
  );

  function startAdventure() {
    setSelectedRounds(duration === "quick" ? ["find", "imagine", "challenge"] : rounds.map((round) => round.id));
    setCurrentRoundIndex(0);
    setMemories([]);
    setSelectedCard(null);
    setNote("");
    setPhoto(undefined);
    setStartedAt(Date.now());
    setPhase("game");
  }

  function resumeAdventure() {
    if (!savedDraft) return;
    setLanguage(savedDraft.language);
    setPlayerMode(savedDraft.playerMode);
    setDuration(savedDraft.duration);
    setMuseumName(savedDraft.museumName);
    setSelectedRounds(savedDraft.selectedRounds);
    setCurrentRoundIndex(savedDraft.currentRoundIndex);
    setMemories(savedDraft.memories);
    setStartedAt(savedDraft.startedAt);
    setSelectedCard(null);
    setPhase(savedDraft.phase);
  }

  function chooseCard(cardIndex: number) {
    setSelectedCard(currentRound.cards[cardIndex]);
    setNote("");
    setPhoto(undefined);
    setMemoryOpen(false);
  }

  function chooseAnotherCard() {
    setSelectedCard(randomDifferentCard(currentRoundId, selectedCard?.id));
    setNote("");
    setPhoto(undefined);
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhoto(await compressPhoto(file));
  }

  function completeRound() {
    if (!selectedCard) return;
    const nextMemories = [
      ...memories.filter((item) => item.roundId !== currentRoundId),
      { roundId: currentRoundId, cardId: selectedCard.id, note: note.trim(), photo },
    ];
    setMemories(nextMemories);
    setSelectedCard(null);
    setNote("");
    setPhoto(undefined);
    setMemoryOpen(false);
    if (currentRoundIndex === selectedRounds.length - 1) {
      setPhase("summary");
    } else {
      setCurrentRoundIndex((index) => index + 1);
    }
  }

  function resetAdventure() {
    localStorage.removeItem(STORAGE_KEY);
    setSavedDraft(null);
    setMemories([]);
    setSelectedCard(null);
    setCurrentRoundIndex(0);
    setSetupStep(1);
    setPhase("setup");
  }

  function goHome() {
    if (phase === "game" || phase === "summary") {
      setSavedDraft({
        phase,
        language,
        playerMode,
        duration,
        museumName,
        selectedRounds,
        currentRoundIndex,
        memories,
        startedAt,
      });
    }
    setPhase("welcome");
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
    context.font = "800 78px Arial";
    context.fillText("MUSEUM PASSPORT", 540, 205);
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
      context.fillText(`${round.icon}  ${round.label[language].toUpperCase()}`, 125, y + 43);
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

  async function savePassport() {
    setIsCreatingPassport(true);
    try {
      const blob = await createPassportBlob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "museum-adventure-passport.png";
      link.click();
      URL.revokeObjectURL(link.href);
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
        ? `Я прошёл музейное приключение: ${memories.length} произведений и ${savedMemoryCount} сохранённых воспоминаний.`
        : `I completed a Museum Adventure: ${memories.length} artworks and ${savedMemoryCount} saved memories.`;
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: "Museum Adventure", text, files: [file] });
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
          <div className="language-switch" aria-label="Language">
            <button className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>RU</button>
            <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
          </div>
        </header>

        {phase === "welcome" && (
          <div className="screen welcome-screen">
            <div className="hero-emblem" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="hero-star">✦</span>
            </div>
            <p className="eyebrow">Museum Adventure Cards</p>
            <h1>{t.tagline}</h1>
            <p className="lead">{t.intro}</p>
            <div className="round-ribbon" aria-label="Five rounds">
              {rounds.map((round) => (
                <span key={round.id} style={{ backgroundColor: round.color }} title={round.label[language]}>{round.icon}</span>
              ))}
            </div>
            <div className="welcome-actions">
              <button className="primary-button" onClick={() => setPhase("setup")}>{t.start}<span>→</span></button>
              {savedDraft && <button className="text-button" onClick={resumeAdventure}>{t.resume}</button>}
            </div>
            <p className="privacy-note"><span>⌁</span>{t.private}</p>
          </div>
        )}

        {phase === "setup" && (
          <div className="screen setup-screen">
            <div className="step-indicator"><span className="active" /><span className={setupStep === 2 ? "active" : ""} /></div>
            {setupStep === 1 ? (
              <>
                <p className="eyebrow">01 · {language === "ru" ? "Команда" : "Your company"}</p>
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
                <label className="museum-field">
                  <span>{t.museum} <small>· {t.optional}</small></span>
                  <input value={museumName} onChange={(event) => setMuseumName(event.target.value)} placeholder={language === "ru" ? "Например, Новая Третьяковка" : "For example, Tate Modern"} />
                </label>
                <button className="primary-button bottom-button" onClick={startAdventure}>{t.begin}<span>→</span></button>
              </>
            )}
          </div>
        )}

        {phase === "game" && (
          <div className="screen game-screen" style={{ "--round-color": currentRound.color, "--round-soft": currentRound.soft } as React.CSSProperties}>
            <div className="game-progress">
              <span>{language === "ru" ? "Раунд" : "Round"} {currentRoundIndex + 1} {t.of} {selectedRounds.length}</span>
              <div>{selectedRounds.map((id, index) => <i key={id} className={index <= currentRoundIndex ? "active" : ""} style={{ backgroundColor: index <= currentRoundIndex ? getRound(id).color : undefined }} />)}</div>
            </div>

            {!selectedCard ? (
              <div className="deck-screen">
                <div className="round-heading"><span>{currentRound.icon}</span><p>{currentRound.label[language]}</p></div>
                <h2>{t.draw}</h2>
                <p>{currentRound.instruction[language]}</p>
                <div className="card-deck" aria-label={t.draw}>
                  {currentRound.cards.map((cardItem, index) => (
                    <button key={cardItem.id} onClick={() => chooseCard(index)} aria-label={`${t.draw} ${index + 1}`}>
                      <span>{currentRound.icon}</span><small>{String(index + 1).padStart(2, "0")}</small>
                    </button>
                  ))}
                </div>
                <p className="deck-hint">{language === "ru" ? "Доверься случайности — все карты подходят для любого художественного музея." : "Trust chance—every card works in any art museum."}</p>
              </div>
            ) : (
              <div className="mission-screen">
                <article className="mission-card">
                  <div className="mission-card-top"><span className="mission-icon">{currentRound.icon}</span><span>{currentRound.label[language]}</span><small>{selectedCard.id.split("-")[1].padStart(2, "0")} / 10</small></div>
                  <h2>{selectedCard.prompt[language]}</h2>
                  <div className="tiny-mission"><span>✦</span><div><small>{t.tinyMission}</small><p>{selectedCard.mission[language]}</p></div></div>
                  <p className="mode-cue">{modeCue[playerMode][language]}</p>
                </article>

                <button className={`memory-toggle ${memoryOpen ? "open" : ""}`} onClick={() => setMemoryOpen((open) => !open)}>
                  <span className="memory-plus">{memoryOpen ? "−" : "+"}</span><span><strong>{t.memory}</strong><small>{t.memoryHint}</small></span><span>⌄</span>
                </button>
                {memoryOpen && (
                  <div className="memory-panel">
                    <input ref={fileInput} className="file-input" type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
                    {photo ? (
                      <button className="photo-preview" onClick={() => fileInput.current?.click()}><img src={photo} alt="Museum memory" /><span>{t.changePhoto}</span></button>
                    ) : (
                      <button className="photo-button" onClick={() => fileInput.current?.click()}><span>▣</span>{t.addPhoto}</button>
                    )}
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.notePlaceholder} maxLength={240} />
                    <small className="character-count">{note.length}/240</small>
                  </div>
                )}
                <div className="mission-actions">
                  <button className="secondary-button" onClick={chooseAnotherCard}>↻ {t.another}</button>
                  <button className="primary-button" onClick={completeRound}>{currentRoundIndex === selectedRounds.length - 1 ? t.finish : t.done}<span>→</span></button>
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
            <div className="summary-stats"><span><strong>{memories.length}</strong>{t.explored}</span><i /><span><strong>{savedMemoryCount}</strong>{t.memoriesSaved}</span></div>
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
                      <div className="route-copy"><small style={{ color: round.color }}>{round.label[language]}</small><strong>{savedCard.prompt[language]}</strong><p>{memory.note || t.noNote}</p></div>
                      {memory.photo && <img src={memory.photo} alt="Saved museum moment" />}
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
            <div className="home-tip"><span className="brand-mark">MA</span><div><strong>{t.addHome}</strong><p>{t.homeHint}</p></div></div>
          </div>
        )}
      </section>
    </main>
  );
}
