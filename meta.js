/*
 * CORELLE Pilates — süti-hozzájárulás és Meta Pixel a corelle.hu statikus oldalain.
 * Ugyanazt a döntés-sütit (corelle_consent) használja, mint a foglaló app, *.corelle.hu-n közösen.
 * Hozzájárulás nélkül a Meta kódja NEM töltődik be. Üres PIXEL_ID mellett csak a süti-sáv működik.
 */
(function () {
  "use strict";

  var PIXEL_ID = "2135792307338633";
  // a foglaló app címei: ezekre a linkekre visszük tovább a kampányparamétereket, és ezeken mérjük a kattintást
  var APP_HOSTS = ["foglalas.corelle.hu", "corelle-app-production.up.railway.app"];

  var CONSENT = "corelle_consent";
  var FIRST_TOUCH = "corelle_ft";
  var CONSENT_AGE = 180 * 24 * 3600;
  var FIRST_TOUCH_AGE = 90 * 24 * 3600;
  var CARRY = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid"];

  var landingSearch = location.search;
  var landingPath = location.pathname;

  /* ---------- sütik ---------- */

  function domainAttr() {
    var h = location.hostname;
    return h === "corelle.hu" || /\.corelle\.hu$/.test(h) ? "; Domain=.corelle.hu" : "";
  }
  function readCookie(name) {
    var parts = document.cookie ? document.cookie.split("; ") : [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].indexOf(name + "=") === 0) return parts[i].slice(name.length + 1);
    }
    return "";
  }
  function writeCookie(name, value, maxAge) {
    document.cookie =
      name + "=" + value + "; Max-Age=" + maxAge + "; Path=/; SameSite=Lax" + domainAttr() + (location.protocol === "https:" ? "; Secure" : "");
  }
  function deleteCookie(name) {
    document.cookie = name + "=; Max-Age=0; Path=/";
    if (domainAttr()) document.cookie = name + "=; Max-Age=0; Path=/" + domainAttr();
  }
  function consent() {
    var v = readCookie(CONSENT);
    if (v.indexOf("v1.granted") === 0) return "granted";
    if (v.indexOf("v1.denied") === 0) return "denied";
    return null;
  }

  /* ---------- kampányparaméterek ---------- */

  function landingParams() {
    var out = [];
    try {
      var p = new URLSearchParams(landingSearch);
      for (var i = 0; i < CARRY.length; i++) {
        var v = p.get(CARRY[i]);
        if (v && v.length <= 500) out.push([CARRY[i], v]);
      }
    } catch (e) {}
    return out;
  }

  function isAppLink(a) {
    return a && a.hostname && APP_HOSTS.indexOf(a.hostname) !== -1;
  }

  // A hirdetésből érkező látogató kampányadatát a foglaló linkekre is ráírjuk (süti nélkül, az URL-ben).
  function decorateLinks() {
    var params = landingParams();
    if (!params.length) return;
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (!isAppLink(a)) continue;
      try {
        var u = new URL(a.href);
        for (var j = 0; j < params.length; j++) {
          if (!u.searchParams.has(params[j][0])) u.searchParams.set(params[j][0], params[j][1]);
        }
        a.href = u.toString();
      } catch (e) {}
    }
  }

  // Első látogatás adatai: csak hozzájárulással, és csak ha még nincs.
  function saveFirstTouch() {
    if (readCookie(FIRST_TOUCH)) return;
    var params = landingParams();
    if (!params.length) return;
    var map = {};
    for (var i = 0; i < params.length; i++) map[params[i][0]] = params[i][1].slice(0, params[i][0] === "fbclid" ? 500 : 150);
    var ft = {
      s: map.utm_source,
      m: map.utm_medium,
      c: map.utm_campaign,
      t: map.utm_content,
      f: map.fbclid,
      l: landingPath.slice(0, 200),
      ts: Date.now(),
    };
    writeCookie(FIRST_TOUCH, encodeURIComponent(JSON.stringify(ft)), FIRST_TOUCH_AGE);
  }

  /* ---------- Meta Pixel ---------- */

  var pixelLoaded = false;
  function loadPixel() {
    if (pixelLoaded || !PIXEL_ID || consent() !== "granted") return;
    pixelLoaded = true;
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function onClick(e) {
    if (!window.fbq || consent() !== "granted") return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (isAppLink(a)) {
      var path = a.pathname || "";
      window.fbq("trackCustom", "FoglalasKattintas", { cel: path.indexOf("regisztracio") !== -1 ? "regisztracio" : path.indexOf("belepes") !== -1 ? "belepes" : "orarend" });
    } else if (href.indexOf("tel:") === 0) {
      window.fbq("track", "Contact", { content_name: "telefon" });
    } else if (href.indexOf("mailto:") === 0) {
      window.fbq("track", "Contact", { content_name: "email" });
    } else if (/instagram\.com/.test(href)) {
      window.fbq("trackCustom", "InstagramKattintas");
    }
  }

  /* ---------- süti-sáv ---------- */

  var banner = null;

  function css() {
    if (document.getElementById("cc-style")) return;
    var s = document.createElement("style");
    s.id = "cc-style";
    s.textContent =
      ".cc{position:fixed;left:0;right:0;bottom:0;z-index:90;padding:0 12px 12px;font-family:'Jost',system-ui,sans-serif}" +
      ".cc-box{max-width:780px;margin:0 auto;background:rgba(250,247,242,.97);border:1px solid rgba(28,24,19,.13);border-radius:18px;" +
      "box-shadow:0 10px 40px rgba(28,24,19,.16);padding:16px 20px;display:flex;gap:14px 22px;align-items:center;flex-wrap:wrap;" +
      "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}" +
      ".cc p{flex:1 1 320px;margin:0;font-size:.84rem;line-height:1.5;color:#2a241c}" +
      ".cc p b{font-weight:500;color:#1c1813}" +
      ".cc a{color:#7f5c20;border-bottom:1px solid rgba(168,125,60,.45);text-decoration:none;white-space:nowrap}" +
      ".cc-btns{display:flex;gap:8px;flex:0 0 auto}" +
      ".cc button{font-family:inherit;font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;border-radius:40px;padding:12px 20px;" +
      "cursor:pointer;border:1px solid #1c1813;white-space:nowrap;transition:background .25s,color .25s}" +
      ".cc .cc-no{background:none;color:#1c1813}.cc .cc-no:hover{background:#1c1813;color:#faf7f2}" +
      ".cc .cc-yes{background:#1c1813;color:#faf7f2}.cc .cc-yes:hover{background:#3a332a}" +
      "@media(max-width:560px){.cc{padding:0 8px 8px}.cc-box{padding:14px 16px}.cc-btns{width:100%}.cc button{flex:1;padding:12px 10px}}";
    document.head.appendChild(s);
  }

  function privacyHref() {
    return "/adatkezeles.html#sutik";
  }

  function showBanner() {
    if (banner) return;
    css();
    banner = document.createElement("div");
    banner.className = "cc";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Süti-beállítások");
    banner.setAttribute("data-consent-banner", "");
    banner.innerHTML =
      '<div class="cc-box"><p><b>Sütiket használunk.</b> A szükségesek az oldal és a foglalás működéséhez kellenek. ' +
      "Ha elfogadod, a Meta (Facebook, Instagram) mérőkódját is betöltjük, így látjuk, melyik hirdetésünk működik. " +
      '<a href="' + privacyHref() + '">Részletek</a></p>' +
      '<div class="cc-btns"><button type="button" class="cc-no">Csak a szükségesek</button>' +
      '<button type="button" class="cc-yes">Elfogadom</button></div></div>';
    banner.querySelector(".cc-no").addEventListener("click", function () {
      choose(false);
    });
    banner.querySelector(".cc-yes").addEventListener("click", function () {
      choose(true);
    });
    document.body.appendChild(banner);
    pad();
    window.addEventListener("resize", pad);
  }

  function pad() {
    if (banner) document.body.style.paddingBottom = banner.offsetHeight + 12 + "px";
  }

  function hideBanner() {
    if (!banner) return;
    window.removeEventListener("resize", pad);
    banner.parentNode.removeChild(banner);
    banner = null;
    document.body.style.paddingBottom = "";
  }

  function choose(granted) {
    var before = consent();
    writeCookie(CONSENT, "v1." + (granted ? "granted" : "denied") + "." + Math.floor(Date.now() / 1000), CONSENT_AGE);
    hideBanner();
    if (granted) {
      saveFirstTouch();
      loadPixel();
    } else {
      deleteCookie("_fbp");
      deleteCookie("_fbc");
      deleteCookie(FIRST_TOUCH);
      // a már betöltött mérőkódot csak újratöltéssel lehet eltávolítani
      if (before === "granted") {
        if (window.fbq) window.fbq("consent", "revoke");
        location.reload();
      }
    }
  }

  /* ---------- indulás ---------- */

  function init() {
    decorateLinks();
    document.addEventListener("click", onClick, true);
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-cookie-settings]") : null;
      if (!t) return;
      e.preventDefault();
      showBanner();
    });
    var c = consent();
    if (c === "granted") loadPixel();
    else if (c === null) showBanner();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
