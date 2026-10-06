```javascript
const API_URL = "https://value-edge-backend.onrender.com";

function render(picks) {
  const root = document.getElementById("results");
  root.innerHTML = "";

  picks.slice(0, 3).forEach((p) => {
    const odds = Number(p.odds);
    const prob = Number(p.prob);

    const imp = 1 / odds;
    const edge = prob - imp;
    const ev = prob * (odds - 1) - (1 - prob);
    const fair = 1 / prob;

    const reasons = Array.isArray(p.reasons) ? p.reasons : [];
    const risks = Array.isArray(p.risks) ? p.risks : [];

    const el = document.createElement("article");
    el.className = "pick";

    el.innerHTML = `
      <div class="rank">#${p.rank} · ${p.sport}</div>

      <h2>${p.selection}</h2>

      <div class="market">
        ${p.event} · ${odds.toFixed(2)} decimal
      </div>

      <div class="grid">
        <div class="metric">
          <label>Implied</label>
          <b>${(imp * 100).toFixed(2)}%</b>
        </div>

        <div class="metric">
          <label>Model</label>
          <b>${(prob * 100).toFixed(2)}%</b>
        </div>

        <div class="metric">
          <label>Edge</label>
          <b class="positive">
            +${(edge * 100).toFixed(2)} pp
          </b>
        </div>

        <div class="metric">
          <label>EV</label>
          <b class="positive">
            +${(ev * 100).toFixed(2)}%
          </b>
        </div>

        <div class="metric">
          <label>Fair odds</label>
          <b>${fair.toFixed(2)}</b>
        </div>

        <div class="metric">
          <label>¼ Kelly</label>
          <b>
            $${(
              100 *
              Math.max(
                0,
                (
                  ((odds - 1) * prob - (1 - prob)) /
                  (odds - 1)
                ) / 4
              )
            ).toFixed(2)}
          </b>
        </div>
      </div>

      <div class="why">
        <h3>Why it may be profitable</h3>
        ${reasons.map((x) => `<div>• ${x}</div>`).join("")}
      </div>

      <div class="risks">
        <h3>Risks</h3>
        ${risks.map((x) => `<div>• ${x}</div>`).join("")}
      </div>
    `;

    root.appendChild(el);
  });
}

async function scanToday() {
  const status = document.getElementById("status");
  const button = document.getElementById("scan");

  const minOdds = Number(
    document.getElementById("minOdds").value
  );

  const maxOdds = Number(
    document.getElementById("maxOdds").value
  );

  const sports = Array.from(
    document.querySelectorAll(".sport:checked")
  ).map((input) => input.value);

  if (sports.length === 0) {
    status.textContent =
      "Please select at least one sport.";
    return;
  }

  button.disabled = true;
  button.textContent = "RESEARCHING...";
  status.textContent =
    "Running live sports research...";

  try {
    const response = await fetch(
      `${API_URL}/api/scan`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          min_odds: minOdds,
          max_odds: maxOdds,
          sports: sports,
          bankroll: 100
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        `Backend returned ${response.status}`
      );
    }

    if (!Array.isArray(data.picks)) {
      throw new Error(
        "Backend returned an invalid picks list."
      );
    }

    if (data.picks.length === 0) {
      status.textContent =
        "No qualifying bets found.";

      document.getElementById(
        "results"
      ).innerHTML = "";

      return;
    }

    status.textContent =
      `Found ${data.picks.length} qualifying pick(s).`;

    render(data.picks);

  } catch (error) {
    console.error("SCAN ERROR:", error);

    status.textContent =
      "Live research connection failed.";

    document.getElementById(
      "results"
    ).innerHTML = `
      <article class="pick">
        <h2>Connection Error</h2>
        <p>${error.message}</p>
      </article>
    `;

  } finally {
    button.disabled = false;
    button.textContent = "SCAN TODAY";
  }
}

document
  .getElementById("scan")
  .addEventListener(
    "click",
    scanToday
  );
```
