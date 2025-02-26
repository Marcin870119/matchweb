// ***** PART 1: Firebase Setup, Data Structures, Helper Functions *****

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- Firebase Configuration (REPLACE WITH YOUR ACTUAL CONFIGURATION) ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Store current data for each table.  This is an OBJECT, not an array.
const currentData = {
    'fileInput1': [],
    'fileInput2': [],
    'fileInput3': [],
    'fileInput4': []
};

// Track table expansion state for each table.  Also an OBJECT.
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
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension !== 'csv') {
        alert("Unsupported file format. Please upload only CSV files.");
        return;
    }
    //Wrap Papa.parse in a try...catch block
    try {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: 'greedy',
            delimiter: [',', ';'],
            fastMode: false,
            complete: function (results) {

                if (results.errors.length > 0) {
                    console.error("Error parsing CSV:", results.errors);
                    //Specific error messages
                    if (results.errors.some(error => error.code === "TooManyFields")) {
                        alert("Error parsing CSV file: Too many fields in some rows. Ensure all rows match the number of headers.");
                    } else if (results.errors.some(error => error.code === "UndetectableDelimiter")) {
                        alert("Error parsing CSV file: Unable to detect delimiter (try using , or ;).");
                    } else if (results.errors.some(error => error.code === "TooFewFields")) {
                        alert("Error parsing CSV file: Too few fields in some rows. Ensure all rows match the number of headers.");
                    } else {
                        alert("Error parsing CSV file. See console for details.");
                    }
                    return;
                }

                // Log the detected delimiter
                console.log("Detected delimiter in CSV:", results.meta.delimiter);

                // Check for headers
                if (!results.meta.fields || results.meta.fields.length === 0) {
                    console.error("No headers found in CSV file.");
                    alert("Error: No headers found in the CSV file. The first row should contain headers.");
                    return;
                }

                // Check field count
                const headerCount = results.meta.fields.length;
                const hasFieldMismatch = results.data.some(row => {
                  const rowFields = Object.keys(row).length;
                  return rowFields !== headerCount
                });

                if (hasFieldMismatch) {
                    console.error("Field mismatch detected: Some rows have a different number of fields than headers.");
                    alert("Error: Some rows have a different number of fields than headers. Please check your CSV file.");
                    return;
                }


                // Filter out empty rows
                const filteredData = results.data.filter(row => {
                    return row && Object.values(row).some(value => value !== null && value !== undefined && value !== "");
                });

                console.log("Parsed and filtered CSV data:", filteredData);

                // Store data in the correct part of currentData
                currentData[inputId] = filteredData;

                // Display data in the appropriate table
                const tableId = inputId.replace('fileInput', 'data-table'); // e.g., 'fileInput1' -> 'data-table1'
                displayData(filteredData, tableId);
            },
            error: function (error) {
                console.error('Error processing CSV file:', error);
                alert('Error processing CSV file: ' + (error.message || 'Unknown error.'));
            }
        });
    } catch (error) {
        console.error("An unexpected error occurred:", error);
        alert("An unexpected error occurred: " + error.message);
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

    const headers = Object.keys(data[0]);
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
            cell.setAttribute('data-row', rowIndex); //Keep this for getDataFromTable
            cell.contentEditable = true;
            row.appendChild(cell);
        });

        const actionsCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteButton.addEventListener('click', () => deleteRow(rowIndex, tableId)); //Keep rowIndex
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });

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
// ***** PART 2:  Data Modification, Firebase Interaction *****

