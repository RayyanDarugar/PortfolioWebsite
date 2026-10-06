# Room art sources

Inputs to `scripts/art/cut-room.mjs`, which writes `public/room/`.

| File | What it is |
|---|---|
| `a3-dog-board-1.png` | **The master.** Approved 2026-10-06. GPT Image 2.5 (max, 2k, 21:9) from `../scene.png`, then edited: bigger laptop, Rayyan's dog and surfboard. |
| `empty-4-flux.png` | FLUX 3 edit of the master with every interactive object removed. Patch source for the base layer's holes. |
| `day-1.png`, `night-1.png` | GPT Image 2.5 edits of the master relit to midday and night. Realigned by the script. |
| `mattes/*.png` | Higgsfield background removal on crops of the master. Each sprite's outline. |

`rejects/` (git-ignored) holds the other candidates, kept locally only.

To change the room: edit the master, re-run background removal on the changed objects' crops, then `node scripts/art/cut-room.mjs`. The script prints a rebuild check; it must say 0 values differ.
