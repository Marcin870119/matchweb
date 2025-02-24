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

            // Filter out empty rows
            const filteredData = results.data.filter(row => {
                return row && Object.values(row).some(value => value !== null && value !== undefined && value !== "");
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
    //  const wrapper = document.getElementById('table-wrapper'); //No needed
    const wrapper = table.closest('.element-item').querySelector('.preview-container'); //DYNAMIC FIND

    thead.innerHTML = '';
    tbody.innerHTML = '';
    // wrapper.innerHTML = ''; // Don't clear entire wrapper, just the table inside!


    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
        // wrapper.appendChild(table); // Table is already there
        return;
    }

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.setAttribute('data-key', header);
        th.addEventListener('click', () => sortTable(header, tableId)); // Pass header AND tableId
        thead.appendChild(th);
    });

    const actionsHeader = document.createElement('th');
    actionsHeader.textContent = 'Actions';
    thead.appendChild(actionsHeader);

    // Get correct isTableExpanded state
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
        deleteButton.addEventListener('click', () => deleteRow(rowIndex, tableId)); // Pass rowIndex and tableId
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });

    // wrapper.appendChild(table); // Table is already in the correct place.

    // Update "Show More/Less" button text, if it exists.
    const toggleButton = document.getElementById(tableId.replace('data-table', 'toggle-table')); // Correct ID
    if (toggleButton) {
        toggleButton.textContent = expanded ? 'Show Less' : 'Show More';
    }
}



async function saveChanges() {
    // Determine which table's data to save, based on *which* save button was clicked
    // We'll need to pass an identifier to saveChanges.  Best way is with a closure.
    // See event listener setup below.
    // const updatedData = getDataFromTable(); // We need the table ID!  Pass it.

    // Find all preview tables.  This is a bit of a hack, but necessary if we're saving *all* tables
    // with *one* button press.  A better design would be to have separate save buttons per table.
    const tables = document.querySelectorAll('.preview-table');
    const allUpdatedData = {};

    for (const table of tables) {
        const tableId = table.id;
        allUpdatedData[tableId] = getDataFromTable(tableId);  // Get data *per table*
    }


    const collectionName = getCollectionName(undefined, "save changes to");
    if (!collectionName) return;

    const dbRef = ref(database, collectionName);

    try {
        // Save *all* the updated data.  This will overwrite the entire collection.
        await set(dbRef, allUpdatedData); // Save the *entire object*
        console.log('Changes saved successfully!');
        alert('Changes saved successfully!');
         // No need to update currentData or displayData here, since we are saving everything.
        // If you want to update the display, you'll need to re-fetch.
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes: ' + error.message);
    }
}



// Function to delete a row.  Needs rowIndex *and* tableId.
async function deleteRow(rowIndex, tableId) {
    const fileInputId = tableId.replace('data-table', 'fileInput'); // Get corresponding fileInputId
    const collectionName = getCollectionName(undefined, "delete from");
    if (!collectionName) return;

    const dbRef = ref(database, collectionName);

    // Calculate adjustedRowIndex based on whether *this specific table* is expanded.
    let adjustedRowIndex;
    if (!isTableExpanded[fileInputId]) { // Use the correct isTableExpanded value
        const tableRows = document.querySelectorAll(`#${tableId} tbody tr`); // Select rows from *this* table
        if (rowIndex < tableRows.length) {
            adjustedRowIndex = rowIndex;
        }
    } else {
        adjustedRowIndex = rowIndex;
    }


    if (confirm('Are you sure you want to delete this row?')) {
         if (adjustedRowIndex !== undefined && adjustedRowIndex >= 0 && adjustedRowIndex < currentData[fileInputId].length) {
            currentData[fileInputId].splice(adjustedRowIndex, 1); // Delete from the correct data array
            displayData(currentData[fileInputId], tableId); // Update *this* table
        }

        try {
            // After deleting locally, save the changes to Firebase (overwrite).
            await set(dbRef, currentData[fileInputId] ); // Save only the relevant data
            console.log('Row deleted successfully!');
            alert('Row deleted successfully from: ' + collectionName);

        } catch (error) {
            console.error('Error deleting row:', error);
            alert('Error deleting row: ' + error.message);
        }
    }
}


