import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEventParticipants, listUpcomingEvents } from "./nimenhuuto.js";
import { hasGoogleConfig, loadSkillPlayers } from "./sheets.js";
import { matchPlayers } from "./matchPlayers.js";
import { makeGroups } from "./makeGroups.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const TEAM = process.env.NIMENHUUTO_TEAM || "roundnettampere";

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    team: TEAM,
    skillSource: hasGoogleConfig() ? "google" : "fixture",
  });
});

app.get("/api/events", async (_req, res) => {
  try {
    const events = await listUpcomingEvents(TEAM);
    res.json({ team: TEAM, events });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get("/api/events/:id/groups", async (req, res) => {
  try {
    const event = await getEventParticipants(TEAM, req.params.id);
    const skills = await loadSkillPlayers();
    const { matched, unmatched } = matchPlayers(event.players, skills.players);
    const groupedPlayers = [
      ...matched,
      ...unmatched.map((player) => ({
        name: player.name,
        sheetName: null,
        points: null,
        nimenhuutoId: player.nimenhuutoId,
      })),
    ];
    const { groups, warning } = makeGroups(groupedPlayers);

    res.json({
      event: {
        id: event.id,
        title: event.title,
        when: event.when,
        whenIso: event.whenIso,
        venue: event.venue,
        url: event.url,
        inCount: event.players.length,
      },
      skillSource: skills.source,
      groups,
      unmatched,
      warning,
    });
  } catch (error) {
    const status = error.message === "Invalid event id" ? 400 : 502;
    res.status(status).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Roundnet groups app at http://localhost:${PORT}`);
});
