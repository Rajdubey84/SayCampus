// ============================
// 🔹 Auto-delete expired events
// ============================
function autoDeleteExpiredEvents() {
  let announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  let currentTime = new Date().getTime();

  announcements = announcements.filter(a => {
    if (!a.deadline) return true;
    // treat ISO date from input[type=date]; compare midnight of deadline
    const d = new Date(a.deadline);
    // if invalid date, keep it
    if (isNaN(d.getTime())) return true;
    // include announcements whose deadline is today or future
    return d.getTime() + (24*60*60*1000) > currentTime;
  });

  saveAnnouncements(announcements);
  loadAnnouncements();
}
setInterval(autoDeleteExpiredEvents, 30000);

// ============================
// 🔹 Utility Functions
// ============================
function goBack() { window.location.href = "index.html"; }
function logoutAdmin() { alert("Admin Logged Out"); window.location.href = 'index.html'; }
function escapeHtml(str) {
  return str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])) : '';
}

// ============================
// 🔹 Users Table
// ============================
function showUsersTable(){
  document.getElementById('usersTableModal').style.display='block';
  document.body.classList.add('modal-active');
  loadUsersTable();
}
function closeUsersTable(){
  document.getElementById('usersTableModal').style.display='none';
  document.body.classList.remove('modal-active');
}
function loadUsersTable(){
  const tbody = document.getElementById('usersTableBody');
  const users = JSON.parse(localStorage.getItem('users')) || [];
  tbody.innerHTML = '';
  users.forEach((u,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${u.photo ? `<img src="${u.photo}">` : ''}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.password)}</td>
      <td>${u.signupTime || '-'}</td>
      <td><button class="delete-btn" onclick="deleteUser(${i})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}
function deleteUser(i){
  const users = JSON.parse(localStorage.getItem('users')) || [];
  if(!users[i]) return;
  if(!confirm(`Delete user ${users[i].name}?`)) return;
  users.splice(i,1);
  localStorage.setItem('users', JSON.stringify(users));
  loadUsersTable();
  loadStats();
}

// ============================
// 🔹 Announcements (Admin)
// ============================
function createAnnouncement() {
  const type = document.getElementById('annType').value;
  const title = document.getElementById('annTitle').value.trim();
  const desc = document.getElementById('annDesc').value.trim();
  const deadline = document.getElementById('annDeadline').value;
  const file = document.getElementById('annFile').files[0];
  if (!title && !desc && !file) { alert("Please enter at least one field"); return; }

  const reader = new FileReader();
  reader.onload = function(e) {
    let announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const newAnn = {
      type, title, desc, deadline,
      fileName: file ? file.name : null,
      fileURL: file ? e.target.result : null,
      date: new Date().toLocaleString(),
      userUploads: []
    };
    announcements.unshift(newAnn);
    saveAnnouncements(announcements);
    loadAnnouncements();
    clearCreateForm();
    alert("Announcement added ✅");
  };
  if(file) reader.readAsDataURL(file); else reader.onload();
}
function clearCreateForm(){
  document.getElementById('annTitle').value='';
  document.getElementById('annDesc').value='';
  document.getElementById('annDeadline').value='';
  document.getElementById('annFile').value='';
}

function loadAnnouncements(){
  const div = document.getElementById('adminAnnouncementsList');
  div.innerHTML='';
  // read authoritative key 'announcements' (kept in sync by dashboard.js and autoSync)
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  if(announcements.length===0){ div.innerHTML='<p>No announcements yet</p>'; return; }

  announcements.forEach((a,i)=>{
    const el = document.createElement('div');
    el.className='announcement-item';
    el.innerHTML=`
      <strong>${escapeHtml(a.title)}</strong> (${escapeHtml(a.type)})<br>
      <small>${escapeHtml(a.date)}</small><br>
      ${a.deadline?`<small>Deadline: ${escapeHtml(a.deadline)}</small><br>`:''}
      <p>${escapeHtml(a.desc)}</p>
      ${a.fileURL?`<a href="${a.fileURL}" target="_blank" class="file-link">📎 ${escapeHtml(a.fileName)}</a>`:''}
      <br>
      <button class="small-btn" onclick="toggleUserUploads(${i})">👥 View User Uploads (${(a.userUploads||[]).length})</button>
      <div id="userUploads-${i}" style="margin-top:8px; display:none;"></div>
      <button class="danger small-btn" onclick="deleteAnnouncement(${i})">Delete</button>
    `;
    div.appendChild(el);
  });
}

function toggleUserUploads(index){
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  const container = document.getElementById(`userUploads-${index}`);
  if(!container) return;

  if(container.style.display==='none' || container.style.display==='' ){
    container.style.display='block';
    container.innerHTML='';
    const users = announcements[index].userUploads || [];
    if(users.length===0){ container.innerHTML='<small>No user uploads yet</small>'; return; }

    users.forEach((u,j)=>{
      const userDiv = document.createElement('div');
      userDiv.className='user-row';
      userDiv.innerHTML=`
        <strong>${escapeHtml(u.name)}</strong> (${escapeHtml(u.email)})<br>
        ${u.message ? `<div>${escapeHtml(u.message)}</div>` : ''}
        ${u.fileURL ? `<a href="${u.fileURL}" target="_blank">📎 ${escapeHtml(u.fileName)}</a><br>` : ''}
        <small>${escapeHtml(u.dateTime || '')}</small>
        <br>
        <button class="danger small-btn" onclick="deleteUserFromAnnouncement(${index},${j})">Delete</button>
      `;
      container.appendChild(userDiv);
    });
  } else {
    container.style.display='none';
  }
}

function deleteUserFromAnnouncement(annIndex,userIndex){
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  if(!announcements[annIndex] || !announcements[annIndex].userUploads?.[userIndex]) return;
  const removed = announcements[annIndex].userUploads.splice(userIndex,1)[0];
  saveAnnouncements(announcements);
  loadAnnouncements();

  // Also remove corresponding assignment entry if exists
  let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
  assignments = assignments.filter(a => !(a.userEmail === removed.email && a.dateTime === removed.dateTime));
  localStorage.setItem('assignments', JSON.stringify(assignments));
}

// delete announcement
function deleteAnnouncement(index){
  if(!confirm("Delete this announcement?")) return;
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  const removed = announcements.splice(index,1)[0];
  saveAnnouncements(announcements);
  loadAnnouncements();

  // remove related assignments uploaded to this announcement
  if(removed?.userUploads?.length){
    let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    const marker = new Set(removed.userUploads.map(u=>`${u.email}___${u.dateTime}`));
    assignments = assignments.filter(a => !marker.has(`${a.userEmail}___${a.dateTime}`));
    localStorage.setItem('assignments', JSON.stringify(assignments));
  }

  alert("Announcement deleted ✅");
}

function saveAnnouncements(list){
  // Save authoritative announcements and keep adminAnnouncements mirror
  localStorage.setItem('announcements', JSON.stringify(list));
  localStorage.setItem('adminAnnouncements', JSON.stringify(list));
  localStorage.setItem('userAnnouncements', JSON.stringify(list));
}

// ============================
// 🔹 Complaints — Admin views all
// ============================
function loadComplaints(){
  const container = document.getElementById('allComplaints');
  const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
  if(complaints.length===0){ container.innerHTML='<p>No complaints found.</p>'; return; }
  container.innerHTML='';
  complaints.forEach((c,i)=>{
    const div = document.createElement('div');
    div.className='announcement-item';
    div.innerHTML=`
      <p><b>User Name:</b> ${escapeHtml(c.userName || 'Unknown')}</p>
      <p><b>User Email:</b> ${escapeHtml(c.userEmail || 'Unknown')}</p>
      <p><b>Subject:</b> ${escapeHtml(c.subject)}</p>
      <p><b>Category:</b> ${escapeHtml(c.category)}</p>
      <p><b>Message:</b> ${escapeHtml(c.message)}</p>
      <p><b>Status:</b>
        <span class="${c.status==='Resolved'?'resolved':c.status==='In Progress'?'progress':'pending'}">
          ${escapeHtml(c.status)}
        </span>
      </p>
      <select onchange="updateComplaintStatus(${i}, this.value)">
        <option value="Pending" ${c.status==='Pending'?'selected':''}>Pending</option>
        <option value="In Progress" ${c.status==='In Progress'?'selected':''}>In Progress</option>
        <option value="Resolved" ${c.status==='Resolved'?'selected':''}>Resolved</option>
      </select>
      <button class="danger small-btn" onclick="deleteComplaint(${i})">🗑 Delete</button>
    `;
    container.appendChild(div);
  });
}
function updateComplaintStatus(index,newStatus){
  const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
  if(!complaints[index]) return;
  complaints[index].status=newStatus;
  localStorage.setItem('complaints', JSON.stringify(complaints));
  localStorage.setItem('userComplaints', JSON.stringify(complaints));
  loadComplaints();
}
function deleteComplaint(index){
  if(!confirm("Are you sure?")) return;
  const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
  complaints.splice(index,1);
  localStorage.setItem('complaints', JSON.stringify(complaints));
  localStorage.setItem('userComplaints', JSON.stringify(complaints));
  loadComplaints();
  alert("Complaint deleted ✅");
}

// ============================
// 🔹 Stats
// ============================
function loadStats(){
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const uploads = JSON.parse(localStorage.getItem('assignments')) || [];
  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statUploads').textContent = uploads.length;
}

// ============================
// 🔹 Auto Sync (mirror announcements to adminAnnouncements and userAnnouncements)
// ============================
function autoSync(){
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
  localStorage.setItem('adminAnnouncements', JSON.stringify(announcements));
  localStorage.setItem('userAnnouncements', JSON.stringify(announcements));
  localStorage.setItem('userComplaints', JSON.stringify(complaints));
  loadAnnouncements();
  loadStats();
}
setInterval(autoSync,2000);

// ============================
// 🔹 Initial Load
// ============================
loadAnnouncements();
loadComplaints();
loadStats();









/*









function autoDeleteExpiredEvents() {
  let announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  let currentTime = new Date().getTime();

  announcements = announcements.filter(a => {
    if (!a.deadline) return true;
    return new Date(a.deadline).getTime() >= currentTime;
  });

  saveAnnouncements(announcements);
  loadAnnouncements();
}
setInterval(autoDeleteExpiredEvents, 30000);

// ============================
// 🔹 Utility Functions
// ============================
function goBack() { window.location.href = "index.html"; }
function logoutAdmin() { alert("Admin Logged Out"); window.location.href = 'index.html'; }
function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m])) : '';
}

// ============================
// 🔹 Users Table
// ============================
function showUsersTable(){
  document.getElementById('usersTableModal').style.display='block';
  document.body.classList.add('modal-active');
  loadUsersTable();
}

function closeUsersTable(){
  document.getElementById('usersTableModal').style.display='none';
  document.body.classList.remove('modal-active');
}

function loadUsersTable(){
  const tbody = document.getElementById('usersTableBody');
  const users = JSON.parse(localStorage.getItem('users')) || [];
  tbody.innerHTML = '';

  users.forEach((u,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${u.photo ? `<img src="${u.photo}">` : ''}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.password)}</td>
      <td>${u.signupTime || '-'}</td>
      <td><button class="delete-btn" onclick="deleteUser(${i})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteUser(i){
  const users = JSON.parse(localStorage.getItem('users')) || [];
  if(!confirm(`Delete user ${users[i].name}?`)) return;
  users.splice(i,1);
  localStorage.setItem('users', JSON.stringify(users));
  loadUsersTable();
  loadStats();
}

// ============================
// 🔹 Announcements
// ============================
function createAnnouncement() {
  const type = document.getElementById('annType').value;
  const title = document.getElementById('annTitle').value.trim();
  const desc = document.getElementById('annDesc').value.trim();
  const deadline = document.getElementById('annDeadline').value;
  const file = document.getElementById('annFile').files[0];

  if (!title && !desc && !file) { alert("Please enter at least one field"); return; }

  const reader = new FileReader();
  reader.onload = function(e) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const newAnn = {
      type, title, desc, deadline,
      fileName: file ? file.name : null,
      fileURL: file ? e.target.result : null,
      date: new Date().toLocaleString(),
      userUploads: []
    };
    announcements.unshift(newAnn);
    saveAnnouncements(announcements);
    loadAnnouncements();
    clearCreateForm();
    alert("Announcement added ✅");
  };

  if(file) reader.readAsDataURL(file); else reader.onload();
}

function clearCreateForm(){
  document.getElementById('annTitle').value='';
  document.getElementById('annDesc').value='';
  document.getElementById('annDeadline').value='';
  document.getElementById('annFile').value='';
}

function loadAnnouncements(){
  const div = document.getElementById('adminAnnouncementsList');
  div.innerHTML='';
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];

  if(announcements.length===0){ 
    div.innerHTML='<p>No announcements yet</p>'; 
    return; 
  }

  announcements.forEach((a,i)=>{
    const el = document.createElement('div');
    el.className='announcement-item';
    el.innerHTML=`
      <strong>${escapeHtml(a.title)}</strong> (${escapeHtml(a.type)})<br>
      <small>${a.date}</small><br>
      ${a.deadline?`<small>Deadline: ${a.deadline}</small><br>`:''}
      <p>${escapeHtml(a.desc)}</p>
      ${a.fileURL?`<a href="${a.fileURL}" target="_blank" class="file-link">📎 ${escapeHtml(a.fileName)}</a>`:''}
      <br>
      <button class="small-btn" onclick="toggleUserUploads(${i})">👥 View User Uploads (${a.userUploads.length})</button>
      <div id="userUploads-${i}" style="margin-top:8px; display:none;"></div>
      <button class="danger small-btn" onclick="deleteAnnouncement(${i})">Delete</button>
    `;
    div.appendChild(el);
  });
}

function toggleUserUploads(index){
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  const container = document.getElementById(`userUploads-${index}`);

  if(container.style.display==='none'){
    container.style.display='block';
    container.innerHTML='';
    const users = announcements[index].userUploads || [];

    if(users.length===0){ 
      container.innerHTML='<small>No user uploads yet</small>'; 
      return; 
    }

users.forEach((u, j) => {
  const userDiv = document.createElement("div");
  userDiv.className = "user-row";

  userDiv.innerHTML = `
    <strong>${escapeHtml(u.name)}</strong> (${escapeHtml(u.email)})<br>
    ${u.message ? `<p>${escapeHtml(u.message)}</p>` : ''}
    ${u.fileURL ? `<a href="${u.fileURL}" target="_blank">📎 ${escapeHtml(u.fileName)}</a>` : ''}
    <br><small>${u.dateTime || ''}</small>
    <br>
    <button class="danger small-btn" onclick="deleteUserFromAnnouncement(${index}, ${j})">Delete</button>
  `;

  container.appendChild(userDiv);
});




    /*
    users.forEach((u,j)=>{
      const userDiv = document.createElement('div');
      userDiv.className='user-row';
      userDiv.innerHTML=`
        <span>${escapeHtml(u.name)} | ${escapeHtml(u.email)}</span>
        ${u.photo?`<img src="${u.photo}" style="width:30px;height:30px;border-radius:50%;margin-left:5px;">`:''}
        <button class="danger small-btn" onclick="deleteUserFromAnnouncement(${index},${j})">Delete</button>
      `;
      container.appendChild(userDiv);
    });
  
  } else {
    container.style.display='none';
  }
}

function deleteUserFromAnnouncement(annIndex,userIndex){
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  announcements[annIndex].userUploads.splice(userIndex,1);
  saveAnnouncements(announcements);
  loadAnnouncements();
}

function deleteAnnouncement(index){
  if(!confirm("Delete this announcement?")) return;
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  announcements.splice(index,1);
  saveAnnouncements(announcements);
  loadAnnouncements();
  alert("Announcement deleted ✅");
}

function saveAnnouncements(list){
  localStorage.setItem('announcements', JSON.stringify(list));
  localStorage.setItem('adminAnnouncements', JSON.stringify(list));
  localStorage.setItem('userAnnouncements', JSON.stringify(list));
}

// ============================
// 🔹 Complaints — UPDATED
// ============================
function loadComplaints(){
  const container = document.getElementById('allComplaints');
  const complaints = JSON.parse(localStorage.getItem('complaints')) || [];

  if(complaints.length===0){
    container.innerHTML='<p>No complaints found.</p>';
    return;
  }

  container.innerHTML='';

  complaints.forEach((c,i)=>{
    const div = document.createElement('div');
    div.className='announcement-item';

    div.innerHTML=`
      <p><b>User Name:</b> ${escapeHtml(c.userName || 'Unknown')}</p>
      <p><b>User Email:</b> ${escapeHtml(c.userEmail || 'Unknown')}</p>

      <p><b>Subject:</b> ${escapeHtml(c.subject)}</p>
      <p><b>Category:</b> ${escapeHtml(c.category)}</p>
      <p><b>Message:</b> ${escapeHtml(c.message)}</p>

      <p><b>Status:</b>
        <span class="${c.status==='Resolved'?'resolved':c.status==='In Progress'?'progress':'pending'}">
          ${c.status}
        </span>
      </p>

      <select onchange="updateComplaintStatus(${i}, this.value)">
        <option value="Pending" ${c.status==='Pending'?'selected':''}>Pending</option>
        <option value="In Progress" ${c.status==='In Progress'?'selected':''}>In Progress</option>
        <option value="Resolved" ${c.status==='Resolved'?'selected':''}>Resolved</option>
      </select>

      <button class="danger small-btn" onclick="deleteComplaint(${i})">🗑 Delete</button>
    `;

    container.appendChild(div);
  });
}

function updateComplaintStatus(index,newStatus){
  const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
  complaints[index].status=newStatus;
  localStorage.setItem('complaints', JSON.stringify(complaints));
  localStorage.setItem('userComplaints', JSON.stringify(complaints));
  loadComplaints();
}

function deleteComplaint(index){
  if(!confirm("Are you sure?")) return;
  const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
  complaints.splice(index,1);
  localStorage.setItem('complaints', JSON.stringify(complaints));
  localStorage.setItem('userComplaints', JSON.stringify(complaints));
  loadComplaints();
  alert("Complaint deleted ✅");
}

// ============================
// 🔹 Stats
// ============================
function loadStats(){
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const uploads = JSON.parse(localStorage.getItem('assignments')) || [];
  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statUploads').textContent = uploads.length;
}

// ============================
// 🔹 Auto Sync
// ============================
function autoSync(){
  const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
  const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
  localStorage.setItem('adminAnnouncements', JSON.stringify(announcements));
  localStorage.setItem('userAnnouncements', JSON.stringify(announcements));
  localStorage.setItem('userComplaints', JSON.stringify(complaints));
}
setInterval(autoSync,2000);

// ============================
// 🔹 Initial Load
// ============================
loadAnnouncements();
loadComplaints();
loadStats();






*/
