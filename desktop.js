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

// Funkcja, która ładuje i wyświetla nazwy KH z Firebase w oknie 1 z odpowiednimi strzałkami
function loadKHData() {
    const khList = document.querySelector('.kh-list');
    if (!khList) {
        console.error('Nie znaleziono elementu .kh-list');
        return;
    }

    onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Przetwarzanie danych z Firebase – wyciąganie tylko "NAZWA KH" i obliczanie strzałek
            let khEntries = [];
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    let parts = typeof value === "object" 
                        ? Object.values(value).join(';') 
                        : value;
                    parts = parts.split(';').map(part => part.trim() === "" ? "0" : part);

                    // Zakładam, że:
                    // - parts[0] = KOD KH
                    // - parts[1] = NAZWA KH
                    // - parts[3] do parts[10] = kolumny D do L (tygodniowe dane)
                    // - parts[12] = kolumna M
                    const khName = parts[1]; // Nazwa KH (druga kolumna)
                    if (khName && khName !== "0" && !khName.toUpperCase().includes('NAZWA KH')) {
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
                        } else {
                            arrow = '='; // Znak równości (żółty)
                            arrowClass = 'yellow-equals';
                        }

                        khEntries.push({ name: khName, arrow: arrow, arrowClass: arrowClass });
                    }
                }
            }

            // Wyświetlanie nazw KH z odpowiednimi strzałkami w liście (z przewijaniem)
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            khEntries.forEach(entry => {
                const div = document.createElement('div');
                div.className = 'kh-entry';
                div.innerHTML = `
                    <span class="kh-name">${entry.name}</span>
                    <span class="kh-arrow ${entry.arrowClass}">${entry.arrow}</span>
                `;
                khList.appendChild(div);
            });
        } else {
            console.warn('Brak danych w Firebase. Używam danych zapasowych.');
            // Dane zapasowe, jeśli Firebase nie zwróci danych
            const backupData = [
                "MAJA NORTHOLT",
                "MAJA EXETER",
                "DELIKATESY SMACZEK LUTON 3",
                "PRASHANT PATEL",
                "DELIKATESY SMACZEK COVENTRY",
                "POLSKI SKLEP SMACZEK (READING) LIMITED",
                "POLSKIE DELIKATesy SMACZEK BASINGSTOKE",
                "SMACZEK SLOUGH 2",
                "LONDEK ILFORD",
                "SMACZEK SOUTHAMPTON BITTERNE",
                "NIMIT PATEL !! SAVE MORE",
                "LONDEK ROMFORD"
            ];
            // Symulacja danych zapasowych z przykładowymi wartościami (dla testów)
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            backupData.forEach(name => {
                const div = document.createElement('div');
                div.className = 'kh-entry';
                div.innerHTML = `
                    <span class="kh-name">${name}</span>
                    <span class="kh-arrow yellow-equals">=</span> <!-- Domyślnie znak równości dla danych zapasowych -->
                `;
                khList.appendChild(div);
            });
        }
    }, (error) => {
        console.error('Błąd pobierania danych z Firebase:', error);
        // Użyj danych zapasowych w przypadku błędu
        const backupData = [
            "MAJA NORTHOLT",
            "MAJA EXETER",
            "DELIKATESY SMACZEK LUTON 3",
            "PRASHANT PATEL",
            "DELIKATESY SMACZEK COVENTRY",
            "POLSKI SKLEP SMACZEK (READING) LIMITED",
            "POLSKIE DELIKATesy SMACZEK BASINGSTOKE",
            "SMACZEK SLOUGH 2",
            "LONDEK ILFORD",
            "SMACZEK SOUTHAMPTON BITTERNE",
            "NIMIT PATEL !! SAVE MORE",
            "LONDEK ROMFORD"
        ];
        const khList = document.querySelector('.kh-list');
        if (khList) {
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            backupData.forEach(name => {
                const div = document.createElement('div');
                div.className = 'kh-entry';
                div.innerHTML = `
                    <span class="kh-name">${name}</span>
                    <span class="kh-arrow yellow-equals">=</span> <!-- Domyślnie znak równości dla danych zapasowych -->
                `;
                khList.appendChild(div);
            });
        }
    });
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
