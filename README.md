# Math Keywords Dictionary

A standalone static PWA, separate from Math Practice Hub. No build, account, server API, fonts, analytics, or network dependencies are needed by the app. Starter library: 27 vocabulary terms, 10 word problem keywords, and 11 math formulas. Keyword cards always include an operation clue and a caveat.

## Preview locally

From this folder run `python -m http.server 4180`, then open http://localhost:4180 in Chrome. Do not open index.html directly: modules and offline features need HTTP/HTTPS. Run `npm test` for data/import checks. Run `npm install` then `npx playwright install chromium` and `npx playwright test` for browser checks. Development packages are only needed for tests.

## Publish to a NEW GitHub Pages repository

1. Create a new repository such as `math-keywords-dictionary` in your GitHub account. Do not use the Math Practice Hub repository. GitHub Pages availability for private repositories depends on your plan; a public repository exposes the site source and starter terms.
2. Upload this folder's site files at the repository root, including icons, manifest.webmanifest, seed.json, and .nojekyll. Do not upload node_modules or personal dictionary exports. The files at the repository root must include index.html (avoid an extra enclosing folder).
3. Alternatively, initialize this folder with `git init`, commit the files, set the new repository remote, and push a main branch. This checkout uses the separate repository linked below.
4. In the new repository choose Settings → Pages → Deploy from a branch → main → /(root), then Save.
5. After GitHub reports a successful deployment, open `https://YOUR-ACCOUNT.github.io/math-keywords-dictionary/`. Confirm the title and starter terms, add a temporary entry, export/import it, reload, and test offline in Chrome DevTools. Relative asset paths support a repository subpath.
6. In desktop Chrome open the site, then use the address-bar install icon or Chrome menu → Cast, save, and share → Install page as app (wording varies). An Install app button appears when Chrome offers installation. Launch the installed app and repeat the offline check.

Repository: https://github.com/Jmiller10212/math-keywords-dictionary

GitHub Pages: https://jmiller10212.github.io/math-keywords-dictionary/

Pages is configured to deploy from main at the repository root. Commit and push changes in this folder to update this dictionary.

## Your entries and backups

Entries are saved only in this browser profile and origin under `math-keywords-dictionary:v1`. They do not automatically sync with another computer or profile. Clearing site data removes entries and the stored replacement backup. Use Manage & transfer → Download JSON regularly. GitHub sees only the shipped starter library, not your browser's edited entries. Sites sharing the same GitHub Pages origin share browser storage; use this single dictionary deployment per origin or change STORE if hosting another independent copy.

JSON exports use `{ "schemaVersion": 2, "exportedAt": "ISO timestamp", "entries": [...] }`. Each entry has string fields `id`, `type` (`vocabulary`, `keyword`, or `formula`), `term`, `definition`, `category`, `example`, `clue`, `caveat`. ID, term, category, definition are required. Keywords require clue and caveat. Formulas require `notation`, `symbols` (symbol meanings), `whenToUse`, and `example` (worked example). `term` is the formula name and `definition` explains what it calculates; `notes` is optional. All fields are strings. Version 1 exports remain importable; new exports use version 2. IDs allow letters, numbers, underscores, hyphens; keep them stable. Optional text fields default to empty strings. Unknown properties are stripped. Limits: 5 MB import file, 10,000 entries, 4,000 characters per text field, 100-character IDs. Schema versions other than 1 and 2 and malformed or internally duplicated files are rejected without changing the library.

Merge retains existing entries, adds new IDs, and updates matching IDs. The same normalized term in the same type with different IDs, or a changed term/type for an existing ID, blocks the entire merge. Fix the file or edit the entry in the app. The same word can appear once in each entry type. Preview counts additions, updates, unchanged entries and removals. Replace uses exactly the incoming list, including an intentionally empty list. Before replacement the app saves the previous library to a separate browser key and downloads it. If saving that backup fails, Replace stops. Download pre-replace backup retrieves the latest one; it can be restored with Import → Replace. Browsers may prompt for automatic downloads: retain the backup file. A full or blocked localStorage reports an error rather than silently claiming success.

Use Copy ChatGPT instructions with an exported file to request additions. Review the returned file's import preview before applying. A matching ID can overwrite text during merge, so export first if you want an additional rollback point.

Search covers all entry fields. Print uses the currently filtered entries and removes editing controls. Data is inserted as text, never executed as HTML. Imported files never issue network requests. Keyboard users can tab through forms; dialogs support Escape, and buttons have visible focus styles.

## Offline and updates

Service worker scope is this project folder; its cache uses a dictionary-specific prefix. The first successful online visit caches all app files and starter entries. Saved user entries remain in localStorage. For a release, bump CACHE in sw.js whenever site files change. A new worker activates after its complete offline shell is cached. Online navigations check for the deployed page; offline navigations use the cached shell. Reload online to receive an update. Export before clearing storage or uninstalling. Do not use Clear site data as a normal update method.

## Project files

index.html / style.css / app.js: accessible UI and persistence. core.js: schema validation and import planning. seed.json: starter library and example export format. sw.js: offline shell. manifest.webmanifest / icons: installation assets. tests: data and browser checks. No existing Hub source files are required or modified.

Official setup references: [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [Chrome web apps](https://support.google.com/chrome/answer/9658361).

## Formula release

The Math Formulas tab includes perimeter, area, volume, distance, mean, percentage and circle formulas. The editor adapts labels and required fields to the selected type. Categories accept your own text and suggest Geometry, Arithmetic, Measurement and Algebra. Search includes notation, symbol meanings, usage and notes. Print includes every formula detail in the filtered view.

On the first upgrade of a version 1 saved library, missing starter formulas are added without overwriting existing IDs or same-type names; the resulting library is saved as version 2 under the existing storage key. Subsequent reloads preserve deletions. Importing an older file uses its contents exactly for Replace, or the normal conflict rules for Merge. Export before updating if you want your own additional backup. The offline cache release is v4; reload online to receive it.

The formulas-and-geometry-1 content revision adds missing formula starters and nine geometry/algebra vocabulary entries once to existing libraries, including version 2 libraries that missed the earlier formula upgrade. Existing IDs and same-type names are preserved. A seedRevision marker prevents deleted entries from being restored on every reload. Imports applied by the app save the current revision, so intentional Replace operations remain exact.
