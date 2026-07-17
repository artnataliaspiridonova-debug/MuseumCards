export type Language = "ru" | "en";
export type RoundId = "find" | "observe" | "imagine" | "create" | "challenge";

export type LocalizedText = { ru: string; en: string };

export type AdventureCard = {
  id: string;
  prompt: LocalizedText;
  mission: LocalizedText;
};

export type AdventureRound = {
  id: RoundId;
  label: LocalizedText;
  instruction: LocalizedText;
  icon: string;
  color: string;
  soft: string;
  cards: AdventureCard[];
};

const card = (
  id: string,
  ru: string,
  en: string,
  missionRu: string,
  missionEn: string,
): AdventureCard => ({
  id,
  prompt: { ru, en },
  mission: { ru: missionRu, en: missionEn },
});

export const rounds: AdventureRound[] = [
  {
    id: "find",
    label: { ru: "Найди", en: "Find" },
    instruction: {
      ru: "Выбери одну из десяти закрытых карт и найди подходящее произведение.",
      en: "Choose one of ten hidden cards and find a matching artwork.",
    },
    icon: "⌕",
    color: "#173f67",
    soft: "#e7eff6",
    cards: [
      card("find-1", "Найди произведение с животным", "Find an artwork with an animal", "Какое оно: спокойное, сильное, маленькое, спрятанное, настоящее или вымышленное?", "Is it calm, strong, small, hidden, real or imaginary?"),
      card("find-2", "Найди произведение, в котором чувствуется сильное движение", "Find an artwork showing strong movement", "Ищи действие, поток или энергию.", "Look for action, flow or energy."),
      card("find-3", "Найди произведение с сильной эмоцией", "Find an artwork with a strong emotion", "Что чувствует эта работа или что чувствуешь ты?", "What feeling does the artwork show?"),
      card("find-4", "Найди произведение, которое кажется загадочным", "Find an artwork that feels mysterious", "Обрати внимание на подсказки, тени и скрытые детали.", "Look for clues, shadows or hidden details."),
      card("find-5", "Найди произведение, где преобладает один цвет", "Find an artwork dominated by one color", "Посмотри, где этот цвет становится темнее или светлее.", "Notice where that color becomes darker or lighter."),
      card("find-6", "Найди произведение с интересной фактурой", "Find an artwork with an interesting texture", "Она кажется гладкой, неровной, мягкой или многослойной?", "Does it feel smooth, rough, soft or layered?"),
      card("find-7", "Найди произведение с одним главным героем", "Find an artwork with one main character", "Кто здесь самый важный и почему?", "Who is the most important person here?"),
      card("find-8", "Найди произведение, где много людей", "Find an artwork with many people", "Сколько разных историй может происходить одновременно?", "How many different stories might be happening?"),
      card("find-9", "Найди произведение, где кто-то занят делом", "Find an artwork where people are doing something", "Ищи действие, работу, игру или праздник.", "Look for action, work, play or celebration."),
      card("find-10", "Найди произведение, которое ты хотел бы забрать домой", "Find an artwork you would like to take home", "Почему ты выбрал именно его?", "Why would you choose this one?"),
    ],
  },
  {
    id: "observe",
    label: { ru: "Рассмотри", en: "Observe" },
    instruction: {
      ru: "Остановись у выбранного произведения и дай глазам время заметить больше.",
      en: "Pause at your chosen artwork and give your eyes time to notice more.",
    },
    icon: "◉",
    color: "#174c37",
    soft: "#e8f1eb",
    cards: [
      card("observe-1", "Какую деталь ты заметил первой?", "What detail did you notice first?", "Почему взгляд остановился именно на ней?", "Why do you think your eyes went there?"),
      card("observe-2", "Какую деталь другие посетители могут не заметить?", "Which detail might other visitors miss?", "Внимательно осмотрись, прежде чем отвечать.", "Look carefully before answering."),
      card("observe-3", "Если бы можно было войти в это произведение, где бы ты встал?", "If you could step into this artwork, where would you stand?", "Выбери место внутри сцены.", "Choose your place inside the scene."),
      card("observe-4", "Какую самую маленькую деталь ты можешь найти?", "What is the smallest detail you can find?", "Подойди ближе, если это разрешено.", "Look closer, if the museum allows it."),
      card("observe-5", "Что изменилось, когда ты посмотрел дольше?", "What changed when you looked longer?", "Найди то, чего не заметил вначале.", "Find something you did not notice at first."),
      card("observe-6", "Какая часть произведения снова притягивает твой взгляд?", "Which part of the artwork keeps pulling your attention back?", "Что делает её такой интересной?", "What makes it so interesting?"),
      card("observe-7", "Что происходит на заднем плане?", "What is happening in the background?", "Какую историю рассказывают маленькие детали?", "What story do the small details tell?"),
      card("observe-8", "Как ты думаешь, что происходит в этой сцене?", "What scene do you think is happening here?", "Опиши это одним предложением.", "Describe it in one sentence."),
      card("observe-9", "Какое настроение у этой сцены?", "What mood does this scene have?", "Какие цвета, лица или линии создают его?", "What colors, faces or lines create it?"),
      card("observe-10", "Если бы ты мог задать произведению один вопрос, что бы ты спросил?", "If you could ask this artwork one question, what would it be?", "Сначала внимательно рассмотри работу.", "Look carefully before choosing."),
    ],
  },
  {
    id: "imagine",
    label: { ru: "Представь", en: "Imagine" },
    instruction: {
      ru: "Позволь произведению выйти за пределы рамы — добавь звуки, запахи и историю.",
      en: "Let the artwork move beyond its frame—add sounds, scents and a story.",
    },
    icon: "☁",
    color: "#d86220",
    soft: "#fff0e5",
    cards: [
      card("imagine-1", "Как может пахнуть это произведение?", "What do you think it smells like here?", "Представь настоящий запах этого места.", "Imagine this artwork as a real place."),
      card("imagine-2", "Какие звуки могли бы принадлежать этому произведению?", "What sounds might belong to this artwork?", "Прислушайся к ним в воображении.", "Listen with your imagination."),
      card("imagine-3", "Что произошло за мгновение до этой сцены?", "What happened just before this moment?", "Представь предыдущий кадр истории.", "Imagine the scene one moment earlier."),
      card("imagine-4", "Что произойдёт дальше?", "What do you think will happen next?", "Продолжи историю одним событием.", "Imagine the next part of the story."),
      card("imagine-5", "Если бы произведение ожило, что задвигалось бы первым?", "If this artwork came to life, what would move first?", "Выбери одну деталь и опиши движение.", "Choose one thing and describe its movement."),
      card("imagine-6", "Какие отношения связывают эти формы, предметы или фигуры?", "What relationship do these shapes, objects or figures have?", "Как они взаимодействуют друг с другом?", "How do they interact with each other?"),
      card("imagine-7", "Какое название ты дал бы этому произведению?", "If this artwork had a title of your own, what would it be?", "Придумай название для своей версии истории.", "Choose a title that matches your story."),
      card("imagine-8", "Какую тайну может скрывать это произведение?", "What secret might this artwork be hiding?", "Найди деталь, которая может быть подсказкой.", "Find a detail that could be a clue."),
      card("imagine-9", "Если бы произведение могло говорить, что бы оно сказало?", "If this artwork could speak, what would it say?", "Представь его первое предложение.", "Imagine its first sentence."),
      card("imagine-10", "Если бы ты был художником, что бы ты изменил?", "If you were the artist, what would you change?", "Что ты добавил бы или убрал?", "What would you add or remove, and why?"),
    ],
  },
  {
    id: "create",
    label: { ru: "Создай", en: "Create" },
    instruction: {
      ru: "Ответь на произведение собственной маленькой творческой идеей.",
      en: "Respond to the artwork with a small creative idea of your own.",
    },
    icon: "✎",
    color: "#d49b00",
    soft: "#fff8db",
    cards: [
      card("create-1", "Нарисуй для произведения одну новую деталь", "Draw one new detail for this artwork", "Добавь то, что принадлежит этой сцене.", "Add something that belongs in the scene."),
      card("create-2", "Придумай новое название и короткую музейную подпись", "Create a new title and a museum label", "Напиши одно предложение для посетителей.", "Write one sentence for museum visitors."),
      card("create-3", "Придумай нового героя для этого произведения", "Design a new character for this artwork", "Нарисуй или опиши его.", "Draw or describe them."),
      card("create-4", "Полностью измени один цвет", "Change one color completely", "Как это изменит настроение работы?", "How would it change the artwork's mood?"),
      card("create-5", "Создай недостающую часть произведения", "Create a missing part of the artwork", "Что могло бы находиться за рамой?", "What might be outside the frame?"),
      card("create-6", "Перенеси произведение в другое время года", "Turn this artwork into a different season", "Что изменится первым?", "What would change first?"),
      card("create-7", "Добавь облачко с репликой", "Create a speech bubble", "Что мог бы сказать герой?", "What would a character say?"),
      card("create-8", "Соедини это произведение с другим", "Combine this artwork with another one", "Что произошло бы при их встрече?", "What would happen if they met?"),
      card("create-9", "Сделай быстрый набросок по мотивам произведения", "Make a quick sketch inspired by this artwork", "Используй только линии и формы.", "Use only shapes and lines."),
      card("create-10", "Повтори движение из произведения", "Recreate a movement from this artwork", "Попробуй повторить позу или жест.", "Use your body to copy the pose or gesture."),
    ],
  },
  {
    id: "challenge",
    label: { ru: "Испытай себя", en: "Challenge" },
    instruction: {
      ru: "Свяжи выбранное произведение с музеем, другими работами и собственным взглядом.",
      en: "Connect your artwork with the museum, other works and your own point of view.",
    },
    icon: "★",
    color: "#8d2630",
    soft: "#f7e9e9",
    cards: [
      card("challenge-1", "Найди произведение, которое могло бы быть частью той же истории", "Find an artwork that belongs in the same story as yours", "Что их связывает?", "What connects them?"),
      card("challenge-2", "Представь, что ты куратор: найди работу, которая идеально смотрелась бы рядом", "Imagine you are a curator. Find another artwork that would look perfect next to yours", "Почему ты выбрал именно её?", "Why did you choose it?"),
      card("challenge-3", "Найди произведение, полностью противоположное твоему", "Find an artwork that is the complete opposite of yours", "Чем они отличаются сильнее всего?", "What makes them different?"),
      card("challenge-4", "Найди другое произведение на похожую тему", "Find another artwork about a similar theme", "Что у них общего?", "What do they have in common?"),
      card("challenge-5", "Найди одну общую деталь в своём и другом произведении", "Find a shared detail in your artwork and another one", "Это может быть цвет, форма, предмет или жест.", "It could be a color, shape, object or gesture."),
      card("challenge-6", "Найди другую работу того же автора или с похожим названием", "Find another artwork by the same artist or with a similar title", "Сравни два произведения.", "Compare the two artworks."),
      card("challenge-7", "Представь себя куратором: где бы ты разместил эту работу на своей выставке?", "Imagine you are a curator. Where would you place this artwork in your exhibition?", "Выбери место и объясни почему.", "Choose a place and explain why."),
      card("challenge-8", "Представь, что ты художник. Как бы ты описал работу в интервью?", "Imagine you are the artist. How would you describe this artwork in an interview?", "Ответь двумя предложениями.", "Answer in two sentences."),
      card("challenge-9", "Представь себя арт-критиком и напиши короткий отзыв", "Imagine you are an art critic. Write a short review of this artwork", "Используй пять предложений или меньше.", "Use five sentences or fewer."),
      card("challenge-10", "Ты управляешь музейным магазином. Какой товар ты создал бы по мотивам работы?", "Imagine you lead the museum gift shop. What product would you create using this artwork?", "Почему посетители захотят его купить?", "Why would visitors want it?"),
    ],
  },
];

export const getRound = (id: RoundId) => rounds.find((round) => round.id === id)!;

