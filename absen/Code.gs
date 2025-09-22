// Fungsi untuk membuat sheet dan header jika belum ada
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: Manajemen Anggota
  let sheet1 = ss.getSheetByName('Anggota');
  if (!sheet1) {
    sheet1 = ss.insertSheet('Anggota', 0);
  }
  const headersAnggota = ['Nama Anggota'];
  if (sheet1.getLastRow() < 1) {
    sheet1.appendRow(headersAnggota);
  }
  
  // Sheet 2: Absensi
  let sheet2 = ss.getSheetByName('Absensi');
  if (!sheet2) {
    sheet2 = ss.insertSheet('Absensi', 1);
  }
  const headersAbsensi = ['Tanggal', 'Maintenance & Instalasi', 'ODP', 'Tarikan', 'Kerjaan Lainnya', 'Izin', 'Sakit', 'Alfa'];
  if (sheet2.getLastRow() < 1) {
    sheet2.appendRow(headersAbsensi);
  }
}

function doGet(e) {
  setupSheets();
  const task = e.parameter.task;
  if (task === 'getAnggota') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Anggota');
    if (!sheet || sheet.getLastRow() < 2) {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    const anggotas = data.map(row => row[0]);
    return ContentService.createTextOutput(JSON.stringify(anggotas)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("Invalid Request").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  setupSheets();
  const sheetAnggota = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Anggota');
  const sheetAbsensi = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Absensi');
  const task = e.parameter.task;
  
  if (task === 'absensi') {
    const data = e.parameter;
    sheetAbsensi.appendRow([
      data.tanggal,
      data.mainst,
      data.odp,
      data.tarik,
      data.lainnya,
      data.izin,
      data.sakit,
      data.alfa
    ]);
  } else if (task === 'addAnggota') {
    const nama = e.parameter.nama;
    sheetAnggota.appendRow([nama]);
  } else if (task === 'deleteAnggota') {
    const nama = e.parameter.nama;
    const data = sheetAnggota.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === nama) {
        sheetAnggota.deleteRow(i + 1);
        break;
      }
    }
  } else if (task === 'editAnggota') {
    const oldNama = e.parameter.oldNama;
    const newNama = e.parameter.nama;
    const data = sheetAnggota.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === oldNama) {
        sheetAnggota.getRange(i + 1, 1).setValue(newNama);
        break;
      }
    }
  }
  
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}
