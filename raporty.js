$(function () {
    // Umożliwienie przeciągania elementu .details-table-wrapper
    $("#detailsTableWrapper").draggable({
        handle: "h5" // Element, za który można przeciągać
    });
    // Umożliwienie przeciągania elementu .additional-details-wrapper
    $("#additionalDetailsWrapper").draggable({
        handle: "h5" // Element, za który można przeciągać
    });

    // Initial call to load sales data when the page loads
    loadSalesData();
    loadAdditionalSalesData();
});

let salesData = [];
let additionalSalesData = [];
let dataTable;
let additionalDataTable;

function loadSalesData() {
    fetch('https://marcin870119.github.io/matchweb/perproducent.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            salesData = data;
            console.log('Loaded sales data:', data);
            populateClientSelect(data);
        })
        .catch(error => {
            console.error('Błąd podczas wczytywania danych:', error);
            alert('Błąd podczas wczytywania danych!');
        });
}

function loadAdditionalSalesData() {
    fetch('https://marcin870119.github.io/matchweb/wartoscsprzedazy.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            additionalSalesData = data;
            console.log('Loaded additional sales data:', data);
        })
        .catch(error => {
            console.error('Błąd podczas wczytywania dodatkowych danych:', error);
            alert('Błąd podczas wczytywania dodatkowych danych!');
        });
}

function populateClientSelect(data) {
    const clientSelect = document.getElementById('clientSelect');
    clientSelect.innerHTML = '<option value="">Wybierz klienta...</option>';

    const clientMap = new Map();

    data.forEach(row => {
        if (!clientMap.has(row['Kod odb'])) {
            clientMap.set(row['Kod odb'], row['Odbiorca']);
        }
    });

    clientMap.forEach((odbiorca, kod) => {
        const option = document.createElement('option');
        option.value = kod;
        option.text = `${kod} - ${odbiorca}`;
        clientSelect.appendChild(option);
    });

    clientSelect.addEventListener('change', function () {
        if (this.value) {
            console.log(`Selected client: ${this.value}`);
            clearData();
            displayClientDetails(this.value);
        } else {
            clearData();
        }
    });
}

function displayClientDetails(kodOdb) {
    const clientDetails = salesData.filter(row => row['Kod odb'] == kodOdb);

    console.log('Client details:', clientDetails);

    const tableBody = document.querySelector("#detailsTable tbody");
    tableBody.innerHTML = "";

    clientDetails.forEach(row => {
        const tr = document.createElement('tr');
        const keys = ['Odbiorca', 'Rabat podst.', 'Rabat na producenta', 'Producent skrót', 'Grupa', 'lip 24', 'sie 24', 'wrz 24', 'paź 24', 'lis 24', 'gru 24', 'sty 25'];
        keys.forEach(key => {
            const td = document.createElement('td');
            td.textContent = typeof row[key] === 'number' ? row[key].toFixed(2) : row[key];
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    if ($.fn.dataTable.isDataTable('#detailsTable')) {
        dataTable.clear().destroy();
    }

    dataTable = $('#detailsTable').DataTable({
        scrollY: '300px',
        scrollX: true,
        scrollCollapse: true,
        paging: false,
        autoWidth: false,
        columnDefs: [
            { width: '100px', targets: '_all' }
        ],
        info: false
    });

    document.getElementById('detailsTableWrapper').classList.remove('hidden');

    $('#detailsTable tbody').off('click').on('click', 'tr', function () {
        const rowData = dataTable.row(this).data();
        console.log('Row data:', rowData);
        displayAdditionalDetails(rowData);
    });
}

function displayAdditionalDetails(rowData) {
    const odbiorca = rowData[0].trim();
    const kodKh = document.getElementById('clientSelect').value.trim();
    const additionalDetails = additionalSalesData.filter(row => row['__1'].trim() === odbiorca && row[''].toString().trim() === kodKh);

    console.log('Additional details:', additionalDetails);

    const tableBody = document.querySelector("#additionalDetailsTable tbody");
    tableBody.innerHTML = "";

    additionalDetails.forEach(row => {
        const tr = document.createElement('tr');
        const keys = ['__1', '__2', '2024', '2025', '2024__1', '2024__2', '2024__3', '2024__4', '2025__1', '2025__2', '2025__3', '2025__4'];
        keys.forEach(key => {
            const td = document.createElement('td');
            td.textContent = row[key] || '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    if ($.fn.dataTable.isDataTable('#additionalDetailsTable')) {
        additionalDataTable.clear().destroy();
    }

    additionalDataTable = $('#additionalDetailsTable').DataTable({
        scrollY: '300px',
        scrollX: true,
        scrollCollapse: true,
        paging: false,
        autoWidth: false,
        columnDefs: [
            { width: '100px', targets: '_all' }
        ],
        info: false
    });

    document.getElementById('additionalDetailsWrapper').classList.remove('hidden');
}

function clearData() {
    const tableBody = document.querySelector("#detailsTable tbody");
    tableBody.innerHTML = "";

    if (dataTable) {
        dataTable.clear().destroy();
    }

    document.getElementById('detailsTableWrapper').classList.add('hidden');

    const additionalTableBody = document.querySelector("#additionalDetailsTable tbody");
    additionalTableBody.innerHTML = "";

    if (additionalDataTable) {
        additionalDataTable.clear().destroy();
    }

    document.getElementBy