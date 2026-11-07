import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rowsToPlayers } from "./sheets.js";

describe("rowsToPlayers", () => {
  it("reads Pelaaja and Pisteet including Finnish decimals", () => {
    const rows = [
      ["Sij.", "Pelaaja", "Pisteet:", "Uudet pisteet:"],
      ["1", "Jussi", "256,70", "256,70"],
      ["", "Keskiarvo", "200", ""],
      ["2", "Peeta", "173.08", "155"],
    ];
    assert.deepEqual(rowsToPlayers(rows, "Pelaaja", "Pisteet"), [
      { name: "Jussi", points: 256.7 },
      { name: "Peeta", points: 173.08 },
    ]);
  });
});
