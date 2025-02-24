import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase configuration (REPLACE WITH YOUR PROJECT'S CONFIG)
const firebaseConfig = {
    apiKey: "cccc",
    authDomain: "ccccc",
    databaseURL: "cccc",
    projectId: "cccc",
    storageBucket: "ccccc",
    messagingSenderId: "cccc",
    appId: "cccc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentData = []; // Store the current data for editing -  Globally
let isTableExpanded = false; // Track table expansion state - Globally

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

// Utility function to get data from the table.
function getDataFromTable() {
    const table = document.getElementById('data-table');
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
                if(cellValue !== "") { //Check if cell has value
                    hasData = true;
                }
            }
        }
        if (hasData) { // Only add rows with data
            updatedData.push(rowData);
        }
    }
    return updatedData;
}

// Function to show prompt for collection name, with default and validation.
function getCollectionName(defaultName = "Data", action = "perform this action") {  //Added action
    const collectionName = prompt(`Please enter the collection name to ${action}:`, defaultName);
    if (!isValidCollectionName(collectionName)) {
        return null; // Return null if invalid or cancelled.
    }
    return collectionName.trim();
}
// Function to handle file upload and parsing.
function handleFileUpload(file, inputId) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy', //  Skip completely empty lines
        complete: function (results) {
            // Handle potential errors during parsing
            if (results.errors.length > 0) {
                console.error("Error parsing CSV:", results.errors);
                alert("Error parsing CSV file.  See console for details.");
                return;
            }

            //Filter out empty rows (rows where every value is null, undefined, or an empty string)
            const filteredData = results.data.filter(row => {
              return row && Object.values(row).some(value => value !== null && value !== undefined && value !== '');
            });

            currentData = filteredData; // Store the filtered data

            if (inputId === 'fileInput1') {
                displayData(currentData); // Display data for fileInput1
            } else if (inputId === 'fileInput2') {
                console.log("Data from fileInput2:", currentData); // Replace with appropriate logic
            } else if (inputId === 'fileInput3') {
                console.log("Data from fileInput3:", currentData); // Replace with appropriate logic
            } else if (inputId === 'fileInput4') {
                console.log("Data from fileInput4:", currentData); // Replace with appropriate logic
            }
        }
    });
}



// Function to display data in the table.
function displayData(data) {
    const table = document.getElementById('data-table');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    const wrapper = document.getElementById('table-wrapper'); // Get the wrapper

    thead.innerHTML = ''; // Clear previous headers
    tbody.innerHTML = ''; // Clear previous data
    wrapper.innerHTML = '';   // Clear wrapper to re-add the table


    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
        wrapper.appendChild(table);  // Add the table back, even if empty
        return;
    }

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.setAttribute('data-key', header); // For sorting
        th.addEventListener('click', sortTable);
        thead.appendChild(th);
    });

    const actionsHeader = document.createElement('th');
    actionsHeader.textContent = 'Actions';
    thead.appendChild(actionsHeader);

    const initialRows = 3;
    const dataToShow = isTableExpanded ? data : data.slice(0, initialRows);

    dataToShow.forEach((item, rowIndex) => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');
            cell.textContent = item[header] !== null && item[header] !== undefined ? item[header] : '';
            cell.setAttribute('data-header', header);
            cell.setAttribute('data-row', rowIndex);
            cell.contentEditable = true;  // Make cells editable
            row.appendChild(cell);
        });

        // Actions column (Delete button)
        const actionsCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm'); // Bootstrap classes
        deleteButton.addEventListener('click', () => deleteRow(rowIndex));
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });

    wrapper.appendChild(table); // Add the table to the wrapper element

    //Update "Show More/Less" button text.
    document.getElementById('toggle-table').textContent = isTableExpanded ? 'Show Less' : 'Show More';
}


