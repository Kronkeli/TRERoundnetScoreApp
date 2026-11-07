import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupSizes, makeGroups } from "./makeGroups.js";

describe("groupSizes", () => {
  it("uses groups of 4 when divisible", () => {
    assert.deepEqual(groupSizes(12).sizes, [4, 4, 4]);
  });

  it("absorbs remainders as groups of 5", () => {
    assert.deepEqual(groupSizes(13).sizes, [5, 4, 4]);
    assert.deepEqual(groupSizes(14).sizes, [5, 5, 4]);
    assert.deepEqual(groupSizes(15).sizes, [5, 5, 5]);
  });

  it("keeps a leftover group when remainder cannot become 5s", () => {
    const result = groupSizes(6);
    assert.deepEqual(result.sizes, [4, 2]);
    assert.ok(result.warning);
  });
});

describe("makeGroups", () => {
  it("sorts by points and chunks by similar skill", () => {
    const players = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((n) => ({
      name: `P${n}`,
      points: n,
    }));
    const { groups, warning } = makeGroups(players);
    assert.equal(warning, null);
    assert.deepEqual(
      groups.map((g) => g.members.map((m) => m.name)),
      [
        ["P13", "P12", "P11", "P10", "P9"],
        ["P8", "P7", "P6", "P5"],
        ["P4", "P3", "P2", "P1"],
      ]
    );
  });

  it("puts unknown points last", () => {
    const { groups } = makeGroups([
      { name: "A", points: 10 },
      { name: "B", points: null },
      { name: "C", points: 20 },
      { name: "D", points: 15 },
    ]);
    assert.deepEqual(
      groups[0].members.map((m) => m.name),
      ["C", "D", "A", "B"]
    );
  });
});
