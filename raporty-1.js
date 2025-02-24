var hot; // Tabela z danymi wejściowymi
var reportHot; // Tabela raportu

const PRODUCENT_SKROT_INDEX = 8; // Indeks kolumny "PRODUCENT SKROT" (kolumna I)
const KATEGORIA_INDEX = 9; // Indeks kolumny J (Kategoria)
const SPRZEDAZ_START_INDEX = 10; // Indeks kolumny K (początek danych sprzedażowych)
const SPRZEDAZ_END_INDEX = 15;  // Indeks kolumny P (koniec *ciągłych* danych sprzedażowych)
const OSTATNI_MIESIAC_INDEX = 16; // Indeks kolumny Q (sprzedaż ostatniego miesiąca)


// Język Handsontable (bez zmian)
Handsontable.languages.pl = {
    languageCode: 'pl-PL',
    contextMenu: {
        rowAbove: 'Wstaw wiersz powyżej',
        rowBelow: 'Wstaw wiersz poniżej',
        colLeft: 'Wstaw kolumnę po lewej',
        colRight: 'Wstaw kolumnę po prawej',
        removeRow: ['Usuń wiersz', 'Usuń wiersze'],
        removeCol: ['Usuń kolumnę', 'Usuń kolumny'],
        clearColumn: 'Wyczyść kolumnę',
        copy: 'Kopiuj',
        cut: 'Wytnij',
        paste: 'Wklej',
        hiddenColumnsShow: 'Pokaż ukryte kolumny',
        hiddenRowsShow: 'Pokaż ukryte wiersze',
        filters: {
            cancel: 'Anuluj',
            clear: 'Wyczyść',
            byCondition: 'Filtruj według warunku',
            byValue: 'Filtruj według wartości',
            confirm: 'OK',
            and: 'oraz',
            or: 'lub',
            condition: 'Warunek',
            conditions: {
                none: 'Brak',
                empty: 'Puste',
                not_empty: 'Niepuste',
                equal: 'Równe',
                not_equal: 'Nie równe',
                begins_with: 'Zaczyna się od',
                ends_with: 'Kończy się na',
                contains: 'Zawiera',
                not_contains: 'Nie zawiera',
                greater_than: 'Większe niż',
                less_than: 'Mniejsze niż',
                greater_than_or_equal: 'Większe lub równe',
                less_than_or_equal: 'Mniejsze lub równe',
                between: 'Pomiędzy',
                not_between: 'Poza zakresem'
            }
        }
    }
};



// Wczytywanie pliku CSV
document.getElementById('csvFileInput').addEventListener('change', function (e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function (e) {
        var data = new Uint8Array(reader.result);
        var workbook = XLSX.read(data, { type: 'array' });
        var sheet = workbook.Sheets[workbook.SheetNames[0]];
        var json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log('Wczytane dane:', json); // Debug: Sprawdź wczytane dane

        // Inicjalizacja tabeli (dane wejściowe)
        hot = new Handsontable(document.getElementById('excelTable'), {
            data: json,
            colHeaders: true,
            rowHeaders: true,
            minSpareRows: 1,
            contextMenu: Handsontable.languages.pl.contextMenu,
            dropdownMenu: true,
            filters: true,
            columnSorting: true,
            manualColumnResize: true,
            manualRowResize: true,
            height: '400px',
            language: 'pl-PL',
            licenseKey: 'non-commercial-and-evaluation',
            rowHeights: () => 23,
            viewportRowRenderingOffset: 'auto',
            observeChanges: true
        });
    };
});


// Obsługa przycisku generowania raportów (zmodyfikowana)
document.getElementById('reportsContainer').addEventListener('change', function () {
    var reportType = document.getElementById('reportType').value;
    if (reportType === 'decrease' || reportType === 'increase') {
        generateReport(hot.getData(), hot.getColHeader(), reportType);
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
        if (key.startsWith("undefined") || key === null) return; //pomija undefined

        var producerRows = producerData[key];
        // Dzielimy klucz z powrotem na producenta i kategorię
        var [producer, category] = key.split(' - ');


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
            averages.push(sum / count || 0);
        }

        let averageSales = averages.length > 0 ? averages.reduce((acc, val) => acc + val, 0) / averages.length : 0;

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
            data: [reportHeaders, ...reportData],
            colHeaders: true,
            rowHeaders: true,
            readOnly: true, // Ustaw tabelę raportu jako tylko do odczytu
            height: '400px',
            language: 'pl-PL',
            licenseKey: 'non-commercial-and-evaluation',
        });
    } else {
        reportHot.updateSettings({
            data: [reportHeaders, ...reportData]
        });
    }
}

// Funkcja zapisu do Excel (dostosowana do zapisu obu tabel)
function saveToExcel() {
    var wb = XLSX.utils.book_new();

    // Zapisz dane wejściowe
    var dataInput = hot.getData();
    var wsInput = XLSX.utils.aoa_to_sheet(dataInput);
    XLSX.utils.book_append_sheet(wb, wsInput, "Dane Wejściowe");

    // Zapisz dane raportu (jeśli istnieją)
    if (reportHot) {
        var dataReport = reportHot.getData();
        var wsReport = XLSX.utils.aoa_to_sheet(dataReport);
        XLSX.utils.book_append_sheet(wb, wsReport, "Raport");
    }

    XLSX.writeFile(wb, "raport.xlsx");
}
