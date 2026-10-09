# Spanish Tutor

A small app for learning beginner Spanish, with vocabulary flashcards, an alphabet trainer and a translator powered by Claude. It is plain HTML, CSS and JavaScript: no build step and no dependencies.

## Run it

The Flashcards and Alphabet tabs are plain HTML, CSS and JavaScript. Open `index.html` in a browser and they work.

The **Translate** tab needs the small backend function in `api/`, so it only works when the app runs on Vercel, or locally with `vercel dev`.

## Deploying on Vercel

1. Import the GitHub repo at https://vercel.com/new. No build settings are needed.
2. In the Vercel project, open **Settings → Environment Variables** and add `ANTHROPIC_API_KEY` with your key from https://platform.claude.com/settings/keys.
3. Redeploy. Vercel only picks up new environment variables on the next deploy.

The key exists only on Vercel's servers. The browser calls `/api/translate`, and that function calls Claude, so visitors never see the key.

**Costs:** each new word is one call to Claude Opus 5.5 at low effort, which costs a fraction of a cent. Vercel's CDN caches each word's answer for 30 days, so looking up the same word again costs nothing. The endpoint is public, so anyone who finds the URL can use it. To cap your spending, set a monthly limit in the Claude Console and add a rate-limit rule in Vercel's Firewall.

To run everything locally: `npm install`, then `vercel dev` with `ANTHROPIC_API_KEY` in a `.env.local` file. Git ignores that file.

## Flashcards

- **Flip:** click or tap the card, or press **Space**, to go from the Spanish word to the English meaning and an example sentence.
- **Knew it / Didn't know** (**→** / **←**): a card you know leaves the deck. A card you miss comes back 3 cards later until you get it.
- **🔊 Speaker:** uses your browser's built-in text-to-speech with a Spanish voice, slowed a little. Press **S** to hear the current word. The back of the card has a second speaker for the example sentence.
- When you finish, you can review only the words you missed or start over.

## Alphabet

- **Learn:** a grid of the 27 Spanish letters, including **Ñ**. Tap a letter to hear its name, for example "be" or "eñe", and to see an example word that starts with it. The 🔊 button next to the word plays the word.
- **Quiz:** the app says a letter's name and you pick that letter from 4 options (keys **1–4**, **R** to replay it, **Enter** for the next letter). One of the wrong options is usually a letter whose name sounds similar, such as B/V, M/N/Ñ or C/S/Z.
- **Missed letters come back more often.** Each letter has a weight, like raffle tickets. A miss gives it 3 more tickets, and each correct answer takes one away. Your weakest letters are listed under "Letters to practice". The quiz history is saved in your browser, so it's still there after a reload.

## Translate

Type an English word or short phrase, like "cheese" or "to run". The app shows:
- the Spanish translation
- for nouns, the gender and article, with **el** (masculine) words in blue and **la** (feminine) words in pink
- one example sentence and its English meaning
- sometimes a short tip, such as why *agua* is feminine but takes *el*

The 🔊 buttons play the word and the sentence. **Save to flashcards** adds the word to your Flashcards deck. Nouns are saved with their article, like "el queso". Saved words are stored in your browser and stay there after reloads. The button tells you if a word is already in your deck.

## Files

| File | What's in it |
|------|--------------|
| `index.html` | Page structure |
| `style.css`  | Layout, the 3D flip animation and the light/dark theme |
| `app.js`     | Flashcards: deck logic, flipping and answers |
| `words.js`   | The 20 words. Add more by copying a line |
| `alphabet.js`| The 27 letters, the letter grid and the quiz |
| `translate.js` | The Translate tab: lookup, result card, saving to the deck |
| `api/translate.js` | Vercel backend function that calls Claude and returns the translation as JSON |
| `speech.js`  | Text-to-speech, shared by both sections. It uses a Spain Spanish voice, then a Mexican one, then any Spanish voice |

## Adding words

Add an entry to `words.js`:

```js
{ es: "playa", en: "beach", example: "Vamos a la playa.", exampleEn: "Let's go to the beach." },
```

Pronunciation quality depends on the Spanish voices your operating system or browser has installed. Chrome, Edge and Safari include good ones.
