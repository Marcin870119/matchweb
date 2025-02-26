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

// Track table expansion state for *each* table.  Also an OBJECT.
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

// Utility function to validate data keys (from CSV headers or table headers).
function isValidDataKey(key) {
    return key !== null && key !== undefined && key.trim() !== "" && !(/[.$[\]#/]/.test(key));
}

// Utility function to get data from the table.  Now takes tableId as argument.
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
            if (header && isValidDataKey(header)) { // Validate the header!
                const cellValue = cell.textContent.trim();
                rowData[header] = cellValue;
                if (cellValue !== "") {
                    hasData = true;
                }
            } else if (header) {
                console.warn(`Invalid header found in table ${tableId}:`, header);
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

function handleFileUpload(file, inputId) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy', // Skip completely empty lines
        complete: function (results) {
            if (results.errors.length > 0) {
                console.error("Error parsing CSV:", results.errors);
                alert("Error parsing CSV file. See console for details.");
                return;
            }

            // Check for invalid headers *before* creating the data
            const invalidHeaders = results.meta.fields.filter(header => !isValidDataKey(header));
            if (invalidHeaders.length > 0) {
                alert(`Invalid headers found in CSV: ${invalidHeaders.join(', ')}.  Please fix the CSV file.`);
                return;
            }

            // Filter out empty rows AND rows with invalid keys
            const filteredData = results.data.filter(row => {
                if (!row) return false; // Skip null/undefined rows

                //Check if every key in the row is valid
                for (const key in row){
                    if(!isValidDataKey(key)){
                        return false;
                    }
                }

                return Object.values(row).some(value => value !== null && value !== undefined && value !== "");
            });

            // Store data in the correct part of currentData
            currentData[inputId] = filteredData;

            // Display data in the appropriate table
            const tableId = inputId.replace('fileInput', 'data-table'); // e.g., 'fileInput1' -> 'data-table1'
            displayData(filteredData, tableId);
        }
    });
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

    const headers = Object.keys(data[0]);
     // Add header validation *here* as well, in case data was loaded from Firebase
    const validHeaders = headers.filter(isValidDataKey);

    validHeaders.forEach(header => {
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
        validHeaders.forEach(header => { //Use valid headers here
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
    const allUpdatedData = {};  // Store as an object, not an array

    for (const table of tables) {
        const tableId = table.id;
        allUpdatedData[tableId] = getDataFromTable(tableId); // Key by table ID
    }

    const collectionName = getCollectionName(undefined, "save changes to");
    if (!collectionName) return;

    const dbRef = ref(database, collectionName);

    try {
        console.log("Data to be saved:", allUpdatedData); // *** CRITICAL DEBUGGING LINE ***
        await set(dbRef, allUpdatedData); // Save the object
        console.log('Changes saved successfully!');
        alert('Changes saved successfully!');
    } catch (error) {
        console.error('Error saving changes:', error); // Log the full error object
        alert('Error saving changes: ' + error.message);
    }
}


async function deleteRow(rowIndex, tableId) {
    const fileInputId = tableId.replace('data-table', 'fileInput');
    // NO collectionName prompt here.  We're modifying the *in-memory* data.
    // The saveChanges function will handle saving to Firebase.

    if (confirm('Are you sure you want to delete this row?')) {
      if (rowIndex >= 0 && rowIndex < currentData[fileInputId].length) {
            currentData[fileInputId].splice(rowIndex, 1);
            displayData(currentData[fileInputId], tableId); // Re-render the table
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
        alert("No data to export. Please upload a CSV file first.");
        return;
    }

    const collectionName = getCollectionName(undefined, "export to");
    if (!collectionName) return;
    const dbRef = ref(database, collectionName);

    try {
        // Create an object to hold all table data, keyed by table ID
        const allData = {};
        for (const inputId in currentData) {
            const tableId = inputId.replace('fileInput', 'data-table');
            allData[tableId] = currentData[inputId];  //  "data-table1": [...]
        }

        console.log("Data to be exported:", allData); // *** CRITICAL DEBUGGING LINE ***
        await set(dbRef, allData);  // Store the *object*, not a giant array
        console.log('Data exported successfully!');
        alert('Data exported successfully to collection: ' + collectionName);
    } catch (error) {
        console.error('Error exporting data:', error); // Log the full error object
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

            // Check if the loaded data is an object (as it should be)
            if (typeof loadedData === 'object' && loadedData !== null) {
                for (let tableId in loadedData) {
                    const fileInputId = tableId.replace('data-table', 'fileInput');
                    if (currentData.hasOwnProperty(fileInputId)) {
                        currentData[fileInputId] = loadedData[tableId];
                        displayData(loadedData[tableId], tableId);
                    }
                }
            } else {
                console.error("Loaded data is not in the expected object format.");
                alert("Error: Loaded data is not in the expected format.  Expected an object with table data.");
            }

        } else {
            console.log(`No data found in collection: ${collectionName}`);
            // Clear all tables
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
