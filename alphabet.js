// ---------- Data ----------
// The 27 letters of the Spanish alphabet with their official (RAE) names.
// `alt` is a common Latin American name for the same letter.
const ALPHABET = [
  { letter: "A", name: "a", word: "abeja", en: "bee" },
  { letter: "B", name: "be", word: "barco", en: "boat" },
  { letter: "C", name: "ce", word: "casa", en: "house" },
  { letter: "D", name: "de", word: "dedo", en: "finger" },
  { letter: "E", name: "e", word: "elefante", en: "elephant" },
  { letter: "F", name: "efe", word: "flor", en: "flower" },
  { letter: "G", name: "ge", word: "gato", en: "cat" },
  { letter: "H", name: "hache", word: "helado", en: "ice cream" },
  { letter: "I", name: "i", word: "isla", en: "island" },
  { letter: "J", name: "jota", word: "jirafa", en: "giraffe" },
  { letter: "K", name: "ka", word: "kilo", en: "kilo" },
  { letter: "L", name: "ele", word: "luna", en: "moon" },
  { letter: "M", name: "eme", word: "manzana", en: "apple" },
  { letter: "N", name: "ene", word: "nube", en: "cloud" },
  { letter: "Ñ", name: "eñe", word: "ñandú", en: "rhea (a large bird)" },
  { letter: "O", name: "o", word: "oso", en: "bear" },
  { letter: "P", name: "pe", word: "perro", en: "dog" },
  { letter: "Q", name: "cu", word: "queso", en: "cheese" },
  { letter: "R", name: "erre", word: "ratón", en: "mouse" },
  { letter: "S", name: "ese", word: "sol", en: "sun" },
  { letter: "T", name: "te", word: "tomate", en: "tomato" },
  { letter: "U", name: "u", word: "uva", en: "grape" },
  { letter: "V", name: "uve", alt: "ve chica", word: "vaca", en: "cow" },
  { letter: "W", name: "uve doble", alt: "doble ve", word: "wifi", en: "Wi-Fi" },
  { letter: "X", name: "equis", word: "xilófono", en: "xylophone" },
  { letter: "Y", name: "ye", alt: "i griega", word: "yogur", en: "yogurt" },
  { letter: "Z", name: "zeta", word: "zapato", en: "shoe" },
];

// Letters whose names sound alike. The quiz mixes one of these into the
// options when it can, so you practise telling them apart.
const SOUNDALIKES = [
  ["B", "V", "W"],
  ["C", "S", "Z", "X"],
  ["K", "Q", "C"],
  ["G", "J", "H"],
  ["I", "Y", "E"],
  ["M", "N", "Ñ"],
  ["L", "R"],
  ["D", "T", "P"],
  ["A", "O", "U"],
];

const byLetter = Object.fromEntries(ALPHABET.map((l) => [l.letter, l]));

// ---------- Small helpers ----------
function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return null; // private mode or storage blocked: the app still works, it just won't remember
  }
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- Tabs (Flashcards / Alphabet) and modes (Learn / Quiz) ----------
// Each button names the element it shows; the others in its group are hidden.
function setupSwitcher(buttons, attr, storeKey, onShow) {
  function show(id, fromClick) {
    for (const b of buttons) {
      const on = b.dataset[attr] === id;
      b.setAttribute("aria-pressed", on);
      $(b.dataset[attr]).hidden = !on;
    }
    store(storeKey, id);
    onShow?.(id, fromClick);
  }
  for (const b of buttons) b.addEventListener("click", () => show(b.dataset[attr], true));
  const saved = store(storeKey);
  show(buttons.some((b) => b.dataset[attr] === saved) ? saved : buttons[0].dataset[attr], false);
}

// ---------- Learn: letter grid ----------
const grid = $("letter-grid");
let selectedLetter = null;

