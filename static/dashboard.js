/* ---------- DASHBOARD STATS ---------- */
fetch("/api/dashboard/stats")
  .then(res => res.json())
  .then(d => {
    document.getElementById("total-customers").innerText   = d.customers        ?? "0";
    document.getElementById("active-instruments").innerText = d.instruments     ?? "0";
    document.getElementById("pending-services").innerText  = d.pending_services ?? "0";
    document.getElementById("critical-issues").innerText   = d.critical         ?? "0";
  })
  .catch(() => {
    ["total-customers","active-instruments","pending-services","critical-issues"]
      .forEach(id => { const el = document.getElementById(id); if(el) el.innerText = "—"; });
  });

/* ---------- RECENT CUSTOMERS ---------- */
fetch("/api/customers/recent")
  .then(r => r.json())
  .then(data => {
    const body = document.getElementById("recent-customers-body");
    if (!data || !data.length) {
      body.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#6b7a93;">No recent records</td></tr>`;
      return;
    }
    body.innerHTML = data.map(c => `
      <tr>
        <td>${c.company_id  ?? "—"}</td>
        <td>${c.company_name ?? "—"}</td>
        <td>${c.contact_name ?? "—"}</td>
        <td>${c.contact_phone ?? "—"}</td>
      </tr>`).join("");
  })
  .catch(() => {
    const body = document.getElementById("recent-customers-body");
    if(body) body.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#e06b6b;">Failed to load data</td></tr>`;
  });

/* ---------- PENDING SERVICES ---------- */
fetch("/api/services/pending")
  .then(r => r.json())
  .then(data => {
    const body = document.getElementById("pending-services-body");
    if (!data || !data.length) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#6b7a93;">No pending services</td></tr>`;
      return;
    }
    body.innerHTML = data.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.customer_name       ?? "—"}</td>
        <td>${s.i_type             ?? "—"}</td>
        <td>${s.i_serial           ?? "—"}</td>
        <td>${s.problem_reported   ?? "—"}</td>
        <td><span class="status-badge">${s.status ?? "—"}</span></td>
      </tr>`).join("");
  })
  .catch(() => {
    const body = document.getElementById("pending-services-body");
    if(body) body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#e06b6b;">Failed to load data</td></tr>`;
  });

/* ---------- AUTH ---------- */
function logout() {
  fetch("/logout").then(() => window.location.href = "/");
}
