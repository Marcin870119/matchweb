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
let currentCollection = ""; // Zmienna do przechowywania aktualnie wybranej kolekcji

document.addEventListener('DOMContentLoaded', () => {

    // --- Obsługa menu bocznego ---
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Zapobiegaj domyślnej akcji linku

            // Usuń klasę 'active' ze wszystkich elementów menu
            menuItems.forEach(i => i.classList.remove('active'));
            // Dodaj klasę 'active' do klikniętego elementu
            event.target.classList.add('active');

            // Pobierz ID klikniętego elementu i utwórz ID kafelka
            const itemId = event.target.id;
            const tileId = itemId + '-tile';

            // Pokaż/ukryj kafelki
            const tiles = document.querySelectorAll('.tile');
            tiles.forEach(tile => {
                tile.style.display = 'none'; // Ukryj wszystkie
            });

            const targetTile = document.getElementById(tileId);
            if (targetTile) {
                targetTile.style.display = 'flex'; // Pokaż wybrany, użyj 'flex'
                 // Nie ładuj danych automatycznie po zmianie kafelka - użytkownik musi kliknąć "Load Data"
            }
        });
    });
    // Domyślnie pokaż pierwszy kafelek
    document.querySelector('.menu-item').click();


    // --- Funkcje pomocnicze ---

    // Funkcja do pobierania listy kolekcji z Firebase
    async function fetchCollectionList() {
        const dbRef = ref(database); // Referencja do *korzenia* bazy danych
        try {
            const snapshot = await get(dbRef); // Użyj get() zamiast onValue()
            if (snapshot.exists()) {
                const collections = Object.keys(snapshot.val()); // Pobierz klucze (nazwy kolekcji)
                return collections;
            } else {
                return []; // Brak kolekcji
            }
        } catch (error) {
            console.error("Error fetching collection list:", error);
            alert("Error fetching collection list: " + error.message);
            return []; // W przypadku błędu, zwróć pustą tablicę
        }
    }

    // Funkcja do wypełniania listy rozwijanej <select>
    async function populateCollectionSelect() {
        const select = document.getElementById('collectionSelect');
        select.innerHTML = '<option value="">(Select a collection)</option>'; // Wyczyść i dodaj domyślną opcję

        const collections = await fetchCollectionList();
        collections.forEach(collectionName => {
            const option = document.createElement('option');
            option.value = collectionName;
            option.textContent = collectionName;
            select.appendChild(option);
        });
    }


       // --- Obsługa importu danych ---
    const importButtons = document.querySelectorAll('.import-button');

    importButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tile = event.target.closest('.tile');
            const dataContainer = tile.querySelector('.data-container');
            const table = dataContainer.querySelector('table');
            const thead = table.querySelector('thead');
            const tbody = table.querySelector('tbody');
            const importDateDiv = tile.querySelector('.import-date');
            const collectionNameDiv = tile.querySelector('.collection-name'); // Do nazwy kolekcji

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.csv';

            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                //  Pobierz nazwę kolekcji *przed* parsowaniem.
                let collectionName = prompt("Please enter a name for this data collection:", "Data");
                if (!collectionName) return;  // Anulowano
                collectionName = collectionName.trim();
                 if (/[.$[\]#/]/.test(collectionName)) {
                    alert("Collection name contains invalid characters (. $ [ ] # /). Import cancelled.");
                    return;
                }
                currentCollection = collectionName; // Ustaw aktualną kolekcję.

                // Zapisz nazwę kolekcji w divie
                collectionNameDiv.textContent = collectionName;


                Papa.parse(file, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function(results) {
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

                        // Display data *in the correct tile*
                        displayData(data, tile);

                        // Upload to Firebase *with the correct ref*
                        const dbRef = ref(database, collectionName);
                        uploadDataToFirebase(data, dbRef); //Upload using set (overwrite)


                        const now = new Date();
                        importDateDiv.textContent = `Imported: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

                         // Odśwież listę kolekcji po imporcie
                        populateCollectionSelect();
                    },
                    error: function(error) {
                        console.error("Parsing error:", error);
                        alert("An error occurred while parsing the CSV file.");
                    }
                });
            });

            fileInput.click();
        });
    });

     // Funkcja do wyświetlania danych w tabeli
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

         // Pokaż określoną liczbę wierszy
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
             deleteButton.addEventListener('click', () => deleteRow(rowIndex)); // Pass rowIndex

            actionsCell.appendChild(deleteButton);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
        if (toggleTableLink) {
            toggleTableLink.textContent = isTableExpanded ? 'Show Less' : 'Show More';
        }
    }


       // Funkcja do zapisu zmian
    async function saveChanges() {
        const table = document.querySelector('.tile:not([style*="display: none"]) .data-container table');
        if (!table) {
            alert("No active table found to save changes from.");
            return;
        }
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        const updatedData = [];

        // Build updatedData array
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
                     if(rowData[header] !== ''){
                        hasData = true;
                    }
                }
            }
             if(hasData){
                 updatedData.push(rowData);
             }
        }

         if (!currentCollection) {
            alert("No collection is currently selected.  Please load or import data first.");
            return;
        }
        const dbRef = ref(database, currentCollection);

        try {
            await set(dbRef, updatedData);
            console.log('Changes saved successfully!');
            alert('Changes saved successfully to collection: ' + currentCollection);
            currentData = updatedData;  // Update local data
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Error saving changes: ' + error.message);
        }
    }
    // Funkcja do usuwania wiersza
    async function deleteRow(rowIndex) {
        if (!currentCollection) {
            alert("No collection is currently selected.");
            return;
        }

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
            const dbRef = ref(database, currentCollection);
             // Check if adjustedRowIndex is valid before splicing
            if (adjustedRowIndex !== undefined && adjustedRowIndex >= 0 && adjustedRowIndex < currentData.length) {
                currentData.splice(adjustedRowIndex, 1);
                 // Find the currently active tile and redisplay data
                const activeTile = document.querySelector('.tile:not([style*="display: none"])');
                if (activeTile) {
                     displayData(currentData, activeTile); //Ponowne wyswietlanie danych.
                }
            }
            try {
                await set(dbRef, currentData); // Save changes to Firebase
                console.log('Row deleted successfully!');
                alert('Row deleted successfully!');

            } catch (error) {
                console.error('Error deleting row:', error);
                alert('Error deleting row: ' + error.message);
            }
        }
    }

     // Funkcja do przełączania widoczności tabeli (Show More/Less)
    function toggleTable(event) {
        event.preventDefault();
        isTableExpanded = !isTableExpanded;
        const activeTile = document.querySelector('.tile:not([style*="display: none"])'); // Pobierz aktywny tile
        if(activeTile){
            displayData(currentData, activeTile); // Ponownie wyświetl dane, przekazujac aktywny tile
        }

    }

    // Funkcja do sortowania tabeli
    function sortTable(event) {
        const header = event.target.getAttribute('data-key');
        const isAscending = !event.target.classList.contains('sorted-desc');

        // Znajdź wszystkie nagłówki w *aktywnej* tabeli
        const activeTable = document.querySelector('.tile:not([style*="display: none"]) .data-container table');
        if (!activeTable) return; // Brak aktywnej tabeli

        const headers = activeTable.querySelectorAll('th');
        headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));

        currentData.sort((a, b) => {
            const valueA = a[header] === null ? '' : String(a[header]).toLowerCase();
            const valueB = b[header] === null ? '' : String(b[header]).toLowerCase();

            if (valueA < valueB) return isAscending ? -1 : 1;
            if (valueA > valueB) return isAscending ? 1 : -1;
            return 0;
        });

        // Znajdź aktywny kafelek i wyświetl posortowane dane
        const activeTile = document.querySelector('.tile:not([style*="display: none"])');
        if (activeTile) {
            displayData(currentData, activeTile);
        }

        event.target.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
    }

    //Dodanie obslugi usuwania kolekcji
    async function deleteCollection() {
        if (!currentCollection) {
            alert("No collection selected to delete.");
            return;
        }

        if (confirm(`Are you sure you want to delete the ENTIRE collection "${currentCollection}"? This action cannot be undone.`)) {
            const dbRef = ref(database, currentCollection);
            try {
                await remove(dbRef); // Użyj remove() do usunięcia całej kolekcji
                console.log(`Collection "${currentCollection}" deleted successfully.`);
                alert(`Collection "${currentCollection}" deleted successfully.`);
                currentData = []; // Wyczyść lokalne dane
                currentCollection = "";

                // Znajdz aktualnie wyswietlany tile i wyczysc w nim dane
                const activeTile = document.querySelector('.tile:not([style*="display: none"])');
                if(activeTile){
                    displayData([], activeTile);
                    activeTile.querySelector('.collection-name').textContent = ''; // Wyczyść nazwę kolekcji
                    activeTile.querySelector('.import-date').textContent = '';    // Wyczyść date
                }


                populateCollectionSelect(); // Odśwież listę kolekcji
            } catch (error) {
                console.error("Error deleting collection:", error);
                alert("Error deleting collection: " + error.message);
            }
        }
    }


    // --- Event Listeners ---
    //Obsluga load data button
    document.getElementById('load-button').addEventListener('click', async () => {
        const collectionName = document.getElementById('collectionSelect').value;
        if (!collectionName) {
            alert("Please select a collection to load.");
            return;
        }
		currentCollection = collectionName;

        const dbRef = ref(database, collectionName);
        try {
            const snapshot = await get(dbRef); // Użyj get() do jednorazowego odczytu
            if (snapshot.exists()) {
                currentData = snapshot.val();
                // Znajdź aktywny kafelek
                const activeTile = document.querySelector('.tile:not([style*="display: none"])');
                if (activeTile) {
                    displayData(currentData, activeTile); // Wyświetl dane w aktywnym kafelku
                    // Ustaw nazwę kolekcji i datę (jeśli chcesz) w aktywnym kafelku
                    activeTile.querySelector('.collection-name').textContent = collectionName;
                    activeTile.querySelector('.import-date').textContent = "";

                }

            } else {
                console.log(`No data found in collection: ${collectionName}`);
                alert(`No data found in collection: ${collectionName}`);
                const activeTile = document.querySelector('.tile:not([style*="display: none"])');
                if(activeTile){
                   displayData([], activeTile); // P
                
