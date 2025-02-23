// Inicjalizacja Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "TWOJ_API_KEY",
    authDomain: "TWOJ_AUTH_DOMAIN",
    projectId: "TWOJ_PROJECT_ID",
    storageBucket: "TWOJ_STORAGE_BUCKET",
    messagingSenderId: "TWOJ_MESSAGING_SENDER_ID",
    appId: "TWOJ_APP_ID"
};

// Inicjalizacja aplikacji Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Pobieranie elementów z DOM
const searchInput = document.getElementById('search');
const dropdownButton = document.getElementById('dropdownButton');
const dropdown = document.getElementById('dropdown');
const resultTable = document.getElementById('resultTable').querySelector('tbody');
const priceInput = document.getElementById('price');
const priceMessage = document.getElementById('priceMessage');
const calculateButton = document.getElementById('calculateButton');

let items = [];
let minPrices = {};

// Pobierz dane z Firestore
async function fetchData() {
    const querySnapshot = await getDocs(collection(db, "products"));
    items = [];

    querySnapshot.forEach(doc => {
        items.push(doc.data());
    });

    console.log("Pobrane dane z Firestore:", items);
    populateDropdown(items);
}

fetchData().catch(error => console.error("Błąd podczas pobierania danych z Firestore:", error));

// Wyszukiwanie po numerze indeksu
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterDropdown(items, searchTerm);

    if (searchTerm.length > 0) {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
});

// Obsługa wyboru z dropdown
dropdown.addEventListener('change', () => {
    const selectedIndex = dropdown.value;
    if (selectedIndex !== "") {
        const selectedItem = items.find(item => item.INDEKS == selectedIndex);
        displaySelectedItem(selectedItem);
        searchInput.value = '';
        dropdown.style.display = 'none';
    }
});

// Obsługa kliknięcia w dropdown
dropdownButton.addEventListener('click', () => {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
});

// Ukrywanie dropdown po kliknięciu poza nim
document.addEventListener('click', (e) => {
    if (!dropdownButton.contains(e.target) && !dropdown.contains(e.target) && !searchInput.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Obsługa sprawdzania ceny
calculateButton.addEventListener('click', () => {
    let price = parseFloat(priceInput.value);
    if (!isNaN(price)) {
        price = price.toFixed(2);
        priceInput.value = price;
        const selectedIndex = dropdown.value;
        if (selectedIndex && !isNaN(price)) {
            checkPrice(price, selectedIndex);
        } else {
            priceMessage.textContent = '';
        }
    }
});

// Funkcja uzupełniająca dropdown
function populateDropdown(items) {
    dropdown.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.INDEKS;
        option.textContent = `${item.INDEKS} - ${item.NAZWA}`;
        dropdown.appendChild(option);
    });
}

// Funkcja filtrowania dropdown
function filterDropdown(items, searchTerm) {
    dropdown.innerHTML = '';
    const filteredItems = items.filter(item =>
        item.INDEKS.toString().includes(searchTerm) || item.NAZWA.toLowerCase().includes(searchTerm)
    );
    populateDropdown(filteredItems);
}

// Funkcja wyświetlania szczegółów produktu
function displaySelectedItem(item) {
    console.log("Wybrany element:", item);

    if (!item) {
        console.warn("Nie znaleziono danych dla podanego indeksu.");
        return;
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

    if ($.fn.dataTable.isDataTable('#resultTable')) {
        $('#resultTable').DataTable().clear().destroy();
    }

    $('#resultTable').DataTable({
        scrollY: '200px',
        scrollX: true,
        scrollCollapse: true,
        paging: false,
        autoWidth: false,
        info: false,
        columnDefs: [
            { width: '150px', targets: '_all' }
        ]
    });
}

// Funkcja sprawdzania ceny
function checkPrice(price, index) {
    const minPrice = minPrices[index];
    if (minPrice) {
        if (price === 0) {
            priceMessage.textContent = 'Skontakuj się z Twoim opiekunem.';
            priceMessage.style.color = 'red';
        } else if (price >= minPrice) {
            priceMessage.textContent = 'Cena jest odpowiednia.';
            priceMessage.style.color = 'green';
        } else if (price < minPrice * 0.9) {
            priceMessage.textContent = 'Skontakuj się z Twoim opiekunem.';
            priceMessage.style.color = 'red';
        } else {
            const adjustedPrice = (minPrice * 1.02).toFixed(2);
            priceMessage.textContent = `Sugerowana cena: ${adjustedPrice}`;
            priceMessage.style.color = 'orange';
        }
    } else {
        priceMessage.textContent = 'Nie znaleziono minimalnej ceny dla tego indeksu.';
        priceMessage.style.color = 'black';
    }
}

