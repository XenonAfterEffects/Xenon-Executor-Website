(function () {
  var loginForm = document.getElementById("loginForm");
  var registerForm = document.getElementById("registerForm");
  var messageEl = document.getElementById("formMessage");

  function showMessage(text, isError) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.style.color = isError ? "#ff6b7f" : "#4fe49a";
  }

  function saveSession(payload) {
    if (!payload) return;
    if (payload.token) localStorage.setItem("xenon_token", payload.token);
    if (payload.user) localStorage.setItem("xenon_user", JSON.stringify(payload.user));
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      showMessage("Creating account...", false);

      var formData = new FormData(registerForm);
      var payload = {
        username: String(formData.get("username") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || "")
      };

      try {
        await XenonApi.register(payload);
        showMessage("Account created. Redirecting to login...", false);
        setTimeout(function () {
          window.location.href = "login.html";
        }, 700);
      } catch (err) {
        showMessage(err.message, true);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      showMessage("Logging in...", false);

      var formData = new FormData(loginForm);
      var payload = {
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || "")
      };

      try {
        var data = await XenonApi.login(payload);
        saveSession(data);
        showMessage("Success. Redirecting...", false);
        setTimeout(function () {
          window.location.href = "dashboard.html";
        }, 450);
      } catch (err) {
        showMessage(err.message, true);
      }
    });
  }
})();
