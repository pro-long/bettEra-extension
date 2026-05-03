# bettEra Extension

**bettEra** is a high-performance browser extension designed for the online strategy game WarEra. It provides tactical utilities and quality-of-life UI enhancements directly integrated into the game.

## Features

* **Diplomacy Tactical OS:** A real-time tactical map overlay showing diplomatic relations, active battles, alliances, and enemies directly on the game engine.
* **Organize Company:** A drag-and-drop utility to custom sort and organize your companies locally via native UI elements.

## Demo
![Diplomacy Tactical OS](./assets/diplo-map.gif)
*Real-time tactical overlay showing diplomatic relations and alliance mappings directly on the game engine.*
![Organize Company](./assets/organize-company.gif)
*A drag-and-drop utility to custom sort and organize your companies locally via native UI elements.*

## Installation (Chrome / Edge)

1. Download or clone this repository to your local machine.
2. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the folder containing the extension files.
5. Open WarEra and find the new options in your game settings!

## File Structure & Inter-World Communication

The extension is split across two "Isolated Worlds" to safely manage security and DOM access.

* **`manifest.json` (Manifest V3):** Defines permissions, web-accessible resources, and script injection points.
* **`ui.js` (Isolated World):**
    * Handles native React DOM interactions, such as injecting settings toggles and managing the `localStorage` drag-and-drop logic for "Organize Company".
    * Acts as a **"data smuggler,"** fetching local configuration files (like `naps.json`) which the Main World cannot natively access, and passing them to the game environment via `window.postMessage`.
* **`hook.js` (Main World):**
    * Injected directly into the game's core execution context.
    * Contains the high-performance Webpack sniffer, Next.js tRPC fetch interceptor, and the MapLibre engine rendering logic for the Diplomacy OS.
* **`naps.json`:** A local JSON dictionary containing custom Non-Aggression Pact (NAP) relationships used by the tactical overlay.

## Acknowledgments

* **Diplomacy Tactical OS:** The architectural concepts and vision for the map overlay feature were inspired by the [WarEra Tactical Diplomacy OS](https://github.com/francescoparadiso/warera-tactical-diplomacy-os) by Francesco Paradiso.

## License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
