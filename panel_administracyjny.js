// Firebase Configuration (Replace with your project's config)
const firebaseConfig = {
   apiKey: "AIzaSyCPZ0OsJmaDpJjkVFl3vGv4WalDYDY23xQ",
    authDomain: "webmatcher-94f0e.firebaseapp.com",
    projectId: "webmatcher-94f0e",
    storageBucket: "webmatcher-94f0e.firebasestorage.app",
    messagingSenderId: "970664630623",
    appId: "G-RMMBEY655B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dbRef = database.ref('myData'); //  'myData' is the "collection" name

let currentData = []; // Store the current data for editing

// Function to handle file upload and parsing
function handleFileUpload(file) {
    Papa.parse(file, {
        header: true, // Treat the first row as headers
        dynamicTyping: true, // Convert numbers and booleans
        complete: function (results) {
            currentData = results.data;
            displayData(currentData);
            uploadDataToFirebase(currentData); // Upload to Firebase after parsing
        }
    });
}

// Function to upload data to Firebase
function uploadDataToFirebase(data) {
    dbRef.set(data)
        .then(() => {
            console.log('Data uploaded successfully!');
            alert('Data uploaded successfully!');
        })
        .catch((error) => {
            console.error('Error uploading data:', error);
            alert('Error uploading data: ' + error.message);
        });

}

// Function to display data in the table
function displayData(data) {
    const table = document.getElementById('data-table');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = ''; // Clear existing headers
    tbody.innerHTML = ''; // Clear existing rows

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>'; // Handle empty data
        return;
    }

    // Create table headers
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.setAttribute('data-key', header); // Set data-key for sorting
        th.addEventListener('click', sortTable); // Add click event for sorting
        thead.appendChild(th);
    });
    // Add edit header.
    const editHeader = document.createElement('th');
    editHeader.textContent = "Actions";
    thead.appendChild(editHeader);

    // Create table rows
    data.forEach((item, rowIndex) => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');
            cell.textContent = item[header] !== null && item[header] !== undefined ? item[header] : '';
            cell.setAttribute('data-header', header);  //store the header for editing
            cell.setAttribute('data-row', rowIndex); //store row index for editing
            cell.contentEditable = true;  // Make cells editable
            row.appendChild(cell);
        });

        // Add edit/delete buttons
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
function saveChanges() {
    const table = document.getElementById('data-table');
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    const updatedData = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = {};
        let hasData = false; // Check if row has any data

        cells.forEach(cell => {
            const header = cell.getAttribute('data-header');
            if (header) { // Check if it's a data cell (not an actions cell)
                rowData[header] = cell.textContent.trim(); // Get cell text content
                if (rowData[header] !== '') {
                    hasData = true; // Mark as having data if any cell is not empty
                }
            }

        });
        if (hasData) { //Only push if it isn't an empty row.
            updatedData.push(rowData);
        }

    });

    dbRef.set(updatedData)
        .then(() => {
            console.log('Changes saved successfully!');
            alert('Changes saved successfully!');
            currentData = updatedData;  //Update the current data
        })
        .catch((error) => {
            console.error('Error saving changes:', error);
            alert('Error saving changes: ' + error.message);
        });
}


// Function to delete a row
function deleteRow(rowIndex) {
    if (confirm('Are you sure you want to delete this row?')) {
        currentData.splice(rowIndex, 1); // Remove the row from the local data
        displayData(currentData);       // Re-render the table
        saveChanges(); // Save changes (the deletion) to firebase
    }
}

// Function to sort table by column
function sortTable(event) {
    const header = event.target.getAttribute('data-key');
    const isAscending = !event.target.classList.contains('sorted-desc'); // Toggle sort order

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

    // Add the appropriate sort class
    event.target.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
}


// Event Listeners
document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

// Initial data load from Firebase (on page load)
dbRef.once('value')
    .then((snapshot) => {
        if (snapshot.exists()) {
            currentData = snapshot.val();
            displayData(currentData);
        } else {
            console.log('No data found in Firebase.');
            displayData([]); // Display an empty table
        }
    })
    .catch((error) => {
        console.error('Error fetching data from Firebase:', error);
        alert("Error fetching data: " + error.message)
    });
