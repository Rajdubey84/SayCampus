// ============================
// 🔹 Globals
// ============================
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];
let complaints = JSON.parse(localStorage.getItem("userComplaints")) || [];

// ============================
// 🔹 Menu Navigation
// ============================
const assignmentsSection = document.getElementById("assignments");
const complaintsSection = document.getElementById("complaints");

document.getElementById("assignmentsBtn")?.addEventListener("click", () => {
  assignmentsSection.classList.add("visible");
  complaintsSection.classList.remove("visible");
});

document.getElementById("complaintsBtn")?.addEventListener("click", () => {
  complaintsSection.classList.add("visible");
  assignmentsSection.classList.remove("visible");
});

// ============================
// 🔹 Profile & History
// ============================
function toggleProfileMenu() {
  document.getElementById("profileMenu").classList.toggle("hidden");
}

function updateProfilePhoto() {
  const file = document.getElementById("profileUpload").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const newPhoto = e.target.result;
    const el = document.getElementById("profilePhoto");
    if (el) el.src = newPhoto;
    const profileIcon = document.getElementById("profileIcon");
    if (profileIcon) profileIcon.src = newPhoto;
    currentUser.photo = newPhoto;
    saveProfileData();
  };
  reader.readAsDataURL(file);
}

function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const password = document.getElementById("profilePassword").value;
  if (!name || !email || !password) { alert("Fill all fields!"); return; }
  currentUser.name = name;
  currentUser.email = email;
  currentUser.password = password;
  saveProfileData();
  alert("Profile updated ✅");
}

function saveProfileData() {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const index = users.findIndex(u => u.email === currentUser.email);
  if (index !== -1) users[index] = currentUser;
  else users.push(currentUser);
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

if (currentUser.photo) {
  const p = document.getElementById("profilePhoto");
  if (p) p.src = currentUser.photo;
  const pi = document.getElementById("profileIcon");
  if (pi) pi.src = currentUser.photo;
}

// ============================
// 🔹 Assignments / Admin Announcements (rendering)
// ============================
function renderAssignments() {
  const adminAssignmentsDiv = document.getElementById("adminAssignments");
  if (!adminAssignmentsDiv) return;
  adminAssignmentsDiv.innerHTML = "";

  // Read the authoritative announcements storage (announcements)
  const adminAnnouncements = JSON.parse(localStorage.getItem("announcements")) || [];

  if (adminAnnouncements.length === 0) {
    adminAssignmentsDiv.innerHTML = "<p>No announcements yet.</p>";
  }

  adminAnnouncements.forEach((a, i) => {
    const div = document.createElement("div");
    div.className = "assignment-item admin-announcement";
    // build user uploads HTML (if any)
    const userUploadsHTML = (a.userUploads || []).map((u, j) => `
      <div style="margin-top:6px; padding:6px; background:#f1f1f1; border-radius:6px;">
        <b>${escapeHtml(u.name)}</b> (${escapeHtml(u.email)})<br>
        ${u.message ? `<div>${escapeHtml(u.message)}</div>` : ""}
        ${u.fileURL ? `<a href="${u.fileURL}" target="_blank">📎 ${escapeHtml(u.fileName)}</a><br>` : ""}
        <small>${u.dateTime || ''}</small>
        <br><button class="danger small-btn" onclick="deleteUserUpload(${i},${j})">Delete</button>
      </div>
    `).join("");

    div.innerHTML = `
      <strong>${escapeHtml(a.title)}</strong> (${escapeHtml(a.type)})<br>
      ${a.deadline ? `<small>Deadline: ${escapeHtml(a.deadline)}</small><br>` : ""}
      <small>${escapeHtml(a.date)}</small>
      <p>${escapeHtml(a.desc)}</p>
      ${a.fileURL ? `<a href="${a.fileURL}" target="_blank" class="file-link">📎 ${escapeHtml(a.fileName)}</a>` : ""}
      <hr>
      ${userUploadsHTML}
      <button class="danger small-btn" onclick="deleteAnnouncement(${i})">Delete Announcement</button>
    `;
    adminAssignmentsDiv.appendChild(div);
  });

  // User-specific assignments (private uploads list)
  const userAssignments = assignments.filter(a => a.userEmail === currentUser.email);
  userAssignments.forEach((a, idx) => {
    const div = document.createElement("div");
    div.className = "assignment-item user-assignment";
    div.innerHTML = `
      <strong>${escapeHtml(a.message || "No message")}</strong><br>
      File: ${a.fileName ? escapeHtml(a.fileName) : "N/A"}<br>
      Date: ${escapeHtml(a.dateTime || "")}
      <br><button onclick="deleteUserAssignmentIndex(${idx})" class="danger small-btn">Delete</button>
    `;
    adminAssignmentsDiv.appendChild(div);
  });
}

// helper escape
function escapeHtml(str) {
  return str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])) : '';
}

