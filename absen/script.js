// ====== URL Google Apps Script Web App Anda ======
// Pastikan untuk mengganti URL ini dengan URL Web App Anda setelah di-deploy
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxatlmyypsyANdHVXCwxshpnNA59pkqkDNi4ZtL-vKGdTSq1-gKWbFPMYIs-KrUhzl82Q/exec"; 

// ====== Manajemen Tampilan Halaman ======
const pages = {
    start: document.getElementById('startPage'),
    absensi: document.getElementById('absensiPage'),
    management: document.getElementById('managementPage')
};

function showPage(pageName) {
    for (let page in pages) {
        pages[page].style.display = 'none';
    }
    pages[pageName].style.display = 'flex';
    if (pageName === 'management') {
        loadAnggota();
    }
}

// ====== Manajemen Anggota (Google Sheets) ======
const anggotaInput = document.getElementById("anggotaInput");
const addAnggotaBtn = document.getElementById("addAnggotaBtn");
const anggotaListEl = document.getElementById("anggotaList");
let anggotaList = [];

async function loadAnggota() {
    anggotaListEl.innerHTML = "<li>Memuat anggota...</li>";
    try {
        const response = await fetch(SCRIPT_URL + '?task=getAnggota');
        const data = await response.json();
        anggotaList = data;
        renderAnggota();
    } catch (error) {
        console.error("Gagal memuat anggota:", error);
        anggotaListEl.innerHTML = "<li>Gagal memuat anggota. Silakan coba lagi.</li>";
    }
}

async function updateAnggotaSheet(task, nama, oldNama) {
    const formData = new FormData();
    formData.append('task', task);
    formData.append('nama', nama);
    if (oldNama) {
        formData.append('oldNama', oldNama);
    }
    try {
        await fetch(SCRIPT_URL, { method: "POST", body: formData });
        loadAnggota();
    } catch (error) {
        alert("❌ Gagal memperbarui data anggota: " + error);
    }
}

function addAnggota() {
    const nama = anggotaInput.value.trim();
    if (nama && !anggotaList.includes(nama)) {
        updateAnggotaSheet('addAnggota', nama);
        anggotaInput.value = "";
    }
}

function removeAnggota(nama) {
    if (confirm(`Yakin ingin menghapus ${nama}?`)) {
        updateAnggotaSheet('deleteAnggota', nama);
    }
}

function editAnggota(nama) {
    const newNama = prompt("Masukkan nama baru:", nama);
    if (newNama && newNama.trim() !== nama) {
        updateAnggotaSheet('editAnggota', newNama.trim(), nama);
    }
}

function renderAnggota() {
    if (anggotaList.length === 0) {
        anggotaListEl.innerHTML = "<p>Belum ada anggota.</p>";
    } else {
        anggotaListEl.innerHTML = anggotaList.map(nama => `
            <li class="anggota-item">
                <span class="anggota-name">${nama}</span>
                <div class="anggota-actions">
                    <button class="edit-btn" onclick="editAnggota('${nama}')">Edit</button>
                    <button class="delete-btn" onclick="removeAnggota('${nama}')">Hapus</button>
                </div>
            </li>
        `).join("");
    }
}

addAnggotaBtn.addEventListener("click", addAnggota);
anggotaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        addAnggota();
    }
});

// ====== Fungsi Pengekstrak & Pemformatan Anggota dari Input ======
function formatAndExtractTeamsPair(input) {
    if (!input || !input.trim()) return { text: "", members: [] };
    let toks = input.split(",").map(s => s.trim()).filter(Boolean);
    let result = "";
    for (let i = 0; i < toks.length; i += 2) {
        let p1 = toks[i] || "";
        let p2 = toks[i + 1] || "";
        result += `Team ${Math.floor(i / 2) + 1}: ${p1}${p2 ? " & " + p2 : ""}\n`;
    }
    return { text: result, members: toks };
}

function formatAndExtractOdp(input) {
    if (!input || !input.trim()) return { text: "", members: [] };
    let blocks = input.split(".").map(s => s.trim()).filter(Boolean);
    let res = "";
    let members = [];
    blocks.forEach((blk, i) => {
        let anggota = blk.split(",").map(s => s.trim()).filter(Boolean);
        res += `Tim ODP ${i + 1}: ${anggota.join(", ")}\n`;
        members = members.concat(anggota);
    });
    return { text: res, members: members };
}

