// ====== MASTER DATA ======
const masterList = [
  "Hendrik","Naufal","Ridwan","M Ridho","Gugun","Ricky","Doni","Latif","Hapid",
  "Firman","Harys","Syaiful","Ramdan","Adrian","Gelar","Taupik","Sahid","Ridho",
  "Gito","Handika","Alvin","Hendryana","Adsa","Komarudin"
];

// alias map (opsional)
const aliasMap = {
  "mrido":"M Ridho",
  "mridho":"M Ridho",
  "ridho":"Ridho",
  "komeng":"Komarudin",
  "herdyana":"Hendryana"
};

function normalizeName(n){ return (n||"").trim().replace(/\s+/g,' ').toLowerCase(); }
function keyName(n){ return (n||"").toLowerCase().replace(/[^a-z]/g,''); }

// fuzzy (levenshtein)
function levenshtein(a,b){
  const m=a.length,n=b.length;
  const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  }
  return dp[m][n];
}

function resolveName(raw){
  if(!raw) return null;
  const norm = normalizeName(raw);
  const lowerMaster = masterList.map(x=>x.toLowerCase());
  const exactIdx = lowerMaster.indexOf(norm);
  if (exactIdx !== -1) return masterList[exactIdx];
  const k = keyName(norm);
  if (aliasMap[k]) return aliasMap[k];
  let best = {name:null, d:2};
  for (const m of masterList){
    const d = levenshtein(keyName(norm), keyName(m.toLowerCase()));
    if (d < best.d){ best = {name:m, d}; if (d===0) break; }
  }
  if (best.name && best.d <= 1) return best.name;
  return null;
}

// bersihkan token: buang teks (
function cleanToken(t){
  return (t||"").replace(/\(.*?\)/g,"").trim();
}

// format tanggal
function formatTanggal(inputDate){
  if (!inputDate) return "";
  const bulan=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const hari=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  let d=new Date(inputDate);
  if(isNaN(d)) return "";
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// Format Maintenance & Instalasi (pairing 2 per team)
function formatTeamsPair(input){
  if (!input || !input.trim()) return "";
  let toks = input.split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean);
  let result="";
  for(let i=0;i<toks.length;i+=2){
    let p1 = resolveName(toks[i]) || toks[i];
    let p2 = resolveName(toks[i+1]) || "";
    result += `Team ${Math.floor(i/2)+1}: ${p1}${p2? " & " + p2 : ""}\n`;
  }
  return result;
}

// Format ODP
function formatOdp(input){
  if (!input || !input.trim()) return "";
  let blocks = input.split(".").map(s=>s.trim()).filter(Boolean);
  let res = "";
  blocks.forEach((blk,i)=>{
    let anggota = blk.split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).join(", ");
    res += `Tim ODP ${i+1}: ${anggota}\n`;
  });
  return res;
}

// Format Tarik (sesuai permintaan)
function formatTarik(input){
  if (!input || !input.trim()) return "";
  let blocks = input.split(".").map(s=>s.trim()).filter(Boolean);
  let res = "Jadwal tim tarik\n";
  blocks.forEach((blk,i)=>{
    let parts = blk.split("|");
    let jarak = (parts[0]||"").trim();
    let anggota = (parts[1]||"").split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).join(", ");
    res += `Tim Tarik ${i+1} : Tarikan ${jarak} - ${anggota}\n\n`;
  });
  return res;
}

// Format Kerjaan Lainnya (support (Jenis) Nama, Nama)
function formatLainnya(input){
  if (!input || !input.trim()) return "";
  let blocks = input.split(".").map(s=>s.trim()).filter(Boolean);
  let res = "";
  blocks.forEach((blk)=>{
    let jenis = blk.match(/\((.*?)\)/);
    let namaPart = blk.replace(/\(.*?\)/g,"").trim();
    let anggota = namaPart.split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).join(", ");
    if (jenis){
      res += `${jenis[1]} :\nTeam : ${anggota}\n\n`;
    } else {
      if(anggota) res += `Team : ${anggota}\n\n`;
    }
  });
  return res;
}

// Kumpulkan nama (unik) + unknown (untuk alert)
function collectAllNames({withAlert=false} = {}){
  const agg = { names: [], unknown: [] };
  const fields = ["mainst","odp","tarik","lainnya","izin","sakit","alfa"];

  fields.forEach(id=>{
    let val = (document.getElementById(id) || {value:""}).value;
    if(!val) return;

    if(id === "tarik"){
      // setiap blok: "jarak | nama,nama"
      val.split(".").map(b=>b.trim()).filter(Boolean).forEach(b=>{
        let parts = b.split("|");
        if(parts[1]){
          parts[1].split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
            // cek token bukan km (shouldn't be but be safe)
            if (/^\d+[.,]?\d*\s*km$/i.test(tok)) return;
            const r = resolveName(tok);
            if(r) agg.names.push(r); else if(/[a-zA-Z]/.test(tok)) agg.unknown.push(tok);
          });
        }
      });
    } else if(id === "lainnya"){
      // nama sebelum (jenis)
      val.split(".").map(b=>b.trim()).filter(Boolean).forEach(b=>{
        let namePart = b.replace(/\(.*?\)/g,"").trim();
        namePart.split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
          if(/^\d+[.,]?\d*\s*km$/i.test(tok)) return;
          const r = resolveName(tok);
          if(r) agg.names.push(r); else if(/[a-zA-Z]/.test(tok)) agg.unknown.push(tok);
        });
      });
    } else {
      // mainst, odp, izin, sakit, alfa
      // split by '.' and ',' and newline
      val.split(/[.,\n]/).map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
        if(/^\d+[.,]?\d*\s*km$/i.test(tok)) return;
        const r = resolveName(tok);
        if(r) agg.names.push(r); else if(/[a-zA-Z]/.test(tok)) agg.unknown.push(tok);
      });
    }
  });

  // unikkan berdasarkan keyName
  const seen = new Set();
  const unique = [];
  agg.names.forEach(n=>{
    const k = keyName(n);
    if(!seen.has(k)){ seen.add(k); unique.push(n); }
  });
  agg.names = unique;

  // filter unknown yang hanya text
  agg.unknown = [...new Set(agg.unknown.filter(t=>/[a-zA-Z]/.test(t)))];

  if(withAlert && agg.unknown.length){
    alert("⚠️ Nama tidak dikenali: " + agg.unknown.join(", "));
  }
  return agg;
}

