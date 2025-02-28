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

// Funkcja, która ładuje i wyświetla tylko nazwy KH z Firebase w oknie 1
function loadKHData() {
    const khList = document.querySelector('.kh-list');
    if (!khList) {
        console.error('Nie znaleziono elementu .kh-list');
        return;
    }

    onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Przetwarzanie danych z Firebase – wyciąganie tylko "NAZWA KH"
            let khNames = [];
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    let parts = typeof value === "object" 
                        ? Object.values(value).join(';') 
                        : value;
                    parts = parts.split(';').map(part => part.trim() === "" ? "0" : part);
                    const khName = parts[1]; // Zakładam, że "NAZWA KH" jest drugą kolumną (indeks 1)
                    if (khName && khName !== "0" && !khName.toUpperCase().includes('NAZWA KH')) {
                        khNames.push(khName);
                    }
                }
            }

            // Wyświetlanie wszystkich nazw KH w liście (z przewijaniem)
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            khNames.forEach(name => {
                const p = document.createElement('p');
                p.textContent = name;
                khList.appendChild(p);
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
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            backupData.forEach(name => {
                const p = document.createElement('p');
                p.textContent = name;
                khList.appendChild(p);
            });
        }
    }, (error) => {
        console.error('Błąd pobierania danych z Firebase:', error);
        // Użyj danych zapasowych w przypadku błędu
        khList.innerHTML = ''; // Wyczyść istniejącą treść
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
        backupData.forEach(name => {
            const p = document.createElement('p');
            p.textContent = name;
            khList.appendChild(p);
        });
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
