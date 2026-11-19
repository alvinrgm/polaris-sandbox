// The lift demo player page (yt.html): reads ?v=<video id> and frames YouTube's privacy-enhanced player, sending this
// page's https origin as the Referer YouTube needs (Error 153 without one). Anything but an 11-character id shows nothing.
(function () {
  var v = new URLSearchParams(location.search).get("v") || "";
  if (!/^[A-Za-z0-9_-]{11}$/.test(v)) return;
  var f = document.createElement("iframe");
  f.src = "https://www.youtube-nocookie.com/embed/" + v + "?playsinline=1&rel=0&origin=" + encodeURIComponent(location.origin);
  f.title = "Demo video";
  f.referrerPolicy = "strict-origin-when-cross-origin";
  f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  f.allowFullscreen = true;
  document.body.appendChild(f);
})();
