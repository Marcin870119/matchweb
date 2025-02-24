// panel_administracyjny.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase configuration (Replace with your project's config)
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

let currentData = []; // Store the current data
let isTableExpanded = false; // Track table expansion state
let currentCollection = ""; // Store the currently selected collection

document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar menu handling ---
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior

            // Remove 'active' class from all menu items
            menuItems.forEach(i => i.classList.remove('active'));
            // Add 'active' class to the clicked item
            event.target.classList.add('active');

            // Get the ID of the clicked item and create the tile ID
            const itemId = event.target.id || event.target.textContent.toLowerCase().replace(/\s+/g, '-');
            const tileId = `${itemId}-tile`.toLowerCase();
            
            // Show/hide tiles
            const tiles = document.querySelectorAll('.tile');
            tiles.forEach(tile => {
                tile.style.display = 'none'; // Hide all tiles
            });

            const targetTile = document.getElementById(tileId);
            if (targetTile) {
                targetTile.style.display = 'flex'; // Show the selected tile
                // Do not automatically load data after tile change - user must click "Load Data"
            }
        });
    });

    // Default: show the first tile and populate the collection dropdown
    if (menuItems.length > 0) {
        menuItems[0].click(); // Trigger click on the first menu item
    }
    populateCollectionSelect();

    // --- Helper functions ---

    // Function to fetch the list of collections from Firebase
    async function fetchCollectionList() {
        const dbRef = ref(database); // Reference to the root of the database
        try {
            const snapshot = await get(dbRef); // Use get() for a one-time read
            if (snapshot.exists()) {
                const collections = Object.keys(snapshot.val()); // Get collection names
                return collections;
            } else {
                return []; // No collections found
            }
        } catch (error) {
            console.error("Error fetching collection list:", error);
            alert("Error fetching collection list: " + error.message);
            return []; // Return empty array on error
        }
    }

    // Function to populate the dropdown <select> with collections
    async function populateCollectionSelect() {
        const select = document.getElementById('collectionSelect');
        if (!select) return; // Ensure select exists
        select.innerHTML = '<option value="">(Select a collection)</option>'; // Clear and add default option

        const collections = await fetchCollectionList();
        collections.forEach(collectionName => {
            const option = document.createElement('option');
            option.value = collectionName;
            option.textContent = collectionName;
            select.appendChild(option);
        });
    }

    // --- Data import handling ---
    const importButtons = document.querySelectorAll('.import-button');

    importButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tile = event.target.closest('.tile');
            const dataContainer = tile.querySelector('.data-container');
            const table = dataContainer.querySelector('table');
            const thead = table.querySelector('thead');
            const tbody = table.querySelector('tbody');
            const importDateDiv = tile.querySelector('.import-date');
            const collectionNameDiv = tile.querySelector('.collection-name');

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.csv';

            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                // Get collection name before parsing
                let collectionName = prompt("Please enter a name for this data collection:", "Data");
                if (!collectionName) return; // Cancelled
                collectionName = collectionName.trim();
                if (/[.$[\]#/]/.test(collectionName)) {
                    alert("Collection name contains invalid characters (. $ [ ] # /). Import cancelled.");
                    return;
                }
                currentCollection = collectionName; // Set the current collection

                // Save collection name in the div
                collectionNameDiv.textContent = collectionName;

                Papa.parse(file, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        if (results.errors.length > 0) {
                            console.error("Parsing errors:", results.errors);
                            alert("There were errors parsing the CSV file. Check the browser console (F12) for more information.");
                            return;
                        }

                        const data = results.data;
                        if (!data || data.length === 0) {
                            tbody.innerHTML = '<tr><td colspan="100%">No data to display.</td></tr>';
                            return;
                        }

                        // Display data in the correct tile
                        displayData(data, tile);

                        // Upload to Firebase with the correct ref
                        const dbRef = ref(database, collectionName);
                        uploadDataToFirebase(data, dbRef); // Upload using set (overwrite)

                        const now = new Date();
                        importDateDiv.textContent = `Imported: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

                        // Refresh collection list after import
                        populateCollectionSelect();
                    },
                    error: function (error) {
                        console.error("Parsing error:", error);
                        alert("An error occurred while parsing the CSV file.");
                    }
                });
            });

            fileInput.click();
        });
    });

    // --- Display data in table ---
    function displayData(data, tile) {
        const table = tile.querySelector('.data-container table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        const toggleTableLink = tile.querySelector('#toggle-table');

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
            th.addEventListener('click', sortTable);
            thead.appendChild(th);
        });

        const actionsHeader = document.createElement('th');
        actionsHeader.textContent = 'Actions';
        thead.appendChild(actionsHeader);

        // Show a limited number of rows
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

        if (toggleTableLink) {
            toggleTableLink.textContent = isTableExpanded ? 'Show Less' : 'Show More';
        }
    }

    // --- Save changes ---
    async function saveChanges() {
        const table = document.querySelector('.tile:not([style*="display: none"]) .data-container table');
        if (!table) {
            alert("No active table found to save changes from.");
            return;
        }
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        const updatedData = [];

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
                updatedData.push(rowData);
            }
        }

        if (!currentCollection) {
            alert("No collection is currently selected. Please load or import data first.");
            return;
        }

        const dbRef = ref(database, currentCollection);

        try {
            await set(dbRef, updatedData);
            console.log('Changes saved successfully!');
            alert('Changes saved successfully to collection: ' + currentCollection);
            currentData = updatedData; // Update local data
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Error saving changes: ' + error.message);
        }
    }

    // --- Delete row ---
    async function deleteRow(rowIndex) {
        if (!currentCollection) {
            alert("No collection is currently selected.");
            return;
        }

        let adjustedRowIndex;
        if (!isTableExpanded) {
            const tableRows = document.querySelector('#data-table tbody tr');
            if (rowIndex < tableRows.length) {
                adjustedRowIndex = rowIndex;
            }
        } else {
            adjustedRowIndex = rowIndex;
        }

        if (confirm('Are you sure you want to delete this row?')) {
            const dbRef = ref(database, currentCollection);
            if (adjustedRowIndex !== undefined && adjustedRowIndex >= 0 && adjustedRowIndex < currentData.length) {
                currentData.splice(adjustedRowIndex, 1);
                const activeTile = document.querySelector('.tile:not([style*="display: none"])');
                if (activeTile) {
                    displayData(currentData, activeTile);
                }
            }

            try {
                await set(dbRef, currentData);
                console.log('Row deleted successfully!');
                alert('Row deleted successfully!');
            } catch (error) {
                console.error('Error deleting row:', error);
                alert('Error deleting row: ' + error.message);
            }
        }
    }

    // --- Toggle table visibility (Show More/Less) ---
    function toggleTable(event) {
        event.preventDefault();
        isTableExpanded = !isTableExpanded;
        const activeTile = document.querySelector('.tile:not([style*="display: none"])');
        if (activeTile) {
            displayData(currentData, activeTile);
        }
    }

    // --- Sort table ---
    function sortTable(event) {
        const header = event.target.getAttribute('data-key');
        const isAscending = !event.target.classList.contains('sorted-desc');

        const activeTable = document.querySelector('.tile:not([style*="display: none"]) .data-container table');
        if (!activeTable) return;

        const headers = activeTable.querySelectorAll('th');
        headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));

        currentData.sort((a, b) => {
            const valueA = a[header] === null ? '' : String(a[header]).toLowerCase();
            const valueB = b[header] === null ? '' : String(b[header]).toLowerCase();

            if (valueA < valueB) return isAscending ? -1 : 1;
            if (valueA > valueB) return isAscending ? 1 : -1;
            return 0;
        });

        const activeTile = document.querySelector('.tile:not([style*="display: none"])');
        if (activeTile) {
            displayData(currentData, activeTile);
        }

        event.target.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
    }

    // --- Delete collection ---
    async function deleteCollection() {
        if (!currentCollection) {
            alert("No collection selected to delete.");
            return;
        }

        if (confirm(`Are you sure you want to delete the ENTIRE collection "${currentCollection}"? This action cannot be undone.`)) {
            const dbRef = ref(database, currentCollection);
            try {
                await remove(dbRef);
                console.log(`Collection "${currentCollection}" deleted successfully.`);
                alert(`Collection "${currentCollection}" deleted successfully.`);
                currentData = [];
                currentCollection = "";

                const activeTile = document.querySelector('.tile:not([style*="display: none"])');
                if (activeTile) {
                    displayData([], activeTile);
                    activeTile.querySelector('.collection-name').textContent = '';
                    activeTile.querySelector('.import-date').textContent = '';
                }

                populateCollectionSelect(); // Refresh collection list
            } catch (error) {
                console.error("Error deleting collection:", error);
                alert("Error deleting collection: " + error.message);
            }
        }
    }

    // --- Event Listeners ---

    // Handle Load Data button
    document.getElementById('load-button').addEventListener('click', async () => {
        const collectionName = document.getElementById('collectionSelect').value;
        if (!collectionName) {
            alert("Please select a collection to load.");
            return;
        }
        currentCollection = collectionName;

        const dbRef = ref(database, collectionName);
        try {
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                currentData = snapshot.val();
                const activeTile = document.querySelector('.tile:not([style*="display: none"])');
                if (activeTile) {
                    displayData(currentData, activeTile);
                    activeTile.querySelector('.collection-name').textContent = collectionName;
                    activeTile.querySelector('.import-date').textContent = "";
                }
            } else {
                console.log(`No data found in collection: ${collectionName}`);
                alert(`No data found in collection: ${collectionName}`);
                const activeTile = document.querySelector('.tile:not([style*="display: none"])');
                if (activeTile) {
                    displayData([], activeTile);
                    activeTile.querySelector('.collection-name').textContent = '';
                    activeTile.querySelector('.import-date').textContent = '';
                }
            }
        } catch (error) {
            console.error("Error fetching data: ", error);
            alert("Error fetching data: " + error.message);
        }
    });

    // Handle Save Changes button
    document.getElementById('save-button').addEventListener('click', saveChanges);

    // Handle Export Data button
    document.getElementById('export-button').addEventListener('click', () => {
        const activeTile = document.querySelector('.tile:not([style*="display: none"])');
        if (activeTile) {
            if (currentData.length > 0) {
                alert("Exporting data is not yet implemented.");
            } else {
                alert("No data to export. Please load or import data first.");
            }
        } else {
            alert("No active tile. Please select a report type from the sidebar.");
        }
    });

    document.getElementById('delete-collection-button').addEventListener('click', deleteCollection);

    // Handle Show More/Less toggle for each tile
    document.querySelectorAll('.toggle-table').forEach(toggle => {
        toggle.addEventListener('click', toggleTable);
    });
});

// --- Upload data to Firebase ---
async function uploadDataToFirebase(data, dbRef) {
    try {
        await set(dbRef, data);
        console.log('Data uploaded successfully!');
    } catch (error) {
        console.error('Error uploading data:', error);
        alert('Error uploading data: ' + error.message);
    }
}