function formatAndExtractTarik(input) {
    if (!input || !input.trim()) return { text: "", members: [] };
    let blocks = input.split(".").map(s => s.trim()).filter(Boolean);
    let res = "Jadwal tim tarik\n";
    let members = [];
    blocks.forEach((blk, i) => {
        let parts = blk.split("|");
        let jarak = (parts[0] || "").trim();
        let anggota = (parts[1] || "").split(",").map(s => s.trim()).filter(Boolean);
        res += `Tim Tarik ${i + 1} : Tarikan ${jarak} - ${anggota.join(", ")}\n\n`;
        members = members.concat(anggota);
    });
    return { text: res, members: members };
}

function formatAndExtractLainnya(input) {
    if (!input || !input.trim()) return { text: "", members: [] };
    let blocks = input.split(".").map(s => s.trim()).filter(Boolean);
    let res = "";
    let members = [];
    blocks.forEach((blk) => {
        let jenis = blk.match(/\((.*?)\)/);
        let namaPart = blk.replace(/\(.*?\)/g, "").trim();
        let anggota = namaPart.split(",").map(s => s.trim()).filter(Boolean);
        if (jenis) {
            res += `${jenis[1]} :\nTeam : ${anggota.join(", ")}\n\n`;
        } else {
            if (anggota.length > 0) res += `Team : ${anggota.join(", ")}\n\n`;
        }
        members = members.concat(anggota);
    });
    return { text: res, members: members };
}

// ====== Validasi dan Preview Laporan ======
function generate() {
    const tanggal = formatTanggal(document.getElementById("tanggal").value || "");
    const mainstText = formatAndExtractTeamsPair(document.getElementById("mainst").value).text;
    const odpText = formatAndExtractOdp(document.getElementById("odp").value).text;
    const tarikText = formatAndExtractTarik(document.getElementById("tarik").value).text;
    const lainnyaText = formatAndExtractLainnya(document.getElementById("lainnya").value).text;
    const izin = (document.getElementById("izin").value || "").trim();
    const sakit = (document.getElementById("sakit").value || "").trim();
    const alfa = (document.getElementById("alfa").value || "").trim();

    // Validasi di sini saat "Preview Laporan" ditekan
    const allEnteredNames = new Set([
        ...formatAndExtractTeamsPair(document.getElementById("mainst").value).members,
        ...formatAndExtractOdp(document.getElementById("odp").value).members,
        ...formatAndExtractTarik(document.getElementById("tarik").value).members,
        ...formatAndExtractLainnya(document.getElementById("lainnya").value).members,
        ...izin.split(",").map(s => s.trim()).filter(Boolean),
        ...sakit.split(",").map(s => s.trim()).filter(Boolean),
        ...alfa.split(",").map(s => s.trim()).filter(Boolean)
    ]);

    const invalidNames = Array.from(allEnteredNames).filter(name => !anggotaList.includes(name));
    if (invalidNames.length > 0) {
        alert(`⚠️ Gagal membuat preview! Nama berikut tidak terdaftar dalam database anggota:\n${invalidNames.join("\n")}`);
        return;
    }

    renderUnscheduledMembers();

    let laporan = `Tanggal : ${tanggal}\n\n`;
    if (mainstText) laporan += `Maintenance & Instalasi\n${mainstText}\n`;
    if (odpText) laporan += `ODP\n${odpText}\n`;
    if (tarikText) laporan += `Tarikan\n${tarikText}\n`;
    if (lainnyaText) laporan += `Kerjaan Lainnya\n${lainnyaText}\n`;
    if (izin) laporan += `Izin : ${izin}\n`;
    if (sakit) laporan += `Sakit : ${sakit}\n`;
    if (alfa) laporan += `Alfa : ${alfa}\n`;

    document.getElementById("preview").innerText = laporan;
    document.getElementById("actions").style.display = "flex";
}

