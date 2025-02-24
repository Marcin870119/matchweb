import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"; // Użyj najnowszej wersji
import { getDatabase, ref, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"; // Użyj najnowszej wersji


// Firebase configuration (Replace with your project's config)
const firebaseConfig = {
    apiKey: "AIzaSyCPZ0OsJmaDpJjkVFl3vGv4WalDYDY23xQ",
    authDomain: "webmatcher-94f0e.firebaseapp.com",
    projectId: "webmatcher-94f0e",
    storageBucket: "webmatcher-94f0e.firebasestorage.app",
    messagingSenderId: "970664630623",
    appId: "G-RMMBEY655B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database, 'myData'); //  'myData' is the "collection" name

let currentData = []; // Store the current data for editing

// Function to handle file upload and parsing
function handleFileUpload(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function (results) {
            currentData = results.data;
            displayData(currentData);
            uploadDataToFirebase(currentData);
        }
    });
}


// Function to upload data to Firebase
async function uploadDataToFirebase(data) {
    try {
        await set(dbRef, data);
        console.log('Data uploaded successfully!');
        alert('Data uploaded successfully!');
    } catch (error) {
        console.error('Error uploading data:', error);
        alert('Error uploading data: ' + error.message);
    }
}

// Function to display data in the table
function displayData(data) {
    const table = document.getElementById('data-table');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = ''; // Clear existing headers
    tbody.innerHTML = ''; // Clear existing rows

    if (!data || data.length === 0) { //Poprawiony warunek dla pustej tablicy
        tbody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
        return;
    }

     // Create table headers
    const headers = Object.keys(data[0]); // Weź klucze z pierwszego obiektu

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

    data.forEach((item, rowIndex) => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');
			// Handle null/undefined values correctly.
			cell.textContent = item[header] !== null && item[header] !== undefined ? item[header] : '';
            cell.setAttribute('data-header', header);
            cell.setAttribute('data-row', rowIndex);
            cell.contentEditable = true;
            row.appendChild(cell);
        });

        // Add delete button
        const actionsCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteButton.addEventListener('click', () => deleteRow(rowIndex));

        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });
}

// Function to save changes to Firebase
async function saveChanges() {
    const table = document.getElementById('data-table');
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    const updatedData = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = {};
		let hasData = false;

        cells.forEach(cell => {
            const header = cell.getAttribute('data-header');
             if (header) {
                rowData[header] = cell.textContent.trim();
				 if (rowData[header] !== '') {
                    hasData = true;
                }
            }
        });
		if(hasData){
			updatedData.push(rowData);
		}
    });

    try {
        await set(dbRef, updatedData); // Use set() to overwrite data
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
    if (confirm('Are you sure you want to delete this row?')) {
        currentData.splice(rowIndex, 1); // Remove from local data
        displayData(currentData);     // Update the table display
        await saveChanges();        // Save changes to Firebase
    }
}

// Function to sort table by column.
function sortTable(event) {
    const header = event.target.getAttribute('data-key');
    const isAscending = !event.target.classList.contains('sorted-desc');

    // Clear previous sort classes
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


// Event Listeners
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

document.getElementById('save-button').addEventListener('click', saveChanges);

// Initial data load from Firebase (on page load)
onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
        currentData = snapshot.val();
        displayData(currentData);
    } else {
        console.log('No data found in Firebase.');
        displayData([]); // Display an empty table
    }
}, (error) => { // Add error handling
    console.error("Error fetching data: ", error);
    alert("Error fetching data: " + error.message);
});