async function saveChanges() {
    const tables = document.querySelectorAll('.preview-table');
    const allUpdatedData = {};

    for (const table of tables) {
        const tableId = table.id;
        const fileInputId = tableId.replace('data-table', 'fileInput'); // Get corresponding fileInputId
        allUpdatedData[fileInputId] = getDataFromTable(tableId); // Use fileInputId as the key
    }

    const collectionName = getCollectionName(undefined, "save changes to");
    if (!collectionName) return;

    const dbRef = ref(database, collectionName);

    try {
        // Use set() with the entire allUpdatedData object
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

    if (confirm('Are you sure you want to delete this row?')) {
        // Get the correct index, even if the table is showing only a few rows
        let actualRowIndex = rowIndex;
        if (!isTableExpanded[fileInputId]) {
            // If not expanded, the rowIndex is correct within the displayed rows.
            // But we need the index within the *full* currentData array.
            // Since displayData only shows the first initialRows, the displayed
            // rowIndex *is* the actual index in currentData.
            actualRowIndex = rowIndex;
        } //If the table is expanded the row index is the correct index

        // Modify currentData *only* if the user confirms
        if (actualRowIndex >= 0 && actualRowIndex < currentData[fileInputId].length) {
            currentData[fileInputId].splice(actualRowIndex, 1);
            displayData(currentData[fileInputId], tableId); // Update the display
        }
    }
}
function sortTable(header, tableId) {
    const fileInputId = tableId.replace('data-table', 'fileInput');
    const table = document.getElementById(tableId); // Get table element
    const th = table.querySelector(`th[data-key="${header}"]`); //Get header element

    const isAscending = !th.classList.contains('sorted-desc');

    // Remove sorting classes from all headers within the *current* table
    const headers = table.querySelectorAll('th');
    headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));

    currentData[fileInputId].sort((a, b) => {
        const valueA = a[header] === null || a[header] === undefined ? '' : String(a[header]).toLowerCase();
        const valueB = b[header] === null || b[header] === undefined ? '' : String(b[header]).toLowerCase();

        if (valueA < valueB) return isAscending ? -1 : 1;
        if (valueA > valueB) return isAscending ? 1 : -1;
        return 0;
    });

    displayData(currentData[fileInputId], tableId);
    th.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc'); //Add to the clicked header
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
        const allData = {};
        for (const inputId in currentData) {
          if (currentData.hasOwnProperty(inputId)) {
              allData[inputId] = currentData[inputId]; // Store each table's data separately
          }
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
            // Check if loaded data is an array (old format) or an object (new format)
            if (Array.isArray(loadedData)) {
                // Old format:  Assume it's for table 1.
                currentData['fileInput1'] = loadedData;
                displayData(loadedData, 'data-table1');
            } else if (typeof loadedData === 'object' && loadedData !== null) {
                // New format: Data is stored per table.
                for (let fileInputId in loadedData) {
                    if (currentData.hasOwnProperty(fileInputId)) {
                        currentData[fileInputId] = loadedData[fileInputId];
                        const tableId = fileInputId.replace('fileInput', 'data-table');
                        displayData(currentData[fileInputId], tableId);
                    }
                }
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
// ***** PART 3: Event Listeners and Initialization *****

function attachFileInputListener(inputId) {
    document.getElementById(inputId).addEventListener('change', (event) => {
        if (event.target.files[0]) {
            handleFileUpload(event.target.files[0], inputId);
        }
    });
}

// Attach listeners to all file input elements
attachFileInputListener('fileInput1');
attachFileInputListener('fileInput2');
attachFileInputListener('fileInput3');
attachFileInputListener('fileInput4');

// Attach listeners to buttons for table 1
document.getElementById('export-button1').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button1').addEventListener('click', saveChanges);
document.getElementById('load-button1').addEventListener('click', loadData);
document.getElementById('toggle-table1').addEventListener('click', () => toggleTable('data-table1'));

// Attach listeners to buttons for table 2
document.getElementById('export-button2').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button2').addEventListener('click', saveChanges);
document.getElementById('load-button2').addEventListener('click', loadData);
document.getElementById('toggle-table2').addEventListener('click', () => toggleTable('data-table2'));

// Attach listeners to buttons for table 3
document.getElementById('export-button3').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button3').addEventListener('click', saveChanges);
document.getElementById('load-button3').addEventListener('click', loadData);
document.getElementById('toggle-table3').addEventListener('click', () => toggleTable('data-table3'));

// Attach listeners to buttons for table 4
document.getElementById('export-button4').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button4').addEventListener('click', saveChanges);
document.getElementById('load-button4').addEventListener('click', loadData);
document.getElementById('toggle-table4').addEventListener('click', () => toggleTable('data-table4'));
