/* CORELLE — a PandaTalk chat-asszisztens betöltése (agents.pandatalk.hu).
   A meta.js UTÁN, defer-rel kell betölteni: az addigra már kirakta a süti-sávot, ha kell.
   Keskeny kijelzőn a süti-sáv teljes szélességű, és a chat-buborék a gombjaira ülne,
   ezért ott a widget csak a süti-döntés után töltődik be. Széles kijelzőn a sáv középen,
   legfeljebb 780 px széles, a buborék nem ér bele, így azonnal betöltjük. */
(function () {
  "use strict";
  var SRC = "https://agents.pandatalk.hu/api/widget/cmu5k92qf049nw1zi7vt2dfnr";
  var WIDE = 1000;

  function load() {
    if (document.getElementById("pt-chat-loader")) return;
    var s = document.createElement("script");
    s.id = "pt-chat-loader";
    s.src = SRC;
    s.async = true;
    document.body.appendChild(s);
  }

  function bannerOpen() {
    return !!document.querySelector("[data-consent-banner]");
  }

  function start() {
    if (!bannerOpen() || window.innerWidth >= WIDE) {
      load();
      return;
    }
    var mo = new MutationObserver(function () {
      if (!bannerOpen()) {
        mo.disconnect();
        load();
      }
    });
    mo.observe(document.body, { childList: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
