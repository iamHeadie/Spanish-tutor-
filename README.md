# Spanish Tutor

A small app for learning beginner Spanish, with vocabulary flashcards and an alphabet trainer. It is plain HTML, CSS and JavaScript: no build step and no dependencies.

## Run it

Open `index.html` in any modern browser. You can double-click the file, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Flashcards

- **Flip:** click or tap the card, or press **Space**, to go from the Spanish word to the English meaning and an example sentence.
- **Knew it / Didn't know** (**→** / **←**): a card you know leaves the deck. A card you miss comes back 3 cards later until you get it.
- **🔊 Speaker:** uses your browser's built-in text-to-speech with a Spanish voice, slowed a little. Press **S** to hear the current word. The back of the card has a second speaker for the example sentence.
- When you finish, you can review only the words you missed or start over.

## Alphabet

- **Learn:** a grid of the 27 Spanish letters, including **Ñ**. Tap a letter to hear its name, for example "be" or "eñe", and to see an example word that starts with it. The 🔊 button next to the word plays the word.
- **Quiz:** the app says a letter's name and you pick that letter from 4 options (keys **1–4**, **R** to replay it, **Enter** for the next letter). One of the wrong options is usually a letter whose name sounds similar, such as B/V, M/N/Ñ or C/S/Z.
- **Missed letters come back more often.** Each letter has a weight, like raffle tickets. A miss gives it 3 more tickets, and each correct answer takes one away. Your weakest letters are listed under "Letters to practice". The quiz history is saved in your browser, so it's still there after a reload.

## Files

| File | What's in it |
|------|--------------|
| `index.html` | Page structure |
| `style.css`  | Layout, the 3D flip animation and the light/dark theme |
| `app.js`     | Flashcards: deck logic, flipping and answers |
| `words.js`   | The 20 words. Add more by copying a line |
| `alphabet.js`| The 27 letters, the letter grid and the quiz |
| `speech.js`  | Text-to-speech, shared by both sections. It uses a Spain Spanish voice, then a Mexican one, then any Spanish voice |

## Adding words

Add an entry to `words.js`:

```js
{ es: "playa", en: "beach", example: "Vamos a la playa.", exampleEn: "Let's go to the beach." },
```

Pronunciation quality depends on the Spanish voices your operating system or browser has installed. Chrome, Edge and Safari include good ones.
