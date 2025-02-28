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
                    parts = parts.split(';').map(part => {
                        // Usuń wszystkie spacje i zamień przecinki na kropki, jeśli istnieją
                        let cleanedPart = part.trim().replace(',', '.');
                        return cleanedPart === "" || isNaN(cleanedPart) ? "0" : cleanedPart;
                    });

                    const khName = parts[1]; // Nazwa KH (druga kolumna)
                    if (khName && khName !== "0" && !khName.toUpperCase().includes('NAZWA KH')) {
                        // Oblicz średnią z kolumn D do L (indeksy 3–10)
                        const weeklyValues = parts.slice(3, 11).map(Number); // Konwersja na liczby
                        console.log(`Dane dla ${khName}:`, weeklyValues); // Debug: wyświetl wartości tygodniowe
                        const average = weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length || 0; // Wróć do oryginalnego dzielenia przez length
                        const columnM = Number(parts[12]) || 0; // Wartość z kolumny M

                        // Debug: wyświetl obliczenia
                        console.log(`Średnia dla ${khName}: ${average}, Kolumna M: ${columnM}`);

                        // Porównanie średniej z kolumną M i określenie strzałki
                        let arrow = '';
                        let arrowClass = '';
                        if (average < columnM) {
                            arrow = '↑'; // Strzałka w górę (zielona) – wzrost
                            arrowClass = 'green-arrow';
                        } else if (average > columnM) {
                            arrow = '↓'; // Strzałka w dół (czerwona) – spadek
                            arrowClass = 'red-arrow';
                        } else {
                            arrow = '='; // Znak równości (żółty) – brak zmiany
                            arrowClass = 'yellow-equals';
                        }

                        khEntries.push({ name: khName, arrow: arrow, arrowClass: arrowClass });
                    }
                }
            }

            // Wyświetlanie nazw KH z odpowiednimi strzałkami w liście (z przewijaniem)
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            if (khEntries.length > 0) {
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
                console.warn('Brak danych KH w Firebase po przetworzeniu.');
                khList.innerHTML = '<div class="kh-entry">Brak danych</div>';
            }
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
            // Symulacja danych zapasowych z przykładowymi wartościami kolumn D–L i M
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            backupData.forEach(name => {
                // Symulacja danych w formacie tabeli Excel dla każdego klienta
                const weeklyValues = [
                    4500, 0, 4500, 4500, 4500, 4500, 4500, 4500, 4500 // Przykładowe wartości D–L (możesz dostosować)
                ];
                const columnM = 5000; // Przykładowa wartość kolumny M (możesz dostosować)

                // Oblicz średnią z kolumn D–L (dzieląc sumę przez length, nawet jeśli są puste pola – tu 0 w E)
                const average = weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length;

                // Oblicz trend zgodnie z logiką (average < columnM → ↑, average > columnM → ↓, else =)
                let arrow = '';
                let arrowClass = '';
                if (average < columnM) {
                    arrow = '↑'; // Strzałka w górę (zielona) – wzrost
                    arrowClass = 'green-arrow';
                } else if (average > columnM) {
                    arrow = '↓'; // Strzałka w dół (czerwona) – spadek
                    arrowClass = 'red-arrow';
                } else {
                    arrow = '='; // Znak równości (żółty) – brak zmiany
                    arrowClass = 'yellow-equals';
                }

                const div = document.createElement('div');
                div.className = 'kh-entry';
                div.innerHTML = `
                    <span class="kh-name">${name}</span>
                    <span class="kh-arrow ${arrowClass}">${arrow}</span>
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
                // Symulacja danych w formacie tabeli Excel dla każdego klienta
                const weeklyValues = [
                    4500, 0, 4500, 4500, 4500, 4500, 4500, 4500, 4500 // Przykładowe wartości D–L (możesz dostosować)
                ];
                const columnM = 5000; // Przykładowa wartość kolumny M (możesz dostosować)

                // Oblicz średnią z kolumn D–L (dzieląc sumę przez length, nawet jeśli są puste pola – tu 0 w E)
                const average = weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length;

                // Oblicz trend zgodnie z logiką (average < columnM → ↑, average > columnM → ↓, else =)
                let arrow = '';
                let arrowClass = '';
                if (average < columnM) {
                    arrow = '↑'; // Strzałka w górę (zielona) – wzrost
                    arrowClass = 'green-arrow';
                } else if (average > columnM) {
                    arrow = '↓'; // Strzałka w dół (czerwona) – spadek
                    arrowClass = 'red-arrow';
                } else {
                    arrow = '='; // Znak równości (żółty) – brak zmiany
                    arrowClass = 'yellow-equals';
                }

                const div = document.createElement('div');
                div.className = 'kh-entry';
                div.innerHTML = `
                    <span class="kh-name">${name}</span>
                    <span class="kh-arrow ${arrowClass}">${arrow}</span>
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