// ============================
// 🔹 Upload Assignment (User) — with robust sync
// ============================
function uploadAssignment() {
  const message = document.getElementById("assignmentMessage").value.trim();
  const file = document.getElementById("assignmentFile").files[0];
  const relatedTitle = document.getElementById("assignmentRelatedAnnTitle")?.value?.trim();

  if (!message && !file) { alert("Add a message or file"); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const now = new Date().toLocaleString();
    const newAssign = {
      userEmail: currentUser.email,
      name: currentUser.name,
      message,
      fileName: file ? file.name : null,
      fileURL: file ? e.target.result : null,
      dateTime: now
    };

    // add to assignments array (local user uploads store)
    assignments.unshift(newAssign);
    localStorage.setItem("assignments", JSON.stringify(assignments));

    // SYNC TO announcements (admin-visible)
    // We will search announcements (authoritative admin-visible storage)
    let announcements = JSON.parse(localStorage.getItem("announcements")) || [];
    let adminAnns = JSON.parse(localStorage.getItem("adminAnnouncements")) || [];

    // find by relatedTitle (exact match). If provided, push to matched announcement's userUploads.
    if (relatedTitle) {
      let matchedIndex = announcements.findIndex(a => a.title === relatedTitle);
      // fallback to adminAnns if announcements is empty or not found
      if (matchedIndex === -1 && adminAnns.length && adminAnns.findIndex(a => a.title === relatedTitle) !== -1) {
        matchedIndex = adminAnns.findIndex(a => a.title === relatedTitle);
        // bring adminAnns into announcements so admin and user see same
        announcements = adminAnns.slice();
      }

      if (matchedIndex !== -1) {
        announcements[matchedIndex].userUploads = announcements[matchedIndex].userUploads || [];
        announcements[matchedIndex].userUploads.push({
          name: currentUser.name,
          email: currentUser.email,
          message,
          fileName: newAssign.fileName,
          fileURL: newAssign.fileURL,
          photo: currentUser.photo || null,
          dateTime: now
        });

        // keep both keys in sync so admin.html or other code can read either
        localStorage.setItem("announcements", JSON.stringify(announcements));
        localStorage.setItem("adminAnnouncements", JSON.stringify(announcements));
      }
    }

    // If no relatedTitle — we keep assignment only in assignments (user private).
    renderAssignments();
    document.getElementById("assignmentMessage").value = "";
    document.getElementById("assignmentFile").value = "";
  };

  if (file) reader.readAsDataURL(file); else reader.onload();
}

// ============================
// 🔹 Delete User Upload (admin-triggered delete)
// ============================
function deleteUserUpload(annIndex, userIndex) {
  // remove from announcements/adminAnnouncements and from assignments
  let announcements = JSON.parse(localStorage.getItem("announcements")) || [];
  let adminAnns = JSON.parse(localStorage.getItem("adminAnnouncements")) || announcements.slice();

  if (!announcements[annIndex] || !announcements[annIndex].userUploads?.[userIndex]) return;

  const upload = announcements[annIndex].userUploads[userIndex];
  // remove from announcements
  announcements[annIndex].userUploads.splice(userIndex, 1);
  // save both keys
  localStorage.setItem("announcements", JSON.stringify(announcements));
  localStorage.setItem("adminAnnouncements", JSON.stringify(announcements));

  // also remove matching assignment by user email + dateTime (if exists)
  assignments = assignments.filter(a => !(a.userEmail === upload.email && a.dateTime === upload.dateTime));
  localStorage.setItem("assignments", JSON.stringify(assignments));

  renderAssignments();
}

