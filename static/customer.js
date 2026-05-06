let customers = [];
let filteredCustomers = [];
let currentPage = 1;
const rowsPerPage = 10;

/* Load Customers on init */
loadCustomers();

/* Add customer details */
function load() {
    const details = {
        cid: document.getElementById("cid").value,
        cname: document.getElementById("cname").value,
        ctype: document.getElementById("ctype").value,
        ccname: document.getElementById("ccname").value,
        cmail: document.getElementById("cmail").value,
        cphone: document.getElementById("phone").value
    };

    fetch("/api/add_customers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(details)
    })
    .then(res => res.json())
    .then(response => {
        alert(response.message);
        document.getElementById("customerForm").reset();
        loadCustomers();
    })
    .catch(err => console.error("Error:", err));
}

/* Search Customers */
function searchCustomer() {
    const text = document.getElementById("searchInput").value.toLowerCase();
    
    filteredCustomers = customers.filter(c =>
        String(c.company_name).toLowerCase().includes(text) ||
        String(c.contact_name).toLowerCase().includes(text) ||
        String(c.company_id).toLowerCase().includes(text)
    );
    
    currentPage = 1;
    renderTablePage();
}

/* Render Table Data with Pagination */
function renderTablePage() {
    const tbody = document.getElementById("customerTableBody");
    tbody.innerHTML = "";

    if (!filteredCustomers || filteredCustomers.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="text-align: center;">No records found</td></tr>`;
        document.getElementById("pagination").innerHTML = "";
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredCustomers.slice(start, start + rowsPerPage);

    pageItems.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${c.company_id}</td>
                <td>${c.company_name}</td>
                <td>${c.company_type}</td>
                <td>${c.contact_name}</td>
                <td>${c.cantact_mail}</td>
                <td>${c.contact_phone}</td>
                <td class="action-col">
                    <button class="btn-edit" onclick="editCustomer(${c.company_id})">Edit</button>
                    <button class="btn-delete" onclick="deleteCustomer(${c.company_id})">Delete</button>
                </td>
            </tr>
        `;
    });

    setupPagination();
}

function setupPagination() {
    const pageCount = Math.ceil(filteredCustomers.length / rowsPerPage);
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

function loadCustomers() {
    fetch("/api/customers")
      .then(r => r.json())
      .then(data => {
        customers = data;
        filteredCustomers = [...customers];
        currentPage = 1;
        renderTablePage();
      })
      .catch(err => console.error("Error loading customers:", err));
}

/* Delete Customers */
function deleteCustomer(id) {
    if (!confirm("Are you sure you want to delete this customer?")) {
        return;
    }
    fetch("/api/del_cus" ,{
        method : "POST",
        headers : { "Content-Type":"application/json"},
        body : JSON.stringify({company_id: id})
    })
    .then(res => res.json())
    .then(response => {
        alert(response.message);
        loadCustomers();
    });
}

/* Edit Customers */
function editCustomer(id) {
    const customer = customers.find(c => String(c.company_id) === String(id));
    if (!customer) return;

    document.getElementById("edit_company_id").value = customer.company_id;
    document.getElementById("edit_company_name").value = customer.company_name;
    document.getElementById("edit_company_type").value = customer.company_type;
    document.getElementById("edit_contact_name").value = customer.contact_name || customer.conatct_name; 
    document.getElementById("edit_contact_mail").value = customer.cantact_mail;
    document.getElementById("edit_contact_phone").value = customer.contact_phone;

    document.getElementById("editCardOverlay")?.classList.remove("hidden");
}

/* Close Edit Modal */
function closeEditCard() {
    document.getElementById("editCardOverlay")?.classList.add("hidden");
}

/* Update Customers */
function updateCustomer() {
    const data = {
        company_id: document.getElementById("edit_company_id").value,
        company_name: document.getElementById("edit_company_name").value,
        company_type: document.getElementById("edit_company_type").value,
        contact_name: document.getElementById("edit_contact_name").value,
        contact_mail: document.getElementById("edit_contact_mail").value,
        contact_phone: document.getElementById("edit_contact_phone").value
    };

    fetch("/api/update_customers", {
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
        loadCustomers();
    })
    .catch(err => console.error("Error updating:", err));
}