function selectLetter(l, btn) {
  selectedLetter = l;
  for (const b of grid.children) b.setAttribute("aria-pressed", b === btn);

  $("detail-letter").textContent = l.letter + l.letter.toLowerCase();
  $("detail-name").textContent = l.name;
  $("detail-alt").textContent = l.alt ? `Also called “${l.alt}”` : "";
  $("detail-alt").hidden = !l.alt;

  // Highlight the letter at the start of the example word.
  const wordEl = $("detail-word");
  wordEl.textContent = "";
  const mark = document.createElement("mark");
  mark.textContent = l.word[0];
  wordEl.append(mark, l.word.slice(1));
  $("detail-en").textContent = l.en;
}

for (const l of ALPHABET) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "letter";
  btn.setAttribute("aria-label", `${l.letter}, ${l.name}`);
  btn.innerHTML = `<span class="big"></span><span class="small" lang="es"></span>`;
  btn.querySelector(".big").textContent = l.letter;
  btn.querySelector(".small").textContent = l.name;
  btn.addEventListener("click", () => {
    selectLetter(l, btn);
    speak(l.name, btn);
  });
  grid.appendChild(btn);
}

$("speak-letter-word").addEventListener("click", (e) => {
  speak(selectedLetter.word, e.currentTarget);
});

// Open on "A" so the panel isn't empty before the first tap.
selectLetter(ALPHABET[0], grid.children[0]);

// ---------- Quiz ----------
// Every letter has a weight (think: raffle tickets). Picking is random but
// weighted, so a letter with 4 tickets comes up 4x as often as one with 1.
// A miss adds 3 tickets; a correct answer takes 1 away (never below 1).
const QUIZ_KEY = "spanish-tutor.alphabet-quiz";
const BASE_WEIGHT = 1;
const MISS_BONUS = 3;
const MAX_WEIGHT = 10;

let quizStats = store(QUIZ_KEY) || {}; // { "B": { right, wrong, weight }, ... }
let session = { right: 0, total: 0 };
let question = null; // { answer, options, answered }
let lastAnswer = null;

function statsFor(letter) {
  return (quizStats[letter] ||= { right: 0, wrong: 0, weight: BASE_WEIGHT });
}

function pickWeighted() {
  // Don't ask the same letter twice in a row.
  const pool = ALPHABET.filter((l) => l.letter !== lastAnswer);
  const total = pool.reduce((sum, l) => sum + (quizStats[l.letter]?.weight ?? BASE_WEIGHT), 0);
  let r = Math.random() * total;
  for (const l of pool) {
    r -= quizStats[l.letter]?.weight ?? BASE_WEIGHT;
    if (r < 0) return l;
  }
  return pool[pool.length - 1];
}

function buildOptions(answer) {
  const options = [answer.letter];
  const soundalikes = SOUNDALIKES
    .filter((g) => g.includes(answer.letter))
    .flat()
    .filter((x) => x !== answer.letter);
  if (soundalikes.length) options.push(randomItem(soundalikes));
  while (options.length < 4) {
    const x = randomItem(ALPHABET).letter;
    if (!options.includes(x)) options.push(x);
  }
  return shuffle(options); // shuffle() lives in app.js
}

function newQuestion(play) {
  const answer = pickWeighted();
  lastAnswer = answer.letter;
  question = { answer, options: buildOptions(answer), answered: false };

  // Without speech the quiz falls back to showing the letter's name.
  $("quiz-question").textContent = canSpeak
    ? "Which letter did you hear?"
    : `Which letter is called “${answer.name}”?`;

  const box = $("quiz-options");
  box.innerHTML = "";
  question.options.forEach((letter, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.letter = letter;
    btn.innerHTML = `<kbd></kbd><span></span>`;
    btn.querySelector("kbd").textContent = i + 1;
    btn.querySelector("span").textContent = letter;
    btn.addEventListener("click", () => answerQuiz(letter));
    box.appendChild(btn);
  });

  $("quiz-feedback").textContent = "";
  $("quiz-feedback").className = "quiz-feedback";
  $("quiz-next").hidden = true;
  if (play) playQuestion();
}

