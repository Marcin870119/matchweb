// Inicjalizacja Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Konfiguracja Firebase (wklej SWOJE dane!)
const firebaseConfig = {
    apiKey: "AIzaSyCPZ0OsJmaDpJjkVFl3vGv4WalDYDY23xQ",
    authDomain: "webmatcher-94f0e.firebaseapp.com",
    projectId: "webmatcher-94f0e",
    storageBucket: "webmatcher-94f0e.firebasestorage.app",
    messagingSenderId: "970664630623",
    appId: "G-RMMBEY655B"
};

// Inicjalizacja aplikacji Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Pobranie referencji do elementów HTML
const searchInput = document.getElementById('search');
const dropdown = document.getElementById('dropdown');
const resultTable = document.getElementById('resultTable').querySelector('tbody');
const priceInput = document.getElementById('price');
const priceMessage = document.getElementById('priceMessage');
const calculateButton = document.getElementById('calculateButton');

let items = [];
let minPrices = {};
let selectedItem = null; // Zmienna do przechowywania wybranego produktu

// Funkcja do pobrania danych z Firestore
async function fetchFirestoreData() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Dodaj ID do danych!
        console.log("🔥 Pobrane dane z Firestore:", items);
        populateDropdown(items);
    } catch (error) {
        console.error("❌ Błąd podczas pobierania danych Firestore:", error);
    }
}

// Inicjalizacja danych - wywołanie *po* zdefiniowaniu funkcji
fetchFirestoreData();

// Obsługa wyszukiwania
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterDropdown(items, searchTerm);
    dropdown.style.display = searchTerm.length > 0 ? 'block' : 'none';
});

// Obsługa wyboru produktu z listy rozwijanej
dropdown.addEventListener('change', () => {
    const selectedId = dropdown.value;
    if (selectedId) {
        selectedItem = items.find(item => item.id === selectedId);  // Szukaj po ID
        displaySelectedItem(selectedItem);
        searchInput.value = `${selectedItem.INDEKS} - ${selectedItem.NAZWA}`; // Wstaw nazwę do inputa
        dropdown.style.display = 'none'; // Schowaj dropdown po wyborze
    }
});

// Funkcja do wypełnienia dropdowna produktami
function populateDropdown(items) {
    dropdown.innerHTML = '<option value="">Wybierz produkt</option>'; // Dodaj pustą opcję
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id; // Użyj ID jako wartości
        option.textContent = `${item.INDEKS} - ${item.NAZWA}`;
        dropdown.appendChild(option);
    });
}

// Funkcja do filtrowania dropdowna
function filterDropdown(items, searchTerm) {
    const filteredItems = items.filter(item =>
        item.INDEKS.toString().toLowerCase().includes(searchTerm) || item.NAZWA.toLowerCase().includes(searchTerm)
    );
    populateDropdown(filteredItems);
}

// Funkcja do wyświetlania wybranego produktu w tabeli
function displaySelectedItem(item) {
    if (!item) {
        console.warn("❌ Nie znaleziono danych dla podanego indeksu.");
        return;
    }

    console.log("🔹 Wybrany produkt:", item);

    // Usuwanie poprzednich danych - Sprawdź, czy DataTable już istnieje
    if ($.fn.DataTable.isDataTable('#resultTable')) {
        $('#resultTable').DataTable().clear().destroy();
    }

    // Aktualizacja tabeli z nowymi danymi
    resultTable.innerHTML = `
        <tr>
            <td>${item.INDEKS || "Brak danych"}</td>
            <td>${item.NAZWA || "Brak danych"}</td>
            <td>${item.SKROT_PRODUCENTA || "Brak danych"}</td>
            <td>${item.GRUPA_NAZWA || "Brak danych"}</td>
            <td>${item.JM_NAZWA || "Brak danych"}</td>
            <td>${item.OPK_ZB_IL || "Brak danych"}</td>
            <td>${item.IL_PALETA_T || "Brak danych"}</td>
            <td>${item.IL_WARSTWA_T || "Brak danych"}</td>
            <td>${item.CEN100_UK || "Brak danych"}</td>
        </tr>
    `;

    // Ponowna inicjalizacja DataTables
    $('#resultTable').DataTable({
        scrollY: '200px',
        scrollX: true,
        scrollCollapse: true,
        paging: false,
        autoWidth: false,
        info: false,
        // destroy: true,  // Już to sprawdzamy wyżej
        columnDefs: [{ width: '150px', targets: '_all' }]
    });

     selectedItem = item; // WAŻNE: Zaktualizuj selectedItem!
}

// Pobranie cen minimalnych
async function fetchMinPrices() {
    try {
        const querySnapshot = await getDocs(collection(db, "minPrices"));
        minPrices = querySnapshot.docs.reduce((acc, doc) => {
            acc[doc.data().INDEKS] = doc.data()['Cena minimalna']; //Poprawione
            return acc;
        }, {});
        console.log("✅ Pobrane ceny minimalne:", minPrices);
    } catch (error) {
        console.error("❌ Błąd podczas pobierania cen minimalnych:", error);
    }
}

// Pobranie cen minimalnych - wywołanie *po* zdefiniowaniu funkcji
fetchMinPrices();

// Obsługa sprawdzania ceny
calculateButton.addEventListener('click', () => {
    let price = parseFloat(priceInput.value);
    if (!isNaN(price)) {
        price = price.toFixed(2);
        priceInput.value = price;
        if (selectedItem) {
            checkPrice(price, selectedItem.INDEKS);
        } else {
            priceMessage.textContent = 'Nie wybrano produktu.';
            priceMessage.style.color = 'black';
        }
    }
});

// Funkcja do sprawdzania ceny
function checkPrice(price, index) {
    const minPrice = minPrices[index];

    if (minPrice !== undefined) { // Sprawdzaj czy minPrice jest zdefiniowane
        if (parseFloat(price) === 0) {
            priceMessage.textContent = 'Skontakuj się z Twoim opiekunem.';
            priceMessage.style.color = 'red';
        } else if (parseFloat(price) >= parseFloat(minPrice)) {
            priceMessage.textContent = 'Cena jest odpowiednia.';
            priceMessage.style.color = 'green';
        } else if (parseFloat(price) < parseFloat(minPrice) * 0.9) {
            priceMessage.textContent = 'Skontakuj się z Twoim opiekunem.';
            priceMessage.style.color = 'red';
        } else {
            const adjustedPrice = (parseFloat(minPrice) * 1.02).toFixed(2);
            priceMessage.textContent = `Sugerowana cena: ${adjustedPrice}`;
            priceMessage.style.color = 'orange';
        }
    } else {
        priceMessage.textContent = 'Nie znaleziono minimalnej ceny dla tego indeksu.';
        priceMessage.style.color = 'black';
    }
}
