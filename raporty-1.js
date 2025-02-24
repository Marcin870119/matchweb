var hot; // Tabela z danymi wejściowymi
var reportHot; // Tabela raportu

const PRODUCENT_SKROT_INDEX = 8; // Indeks kolumny "PRODUCENT SKROT" (kolumna I)
const KATEGORIA_INDEX = 9; // Indeks kolumny J (Kategoria)
const SPRZEDAZ_START_INDEX = 10; // Indeks kolumny K (początek danych sprzedażowych)
const SPRZEDAZ_END_INDEX = 15;  // Indeks kolumny P (koniec *ciągłych* danych sprzedażowych)
const OSTATNI_MIESIAC_INDEX = 16; // Indeks kolumny Q (sprzedaż ostatniego miesiąca)

// Język Handsontable (bez zmian)
Handsontable.languages.registerLanguageDictionary(Handsontable.languages.pl);

// Wczytywanie pliku CSV
document.getElementById('csvFileInput').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) {
        alert("Nie wybrano pliku.");
        return;
    }

    var reader = new FileReader();

    reader.onload = function (e) {
        try {
            var data = new Uint8Array(reader.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var sheet = workbook.Sheets[workbook.SheetNames[0]];
            var json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            console.log('Wczytane dane:', json); // Debug: Sprawdź wczytane dane

            // Walidacja danych: Sprawdź, czy kluczowe kolumny istnieją
            if (json.length > 0) {
                const firstRow = json[0];
                if (firstRow.length <= PRODUCENT_SKROT_INDEX ||
                    firstRow.length <= KATEGORIA_INDEX ||
                    firstRow.length <= SPRZEDAZ_START_INDEX ||
                    firstRow.length <= SPRZEDAZ_END_INDEX ||
                    firstRow.length <= OSTATNI_MIESIAC_INDEX)
                 {
                    alert("Błąd: Struktura pliku CSV jest nieprawidłowa. Brakuje wymaganych kolumn.");
                    return;
                }
            } else {
                alert("Błąd: Plik CSV jest pusty.");
                return;
            }

            // Inicjalizacja tabeli (dane wejściowe)
            hot = new Handsontable(document.getElementById('excelTable'), {
                data: json,
                colHeaders: true,
                rowHeaders: true,
                minSpareRows: 1,
                contextMenu: true,
                dropdownMenu: true,
                filters: true,
                columnSorting: true,
                manualColumnResize: true,
                manualRowResize: true,
                height: '400px',
                language: 'pl-PL',
                licenseKey: 'non-commercial-and-evaluation',
                observeChanges: true
            });
        } catch (error) {
            console.error("Błąd podczas przetwarzania pliku:", error);
            alert("Wystąpił błąd podczas przetwarzania pliku CSV. Upewnij się, że plik ma prawidłowy format.");
        }
    };

    reader.onerror = function (error) {
        console.error("Błąd odczytu pliku:", error);
        alert("Wystąpił błąd podczas odczytu pliku.");
    };

    reader.readAsArrayBuffer(file);
});

// Obsługa przycisku generowania raportów (zmodyfikowana)
document.getElementById('reportsContainer').addEventListener('change', function () {
    var reportType = document.getElementById('reportType').value;
    if (hot && (reportType === 'decrease' || reportType === 'increase')) {
        generateReport(hot.getData(), hot.getColHeader(), reportType);
    } else if (!hot) {
        alert('Proszę najpierw zaimportować plik CSV.');
    } else {
        alert('Proszę wybrać rodzaj raportu.');
    }
});


