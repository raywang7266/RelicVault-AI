# Part 2 — Project Showcase (RelicVault AI submission)

> **Format notes (for the presenter):**
> - Target length: **~4–4.5 minutes**, totaling about 7 minutes with Part 1.
> - All four required points are present and labelled: (1) what you have built, (2) how it works, (3) how AI was used (tools / prompts / models), (4) iterations / reflections.
> - Camera cues are in `[brackets]` for the editor, not for you to read.
> - This project = **RelicVault AI**, a crowdsourced digital heritage & minor artifact museum. Tech stack: Next.js 14 · MongoDB/Mongoose · shadcn/ui + Tailwind · OpenAI Vision · OpenStreetMap Nominatim · Leaflet. UI is in English, Simplified Chinese, and Traditional Chinese.

---

## Section 0 — Cold-open (~20 s)

**[Camera: screen recording of the landing page, then a smooth scroll through the Explore page. Then a 1-second beat on the logo.]**

> "This summer I built **RelicVault AI** — a crowdsourced digital heritage and minor-artifact museum. Anyone can upload a photograph of an artifact, drop a pin at the find site, and within seconds get a structured record complete with a suggested name, dynasty, material, preservation status, and tags. The tagline is short: *if the Louvre gets the masterpieces, RelicVault gets everything else.*"

---

## Section 1 — What you have built (~50 s)

**[B-roll: take 4–6 seconds per surface, narrated as you click through.]**

> "The product has five working surfaces.
>
> **First, authentication.** Email-and-password sign-up and sign-in, bcrypt hashing, JWT session cookies, rate limiting on every auth endpoint, and a three-language UI in English, Simplified Chinese, and Traditional Chinese.
>
> **Second, artifact submission.** A long-form upload form: image upload, multi-tag input, era, preservation status, free-text description — and an **interactive map picker** powered by OpenStreetMap. Users can drop a pin at the find site, or type a place name and have it geocoded automatically. Coordinates are blurred to two decimal places before storage to protect exact dig sites.
>
> **Third, the Explore page.** A masonry gallery with a server-side filter pipeline: fuzzy name search, `#tag` search, dynasty, material, preservation-status filters, and a toggle between a card grid and a Leaflet map view.
>
> **Fourth, the artifact detail view.** Large image, full structured metadata, an embedded mini-map at the find location, a like or favorite button with localStorage persistence, and an inline comment thread.
>
> **Fifth, the personal profile page.** A stats dashboard, an editable profile card, and a 'My Contributions' grid where you can edit or delete each of your own entries — full CRUD."

---

## Section 2 — How it works (~50 s)

**[B-roll: a simple diagram you draw on screen — *Browser → Next.js → {OpenAI Vision, Nominatim} → MongoDB* — or just keep the screen-share of the upload flow.]**

> "The architecture is **Next.js 14 App Router** on the front and back, with route handlers as the API layer, and **MongoDB with Mongoose** as the single source of truth.
>
> When a user submits an artifact with a photo, three things happen in parallel.
>
> **One:** the image goes to **OpenAI's vision model** with a strict system prompt that asks for a JSON object — name, dynasty, category, material, preservation status, description, and suggested tags. The prompt explicitly tells the model to return *'unknown'* rather than guess when a field is unclear.
>
> **Two:** if the user typed a place name, a request goes to **OpenStreetMap Nominatim** for forward or reverse geocoding — and because Nominatim is free and keyless, it costs nothing to run.
>
> **Three:** the structured result, the resolved coordinates, and the user's free text are written into MongoDB. Because the `artifacts` collection in Mongo enforces ownership at the application layer, I verify that only the owner can update or delete their own entries.
>
> The Explore page is a single client component that issues one `GET /api/artifacts?...` with all filter parameters; the server applies them in Mongo and returns the first fifty matches; the UI renders those either as a masonry of cards or as Leaflet markers — same data, two views."

---

## Section 3 — How AI was used (~60 s)

**[B-roll: (a) WorkBuddy chat panel showing a debugging exchange, (b) the system prompt file in a code editor, (c) the OpenAI call site, (d) the upload form filling itself in after vision analysis.]**

> "AI played three distinct roles. I treated them separately so the review can see each one.
>
> **Three-A — AI coding tools.** Every line of this project was written and reviewed in collaboration with **WorkBuddy**, an AI coding agent. I drove the architecture, chose the libraries, wrote the schemas and the auth flow myself, and used the agent to scaffold components, refactor, and especially to diagnose subtle bugs — a CSS animation that made cards invisible, a Tailwind layer that was silently stripping my `@keyframes`, and a global `prefers-reduced-motion` rule that muted every animation to 0.001 milliseconds. None of those would have shown up in a console log; you only saw them in a real browser. The agent helped me narrow each one down systematically.
>
> **Three-B — System prompts.** For the artifact-recognition feature I wrote a domain-specific system prompt that constrains the model to a strict JSON schema, requires it to say *'unknown'* rather than guess, and asks for bilingual reasoning so I can audit its choices. Treating the prompt as a product spec — not a magic incantation — was the biggest single lesson of the summer.
>
> **Three-C — Models and APIs integrated.** The vision model is OpenAI's multimodal API. Geocoding is OpenStreetMap Nominatim — free, keyless, and built into the upload flow. Mapping is Leaflet with OpenStreetMap tiles. The dependency surface stays deliberately small: one LLM provider, one geocoder, one map library, one database."

---

## Section 4 — Iterations and reflections (~45 s)

**[B-roll: before/after comparisons of the Explore page, an early wireframe next to the live version, a screenshot of the upload-flow progress toast.]**

> "A few honest reflections.
>
> **What worked well.** Starting with a strong data model was the unlock — the first thing I wrote was the Mongoose schema; once that was correct, every UI feature became a thin layer on top. The image-to-structured-record pipeline also turned out to be the highest-leverage feature — it is the thing that makes the rest of the app interesting.
>
> **The biggest challenge.** Front-end polish — and especially CSS entrance animations — was where the AI agent performed the worst. Getting entrance animations and visual details right took many manual iterations and on-browser debugging, because the agent couldn't see what I saw. I had to write down three hard rules I now follow for every animation — *don't trust `animation-fill-mode` to recover from an `opacity: 0` start, `display: contents` kills transforms, and `@keyframes` must live outside `@layer`* — and those rules live in a project memory note for next time.
>
> **What I'd improve given more time.** Three concrete next steps. First, model the platform after Xiaohongshu — give every user a public profile, let users follow each other and direct-message, and turn RelicVault from a catalogue into a small social network around heritage. Second, the upload page currently accepts only a single image; I want to support multiple images, short video, and pure text. Third, strengthen the auth system end-to-end: add third-party sign-in (Google / WeChat), add email verification on sign-up, and add phone-number verification.
>
> **The biggest lesson.** AI accelerates engineering — it does not replace it. The agent saved me dozens of hours on scaffolding and debugging, but it was my call to blur coordinates for dig-site safety, to verify animations in a real browser, and to delete a whole data layer when permissions got messy. Treat AI like a very fast, well-read intern — useful, sometimes wrong, never the final reviewer.
>
> That's **RelicVault AI** — a small, working demonstration that with the right tooling, one person can ship a full-stack, AI-powered, multilingual product in a summer. Thanks for watching."
