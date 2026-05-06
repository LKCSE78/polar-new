/* ================= LOAD INSTRUMENTS ON PAGE LOAD ================= */
let instrument = [];
let filteredInstruments = []; // Used for search and pagination combo

let currentPage = 1;
const rowsPerPage = 10;

loadInstruments();

function safe(value) {
    if (value === undefined || value === null) {
        return "";
    }
    return String(value);
}

/* ================= ADD INSTRUMENT ================= */
function load() {
    const details = {
        company_name: document.getElementById("company_name").value,
        serial_no: document.getElementById("serial_no").value,
        instrument_name: document.getElementById("instrument_name").value,
        purchase_date: document.getElementById("purchase_date").value,
        model_no: document.getElementById("model_no").value
    };

    fetch("/api/add_instruments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(details)
    })
    .then(res => res.json())
    .then(response => {
        alert(response.message);
        document.getElementById("instrumentForm").reset();
        loadInstruments();
    })
    .catch(err => {
        console.error(err);
        alert("Error saving instrument");
    });
}

/* ================= LOAD TABLE ================= */

function renderTablePage(dataToRender) {
    const tbody = document.getElementById("instrumentTableBody");
    tbody.innerHTML = "";

    if (!dataToRender || dataToRender.length === 0) {
        tbody.innerHTML = `
        <tr class="empty-row">
            <td colspan="6" style="text-align: center;">No records found</td>
        </tr>`;
        document.getElementById("pagination").innerHTML = "";
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = dataToRender.slice(start, start + rowsPerPage);

    pageItems.forEach(ins => {
        tbody.innerHTML += `
        <tr>
            <td>${safe(ins.company_name)}</td>
            <td>${safe(ins.i_serial)}</td>
            <td>${safe(ins.instrument_name)}</td>
            <td>${safe(formatDate(ins.puchase_date))}</td>
            <td>${safe(ins.m_no)}</td>
            <td class="action-col">
                <button class="btn-edit" onclick="editInstruments('${safe(ins.i_serial)}')">Edit</button>
                <button class="btn-delete" onclick="deleteInstruments('${safe(ins.i_serial)}')">Delete</button>
            </td>
        </tr>`;
    });

    setupPagination(dataToRender);
}

function setupPagination(dataToRender) {
    const pageCount = Math.ceil(dataToRender.length / rowsPerPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        if (i === currentPage) btn.classList.add("active");

        btn.addEventListener("click", () => {
            currentPage = i;
            renderTablePage(dataToRender);
        });

        pagination.appendChild(btn);
    }
}

/* Searching */
function searchInstrument() {
    const text = document.getElementById("searchInput").value.toLowerCase();

    filteredInstruments = instrument.filter(i =>
        safe(i.company_name).toLowerCase().includes(text) ||
        safe(i.instrument_name).toLowerCase().includes(text) ||
        safe(i.i_serial).toLowerCase().includes(text)
    );

    currentPage = 1; // reset to first page on search
    renderTablePage(filteredInstruments);
}

function loadInstruments() {
    fetch("/api/instruments")
        .then(res => res.json())
        .then(data => {
            instrument = data;
            filteredInstruments = [...instrument];
            currentPage = 1;
            renderTablePage(filteredInstruments);
        })
        .catch(err => console.error(err));
}


/* ================= DELETE ================= */

function deleteInstruments(id) {
    if (!confirm("Delete this instrument?")) return;

    fetch("/api/del_ins", {
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
        loadInstruments();
    })
    .catch(err => console.error(err));
}

/* formatdate */
function formatDate(dateStr) {
    if (!dateStr) return "";

    const d = new Date(dateStr);

    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* ================= EDIT ================= */

function editInstruments(id) {
    const inns = instrument.find(i => String(i.i_serial) === String(id));

    if (!inns) return;

    document.getElementById("edit_customer_name").value = inns.company_name;
    document.getElementById("edit_serial_no").value = inns.i_serial;
    document.getElementById("edit_instrument_name").value = inns.instrument_name;
    document.getElementById("edit_purchase_date").value = inns.puchase_date;
    document.getElementById("edit_model_no").value = inns.m_no;

    document.getElementById("editCardOverlay").classList.remove("hidden");
}

/* ================= CLOSE EDIT ================= */

function closeEditCard() {
    document.getElementById("editCardOverlay")?.classList.add("hidden");
}

/* ================= UPDATE ================= */

function updateInstrument() {
    const data = {
        company_name: document.getElementById("edit_customer_name").value,
        serial_no: document.getElementById("edit_serial_no").value,
        instrument_name: document.getElementById("edit_instrument_name").value,
        purchase_date: document.getElementById("edit_purchase_date").value,
        model_no: document.getElementById("edit_model_no").value
    };

    fetch("/api/update_instruments", {
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
        loadInstruments();
    })
    .catch(err => console.error(err));
}