// ====== Simpan ke Google Sheet ======
function saveToSheet() {
    const tanggal = document.getElementById("tanggal").value;
    if (!tanggal) {
        alert("Tanggal belum diisi!");
        return;
    }
    
    // Periksa validasi kembali sebelum mengirim
    const { invalidNames } = getAttendanceData();
    if (invalidNames.length > 0) {
        alert(`⚠️ Absen gagal dikirim! Nama berikut tidak terdaftar dalam database anggota:\n${invalidNames.join("\n")}`);
        return;
    }

    const mainst = formatAndExtractTeamsPair(document.getElementById("mainst").value).text;
    const odp = formatAndExtractOdp(document.getElementById("odp").value).text;
    const tarik = formatAndExtractTarik(document.getElementById("tarik").value).text;
    const lainnya = formatAndExtractLainnya(document.getElementById("lainnya").value).text;
    const izin = (document.getElementById("izin").value || "").trim();
    const sakit = (document.getElementById("sakit").value || "").trim();
    const alfa = (document.getElementById("alfa").value || "").trim();

    const formData = new FormData();
    formData.append("task", "absensi");
    formData.append("tanggal", tanggal);
    formData.append("mainst", mainst);
    formData.append("odp", odp);
    formData.append("tarik", tarik);
    formData.append("lainnya", lainnya);
    formData.append("izin", izin);
    formData.append("sakit", sakit);
    formData.append("alfa", alfa);

    fetch(SCRIPT_URL, { method: "POST", body: formData })
        .then(res => res.text())
        .then(txt => {
            alert("✅ Absen Selesai");
        })
        .catch(err => alert("❌ Gagal simpan: " + err));
}

// ... (Fungsi-fungsi lain seperti `getAttendanceData`, `renderUnscheduledMembers`, `copyText`, `sendWhatsApp`, `clearPreview`, `formatTanggal` tetap sama seperti sebelumnya) ...
// ====== Pengecekan Anggota Tak Terjadwal dan Invalid ======
function getAttendanceData() {
    const mainstMembers = formatAndExtractTeamsPair(document.getElementById("mainst").value).members;
    const odpMembers = formatAndExtractOdp(document.getElementById("odp").value).members;
    const tarikMembers = formatAndExtractTarik(document.getElementById("tarik").value).members;
    const lainnyaMembers = formatAndExtractLainnya(document.getElementById("lainnya").value).members;
    const izinMembers = document.getElementById("izin").value.split(",").map(s => s.trim()).filter(Boolean);
    const sakitMembers = document.getElementById("sakit").value.split(",").map(s => s.trim()).filter(Boolean);
    const alfaMembers = document.getElementById("alfa").value.split(",").map(s => s.trim()).filter(Boolean);

    const allEnteredNames = new Set([
      ...mainstMembers,
      ...odpMembers,
      ...tarikMembers,
      ...lainnyaMembers,
      ...izinMembers,
      ...sakitMembers,
      ...alfaMembers
    ]);
    
    // Periksa nama yang tidak ada di daftar anggota
    const invalidNames = Array.from(allEnteredNames).filter(name => !anggotaList.includes(name));

    // Periksa anggota yang terdaftar tapi tidak masuk jadwal
    const unscheduledMembers = anggotaList.filter(anggota => !allEnteredNames.has(anggota));

    return {
        allEnteredNames,
        invalidNames,
        unscheduledMembers
    };
}


// ====== Tampilkan Daftar Anggota Tak Terjadwal ======
function renderUnscheduledMembers() {
    const { unscheduledMembers } = getAttendanceData();
    const notScheduledCard = document.getElementById("notScheduledCard");
    const notScheduledList = document.getElementById("notScheduledList");

    if (unscheduledMembers.length > 0) {
        notScheduledCard.style.display = "block";
        notScheduledList.innerHTML = unscheduledMembers.map(nama => `<li>• ${nama}</li>`).join("");
    } else {
        notScheduledCard.style.display = "none";
    }
}

// ====== Actions ======
function copyText(){
  const txt = document.getElementById("preview").innerText;
  if(!txt.trim()) return alert("Belum ada laporan untuk disalin.");
  navigator.clipboard.writeText(txt).then(()=> alert("Laporan disalin!"));
}

function sendWhatsApp(){
  const txt = document.getElementById("preview").innerText;
  if(!txt.trim()) return alert("Belum ada laporan untuk dikirim.");
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
}

function clearPreview(){
  document.getElementById("preview").innerText = "";
  document.getElementById("actions").style.display = "none";
  document.getElementById("notScheduledCard").style.display = "none";
}

// ====== Default tanggal & Pemuatan Anggota ======
function formatTanggal(inputDate){
  if (!inputDate) return "";
  const bulan=["Januari","Februari","Maret","April","Mei","Juni",
               "Juli","Agustus","September","Oktober","November","Desember"];
  const hari=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  let d=new Date(inputDate);
  if(isNaN(d)) return "";
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

window.onload = function(){
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    document.getElementById("tanggal").value = `${yyyy}-${mm}-${dd}`;
    showPage('start');
};
