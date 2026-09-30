# Datacom Kudos

A lightweight kudos feature created for the **Datacom Job Simulation**. Employees can recognise colleagues with a short message, while an internal feed displays recent celebrations.

Public repository: <https://github.com/jeianjaz/DATACOM_TASK2>

## Features

- Select a colleague from the employee list
- Write and submit a message of appreciation
- View recent kudos in the shared feed
- Validate required fields and message length
- Store demo data in browser `localStorage`
- Admin review mode with hide, restore, and delete actions
- Required moderation reasons
- Responsive desktop and mobile layout

## Run Locally

No build tools or dependencies are required.

1. Open `kudos/index.html` directly in a browser, or run a local server:

```bash
cd kudos
python3 -m http.server 4173
```

2. Visit <http://localhost:4173>.

## Project Files

- `kudos/index.html` - application structure and accessible form controls
- `kudos/styles.css` - responsive visual design
- `kudos/app.js` - form handling, feed rendering, persistence, and moderation demo
- `SPECIFICATION.md` - refined requirements and technical design

## Prototype Note

This is a dependency-free browser prototype for the job simulation. Data is stored locally in the browser, so it is not shared between users or devices. The production API, database schema, authentication, authorization, moderation audit trail, and security requirements are documented in `SPECIFICATION.md`.