// Function to sort table by column.  Needs header *and* tableId.
function sortTable(header, tableId) {
    const fileInputId = tableId.replace('data-table', 'fileInput'); // Get corresponding fileInputId

    const isAscending = !document.querySelector(`#${tableId} th[data-key="${header}"]`).classList.contains('sorted-desc');

    const headers = document.querySelectorAll(`#${tableId} th`); // Select headers from *this* table
    headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));

    currentData[fileInputId].sort((a, b) => {  // Sort the correct data array
        const valueA = a[header] === null || a[header] === undefined ? '' : String(a[header]).toLowerCase();
        const valueB = b[header] === null || b[header] === undefined ? '' : String(b[header]).toLowerCase();

        if (valueA < valueB) return isAscending ? -1 : 1;
        if (valueA > valueB) return isAscending ? 1 : -1;
        return 0;
    });

    displayData(currentData[fileInputId], tableId); // Display *this* table
    document.querySelector(`#${tableId} th[data-key="${header}"]`).classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
}

// Function to toggle table expansion.  Needs tableId.
function toggleTable(tableId) {
    const fileInputId = tableId.replace('data-table', 'fileInput'); // Get corresponding fileInputId
    isTableExpanded[fileInputId] = !isTableExpanded[fileInputId]; // Toggle *this* table's state
    displayData(currentData[fileInputId], tableId);  // Re-display *this* table.
}


async function exportDataToFirebase() {
 // Similar to saveChanges - you probably want to export *all* data, not just one table.
 if (Object.keys(currentData).every(key => currentData[key].length === 0)) { // Check if all are empty
    alert("No data to export. Please upload a CSV file first.");
    return;
}

    const collectionName = getCollectionName(undefined, "export to");
    if (!collectionName) return;
    const dbRef = ref(database, collectionName);

    try {
        // Combine all data into one object/array for export.
        const allData = [];
        for (const inputId in currentData) {
            allData.push(...currentData[inputId]); // Add all data from each input
        }

        await set(dbRef, allData); // Export *all* data.  Or structure it differently if needed.
        console.log('Data exported successfully!');
        alert('Data exported successfully to collection: ' + collectionName);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    }
}


// Function to load data from Firebase.
function loadData() {
    const collectionName = getCollectionName(undefined, "load from");
    if (!collectionName) return;
    const dbRef = ref(database, collectionName);

    onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            let loadedData = snapshot.val();
            // Check if the loaded data is an array.  If not, assume it's an object and convert.
            if (!Array.isArray(loadedData)) {
              //If it not an array, we assume it is an object
              //where keys are table ids, and values are array of objects
              if (typeof loadedData === 'object' && loadedData !== null) {
                for(let tableId in loadedData){ //Iterate over table ids
                  const fileInputId = tableId.replace('data-table', 'fileInput'); //Find corresponding file input
                  if(currentData.hasOwnProperty(fileInputId)){ // Check if we have corresponding file input
                    currentData[fileInputId] = loadedData[tableId]; // Load data
                    displayData(loadedData[tableId], tableId); // Display this particular table
                  }
                }
              }
            } else {
                // If loaded data *is* an array, display it in the first table.
                currentData['fileInput1'] = loadedData;
                displayData(loadedData, 'data-table1');
            }

        } else {
             console.log(`No data found in collection: ${collectionName}`);
            // If no data was loaded, clear *all* tables.
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

// Generic function to attach file input listeners
function attachFileInputListener(inputId) {
    document.getElementById(inputId).addEventListener('change', (event) => {
        if (event.target.files[0]) {
            handleFileUpload(event.target.files[0], inputId);
        }
    });
}

// Attach listeners to all file inputs
attachFileInputListener('fileInput1');
attachFileInputListener('fileInput2');
attachFileInputListener('fileInput3');
attachFileInputListener('fileInput4');


// Event listeners for buttons (using named functions for clarity)
document.getElementById('export-button1').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button1').addEventListener('click', saveChanges);
document.getElementById('load-button1').addEventListener('click', loadData);
//document.getElementById('toggle-table1').addEventListener('click', () => toggleTable('data-table1')); //Removed, now added dynamically

document.getElementById('export-button2').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button2').addEventListener('click', saveChanges);
document.getElementById('load-button2').addEventListener('click', loadData);
//document.getElementById('toggle-table2').addEventListener('click', () => toggleTable('data-table2'));//Removed, now added dynamically

document.getElementById('export-button3').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button3').addEventListener('click', saveChanges);
document.getElementById('load-button3').addEventListener('click', loadData);

document.getElementById('export-button4').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button4').addEventListener('click', saveChanges);
document.getElementById('load-button4').addEventListener('click', loadData);
// --- Initial Setup ---

//
