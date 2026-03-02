function openModal() {
  document.getElementById("authModal").classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  document.getElementById("authModal").classList.remove("active");
  document.body.style.overflow = "";
}
document.getElementById("authModal").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

function switchTab(tab) {
  document
    .getElementById("tab-signup")
    .classList.toggle("active", tab === "signup");
  document
    .getElementById("tab-login")
    .classList.toggle("active", tab === "login");
  document.getElementById("form-signup").style.display =
    tab === "signup" ? "block" : "none";
  document.getElementById("form-login").style.display =
    tab === "login" ? "block" : "none";
}

function handleSignup() {
  alert(
    "✅ Account created! Welcome to GradeFlow.\n\nIn the full app, you'd be taken to your dashboard now.",
  );
  closeModal();
}
function handleLogin() {
  alert(
    "✅ Signed in successfully!\n\nIn the full app, you'd be taken to your dashboard now.",
  );
  closeModal();
}

// Smooth nav scroll
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});
