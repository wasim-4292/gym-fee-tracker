const form = document.getElementById("member-form");
const body = document.getElementById("member-body");
const emptyMsg = document.getElementById("empty-message");
const filterButtons = document.querySelectorAll(".filters button");

let members = [];

// ---- Local Storage Helpers ----
function loadMembers() {
  const saved = localStorage.getItem("gymMembers");
  members = saved ? JSON.parse(saved) : [];
}

function saveMembers() {
  localStorage.setItem("gymMembers", JSON.stringify(members));
}

// ---- Status Calculation ----
function getStatus(nextDue) {
  const today = new Date();
  const due = new Date(nextDue);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue"; // date nikal chuki
  if (diffDays <= 3) return "soon";   // 3 din ke andar
  return "ok";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (!dateStr || isNaN(d)) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---- Render ----
function render(filter = "all") {
  body.innerHTML = "";

  let filtered = members;
  if (filter !== "all") {
    filtered = members.filter((m) => getStatus(m.nextDue) === filter);
  }

  if (!filtered.length) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

filtered.forEach((member) => {
  const tr = document.createElement("tr");

  const statusKey = getStatus(member.nextDue);
  const statusText =
    statusKey === "ok"
      ? "Paid / OK"
      : statusKey === "soon"
      ? "Due Soon"
      : "Overdue";

  tr.innerHTML = `
      <td>${member.name}</td>
      <td>${member.phone || "-"}</td>
      <td>₹${member.fee}</td>
      <td>${formatDate(member.nextDue)}</td>
      <td>
        <span class="badge ${statusKey}">${statusText}</span>
      </td>
      <td>
        <button class="action-btn pay" data-id="${member.id}">Mark Paid</button>
        <button class="action-btn delete" data-id="${member.id}">Delete</button>
      </td>
    `;

  body.appendChild(tr);
});
}

// ---- Event: Add Member ----
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const fee = document.getElementById("fee").value;
  const nextDue = document.getElementById("nextDue").value;

  if (!name || !nextDue) return;

  const newMember = {
    id: Date.now(),
    name,
    phone,
    fee: Number(fee),
    nextDue,
  };

  members.push(newMember);
  saveMembers();
  render();

  form.reset();
});

// ---- Event: Actions (Mark Paid / Delete) ----
body.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  // Mark Paid
  if (e.target.classList.contains("pay")) {
    const member = members.find((m) => m.id === Number(id));
    if (!member) return;

    const d = new Date(member.nextDue);
    if (isNaN(d)) return;

    // 1 month aage ka due date
    d.setMonth(d.getMonth() + 1);
    member.nextDue = d.toISOString().slice(0, 10);

    saveMembers();
    render();
  }

  // Delete Member
  if (e.target.classList.contains("delete")) {
    members = members.filter((m) => m.id !== Number(id));
    saveMembers();
    render();
  }
});

// ---- Filters ----
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    render(filter);
  });
});

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  loadMembers();
  render();

  // default: Next due date = today
  const nextDueInput = document.getElementById("nextDue");
  const today = new Date().toISOString().slice(0, 10);
  nextDueInput.value = today;
});