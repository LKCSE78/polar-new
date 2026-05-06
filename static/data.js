function filterData() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        let text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}

function exportFullExcel() {
    window.location.href = '/export/excel';
}

function exportFullPDF() {
    alert('System Audit PDF generation started...');
}
