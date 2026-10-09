// ---------- Elements ----------
const $ = (id) => document.getElementById(id);
const card = $("card");
const frontFace = card.querySelector(".front");
const backFace = card.querySelector(".back");
const btnKnew = $("btn-knew");
const btnMiss = $("btn-miss");
const speakWordBtn = $("speak-word");
const speakExampleBtn = $("speak-example");

// ---------- Session state ----------
// queue: indexes into WORDS still to study this round (front = current card).
// A card leaves the queue only when you mark it "Knew it";
// "Didn't know" puts it back a few cards later so you see it again soon.
let queue = [];
let roundSize = 0;
let learned = 0;
let missed = new Set();   // words missed at least once this round
let flipped = false;

const RETRY_GAP = 3;      // how many cards before a missed word comes back

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startRound(indexes) {
  queue = shuffle([...indexes]);
  roundSize = queue.length;
  learned = 0;
  missed = new Set();
  $("done").hidden = true;
  $("study").hidden = false;
  showCard();
}

// ---------- Rendering ----------
function current() {
  return WORDS[queue[0]];
}

function showCard() {
  const w = current();

  // Snap back to the front with no animation, so the next answer isn't revealed mid-flip.
  card.classList.add("no-anim");
  setFlipped(false);
  $("front-word").textContent = w.es;
  $("back-word").textContent = w.en;
  $("example-es").textContent = w.example;
  $("example-en").textContent = w.exampleEn;
  void card.offsetWidth; // force reflow so the class changes apply separately
  card.classList.remove("no-anim");

  card.classList.remove("enter");
  void card.offsetWidth;
  card.classList.add("enter");

  updateProgress();
}

function updateProgress() {
  const retry = queue.filter((i) => missed.has(i)).length;
  $("progress").textContent =
    `${learned} of ${roundSize} learned` + (retry ? ` · ${retry} to retry` : "");
  $("bar-fill").style.width = `${(learned / roundSize) * 100}%`;
}

function setFlipped(value) {
  flipped = value;
  card.classList.toggle("flipped", flipped);
  // Keep the hidden side from catching clicks or keyboard focus.
  frontFace.inert = flipped;
  backFace.inert = !flipped;
  // Answer buttons unlock once you've seen the answer.
  btnKnew.disabled = !flipped;
  btnMiss.disabled = !flipped;
}

function flip() {
  setFlipped(!flipped);
}

// ---------- Answering ----------
function answer(knewIt) {
  if (!flipped) return;
  const idx = queue.shift();

  if (knewIt) {
    learned++;
  } else {
    missed.add(idx);
    queue.splice(Math.min(RETRY_GAP, queue.length), 0, idx);
  }

  if (queue.length === 0) {
    finish();
  } else {
    showCard();
  }
}

function finish() {
  updateProgress();
  $("study").hidden = true;
  $("done").hidden = false;

  const firstTry = roundSize - missed.size;
  $("summary").textContent =
    `You learned all ${roundSize} words — ${firstTry} on the first try.` +
    (missed.size ? " These ones took a few goes:" : " Perfect round!");

  const list = $("missed-list");
  list.innerHTML = "";
  for (const i of missed) {
    const li = document.createElement("li");
    li.textContent = `${WORDS[i].es} — ${WORDS[i].en}`;
    list.appendChild(li);
  }
  $("btn-review").hidden = missed.size === 0;
}

// Speech comes from speech.js (shared with the alphabet section).
if (!canSpeak) {
  speakWordBtn.hidden = true;
  speakExampleBtn.hidden = true;
}

// ---------- Events ----------
card.addEventListener("click", flip);

speakWordBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // don't flip the card
  speak(current().es, speakWordBtn);
});

speakExampleBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  speak(current().example, speakExampleBtn);
});

btnKnew.addEventListener("click", () => answer(true));
btnMiss.addEventListener("click", () => answer(false));
$("btn-restart").addEventListener("click", () => startRound(WORDS.keys()));
$("btn-review").addEventListener("click", () => startRound(missed));

document.addEventListener("keydown", (e) => {
  if ($("view-cards").hidden || $("study").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  // Let focused buttons handle Space/Enter themselves.
  if (e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;

  switch (e.key) {
    case " ":
    case "Enter":
      e.preventDefault();
      flip();
      break;
    case "ArrowRight":
      answer(true);
      break;
    case "ArrowLeft":
      answer(false);
      break;
    case "s":
    case "S":
      speak(current().es, speakWordBtn);
      break;
  }
});

// ---------- Your saved words ----------
// Words saved from the Translate tab are kept in this browser's localStorage
// and added to the deck alongside the built-in words.
const SAVED_KEY = "spanish-tutor.saved-words";

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
  } catch {
    return [];
  }
}

// "la casa" and "casa" count as the same word.
function deckKey(es) {
  return es.toLowerCase().replace(/^(el\/la|el|la|los|las) /, "");
}

function inDeck(es) {
  return WORDS.some((w) => deckKey(w.es) === deckKey(es));
}

// Returns false if the word is already in the deck.
function addToDeck(word) {
  if (inDeck(word.es)) return false;
  WORDS.push(word);
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...loadSaved(), word]));
  } catch {
    // Storage blocked: the word stays in the deck until the page is closed.
  }
  // Join the round in progress so it comes up without restarting.
  if (!$("study").hidden) {
    queue.push(WORDS.length - 1);
    roundSize++;
    updateProgress();
  }
  return true;
}

WORDS.push(...loadSaved().filter((w) => !inDeck(w.es)));
startRound(WORDS.keys());
