// Przykładowe dane zapasowe KH (używane, jeśli pobieranie danych nie powiedzie się)
const backupKHData = [
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

// Funkcja, która ładuje dane z URL-a (np. raporty2.html) i wyświetla je w oknie 1
function loadKHData() {
    const khList = document.querySelector('.kh-list');
    if (!khList) {
        console.error('Nie znaleziono elementu .kh-list');
        return;
    }

    // Próba pobrania danych z zewnętrznego URL-a
    fetch('https://marcin870119.github.io/matchweb/raporty2.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Błąd sieciowy: ' + response.status);
            }
            return response.text();
        })
        .then(html => {
            // Parsowanie HTML, aby wyciągnąć nazwy KH
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Spróbuj znaleźć nazwy KH w komórkach <td> tabeli
            let khNames = Array.from(doc.querySelectorAll('td'))
                .map(td => td.textContent.trim())
                .filter(name => name && !name.toUpperCase().includes('NAZWA KH')); // Filtrujemy puste lub nagłówkowe wpisy

            // Jeśli nie znaleziono w <td>, spróbuj poszukać w innych elementach (np. <p>, <div>, <span>)
            if (khNames.length === 0) {
                khNames = Array.from(doc.querySelectorAll('p, div, span'))
                    .map(element => element.textContent.trim())
                    .filter(name => name && !name.toUpperCase().includes('NAZWA KH'));
            }

            // Jeśli nadal nie znaleziono danych, użyj danych zapasowych
            if (khNames.length === 0) {
                console.warn('Nie znaleziono danych KH na stronie raporty2.html. Używam danych zapasowych.');
                khNames = backupKHData;
            }

            // Wyświetlanie wszystkich nazw KH w liście (z przewijaniem)
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            khNames.forEach(name => {
                const p = document.createElement('p');
                p.textContent = name;
                khList.appendChild(p);
            });
        })
        .catch(error => {
            console.error('Błąd pobierania danych z raporty2.html:', error);
            // Użyj danych zapasowych w przypadku błędu (np. CORS)
            khList.innerHTML = ''; // Wyczyść istniejącą treść
            backupKHData.forEach(name => {
                const p = document.createElement('p');
                p.textContent = name;
                khList.appendChild(p);
            });
        });
}

// Funkcja pokazująca stronę główną (domyślna funkcja, którą miałeś w kodzie)
function showHomePage() {
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.remove('hidden');
    } else {
        console.error('Nie znaleziono elementu #homePage');
    }
    // Tutaj możesz dodać więcej logiki, jeśli jest potrzebna
}

// Funkcja dla MATCH JSON (przykładowa)
function showMatchJSONPage() {
    console.log('Przejście do MATCH JSON');
    // Tutaj możesz dodać logikę dla strony MATCH JSON
}

// Wywołaj funkcje po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    showHomePage();
    loadKHData(); // Ładuj dane KH po załadowaniu strony
});
