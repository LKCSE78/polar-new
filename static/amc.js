let amc = [];
let filteredAmc = [];
let currentPage = 1;
const rowsPerPage = 10;

/* Load AMC Data on init */
loadamc();

function safe(value) {
    if (value === undefined || value === null) {
        return "";
    }
    return String(value);
}

/* Add AMC Details */
function load() {
    const details = {
        company_name: document.getElementById("company_name").value,
        serial_no: document.getElementById("serial_no").value,
        instrument_name: document.getElementById("instrument_name").value,
        amc_status: document.getElementById("amc_status").value,
        amc_start: document.getElementById("amc_start").value,
        amc_end: document.getElementById("amc_end").value
    };

    fetch("/api/add_amc", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(details)
    })
    .then(res => res.json())
    .then(response => {
        alert(response.message);
        document.getElementById("amcForm").reset();
        loadamc();
    })
    .catch(err => {
        console.error(err);
        alert("Error saving AMC Details");
    });
}

/* Search AMC Details */
function searchAmc() {
    const text = document.getElementById("searchInput").value.toLowerCase();
    
    filteredAmc = amc.filter(c => 
        safe(c.company_name).toLowerCase().includes(text) ||
        safe(c.instrument_name).toLowerCase().includes(text) ||
        safe(c.i_serial).toLowerCase().includes(text)
    );
    
    currentPage = 1;
    renderTablePage();
}

/* Render Table Data with Pagination */
function renderTablePage() {
    const tbody = document.getElementById("amcTableBody");
    tbody.innerHTML = "";

    if (!filteredAmc || filteredAmc.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="text-align: center;">No records found</td></tr>`;
        document.getElementById("pagination").innerHTML = "";
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredAmc.slice(start, start + rowsPerPage);

    pageItems.forEach(c => {
        tbody.innerHTML += `
        <tr>
            <td>${safe(c.company_name)}</td>
            <td>${safe(c.instrument_name)}</td>
            <td>${safe(c.i_serial)}</td>
            <td>${safe(c.amc_status)}</td>
            <td>${safe(c.amc_start)}</td>
            <td>${safe(c.amc_end)}</td>
            <td class="action">
                <button class="edit-button" onclick="editAmc('${safe(c.i_serial)}')">Edit</button>
                <button class="del-button" onclick="deleteAmc('${safe(c.i_serial)}')">Delete</button>
            </td>
        </tr>
        `;
    });

    setupPagination();
}

function setupPagination() {
    const pageCount = Math.ceil(filteredAmc.length / rowsPerPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        if (i === currentPage) btn.classList.add("active");
        
        btn.addEventListener("click", () => {
            currentPage = i;
            renderTablePage();
        });
        
        pagination.appendChild(btn);
    }
}

function loadamc() {
    fetch("/api/amc")
      .then(r => r.json())
      .then(data => {
        amc = data;
        filteredAmc = [...amc];
        currentPage = 1;
        renderTablePage();
      })
      .catch(err => console.error("ERROR:", err));
}

/* Delete AMC */
function deleteAmc(id) {
    if (!confirm("Delete this AMC?")) return;

    fetch("/api/del_amc", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            serial_no: id
        })
    })
    .then(res => res.json())
    .then(response => {
        alert(response.message);
        loadamc();
    })
    .catch(err => console.error(err));
}

/* Edit AMC Details */
function editAmc(id){
    const am = amc.find(i => String(i.i_serial).trim() === String(id).trim());

    if(!am){
        alert("No Matching Serial No");
        return;
    }

    document.getElementById("edit-company-name").value = am.company_name;
    document.getElementById("edit-instrument-name").value = am.instrument_name;
    document.getElementById("edit-serial-no").value = am.i_serial;
    document.getElementById("edit-amc-status").value = am.amc_status;
    document.getElementById("edit-amc-start").value = am.amc_start ? am.amc_start.split("T")[0] : "";
    document.getElementById("edit-amc-end").value = am.amc_end ? am.amc_end.split("T")[0] : "";

    document.getElementById("editCardOverlay")?.classList.add("show");
}

/* Close Edit Modal */
function closeEditCard(e){
    if(e) e.preventDefault();
    document.getElementById("editCardOverlay")?.classList.remove("show");
}

/* Update Modal for Details */
function updateAMC(){
    const data = {
        serial_no: document.getElementById("edit-serial-no").value,
        company_name: document.getElementById("edit-company-name").value,
        instrument_name: document.getElementById("edit-instrument-name").value,
        amc_status: document.getElementById("edit-amc-status").value,
        amc_start: document.getElementById("edit-amc-start").value,
        amc_end: document.getElementById("edit-amc-end").value
    };

    fetch("/api/update_amc", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        alert(response.message);
        closeEditCard();
        loadamc();
    })
    .catch(err => console.error(err));
}
