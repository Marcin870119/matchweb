// Inicjalizacja Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// KONFIGURACJA FIREBASE - Wklej SWOJE dane!
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
const dropdownButton = document.getElementById('dropdownButton'); // Zakładam, że masz ten przycisk w HTML
const resultTable = document.getElementById('resultTable').querySelector('tbody');
const priceInput = document.getElementById('price');
const priceMessage = document.getElementById('priceMessage');
const calculateButton = document.getElementById('calculateButton');

// Zmienne globalne
let items = [];
let minPrices = {};
let selectedItem = null;

// Funkcja do pobrania danych z Firestore
async function fetchFirestoreData() {
    try {
        const querySnapshot = await getDocs(collection(db, "products_minimal_prices"));
        console.log("querySnapshot:", querySnapshot);

        items = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log("Dokument:", doc.id, "Dane:", data);

            if (!data.INDEKS || !data.NAZWA) {
                console.error("❌ Błąd: Dokument w 'products_minimal_prices' nie ma INDEKSU lub NAZWY:", doc.id, data);
                return null;
            }
            return { id: doc.id, ...data };
        }).filter(item => item !== null);

        console.log("🔥 Pobrane dane z Firestore (po przetworzeniu):", items);

        if (items.length === 0) {
            console.warn("⚠️ Tablica items jest pusta. Sprawdź kolekcję 'products_minimal_prices' w Firestore.");
        }

        populateDropdown(items);

    } catch (error) {
        console.error("❌ Błąd podczas pobierania danych Firestore:", error);
    }
}

fetchFirestoreData();

// Funkcja do wypełnienia dropdowna
function populateDropdown(items) {
    console.log("populateDropdown - items:", items);
    dropdown.innerHTML = '<option value="">Wybierz produkt</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.INDEKS} - ${item.NAZWA}`;
        dropdown.appendChild(option);
    });
    dropdown.style.display = 'none'; // Domyślnie schowany
}

// Funkcja do filtrowania dropdowna
function filterDropdown(items, searchTerm) {
    console.log("filterDropdown - items:", items, "searchTerm:", searchTerm);
    const filteredItems = items.filter(item =>
        item.INDEKS.toString().toLowerCase().includes(searchTerm) || item.NAZWA.toLowerCase().includes(searchTerm)
    );
    console.log("filterDropdown - filteredItems:", filteredItems);

    if (filteredItems.length > 0) {
        populateDropdown(filteredItems);
        dropdown.style.display = 'block'; // Pokaż dropdown po filtrowaniu
    } else {
        dropdown.innerHTML = '<option value="">Brak wyników</option>';
        dropdown.style.display = 'block'; // Pokaż komunikat
    }
}

// Obsługa kliknięcia na input wyszukiwania
searchInput.addEventListener('click', () => {
    if (dropdown.style.display === 'none' && items.length > 0) {
        populateDropdown(items); // Wypełnij dropdown pełną listą
        dropdown.style.display = 'block'; // Pokaż dropdown
    }
});

// Obsługa wpisywania w polu wyszukiwania
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    console.log("Wyszukiwanie - searchTerm:", searchTerm);
    filterDropdown(items, searchTerm);
});

// Obsługa wyboru produktu
dropdown.addEventListener('change', () => {
    const selectedId = dropdown.value;
    console.log("Wybrano ID:", selectedId);

    if (selectedId) {
        selectedItem = items.find(item => item.id === selectedId);
        console.log("Znaleziono produkt:", selectedItem);

        if (selectedItem) {
            displaySelectedItem(selectedItem);
            searchInput.value = `${selectedItem.INDEKS} - ${selectedItem.NAZWA}`;
            dropdown.style.display = 'none'; // Schowaj dropdown po wyborze
        } else {
            console.error("❌ Nie znaleziono produktu o ID:", selectedId);
        }
    }
});

// Obsługa kliknięcia poza dropdownem (chowanie)
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target) && !dropdownButton.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Funkcja do wyświetlania wybranego produktu w tabeli
function displaySelectedItem(item) {
    if (!item) {
        console.warn("❌ displaySelectedItem: Nie przekazano produktu.");
        return;
    }

    if ($.fn.DataTable.isDataTable('#resultTable')) {
        $('#resultTable').DataTable().clear().destroy();
    }

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

    $('#resultTable').DataTable({
        scrollY: '200px',
        scrollX: true,
        scrollCollapse: true,
        paging: false,
        autoWidth: false,
        info: false,
        columnDefs: [{ width: '150px', targets: '_all' }]
    });

    selectedItem = item;
}

// Pobranie cen minimalnych
async function fetchMinPrices() {
    try {
        const querySnapshot = await getDocs(collection(db, "products_minimal_prices"));
        minPrices = querySnapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            if (!data.INDEKS || data['Cena minimalna'] === undefined) {
                console.warn("Nieprawidłowy format danych dla minimalnej ceny:", doc.id, data);
                return acc;
            }
            acc[data.INDEKS] = data['Cena minimalna'];
            return acc;
        }, {});
        console.log("✅ Pobrane ceny minimalne:", minPrices);
    } catch (error) {
        console.error("❌ Błąd podczas pobierania cen minimalnych:", error);
    }
}

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

    if (minPrice !== undefined) {
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
