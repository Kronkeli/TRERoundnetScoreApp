import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchPlayers, normalizeName } from "./matchPlayers.js";

const sheet = [
  { name: "Peeta", points: 173 },
  { name: "Vili", points: 171 },
  { name: "Joona", points: 183 },
  { name: "Joona K", points: 197 },
  { name: "Mette", points: 161 },
  { name: "Annika", points: 190 },
];

describe("normalizeName", () => {
  it("collapses case and punctuation", () => {
    assert.equal(normalizeName("  Joona M. "), "joona m");
  });
});

describe("matchPlayers", () => {
  it("matches exact and unique first names", () => {
    const { matched, unmatched } = matchPlayers(
      [
        { name: "Peeta" },
        { name: "Vili T" },
        { name: "Mette N" },
      ],
      sheet
    );
    assert.equal(unmatched.length, 0);
    assert.deepEqual(
      matched.map((m) => [m.name, m.sheetName, m.points]),
      [
        ["Peeta", "Peeta", 173],
        ["Vili T", "Vili", 171],
        ["Mette N", "Mette", 161],
      ]
    );
  });

  it("matches last initial when first name is shared", () => {
    const { matched, unmatched } = matchPlayers([{ name: "Joona K" }], sheet);
    assert.equal(unmatched.length, 0);
    assert.equal(matched[0].sheetName, "Joona K");
  });

  it("leaves ambiguous first names unmatched", () => {
    const { unmatched } = matchPlayers([{ name: "Joona M" }], sheet);
    assert.equal(unmatched[0].name, "Joona M");
  });
});
