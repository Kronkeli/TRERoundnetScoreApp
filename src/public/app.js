const eventsEl = document.querySelector("#events");
const eventsStatus = document.querySelector("#eventsStatus");
const groupsSection = document.querySelector("#groupsSection");
const groupsEl = document.querySelector("#groups");
const groupsTitle = document.querySelector("#groupsTitle");
const groupsMeta = document.querySelector("#groupsMeta");
const groupsWarning = document.querySelector("#groupsWarning");
const unmatchedEl = document.querySelector("#unmatched");
const sourceBadge = document.querySelector("#sourceBadge");
const copyButton = document.querySelector("#copyGroups");

let latestPayload = null;

function formatPoints(value) {
  return value == null ? "?" : Number(value).toFixed(1);
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function renderEvents(events) {
  eventsEl.innerHTML = events
    .map(
      (event) => `
      <button type="button" class="event-card" data-id="${event.id}">
        <div class="when">${event.when || "Upcoming"}</div>
        <div>${event.title}</div>
        <div class="meta">${event.venue || ""} · IN ${event.inCount}</div>
      </button>`
    )
    .join("");
}

function renderGroups(payload) {
  latestPayload = payload;
  groupsSection.hidden = false;
  groupsTitle.textContent = payload.event.title;
  groupsMeta.textContent = `${payload.event.when} · ${payload.event.venue} · ${payload.event.inCount} IN · skills from ${payload.skillSource}`;
  sourceBadge.textContent = `Skill source: ${payload.skillSource}`;

  if (payload.warning) {
    groupsWarning.hidden = false;
    groupsWarning.textContent = payload.warning;
  } else {
    groupsWarning.hidden = true;
  }

  if (payload.unmatched.length) {
    unmatchedEl.hidden = false;
    unmatchedEl.textContent = `Unmatched names (add or fix spelling in the sheet): ${payload.unmatched
      .map((p) => p.name)
      .join(", ")}`;
  } else {
    unmatchedEl.hidden = true;
  }

  groupsEl.innerHTML = payload.groups
    .map(
      (group) => `
      <article class="group-card">
        <h3>Group ${group.id}</h3>
        <ol>
          ${group.members
            .map(
              (member) => `
            <li>
              <span>${member.name}${
                member.sheetName && member.sheetName !== member.name
                  ? ` <small>(${member.sheetName})</small>`
                  : ""
              }</span>
              <span class="points ${member.points == null ? "unknown" : ""}">${formatPoints(
                member.points
              )}</span>
            </li>`
            )
            .join("")}
        </ol>
        <div class="meta">${group.size} players · avg ${formatPoints(group.avgPoints)}</div>
      </article>`
    )
    .join("");
}

function groupsAsText(payload) {
  const lines = [
    `${payload.event.title} · ${payload.event.when}`,
    payload.event.venue,
    "",
  ];
  for (const group of payload.groups) {
    lines.push(`Group ${group.id} (avg ${formatPoints(group.avgPoints)})`);
    for (const member of group.members) {
      lines.push(`- ${member.name} ${formatPoints(member.points)}`);
    }
    lines.push("");
  }
  if (payload.unmatched.length) {
    lines.push(`Unmatched: ${payload.unmatched.map((p) => p.name).join(", ")}`);
  }
  return lines.join("\n");
}

async function loadEvents() {
  eventsStatus.textContent = "Loading events…";
  try {
    const data = await fetchJson("/api/events");
    sourceBadge.textContent = `Team: ${data.team}`;
    if (!data.events.length) {
      eventsStatus.textContent = "No upcoming events found.";
      eventsEl.innerHTML = "";
      return;
    }
    eventsStatus.textContent = `${data.events.length} upcoming events`;
    renderEvents(data.events);
  } catch (error) {
    eventsStatus.textContent = error.message;
  }
}

async function loadGroups(eventId) {
  groupsSection.hidden = false;
  groupsTitle.textContent = "Groups";
  groupsMeta.textContent = "Building groups…";
  groupsEl.innerHTML = "";
  unmatchedEl.hidden = true;
  groupsWarning.hidden = true;
  document.querySelectorAll(".event-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.id === eventId);
  });
  try {
    const payload = await fetchJson(`/api/events/${eventId}/groups`);
    renderGroups(payload);
  } catch (error) {
    groupsMeta.textContent = error.message;
  }
}

eventsEl.addEventListener("click", (event) => {
  const card = event.target.closest(".event-card");
  if (card) loadGroups(card.dataset.id);
});

document.querySelector("#reloadEvents").addEventListener("click", loadEvents);

copyButton.addEventListener("click", async () => {
  if (!latestPayload) return;
  await navigator.clipboard.writeText(groupsAsText(latestPayload));
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy groups";
  }, 1500);
});

loadEvents();
fetchJson("/api/health")
  .then((health) => {
    sourceBadge.textContent = `Skill source: ${health.skillSource}`;
  })
  .catch(() => {});
