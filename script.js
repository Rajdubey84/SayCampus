


  
    // 🔄 Text Swipe Logic
    const texts = document.querySelectorAll(".swipe-text");
    const swipeBox = document.getElementById("swipeBox");
    let index = 0;

    setInterval(() => {
      texts[index].classList.remove("active");
      index = (index + 1) % texts.length;
      texts[index].classList.add("active");
    }, 2500);

    // 🧠 Hide/Show swipe animation depending on form visibility
    function showSwipeBox() {
      swipeBox.classList.remove("hidden");
    }

    function hideSwipeBox() {
      swipeBox.classList.add("hidden");
    }

    // 👇 Extend existing login/signup toggle functions
    function toggleLogin() {
      hideSwipeBox();
      document.getElementById("signupCard").classList.add("hidden");
      const loginCard = document.getElementById("loginCard");
      loginCard.classList.toggle("hidden");
      if (loginCard.classList.contains("hidden")) showSwipeBox();
    }

    function toggleSignup() {
      hideSwipeBox();
      document.getElementById("loginCard").classList.add("hidden");
      const signupCard = document.getElementById("signupCard");
      signupCard.classList.toggle("hidden");
      if (signupCard.classList.contains("hidden")) showSwipeBox();
    }


    

      
  // ================================
  // 🧑‍💼 Admin Page Loader
  // ================================
  function openAdminPage() {
    // Hide all existing page content
    document.querySelector("header").style.display = "none";
    document.querySelector(".hero").style.display = "none";
    document.getElementById("mainFooter").style.display = "none";

    // Create new full admin login page dynamically
    const adminSection = document.createElement("div");
    adminSection.id = "adminLoginPage";
    adminSection.style.cssText = `
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      height:100vh;
      background:linear-gradient(135deg,#16213e,#0f3460);
      color:white;
      text-align:center;
    `;
    adminSection.innerHTML = `
      <div style="background:white;color:black;padding:30px;border-radius:15px;box-shadow:0 0 15px rgba(0,0,0,0.3);width:320px;">
        <h2>👨‍💼 Admin Login</h2>
        <input type="text" id="adminUsername" placeholder="Username" style="width:100%;padding:10px;margin:8px 0;border-radius:8px;border:1px solid #ccc;"><br>
        <input type="email" id="adminEmail" placeholder="Email" style="width:100%;padding:10px;margin:8px 0;border-radius:8px;border:1px solid #ccc;"><br>
        <input type="password" id="adminPassword" placeholder="Password" style="width:100%;padding:10px;margin:8px 0;border-radius:8px;border:1px solid #ccc;"><br>
        <button onclick="verifyAdmin()" style="background:#0f3460;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;">Login</button>
        <br><br>
        <button onclick="backToHome()" style="background:#ccc;color:black;padding:8px 15px;border:none;border-radius:8px;cursor:pointer;">Back to Home</button>
      </div>
    `;
    document.body.appendChild(adminSection);
  }

  // ✅ Verify Admin Credentials
  function verifyAdmin() {
    const user = document.getElementById("adminUsername").value.trim();
    const email = document.getElementById("adminEmail").value.trim();
    const pass = document.getElementById("adminPassword").value.trim();

    // Change these to your real credentials
    const adminUser = "admin";
    const adminEmail = "admin@gmail.com";
    const adminPass = "12345";

    if (user === adminUser && email === adminEmail && pass === adminPass) {
      alert("✅ Welcome Admin!");
      window.location.href = "admin.html";
    } else {
      alert("❌ Wrong credentials! Access Denied.");
    }
  }

  // 🔙 Back to Home Function
  function backToHome() {
    document.getElementById("adminLoginPage").remove();
    document.querySelector("header").style.display = "block";
    document.querySelector(".hero").style.display = "flex";
    document.getElementById("mainFooter").style.display = "grid";
  }
  









// 🌐 Show/Hide Login-Signup Form in Same Box
function toggleLogin() {
  document.getElementById("signupCard").classList.add("hidden");
  const loginCard = document.getElementById("loginCard");
  loginCard.classList.toggle("hidden");

  if (!loginCard.classList.contains("hidden")) addCloseButton();
  else removeCloseButton();
}

function toggleSignup() {
  document.getElementById("loginCard").classList.add("hidden");
  const signupCard = document.getElementById("signupCard");
  signupCard.classList.toggle("hidden");

  if (!signupCard.classList.contains("hidden")) addCloseButton();
  else removeCloseButton();
}

// 🧩 Add Close Button
function addCloseButton() {
  if (document.getElementById("closeBtn")) return;
  const formSide = document.querySelector(".form-side");
  const btn = document.createElement("button");
  btn.id = "closeBtn";
  btn.textContent = "× Close";
  btn.className = "close-btn";
  btn.onclick = closeAuthForm;
  formSide.appendChild(btn);
}

// ❌ Close Login/Signup Form and Show Go to Dashboard
function closeAuthForm() {
  document.getElementById("loginCard").classList.add("hidden");
  document.getElementById("signupCard").classList.add("hidden");
  removeCloseButton();
  showGoToDashboard();
}

function removeCloseButton() {
  const btn = document.getElementById("closeBtn");
  if (btn) btn.remove();
}

// 🎯 Show "Go to Dashboard" Button
function showGoToDashboard() {
  if (document.getElementById("goDashboardBtn")) return;
  const formSide = document.querySelector(".form-side");
  const btn = document.createElement("button");
  btn.id = "goDashboardBtn";
  btn.textContent = "Go to Dashboard";
  btn.className = "dashboard-btn";
  btn.onclick = goToComplaint;
  formSide.appendChild(btn);
}

// 🚪 Signup Function
function userSignup() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!name || !email || !password) {
    alert("Please fill all fields!");
    return;
  }

  const user = { name, email, password, photo: "default-user.png" };
  localStorage.setItem("user_" + email, JSON.stringify(user));
  alert("Signup successful! Please login.");
  toggleLogin();
}

// 🔑 Login Function
function userLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const user = JSON.parse(localStorage.getItem("user_" + email));

  if (!user || user.password !== password) {
    alert("Invalid credentials!");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  alert("Welcome " + user.name + "!");
  afterLoginSetup();
}

// 🧠 After Login UI Setup
function afterLoginSetup() {
  document.getElementById("loginNav").classList.add("hidden");
  document.getElementById("signupNav").classList.add("hidden");
  document.getElementById("profileNav").classList.remove("hidden");

  closeAuthForm();

  const user = JSON.parse(localStorage.getItem("currentUser"));
  document.getElementById("navProfileImage").src = user.photo || "default-user.png";
  document.getElementById("userName").textContent = user.name;
  document.getElementById("userEmail").textContent = user.email;
}

// 👤 Profile Menu Toggle (only name, email, close)
function toggleProfileMenu() {
  document.getElementById("profileMenu").classList.toggle("hidden");
}

function closeProfileMenu() {
  document.getElementById("profileMenu").classList.add("hidden");
}

// 🚪 Logout
function logoutUser() {
  localStorage.removeItem("currentUser");
  alert("Logged out successfully!");
  location.reload();
}

// 📤 Go to Dashboard
function goToComplaint() {
  window.location.href = "dashboard.html";
}

// ⚙️ Auto Load
window.onload = () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (user) afterLoginSetup();
};
