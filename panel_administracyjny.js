import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase configuration (REPLACE WITH YOUR ACTUAL CONFIGURATION)
const firebaseConfig = {
    apiKey: "AIzaSyCPZ0OsJmaDpJjkVFl3vGv4WalDYDY23xQ",
    authDomain: "webmatcher-94f0e.firebaseapp.com",
    databaseURL: "https://webmatcher-94f0e-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "webmatcher-94f0e",
    storageBucket: "webmatcher-94f0e.firebasestorage.app",
    messagingSenderId: "970664630623",
    appId: "G-RMMBEY655B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Store current data for *each* table.  This is an OBJECT, not an array.
const currentData = {
    'fileInput1': [],
    'fileInput2': [],
    'fileInput3': [],
    'fileInput4': []
};

// Track table expansion state for *each* table.  Also an OBJECT.
const isTableExpanded = {
    'fileInput1': false,
    'fileInput2': false,
    'fileInput3': false,
    'fileInput4': false
};

// --- Helper Functions ---

// Utility function to validate collection names.
function isValidCollectionName(name) {
    if (!name || name.trim() === "") {
        alert("Collection name cannot be empty.");
        return false;
    }
    if (/[.$[\]#/]/.test(name)) {
        alert("Collection name contains invalid characters (. $ [ ] # /).");
        return false;
    }
    return true;
}

// Utility function to get data from the table.  Now takes tableId as argument.
function getDataFromTable(tableId) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tbody tr');
    const updatedData = [];

    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        const rowData = {};
        let hasData = false;

        for (const cell of cells) {
            const header = cell.getAttribute('data-header');
            if (header) {
                const cellValue = cell.textContent.trim();
                rowData[header] = cellValue;
                if (cellValue !== "") {
                    hasData = true;
                }
            }
        }
        if (hasData) {
            updatedData.push(rowData);
        }
    }
    return updatedData;
}

// Function to show prompt for collection name, with default and validation.
function getCollectionName(defaultName = "Data", action = "perform this action") {
    const collectionName = prompt(`Please enter the collection name to ${action}:`, defaultName);
    if (!isValidCollectionName(collectionName)) {
        return null; // Return null if invalid or cancelled.
    }
    return collectionName.trim();
}

// --- Data Handling Functions ---

async function handleFileUpload(file, inputId) {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    try {
        let parsedData = [];

        if (fileExtension === 'csv') {
            // Parsowanie CSV z obsługą separatorów ; i , (auto-detect lub ręczne ustawienie)
            parsedData = await new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: 'greedy', // Pomija puste linie
                    delimiter: [',', ';'], // Explicit obsługa separatorów , i ;
                    complete: function (results) {
                        if (results.errors.length > 0) {
                            console.error("Error parsing CSV:", results.errors);
                            reject(new Error("Error parsing CSV file."));
                            return;
                        }

                        // Filtruj puste wiersze i wiersze z samymi pustymi wartościami
                        const filteredData = results.data.filter(row => {
                            return row && Object.values(row).some(value => value !== null && value !== undefined && value !== "");
                        });

                        resolve(filteredData);
                    },
                    error: reject
                });
            });
        } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
            // Parsowanie XLS/XLSX przy użyciu SheetJS
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });

            // Konwertuj dane na format z nagłówkami jako klucze (podobnie jak CSV)
            if (parsedData.length > 0 && parsedData[0].length > 0) {
                const headers = parsedData[0].map(header => header || `Column${headers.length + 1}`); // Handle empty headers
                parsedData = parsedData.slice(1).map(row => {
                    const rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index] !== undefined ? row[index] : '';
                    });
                    return rowData;
                });

                // Filtruj puste wiersze
                parsedData = parsedData.filter(row => {
                    return Object.values(row).some(value => value !== null && value !== undefined && value !== "");
                });
            }
        } else {
            throw new Error("Unsupported file format. Please upload CSV, XLS, or XLSX files.");
        }

        // Store data in the correct part of currentData
        currentData[inputId] = parsedData;

        // Display data in the appropriate table
        const tableId = inputId.replace('fileInput', 'data-table'); // e.g., 'fileInput1' -> 'data-table1'
        displayData(parsedData, tableId);
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file: ' + error.message);
    }
}