function playQuestion() {
  if (question) speak(question.answer.name, $("quiz-play"));
}

function answerQuiz(letter) {
  if (!question || question.answered) return;
  question.answered = true;
  const { answer } = question;
  const correct = letter === answer.letter;
  const s = statsFor(answer.letter);

  session.total++;
  if (correct) {
    session.right++;
    s.right++;
    s.weight = Math.max(BASE_WEIGHT, s.weight - 1);
  } else {
    s.wrong++;
    s.weight = Math.min(MAX_WEIGHT, s.weight + MISS_BONUS);
  }
  store(QUIZ_KEY, quizStats);

  for (const b of $("quiz-options").children) {
    b.disabled = true;
    if (b.dataset.letter === answer.letter) b.classList.add("right");
    else if (b.dataset.letter === letter) b.classList.add("wrong");
  }

  const fb = $("quiz-feedback");
  const sayIt = `${answer.letter} is “${answer.name}”, as in ${answer.word} (${answer.en}).`;
  if (correct) {
    fb.textContent = `¡Correcto! ${sayIt}`;
    fb.classList.add("good");
  } else {
    fb.textContent = `Not quite. You picked ${letter} (“${byLetter[letter].name}”). ${sayIt}`;
    fb.classList.add("bad");
    playQuestion(); // hear the right one again
  }

  $("quiz-next").hidden = false;
  $("quiz-next").focus();
  renderQuizProgress();
}

function renderQuizProgress() {
  $("quiz-score").textContent = session.total
    ? `${session.right} of ${session.total} correct this session`
    : "Listen, then pick the letter";

  const list = $("practice-list");
  list.innerHTML = "";
  const weak = ALPHABET
    .filter((l) => (quizStats[l.letter]?.weight ?? BASE_WEIGHT) > BASE_WEIGHT)
    .sort((a, b) => quizStats[b.letter].weight - quizStats[a.letter].weight);

  for (const l of weak) {
    const li = document.createElement("li");
    const n = quizStats[l.letter].wrong;
    li.textContent = `${l.letter} · ${l.name} — missed ${n}×`;
    list.appendChild(li);
  }
  if (!weak.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "None yet. Letters you miss will show up here.";
    list.appendChild(li);
  }
}

$("quiz-play").addEventListener("click", playQuestion);
$("quiz-next").addEventListener("click", () => newQuestion(true));
$("practice-reset").addEventListener("click", () => {
  if (!confirm("Clear your quiz history? Every letter will come up equally often again.")) return;
  quizStats = {};
  session = { right: 0, total: 0 };
  store(QUIZ_KEY, quizStats);
  renderQuizProgress();
});

document.addEventListener("keydown", (e) => {
  if ($("view-alpha").hidden || $("alpha-quiz").hidden) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;

  if (e.key >= "1" && e.key <= "4" && question && !question.answered) {
    answerQuiz(question.options[Number(e.key) - 1]);
  } else if (e.key === "r" || e.key === "R") {
    playQuestion();
  } else if (e.key === "Enter" && question?.answered) {
    newQuestion(true);
  }
});

renderQuizProgress();

// ---------- Wire up the switchers ----------
// Opening the quiz plays the current letter. A click counts as a user gesture,
// which browsers require before a page may speak, so only play on clicks.
function enterQuiz(fromClick) {
  if (!question) newQuestion(fromClick);
  else if (fromClick && !question.answered) playQuestion();
}

setupSwitcher([...document.querySelectorAll(".seg")], "mode", "spanish-tutor.alpha-mode", (id, fromClick) => {
  if (id === "alpha-quiz" && !$("view-alpha").hidden) enterQuiz(fromClick);
});
setupSwitcher([...document.querySelectorAll(".tab")], "view", "spanish-tutor.view", (id, fromClick) => {
  if (canSpeak) speechSynthesis.cancel();
  if (id === "view-alpha" && !$("alpha-quiz").hidden) enterQuiz(fromClick);
});
