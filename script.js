/* Muhammad Tauqeer — portfolio interactions */
(function () {
  "use strict";
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById("preloader");
  var preName = document.getElementById("preName");
  var preCount = document.getElementById("preCount");
  var preBarFill = document.getElementById("preBarFill");
  // Split preloader name into animated letters
  (function () {
    var text = preName.textContent;
    preName.textContent = "";
    Array.prototype.forEach.call(text, function (ch, i) {
      var s = document.createElement("span");
      s.className = "pl";
      s.style.setProperty("--i", i);
      s.innerHTML = ch === " " ? "&nbsp;" : ch;
      preName.appendChild(s);
    });
  })();
  var start = null, DURATION = 1500;
  function tick(now) {
    if (!start) start = now;
    var p = Math.min((now - start) / DURATION, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    var val = Math.round(eased * 100);
    preCount.textContent = (val < 10 ? "0" : "") + val;
    preBarFill.style.width = val + "%";
    if (p < 1) requestAnimationFrame(tick);
    else {
      setTimeout(function () {
        preloader.classList.add("done");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { document.body.classList.add("loaded"); });
        });
      }, 250);
    }
  }
  requestAnimationFrame(tick);

  /* ---------- Word-by-word title animation ---------- */
  function splitWords(el) {
    var idx = 0;
    function addWord(text, parent) {
      var w = document.createElement("span"); w.className = "w";
      var wi = document.createElement("span"); wi.className = "wi";
      wi.style.setProperty("--i", idx++);
      wi.textContent = text;
      w.appendChild(wi); parent.appendChild(w);
    }
    function process(node, parent) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) parent.appendChild(document.createTextNode(" "));
          else addWord(part, parent);
        });
      } else if (node.nodeType === 1) {
        var clone = node.cloneNode(false);
        Array.prototype.slice.call(node.childNodes).forEach(function (c) { process(c, clone); });
        parent.appendChild(clone);
      }
    }
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (n) { process(n, frag); });
    el.innerHTML = "";
    el.appendChild(frag);
  }
  document.querySelectorAll(".section-title, .sq-line").forEach(splitWords);

  /* ---------- Staggered group reveals ---------- */
  var staggerKids = new Set();
  var staggerGroups = document.querySelectorAll("[data-stagger]");
  staggerGroups.forEach(function (group) {
    group.querySelectorAll(".reveal").forEach(function (kid) { staggerKids.add(kid); });
  });
  function revealGroup(group) {
    var kids = group.querySelectorAll(".reveal");
    kids.forEach(function (kid, i) {
      kid.classList.remove("reveal-d1", "reveal-d2", "reveal-d3");
      var d = i * 90;
      kid.style.transitionDelay = d + "ms";
      kid.classList.add("visible");
      setTimeout(function () { kid.style.transitionDelay = ""; }, d + 1000);
    });
  }
  if ("IntersectionObserver" in window) {
    var groupIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealGroup(entry.target);
        groupIO.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    staggerGroups.forEach(function (g) { groupIO.observe(g); });
  } else {
    staggerGroups.forEach(revealGroup);
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = [];
  document.querySelectorAll(".reveal").forEach(function (el) {
    if (!staggerKids.has(el)) revealEls.push(el);
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
          // Safety net: on browsers where clip-path transitions misbehave,
          // force the final revealed state so the photo can never stay hidden.
          if (entry.target.classList.contains("reveal-clip")) {
            (function (el) {
              setTimeout(function () {
                var cp = "";
                try { cp = window.getComputedStyle(el).clipPath; } catch (e) {}
                if (cp && cp.indexOf("100%") !== -1) el.style.clipPath = "inset(0% 0% 0% 0%)";
              }, 1400);
            })(entry.target);
          }
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    // Philosophy quote: its words (.wi) rise when the quote itself is revealed
    document.querySelectorAll(".statement-quote").forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
    document.querySelectorAll(".statement-quote").forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Scroll: header, progress, parallax, hide-on-down ---------- */
  var header = document.getElementById("siteHeader");
  var progress = document.querySelector(".scroll-progress");
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));
  var lastY = window.scrollY, scrollTicking = false;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 24);
    var menu = document.getElementById("mobileMenu");
    if (menu && !menu.classList.contains("open")) {
      if (y > 160 && y > lastY + 4) header.classList.add("nav-hidden");
      else if (y < lastY - 4 || y <= 160) header.classList.remove("nav-hidden");
    }
    lastY = y;
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }
    // Parallax: shift elements proportional to distance from viewport center
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute("data-speed"));
      el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
    });
    scrollTicking = false;
  }
  window.addEventListener("scroll", function () {
    if (!scrollTicking) { requestAnimationFrame(onScroll); scrollTicking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    document.body.classList.add("cursor-on");
    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");
    var mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    });
    (function ringLoop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(ringLoop);
    })();
    document.querySelectorAll(".g-item").forEach(function (item) {
      item.addEventListener("mouseenter", function () { ring.classList.add("is-view"); });
      item.addEventListener("mouseleave", function () { ring.classList.remove("is-view"); });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- Lightbox ---------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll("#gallery .g-item"));
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + galleryItems.length) % galleryItems.length;
    var item = galleryItems[lbIndex];
    var img = item.querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = item.getAttribute("data-caption") || "";
  }
  function lbOpen(i) {
    lbShow(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { requestAnimationFrame(function () { lb.classList.add("open"); }); });
  }
  function lbClose() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { lb.hidden = true; }, 450);
  }
  galleryItems.forEach(function (item, i) {
    item.addEventListener("click", function () { lbOpen(i); });
  });
  document.getElementById("lbClose").addEventListener("click", lbClose);
  document.getElementById("lbPrev").addEventListener("click", function (e) { e.stopPropagation(); lbShow(lbIndex - 1); });
  document.getElementById("lbNext").addEventListener("click", function (e) { e.stopPropagation(); lbShow(lbIndex + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lbClose(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
    if (e.key === "ArrowRight") lbShow(lbIndex + 1);
  });

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("menuToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  function closeMenu() {
    mobileMenu.classList.remove("open");
    toggle.classList.remove("open");
    header.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
  }
  toggle.addEventListener("click", function () {
    var open = mobileMenu.classList.toggle("open");
    toggle.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) closeMenu();
  });

  /* ---------- Scrollspy ---------- */
  var spySections = ["work", "about", "contact"].map(function (id) { return document.getElementById(id); });
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".main-nav a"));
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    spySections.forEach(function (s) { if (s) spy.observe(s); });
  }
})();
