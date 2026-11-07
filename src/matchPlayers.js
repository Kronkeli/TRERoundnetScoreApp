export function normalizeName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(normalized) {
  return normalized.split(" ").filter(Boolean);
}

function lastInitial(tokenList) {
  if (tokenList.length < 2) return null;
  return tokenList[tokenList.length - 1][0];
}

function buildIndexes(sheetPlayers) {
  const byExact = new Map();
  const byFirst = new Map();

  for (const player of sheetPlayers) {
    const norm = normalizeName(player.name);
    if (!norm) continue;
    if (!byExact.has(norm)) byExact.set(norm, []);
    byExact.get(norm).push(player);

    const first = tokens(norm)[0];
    if (!byFirst.has(first)) byFirst.set(first, []);
    byFirst.get(first).push(player);
  }

  return { byExact, byFirst };
}

function unique(list) {
  return list.length === 1 ? list[0] : null;
}

function matchOne(nhName, indexes) {
  const norm = normalizeName(nhName);
  if (!norm) return null;

  const exact = unique(indexes.byExact.get(norm) || []);
  if (exact) return exact;

  const nhTokens = tokens(norm);
  const first = nhTokens[0];
  const candidates = indexes.byFirst.get(first) || [];
  if (candidates.length === 0) return null;

  const nhInitial = lastInitial(nhTokens);
  if (nhInitial) {
    const initialHits = candidates.filter((player) => {
      const sheetTokens = tokens(normalizeName(player.name));
      const sheetInitial = lastInitial(sheetTokens);
      return sheetInitial === nhInitial;
    });
    const uniqueInitial = unique(initialHits);
    if (uniqueInitial) return uniqueInitial;
  }

  return unique(candidates);
}

export function matchPlayers(nimenhuutoPlayers, sheetPlayers) {
  const indexes = buildIndexes(sheetPlayers);
  const matched = [];
  const unmatched = [];
  const used = new Set();

  for (const nh of nimenhuutoPlayers) {
    const hit = matchOne(nh.name, indexes);
    if (!hit || used.has(hit)) {
      unmatched.push({
        name: nh.name,
        nimenhuutoId: nh.id || null,
      });
      continue;
    }

    used.add(hit);
    matched.push({
      name: nh.name,
      sheetName: hit.name,
      points: hit.points,
      nimenhuutoId: nh.id || null,
    });
  }

  return { matched, unmatched };
}
