# Spanish Flashcards

A small flashcard app for learning beginner Spanish. It is plain HTML, CSS and JavaScript: no build step and no dependencies.

## Run it

Open `index.html` in any modern browser. You can double-click the file, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## How it works

- **Flip:** click or tap the card, or press **Space**, to go from the Spanish word to the English meaning and an example sentence.
- **Knew it / Didn't know** (**→** / **←**): a card you know leaves the deck. A card you miss comes back 3 cards later until you get it.
- **🔊 Speaker:** uses your browser's built-in text-to-speech with a Spanish voice, slowed a little. Press **S** to hear the current word. The back of the card has a second speaker for the example sentence.
- When you finish, you can review only the words you missed or start over.

## Files

| File | What's in it |
|------|--------------|
| `index.html` | Page structure |
| `style.css`  | Layout, the 3D flip animation and the light/dark theme |
| `app.js`     | Deck logic, flipping, answers and speech |
| `words.js`   | The 20 words. Add more by copying a line |

## Adding words

Add an entry to `words.js`:

```js
{ es: "playa", en: "beach", example: "Vamos a la playa.", exampleEn: "Let's go to the beach." },
```

Pronunciation quality depends on the Spanish voices your operating system or browser has installed. Chrome, Edge and Safari include good ones.
