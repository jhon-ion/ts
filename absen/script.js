// ====== URL Google Apps Script Web App Anda ======
// PASTIkan Anda mengganti URL ini dengan URL Web App Anda yang sudah di-deploy.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwTzp4s_reNEp2tdJPqNRPG3bQ18ftQTXd7paTrxn514-hTUj74RFwstQY9mvQcLYg-/exec"; 

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
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        anggotaList = data;
        renderAnggota();
    } catch (error) {
        console.error("Gagal memuat anggota:", error);
        anggotaListEl.innerHTML = "<li>Gagal memuat anggota. Periksa koneksi atau URL skrip.</li>";
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
        const response = await fetch(SCRIPT_URL, { method: "POST", body: formData });
        if (!response.ok) throw new Error('Network response was not ok');
        loadAnggota();
    } catch (error) {
        alert("❌ Gagal memperbarui data anggota: " + error.message);
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
function extractMembers(input, type) {
  let members = [];
  if (!input || !input.trim()) return members;

  if (type === 'mainst' || type === 'izin' || type === 'sakit' || type === 'alfa') {
    members = input.split(",").map(s => s.trim()).filter(Boolean);
  } else if (type === 'odp' || type === 'lainnya') {
    let blocks = input.split(".").map(s => s.trim()).filter(Boolean);
    blocks.forEach(blk => {
      let anggota = blk.replace(/\(.*?\)/g, "").trim().split(",").map(s => s.trim()).filter(Boolean);
      members = members.concat(anggota);
    });
  } else if (type === 'tarik') {
    let blocks = input.split(".").map(s => s.trim()).filter(Boolean);
    blocks.forEach(blk => {
      let parts = blk.split("|");
      if (parts.length > 1) {
        let anggota = parts[1].split(",").map(s => s.trim()).filter(Boolean);
        members = members.concat(anggota);
      }
    });
  }
  return members;
}

function formatAndExtractTeamsPair(input) {
  let members = extractMembers(input, 'mainst');
  let result = "";
  for (let i = 0; i < members.length; i += 2) {
    let p1 = members[i] || "";
    let p2 = members[i + 1] || "";
    result += `Team ${Math.floor(i / 2) + 1}: ${p1}${p2 ? " & " + p2 : ""}\n`;
  }
  return { text: result, members: members };
}

function formatAndExtractOdp(input) {
  let members = extractMembers(input, 'odp');
  let blocks = input.split(".").map(s => s.trim()).filter(Boolean);
  let res = "";
  blocks.forEach((blk, i) => {
    let anggota = blk.split(",").map(s => s.trim()).filter(Boolean).join(", ");
    res += `Tim ODP ${i + 1}: ${anggota}\n`;
  });
  return { text: res, members: members };
}

function formatAndExtractTarik(input) {
  let members = extractMembers(input, 'tarik');
  let blocks = input.split(".").map(s => s.trim()).filter(Boolean);
  let res = "Jadwal tim tarik\n";
  blocks.forEach((blk, i) => {
    let parts = blk.split("|");
    let jarak = (parts[0] || "").trim();
    let anggota = (parts[1] || "").split(",").map(s => s.trim()).filter(Boolean).join(", ");
    res += `Tim Tarik ${i + 1} : Tarikan ${jarak} - ${anggota}\n\n`;
  });
  return { text: res, members: members };
}

function formatAndExtractLainnya(input) {
  let members = extractMembers(input, 'lainnya');
  let blocks = input.split(".").map(s => s.trim()).filter(Boolean);
  let res = "";
  blocks.forEach((blk) => {
    let jenis = blk.match(/\((.*?)\)/);
    let namaPart = blk.replace(/\(.*?\)/g, "").trim();
    let anggota = namaPart.split(",").map(s => s.trim()).filter(Boolean).join(", ");
    if (jenis) {
      res += `${jenis[1]} :\nTeam : ${anggota}\n\n`;
    } else {
      if (anggota) res += `Team : ${anggota}\n\n`;
    }
  });
  return { text: res, members: members };
}

// ====== Pengecekan Anggota Tak Terjadwal dan Invalid ======
function getAttendanceData() {
    const mainstMembers = extractMembers(document.getElementById("mainst").value, 'mainst');
    const odpMembers = extractMembers(document.getElementById("odp").value, 'odp');
    const tarikMembers = extractMembers(document.getElementById("tarik").value, 'tarik');
    const lainnyaMembers = extractMembers(document.getElementById("lainnya").value, 'lainnya');
    const izinMembers = extractMembers(document.getElementById("izin").value, 'izin');
    const sakitMembers = extractMembers(document.getElementById("sakit").value, 'sakit');
    const alfaMembers = extractMembers(document.getElementById("alfa").value, 'alfa');
    
    const allEnteredNames = new Set([...mainstMembers, ...odpMembers, ...tarikMembers, ...lainnyaMembers, ...izinMembers, ...sakitMembers, ...alfaMembers]);

    const invalidNames = Array.from(allEnteredNames).filter(name => !anggotaList.includes(name));
    const unscheduledMembers = anggotaList.filter(anggota => !allEnteredNames.has(anggota));

    return { allEnteredNames, invalidNames, unscheduledMembers };
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

// ====== Preview laporan ======
function generate(){
  const tanggal = formatTanggal(document.getElementById("tanggal").value || "");
  const { invalidNames } = getAttendanceData();
  
  if (invalidNames.length > 0) {
      alert(`⚠️ Gagal membuat preview! Nama berikut tidak terdaftar dalam database anggota:\n${invalidNames.join("\n")}`);
      return;
  }
  
  const mainstText = formatAndExtractTeamsPair(document.getElementById("mainst").value).text;
  const odpText = formatAndExtractOdp(document.getElementById("odp").value).text;
  const tarikText = formatAndExtractTarik(document.getElementById("tarik").value).text;
  const lainnyaText = formatAndExtractLainnya(document.getElementById("lainnya").value).text;
  const izin = document.getElementById("izin").value.trim();
  const sakit = document.getElementById("sakit").value.trim();
  const alfa = document.getElementById("alfa").value.trim();

  renderUnscheduledMembers();

  let laporan = `Tanggal : ${tanggal}\n\n`;
  if(mainstText) laporan += `Maintenance & Instalasi\n${mainstText}\n`;
  if(odpText) laporan += `ODP\n${odpText}\n`;
  if(tarikText) laporan += `Tarikan\n${tarikText}\n`;
  if(lainnyaText) laporan += `Kerjaan Lainnya\n${lainnyaText}\n`;
  if(izin) laporan += `Izin : ${izin}\n`;
  if(sakit) laporan += `Sakit : ${sakit}\n`;
  if(alfa) laporan += `Alfa : ${alfa}\n`;

  document.getElementById("preview").innerText = laporan;
  document.getElementById("actions").style.display = "flex";
}

// ====== Simpan ke Google Sheet ======
function saveToSheet(){
  const tanggal = document.getElementById("tanggal").value;
  if(!tanggal){
    alert("Tanggal belum diisi!");
    return;
  }
    
  const { invalidNames } = getAttendanceData();
  if (invalidNames.length > 0) {
      alert(`⚠️ Absen gagal dikirim! Nama berikut tidak terdaftar dalam database anggota:\n${invalidNames.join("\n")}`);
      return;
  }

  const mainst = formatAndExtractTeamsPair(document.getElementById("mainst").value).text;
  const odp = formatAndExtractOdp(document.getElementById("odp").value).text;
  const tarik = formatAndExtractTarik(document.getElementById("tarik").value).text;
  const lainnya = formatAndExtractLainnya(document.getElementById("lainnya").value).text;
  const izin = document.getElementById("izin").value.trim();
  const sakit = document.getElementById("sakit").value.trim();
  const alfa = document.getElementById("alfa").value.trim();

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
    .catch(err => alert("❌ Gagal simpan: " + err.message));
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
  const mm = String(today.getMonth()+1).padStart(2,"0");
  const dd = String(today.getDate()).padStart(2,"0");
  document.getElementById("tanggal").value = `${yyyy}-${mm}-${dd}`;
  showPage('start');
};
