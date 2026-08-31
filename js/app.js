// Uses countapi.mileshilliard.com — a free, no-signup, no-API-key counting
// service (a modern rebuild of the classic countapi.xyz). Every key is
// prefixed with COUNTER_NAMESPACE (set in config.js) so your counts don't
// collide with anyone else's.
const COUNTER_BASE = "https://countapi.mileshilliard.com/api/v1";

function counterKey(path) {
  // Turn a file path into a safe, unique counter key.
  const clean = path.replace(/[^A-Za-z0-9]+/g, "_");
  return `${COUNTER_NAMESPACE}__${clean}`;
}

function fileUrl(path) {
  const base = SITE_BASE_URL ? SITE_BASE_URL.replace(/\/$/, "") : "";
  return base ? `${base}/${path}` : path;
}

async function getCount(path) {
  try {
    const res = await fetch(`${COUNTER_BASE}/get/${counterKey(path)}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data.value || 0;
  } catch {
    return null; // service unreachable — show a dash instead of 0
  }
}

async function bumpCount(path) {
  try {
    const res = await fetch(`${COUNTER_BASE}/hit/${counterKey(path)}`);
    const data = await res.json();
    return data.value;
  } catch {
    return null;
  }
}

function whatsappShareUrl(title, url) {
  const text = `📄 ${title}\n🔗 ${url}\n\n📢 ${CHANNEL_LABEL}: ${CHANNEL_LINK}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1200);
  } catch {
    prompt("Copy this link:", text);
  }
}

function groupByTre(papers) {
  const groups = new Map();
  for (const p of papers) {
    if (!groups.has(p.tre)) groups.set(p.tre, []);
    groups.get(p.tre).push(p);
  }
  return groups;
}

function renderTable() {
  const container = document.getElementById("papers-container");
  container.innerHTML = "";

  const groups = groupByTre(PAPERS);

  for (const [tre, papers] of groups) {
    const section = document.createElement("section");
    section.className = "tre-group";

    const heading = document.createElement("h3");
    heading.textContent = tre;
    section.appendChild(heading);

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Sl. No.</th>
          <th>Level</th>
          <th>Paper Title</th>
          <th>Download</th>
          <th>Downloads</th>
          <th>Share</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    for (const p of papers) {
      const url = fileUrl(p.path);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Sl. No.">${p.sl}</td>
        <td data-label="Level">${p.level}</td>
        <td data-label="Paper Title">${p.title}</td>
        <td data-label="Download"><a class="btn btn-download" href="${p.path}" target="_blank" rel="noopener">Download</a></td>
        <td data-label="Downloads" class="count" id="count-${p.sl}">…</td>
        <td data-label="Share" class="actions">
          <a class="btn btn-share" href="${whatsappShareUrl(p.title, url)}" target="_blank" rel="noopener">Share</a>
          <button class="btn btn-copy" type="button">Copy Link</button>
        </td>
      `;

      tr.querySelector(".btn-download").addEventListener("click", async () => {
        const newVal = await bumpCount(p.path);
        if (newVal !== null) {
          document.getElementById(`count-${p.sl}`).textContent = newVal;
        }
      });

      tr.querySelector(".btn-copy").addEventListener("click", (e) => {
        copyToClipboard(url, e.target);
      });

      tbody.appendChild(tr);

      // Load the current count without incrementing it.
      getCount(p.path).then((val) => {
        const cell = document.getElementById(`count-${p.sl}`);
        if (cell) cell.textContent = val === null ? "—" : val;
      });
    }

    section.appendChild(table);
    container.appendChild(section);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".channel-link").forEach((el) => {
    el.href = CHANNEL_LINK;
    if (el.dataset.label) el.textContent = CHANNEL_LABEL;
  });
  renderTable();
});
