import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCf1KQq0XmEbAxYzHgl0HLmmeR5FCoOnsE",
  authDomain: "thesis-timeline-9e35c.firebaseapp.com",
  projectId: "thesis-timeline-9e35c",
  storageBucket: "thesis-timeline-9e35c.firebasestorage.app",
  messagingSenderId: "688520146551",
  appId: "1:688520146551:web:4de73a5a221a13d8ae6072",
  measurementId: "G-58ZNYPFDXJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tasksRef = collection(db, "tasks");
let tasks = [];

const timeline = document.getElementById("timeline");
const emptyState = document.getElementById("emptyState");
const dialog = document.getElementById("viewDialog");

const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
const fmt = v => v ? new Date(v+"T00:00:00").toLocaleDateString(undefined, {year:"numeric",month:"short",day:"numeric"}) : "";

function render(){
  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  const status = document.getElementById("statusFilter").value;
  const filtered = tasks.filter(t => status==="all" || t.status===status)
    .filter(t => String(t.title||"").toLowerCase().includes(q) || String(t.member||"").toLowerCase().includes(q))
    .sort((a,b)=>new Date(a.start||0)-new Date(b.start||0));

  timeline.innerHTML = filtered.map(t => {
    const p = Math.max(0,Math.min(100,Number(t.progress||0)));
    const cls = t.status==="Completed"?"completed":t.status==="Pending"?"pending":"";
    return `<article class="timeline-item" data-id="${t.id}">
      <div class="item-top">
        <div><h3>${esc(t.title)}</h3><div class="meta">${fmt(t.start)} → ${fmt(t.end)} · ${esc(t.member)}</div></div>
        <span class="badge ${cls}">${esc(t.status)}</span>
      </div>
      <div class="progress-row"><div class="progress"><div style="width:${p}%"></div></div><strong>${p}%</strong></div>
      ${t.notes?`<p class="notes">${esc(t.notes)}</p>`:""}
    </article>`;
  }).join("");

  emptyState.classList.toggle("hidden", filtered.length>0);
  document.querySelectorAll(".timeline-item").forEach(el=>el.addEventListener("click",()=>showTask(el.dataset.id)));
}

function showTask(id){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  document.getElementById("viewTitle").textContent=t.title||"Task";
  document.getElementById("viewContent").innerHTML = `
    <div class="detail-grid">
      <div class="detail"><span>Assigned to</span><strong>${esc(t.member)}</strong></div>
      <div class="detail"><span>Status</span><strong>${esc(t.status)}</strong></div>
      <div class="detail"><span>Start</span><strong>${fmt(t.start)}</strong></div>
      <div class="detail"><span>Deadline</span><strong>${fmt(t.end)}</strong></div>
      <div class="detail"><span>Progress</span><strong>${Number(t.progress||0)}%</strong></div>
    </div>
    ${t.notes?`<p class="notes"><strong>Notes:</strong> ${esc(t.notes)}</p>`:""}`;
  dialog.showModal();
}

document.getElementById("closeView").addEventListener("click",()=>dialog.close());
document.getElementById("searchInput").addEventListener("input",render);
document.getElementById("statusFilter").addEventListener("change",render);

onSnapshot(tasksRef, snap=>{
  tasks=snap.docs.map(d=>({id:d.id,...d.data()}));
  document.getElementById("connectionDot").className="dot connected";
  document.getElementById("connectionText").textContent="Connected — timeline updates in real time";
  render();
}, err=>{
  console.error(err);
  document.getElementById("connectionDot").className="dot error";
  document.getElementById("connectionText").textContent="Connection failed";
});