// Function to save changes to Firebase.
async function saveChanges() {
    const updatedData = getDataFromTable();
    const collectionName = getCollectionName(undefined, "save changes to"); // Get collection name.
    if (!collectionName) return; // Exit if no valid name.

    const dbRef = ref(database, collectionName);

    try {
        await set(dbRef, updatedData);  // Use set, not update.  Overwrite existing data.
        console.log('Changes saved successfully!');
        alert('Changes saved successfully!');
        currentData = updatedData;  // Update currentData *after* successful save
        displayData(currentData);    // Re-display table
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes: ' + error.message);
    }
}


// Function to delete a row
async function deleteRow(rowIndex) {
      const collectionName = getCollectionName(undefined, "delete from");
    if (!collectionName) return;

    const dbRef = ref(database, collectionName);

    let adjustedRowIndex;
     if(!isTableExpanded) {
        const tableRows = document.querySelectorAll("#data-table tbody tr");
        if (rowIndex < tableRows.length) {
            adjustedRowIndex = rowIndex;
        }
      }
      else{
           adjustedRowIndex = rowIndex;
      }


    if (confirm('Are you sure you want to delete this row?')) {
        if (adjustedRowIndex !== undefined && adjustedRowIndex >= 0 && adjustedRowIndex < currentData.length) {
             currentData.splice(adjustedRowIndex, 1); // Remove from *local* data first.
              displayData(currentData); // Update table *before* Firebase operation.
        }

      try {
            await set(dbRef, currentData);  // Overwrite with set
            console.log('Row deleted successfully!');
            alert('Row deleted successfully from: '+collectionName);

        } catch (error) {
            console.error('Error deleting row:', error);
            alert('Error deleting row: ' + error.message);
        }

    }
}

// Function to sort table by column.
function sortTable(event) {
    const header = event.target.getAttribute('data-key');
    const isAscending = !event.target.classList.contains('sorted-desc');

    const headers = document.querySelectorAll('#data-table th');
    headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));

    currentData.sort((a, b) => {
        const valueA = a[header] === null || a[header] === undefined ? '' : String(a[header]).toLowerCase();
        const valueB = b[header] === null || b[header] === undefined ? '' : String(b[header]).toLowerCase();

        if (valueA < valueB) return isAscending ? -1 : 1;
        if (valueA > valueB) return isAscending ? 1 : -1;
        return 0;
    });

    displayData(currentData);
    event.target.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
}

// Function to toggle table expansion
function toggleTable() {
    isTableExpanded = !isTableExpanded;
    displayData(currentData);
}

// Function to EXPORT data to Firebase (triggered by button)
async function exportDataToFirebase() {
    if (currentData.length === 0) {
        alert("No data to export. Please upload a CSV file first.");
        return;
    }

    const collectionName = getCollectionName(undefined, "export to"); // Get collection name
    if (!collectionName) return; // Exit if invalid or cancelled.

    const dbRef = ref(database, collectionName);

    try {
        await set(dbRef, currentData);
        console.log('Data exported successfully!');
        alert('Data exported successfully to collection: ' + collectionName);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data: ' + error.message);
    }
}


// Function to load data from Firebase.
function loadData() {
    const collectionName = getCollectionName(undefined, "load from");  // Get collection name.
    if (!collectionName) return;  // Exit if no name.
    const dbRef = ref(database, collectionName);

    onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            let loadedData = snapshot.val();

            // Check if the loaded data is an array.  If not, assume it's an object and convert.
            if (!Array.isArray(loadedData)) {
                loadedData = Object.values(loadedData);
            }
            currentData = loadedData; // Update the global currentData
            displayData(currentData);
        } else {
            console.log(`No data found in collection: ${collectionName}`);
            displayData([]); // Display an empty table
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
document.getElementById('toggle-table').addEventListener('click', toggleTable);


// --- Initial Setup ---

// You could optionally load data on page load, or leave it to a button press.
// loadData(); // Uncomment this line if you want to prompt for a collection on page load.
