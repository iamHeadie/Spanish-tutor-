// ---------- Translate: English word -> Spanish, via our /api/translate function ----------
// The page never talks to Claude directly. It asks our own backend function
// (api/translate.js), which holds the API key and calls Claude for us.

const form = $("translate-form");
const input = $("translate-input");
const translateBtn = $("translate-btn");
const statusEl = $("translate-status");
const resultEl = $("translate-result");
const saveBtn = $("r-save");

// Same rule as the server: letters, spaces, apostrophes, hyphens; up to 4 words.
const WORD_PATTERN = /^\p{L}[\p{L}'’-]*( [\p{L}'’-]+){0,3}$/u;

const POS_LABELS = {
  noun: "Noun", verb: "Verb", adjective: "Adjective", adverb: "Adverb",
  pronoun: "Pronoun", preposition: "Preposition", conjunction: "Conjunction",
  interjection: "Interjection", phrase: "Phrase", other: "Word",
};
const GENDER_LABELS = { masculine: "Masculine", feminine: "Feminine", both: "Masculine or feminine" };

const cache = new Map(); // word -> result, so repeat lookups don't hit the server
let currentResult = null;
let inFlight = null;

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = `translate-status ${kind}`;
}

// What goes on the flashcard and gets spoken: "la casa" for nouns, "correr" for verbs.
function spanishWithArticle(r) {
  return r.article === "el" || r.article === "la" ? `${r.article} ${r.spanish}` : r.spanish;
}

async function translate(raw) {
  const word = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (!word) {
    setStatus("Type an English word first.", "bad");
    input.focus();
    return;
  }
  if (word.length > 40 || !WORD_PATTERN.test(word)) {
    setStatus("Use letters only, up to 4 words (e.g. “ice cream”).", "bad");
    input.focus();
    return;
  }
  if (location.protocol === "file:") {
    setStatus("Translation only works when the app runs on Vercel (or with “vercel dev” on your computer), not from a file opened directly.", "bad");
    return;
  }

  if (cache.has(word)) return showResult(cache.get(word));

  inFlight?.abort();
  const controller = (inFlight = new AbortController());
  translateBtn.disabled = true;
  translateBtn.textContent = "Translating…";
  setStatus(`Looking up “${word}”…`);

  try {
    const res = await fetch(`/api/translate?word=${encodeURIComponent(word)}`, {
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Something went wrong (error ${res.status}). Please try again.`);

    if (!data.found) {
      resultEl.hidden = true;
      setStatus(`“${word}” doesn't look like an English word. Check the spelling and try again.`, "bad");
      return;
    }
    cache.set(word, data);
    showResult(data);
  } catch (err) {
    if (err.name === "AbortError") return; // a newer lookup replaced this one
    resultEl.hidden = true;
    setStatus(err instanceof TypeError ? "Couldn't reach the server. Check your connection and try again." : err.message, "bad");
  } finally {
    if (inFlight === controller) {
      inFlight = null;
      translateBtn.disabled = false;
      translateBtn.textContent = "Translate";
    }
  }
}

function showResult(r) {
  currentResult = r;
  setStatus("");

  const hasArticle = r.article === "el" || r.article === "la" || r.article === "el/la";
  $("r-article").textContent = hasArticle ? `${r.article} ` : "";
  $("r-spanish").textContent = r.spanish;
  $("r-english").textContent = r.english;
  $("r-pos").textContent = POS_LABELS[r.part_of_speech] || "Word";

  // Gender pill only for nouns, colored so masculine/feminine are easy to tell apart.
  const gender = $("r-gender");
  gender.hidden = r.part_of_speech !== "noun" || !GENDER_LABELS[r.gender];
  gender.textContent = gender.hidden ? "" : `${GENDER_LABELS[r.gender]} · ${r.article}`;
  gender.dataset.gender = r.gender;

  $("r-example-es").textContent = r.example_es;
  $("r-example-en").textContent = r.example_en;
  $("r-note").textContent = r.note;
  $("r-note").hidden = !r.note;

  updateSaveButton();
  resultEl.hidden = false;
  resultEl.classList.remove("enter");
  void resultEl.offsetWidth;
  resultEl.classList.add("enter");
}

function updateSaveButton() {
  const saved = inDeck(spanishWithArticle(currentResult)); // inDeck() lives in app.js
  saveBtn.disabled = saved;
  saveBtn.textContent = saved ? "✓ In your flashcards" : "＋ Save to flashcards";
}

// ---------- Events ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  translate(input.value);
});

for (const chip of document.querySelectorAll("#suggestions .chip")) {
  chip.addEventListener("click", () => {
    input.value = chip.textContent;
    translate(chip.textContent);
  });
}

$("r-speak").addEventListener("click", (e) => speak(spanishWithArticle(currentResult), e.currentTarget));
$("r-speak-example").addEventListener("click", (e) => speak(currentResult.example_es, e.currentTarget));

saveBtn.addEventListener("click", () => {
  const r = currentResult;
  addToDeck({ // addToDeck() lives in app.js
    es: spanishWithArticle(r),
    en: r.english,
    example: r.example_es,
    exampleEn: r.example_en,
  });
  updateSaveButton();
  setStatus(`Saved “${spanishWithArticle(r)}”. It's now in your flashcards.`, "good");
});

if (!canSpeak) {
  $("r-speak").hidden = true;
  $("r-speak-example").hidden = true;
}
