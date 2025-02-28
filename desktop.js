// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Konfiguracja Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCPZ0OsJmaDpJjkVFl3vGv4WalDYDY23xQ",
    authDomain: "webmatcher-94f0e.firebaseapp.com",
    databaseURL: "https://webmatcher-94f0e-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "webmatcher-94f0e",
    storageBucket: "webmatcher-94f0e.appspot.com",
    messagingSenderId: "970664630623",
    appId: "G-RMMBEY655B"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dataRef = ref(database, 'Data/data-table1');

// Zmienna globalna do przechowywania listy klientów i bieżącego indeksu
let khEntries = [];
let currentIndex = 0;

// Funkcja, która ładuje dane z Firebase i inicjalizuje nawigację
function loadKHData() {
    const khName = document.querySelector('.kh-name');
    const khArrow = document.querySelector('.kh-arrow');
    const averageValue = document.querySelector('.average-value');
    const columnMValue = document.querySelector('.column-m-value');

    if (!khName || !khArrow || !averageValue || !columnMValue) {
        console.error('Nie znaleziono elementów do wyświetlania danych KH');
        return;
    }

    onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            khEntries = [];
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    let parts = typeof value === "object" 
                        ? Object.values(value).join(';') 
                        : value;
                    parts = parts.split(';').map(part => part.trim() === "" ? "0" : part);

                    const khNameValue = parts[1]; // Nazwa KH (druga kolumna)
                    if (khNameValue && khNameValue !== "0" && !khNameValue.toUpperCase().includes('NAZWA KH')) {
                        // Oblicz średnią z kolumn D do L (indeksy 3–10)
                        const weeklyValues = parts.slice(3, 11).map(Number); // Konwersja na liczby
                        const average = weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length || 0;
                        const columnM = Number(parts[12]) || 0; // Wartość z kolumny M

                        // Porównanie średniej z kolumną M i określenie strzałki
                        let arrow = '';
                        let arrowClass = '';
                        if (average < columnM) {
                            arrow = '↑'; // Strzałka w górę (zielona)
                            arrowClass = 'green-arrow';
                        } else if (average > columnM) {
                            arrow = '↓'; // Strzałka w dół (czerwona)
                            arrowClass = 'red-arrow';
                        }

                        khEntries.push({ name: khNameValue, average: average.toFixed(2), columnM: columnM.toFixed(2), arrow: arrow, arrowClass: arrowClass });
                    }
                }
            }

            // Wyświetl pierwszego klienta, jeśli lista nie jest pusta
            if (khEntries.length > 0) {
                currentIndex = 0;
                updateDisplay();
            } else {
                console.warn('Brak danych KH w Firebase. Używam danych zapasowych.');
                // Dane zapasowe, jeśli Firebase nie zwróci danych
                khEntries = [
                    { name: "DELIKATESY SMACZEK LUTON 3", average: "3500", columnM: "3600", arrow: '↑', arrowClass: 'green-arrow' },
                    { name: "MAJA NORTHOLT", average: "7985.87", columnM: "11365.89", arrow: '↓', arrowClass: 'red-arrow' },
                    { name: "MAJA EXETER", average: "3000", columnM: "2900", arrow: '↓', arrowClass: 'red-arrow' }
                ];
                currentIndex = 0;
                updateDisplay();
            }
        } else {
            console.warn('Brak danych w Firebase. Używam danych zapasowych.');
            // Dane zapasowe
            khEntries = [
                { name: "DELIKATESY SMACZEK LUTON 3", average: "3500", columnM: "3600", arrow: '↑', arrowClass: 'green-arrow' },
                { name: "MAJA NORTHOLT", average: "7985.87", columnM: "11365.89", arrow: '↓', arrowClass: 'red-arrow' },
                { name: "MAJA EXETER", average: "3000", columnM: "2900", arrow: '↓', arrowClass: 'red-arrow' }
            ];
            currentIndex = 0;
            updateDisplay();
        }
    }, (error) => {
        console.error('Błąd pobierania danych z Firebase:', error);
        // Użyj danych zapasowych w przypadku błędu
        khEntries = [
            { name: "DELIKATESY SMACZEK LUTON 3", average: "3500", columnM: "3600", arrow: '↑', arrowClass: 'green-arrow' },
            { name: "MAJA NORTHOLT", average: "7985.87", columnM: "11365.89", arrow: '↓', arrowClass: 'red-arrow' },
            { name: "MAJA EXETER", average: "3000", columnM: "2900", arrow: '↓', arrowClass: 'red-arrow' }
        ];
        const khName = document.querySelector('.kh-name');
        const khArrow = document.querySelector('.kh-arrow');
        const averageValue = document.querySelector('.average-value');
        const columnMValue = document.querySelector('.column-m-value');
        if (khName && khArrow && averageValue && columnMValue) {
            currentIndex = 0;
            updateDisplay();
        }
    });
}

// Funkcja aktualizująca wyświetlanie bieżącego klienta
function updateDisplay() {
    const khName = document.querySelector('.kh-name');
    const khArrow = document.querySelector('.kh-arrow');
    const averageValue = document.querySelector('.average-value');
    const columnMValue = document.querySelector('.column-m-value');
    const upArrow = document.querySelector('.up-arrow');
    const downArrow = document.querySelector('.down-arrow');

    if (khEntries.length > 0 && currentIndex >= 0 && currentIndex < khEntries.length) {
        const entry = khEntries[currentIndex];
        khName.textContent = entry.name;
        khArrow.textContent = entry.arrow;
        khArrow.className = `kh-arrow ${entry.arrowClass}`;
        averageValue.textContent = entry.average;
        columnMValue.textContent = entry.columnM;
    } else {
        khName.textContent = 'Brak danych';
        khArrow.textContent = '';
        averageValue.textContent = '';
        columnMValue.textContent = '';
    }

    // Ukryj strzałki, jeśli jesteśmy na początku lub końcu listy
    if (upArrow && downArrow) {
        upArrow.style.display = currentIndex === 0 ? 'none' : 'inline-block';
        downArrow.style.display = currentIndex === khEntries.length - 1 ? 'none' : 'inline-block';
    }
}

// Funkcja nawigacji między klientami (poprzedni lub następny)
function navigateKH(direction) {
    if (khEntries.length > 0) {
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = khEntries.length - 1; // Powrót na koniec listy, jeśli jesteśmy na początku
        if (currentIndex >= khEntries.length) currentIndex = 0; // Powrót na początek listy, jeśli jesteśmy na końcu
        updateDisplay();
    }
}

// Funkcja pokazująca stronę główną
function showHomePage() {
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.remove('hidden');
    } else {
        console.error('Nie znaleziono elementu #homePage');
    }
}

// Funkcja dla MATCH JSON (przykładowa)
function showMatchJSONPage() {
    console.log('Przejście do MATCH JSON');
    // Tutaj możesz dodać logikę dla strony MATCH JSON
}

// Wywołaj funkcje po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    showHomePage();
    loadKHData(); // Ładuj dane KH z Firebase po załadowaniu strony
});
