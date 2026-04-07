(function () {
  var token = localStorage.getItem("xenon_token");
  var userRaw = localStorage.getItem("xenon_user");
  var user = null;

  var dashboardNav = document.getElementById("dashboardNav");
  var sectionNodes = document.querySelectorAll(".dash-section");
  var refreshLicenseBtn = document.getElementById("refreshLicenseBtn");
  var accountBadge = document.getElementById("accountBadge");
  var licenseStatus = document.getElementById("licenseStatus");
  var licensePlan = document.getElementById("licensePlan");
  var licenseExpiry = document.getElementById("licenseExpiry");
  var redeemForm = document.getElementById("redeemForm");
  var redeemInput = document.getElementById("redeemInput");
  var redeemMessage = document.getElementById("redeemMessage");
  var billingPlans = document.getElementById("billingPlans");
  var billingMessage = document.getElementById("billingMessage");
  var deviceAccount = document.getElementById("deviceAccount");
  var deviceLastRefresh = document.getElementById("deviceLastRefresh");
  var refreshDevicesBtn = document.getElementById("refreshDevicesBtn");
  var deviceMessage = document.getElementById("deviceMessage");
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

  function activateSection(sectionId) {
    var tabs = dashboardNav ? dashboardNav.querySelectorAll(".dash-tab") : [];
    tabs.forEach(function (tab) {
      var isActive = tab.getAttribute("data-section") === sectionId;
      tab.classList.toggle("active", isActive);
    });

    sectionNodes.forEach(function (section) {
      section.classList.toggle("active", section.id === sectionId);
    });
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

  function setBillingMessage(text, isError) {
    if (!billingMessage) return;
    billingMessage.textContent = text || "";
    billingMessage.style.color = isError ? "#ff6b7f" : "#4fe49a";
  }

  function setDeviceMessage(text, isError) {
    if (!deviceMessage) return;
    deviceMessage.textContent = text || "";
    deviceMessage.style.color = isError ? "#ff6b7f" : "#4fe49a";
  }

  function fmtDate(value) {
    if (!value) return "-";
    var dt = new Date(value);
    if (Number.isNaN(dt.valueOf())) return String(value);
    return dt.toLocaleString();
  }

  function fmtPrice(value) {
    var num = Number(value || 0);
    return "$" + num.toFixed(2);
  }

  function fmtDuration(hours) {
    var h = Number(hours || 0);
    if (h === 24) return "24 hours";
    if (h % 24 === 0) {
      var days = h / 24;
      if (days === 30) return "30 days";
      if (days === 90) return "90 days";
      if (days === 365) return "1 year";
      return days + " days";
    }
    return h + " hours";
  }

  function renderPlans(plans) {
    if (!billingPlans) return;
    billingPlans.innerHTML = "";

    if (!Array.isArray(plans) || plans.length === 0) {
      billingPlans.innerHTML = "<p class=\"small-note\">No plans are available right now.</p>";
      return;
    }

    plans.forEach(function (plan) {
      var card = document.createElement("article");
      card.className = "price-card" + (plan.isBestValue ? " featured" : "");

      var badge = plan.isBestValue ? "<p class=\"plan-badge\">BEST VALUE</p>" : "";
      card.innerHTML = [
        badge,
        "<h3>" + (plan.name || plan.code || "Plan") + "</h3>",
        "<p class=\"price\">" + fmtPrice(plan.priceUsd) + "<span>/" + fmtDuration(plan.durationHours) + "</span></p>",
        "<ul>",
        "<li>Instant activation</li>",
        "<li>Same executor features</li>",
        "<li>License tied to this account</li>",
        "</ul>",
        "<button class=\"btn " + (plan.isBestValue ? "primary" : "ghost") + " block buy-plan-btn\" type=\"button\" data-plan=\"" + plan.code + "\">Buy " + (plan.name || "Plan") + "</button>"
      ].join("");

      billingPlans.appendChild(card);
    });
  }

  async function loadPlans() {
    setBillingMessage("Loading plans...", false);
    try {
      var plans = await XenonApi.getPlans();
      renderPlans(plans);
      setBillingMessage("Choose a plan to activate.", false);
    } catch (err) {
      setBillingMessage(err.message, true);
    }
  }

  async function buyPlan(planCode, btn) {
    if (!planCode) return;

    if (btn) btn.disabled = true;
    setBillingMessage("Processing purchase...", false);

    try {
      var result = await XenonApi.buyPlan(token, planCode);
      var expiresText = fmtDate(result.expiresAtUtc);
      var keyText = result.key ? " Key: " + result.key : "";
      setBillingMessage((result.message || "Plan activated.") + " Expires: " + expiresText + "." + keyText, false);
      activateSection("overviewSection");
      await loadLicense();
    } catch (err) {
      setBillingMessage(err.message, true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function refreshDevicesView() {
    if (deviceAccount) {
      deviceAccount.textContent = user && (user.username || user.email) ? (user.username + " (" + user.email + ")") : "Unknown account";
    }
    if (deviceLastRefresh) {
      deviceLastRefresh.textContent = new Date().toLocaleString();
    }
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

  if (dashboardNav) {
    dashboardNav.addEventListener("click", function (e) {
      var target = e.target;
      if (!target || !target.classList || !target.classList.contains("dash-tab")) return;
      var sectionId = target.getAttribute("data-section");
      if (!sectionId) return;
      activateSection(sectionId);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("xenon_token");
      localStorage.removeItem("xenon_user");
      redirectToLogin();
    });
  }

  if (refreshLicenseBtn) {
    refreshLicenseBtn.addEventListener("click", function () {
      loadLicense();
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

  if (billingPlans) {
    billingPlans.addEventListener("click", function (e) {
      var target = e.target;
      if (!target || !target.classList || !target.classList.contains("buy-plan-btn")) return;
      var planCode = target.getAttribute("data-plan");
      buyPlan(planCode, target);
    });
  }

  if (refreshDevicesBtn) {
    refreshDevicesBtn.addEventListener("click", function () {
      refreshDevicesView();
      setDeviceMessage("Device list refreshed.", false);
    });
  }

  refreshDevicesView();
  loadPlans();
  loadLicense();
})();
