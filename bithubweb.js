let databases = {};
let currentDatabase = [];
let tabulatorInstance;

function showHomePage() {
    document.getElementById('homePage').classList.remove('hidden');
    document.getElementById('matchJSONPage').classList.add('hidden');
}

function showSubTiles() {
    document.getElementById('subTilesContainer').classList.toggle('hidden');
}

function navigateTo(page) {
    window.location.href = page;
}

function showMatchJSONPage() {
    document.getElementById('homePage').classList.add('hidden');
    document.getElementById('matchJSONPage').classList.remove('hidden');
    initializeTable();
}

async function setCategory(category) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/Marcin870119/matchweb/main/${category}.json`);
        if (!response.ok) throw new Error("Błąd wczytywania pliku JSON");
        const data = await response.json();
        databases[category] = data;
        currentDatabase = databases[category];
        document.getElementById("currentMatch").innerText = `MATCH ${category.toUpperCase()}`;
        document.querySelectorAll('.tile').forEach(tile => tile.classList.remove('active'));
        document.querySelector(`.tile.${category}`).classList.add('active');
        console.log(`Załadowano bazę danych: ${category}`, currentDatabase);
        if (tabulatorInstance) {
            searchAndMatch([]);
        }
    } catch (error) {
        console.error("Błąd wczytywania JSON:", error);
        alert("Nie udało się załadować danych JSON!");
    }
}

function initializeTable() {
    if (!tabulatorInstance) {
        tabulatorInstance = new Tabulator("#resultsTable", {
            layout: "fitColumns",
            pagination: "local",
            paginationSize: 10,
            columns: [
                { title: "#", field: "id", formatter: "rownum", headerSort: false, width: 50 },
                { title: "Kod (MM)", field: "MM", sorter: "number", width: 100, headerFilter: "input" },
                { title: "Nazwa", field: "NAZWA", sorter: "string", headerFilter: "input" },
                { title: "Cena", field: "CENA", sorter: "number", formatter: "money", formatterParams: { decimal: ".", thousand: ",", precision: 2 } },
                { 
                    title: "Rabat", 
                    field: "RABAT", 
                    sorter: "number", 
                    headerFilter: "list", 
                    headerFilterParams: { values: { "": "Wszystkie", "zielony": "Zielony", "żółty": "Żółty", "czerwony": "Czerwony" } },
                    headerFilterFunc: customFilter,
                    formatter: function(cell) { 
                        let value = parseFloat(cell.getValue());
                        let color = getColor(value);
                        let colorCode = color === "czerwony" ? "red" : color === "żółty" ? "#FFD700" : "green";
                        return `<span style="color: ${colorCode}; font-weight: bold;">${value}%</span>`;
                    }
                }
            ],
            data: []  // Ustawienie pustych danych podczas inicjalizacji
        });

        tabulatorInstance.on("tableBuilt", function() {
            console.log("Tabela została zainicjalizowana.");
            if (currentDatabase.length > 0) {
                searchAndMatch(currentDatabase);
            }
        });
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        readFile(file);
    }
}

function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
        readFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
}

function readFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            console.log("Wczytane dane:", jsonData);
            searchAndMatch(jsonData);
        } catch (error) {
            alert("Błąd podczas wczytywania pliku JSON!");
            console.error(error);
        }
    };
    reader.readAsText(file);
}

function replaceCharacters(text) {
    const replacements = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => replacements[char] || char);
}

function searchAndMatch(jsonData) {
    console.log("Rozpoczęcie przetwarzania danych...");
    let matchedData = [];

    jsonData.forEach(entry => {
        if (!entry["wartosc"] || !entry["wartosc (5)"]) return;

        let sp = replaceCharacters(entry["wartosc"].toString().trim().toUpperCase());
        let cena = parseFloat(entry["wartosc (5)"].replace(',', '.'));

        currentDatabase.forEach(item => {
            let db_sp = replaceCharacters((item.WABAR || item.SP || item.Rofood || "").toString().trim().toUpperCase());
            if (db_sp === sp) {
                const rabat = ((1 - (cena / parseFloat(item["CENA 100 MM"]))) * 100).toFixed(2);
                matchedData.push({ MM: item.MM, NAZWA: replaceCharacters(item.NAZWA), CENA: cena.toFixed(2), RABAT: rabat });
            }
        });
    });

    console.log("Przetworzone dane:", matchedData);
    if (matchedData.length === 0) {
        console.warn("Brak danych do wyświetlenia.");
    }
    displayResults(matchedData);
    displaySummary(matchedData);
}

function getColor(value) {
    if (value > 70) return "czerwony";
    if (value > 60) return "żółty";
    return "zielony";
}

function customFilter(headerValue, rowValue, rowData) {
    if (!headerValue) return true;
    const value = parseFloat(rowData['RABAT']);
    const color = getColor(value);
    return color === headerValue;
}

function displayResults(matches) {
    console.log("Wyświetlanie wyników:", matches);
    if (tabulatorInstance) {
        tabulatorInstance.setData(matches);
    }
    document.getElementById('summaryContainer').style.display = 'block';
}

function displaySummary(matches) {
    let totalDiscount = 0;
    matches.forEach(entry => {
        totalDiscount += parseFloat(entry.RABAT);
    });
    const averageDiscount = (totalDiscount / matches.length).toFixed(2);
    document.getElementById('summaryContainer').innerText = `Średni rabat: ${averageDiscount}%`;
}

function downloadXLS() {
    if (tabulatorInstance) {
        tabulatorInstance.download("xlsx", "wyniki.xlsx", { sheetName: "Dane" });
    } else {
        alert("Brak danych do pobrania!");
    }
}

// Inicjalizacja Tabulatora przy pierwszym załadowaniu strony
initializeTable();