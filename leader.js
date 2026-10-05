import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  initializeFirestore, collection, addDoc, updateDoc, doc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCf1KQq0XmEbAxYzHgl0HLmmeR5FCoOnsE",
  authDomain: "thesis-timeline-9e35c.firebaseapp.com",
  projectId: "thesis-timeline-9e35c",
  storageBucket: "thesis-timeline-9e35c.firebasestorage.app",
  messagingSenderId: "688520146551",
  appId: "1:688520146551:web:4de73a5a221a13d8ae6072",
  measurementId: "G-58ZNYPFDXJ"
};

const CACHE_KEY = "thesisLeaderTasksCacheV1";

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
const tasksRef = collection(db, "tasks");

let tasks = [];

const dialog = document.getElementById("taskDialog");
const form = document.getElementById("taskForm");

const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
})[c]);

const fmt = v => v ? new Date(v + "T00:00:00").toLocaleDateString(undefined, {
  year:"numeric", month:"short", day:"numeric"
}) : "";

const today = () => new Date(new Date().toDateString());

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn("Dashboard cache unavailable", e);
  }
}

function loadCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
    if (Array.isArray(cached) && cached.length) {
      tasks = cached;
      render();
      setConnection("loading", "Showing saved data — syncing latest updates…");
      return true;
    }
  } catch (e) {
    console.warn("Could not read dashboard cache", e);
  }
  return false;
}

function setConnection(state, text) {
  const dot = document.getElementById("connectionDot");
  dot.className = "dot";
  if (state === "connected") dot.classList.add("connected");
  if (state === "error") dot.classList.add("error");
  document.getElementById("connectionText").textContent = text;
}

function render() {
  const q = document.getElementById("searchInput").value.toLowerCase().trim();
  const status = document.getElementById("statusFilter").value;

  const filtered = tasks
    .filter(t => status === "all" || t.status === status)
    .filter(t =>
      String(t.title || "").toLowerCase().includes(q) ||
      String(t.member || "").toLowerCase().includes(q)
    )
    .sort((a,b) => new Date(a.end || 0) - new Date(b.end || 0));

  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("completedTasks").textContent =
    tasks.filter(t => t.status === "Completed").length;
  document.getElementById("progressTasks").textContent =
    tasks.filter(t => t.status === "In Progress").length;
  document.getElementById("overdueTasks").textContent =
    tasks.filter(t => t.status !== "Completed" && t.end &&
      new Date(t.end + "T00:00:00") < today()).length;

  renderMembers();
  renderDeadlines();

  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = filtered.map(t => {
    const p = Math.max(0, Math.min(100, Number(t.progress || 0)));
    const cls = t.status === "Completed" ? "completed" :
                t.status === "Pending" ? "pending" : "";

    return `<tr>
      <td><span class="task-title">${esc(t.title)}</span></td>
      <td>${esc(t.member)}</td>
      <td>${fmt(t.end)}</td>
      <td><span class="badge ${cls}">${esc(t.status)}</span></td>
      <td>
        <div class="small-progress">
          <div class="progress"><div style="width:${p}%"></div></div>
          <span>${p}%</span>
        </div>
      </td>
      <td><button class="edit-btn" data-id="${t.id}">Edit</button></td>
    </tr>`;
  }).join("");

  document.getElementById("emptyTable").classList.toggle("hidden", filtered.length > 0);
  document.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", () => openEdit(btn.dataset.id))
  );
}

function renderMembers() {
  const grouped = {};

  tasks.forEach(t => {
    const member = (t.member || "Unassigned").trim() || "Unassigned";
    grouped[member] ??= { count:0, sum:0, completed:0 };
    grouped[member].count++;
    grouped[member].sum += Number(t.progress || 0);
    if (t.status === "Completed") grouped[member].completed++;
  });

  const entries = Object.entries(grouped).sort((a,b) => a[0].localeCompare(b[0]));

  document.getElementById("memberProgress").innerHTML = entries.length
    ? entries.map(([name,x]) => {
        const avg = Math.round(x.sum / x.count);
        return `<div class="member-row">
          <div class="member-head">
            <strong>${esc(name)}</strong>
            <span>${x.completed}/${x.count} completed · ${avg}%</span>
          </div>
          <div class="progress"><div style="width:${avg}%"></div></div>
        </div>`;
      }).join("")
    : `<div class="empty">No members yet.</div>`;
}

