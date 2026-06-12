// src/utils/achievements.js

export const ACHIEVEMENT_CATEGORIES = {
  reader: { 
    label: "Читатель", 
    icon: "BookOpen",
    color: "#3b82f6",
    description: "Достижения за чтение комиксов"
  },
  creator: { 
    label: "Создатель", 
    icon: "PenTool",
    color: "#f59e0b",
    description: "Достижения за создание контента"
  },
  social: { 
    label: "Социальные", 
    icon: "Users",
    color: "#8b5cf6",
    description: "Достижения за взаимодействие"
  },
  special: { 
    label: "Особые", 
    icon: "Star",
    color: "#ec4899",
    description: "Особые достижения"
  }
};

export const ALL_ACHIEVEMENTS = [
  // Читательские достижения
  {
    id: "first_read",
    type: "reader",
    title: "Первый шаг",
    description: "Прочитайте первую главу",
    requirement: 1,
    unit: "глав",
    icon: "Eye",
    rarity: "common"
  },
  {
    id: "reader_10",
    type: "reader",
    title: "Начинающий читатель",
    description: "Прочитайте 10 глав",
    requirement: 10,
    unit: "глав",
    icon: "BookOpen",
    rarity: "common"
  },
  {
    id: "reader_50",
    type: "reader",
    title: "Заядлый читатель",
    description: "Прочитайте 50 глав",
    requirement: 50,
    unit: "глав",
    icon: "BookOpen",
    rarity: "rare"
  },
  {
    id: "reader_100",
    type: "reader",
    title: "Книжный червь",
    description: "Прочитайте 100 глав",
    requirement: 100,
    unit: "глав",
    icon: "Library",
    rarity: "epic"
  },
  {
    id: "reader_500",
    type: "reader",
    title: "Легенда чтения",
    description: "Прочитайте 500 глав",
    requirement: 500,
    unit: "глав",
    icon: "Crown",
    rarity: "legendary"
  },
  {
    id: "complete_comic",
    type: "reader",
    title: "Завершитель",
    description: "Полностью прочитайте комикс",
    requirement: 1,
    unit: "комиксов",
    icon: "CheckCircle2",
    rarity: "rare"
  },
  {
    id: "complete_5_comics",
    type: "reader",
    title: "Коллекционер",
    description: "Полностью прочитайте 5 комиксов",
    requirement: 5,
    unit: "комиксов",
    icon: "CheckCircle2",
    rarity: "epic"
  },
  {
    id: "complete_10_comics",
    type: "reader",
    title: "Мастер-читатель",
    description: "Полностью прочитайте 10 комиксов",
    requirement: 10,
    unit: "комиксов",
    icon: "Trophy",
    rarity: "legendary"
  },

  // Создательские достижения
  {
    id: "first_comic",
    type: "creator",
    title: "Дебют",
    description: "Опубликуйте первый комикс",
    requirement: 1,
    unit: "комикс",
    icon: "PenTool",
    rarity: "common"
  },
  {
    id: "five_comics",
    type: "creator",
    title: "Новичок",
    description: "Опубликуйте 5 комиксов",
    requirement: 5,
    unit: "комиксов",
    icon: "PenTool",
    rarity: "rare"
  },
  {
    id: "ten_comics",
    type: "creator",
    title: "Мастер",
    description: "Опубликуйте 10 комиксов",
    requirement: 10,
    unit: "комиксов",
    icon: "PenTool",
    rarity: "epic"
  },
  {
    id: "first_chapter",
    type: "creator",
    title: "Первая глава",
    description: "Добавьте первую главу",
    requirement: 1,
    unit: "глава",
    icon: "Layers",
    rarity: "common"
  },
  {
    id: "five_chapters",
    type: "creator",
    title: "Плодовитый автор",
    description: "Добавьте 5 глав",
    requirement: 5,
    unit: "глав",
    icon: "Layers",
    rarity: "rare"
  },
  {
    id: "chapters_20",
    type: "creator",
    title: "Эпопея",
    description: "Добавьте 20 глав",
    requirement: 20,
    unit: "глав",
    icon: "Layers",
    rarity: "epic"
  },
  {
    id: "popular_comic",
    type: "creator",
    title: "Популярность",
    description: "Получите 100 лайков на комиксе",
    requirement: 100,
    unit: "лайков",
    icon: "Heart",
    rarity: "epic"
  },
  {
    id: "featured_comic",
    type: "creator",
    title: "В центре внимания",
    description: "Попадите в слайдер на главной",
    requirement: 1,
    unit: "раз",
    icon: "Rocket",
    rarity: "legendary"
  },

  // Социальные достижения
  {
    id: "first_follower",
    type: "social",
    title: "Первый подписчик",
    description: "Получите первого подписчика",
    requirement: 1,
    unit: "подписчик",
    icon: "Users",
    rarity: "common"
  },
  {
    id: "followers_10",
    type: "social",
    title: "Популярный автор",
    description: "Соберите 10 подписчиков",
    requirement: 10,
    unit: "подписчиков",
    icon: "Users",
    rarity: "rare"
  },
  {
    id: "followers_50",
    type: "social",
    title: "Звезда",
    description: "Соберите 50 подписчиков",
    requirement: 50,
    unit: "подписчиков",
    icon: "Users",
    rarity: "epic"
  },
  {
    id: "first_like",
    type: "social",
    title: "Оценщик",
    description: "Поставьте первый лайк",
    requirement: 1,
    unit: "лайк",
    icon: "ThumbsUp",
    rarity: "common"
  },
  {
    id: "ten_likes",
    type: "social",
    title: "Щедрый на лайки",
    description: "Поставьте 10 лайков",
    requirement: 10,
    unit: "лайков",
    icon: "Heart",
    rarity: "rare"
  },
  {
    id: "first_comment",
    type: "social",
    title: "Голос",
    description: "Оставьте первый комментарий",
    requirement: 1,
    unit: "комментарий",
    icon: "MessageSquare",
    rarity: "common"
  },
  {
    id: "comments_50",
    type: "social",
    title: "Болтун",
    description: "Оставьте 50 комментариев",
    requirement: 50,
    unit: "комментариев",
    icon: "MessageSquare",
    rarity: "rare"
  },

  // Особые достижения
  {
    id: "daily_streak_7",
    type: "special",
    title: "Неделя успеха",
    description: "Заходите на сайт 7 дней подряд",
    requirement: 7,
    unit: "дней",
    icon: "Flame",
    rarity: "rare"
  },
  {
    id: "daily_streak_30",
    type: "special",
    title: "Месяц силы воли",
    description: "Заходите на сайт 30 дней подряд",
    requirement: 30,
    unit: "дней",
    icon: "Flame",
    rarity: "epic"
  },
  {
    id: "daily_streak_100",
    type: "special",
    title: "Легендарная серия",
    description: "Заходите на сайт 100 дней подряд",
    requirement: 100,
    unit: "дней",
    icon: "Flame",
    rarity: "legendary"
  },
  {
    id: "veteran",
    type: "special",
    title: "Старожил",
    description: "Зарегистрированы более года",
    requirement: 365,
    unit: "дней",
    icon: "Crown",
    rarity: "legendary"
  },
  {
    id: "night_owl",
    type: "special",
    title: "Ночная сова",
    description: "Заходите на сайт после полуночи 10 раз",
    requirement: 10,
    unit: "раз",
    icon: "Moon",
    rarity: "rare"
  },
  {
    id: "early_bird",
    type: "special",
    title: "Ранняя пташка",
    description: "Заходите на сайт до 8 утра 10 раз",
    requirement: 10,
    unit: "раз",
    icon: "Sun",
    rarity: "rare"
  }
];

export const RARITY_CONFIG = {
  common: { label: "Обычное", color: "#9ca3af", bgColor: "rgba(156, 163, 175, 0.1)" },
  rare: { label: "Редкое", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" },
  epic: { label: "Эпическое", color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.1)" },
  legendary: { label: "Легендарное", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.1)" }
};