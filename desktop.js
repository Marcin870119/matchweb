// Przykładowe dane KH (symulacja danych z raporty2.html)
const khData = [
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

// Funkcja, która ładuje i wyświetla dane KH w oknie 1
function loadKHData() {
    const khList = document.querySelector('.kh-list');
    if (khList) {
        khList.innerHTML = ''; // Wyczyść istniejącą treść
        khData.slice(0, 2).forEach(name => { // Pokaż tylko pierwsze 2 nazwy
            const p = document.createElement('p');
            p.textContent = name;
            khList.appendChild(p);
        });
    }
}

// Funkcja pokazująca stronę główną (domyślna funkcja, którą miałeś w kodzie)
function showHomePage() {
    document.getElementById('homePage').classList.remove('hidden');
    // Tutaj możesz dodać więcej logiki, jeśli jest potrzebna
}

// Wywołaj funkcję po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    showHomePage();
    loadKHData(); // Ładuj dane KH po załadowaniu strony
});

// Przykładowa funkcja dla MATCH JSON (jeśli potrzebujesz)
function showMatchJSONPage() {
    // Tutaj możesz dodać logikę dla strony MATCH JSON
    console.log('Przejście do MATCH JSON');
}
