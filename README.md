# Roundnet weekly group splitter

MVP Node app for Roundnet Tampere organisers. It reads **IN** signups from [Nimenhuuto](https://roundnettampere.nimenhuuto.com/events), looks up skill points in the **viikkikset** Google Sheet, sorts players by points, and splits them into groups of 4 (with groups of 5 when a remainder can be absorbed).

Score recording / writing back to the sheet is not in this MVP.

## Run locally

```bash
npm install
copy .env.example .env
npm start
```

Open [http://localhost:3000](http://localhost:3000). Pick an upcoming session to see groups.

Without Google credentials the Nimenhuuto list is still live; skill points come from `src/data/fixture-players.json`.

```bash
npm test
```

## Google Sheet setup (once)

1. In [Google Cloud Console](https://console.cloud.google.com/) create or reuse a project (the existing OAuth client in `web_credentials.json` is **not** enough for a server-side read).
2. Enable **Google Sheets API**.
3. Create a **service account**, download its JSON key, and save it as `service-account.json` in this folder (gitignored).
4. Open the **viikkikset** spreadsheet → Share → add the service account email as **Viewer**.
5. Copy the spreadsheet id from the URL (`https://docs.google.com/spreadsheets/d/<ID>/edit`) into `.env` as `GOOGLE_SHEET_ID`.
6. Set `GOOGLE_SHEET_TAB` to the tab that holds the ranking (the export notes say `current`). Headers default to `Pelaaja` and `Pisteet` (`GOOGLE_NAME_HEADER` / `GOOGLE_POINTS_HEADER`).

Restart the app. The badge should say `Skill source: google`.

## Name matching

Nimenhuuto names are often short (`Vili T`). The sheet often has a first name only (`Vili`). Matching order:

1. Exact name (case/punctuation ignored)
2. Same first name + last initial (`Joona K`)
3. Unique first name on the sheet (`Peeta`, `Vili T` → `Vili`)

Ambiguous names (`Joona M` when the sheet has both `Joona` and `Joona K`) stay in **Unmatched** so you can fix the sheet.

## Grouping

Players with known points are sorted high → low; unmatched/unknown points go last.

| Players | Groups        |
| ------- | ------------- |
| 12      | 4+4+4         |
| 13      | 5+4+4         |
| 14      | 5+5+4         |
| 15      | 5+5+5         |
| 6       | 4+2 (warning) |