// kumpulkan occurrences (bukan unik) untuk mendeteksi double job
function gatherOccurrences(){
  const occ = [];
  // mainst
  (document.getElementById("mainst").value || "").split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
    if(/^\d+[.,]?\d*\s*km$/i.test(tok)) return;
    const r = resolveName(tok);
    if(r) occ.push(r);
  });
  // odp
  (document.getElementById("odp").value || "").split(".").map(b=>b.trim()).filter(Boolean).forEach(b=>{
    b.split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
      if(/^\d+[.,]?\d*\s*km$/i.test(tok)) return;
      const r = resolveName(tok); if(r) occ.push(r);
    });
  });
  // tarik
  (document.getElementById("tarik").value || "").split(".").map(b=>b.trim()).filter(Boolean).forEach(b=>{
    let parts=b.split("|");
    if(parts[1]){
      parts[1].split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
        if(/^\d+[.,]?\d*\s*km$/i.test(tok)) return;
        const r = resolveName(tok); if(r) occ.push(r);
      });
    }
  });
  // lainnya
  (document.getElementById("lainnya").value || "").split(".").map(b=>b.trim()).filter(Boolean).forEach(b=>{
    let namePart = b.replace(/\(.*?\)/g,"").trim();
    namePart.split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
      if(/^\d+[.,]?\d*\s*km$/i.test(tok)) return;
      const r = resolveName(tok); if(r) occ.push(r);
    });
  });
  // izin, sakit, alfa (comma separated)
  ["izin","sakit","alfa"].forEach(id=>{
    (document.getElementById(id).value || "").split(",").map(s=>cleanToken(s)).map(s=>s.trim()).filter(Boolean).forEach(tok=>{
      if(/^\d+[.,]?\d*\s*km$/i.test(tok)) return;
      const r = resolveName(tok); if(r) occ.push(r);
    });
  });
  return occ;
}

// ====== Generate laporan ======
function generate(){
  const tanggal = formatTanggal(document.getElementById("tanggal").value || "");

  const mainstText = formatTeamsPair(document.getElementById("mainst").value || "");
  const odpText = formatOdp(document.getElementById("odp").value || "");
  const tarikText = formatTarik(document.getElementById("tarik").value || "");
  const lainnyaText = formatLainnya(document.getElementById("lainnya").value || "");
  const izin = (document.getElementById("izin").value || "").trim();
  const sakit = (document.getElementById("sakit").value || "").trim();
  const alfa = (document.getElementById("alfa").value || "").trim();

  // 1) validasi & unknown (alert)
  const agg = collectAllNames({withAlert:false});
  if(agg.unknown.length){
    alert("⚠️ Nama tidak dikenali: " + agg.unknown.join(", "));
    // continue nonetheless
  }

  // 2) detect double job (appearance count across all fields)
  const occ = gatherOccurrences();
  const counts = {};
  occ.forEach(n => counts[n] = (counts[n]||0)+1);
  const doubles = Object.entries(counts).filter(([_,c])=>c>1).map(([n])=>n);

  // 3) compose laporan
  let laporan = `Tanggal : ${tanggal}\n\n`;
  if(mainstText) laporan += `Maintenance & Instalasi\n${mainstText}\n`;
  if(odpText) laporan += `ODP\n${odpText}\n`;
  if(tarikText) laporan += `${tarikText}\n`;
  if(lainnyaText) laporan += `Kerjaan Lainnya\n${lainnyaText}\n`;
  if(izin) laporan += `Izin : ${izin}\n`;
  if(sakit) laporan += `Sakit : ${sakit}\n`;
  if(alfa) laporan += `Alfa : ${alfa}\n`;

  // 4) siapa yang belum ada jadwal (berdasarkan unique resolved names)
  const presentKeys = new Set(agg.names.map(n => keyName(n)));
  const belum = masterList.filter(nm => !presentKeys.has(keyName(nm)));
  if(belum.length){
    laporan += `\n📌 Tidak ada jadwal 📌\n${belum.join(", ")}\n`;
  }

  // 5) tampilkan double job di laporan (jika ada)
  if(doubles.length){
    laporan += `\n⚠️ Double Job ⚠️\n${doubles.join(", ")}\n`;
  }

  document.getElementById("preview").innerText = laporan;
  document.getElementById("actions").style.display = "flex";
}

// ====== Actions ======
function copyText(){
  const txt = document.getElementById("preview").innerText;
  navigator.clipboard.writeText(txt).then(()=> alert("Laporan disalin!"));
}
function sendWA(){
  const txt = document.getElementById("preview").innerText;
  if(!txt.trim()) return alert("Belum ada laporan untuk dikirim.");
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
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
        
