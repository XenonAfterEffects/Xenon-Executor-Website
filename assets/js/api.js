window.XenonApi = (function () {
  var API_BASE = window.XENON_API_BASE || "https://api.xenon.mathcalculator101.xyz";

  function withDefaults(options) {
    var cfg = options || {};
    cfg.method = cfg.method || "GET";
    cfg.headers = cfg.headers || {};
    cfg.headers["Content-Type"] = "application/json";
    return cfg;
  }

  async function request(path, options) {
    var cfg = withDefaults(options);
    var response = await fetch(API_BASE + path, cfg);
    var text = await response.text();
    var data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      data = { raw: text };
    }

    if (!response.ok) {
      var errMessage = data.message || data.error || ("Request failed (" + response.status + ")");
      throw new Error(errMessage);
    }

    return data;
  }

  function authHeader(token) {
    return { Authorization: "Bearer " + token };
  }

  return {
    register: function (payload) {
      return request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },

    login: function (payload) {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },

    redeemKey: function (token, key) {
      return request("/keys/redeem", {
        method: "POST",
        headers: authHeader(token),
        body: JSON.stringify({ key: key })
      });
    },

    getLicense: function (token) {
      return request("/me/license", {
        method: "GET",
        headers: authHeader(token)
      });
    }
  };
})();
