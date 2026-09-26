# Super Punekar

A retro platformer set in Pune, made for one young fan of the classic jump-and-stomp games. The hero wears a white Maharashtrian topi and a saffron kurta (green once he eats a mirchi).

The naughty **Makad Raja** (the Monkey King of Sinhagad) has run off with all the modaks for Ganeshotsav. Run across Pune, stomp angry auto-rickshaws, kick monkeys, ride the metro lifts, climb Sinhagad and ring the bell in Shaniwar Wada to win them back.

**World 1: Pune** has four levels:

| Level | Name | What's there |
| --- | --- | --- |
| 1-1 | Peth Streets | Wadas, the Parvati hill temple, Ganeshotsav pandals with twinkling lights, chai and vada pav stalls, Puneri signboards, a secret pipe to a coin room, and a Pune traffic jam where the hero gets stuck (hop along the roofs!) |
| 1-2 | Metro Station | Inside a Pune Metro station: ticket gates, screen doors with trains gliding past, benches, route maps and next-train displays, plus metro lifts over a pit |
| 1-3 | Sinhagad Climb | Sunset over the Sahyadris, fort pillars, crumbling stones, moving ledges, pigeons, and a lady at the cliff edge who throws you off if you stand next to her for 5 seconds |
| 1-4 | Shaniwar Wada | The fort at dusk: the Dilli Darwaza gate, sandstone walls with saffron flags, kandil lanterns and lotus fountains, plus fire bars, lava, jumping flames and the Makad Raja boss on the bridge |

## Play it

- **Easiest:** open `dist/super-punekar.html` in Chrome, Safari or Edge. It's a single file that works offline on a laptop, tablet or phone, so you can send it on WhatsApp or by email.
- **From the source:** open `index.html` directly. No install or server is needed.

### Put the kid's name in the game

On the title screen choose **HERO NAME** and type up to 10 letters. The name then appears on the title logo ("SUPER AARAV"), the HUD, the story and the ending. It is remembered on that device.

You can also add the name to the link, for example `super-punekar.html#AARAV`.

### Controls

| | Keyboard | Touch (tablet / phone) | Gamepad |
| --- | --- | --- | --- |
| Move | Arrow keys or A / D | ◀ ▶ | D-pad or left stick |
| Jump (hold for higher) | Z, Space, K or ↑ | A | A / B |
| Run, throw mirchi fire | X, Shift or J | B | X / Y |
| Duck, enter pipes | ↓ or S | ▼ | D-pad down |
| Pause | Enter, P or Esc | ❚❚ | Start |
| Sound on/off | M | 🔈 | |

Phones play best held sideways: holding one upright shows a "turn your phone sideways" card (with a full-screen button on phones that support it, and an option to keep playing upright). The touch buttons resize to fit the screen.

### Power-ups

| Item | What it does |
| --- | --- |
| Vada pav | Grow big and break bricks |
| Mirchi (green chilli) | Throw spicy fireballs with B / X |
| Dhol | A few seconds of invincibility, with dhol-tasha music |
| Modak | Extra life (so do 100 coins) |

### Made kind for a young player

- 5 lives, a checkpoint in every level, and **Continue** after game over (from the checkpoint).
- Getting hit with mirchi power drops you to vada pav size, not all the way to small.
- Forgiving jumps: a short grace period after running off a ledge, early jump presses are remembered, and the hero slides round block corners.
- Every level can be finished without ever pressing run. `tools/verify-levels.js` checks this automatically.
- The time limit is generous (the clock ticks every 0.6 s).

## Project layout

```
index.html          page shell: canvas, touch buttons, name entry
src/core.js         constants and helpers
src/font.js         bitmap fonts (HUD and the tiny signboard font)
src/input.js        keyboard, touch and gamepad
src/audio.js        Web Audio chiptune synth, sound effects and all the music
src/sprites.js      pixel art for the hero, enemies, items and tiles
src/scenery.js      painted backgrounds (Sinhagad, Parvati, the metro, Shaniwar Wada) and decorations
src/world.js        tile map, level-building helpers and the platformer physics
src/levels.js       the four levels of World 1
src/entities.js     hero, enemies, items, platforms, effects
src/game.js         game states, camera, HUD, menus and the main loop
tools/              build, level verifier, tests and a sprite-sheet viewer
dist/               the single-file build
```

## Development

```sh
npm run build     # rebuild dist/super-punekar.html after changing anything in src/
npm run verify    # prove every level can be finished (runs the real physics, needs only Node)
npm test          # verifier + headless browser smoke test + scripted gameplay checks (needs Playwright)
```

To change a level, edit `src/levels.js`. Levels are built with helpers such as `ground`, `q` (a ? block), `brick`, `pipe`, `stairs`, `ledge`, `enemy`, `sign` and `setFlag`. Run `npm run verify` afterwards to catch impossible jumps or spots where the player could get stuck. Open `tools/spritesheet.html` to see every sprite at 4x while you tweak the pixel art.

## Credits

All code, pixel art and music in this repository are original, written for this game. It is a fan-made tribute inspired by classic platform games and is not affiliated with or endorsed by Nintendo.