// ============================
// 🔹 Delete User Own Assignment (the index here is index within the filtered user's list shown)
// ============================
function deleteUserAssignmentIndex(filteredIndex) {
  // We need to delete the correct global assignment entry that corresponds to this user's filtered index.
  const userFiltered = assignments.filter(a => a.userEmail === currentUser.email);
  const target = userFiltered[filteredIndex];
  if (!target) return;
  const globalIndex = assignments.findIndex(a => a === target);
  if (globalIndex !== -1) assignments.splice(globalIndex, 1);
  localStorage.setItem("assignments", JSON.stringify(assignments));
  renderAssignments();
}

// ============================
// 🔹 Delete Announcement (admin)
// ============================
function deleteAnnouncement(i) {
  let announcements = JSON.parse(localStorage.getItem("announcements")) || [];
  if (!announcements[i]) return;
  if (!confirm(`Delete announcement "${announcements[i].title}"?`)) return;

  // collect userUploads of this announcement to remove their assignments as well
  const removed = announcements.splice(i, 1)[0];

  localStorage.setItem("announcements", JSON.stringify(announcements));
  localStorage.setItem("adminAnnouncements", JSON.stringify(announcements));

  if (removed?.userUploads?.length) {
    const uploadsSet = new Set(removed.userUploads.map(u => `${u.email}___${u.dateTime}`));
    assignments = assignments.filter(a => !uploadsSet.has(`${a.userEmail}___${a.dateTime}`));
    localStorage.setItem("assignments", JSON.stringify(assignments));
  }

  renderAssignments();
}

// ============================
// 🔹 Complaints (unchanged)
// ============================
function showComplaintForm() {
  document.getElementById("complaintFormArea").classList.remove("hidden");
  document.getElementById("userComplaintsArea").classList.add("hidden");
}

function showUserComplaints() {
  document.getElementById("complaintFormArea").classList.add("hidden");
  document.getElementById("userComplaintsArea").classList.remove("hidden");
  renderUserComplaints();
}

function submitComplaint() {
  const subject = document.getElementById("complaintSubject").value.trim();
  const category = document.getElementById("complaintCategory").value;
  const message = document.getElementById("complaintMessage").value.trim();
  const file = document.getElementById("complaintFile").files[0];

  if (!subject || !message) { alert("subject and message are required"); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const newComp = {
      userEmail: currentUser.email,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      subject,
      category,
      message,
      fileName: file ? file.name : null,
      fileURL: file ? e.target.result : null,
      dateTime: new Date().toLocaleString(),
      status: "Pending"
    };
    complaints.unshift(newComp);
    localStorage.setItem("complaints", JSON.stringify(complaints));
    localStorage.setItem("userComplaints", JSON.stringify(complaints));
    renderUserComplaints();
    document.getElementById("complaintSubject").value = "";
    document.getElementById("complaintMessage").value = "";
    document.getElementById("complaintFile").value = "";
  };
  if (file) reader.readAsDataURL(file); else reader.onload();
}

function renderUserComplaints() {
  const container = document.getElementById("userComplaintsList");
  if (!container) return;
  container.innerHTML = "";
  const userComplaints = complaints.filter(c => c.userEmail === currentUser.email);
  if (userComplaints.length === 0) { container.innerHTML = "<p>No complaints submitted.</p>"; return; }

  userComplaints.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "assignment-item complaint-item";
    div.innerHTML = `
      <strong>${escapeHtml(c.subject)}</strong> (${escapeHtml(c.category)})<br>
      <small>${escapeHtml(c.dateTime)}</small><br>
      ${escapeHtml(c.message)}<br>
      ${c.fileURL ? `<a href="${c.fileURL}" target="_blank" class="file-link">📎 ${escapeHtml(c.fileName)}</a>` : ""}<br>
      Status: <span class="${c.status==='Resolved'?'resolved':c.status==='In Progress'?'progress':'pending'}">${escapeHtml(c.status)}</span>
      <br><button onclick="deleteComplaint(${i})" class="danger small-btn">Delete</button>
    `;
    container.appendChild(div);
  });
}

