import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase configuration (Replace with your project's config)
const firebaseConfig = {
    apiKey: "xxxx,
    authDomain: "xxxx",
    databaseURL: "xxxxe.app",
    projectId: "xxxxe",
    storageBucket: "webxxxxxge.app",
    messagingSenderId: "9xxxxx3",
    appId: "Gxxxxxx5B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentData = []; // Store the current data for editing
let isTableExpanded = false; // Track table expansion state

// Function to handle file upload and parsing.  NO automatic upload.
function handleFileUpload(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function (results) {
            currentData = results.data;
            displayData(currentData);
            // Do NOT upload here.
        }
    });
}

// Function to EXPORT data to Firebase (triggered by button)
async function exportDataToFirebase() {
    if (currentData.length === 0) {
        alert("No data to export. Please upload a CSV file first.");
        return;
    }

    let collectionName = prompt("Please enter a name for this data collection:", "Data");

    if (collectionName === null || collectionName.trim() === "") {
        alert("Collection name cannot be empty. Export cancelled.");
        return;
    }
    if (/[.$[\]#/]/.test(collectionName)) {
        alert("Collection name contains invalid characters (. $ [ ] # /). Export cancelled.");
        return;
    }
    collectionName = collectionName.trim();

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


// Function to display data in the table.  Handles showing only a few rows initially.
function displayData(data) {
    const table = document.getElementById('data-table');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    const wrapper = document.getElementById('table-wrapper');

    thead.innerHTML = '';
    tbody.innerHTML = '';
    wrapper.innerHTML = ''; // Clear the wrapper


    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
        wrapper.appendChild(table); // Add the table even if it's empty
        return;
    }

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.setAttribute('data-key', header);
        th.addEventListener('click', sortTable);
        thead.appendChild(th);
    });

    const actionsHeader = document.createElement('th');
    actionsHeader.textContent = 'Actions';
    thead.appendChild(actionsHeader);

    // Show only a limited number of rows initially.
    const initialRows = 3;
    const dataToShow = isTableExpanded ? data : data.slice(0, initialRows);


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
        deleteButton.addEventListener('click', () => deleteRow(rowIndex));

        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });

    wrapper.appendChild(table); // Add the table to the wrapper

    //Update button text based on the current state.
    document.getElementById('toggle-table').textContent = isTableExpanded ? 'Show Less' : 'Show More';
}

// Function to save changes to Firebase.
async function saveChanges() {
    // Get the data from table.  Same as before.
    const table = document.getElementById('data-table');
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    const updatedData = [];

     // Build updatedData array, checking for actual changes.
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        const rowData = {};
        let hasData = false;

         for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            const header = cell.getAttribute('data-header');

            if (header) {
                rowData[header] = cell.textContent.trim();
                if (rowData[header] !== '') {
                     hasData = true;
                }
            }
        }
         if (hasData) {
                // Only add if there's actual content in the row
                updatedData.push(rowData);
            }

    }

    // Now, we need to ask user to what collection should we save the changes
    let collectionName = prompt("Please enter the name of the collection to save changes:", "Data");
     if (collectionName === null || collectionName.trim() === "") {
        alert("Collection name cannot be empty.  Save cancelled.");
        return; // Stop the upload process.
    }
    // Check for invalid characters.  Firebase paths cannot contain . $ [ ] # /
    if (/[.$[\]#/]/.test(collectionName)) {
        alert("Collection name contains invalid characters (. $ [ ] # /). Save cancelled.");
        return;
    }
    const dbRef = ref(database, collectionName); // Use dynamic name

    try {
        await set(dbRef, updatedData);
        console.log('Changes saved successfully!');
        alert('Changes saved successfully!');
        currentData = updatedData; // Update currentData
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes: ' + error.message);
    }
}

// Function to delete a row
async function deleteRow(rowIndex) {
  // Get the collection name *before* deleting the row locally.
  let collectionName = prompt("Please enter the collection name to delete from:", "Data");

  if (collectionName === null || collectionName.trim() === "") {
    alert("Collection name cannot be empty. Delete operation cancelled.");
    return;
  }
  if (/[.$[\]#/]/.test(collectionName)) {
        alert("Collection name contains invalid characters (. $ [ ] # /). Delete cancelled.");
        return;
    }
  collectionName = collectionName.trim();
  const dbRef = ref(database, collectionName);

    //Adjust rowIndex for data array, taking "Show More" into account
     let adjustedRowIndex;

    if(!isTableExpanded) {
       const tableRows = document.querySelectorAll("#data-table tbody tr");
       if (rowIndex < tableRows.length) {
            // If "Show More" is NOT expanded, the displayed row index IS the data index.
            adjustedRowIndex = rowIndex;
       }
    }
    else{
        adjustedRowIndex = rowIndex;
    }


  if (confirm('Are you sure you want to delete this row?')) {
     // Check if adjustedRowIndex is valid before splicing
        if (adjustedRowIndex !== undefined && adjustedRowIndex >= 0 && adjustedRowIndex < currentData.length) {
        currentData.splice(adjustedRowIndex, 1); // Remove from local data
        displayData(currentData);     // Update the table display
        }
    //  Save changes *after* deleting locally, and to the correct collection.
    try {
        await set(dbRef, currentData); // Use set with the modified data
        console.log('Row deleted successfully!');
        alert('Row deleted successfully!');
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
        const valueA = a[header] === null ? '' : String(a[header]).toLowerCase();
        const valueB = b[header] === null ? '' : String(b[header]).toLowerCase();

        if (valueA < valueB) return isAscending ? -1 : 1;
        if (valueA > valueB) return isAscending ? 1 : -1;
        return 0;
    });

     displayData(currentData);
    event.target.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
}
// Function to toggle table expansion
function toggleTable() {
    isTableExpanded = !isTableExpanded;  // Toggle the state
    displayData(currentData); // Re-display the table
}


// Event Listeners
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

// Add event listener for the NEW Export button.
document.getElementById('export-button').addEventListener('click', exportDataToFirebase);
document.getElementById('save-button').addEventListener('click', saveChanges);
document.getElementById('toggle-table').addEventListener('click', toggleTable);


// Initial data load from Firebase.  We need a way to load data from a SPECIFIC collection.
function loadData() {
    let collectionName = prompt("Please enter the collection name to load:", "Data");

    if (collectionName === null || collectionName.trim() === "") {
        alert("Collection name cannot be empty. Load operation cancelled.");
        return;
    }
      if (/[.$[\]#/]/.test(collectionName)) {
        alert("Collection name contains invalid characters (. $ [ ] # /). Load cancelled.");
        return;
    }
     collectionName = collectionName.trim();
    const dbRef = ref(database, collectionName);

    onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            currentData = snapshot.val();
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

// Call loadData() when the page loads, to prompt for a collection.

document.getElementById('load-button').addEventListener('click', loadData);
