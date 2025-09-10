// ====== Format Tanggal ======
function formatTanggal(inputDate){
  if (!inputDate) return "";
  const bulan=["Januari","Februari","Maret","April","Mei","Juni",
               "Juli","Agustus","September","Oktober","November","Desember"];
  const hari=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  let d=new Date(inputDate);
  if(isNaN(d)) return "";
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// ====== Format Maintenance (pair 2 per tim) ======
function formatTeamsPair(input){
  if (!input || !input.trim()) return "";
  let toks = input.split(",").map(s=>s.trim()).filter(Boolean);
  let result="";
  for(let i=0;i<toks.length;i+=2){
    let p1 = toks[i] || "";
    let p2 = toks[i+1] || "";
    result += `Team ${Math.floor(i/2)+1}: ${p1}${p2? " & " + p2 : ""}\n`;
  }
  return result;
}

// ====== Format ODP (pisah pakai titik untuk tim baru) ======
function formatOdp(input){
  if (!input || !input.trim()) return "";
  let blocks = input.split(".").map(s=>s.trim()).filter(Boolean);
  let res = "";
  blocks.forEach((blk,i)=>{
    let anggota = blk.split(",").map(s=>s.trim()).filter(Boolean).join(", ");
    res += `Tim ODP ${i+1}: ${anggota}\n`;
  });
  return res;
}

// ====== Format Tarikan ======
function formatTarik(input){
  if (!input || !input.trim()) return "";
  let blocks = input.split(".").map(s=>s.trim()).filter(Boolean);
  let res = "Jadwal tim tarik\n";
  blocks.forEach((blk,i)=>{
    let parts = blk.split("|");
    let jarak = (parts[0]||"").trim();
    let anggota = (parts[1]||"").split(",").map(s=>s.trim()).filter(Boolean).join(", ");
    res += `Tim Tarik ${i+1} : Tarikan ${jarak} - ${anggota}\n\n`;
  });
  return res;
}

// ====== Format Kerjaan Lainnya ======
function formatLainnya(input){
  if (!input || !input.trim()) return "";
  let blocks = input.split(".").map(s=>s.trim()).filter(Boolean);
  let res = "";
  blocks.forEach((blk)=>{
    let jenis = blk.match(/\((.*?)\)/);
    let namaPart = blk.replace(/\(.*?\)/g,"").trim();
    let anggota = namaPart.split(",").map(s=>s.trim()).filter(Boolean).join(", ");
    if (jenis){
      res += `${jenis[1]} :\nTeam : ${anggota}\n\n`;
    } else {
      if(anggota) res += `Team : ${anggota}\n\n`;
    }
  });
  return res;
}

// ====== Preview laporan ======
function generate(){
  const tanggal = formatTanggal(document.getElementById("tanggal").value || "");
  const mainstText = formatTeamsPair(document.getElementById("mainst").value || "");
  const odpText = formatOdp(document.getElementById("odp").value || "");
  const tarikText = formatTarik(document.getElementById("tarik").value || "");
  const lainnyaText = formatLainnya(document.getElementById("lainnya").value || "");
  const izin = (document.getElementById("izin").value || "").trim();
  const sakit = (document.getElementById("sakit").value || "").trim();
  const alfa = (document.getElementById("alfa").value || "").trim();

  let laporan = `Tanggal : ${tanggal}\n\n`;
  if(mainstText) laporan += `Maintenance & Instalasi\n${mainstText}\n`;
  if(odpText) laporan += `ODP\n${odpText}\n`;
  if(tarikText) laporan += `${tarikText}\n`;
  if(lainnyaText) laporan += `Kerjaan Lainnya\n${lainnyaText}\n`;
  if(izin) laporan += `Izin : ${izin}\n`;
  if(sakit) laporan += `Sakit : ${sakit}\n`;
  if(alfa) laporan += `Alfa : ${alfa}\n`;

  document.getElementById("preview").innerText = laporan;
  document.getElementById("actions").style.display = "flex";
}

// ====== Simpan ke Google Sheet ======
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmQCLU2mTC45jVEOfyO1XUhUxnanQwQzhtQWkXp-1cRNVByv0i809jwClp8geBbBgj/exec"; 

function saveToSheet(){
  const tanggal = document.getElementById("tanggal").value;
  if(!tanggal){
    alert("Tanggal belum diisi!");
    return;
  }

  const mainst = formatTeamsPair(document.getElementById("mainst").value || "");
  const odp = formatOdp(document.getElementById("odp").value || "");
  const tarik = formatTarik(document.getElementById("tarik").value || "");
  const lainnya = formatLainnya(document.getElementById("lainnya").value || "");
  const izin = (document.getElementById("izin").value || "").trim();
  const sakit = (document.getElementById("sakit").value || "").trim();
  const alfa = (document.getElementById("alfa").value || "").trim();

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
    .then(txt => {
      alert("✅ Absen Selesai");
      document.getElementById("waBtn").style.display = "inline-block";
    })
    .catch(err => alert("❌ Gagal simpan: " + err));
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
  document.getElementById("waBtn").style.display = "none";
}

// ====== Default tanggal ======
window.onload = function(){
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,"0");
  const dd = String(today.getDate()).padStart(2,"0");
  document.getElementById("tanggal").value = `${yyyy}-${mm}-${dd}`;
};
  