function renderDeadlines() {
  const upcoming = tasks
    .filter(t => t.status !== "Completed" && t.end)
    .sort((a,b) => new Date(a.end) - new Date(b.end))
    .slice(0, 6);

  document.getElementById("deadlines").innerHTML = upcoming.length
    ? upcoming.map(t => {
        const due = new Date(t.end + "T00:00:00");
        const overdue = due < today();

        return `<div class="deadline-item ${overdue ? "overdue" : ""}">
          <strong>${esc(t.title)}</strong>
          <span>${esc(t.member)} · ${overdue ? "Overdue: " : "Due: "}${fmt(t.end)}</span>
        </div>`;
      }).join("")
    : `<div class="empty">No upcoming deadlines.</div>`;
}

function openNew() {
  form.reset();
  document.getElementById("taskId").value = "";
  document.getElementById("taskProgress").value = 0;
  document.getElementById("dialogTitle").textContent = "Add Task";
  dialog.showModal();
}

function openEdit(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  document.getElementById("taskId").value = t.id;
  document.getElementById("taskTitle").value = t.title || "";
  document.getElementById("taskMember").value = t.member || "";
  document.getElementById("startDate").value = t.start || "";
  document.getElementById("endDate").value = t.end || "";
  document.getElementById("taskStatus").value = t.status || "Pending";
  document.getElementById("taskProgress").value = Number(t.progress || 0);
  document.getElementById("taskNotes").value = t.notes || "";
  document.getElementById("dialogTitle").textContent = "Edit Task";
  dialog.showModal();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("taskId").value;
  const data = {
    title: document.getElementById("taskTitle").value.trim(),
    member: document.getElementById("taskMember").value.trim(),
    start: document.getElementById("startDate").value,
    end: document.getElementById("endDate").value,
    status: document.getElementById("taskStatus").value,
    progress: Math.max(0, Math.min(100,
      Number(document.getElementById("taskProgress").value || 0))),
    notes: document.getElementById("taskNotes").value.trim(),
    updatedAt: serverTimestamp()
  };

  if (data.end < data.start) {
    alert("Deadline cannot be earlier than start date.");
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "tasks", id), data);
    } else {
      await addDoc(tasksRef, { ...data, createdAt: serverTimestamp() });
    }
    dialog.close();
  } catch (err) {
    console.error(err);
    alert("Could not save task.");
  }
});

document.getElementById("addTaskBtn").addEventListener("click", openNew);
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
document.getElementById("cancelBtn").addEventListener("click", () => dialog.close());
document.getElementById("searchInput").addEventListener("input", render);
document.getElementById("statusFilter").addEventListener("change", render);

// Show the previous dashboard immediately, then Firebase replaces it with current data.
const hadCache = loadCache();
if (!hadCache) {
  setConnection("loading", "Connecting to Firebase…");
}

const connectionTimeout = setTimeout(() => {
  const text = document.getElementById("connectionText");
  if (text && text.textContent.includes("Connecting")) {
    setConnection("error", "Connection is taking too long — refresh once or check your network");
  }
}, 8000);

onSnapshot(
  tasksRef,
  snapshot => {
    clearTimeout(connectionTimeout);
    tasks = snapshot.docs.map(d => ({ id:d.id, ...d.data() }));
    saveCache();
    setConnection("connected", "Connected — dashboard is up to date");
    render();
  },
  err => {
    clearTimeout(connectionTimeout);
    console.error(err);
    setConnection(
      "error",
      tasks.length
        ? "Offline — showing last saved dashboard data"
        : "Firebase connection failed"
    );
  }
);
