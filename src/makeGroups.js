function averagePoints(members) {
  const known = members.filter((m) => m.points != null);
  if (known.length === 0) return null;
  const sum = known.reduce((acc, m) => acc + m.points, 0);
  return Math.round((sum / known.length) * 100) / 100;
}

export function groupSizes(n) {
  if (n <= 0) {
    return { sizes: [], warning: null };
  }
  if (n < 4) {
    return {
      sizes: [n],
      warning: `Only ${n} player${n === 1 ? "" : "s"} — not enough for a group of 4.`,
    };
  }

  const extra = n % 4;
  const groupsOfFour = Math.floor(n / 4);

  if (extra === 0) {
    return { sizes: Array(groupsOfFour).fill(4), warning: null };
  }

  if (extra <= groupsOfFour) {
    return {
      sizes: [...Array(extra).fill(5), ...Array(groupsOfFour - extra).fill(4)],
      warning: null,
    };
  }

  return {
    sizes: [...Array(groupsOfFour).fill(4), extra],
    warning: `Could not absorb remainder into groups of 5; last group has ${extra}.`,
  };
}

export function makeGroups(players) {
  const sorted = [...players].sort((a, b) => {
    if (a.points == null && b.points == null) {
      return a.name.localeCompare(b.name, "fi");
    }
    if (a.points == null) return 1;
    if (b.points == null) return -1;
    if (b.points !== a.points) return b.points - a.points;
    return a.name.localeCompare(b.name, "fi");
  });

  const { sizes, warning } = groupSizes(sorted.length);
  const groups = [];
  let index = 0;

  sizes.forEach((size, i) => {
    const members = sorted.slice(index, index + size);
    index += size;
    groups.push({
      id: i + 1,
      size: members.length,
      avgPoints: averagePoints(members),
      members,
    });
  });

  return { groups, warning };
}
