import * as cheerio from "cheerio";

const USER_AGENT =
  "TRERoundnetScoreApp/0.1 (+https://github.com/roundnettampere; organiser tool)";

function teamBase(team) {
  return `https://${team}.nimenhuuto.com`;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Nimenhuuto request failed (${response.status}) for ${url}`);
  }
  return response.text();
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function eventIdFromHref(href) {
  const match = String(href || "").match(/\/events\/(\d+)/);
  return match ? match[1] : null;
}

function playerFromSpan($, el) {
  const idAttr = $(el).attr("id") || "";
  const idMatch = idAttr.match(/^player_(\d+)$/);
  const name = cleanText($(el).text());
  if (!name || /^ei ketään$/i.test(name)) return null;
  return { id: idMatch ? idMatch[1] : null, name };
}

export function parseUpcomingEvents(html) {
  const $ = cheerio.load(html);
  const events = [];

  $(".event-detailed-container").each((_, el) => {
    const $el = $(el);
    const idFromContainer = ($el.attr("id") || "").match(/^event_(\d+)$/);
    const titleHref = $el.find("a.event-title-link").attr("href");
    const id = idFromContainer ? idFromContainer[1] : eventIdFromHref(titleHref);
    if (!id) return;

    const title = cleanText($el.find("a.event-title-link").first().text());
    const whenEl = $el.find(".event-information-container h4").first();
    const when = cleanText(whenEl.text());
    const venue = cleanText(whenEl.next("div").text());
    const inPlayers = [];
    $el.find(`#tab_in_${id} .player_label`).each((__, span) => {
      const player = playerFromSpan($, span);
      if (player) inPlayers.push(player);
    });

    events.push({
      id,
      title: title || "Tapahtuma",
      when,
      venue,
      inCount: inPlayers.length,
      url: titleHref || `/events/${id}`,
    });
  });

  return events;
}

export function parseEventPage(html, eventId) {
  const $ = cheerio.load(html);
  const title = cleanText($("#event_header .summary, #event_header h1").first().text());
  const when = cleanText($("time.dtstart").first().text());
  const whenIso = $("time.dtstart").attr("datetime") || null;
  const venue = cleanText($('[itemprop="location"]').first().text());

  const players = [];
  const seen = new Set();
  $(`#zone_1 span.player_label`).each((_, span) => {
    const player = playerFromSpan($, span);
    if (!player) return;
    const key = player.id || player.name;
    if (seen.has(key)) return;
    seen.add(key);
    players.push(player);
  });

  return {
    id: String(eventId),
    title: title || "Tapahtuma",
    when,
    whenIso,
    venue,
    players,
  };
}

export async function listUpcomingEvents(team) {
  const html = await fetchHtml(`${teamBase(team)}/events`);
  return parseUpcomingEvents(html).map((event) => ({
    ...event,
    url: event.url.startsWith("http")
      ? event.url
      : `${teamBase(team)}${event.url}`,
  }));
}

export async function getEventParticipants(team, eventId) {
  if (!/^\d+$/.test(String(eventId))) {
    throw new Error("Invalid event id");
  }
  const html = await fetchHtml(`${teamBase(team)}/events/${eventId}`);
  const event = parseEventPage(html, eventId);
  event.url = `${teamBase(team)}/events/${eventId}`;
  return event;
}