function deleteComplaint(i) {
  const userComplaints = complaints.filter(c => c.userEmail === currentUser.email);
  const globalIndex = complaints.findIndex(c => c === userComplaints[i]);
  if (globalIndex !== -1) complaints.splice(globalIndex, 1);
  localStorage.setItem("complaints", JSON.stringify(complaints));
  localStorage.setItem("userComplaints", JSON.stringify(complaints));
  renderUserComplaints();
}

// ============================
// 🔹 History & Misc
// ============================
function toggleHistory() {
  document.getElementById("historySection").classList.toggle("hidden");
  renderHistory();
}
function closeHistory() { document.getElementById("historySection").classList.add("hidden"); }

function renderHistory() {
  const historyDiv = document.getElementById("historyList");
  if (!historyDiv) return;
  historyDiv.innerHTML = "";
  const userAssignmentsHistory = assignments.filter(a => a.userEmail === currentUser.email);
  const userComplaintsHistory = complaints.filter(c => c.userEmail === currentUser.email);

  userAssignmentsHistory.forEach((a) => {
    const div = document.createElement("div");
    div.innerHTML = `📤 Assignment: ${escapeHtml(a.message || "No message")} | ${escapeHtml(a.dateTime)}`;
    historyDiv.appendChild(div);
  });

  userComplaintsHistory.forEach((c) => {
    const div = document.createElement("div");
    div.innerHTML = `📢 Complaint: ${escapeHtml(c.subject)} | ${escapeHtml(c.dateTime)} | Status: ${escapeHtml(c.status)}`;
    historyDiv.appendChild(div);
  });
}

// ============================
// 🔹 Auto Sync (keeps adminAnnouncements and userComplaints in sync if other pages change them)
// ============================
function autoSync() {
  const latestAnn = JSON.parse(localStorage.getItem("announcements")) || [];
  const latestComplaints = JSON.parse(localStorage.getItem("complaints")) || [];
  localStorage.setItem("adminAnnouncements", JSON.stringify(latestAnn)); // keep adminAnnouncements mirror
  localStorage.setItem("userComplaints", JSON.stringify(latestComplaints));
  renderAssignments();
  renderUserComplaints();
}
setInterval(autoSync, 2000);

// ============================
// 🔹 Initialize Dashboard
// ============================
document.getElementById("profileName") && (document.getElementById("profileName").value = currentUser.name || "");
document.getElementById("profileEmail") && (document.getElementById("profileEmail").value = currentUser.email || "");
document.getElementById("profilePassword") && (document.getElementById("profilePassword").value = currentUser.password || "");
if (currentUser.photo) document.getElementById("profilePhoto") && (document.getElementById("profilePhoto").src = currentUser.photo);

renderAssignments();
renderUserComplaints();














