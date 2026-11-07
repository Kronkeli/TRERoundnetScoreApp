import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, "data", "fixture-players.json");

function normalizeHeader(value) {
  return String(value || "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase();
}

function parsePoints(value) {
  if (value == null || value === "") return null;
  const text = String(value).trim();
  if (!text || /^#n\/a$/i.test(text)) return null;
  const number = Number(text.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export function rowsToPlayers(rows, nameHeader, pointsHeader) {
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  const wantName = normalizeHeader(nameHeader);
  const wantPoints = normalizeHeader(pointsHeader);
  let nameIndex = headers.findIndex((h) => h === wantName);
  let pointsIndex = headers.findIndex((h) => h === wantPoints || h.startsWith(wantPoints));

  if (nameIndex < 0) nameIndex = 1;
  if (pointsIndex < 0) pointsIndex = 2;

  const players = [];
  for (const row of rows.slice(1)) {
    const name = String(row[nameIndex] || "").trim();
    if (!name) continue;
    if (/^(keskiarvo|sij\.?|pelaaja|lohko|ohjeet)$/i.test(name)) continue;
    const points = parsePoints(row[pointsIndex]);
    players.push({ name, points });
  }
  return players;
}

export function hasGoogleConfig() {
  return Boolean(
    process.env.HOSTLOCALLY
  );
}

async function readSheetRows() {
  const auth = process.env.HOSTLOCALLY == "TRUE" ? 
    new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_FILE,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })
    : new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    }); 
  const sheets = google.sheets({ version: "v4", auth });
  const tab = process.env.GOOGLE_SHEET_TAB || "current";
  const range = `'${tab.replace(/'/g, "''")}'!A1:D200`;
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
  });
  return result.data.values || [];
}

export async function loadSkillPlayers() {
  if (hasGoogleConfig()) {
    const rows = await readSheetRows();
    return {
      source: "google",
      players: rowsToPlayers(
        rows,
        process.env.GOOGLE_NAME_HEADER || "Pelaaja",
        process.env.GOOGLE_POINTS_HEADER || "Pisteet"
      ),
    };
  }

  const raw = await readFile(FIXTURE_PATH, "utf8");
  return {
    source: "fixture",
    players: JSON.parse(raw),
  };
}