function displayData(data, tableId) {
    const table = document.getElementById(tableId);
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    const wrapper = table.closest('.element-item').querySelector('.preview-container');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
        return;
    }

    const headers = Object.keys(data[0] || {});
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.setAttribute('data-key', header);
        th.addEventListener('click', () => sortTable(header, tableId));
        thead.appendChild(th);
    });

    const actionsHeader = document.createElement('th');
    actionsHeader.textContent = 'Actions';
    thead.appendChild(actionsHeader);

    const fileInputId = tableId.replace('data-table', 'fileInput');
    const expanded = isTableExpanded[fileInputId];

    const initialRows = 3;
    const dataToShow = expanded ? data : data.slice(0, initialRows);

    dataToShow.forEach((item, rowIndex) => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');
            cell.textContent = item[header] !== null && item[header] !== undefined ? item[header] : '';
            cell.setAttribute('data-header', header);
            cell.setAttribute('data-row', rowIndex);
            cell.contentEditable = true;
            row.appendChild(cell);
        });

        const actionsCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteButton.addEventListener('click', () => deleteRow(rowIndex, tableId));
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });

    // Dodaj scrollowanie dla rozwiniętej tabeli
    if (expanded) {
        wrapper.classList.add('expanded');
    } else {
        wrapper.classList.remove('expanded');
    }

    const toggleButton = document.getElementById(tableId.replace('data-table', 'toggle-table'));
    if (toggleButton) {
        toggleButton.textContent = expanded ? 'Show Less' : 'Show More';
    }
}

async function saveChanges() {
    const tables = document.querySelectorAll('.preview-table');
    const allUpdatedData = {};

    for (const table of tables) {
        const tableId = table.id;
        allUpdatedData[tableId] = getDataFromTable(tableId);
    }

    const collectionName = getCollectionName(undefined, "save changes to");
    if (!collectionName) return;

    const dbRef = ref(database, collectionName);

    try {
        await set(dbRef, allUpdatedData);
        console.log('Changes saved successfully!');
        alert('Changes saved successfully!');
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes: ' + error.message);
    }
}

async function deleteRow(rowIndex, tableId) {
    const fileInputId = tableId.replace('data-table', 'fileInput');
    const collectionName = getCollectionName(undefined, "delete from");
    if (!collectionName) return;

    const dbRef = ref(database, collectionName);

    let adjustedRowIndex;
    if (!isTableExpanded[fileInputId]) {
        const tableRows = document.querySelectorAll(`#${tableId} tbody tr`);
        if (rowIndex < tableRows.length) {
            adjustedRowIndex = rowIndex;
        }
    } else {
        adjustedRowIndex = rowIndex;
    }

    if (confirm('Are you sure you want to delete this row?')) {
        if (adjustedRowIndex !== undefined && adjustedRowIndex >= 0 && adjustedRowIndex < currentData[fileInputId].length) {
            currentData[fileInputId].splice(adjustedRowIndex, 1);
            displayData(currentData[fileInputId], tableId);
        }

        try {
            await set(dbRef, currentData[fileInputId]);
            console.log('Row deleted successfully!');
            alert('Row deleted successfully from: ' + collectionName);
        } catch (error) {
            console.error('Error deleting row:', error);
            alert('Error deleting row: ' + error.message);
        }
    }
}

function sortTable(header, tableId) {
    const fileInputId = tableId.replace('data-table', 'fileInput');

    const isAscending = !document.querySelector(`#${tableId} th[data-key="${header}"]`).classList.contains('sorted-desc');

    const headers = document.querySelectorAll(`#${tableId} th`);
    headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));

    currentData[fileInputId].sort((a, b) => {
        const valueA = a[header] === null || a[header] === undefined ? '' : String(a[header]).toLowerCase();
        const valueB = b[header] === null || b[header] === undefined ? '' : String(b[header]).toLowerCase();

        if (valueA < valueB) return isAscending ? -1 : 1;
        if (valueA > valueB) return isAscending ? 1 : -1;
        return 0;
    });

    displayData(currentData[fileInputId], tableId);
    document.querySelector(`#${tableId} th[data-key="${header}"]`).classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
}

