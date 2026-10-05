import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tasksRef = collection(db, "tasks");

let tasks = [];

const timeline = document.getElementById("timeline");
const emptyState = document.getElementById("emptyState");
const dialog = document.getElementById("taskDialog");
const form = document.getElementById("taskForm");
const deleteBtn = document.getElementById("deleteTaskBtn");
const connectionDot = document.getElementById("connectionDot");
const connectionText = document.getElementById("connectionText");

function formatDate(value) {
  if (!value) return "";
  return new Date(value + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric"
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[c]);
}

function render() {
  const search = document.getElementById("searchInput").value.toLowerCase().trim();
  const status = document.getElementById("statusFilter").value;

  const filtered = tasks
    .filter(t => status === "all" || t.status === status)
    .filter(t =>
      String(t.title || "").toLowerCase().includes(search) ||
      String(t.member || "").toLowerCase().includes(search)
    )
    .sort((a, b) => new Date(a.start || 0) - new Date(b.start || 0));

  timeline.innerHTML = filtered.map(t => {
    const badgeClass = t.status === "Completed" ? "completed" :
                       t.status === "Pending" ? "pending" : "";
    const progress = Math.max(0, Math.min(100, Number(t.progress || 0)));

    return `
      <article class="timeline-item" data-id="${t.id}">
        <div class="item-top">
          <div>
            <h3>${escapeHtml(t.title)}</h3>
            <div class="meta">
              ${formatDate(t.start)} → ${formatDate(t.end)} · ${escapeHtml(t.member)}
            </div>
          </div>
          <span class="badge ${badgeClass}">${escapeHtml(t.status)}</span>
        </div>
        <div class="progress-row">
          <div class="progress"><div style="width:${progress}%"></div></div>
          <strong>${progress}%</strong>
        </div>
        ${t.notes ? `<p class="notes">${escapeHtml(t.notes)}</p>` : ""}
      </article>
    `;
  }).join("");

  emptyState.classList.toggle("hidden", filtered.length > 0);

  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("completedTasks").textContent =
    tasks.filter(t => t.status === "Completed").length;
  document.getElementById("progressTasks").textContent =
    tasks.filter(t => t.status === "In Progress").length;
  document.getElementById("pendingTasks").textContent =
    tasks.filter(t => t.status === "Pending").length;

  document.querySelectorAll(".timeline-item").forEach(item => {
    item.addEventListener("click", () => openEdit(item.dataset.id));
  });
}

function setConnection(state, message) {
  connectionText.textContent = message;
  connectionDot.className = "dot";
  if (state === "connected") connectionDot.classList.add("connected");
  if (state === "error") connectionDot.classList.add("error");
}

function openNew() {
  form.reset();
  document.getElementById("taskId").value = "";
  document.getElementById("taskProgress").value = 0;
  document.getElementById("dialogTitle").textContent = "Add Task";
  deleteBtn.classList.add("hidden");
  dialog.showModal();
}

function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById("taskId").value = task.id;
  document.getElementById("taskTitle").value = task.title || "";
  document.getElementById("taskMember").value = task.member || "";
  document.getElementById("startDate").value = task.start || "";
  document.getElementById("endDate").value = task.end || "";
  document.getElementById("taskStatus").value = task.status || "Pending";
  document.getElementById("taskProgress").value = Number(task.progress || 0);
  document.getElementById("taskNotes").value = task.notes || "";
  document.getElementById("dialogTitle").textContent = "Edit Task";
  deleteBtn.classList.remove("hidden");
  dialog.showModal();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("taskId").value;
  const task = {
    title: document.getElementById("taskTitle").value.trim(),
    member: document.getElementById("taskMember").value.trim(),
    start: document.getElementById("startDate").value,
    end: document.getElementById("endDate").value,
    status: document.getElementById("taskStatus").value,
    progress: Math.max(0, Math.min(100, Number(document.getElementById("taskProgress").value || 0))),
    notes: document.getElementById("taskNotes").value.trim(),
    updatedAt: serverTimestamp()
  };

  if (task.end < task.start) {
    alert("Deadline cannot be earlier than the start date.");
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "tasks", id), task);
    } else {
      await addDoc(tasksRef, {
        ...task,
        createdAt: serverTimestamp()
      });
    }
    dialog.close();
  } catch (error) {
    console.error(error);
    alert("Could not save the task. Check Firestore and its security rules.");
  }
});

deleteBtn.addEventListener("click", async () => {
  const id = document.getElementById("taskId").value;
  if (!id) return;

  if (confirm("Delete this task?")) {
    try {
      await deleteDoc(doc(db, "tasks", id));
      dialog.close();
    } catch (error) {
      console.error(error);
      alert("Could not delete the task. Check Firestore and its security rules.");
    }
  }
});

document.getElementById("addTaskBtn").addEventListener("click", openNew);
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
document.getElementById("cancelBtn").addEventListener("click", () => dialog.close());
document.getElementById("searchInput").addEventListener("input", render);
document.getElementById("statusFilter").addEventListener("change", render);

onSnapshot(
  tasksRef,
  (snapshot) => {
    tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setConnection("connected", "Connected — timeline updates in real time");
    render();
  },
  (error) => {
    console.error(error);
    setConnection("error", "Firebase connection failed — check Firestore setup and rules");
    timeline.innerHTML = "";
    emptyState.classList.remove("hidden");
    emptyState.innerHTML = `
      <h3>Cannot load tasks</h3>
      <p>Open Firebase → Firestore Database and check that the database exists and allows access.</p>
    `;
  }
);
