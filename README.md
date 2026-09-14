# Alex Universal AI - Free Version

Alex uses **OpenRouter Free** only. This build does not require OpenAI, Anthropic/Claude, or Google Gemini.

## Setup

1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Create an OpenRouter API key and put it in `.env`:

```env
OPENROUTER_API_KEY=YOUR_NEW_KEY
OPENROUTER_MODEL=openrouter/free
```

4. Open a terminal in this folder and run:

```cmd
npm.cmd install
npm.cmd start
```

5. Open `http://localhost:3000`.

## Important

Never put the API key in `public/index.html` and never share it publicly. If a key was posted or exposed, revoke it and create a new one.

## Troubleshooting

If the browser shows an Anthropic/Claude or OpenAI credit error, you are running an older Alex folder/server. Stop the old Node process and start this folder again. This build sends AI requests only to OpenRouter.
