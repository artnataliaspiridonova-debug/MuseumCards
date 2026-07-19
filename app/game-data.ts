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
      ru: "Вытяните карту и найдите произведение, которое подходит к заданию.",
      en: "Choose one of ten hidden cards and find a matching artwork.",
    },
    icon: "⌕",
    color: "#173f67",
    soft: "#e7eff6",
    cards: [
      card("find-1", "Найдите произведение с изображением животного", "Find an artwork with an animal", "Опишите его: оно кажется спокойным или сильным, реальным или вымышленным, маленьким или большим, опасным или дружелюбным?", "Is it calm, strong, small, hidden, real or imaginary?"),
      card("find-2", "Найдите произведение, передающее сильное движение", "Find an artwork showing strong movement", "Опишите это движение. Какие детали, линии или цвета создают его ощущение?", "Look for action, flow or energy."),
      card("find-3", "Найдите произведение, вызывающее сильную эмоцию", "Find an artwork with a strong emotion", "Назовите эту эмоцию и попробуйте объяснить, что именно её вызывает.", "What feeling does the artwork show?"),
      card("find-4", "Найдите произведение, которое кажется вам загадкой", "Find an artwork that feels mysterious", "Обратите внимание на тени, намёки и скрытые детали.", "Look for clues, shadows or hidden details."),
      card("find-5", "Найдите произведение, в котором преобладает один цвет", "Find an artwork dominated by one color", "Проследите, как он меняется и где становится темнее или светлее.", "Notice where that color becomes darker or lighter."),
      card("find-6", "Найдите живописную работу, в которой хорошо видны мазки или движение кисти", "Find an artwork with an interesting texture", "Представьте и опишите движения руки художника.", "Does it feel smooth, rough, soft or layered?"),
      card("find-7", "Найдите произведение с одним главным героем", "Find an artwork with one main character", "Опишите его и объясните, почему именно он кажется главным.", "Who is the most important person here?"),
      card("find-8", "Найдите произведение, на котором изображено много людей", "Find an artwork with many people", "Какие истории могут происходить здесь одновременно?", "How many different stories might be happening?"),
      card("find-9", "Найдите произведение, герои которого чем-то заняты", "Find an artwork where people are doing something", "Опишите, что они делают.", "Look for action, work, play or celebration."),
      card("find-10", "Найдите произведение, которое вам хотелось бы забрать домой", "Find an artwork you would like to take home", "Почему вы выбрали именно его?", "Why would you choose this one?"),
    ],
  },
  {
    id: "observe",
    label: { ru: "Посмотри внимательно", en: "Observe" },
    instruction: {
      ru: "Остановитесь у выбранного произведения и дайте себе время заметить больше.",
      en: "Pause at your chosen artwork and give your eyes time to notice more.",
    },
    icon: "◉",
    color: "#174c37",
    soft: "#e8f1eb",
    cards: [
      card("observe-1", "Какую деталь вы заметили первой?", "What detail did you notice first?", "Что именно привлекло ваше внимание?", "Why do you think your eyes went there?"),
      card("observe-2", "Какую деталь другие посетители могут не заметить?", "Which detail might other visitors miss?", "Сначала внимательно рассмотрите произведение.", "Look carefully before answering."),
      card("observe-3", "Если бы вы могли войти внутрь произведения", "If you could step into this artwork, where would you stand?", "Где находился бы вход и куда бы вы попали?", "Choose your place inside the scene."),
      card("observe-4", "Какую самую маленькую деталь вы можете найти?", "What is the smallest detail you can find?", "Подойдите ближе, если правила музея это разрешают.", "Look closer, if the museum allows it."),
      card("observe-5", "Проведите перед произведением одну минуту", "What changed when you looked longer?", "Какие детали вы заметили только спустя некоторое время?", "Find something you did not notice at first."),
      card("observe-6", "Какая часть произведения снова и снова притягивает ваш взгляд?", "Which part of the artwork keeps pulling your attention back?", "Что делает её такой интересной?", "What makes it so interesting?"),
      card("observe-7", "Что происходит на заднем плане?", "What is happening in the background?", "Какую историю рассказывают небольшие детали?", "What story do the small details tell?"),
      card("observe-8", "Как вы думаете, что происходит в этой сцене?", "What scene do you think is happening here?", "Опишите её одним предложением.", "Describe it in one sentence."),
      card("observe-9", "Какое настроение создаёт это произведение?", "What mood does this scene have?", "Какие цвета, линии, формы или выражения лиц его передают?", "What colors, faces or lines create it?"),
      card("observe-10", "Какой вопрос вы задали бы этому произведению?", "If you could ask this artwork one question, what would it be?", "Сначала внимательно его рассмотрите.", "Look carefully before choosing."),
    ],
  },
  {
    id: "imagine",
    label: { ru: "Представь", en: "Imagine" },
    instruction: {
      ru: "Расширьте пространство произведения: добавьте к нему звуки, запахи, движение и историю.",
      en: "Let the artwork move beyond its frame—add sounds, scents and a story.",
    },
    icon: "☁",
    color: "#d86220",
    soft: "#fff0e5",
    cards: [
      card("imagine-1", "Представьте, что вы оказались внутри произведения", "What do you think it smells like here?", "Какой запах лучше всего передаёт атмосферу этого места?", "Imagine this artwork as a real place."),
      card("imagine-2", "Какие звуки могли бы звучать внутри этого произведения?", "What sounds might belong to this artwork?", "Назовите хотя бы один.", "Listen with your imagination."),
      card("imagine-3", "Что произошло за мгновение до этой сцены?", "What happened just before this moment?", "Представьте предыдущий кадр этой истории.", "Imagine the scene one moment earlier."),
      card("imagine-4", "Что произойдёт дальше?", "What do you think will happen next?", "Продолжите историю одним событием.", "Imagine the next part of the story."),
      card("imagine-5", "Если бы произведение ожило, что начало бы двигаться первым?", "If this artwork came to life, what would move first?", "Выберите одну деталь и опишите её движение.", "Choose one thing and describe its movement."),
      card("imagine-6", "Представьте, что все формы, предметы и фигуры в произведении связаны между собой", "What relationship do these shapes, objects or figures have?", "Что движется навстречу друг другу, а что отдаляется? Какие чувства или напряжения возникают между ними?", "How do they interact with each other?"),
      card("imagine-7", "Как можно назвать эту картину?", "If this artwork had a title of your own, what would it be?", "Придумайте своё название для своей версии истории.", "Choose a title that matches your story."),
      card("imagine-8", "Представьте, что произведение скрывает тайну", "What secret might this artwork be hiding?", "Найдите деталь, которая могла бы стать подсказкой.", "Find a detail that could be a clue."),
      card("imagine-9", "Представьте, что произведение умеет говорить", "If this artwork could speak, what would it say?", "Какой была бы его первая фраза?", "Imagine its first sentence."),
      card("imagine-10", "Представьте себя автором этого произведения", "If you were the artist, what would you change?", "Что вы добавили бы или убрали? Почему?", "What would you add or remove, and why?"),
    ],
  },
  {
    id: "create",
    label: { ru: "Создай", en: "Create" },
    instruction: {
      ru: "Ответьте на произведение собственной творческой идеей.",
      en: "Respond to the artwork with a small creative idea of your own.",
    },
    icon: "✎",
    color: "#d49b00",
    soft: "#fff8db",
    cards: [
      card("create-1", "Добавьте к произведению одну новую деталь", "Draw one new detail for this artwork", "Нарисуйте или опишите то, что могло бы стать частью этой работы.", "Add something that belongs in the scene."),
      card("create-2", "Придумайте новое название и короткую музейную подпись", "Create a new title and a museum label", "Напишите одно предложение для посетителей.", "Write one sentence for museum visitors."),
      card("create-3", "Придумайте нового героя для этого произведения", "Design a new character for this artwork", "Нарисуйте или опишите его.", "Draw or describe them."),
      card("create-4", "Полностью измените один цвет", "Change one color completely", "Как это повлияет на настроение произведения?", "How would it change the artwork's mood?"),
      card("create-5", "Создайте недостающую часть произведения", "Create a missing part of the artwork", "Что могло бы находиться за его пределами?", "What might be outside the frame?"),
      card("create-6", "Представьте это произведение в другое время года", "Turn this artwork into a different season", "Что изменится?", "What would change first?"),
      card("create-7", "Добавьте героям реплики, как в комиксе", "Create a speech bubble", "Что они могли бы сказать?", "What would a character say?"),
      card("create-8", "Создайте короткий рассказ на основе произведения", "Combine this artwork with another one", "Запишите его или расскажите вслух.", "What would happen if they met?"),
      card("create-9", "Сделайте быстрый набросок по мотивам произведения", "Make a quick sketch inspired by this artwork", "Используйте только линии и формы.", "Use only shapes and lines."),
      card("create-10", "Повторите движение, позу или жест", "Recreate a movement from this artwork", "Выберите то, что изображено в произведении.", "Use your body to copy the pose or gesture."),
    ],
  },
  {
    id: "challenge",
    label: { ru: "Брось себе вызов", en: "Challenge" },
    instruction: {
      ru: "Свяжите выбранное произведение с другими работами, пространством музея и собственным взглядом.",
      en: "Connect your artwork with the museum, other works and your own point of view.",
    },
    icon: "★",
    color: "#8d2630",
    soft: "#f7e9e9",
    cards: [
      card("challenge-1", "Представьте себя фотографом", "Find an artwork that belongs in the same story as yours", "Сделайте снимок, используя выбранное произведение как визуальную отправную точку.", "What connects them?"),
      card("challenge-2", "Представьте себя куратором. Найдите произведение, которое стоило бы разместить рядом", "Imagine you are a curator. Find another artwork that would look perfect next to yours", "Объясните свой выбор.", "Why did you choose it?"),
      card("challenge-3", "Найдите произведение, которое кажется полной противоположностью выбранному", "Find an artwork that is the complete opposite of yours", "В чём заключается главное различие между ними?", "What makes them different?"),
      card("challenge-4", "Найдите другое произведение на похожую тему", "Find another artwork about a similar theme", "Что общего у этих работ?", "What do they have in common?"),
      card("challenge-5", "Представьте себя коллекционером", "Find a shared detail in your artwork and another one", "Какой была бы ваша коллекция и стало бы это произведение её частью?", "It could be a color, shape, object or gesture."),
      card("challenge-6", "Представьте, что вы продаёте это произведение на аукционе", "Find another artwork by the same artist or with a similar title", "Объясните, почему оно заслуживает высокой цены.", "Compare the two artworks."),
      card("challenge-7", "Представьте себя куратором", "Imagine you are a curator. Where would you place this artwork in your exhibition?", "Выберите место в музее, где вы разместили бы это произведение. Объясните своё решение.", "Choose a place and explain why."),
      card("challenge-8", "Представьте себя автором произведения", "Imagine you are the artist. How would you describe this artwork in an interview?", "Расскажите о своей работе журналистам в трёх предложениях.", "Answer in two sentences."),
      card("challenge-9", "Представьте себя арт-критиком и напишите короткую заметку для журнала", "Imagine you are an art critic. Write a short review of this artwork", "Уложитесь в пять предложений.", "Use five sentences or fewer."),
      card("challenge-10", "Придумайте товар для музейного магазина по мотивам этой работы", "Imagine you lead the museum gift shop. What product would you create using this artwork?", "Что это будет и почему посетителям захочется это купить?", "Why would visitors want it?"),
    ],
  },
];

export const getRound = (id: RoundId) => rounds.find((round) => round.id === id)!;
