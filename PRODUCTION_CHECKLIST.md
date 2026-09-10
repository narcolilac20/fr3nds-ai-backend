# Before going live (AI hub)

FR3NDS is still local/dev-ish: few users, AI hub not in real use yet. Do this list **before** exposing `/chat` to real users or putting real money on the OpenAI key.

## Must-fix

- [ ] **Auth on `POST /chat`** — today anyone who can reach the server can call it, pick any `userId`, and set `isPremium: true` (see `server.js`). Gate the endpoint (API key, Firebase/Auth token, or similar) so clients can't spoof premium or burn the OpenAI key.
- [ ] **Durable usage limits** — `userUsage` is in-memory. Restarts wipe counters; multiple instances don't share them. Move daily free/premium caps to Redis or a DB before relying on them.

## Nice-to-fix

- [ ] Restrict **CORS** for production (today `cors()` is wide open).
- [ ] Align **port docs**: README says `3001`, code defaults to `PORT || 3000`.
- [ ] Make limit / error responses use clear **HTTP status codes** (not only a JSON `error` body on 200).

## Ops

- [ ] Keep `OPENAI_API_KEY` in env / host secrets only — never commit `.env`.
- [ ] Confirm the public URL (Railway / Render / etc.) is the only place the key lives, and the Android app points at that host — not a random open IP.

When this is done, the hub is in much safer shape to turn on for real users.
