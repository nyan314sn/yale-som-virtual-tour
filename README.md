# Yale SOM Virtual: Evans Hall, Floor 2

A first-person walk-through of the 2nd floor of Edward P. Evans Hall (Yale School of Management), built with React, Vite, three.js, and @react-three/fiber.

It includes the blue classroom drums you can walk into, the curvy glass cloister around the courtyard, Ross Library on the west side, the Beinecke Terrace Room and its outdoor terrace on the east side, the small glass meeting rooms, and paintings above the stairwells.

**Walk it in your browser:** https://zlisto.github.io/yale_som_virtual/

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Click to walk in**.

**Keyboard + mouse** (works like a PC shooter):

| Key | Action |
| --- | --- |
| W A S D / arrows | walk |
| Mouse | look |
| Shift | sprint |
| Space | jump |
| C | crouch |
| M | toggle map |
| Esc | pause |

**Phone / tablet:** tap **Tap to walk in**. The left-thumb joystick walks (push it all the way to sprint), dragging anywhere else looks around, and there are on-screen jump and pause buttons. On a laptop, click **Use on-screen joystick** to try the phone controls. WASD still works in that mode.

## Talk to the professors (AI backend)

Prof. Tauhid Zaman stands in Evans 2200, where MGT 409 meets according to the course database. Prof. Peter Schott, who teaches EMBA statistics (MGT 407), stands next door in 2210 with his buddy Totoro. Walk up to either one, put the crosshair on him and **click** (on phones, tap **Talk**) to open a chat. They turn to face you while you talk. Prof. Schott's agent also knows his published research, which comes from public sources listed in `BACKGROUND` in `backend/professors.py`.

The chat runs on a FastAPI backend in `backend/`. Every professor in `data/yale_som.db` (109 of them) is a PydanticAI agent. Each agent's prompt is built from that professor's courses and bio, and all of them share tools that search the course database. Model calls go through Portkey (`PORTKEY_API_KEY`), and the model is set by `OPENAI_MODEL` (default `gpt-6-luna`).

```powershell
cd backend
copy .env.example .env    # add PORTKEY_API_KEY (or use a .env in any parent folder)
.\setup.ps1               # creates the venv in %USERPROFILE%\.venvs\yale-som-virtual
.\run.ps1                 # http://127.0.0.1:8000, proxied to the app at /api by Vite
```

The venv lives outside the project on purpose. pydantic-ai ships deeply nested files that go over Windows' 260-character path limit under a long OneDrive path, and keeping it out of the project also keeps it out of cloud sync. Speaking styles are in `backend/professors.py` (`STYLES`). Anyone without a style gets the default.

The GitHub Pages build is static, so chat only works when you run the backend locally.

## How it's built

- `src/layout.js`: the floor plan in meters (+x east, -z north). It holds the drums, library, Beinecke, stairs, meeting rooms, wall colliders, and room lookup. Each classroom faces the courtyard, with the whiteboard and podium on the inner side and stadium-seating rows (32 cm risers) stepping up toward the outer wall; its two doors are at the front corners. You climb the center-aisle steps one riser at a time.
- `src/World.jsx`: all the meshes. Walls use instanced boxes and the drums use partial cylinders.
- `src/textures.js`: procedural canvas textures (carpet, navy drum glass, wood slats, mural, signs, stairwell paintings).
- `src/Player.jsx`: walking (pointer lock or touch), jump/crouch, circle-vs-wall collision.
- `src/TouchControls.jsx`: on-screen joystick, drag-to-look, jump and pause buttons.
- `src/Minimap.jsx`: the black-and-pink map in the corner.
- `src/Labubu.jsx`: a customizable Labubu built from primitives: `fur`, `expression` (grin / happy / surprised / sleepy / mischief), `shirt` ('yale', 'stripes', or any color), `pants`, `overalls`, `hat`, `sitting`, `anim`.
- `src/LabubuParty.jsx`: the crew playing in the courtyard plus Labubus in meetings in every glass room.
- `src/slides.js`: lecture slides for eight Fall 2026 MBA courses (MGT 409, 404, 403, 887, 402, 538, 800, 541) on the classroom screens and meeting-room monitors.
- `src/LabubuCrowd.jsx`: 30 seated Labubu students per classroom, drawn with shared instanced meshes.
- `src/Professor.jsx` + `src/Faculty.jsx`: cartoon Hogwarts professors teaching the other classes (McGonagall, Slughorn, Snape, Lockhart, Moody, Flitwick), plus Hagrid in the courtyard.
- `src/Zaman.jsx`, `src/Schott.jsx` + `src/Totoro.jsx`: the chat-able professors' avatars (Zaman in a black-and-pink hoodie with a Labubu keychain; Schott in a light-blue oxford with Totoro). `src/useTalker.js` makes them turn toward you and be clickable from inside their room.
- `src/talk.js` + `src/ChatWindow.jsx`: which professor you're aiming at or talking to, the API call, and the chat window.
- `src/HandsomeDan.jsx`: Handsome Dan touring a loop of 1000 randomly chosen classrooms (blue dot on the map).

The layout is estimated from the wayfinding plan posted on the floor, so room sizes are approximate. The Stair G painting comes from a photo; the other stairwell paintings are made up.

Made for MGT 409: AI Foundations for Managers, Lecture 13.
