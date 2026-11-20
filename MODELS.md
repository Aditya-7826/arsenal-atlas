# Adding 3D models

Arsenal Atlas runs with zero models. Every firearm without a model shows a stylised placeholder silhouette with a "Model coming soon" badge. This guide explains how to swap placeholders for real, properly licensed models.

## The rules

1. **License: CC0 or CC BY only.** No "Editorial", "Standard", "NoDerivatives" or "NonCommercial" licences, nothing ripped from games, and nothing with brand logos or trademarks on it.
2. **External appearance only.** Skip cutaways, exploded views and models that show internal parts.
3. **Every model gets a credit** in `data/credits.json`. `npm run models:check` fails if one is missing.

## Where to find models

| Source | How to search | Notes |
|---|---|---|
| [Sketchfab](https://sketchfab.com/search?features=downloadable&type=models) | Search the firearm name, then use **Downloadable** and **Licence → CC0 / CC Attribution**. | Biggest selection. Download the **glTF/GLB** format. Check the licence on the model page itself, not just the search filter. |
| [Poly Pizza](https://poly.pizza) | Search by name. Each model page shows CC0 or CC BY. | Low-poly and stylised, very light. |
| [Poly Haven](https://polyhaven.com/models) | Browse models. | All CC0, but few or no firearms. Good for props such as display stands. |

Prefer models that are under about 15 MB raw, have PBR textures (base colour, metal-roughness, normal) and come as a single mesh in roughly real-world proportions. The app rescales every model to the real overall length from the catalogue, so the model's own units don't matter.

## Step by step

1. **Find the id.** Ids are in `data/firearms.json`, or in the URL of the firearm page: `/firearm/ak-47` has the id `ak-47`.
2. **Download and rename** the GLB to `<id>.glb`, for example `ak-47.glb`, and put it in `models-raw/`. That folder is git-ignored so large source files never reach GitHub.
   - If you got a `.gltf` with separate files, keep them together in `models-raw/`; the script reads `.gltf` too.
3. **Optimise:**
   ```bash
   npm run models:optimize
   ```
   This writes `public/models/<id>.glb` with Meshopt compression and WebP textures capped at 2048 px. Re-run with `npm run models:optimize -- --force` to rebuild everything.
4. **Credit it** in `data/credits.json` under `"models"`:
   ```json
   {
     "id": "ak-47",
     "title": "AK-47 (the model's title on the source site)",
     "author": "Author's display name",
     "authorUrl": "https://sketchfab.com/author-handle",
     "source": "Sketchfab",
     "sourceUrl": "https://sketchfab.com/3d-models/...",
     "license": "CC-BY-4.0",
     "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
     "changes": "Compressed and textures resized for the web"
   }
   ```
   `license` must be one of `CC0-1.0`, `CC-BY-4.0` or `CC-BY-3.0`. CC BY requires attribution and a note of changes; the credits page shows both.
5. **Check:**
   ```bash
   npm run models:check
   ```
   It lists which firearms have models, which are still placeholders, and any model without credits. It exits with an error if a model is uncredited.
6. **Restart `npm run dev`.** The list of available models is read when the dev server starts, then the model replaces the placeholder in the lobby and the viewer.
7. Commit `public/models/<id>.glb` and `data/credits.json`, then push. Vercel redeploys automatically.

## Size budget

Aim for **under 3 MB per optimised GLB**. The viewer only downloads a model when its page is opened, and the lobby only loads the three featured pieces per gallery.
