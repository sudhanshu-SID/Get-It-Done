# Design System

## 1. Core Aesthetic
**Utilitarian Brutalism.** The UI must feel like a high-stakes command center. No soft colors, no rounded bubbly corners, no celebratory confetti. It should evoke urgency and discipline.

## 2. Color Palette
- **Background:** Deep black (`#000000` or Tailwind `bg-black`).
- **Text:** High-contrast pure white (`text-white`) and muted gray for secondary info (`text-gray-500`).
- **Accents/Alerts:** Pure red (`text-red-500` / `bg-red-900`) strictly used for penalties, strikes, and overdue mandates.

## 3. Typography
- **Primary Font:** Monospace (e.g., Fira Code, JetBrains Mono) to simulate a terminal/developer environment.
- **Styling:** Heavy use of `UPPERCASE` and high font-weights (`font-black`) for headers and critical data.

## 4. UI Components
- **Task Cards:** Solid black boxes with stark white borders (`border-2 border-white`).
- **Buttons:** High contrast. Default to white background with black text. On hover, invert to black background with white text to provide instant, sharp feedback.