function toggleTable(tableId) {
    const fileInputId = tableId.replace('data-table', 'fileInput');
    isTableExpanded[fileInputId] = !isTableExpanded[fileInputId];
    
    const wrapper = document.getElementById(tableId).closest('.element-item').querySelector('.preview-container');
    if (isTableExpanded[fileInputId]) {
        wrapper.classList.add('expanded');
    } else {
        wrapper.classList.remove('expanded');
    }
    
    displayData(currentData[fileInputId], tableId);
}

async function exportDataToFirebase() {
    if (Object.keys(currentData).every(key => currentData[key].length === 0)) {
        alert("No data to export. Please upload a CSV, XLS, or XLSX file first.");
        return;
    }

    const collectionName = getCollectionName(undefined, "export to");
    if (!collectionName) return;
    const dbRef = ref(database, collectionName);

    try {
        const allData = [];
        for (const inputId in currentData) {
            allData.push(...currentData[inputId]);
        }

        await set(dbRef, allData);
        console.log('Data exported successfully!');
        alert('Data exported successfully to collection: ' + collectionName);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    }
}

function loadData() {
    const collectionName = getCollectionName(undefined, "load from");
    if (!collectionName) return;
    const dbRef = ref(database, collectionName);

    onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            let loadedData = snapshot.val();
            if (!Array.isArray(loadedData)) {
                if (typeof loadedData === 'object' && loadedData !== null) {
                    for(let tableId in loadedData){
                        const fileInputId = tableId.replace('data-table', 'fileInput');
                        if(currentData.hasOwnProperty(fileInputId)){
                            currentData[fileInputId] = loadedData[tableId];
                            displayData(loadedData[tableId], tableId);
                        }
                    }
                }
            } else {
                currentData['fileInput1'] = loadedData;
                displayData(loadedData, 'data-table1');
            }
        } else {
            console.log(`No data found in collection: ${collectionName}`);
            for (const inputId in currentData) {
                displayData([], inputId.replace('fileInput', 'data-table'));
            }
        }
    }, (error) => {
        console.error("Error fetching data: ", error);
        alert("Error fetching data: " + error.message);
    });
}

// --- Event Listeners ---

function attachFileInputListener(inputId) {
    document.getElementById(inputId).addEventListener('change', (event) => {
        if (event.target.files[0]) {
            handleFileUpload(event.target.files[0], inputId);
        }
    });
}

attachFileInputListener('fileInput1');
attachFileInputListener('fileInput2');
attachFileInputListener('fileInput3');
attachFileInputListener('fileInput4');

document.getElementById('export-button1').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button1').addEventListener('click', saveChanges);
document.getElementById('load-button1').addEventListener('click', loadData);
document.getElementById('toggle-table1').addEventListener('click', () => toggleTable('data-table1'));

document.getElementById('export-button2').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button2').addEventListener('click', saveChanges);
document.getElementById('load-button2').addEventListener('click', loadData);
document.getElementById('toggle-table2').addEventListener('click', () => toggleTable('data-table2'));

document.getElementById('export-button3').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button3').addEventListener('click', saveChanges);
document.getElementById('load-button3').addEventListener('click', loadData);
document.getElementById('toggle-table3').addEventListener('click', () => toggleTable('data-table3'));

document.getElementById('export-button4').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button4').addEventListener('click', saveChanges);
document.getElementById('load-button4').addEventListener('click', loadData);
document.getElementById('toggle-table4').addEventListener('click', () => toggleTable('data-table4'));

// --- Import SheetJS and Papa Parse for file support ---
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.mjs';
import * as Papa from 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js';
