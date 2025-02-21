let csvData = [];
let columnMappings = {};
let processedData = [];

function handleCSVFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        readCSVFile(file);
    }
}

function handleCSVFileDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
        readCSVFile(file);
    }
}

function handleCSVDragOver(event) {
    event.preventDefault();
}

function readCSVFile(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log('Wczytane dane CSV:', results.data);
            csvData = results.data;
            displayCSVData(results.meta.fields, results.data);
        },
        error: function(error) {
            alert('Błąd podczas wczytywania pliku CSV!');
            console.error(error);
        }
    });
}

function displayCSVData(headers, data) {
    const container = document.getElementById('csvTableContainer');
    container.innerHTML = '';
    
    const table = document.createElement('table');
    table.classList.add('table', 'table-striped', 'table-sm');
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '2';
        input.style.width = '40px';
        input.onchange = (event) => handleColumnMapping(header, event.target.value);
        th.appendChild(input);
        headerRow.appendChild(th);
    });
    const thAction = document.createElement('th');
    thAction.textContent = 'Akcja';
    headerRow.appendChild(thAction);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        const tdAction = document.createElement('td');
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Usuń';
        btnDelete.classList.add('btn', 'btn-danger', 'btn-sm');
        btnDelete.onclick = () => deleteRow(index);
        tdAction.appendChild(btnDelete);
        tr.appendChild(tdAction);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    container.appendChild(table);
    
    document.getElementById('dataContainer').classList.remove('hidden');

    // Make tables draggable and resizable
    $("#csvTableWrapper").draggable().resizable({ handles: "all" });
    $("#jsonTableWrapper").draggable().resizable({ handles: "all" });
}

function handleColumnMapping(header, value) {
    columnMappings[header] = parseInt(value, 10);
}

function deleteRow(index) {
    csvData.splice(index, 1);
    displayCSVData(Object.keys(csvData[0]), csvData);
}

function processCSV() {
    const valueColumn = Object.keys(columnMappings).find(header => columnMappings[header] === 1);
    const value5Column = Object.keys(columnMappings).find(header => columnMappings[header] === 2);

    if (!valueColumn || !value5Column) {
        alert('Upewnij się, że przypisałeś kolumny do wartości 1 i 2!');
        return;
    }

    processedData = csvData.map(row => ({
        "wartosc": row[valueColumn],
        "wartosc (5)": row[value5Column]
    }));

    const jsonString = JSON.stringify(processedData, null, 2);
    displayJSONData(jsonString);
}

function displayJSONData(jsonData) {
    const jsonOutput = document.getElementById('jsonOutput');
    jsonOutput.textContent = jsonData;
}

function saveJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function showMatchJSONPage() {
    window.location.href = "bithubweb.html";
}