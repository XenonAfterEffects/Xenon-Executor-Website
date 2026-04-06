(function () {
  var token = localStorage.getItem("xenon_token");
  var userRaw = localStorage.getItem("xenon_user");
  var user = null;

  var accountBadge = document.getElementById("accountBadge");
  var licenseStatus = document.getElementById("licenseStatus");
  var licensePlan = document.getElementById("licensePlan");
  var licenseExpiry = document.getElementById("licenseExpiry");
  var redeemForm = document.getElementById("redeemForm");
  var redeemInput = document.getElementById("redeemInput");
  var redeemMessage = document.getElementById("redeemMessage");
  var logoutBtn = document.getElementById("logoutBtn");

  function parseUser() {
    if (!userRaw) return null;
    try {
      return JSON.parse(userRaw);
    } catch (err) {
      return null;
    }
  }

  function redirectToLogin() {
    window.location.href = "login.html";
  }

  function setStatus(text, kind) {
    if (!licenseStatus) return;
    licenseStatus.textContent = text;
    licenseStatus.classList.remove("active", "expired", "pending");
    licenseStatus.classList.add(kind || "pending");
  }

  function setRedeemMessage(text, isError) {
    if (!redeemMessage) return;
    redeemMessage.textContent = text || "";
    redeemMessage.style.color = isError ? "#ff6b7f" : "#4fe49a";
  }

  function fmtDate(value) {
    if (!value) return "-";
    var dt = new Date(value);
    if (Number.isNaN(dt.valueOf())) return String(value);
    return dt.toLocaleString();
  }

  async function loadLicense() {
    setStatus("Checking...", "pending");
    licensePlan.textContent = "-";
    licenseExpiry.textContent = "-";

    try {
      var data = await XenonApi.getLicense(token);
      var active = !!data.active;
      setStatus(active ? "Active" : "Expired", active ? "active" : "expired");
      licensePlan.textContent = data.planName || data.plan || "No plan";
      licenseExpiry.textContent = fmtDate(data.expiresAt || data.expires_at || null);
    } catch (err) {
      setStatus("Unavailable", "expired");
      setRedeemMessage(err.message, true);
    }
  }

  user = parseUser();
  if (!token) {
    redirectToLogin();
    return;
  }

  if (accountBadge) {
    var label = user && (user.username || user.email) ? (user.username || user.email) : "Account";
    accountBadge.textContent = label;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("xenon_token");
      localStorage.removeItem("xenon_user");
      redirectToLogin();
    });
  }

  if (redeemForm) {
    redeemForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var key = String(redeemInput.value || "").trim();
      if (!key) return;

      setRedeemMessage("Redeeming key...", false);
      try {
        await XenonApi.redeemKey(token, key);
        setRedeemMessage("Key redeemed successfully.", false);
        redeemInput.value = "";
        await loadLicense();
      } catch (err) {
        setRedeemMessage(err.message, true);
      }
    });
  }

  loadLicense();
})();
