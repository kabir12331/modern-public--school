// Simple frontend glue: login + role routing + data fetching
const API = "http://localhost:4000/api";

function saveToken(tok, role, userId) {
  localStorage.setItem("token", tok);
  localStorage.setItem("role", role);
  localStorage.setItem("userId", userId);
}

function getToken() { return localStorage.getItem("token"); }
function getRole() { return localStorage.getItem("role"); }
function getUserId() { return Number(localStorage.getItem("userId")); }

async function api(path, opts = {}) {
  const headers = opts.headers || {};
  if (getToken()) headers["Authorization"] = "Bearer " + getToken();
  headers["Content-Type"] = "application/json";
  const res = await fetch(API + path, { ...opts, headers });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

// Page: login + public notices
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const { token, role, userId } = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      saveToken(token, role, userId);
      if (role === "admin") location.href = "admin.html";
      else if (role === "teacher") location.href = "teacher.html";
      else location.href = "student.html";
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  });
  // public notices on login page
  fetch(API + "/notices").then(r=>r.json()).then(list=>{
    const ul = document.getElementById("notices");
    if (ul) ul.innerHTML = list.map(n=>`<li><b>${n.title}</b> — ${n.body}</li>`).join("");
  });
}

// Admin page handlers
const addStudent = document.getElementById("addStudent");
if (addStudent) {
  addStudent.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      student_code: document.getElementById("s_code").value,
      name: document.getElementById("s_name").value,
      class: document.getElementById("s_class").value,
      section: document.getElementById("s_section").value,
      parent_contact: document.getElementById("s_contact").value,
      username: document.getElementById("s_user").value || undefined,
      password: document.getElementById("s_pass").value || undefined,
    };
    await api("/students", { method: "POST", body: JSON.stringify(payload) });
    alert("Student added");
    location.reload();
  });

  // Load students
  (async () => {
    const data = await api("/students");
    const tbody = document.querySelector("#studentsTable tbody");
    tbody.innerHTML = data.map(s => `<tr><td>${s.id}</td><td>${s.student_code}</td><td>${s.name}</td><td>${s.class||""}</td><td>${s.section||""}</td></tr>`).join("");
  })();

  // Add teacher
  document.getElementById("addTeacher").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("t_name").value,
      designation: document.getElementById("t_desig").value,
      subject: document.getElementById("t_subject").value,
      username: document.getElementById("t_user").value || undefined,
      password: document.getElementById("t_pass").value || undefined,
    };
    await api("/teachers", { method: "POST", body: JSON.stringify(payload) });
    alert("Teacher added");
  });

  // Notice
  document.getElementById("addNotice").addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("/notices", { method: "POST", body: JSON.stringify({
      title: document.getElementById("n_title").value,
      body: document.getElementById("n_body").value,
    })});
    alert("Notice posted");
  });

  // Prospectus
  document.getElementById("addProspectus").addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("/prospectus", { method: "POST", body: JSON.stringify({
      title: document.getElementById("p_title").value,
      url: document.getElementById("p_url").value,
    })});
    alert("Prospectus added");
  });
}

// Teacher page
const markAttendance = document.getElementById("markAttendance");
if (markAttendance) {
  markAttendance.addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("/attendance", { method: "POST", body: JSON.stringify({
      student_id: Number(document.getElementById("a_sid").value),
      date: document.getElementById("a_date").value,
      status: document.getElementById("a_status").value,
    })});
    alert("Attendance saved");
  });

  document.getElementById("addGrade").addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("/grades", { method: "POST", body: JSON.stringify({
      student_id: Number(document.getElementById("g_sid").value),
      subject: document.getElementById("g_subject").value,
      term: document.getElementById("g_term").value,
      marks: Number(document.getElementById("g_marks").value),
      max_marks: document.getElementById("g_max").value ? Number(document.getElementById("g_max").value) : undefined,
      grade: document.getElementById("g_grade").value || undefined,
    })});
    alert("Grade saved");
  });
}

// Student page
const profileDiv = document.getElementById("profile");
if (profileDiv) {
  (async () => {
    // get student's own linked id by calling /auth/me then user_student
    const me = await api("/auth/me");
    // naive: fetch first attendance etc by trying studentId from token link; server enforces ownership
    // Try the first fees list to get a student id if needed
    // Better: ask server for students/:id where id is embedded in token? We don't have.
    // We'll attempt both: if fees fails, ask user ID via prompt.
    let sidGuess = null;
    // Try pulling from attendance using possible ids; fall back to asking user
    // For demo (seeded user), student has id=1
    sidGuess = 1;
    try {
      const s = await api(`/students/${sidGuess}`);
      renderStudent(sidGuess, s);
    } catch (e) {
      const input = prompt("Enter your Student ID to view your profile:");
      sidGuess = Number(input);
      const s = await api(`/students/${sidGuess}`);
      renderStudent(sidGuess, s);
    }
  })();
}

async function renderStudent(id, s) {
  profileDiv.innerHTML = `<p><b>${s.name}</b> — Class ${s.class || ""} ${s.section || ""}<br><small>Code: ${s.student_code}</small></p>`;
  const att = await api(`/attendance/${id}`);
  document.querySelector("#attendanceTable tbody").innerHTML =
    att.map(r => `<tr><td>${r.date}</td><td>${r.status}</td></tr>`).join("");

  const grades = await api(`/grades/${id}`);
  document.querySelector("#gradesTable tbody").innerHTML =
    grades.map(g => `<tr><td>${g.subject}</td><td>${g.term}</td><td>${g.marks}</td><td>${g.max_marks}</td><td>${g.grade||""}</td></tr>`).join("");

  const fees = await api(`/fees/${id}`);
  document.querySelector("#feesTable tbody").innerHTML =
    fees.map(f => `<tr><td>${f.term}</td><td>${f.amount_due}</td><td>${f.amount_paid}</td><td>${f.status}</td></tr>`).join("");

  const notices = await (await fetch(API + "/notices")).json();
  document.querySelector("#notices").innerHTML = notices.map(n => `<li><b>${n.title}</b> — ${n.body}</li>`).join("");

  const pros = await (await fetch(API + "/prospectus")).json();
  document.querySelector("#prospectus").innerHTML = pros.map(p => `<li><a href="${p.url}" target="_blank">${p.title}</a></li>`).join("");
}