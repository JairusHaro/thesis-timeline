const STORAGE_KEY = "thesisTimelineTasks";

const sampleTasks = [
  {
    id: crypto.randomUUID(),
    title: "Finalize Chapter 1",
    member: "Member 1",
    start: "2026-10-05",
    end: "2026-10-09",
    status: "In Progress",
    progress: 60,
    notes: "Review background, objectives, and scope."
  },
  {
    id: crypto.randomUUID(),
    title: "Complete Related Literature",
    member: "Member 2",
    start: "2026-10-08",
    end: "2026-10-15",
    status: "Pending",
    progress: 20,
    notes: "Add recent references and verify citations."
  },
  {
    id: crypto.randomUUID(),
    title: "System Prototype Testing",
    member: "Member 3",
    start: "2026-10-16",
    end: "2026-10-22",
    status: "Pending",
    progress: 0,
    notes: "Prepare test cases and record results."
  }
];

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || sampleTasks;

const timeline = document.getElementById("timeline");
const emptyState = document.getElementById("emptyState");
const dialog = document.getElementById("taskDialog");
const form = document.getElementById("taskForm");
const deleteBtn = document.getElementById("deleteTaskBtn");

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(value) {
  return new Date(value + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric"
  });
}

function render() {
  const search = document.getElementById("searchInput").value.toLowerCase().trim();
  const status = document.getElementById("statusFilter").value;

  const filtered = tasks
    .filter(t => status === "all" || t.status === status)
    .filter(t =>
      t.title.toLowerCase().includes(search) ||
      t.member.toLowerCase().includes(search)
    )
    .sort((a,b) => new Date(a.start) - new Date(b.start));

  timeline.innerHTML = filtered.map(t => {
    const badgeClass = t.status === "Completed" ? "completed" :
                       t.status === "Pending" ? "pending" : "";
    return `
      <article class="timeline-item" data-id="${t.id}">
        <div class="item-top">
          <div>
            <h3>${escapeHtml(t.title)}</h3>
            <div class="meta">
              ${formatDate(t.start)} → ${formatDate(t.end)} · ${escapeHtml(t.member)}
            </div>
          </div>
          <span class="badge ${badgeClass}">${t.status}</span>
        </div>
        <div class="progress-row">
          <div class="progress"><div style="width:${Number(t.progress)}%"></div></div>
          <strong>${Number(t.progress)}%</strong>
        </div>
        ${t.notes ? `<p class="notes">${escapeHtml(t.notes)}</p>` : ""}
      </article>
    `;
  }).join("");

  emptyState.classList.toggle("hidden", filtered.length > 0);

  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("completedTasks").textContent = tasks.filter(t => t.status === "Completed").length;
  document.getElementById("progressTasks").textContent = tasks.filter(t => t.status === "In Progress").length;
  document.getElementById("pendingTasks").textContent = tasks.filter(t => t.status === "Pending").length;

  document.querySelectorAll(".timeline-item").forEach(item => {
    item.addEventListener("click", () => openEdit(item.dataset.id));
  });
}

function escapeHtml(value="") {
  return value.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[c]);
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
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskMember").value = task.member;
  document.getElementById("startDate").value = task.start;
  document.getElementById("endDate").value = task.end;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskProgress").value = task.progress;
  document.getElementById("taskNotes").value = task.notes || "";
  document.getElementById("dialogTitle").textContent = "Edit Task";
  deleteBtn.classList.remove("hidden");
  dialog.showModal();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("taskId").value;
  const task = {
    id: id || crypto.randomUUID(),
    title: document.getElementById("taskTitle").value.trim(),
    member: document.getElementById("taskMember").value.trim(),
    start: document.getElementById("startDate").value,
    end: document.getElementById("endDate").value,
    status: document.getElementById("taskStatus").value,
    progress: Math.max(0, Math.min(100, Number(document.getElementById("taskProgress").value || 0))),
    notes: document.getElementById("taskNotes").value.trim()
  };

  if (task.end < task.start) {
    alert("Deadline cannot be earlier than the start date.");
    return;
  }

  const existing = tasks.findIndex(t => t.id === id);
  if (existing >= 0) tasks[existing] = task;
  else tasks.push(task);

  saveTasks();
  render();
  dialog.close();
});

deleteBtn.addEventListener("click", () => {
  const id = document.getElementById("taskId").value;
  if (!id) return;
  if (confirm("Delete this task?")) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
    dialog.close();
  }
});

document.getElementById("addTaskBtn").addEventListener("click", openNew);
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
document.getElementById("cancelBtn").addEventListener("click", () => dialog.close());
document.getElementById("searchInput").addEventListener("input", render);
document.getElementById("statusFilter").addEventListener("change", render);

render();
