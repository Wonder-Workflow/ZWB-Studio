# Zion White Bison · Content calendar

Private production calendar for **Obsession Marketing** and the Zion White Bison account. One client. One shared studio password. Slack stays intake elsewhere — this app is the month board for the strategist, marketing director, and videographer.

Live: [https://zwb-studio.netlify.app](https://zwb-studio.netlify.app)

Out of scope: multi-client, GHL export, auto-post, individual logins, analytics.

## Local run

```bash
npm install
npm run dev
```

The Vite server binds to **http://127.0.0.1:43177**.

Default studio password: `zwb-studio`.

```bash
npm run build
npm run preview
```

To exercise the Netlify Functions locally (password + Blobs):

```bash
npx netlify-cli dev
```

That proxies `/api/auth` and `/api/overrides` and still serves the Vite app.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_APP_PASSWORD` | Local `.env` | Client-side fallback password when Functions are not running. |
| `APP_PASSWORD` | Netlify site env | Server-side password checked by `/.netlify/functions/auth`. Preferred in production. |

If neither is set, the app uses `zwb-studio`.

Copy `.env.example` to `.env` for local overrides. Do not commit a real production password.

## What the studio can do

1. **Password gate** — logo, title, password. Session flag in `sessionStorage`.
2. **Month calendar** — opens on **October 2026** (September is booked out). Prev / next / October / Today.
3. **Four item kinds** — content, event, influencer, and email chips are visually distinct.
4. **Add menu** — create Content, Event, Influencer, or Email from the board.
5. **Drawers** — content packs have concept, one hook, shot list and angles, caption, and on-screen text overlays. Events, creator visits, and Friday emails have their own fields.
6. **Brand strip** — locked Zion White Bison brand card, always visible after login.
7. **Content status** — Idea (gray), In-creation (gold), Ready (green, ready to post), Published (ink).
8. **Shot list** — toolbar → custom date range → **In-creation** packs only. Generate builds a call sheet: header (range, pack count, drone yes/no, talent yes/no), shared-asset blocks first (bison long-lens, drone, night sky, shuttle, amenities), then Talent and Drone as section headers, then physical setup blocks in move order (resort zones, then ZNP). Each pack line shows one hook and the shot list and angles. Line items have persistent checkboxes. Print/PDF or CSV (Done + setup block + shared-asset group + hook + shot list and angles). No notes, second hook, text card, or end card.

New items, status, overlays, and event/influencer fields persist to **Netlify Blobs** when Functions are available, otherwise **localStorage**. Seed copy still lives in `public/data/calendar.json`. Content notes are not shown or written. Older saved packs that still have `hookA` / `hookB` or a split shot list are mapped on read (`hookA`, or the first non-empty hook; setup + A-roll + B-roll joined). The app does not rewrite `/api/overrides` just to drop those keys.

## How an agent updates the calendar

1. Edit [`public/data/calendar.json`](public/data/calendar.json).
2. Keep existing `id` values stable if you are updating an item. Device/studio patches key off `id`.
3. Dates are `YYYY-MM-DD` in America/Denver civil time, not UTC timestamps.
4. Set `kind` to `content`, `event`, `influencer`, or `email`.
5. Content `format` is `Reel | Static | Carousel | Story`. Content `status` is `idea | in-creation | ready | published`.
6. Content `textOverlays` is an array of `{ id?, timing?, text, style?: "subtitle" | "overlay" | "lower-third" }`.
7. Write production-ready packs. Do not invent awards, reviews, or spiritual bison copy.
8. Commit and deploy. The SPA fetches `/data/calendar.json` at runtime (`cache: no-store`).

The seed board is **32 briefed content packs** across October and November 2026. September sample slots were removed.

## `calendar.json` schema

```json
{
  "client": "Zion White Bison",
  "timezone": "America/Denver",
  "updatedAt": "2026-09-29",
  "defaultMonth": "2026-10",
  "brand": { },
  "items": [
    {
      "kind": "content",
      "id": "zwb-2026-10-06-open-idea",
      "date": "2026-10-06",
      "title": "string",
      "format": "Reel",
      "status": "idea",
      "concept": "string",
      "hook": "string",
      "shotList": "Tipi exterior, golden hour, 35mm. Optional feet on the stoop. Steam against red rock.",
      "caption": "string",
      "length": "15–20s",
      "textOverlays": [
        {
          "id": "overlay-open-1",
          "timing": "0:00–0:03",
          "text": "Zion, minutes away",
          "style": "overlay"
        }
      ]
    },
    {
      "kind": "event",
      "id": "zwb-event-example",
      "date": "2026-10-12",
      "startDate": "2026-10-12",
      "endDate": "2026-10-13",
      "startTime": "16:00",
      "endTime": "18:00",
      "title": "Property event",
      "location": "Mercantile lawn",
      "status": "planned",
      "notes": "string"
    },
    {
      "kind": "influencer",
      "id": "zwb-influencer-example",
      "date": "2026-10-18",
      "endDate": "2026-10-20",
      "title": "Creator visit",
      "name": "string",
      "handle": "@handle",
      "platform": "Instagram",
      "deliverables": "1 reel + 4 stories",
      "status": "hold",
      "notes": "string"
    },
    {
      "kind": "email",
      "id": "zwb-email-example",
      "date": "2026-10-09",
      "title": "Friday email",
      "from": "Zion White Bison",
      "subject": "This week at the property",
      "body": "Campaign body or brief for the email team.",
      "notes": "string"
    }
  ]
}
```

Events use `startDate`, `endDate`, `startTime`, and `endTime`. Chips appear on every day in the range. `date` stays in sync with `startDate` for older rows. Event `status` is optional: `planned | confirmed | done | canceled`.  
Influencer `status`: `hold | booked | on-property | wrapped | canceled`.  
Email is a Friday marketing campaign: `subject` (required in the UI), `body` (description), optional `from` and `notes`. New emails default to a Friday in the open month; any date is allowed.  
`textOverlays.style`: `subtitle` (captions), `overlay` (silent-video cards), or `lower-third`.

Brand copy is locked in the seed: luxury glamping + RV near Zion; white bison and sanctuary on property; guest shuttle / Park & Ride; audience of couples, families, and snowbird / RV guests; voice is warm, elevated, place-proud, adventure-with-comfort.

## Deploy (Netlify)

Site name: **zwb-studio** → https://zwb-studio.netlify.app

1. Connect the Git repo to the Netlify site (or `npx netlify-cli deploy --prod --site zwb-studio`).
2. Build command: `npm run build`. Publish directory: `dist`.
3. Set `APP_PASSWORD=zwb-studio` and optionally `VITE_APP_PASSWORD=zwb-studio`.
4. Blobs back `/api/overrides` for the board document (`extras`, `patches`, `removed`).
5. `netlify.toml` maps `/api/auth` and `/api/overrides` and sends other routes to `index.html`.

## Stack

Vite, React, TypeScript, brand-token CSS. Optional Netlify Functions + Blobs. No database, no auth provider, no second component library.
