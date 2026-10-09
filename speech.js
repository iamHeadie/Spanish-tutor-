// Pronunciation through the browser's built-in text-to-speech.
// Shared by the flashcards (app.js) and the alphabet section (alphabet.js).
const canSpeak = "speechSynthesis" in window;
let spanishVoice = null;
let speakingBtn = null;

// Prefer Spain Spanish, then Mexican Spanish, then any Spanish voice the device has.
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  spanishVoice =
    voices.find((v) => v.lang.replace("_", "-") === "es-ES") ||
    voices.find((v) => v.lang.replace("_", "-") === "es-MX") ||
    voices.find((v) => v.lang.toLowerCase().startsWith("es")) ||
    null;
}

// btn (optional) pulses while the text is being spoken.
function speak(text, btn) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  speakingBtn?.classList.remove("speaking");

  const u = new SpeechSynthesisUtterance(text);
  u.lang = spanishVoice ? spanishVoice.lang : "es-ES";
  if (spanishVoice) u.voice = spanishVoice;
  u.rate = 0.85; // a little slower than normal, easier for learners

  speakingBtn = btn || null;
  btn?.classList.add("speaking");
  u.onend = u.onerror = () => {
    if (btn && speakingBtn === btn) {
      btn.classList.remove("speaking");
      speakingBtn = null;
    }
  };
  speechSynthesis.speak(u);
}

if (canSpeak) {
  pickVoice();
  speechSynthesis.addEventListener("voiceschanged", pickVoice);
}
