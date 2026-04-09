export const WORD_BANK: string[] = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know",
  "take", "people", "into", "year", "your", "good", "some", "could",
  "them", "see", "other", "than", "then", "now", "look", "only", "come",
  "its", "over", "think", "also", "back", "after", "use", "two", "how",
  "our", "work", "first", "well", "way", "even", "new", "want", "because",
  "any", "these", "give", "day", "most", "us", "great", "between", "need",
  "large", "often", "hand", "high", "place", "hold", "begin", "country",
  "keep", "point", "move", "while", "follow", "last", "long", "world",
  "still", "life", "old", "home", "start", "might", "story", "child",
  "city", "earth", "eye", "light", "head", "under", "sure", "kind",
  "along", "never", "next", "hard", "open", "seem", "help", "every",
  "near", "add", "food", "between", "own", "below", "line", "turn",
  "real", "left", "few", "stop", "close", "night", "wish", "idea",
  "enough", "watch", "far", "walk", "paper", "group", "always", "music",
  "those", "both", "mark", "book", "letter", "until", "mile", "river",
  "car", "feet", "care", "second", "pull", "face", "door", "water",
  "without", "side", "been", "call", "find", "where", "list", "school",
  "through", "each", "should", "learn", "plant", "cover", "carry",
  "answer", "thought", "above", "number", "change", "house", "play",
  "live", "found", "study", "read", "write", "run", "small", "part",
  "off", "once", "white", "tell", "press", "room", "fact", "young",
  "right", "bring", "fish", "same", "set", "name", "end", "four",
  "air", "land", "tree", "page", "hear", "show", "try", "animal",
  "together", "important", "family", "build", "mother", "father",
  "picture", "simple", "early", "body", "center", "question", "during",
  "possible", "morning", "table", "north", "south", "power", "money",
  "example", "develop", "problem", "produce", "product", "system",
  "program", "market", "service", "company", "result", "report",
  "level", "order", "local", "social", "general", "special", "public",
  "human", "nature", "remain", "number", "record", "period", "reason",
  "action", "issue", "common", "nothing", "final", "provide", "member",
  "effort", "upon", "sense", "return", "appear", "support", "across",
  "create", "include", "within", "offer", "manage", "rather", "single",
  "handle", "expect", "beyond", "major", "growth", "range", "future",
];

export function generateParagraph(wordCount: number = 40): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const idx = Math.floor(Math.random() * WORD_BANK.length);
    words.push(WORD_BANK[idx]);
  }
  return words.join(' ');
}
