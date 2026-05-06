// data + pagination
let ser = [];
let filteredSer = [];
let currentPage = 1;
const rowsPerPage = 10;

function setCurrentDate() {
    const el = document.getElementById('current-date');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString();
}
setCurrentDate();

function renderTablePage() {
    const tbody = document.getElementById('serTableBody');
    tbody.innerHTML = '';
    if (!filteredSer || filteredSer.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8" style="text-align:center">No records found</td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredSer.slice(start, start + rowsPerPage);
    for (const c of pageItems) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.ser_no ?? ''}</td>
            <td>${c.customer_name ?? c.company_name ?? ''}</td>
            <td>${c.i_name ?? c.instrument_name ?? ''}</td>
            <td>${c.i_serial ?? c.serial_no ?? ''}</td>
            <td>${c.m_no ?? c.model_no ?? ''}</td>
            <td>${c.type ?? c.issue ?? ''}</td>
            <td>${c.action_taken ?? c.action ?? ''}</td>
            <td class="action">
                <button class="edit-button" onclick="editSer('${c.ser_no ?? c.i_serial}')">Edit</button>
                <button class="del-button" onclick="deleteSer('${c.ser_no ?? c.i_serial}')">Delete</button>
            </td>`;
        tbody.appendChild(tr);
    }
    setupPagination();
}

function setupPagination() {
    const pageCount = Math.ceil(filteredSer.length / rowsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTablePage();
        });
        pagination.appendChild(btn);
    }
}

// Search Functionality
function searchSer() {
    const text = document.getElementById('searchInput').value.toLowerCase();
    
    filteredSer = ser.filter(c => 
        String(c.ser_no ?? '').toLowerCase().includes(text) ||
        String(c.customer_name ?? c.company_name ?? '').toLowerCase().includes(text) ||
        String(c.i_name ?? c.instrument_name ?? '').toLowerCase().includes(text) ||
        String(c.i_serial ?? c.serial_no ?? '').toLowerCase().includes(text)
    );
    
    currentPage = 1;
    renderTablePage();
}

// Load service list
function loadSer() {
    fetch('/api/ser')
        .then(r => r.json())
        .then(data => {
            ser = Array.isArray(data) ? data : [];
            filteredSer = [...ser];
            currentPage = 1;
            renderTablePage();
        })
        .catch(err => {
            console.error('ERROR:', err);
            ser = [];
            filteredSer = [];
            renderTablePage();
        });
}
loadSer();

// Save new service
function saveSer() {
    const details = {
        ser_no: document.getElementById('ser_no').value.trim(),
        company_name: document.getElementById('company_name').value.trim(),
        i_name: document.getElementById('instrument_name').value.trim(),
        i_serial: document.getElementById('serial_no').value.trim(),
        m_no: document.getElementById('model_no').value.trim(),
        type: document.getElementById('issue').value.trim(),
        action_taken: document.getElementById('action_taken').value.trim()
    };
    fetch('/api/add_ser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
    })
        .then(r => r.json())
        .then(resp => {
            alert(resp.message || 'Saved');
            document.getElementById('serForm').reset();
            loadSer();
        })
        .catch(err => {
            console.error(err);
            alert('Error saving Service Details');
        });
}

// Delete service
function deleteSer(id) {
    if (!id) return;
    if (!confirm('Delete this SERVICE?')) return;
    fetch('/api/del_ser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ser_no: id })
    })
        .then(r => r.json())
        .then(resp => {
            alert(resp.message || 'Deleted');
            loadSer();
        })
        .catch(err => console.error(err));
}

// Edit flow
function editSer(id) {
    if (!id) return;
    const item = ser.find(s => String(s.ser_no) === String(id) || String(s.i_serial) === String(id));
    if (!item) return;
    document.getElementById('edit-ser-no').value = item.ser_no ?? '';
    document.getElementById('edit-company-name').value = item.customer_name ?? item.company_name ?? '';
    document.getElementById('edit-instrument-name').value = item.i_name ?? item.instrument_name ?? '';
    document.getElementById('edit-serial-no').value = item.i_serial ?? item.serial_no ?? '';
    document.getElementById('edit-model-no').value = item.m_no ?? item.model_no ?? '';
    document.getElementById('edit-issue-type').value = item.type ?? item.issue ?? '';
    document.getElementById('edit-action-taken').value = item.action_taken ?? item.action ?? '';
    document.getElementById('editCardOverlay').classList.add('show');
}

function closeEditCard() {
    document.getElementById('editCardOverlay').classList.remove('show');
}

function updateSer() {
    const details = {
        ser_no: document.getElementById('edit-ser-no').value,
        company_name: document.getElementById('edit-company-name').value,
        i_name: document.getElementById('edit-instrument-name').value,
        i_serial: document.getElementById('edit-serial-no').value,
        m_no: document.getElementById('edit-model-no').value,
        type: document.getElementById('edit-issue-type').value,
        action_taken: document.getElementById('edit-action-taken').value
    };
    fetch('/api/edit-ser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
    })
        .then(r => r.json())
        .then(resp => {
            alert(resp.message || 'Updated');
            closeEditCard();
            loadSer();
        })
        .catch(err => console.error('ERROR:', err));
}