/*

// ============================
// 🔹 Globals
// ============================
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];
let complaints = JSON.parse(localStorage.getItem("userComplaints")) || [];

// ============================
// 🔹 Menu Navigation
// ============================
const assignmentsSection = document.getElementById("assignments");
const complaintsSection = document.getElementById("complaints");

document.getElementById("assignmentsBtn").addEventListener("click", () => {
  assignmentsSection.classList.add("visible");
  complaintsSection.classList.remove("visible");
});

document.getElementById("complaintsBtn").addEventListener("click", () => {
  complaintsSection.classList.add("visible");
  assignmentsSection.classList.remove("visible");
});

// ============================
// 🔹 Profile & History
// ============================
function toggleProfileMenu() {
  document.getElementById("profileMenu").classList.toggle("hidden");
}


function updateProfilePhoto() {
  const file = document.getElementById("profileUpload").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const newPhoto = e.target.result;

    // update dashboard popup photo
    document.getElementById("profilePhoto").src = newPhoto;

    // update navbar profile icon
    const profileIcon = document.getElementById("profileIcon");
    if (profileIcon) profileIcon.src = newPhoto;

    // store in currentUser
    currentUser.photo = newPhoto;

    // save everywhere
    saveProfileData();
  };
  reader.readAsDataURL(file);
}





function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const password = document.getElementById("profilePassword").value;

  if (!name || !email || !password) { alert("Fill all fields!"); return; }

  currentUser.name = name;
  currentUser.email = email;
  currentUser.password = password;
  saveProfileData();
  alert("Profile updated ✅");
}

function saveProfileData() {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const index = users.findIndex(u => u.email === currentUser.email);
  if (index !== -1) users[index] = currentUser;
  else users.push(currentUser);
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}



if (currentUser.photo) {
  document.getElementById("profilePhoto").src = currentUser.photo;

  const profileIcon = document.getElementById("profileIcon");
  if (profileIcon) profileIcon.src = currentUser.photo;
}





// ============================
// 🔹 Assignments / Admin Announcements
// ============================
function renderAssignments() {
  const adminAssignmentsDiv = document.getElementById("adminAssignments");
  adminAssignmentsDiv.innerHTML = "";

  // 🔹 Admin announcements
  const adminAnnouncements = JSON.parse(localStorage.getItem("adminAnnouncements")) || [];
  if (adminAnnouncements.length === 0) {
    adminAssignmentsDiv.innerHTML = "<p>No announcements yet.</p>";
  }

  adminAnnouncements.forEach((a, i) => {
    const div = document.createElement("div");
    div.className = "assignment-item admin-announcement";
    div.style = "border-left:5px solid #3498db; background:#fdfdfd; padding:12px; border-radius:8px; margin-bottom:12px; box-shadow:0 2px 6px rgba(0,0,0,0.04);";

    // User uploads
    const userUploadsHTML = (a.userUploads || []).map((u, j) => `
      <div style="margin-top:6px; padding:6px; background:#f1f1f1; border-radius:6px;">
        <b>${u.name}</b> (${u.email})<br>
        ${u.message || "No message"}<br>
        ${u.fileURL ? `<a href="${u.fileURL}" target="_blank">📎 ${u.fileName}</a>` : ""}<br>
        <small>${u.dateTime}</small>
        <br><button class="danger small-btn" onclick="deleteUserUpload(${i},${j})">Delete</button>
      </div>
    `).join("");

    div.innerHTML = `
      <strong>${a.title}</strong> (${a.type})<br>
      ${a.deadline ? `<small>Deadline: ${a.deadline}</small><br>` : ""}
      <small>${a.date}</small>
      <p>${a.desc}</p>
      ${a.fileURL ? `<a href="${a.fileURL}" target="_blank" class="file-link">📎 ${a.fileName}</a>` : ""}
      <hr>
      ${userUploadsHTML}
      <button class="danger small-btn" onclick="deleteAnnouncement(${i})">Delete Announcement</button>
    `;

    adminAssignmentsDiv.appendChild(div);
  });

  // 🔹 User own assignments
  const userAssignments = assignments.filter(a => a.userEmail === currentUser.email);
  userAssignments.forEach((a, i) => {
    const div = document.createElement("div");
    div.className = "assignment-item user-assignment";
    div.style = "border-left:5px solid #2ecc71; background:#f9f9f9; padding:10px; border-radius:6px; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.05);";

    div.innerHTML = `
      <strong>${a.message || "No message"}</strong><br>
      File: ${a.fileName || "N/A"}<br>
      Date: ${a.dateTime}
      <br><button onclick="deleteUserAssignment(${i})" class="danger small-btn">Delete</button>
    `;
    adminAssignmentsDiv.appendChild(div);
  });
}

// 🔹 Upload Assignment (User)
function uploadAssignment() {
  const message = document.getElementById("assignmentMessage").value.trim();
  const file = document.getElementById("assignmentFile").files[0];
  const relatedTitle = document.getElementById("assignmentRelatedAnnTitle")?.value?.trim();

  if (!message && !file) { alert("Add a message or file"); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const newAssign = {
      userEmail: currentUser.email,
      name: currentUser.name,
      message,
      fileName: file ? file.name : null,
      fileURL: file ? e.target.result : null,
      dateTime: new Date().toLocaleString()
    };

    assignments.unshift(newAssign);
    localStorage.setItem("assignments", JSON.stringify(assignments));
    // ✅ FIXED + CLEANED SYNC WITH RIGHT ANNOUNCEMENT
    if (relatedTitle) {
      let adminAnns = JSON.parse(localStorage.getItem("adminAnnouncements")) || [];
      let matchedIndex = adminAnns.findIndex((a) => a.title === relatedTitle);

      if (matchedIndex !== -1) {
        if (!adminAnns[matchedIndex].userUploads) adminAnns[matchedIndex].userUploads = [];

        adminAnns[matchedIndex].userUploads.push({
          name: currentUser.name,
          email: currentUser.email,
          message,
          fileName: newAssign.fileName,
          fileURL: newAssign.fileURL,
          photo: currentUser.photo || null,
          dateTime: newAssign.dateTime,
        });

        localStorage.setItem("adminAnnouncements", JSON.stringify(adminAnns));
        localStorage.setItem("announcements", JSON.stringify(adminAnns));
      }
    }





/*
    // Sync with admin announcement
    if (relatedTitle) {
      let adminAnns = JSON.parse(localStorage.getItem("adminAnnouncements")) || [];
      let  matchedAnn = adminAnns.find(a => a.title === relatedTitle);
      if (matchedAnn) {
        matchedAnn.userUploads = matchedAnn.userUploads || [];
        matchedAnn.userUploads.push({
          name: currentUser.name,
          email: currentUser.email,
          message,
          fileName: file ? file.name : null,
          fileURL: file ? e.target.result : null,
          photo: currentUser.photo || null,
          dateTime: new Date().toLocaleString()
        });
        localStorage.setItem("adminAnnouncements", JSON.stringify(adminAnns));
        localStorage.setItem("announcements", JSON.stringify(adminAnns));
      }
    }

    renderAssignments();
    document.getElementById("assignmentMessage").value = "";
    document.getElementById("assignmentFile").value = "";
  };

  if (file) reader.readAsDataURL(file); else reader.onload();
}

// 🔹 Delete user upload (admin)
function deleteUserUpload(annIndex, userIndex) {
  const adminAnns = JSON.parse(localStorage.getItem("adminAnnouncements")) || [];
  if (!adminAnns[annIndex] || !adminAnns[annIndex].userUploads[userIndex]) return;

  const uploadToDelete = adminAnns[annIndex].userUploads[userIndex];
  adminAnns[annIndex].userUploads.splice(userIndex, 1);
  localStorage.setItem("adminAnnouncements", JSON.stringify(adminAnns));
  localStorage.setItem("announcements", JSON.stringify(adminAnns));

  // Remove from assignments array if exists
  assignments = assignments.filter(a => !(a.userEmail === uploadToDelete.email && a.dateTime === uploadToDelete.dateTime));
  localStorage.setItem("assignments", JSON.stringify(assignments));

  renderAssignments();
}

// 🔹 Delete user own assignment
function deleteUserAssignment(i) {
  assignments.splice(i, 1);
  localStorage.setItem("assignments", JSON.stringify(assignments));
  renderAssignments();
}

// 🔹 Delete announcement (admin)
function deleteAnnouncement(i) {
  const adminAnns = JSON.parse(localStorage.getItem("adminAnnouncements")) || [];
  const ann = adminAnns[i];
  if (!ann) return;
  if (!confirm(`Delete announcement "${ann.title}"?`)) return;

  adminAnns.splice(i, 1);
  localStorage.setItem("adminAnnouncements", JSON.stringify(adminAnns));
  localStorage.setItem("announcements", JSON.stringify(adminAnns));

  // Remove related user assignments
  assignments = assignments.filter(a => !ann.userUploads?.some(u => u.email === a.userEmail && u.dateTime === a.dateTime));
  localStorage.setItem("assignments", JSON.stringify(assignments));

  renderAssignments();
}

// ============================
// 🔹 Complaints
// ============================
function showComplaintForm() {
  document.getElementById("complaintFormArea").classList.remove("hidden");
  document.getElementById("userComplaintsArea").classList.add("hidden");
}

function showUserComplaints() {
  document.getElementById("complaintFormArea").classList.add("hidden");
  document.getElementById("userComplaintsArea").classList.remove("hidden");
  renderUserComplaints();
}

function submitComplaint() {
  const subject = document.getElementById("complaintSubject").value.trim();
  const category = document.getElementById("complaintCategory").value;
  const message = document.getElementById("complaintMessage").value.trim();
  const file = document.getElementById("complaintFile").files[0];

  if (!subject || !message) { alert("subject and message are required"); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const newComp = {
      userEmail: currentUser.email,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      subject,
      category,
      message,
      fileName: file ? file.name : null,
      fileURL: file ? e.target.result : null,
      dateTime: new Date().toLocaleString(),
      status: "Pending"
    };
    complaints.unshift(newComp);
    localStorage.setItem("complaints", JSON.stringify(complaints));
    localStorage.setItem("userComplaints", JSON.stringify(complaints));
    renderUserComplaints();
    document.getElementById("complaintSubject").value = "";
    document.getElementById("complaintMessage").value = "";
    document.getElementById("complaintFile").value = "";
  };
  if (file) reader.readAsDataURL(file); else reader.onload();
}

function renderUserComplaints() {
  const container = document.getElementById("userComplaintsList");
  container.innerHTML = "";
  const userComplaints = complaints.filter(c => c.userEmail === currentUser.email);
  if (userComplaints.length === 0) { container.innerHTML = "<p>No complaints submitted.</p>"; return; }

  userComplaints.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "assignment-item complaint-item";
    div.style = "border-left:5px solid #f39c12; background:#fff8f0; padding:10px; margin-bottom:10px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.05);";

    div.innerHTML = `
      <strong>${c.subject}</strong> (${c.category})<br>
      <small>${c.dateTime}</small><br>
      ${c.message}<br>
      ${c.fileURL ? `<a href="${c.fileURL}" target="_blank" class="file-link">📎 ${c.fileName}</a>` : ""}<br>
      Status: <span class="${c.status==='Resolved'?'resolved':c.status==='In Progress'?'progress':'pending'}">${c.status}</span>
      <br><button onclick="deleteComplaint(${i})" class="danger small-btn">Delete</button>
    `;
    container.appendChild(div);
  });
}

function deleteComplaint(i) {
  const userComplaints = complaints.filter(c => c.userEmail === currentUser.email);
  const globalIndex = complaints.findIndex(c => c === userComplaints[i]);
  if (globalIndex !== -1) complaints.splice(globalIndex, 1);
  localStorage.setItem("complaints", JSON.stringify(complaints));
  localStorage.setItem("userComplaints", JSON.stringify(complaints));
  renderUserComplaints();
}

// ============================
// 🔹 History
// ============================
function toggleHistory() {
  document.getElementById("historySection").classList.toggle("hidden");
  renderHistory();
}

function closeHistory() { document.getElementById("historySection").classList.add("hidden"); }

function renderHistory() {
  const historyDiv = document.getElementById("historyList");
  historyDiv.innerHTML = "";
  const userAssignmentsHistory = assignments.filter(a => a.userEmail === currentUser.email);
  const userComplaintsHistory = complaints.filter(c => c.userEmail === currentUser.email);

  userAssignmentsHistory.forEach((a) => {
    const div = document.createElement("div");
    div.innerHTML = `📤 Assignment: ${a.message || "No message"} | ${a.dateTime}`;
    historyDiv.appendChild(div);
  });

  userComplaintsHistory.forEach((c) => {
    const div = document.createElement("div");
    div.innerHTML = `📢 Complaint: ${c.subject} | ${c.dateTime} | Status: ${c.status}`;
    historyDiv.appendChild(div);
  });
}

// ============================
// 🔹 Auto Sync
// ============================
function autoSync() {
  const latestAnn = JSON.parse(localStorage.getItem("adminAnnouncements")) || [];
  const latestComplaints = JSON.parse(localStorage.getItem("complaints")) || [];

  localStorage.setItem("adminAnnouncements", JSON.stringify(latestAnn));
  localStorage.setItem("userComplaints", JSON.stringify(latestComplaints));

  renderAssignments();
  renderUserComplaints();
}

setInterval(autoSync, 2000);

// ============================
// 🔹 Initialize Dashboard
// ============================
document.getElementById("profileName").value = currentUser.name || "";
document.getElementById("profileEmail").value = currentUser.email || "";
document.getElementById("profilePassword").value = currentUser.password || "";
if(currentUser.photo) document.getElementById("profilePhoto").src = currentUser.photo;

renderAssignments();
renderUserComplaints();





*/



















