import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseEventPage, parseUpcomingEvents } from "./nimenhuuto.js";

const listHtml = `
<div class="events-list section">
  <div id="event_20402251" class="event-detailed-container">
    <a class="event-title-link" href="https://roundnettampere.nimenhuuto.com/events/20402251">
      Harkka · <span class="event-information">Treeni ja pelit!</span>
    </a>
    <div class="event-information-container">
      <a href="https://roundnettampere.nimenhuuto.com/events/20402251">
        <h4>Su 8.11. klo 18:00</h4>
        <div>Atalpa, Ratapihankatu 55</div>
      </a>
      <div class="tab-pane active" id="tab_in_20402251">
        <span class="player_label player_type_1 ">Jorge M</span>
      </div>
    </div>
  </div>
</div>
`;

const eventHtml = `
<div id="event_header"><h1 class="summary">Harkka</h1></div>
<time class="dtstart" datetime="2026-11-08T18:00:00+02:00">Su 8.11. klo 18:00</time>
<span itemprop="location">Atalpa, Ratapihankatu 55</span>
<div class="drop-zone enroll_1" id="zone_1">
  <span class="player_label" id="player_1">Jorge M</span>
  <span class="player_label" id="player_2">Peeta</span>
</div>
<div class="drop-zone enroll_2" id="zone_2">
  <span class="player_label" id="player_3">Annika O</span>
</div>
`;

describe("nimenhuuto parsers", () => {
  it("reads upcoming events and IN counts", () => {
    const events = parseUpcomingEvents(listHtml);
    assert.equal(events.length, 1);
    assert.equal(events[0].id, "20402251");
    assert.match(events[0].title, /Harkka/);
    assert.equal(events[0].when, "Su 8.11. klo 18:00");
    assert.equal(events[0].venue, "Atalpa, Ratapihankatu 55");
    assert.equal(events[0].inCount, 1);
  });

  it("reads IN players from zone_1 only", () => {
    const event = parseEventPage(eventHtml, "20402251");
    assert.deepEqual(
      event.players.map((p) => p.name),
      ["Jorge M", "Peeta"]
    );
    assert.equal(event.whenIso, "2026-11-08T18:00:00+02:00");
  });
});
