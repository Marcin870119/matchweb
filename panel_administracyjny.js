import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase configuration
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

// Utility function to validate data keys (from CSV headers or table headers).
function isValidDataKey(key) {
    if (!key || key.trim() === "") {
        return false; // Keys cannot be empty
    }
    if (/[.$[\]#/]/.test(key)) {
        return false; // Keys cannot contain special characters
    }
    return true;
}

// Utility function to sanitize keys (replace invalid characters with underscores or remove them).
function sanitizeKey(key) {
    if (!key) return "default_key"; // Default if key is empty
    return key.replace(/[.$[\]#/]/g, '_').trim();
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
            if (header && isValidDataKey(header)) { // Validate the header!
                const cellValue = cell.textContent.trim();
                rowData[header] = cellValue;
                if (cellValue !== "") {
                    hasData = true;
                }
            } else if (header) {
                console.warn(`Invalid header found in table ${tableId}:`, header);
                const sanitizedHeader = sanitizeKey(header);
                if (isValidDataKey(sanitizedHeader)) {
                    const cellValue = cell.textContent.trim();
                    rowData[sanitizedHeader] = cellValue;
                    if (cellValue !== "") {
                        hasData = true;
                    }
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

function handleFileUpload(file, inputId) {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension !== 'csv') {
        alert("Unsupported file format. Please upload only CSV files.");
        return;
    }

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy', // Skip completely empty lines
        delimiter: '', // Auto-detect delimiter, trying to ignore , and ; as default
        fastMode: false, // Use strict parsing for better accuracy
        complete: function (results) {
            if (results.errors.length > 0) {
                console.error("Error parsing CSV:", results.errors);
                // Sprawdź szczegółowe błędy i dostosuj komunikat
                if (results.errors.some(error => error.code === "UndetectableDelimiter")) {
                    alert("Error parsing CSV file: Unable to detect delimiter. Please ensure a consistent separator (e.g., , ; or tab) is used. See console for details.");
                } else if (results.errors.some(error => error.code === "TooManyFields")) {
                    alert("Error parsing CSV file: Too many fields in some rows. Please ensure all rows match the number of headers. See console for details.");
                } else if (results.errors.some(error => error.code === "TooFewFields")) {
                    alert("Error parsing CSV file: Too few fields in some rows. Please ensure all rows match the number of headers. See console for details.");
                } else if (results.errors.some(error => error.type === "Array")) {
                    alert("Error parsing CSV file: Invalid CSV format or empty file. Ensure the file has headers and data. See console for details.");
                } else {
                    alert("Error parsing CSV file. See console for details.");
                }
                return;
            }

            // Log the detected delimiter for debugging
            console.log("Detected delimiter in CSV:", results.meta.delimiter);

            // Sprawdź, czy dane mają nagłówki
            if (!results.meta.fields || results.meta.fields.length === 0) {
                console.error("No headers found in CSV file.");
                alert("Error parsing CSV file: No headers found in the file. Ensure the first row contains headers.");
                return;
            }

            // Sprawdź, czy liczba pól w każdym wierszu zgadza się z liczbą nagłówków
            const headerCount = results.meta.fields.length;
            const fieldMismatchDetails = results.data.reduce((acc, row, index) => {
                const rowFields = Object.values(row).filter(value => value !== null && value !== undefined && value !== "").length;
                if (rowFields !== headerCount) {
                    acc.push(`Row ${index + 2} has ${rowFields} fields, but headers have ${headerCount}.`);
                }
                return acc;
            }, []);

            if (fieldMismatchDetails.length > 0) {
                console.error("Field mismatch detected:", fieldMismatchDetails);
                alert(`Error parsing CSV file: Some rows have more or fewer fields than headers. Please ensure all rows match the header structure. Details:\n${fieldMismatchDetails.join('\n')}`);
                return;
            }

            // Check for invalid headers *before* creating the data
            const invalidHeaders = results.meta.fields.filter(header => !isValidDataKey(header));
            if (invalidHeaders.length > 0) {
                const sanitizedHeaders = results.meta.fields.map(sanitizeKey).filter(isValidDataKey);
                if (sanitizedHeaders.length === 0) {
                    alert(`Invalid headers found in CSV: ${invalidHeaders.join(', ')}. Please fix the CSV file.`);
                    return;
                }
                console.warn("Sanitizing invalid headers:", { original: results.meta.fields, sanitized: sanitizedHeaders });
                results.meta.fields = sanitizedHeaders;
            }

            // Adjust data rows to use sanitized headers
            const headerMap = {};
            results.meta.fields.forEach((sanitizedHeader, index) => {
                headerMap[results.meta.fields[index]] = sanitizedHeader;
            });

            const adjustedData = results.data.map(row => {
                const newRow = {};
                for (let key in row) {
                    if (isValidDataKey(key)) {
                        newRow[key] = row[key];
                    } else {
                        const sanitizedKey = sanitizeKey(key);
                        if (isValidDataKey(sanitizedKey)) {
                            newRow[sanitizedKey] = row[key];
                        }
                    }
                }
                return newRow;
            });

            // Filter out empty rows AND rows with invalid keys
            const filteredData = adjustedData.filter(row => {
                if (!row) return false; // Skip null/undefined rows

                // Check if every key in the row is valid
                for (const key in row) {
                    if (!isValidDataKey(key)) {
                        return false;
                    }
                }

                return Object.values(row).some(value => value !== null && value !== undefined && value !== "");
            });

            console.log("Parsed and filtered CSV data with sanitized keys:", filteredData);

            // Store data in the correct part of currentData
            currentData[inputId] = filteredData;

            // Display data in the appropriate table
            const tableId = inputId.replace('fileInput', 'data-table'); // e.g., 'fileInput1' -> 'data-table1'
            displayData(filteredData, tableId);
        },
        error: function (error) {
            console.error('Error processing CSV file:', error);
            alert('Error processing CSV file: ' + (error.message || 'Unknown error occurred. See console for details.'));
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
        validHeaders.forEach(header => {
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
        // Sanitize all data before saving
        const sanitizedData = {};
        for (const tableId in allUpdatedData) {
            sanitizedData[tableId] = allUpdatedData[tableId].map(row => {
                const sanitizedRow = {};
                for (const key in row) {
                    if (isValidDataKey(key)) {
                        sanitizedRow[key] = row[key];
                    } else {
                        const sanitizedKey = sanitizeKey(key);
                        if (isValidDataKey(sanitizedKey)) {
                            sanitizedRow[sanitizedKey] = row[key];
                        }
                    }
                }
                return sanitizedRow;
            });
        }

        console.log("Sanitized data to be saved:", sanitizedData);
        await set(dbRef, sanitizedData);
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
            // Sanitize data before saving
            const sanitizedData = currentData[fileInputId].map(row => {
                const sanitizedRow = {};
                for (const key in row) {
                    if (isValidDataKey(key)) {
                        sanitizedRow[key] = row[key];
                    } else {
                        const sanitizedKey = sanitizeKey(key);
                        if (isValidDataKey(sanitizedKey)) {
                            sanitizedRow[sanitizedKey] = row[key];
                        }
                    }
                }
                return sanitizedRow;
            });

            await set(dbRef, sanitizedData);
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
            const sanitizedData = currentData[inputId].map(row => {
                const sanitizedRow = {};
                for (const key in row) {
                    if (isValidDataKey(key)) {
                        sanitizedRow[key] = row[key];
                    } else {
                        const sanitizedKey = sanitizeKey(key);
                        if (isValidDataKey(sanitizedKey)) {
                            sanitizedRow[sanitizedKey] = row[key];
                        }
                    }
                }
                return sanitizedRow;
            });
            allData[tableId] = sanitizedData;
        }

        console.log("Sanitized data to be exported:", allData);
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

            // Check if the loaded data is an object (as it should be)
            if (typeof loadedData === 'object' && loadedData !== null) {
                for (let tableId in loadedData) {
                    const fileInputId = tableId.replace('data-table', 'fileInput');
                    if (currentData.hasOwnProperty(fileInputId)) {
                        // Sanitize loaded data
                        const sanitizedData = loadedData[tableId].map(row => {
                            const sanitizedRow = {};
                            for (const key in row) {
                                if (isValidDataKey(key)) {
                                    sanitizedRow[key] = row[key];
                                } else {
                                    const sanitizedKey = sanitizeKey(key);
                                    if (isValidDataKey(sanitizedKey)) {
                                        sanitizedRow[sanitizedKey] = row[key];
                                    }
                                }
                            }
                            return sanitizedRow;
                        });
                        currentData[fileInputId] = sanitizedData;
                        displayData(sanitizedData, tableId);
                    }
                }
            } else {
                console.error("Loaded data is not in the expected object format.");
                alert("Error: Loaded data is not in the expected format. Expected an object with table data.");
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

// --- Initial Setup ---