// Funkcja generująca raport (połączone spadki i wzrosty)
function generateReport(data, headers, reportType) {
    console.log('Nagłówki kolumn:', headers); // Debug: Sprawdź nagłówki
    console.log('Dane wejściowe:', data); // Debug: Sprawdź dane

    var reportData = [];
    var producerData = {};

    // Grupowanie danych według producenta *i kategorii*
    data.forEach(row => {
        var producer = row[PRODUCENT_SKROT_INDEX];
        var category = row[KATEGORIA_INDEX];
        // Klucz to kombinacja producenta i kategorii
        var key = `${producer} - ${category}`;


        if (!producerData[key] && producer !== undefined && producer !== null) {
            producerData[key] = [];
        }

        if (producer !== undefined && producer !== null) {
            producerData[key].push(row);
        }
    });


    // Tworzenie nagłówków raportu
    var reportHeaders = ['PRODUCENT', 'ŚREDNIA SPRZEDAŻY', 'SPRZEDAŻ OSTATNI MIESIĄC', 'ZMIANA PROCENTOWA'];

    // Przetwarzanie danych dla każdego producenta i kategorii
    Object.keys(producerData).forEach(key => { // Iteruj po kluczach (producent - kategoria)
        if(key.startsWith("undefined") || key.startsWith("null")) return;

        var producerRows = producerData[key];

        // Pobierz dane sprzedaży z kolumn K-P
        var salesData = producerRows.map(row => {
            let salesRow = [];
            for (let i = SPRZEDAZ_START_INDEX; i <= SPRZEDAZ_END_INDEX; i++) {
                salesRow.push(parseFloat(row[i]) || 0);
            }
            return salesRow;
        });

        console.log('Dane sprzedaży dla producenta/kategorii:', salesData);


        // Oblicz średnią sprzedaży z kolumn K-P
        var averages = [];
        for (let i = 0; i < salesData[0].length; i++) {
            let sum = 0;
            let count = 0;
            salesData.forEach(row => {
                let value = row[i];
                sum += value;
                count++;
            });
             averages.push(sum / count || 0); // Use count, because forEach will iterate all
        }
        let averageSales = averages.length > 0? averages.reduce((acc, val) => acc + val, 0) / averages.length : 0;

        // Wartość sprzedaży z ostatniego miesiąca (kolumna Q)
        let lastMonthSales = parseFloat(producerRows[0][OSTATNI_MIESIAC_INDEX]) || 0; // Kolumna Q
        console.log('Średnia sprzedaży:', averageSales, 'Sprzedaż ostatniego miesiąca:', lastMonthSales);

        // Oblicz procentową zmianę
        let percentageChange;
        if (averageSales !== 0) {
            percentageChange = ((lastMonthSales - averageSales) / averageSales) * 100;
        } else {
            percentageChange = lastMonthSales > 0 ? 100 : 0; // Jeśli średnia 0, a ost. miesiąc > 0, to 100% wzrostu
        }


        // Dodaj do danych raportu TYLKO jeśli zmiana jest zgodna z typem raportu
        if (reportType === 'decrease' && percentageChange < 0) {
            reportData.push([
                key, // Użyj całego klucza (producent - kategoria)
                averageSales.toFixed(2),
                lastMonthSales.toFixed(2),
                `${percentageChange.toFixed(2)}%`
            ]);
        } else if (reportType === 'increase' && percentageChange > 0) {
            reportData.push([
                key, // Użyj całego klucza (producent - kategoria)
                averageSales.toFixed(2),
                lastMonthSales.toFixed(2),
                `${percentageChange.toFixed(2)}%`
            ]);
        }
    });

    console.log('Dane raportu:', reportData); // Debug: Sprawdź dane raportu

    // Inicjalizacja lub aktualizacja tabeli raportu
    if (!reportHot) {
        reportHot = new Handsontable(document.getElementById('reportTable'), {
            data: [reportHeaders, ...reportData], // Include headers in data
            colHeaders: true, // Set to true, to display column header
            rowHeaders: true,
            readOnly: true,
            height: '400px',
            language: 'pl-PL',
            licenseKey: 'non-commercial-and-evaluation',
        });
    } else {
        reportHot.updateSettings({
            data: [reportHeaders, ...reportData] // Include headers in data
        });
    }
}


// Funkcja zapisu do Excel (dostosowana do zapisu obu tabel)
function saveToExcelFile() {
    var wb = XLSX.utils.book_new();

    // Zapisz dane wejściowe
    if(hot){ // Check if hot exists
        var dataInput = hot.getData();
        var wsInput = XLSX.utils.aoa_to_sheet(dataInput);
        XLSX.utils.book_append_sheet(wb, wsInput, "Dane Wejściowe");
    }

    // Zapisz dane raportu (jeśli istnieją)
    if (reportHot) {
        var dataReport = reportHot.getData();
        var wsReport = XLSX.utils.aoa_to_sheet(dataReport);
        XLSX.utils.book_append_sheet(wb, wsReport, "Raport");
    }

    XLSX.writeFile(wb, "raport.xlsx");
}
