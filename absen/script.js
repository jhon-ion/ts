// ====== Helpers ======
function formatTanggal(inputDate){
  if (!inputDate) return "";
  const bulan=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const hari=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  let d=new Date(inputDate);
  if(isNaN(d)) return "";
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// ====== Preview laporan ======
function generate(){
  const tanggal = formatTanggal(document.getElementById("tanggal").value || "");
  const mainst = (document.getElementById("mainst").value || "").trim();
  const odp = (document.getElementById("odp").value || "").trim();
  const tarik = (document.getElementById("tarik").value || "").trim();
  const lainnya = (document.getElementById("lainnya").value || "").trim();
  const izin = (document.getElementById("izin").value || "").trim();
  const sakit = (document.getElementById("sakit").value || "").trim();
  const alfa = (document.getElementById("alfa").value || "").trim();

  let laporan = `Tanggal : ${tanggal}\n\n`;
  if(mainst) laporan += `Maintenance & Instalasi\n${mainst}\n\n`;
  if(odp) laporan += `ODP\n${odp}\n\n`;
  if(tarik) laporan += `Tarikan\n${tarik}\n\n`;
  if(lainnya) laporan += `Kerjaan Lainnya\n${lainnya}\n\n`;
  if(izin) laporan += `Izin : ${izin}\n`;
  if(sakit) laporan += `Sakit : ${sakit}\n`;
  if(alfa) laporan += `Alfa : ${alfa}\n`;

  document.getElementById("preview").innerText = laporan;
  document.getElementById("actions").style.display = "flex";
}

// ====== Simpan ke Google Sheet ======
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmQCLU2mTC45jVEOfyO1XUhUxnanQwQzhtQWkXp-1cRNVByv0i809jwClp8geBbBgj/exec"; // ganti dengan URL Web App kamu

function saveToSheet(){
  const tanggal = document.getElementById("tanggal").value;
  const mainst = document.getElementById("mainst").value;
  const odp = document.getElementById("odp").value;
  const tarik = document.getElementById("tarik").value;
  const lainnya = document.getElementById("lainnya").value;
  const izin = document.getElementById("izin").value;
  const sakit = document.getElementById("sakit").value;
  const alfa = document.getElementById("alfa").value;

  if(!tanggal){
    alert("Tanggal belum diisi!");
    return;
  }

  const formData = new FormData();
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
    .then(txt => alert("✅ Data berhasil disimpan ke Google Sheet"))
    .catch(err => alert("❌ Gagal simpan: " + err));
}

// ====== Actions ======
function copyText(){
  const txt = document.getElementById("preview").innerText;
  if(!txt.trim()) return alert("Belum ada laporan untuk disalin.");
  navigator.clipboard.writeText(txt).then(()=> alert("Laporan disalin!"));
}

function clearPreview(){
  document.getElementById("preview").innerText = "";
  document.getElementById("actions").style.display = "none";
}

// ====== Default tanggal ======
window.onload = function(){
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,"0");
  const dd = String(today.getDate()).padStart(2,"0");
  document.getElementById("tanggal").value = `${yyyy}-${mm}-${dd}`;
};
    
