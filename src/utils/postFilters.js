export const COMIC_GENRES = [
  "Экшн", "Романтика", "Фэнтези", "Научпоп", "Комедия", "Драма",
  "Хоррор", "Детектив", "Приключения", "Киберпанк", "Мистика", "Повседневность",
];

export const PRESET_TAGS = [
  "Веб-комикс", "Манга", "Графический роман", "Стрип", "Лонгрид",
  "По подписке", "Бесплатно",
];

export function normalizeTags(post) {
  if (Array.isArray(post?.tags)) return post.tags;
  if (typeof post?.tags === "string") {
    try {
      return JSON.parse(post.tags);
    } catch {
      return [];
    }
  }
  return [];
}

export function getCoAuthorIds(post) {
  if (Array.isArray(post?.co_author_ids)) return post.co_author_ids.map(Number);
  if (typeof post?.co_author_ids === "string") {
    try {
      const parsed = JSON.parse(post.co_author_ids);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function postGenres(post) {
  return normalizeTags(post).filter((t) => COMIC_GENRES.includes(t));
}

export function isProfileWork(post, profileId) {
  const id = Number(profileId);
  return Number(post.user_id) === id || getCoAuthorIds(post).includes(id);
}

function matchesSearch(post, q) {
  if (!q) return true;
  const title = (post.title || "").toLowerCase();
  const author = (post.user?.name || "").toLowerCase();
  const tags = normalizeTags(post);
  const genres = postGenres(post);
  const tagMatch = tags.some((t) => String(t).toLowerCase().includes(q));
  const genreMatch = genres.some((g) => g.toLowerCase().includes(q));
  return title.includes(q) || author.includes(q) || tagMatch || genreMatch;
}

function matchesTagsAndGenre(post, selectedGenre, selectedTags) {
  const tags = normalizeTags(post);
  const genres = postGenres(post);
  if (selectedGenre && !genres.includes(selectedGenre)) return false;
  if (selectedTags.length > 0 && !selectedTags.every((t) => tags.includes(t))) return false;
  return true;
}

export function filterFeedPosts(posts, { searchTerm, selectedGenre, selectedTags, statusFilter }) {
  const q = searchTerm.trim().toLowerCase();
  return posts.filter((post) => {
    if (post.type && post.type !== "comic") return false;
    if (statusFilter && post.comic_status !== statusFilter) return false;
    if (!matchesTagsAndGenre(post, selectedGenre, selectedTags)) return false;
    return matchesSearch(post, q);
  });
}

export function filterProfilePosts(posts, profileId, filters) {
  const id = Number(profileId);
  const q = filters.searchTerm?.trim().toLowerCase() || "";
  return posts.filter((post) => {
    if (!isProfileWork(post, id)) return false;
    if (!matchesTagsAndGenre(post, filters.selectedGenre, filters.selectedTags || [])) return false;
    return matchesSearch(post, q);
  });
}

export function collectFeedTagChips(posts, selectedGenre) {
  const fromPosts = new Set();
  posts.forEach((post) => {
    if (post.type && post.type !== "comic") return;
    const genres = postGenres(post);
    if (selectedGenre && !genres.includes(selectedGenre)) return;
    normalizeTags(post).forEach((t) => {
      if (selectedGenre && COMIC_GENRES.includes(t) && t !== selectedGenre) return;
      fromPosts.add(t);
    });
  });

  const chips = [];
  PRESET_TAGS.forEach((t) => chips.push(t));
  Array.from(fromPosts)
    .filter((t) => !PRESET_TAGS.includes(t))
    .sort((a, b) => a.localeCompare(b, "ru"))
    .forEach((t) => {
      if (!chips.includes(t)) chips.push(t);
    });
  return chips;
}

export function collectProfileTagChips(posts, profileId, selectedGenre) {
  const filtered = filterProfilePosts(posts, profileId, {
    searchTerm: "",
    selectedGenre,
    selectedTags: [],
  });
  const tagSet = new Set();
  filtered.forEach((post) => {
    normalizeTags(post).forEach((t) => {
      if (selectedGenre && COMIC_GENRES.includes(t) && t !== selectedGenre) return;
      tagSet.add(t);
    });
  });
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "ru"));
}
