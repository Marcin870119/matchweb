// Inicjalizacja Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Twoja konfiguracja Firebase (uzupełnij swoimi danymi)
const firebaseConfig = {
    apiKey: "AIzaSyCPZ0OsJmaDpJjkVFl3vGv4WalDYDY23xQ",
    authDomain: "webmatcher-94f0e.firebaseapp.com",
    projectId: "webmatcher-94f0e",
    storageBucket: "webmatcher-94f0e.firebasestorage.app",
    messagingSenderId: "970664630623",
    appId: "G-RMMBEY655B"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Pobieranie danych z Firestore
async function loadProducts() {
    const querySnapshot = await getDocs(collection(db, "products"));
    items = querySnapshot.docs.map(doc => doc.data()); 
    populateDropdown(items);
}

async function loadMinPrices() {
    const querySnapshot = await getDocs(collection(db, "min_prices"));
    minPrices = querySnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data().CenaMinimalna;
        return acc;
    }, {});
}

// Inicjalizacja po załadowaniu DOM
$(function () {
    $("#resultTableWrapper").draggable({ handle: "h5" });
});

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdown = document.getElementById('dropdown');
    const resultTable = document.getElementById('resultTable').querySelector('tbody');
    const priceInput = document.getElementById('price');
    const priceMessage = document.getElementById('priceMessage');
    const calculateButton = document.getElementById('calculateButton');

    let items = [];
    let minPrices = {};

    loadProducts();
    loadMinPrices();

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterDropdown(items, searchTerm);
        dropdown.style.display = searchTerm.length > 0 ? 'block' : 'none';
    });

    dropdown.addEventListener('change', () => {
        const selectedIndex = dropdown.value;
        if (selectedIndex !== "") {
            const selectedItem = items.find(item => item.INDEKS == selectedIndex);
            displaySelectedItem(selectedItem);
            searchInput.value = '';
            dropdown.style.display = 'none';
        }
    });

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

    dropdownButton.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (!dropdownButton.contains(e.target) && !dropdown.contains(e.target) && !searchInput.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    function populateDropdown(items) {
        dropdown.innerHTML = '';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.INDEKS;
            option.textContent = `${item.INDEKS} - ${item.NAZWA}`;
            dropdown.appendChild(option);
        });
    }

    function filterDropdown(items, searchTerm) {
        dropdown.innerHTML = '';
        const filteredItems = items.filter(item => 
            item.INDEKS.toString().includes(searchTerm) || item.NAZWA.toLowerCase().includes(searchTerm)
        );
        populateDropdown(filteredItems);
    }

    function displaySelectedItem(item) {
        resultTable.innerHTML = `
            <tr>
                <td>${item.INDEKS}</td>
                <td>${item.NAZWA}</td>
                <td>${item.SKROT_PRODUCENTA}</td>
                <td>${item.GRUPA_NAZWA}</td>
                <td>${item.JM_NAZWA}</td>
                <td>${item.OPK_ZB_IL}</td>
                <td>${item.IL_PALETA_T}</td>
                <td>${item.IL_WARSTWA_T}</td>
                <td>${item.CEN100_UK}</td>
            </tr>
        `;
        if ($.fn.dataTable.isDataTable('#resultTable')) {
            $('#resultTable').DataTable().destroy();
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
});
