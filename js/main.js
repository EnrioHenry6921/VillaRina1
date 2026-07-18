/* ============================================================
   Villa Rina — main.js
   Smooth scrolling, scroll reveals, counters, parallax, nav,
   photo tour, filters, lightbox, carousel, accordion, distance
   explorer, forms and the EN/DE/HR language switcher.
   No frameworks — everything below is vanilla JS.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LANG_KEY = "vr-lang";
  var LANGS = ["en", "de", "hr"];

  /* ---------------------------------------------- i18n ---- */
  var currentLang = "en";

  function t(key) {
    var dict = window.VR_TRANSLATIONS || VR_TRANSLATIONS;
    return (dict[currentLang] && dict[currentLang][key]) || (dict.en && dict.en[key]) || "";
  }

  function applyLang(lang, persist) {
    if (LANGS.indexOf(lang) === -1) lang = "en";
    currentLang = lang;
    if (persist) {
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* private mode */ }
    }
    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = t(el.getAttribute("data-i18n"));
      if (val) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var val = t(el.getAttribute("data-i18n-ph"));
      if (val) el.setAttribute("placeholder", val);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var val = t(el.getAttribute("data-i18n-aria"));
      if (val) el.setAttribute("aria-label", val);
    });

    var page = document.body.getAttribute("data-page");
    var title = t("meta.title." + page);
    if (title) document.title = title;

    document.querySelectorAll("[data-lang-current]").forEach(function (el) {
      el.textContent = lang.toUpperCase();
    });
    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      var active = btn.getAttribute("data-set-lang") === lang;
      btn.classList.toggle("is-active", active);
      if (btn.hasAttribute("role")) btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    document.dispatchEvent(new CustomEvent("vr:langchange", { detail: { lang: lang } }));
  }

  function initLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
    applyLang(saved || "en", false);

    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLang(btn.getAttribute("data-set-lang"), true);
        closeLangMenu();
      });
    });

    var lang = document.querySelector(".lang");
    var langBtn = document.querySelector(".lang-btn");
    function closeLangMenu() {
      if (!lang) return;
      lang.classList.remove("is-open");
      if (langBtn) langBtn.setAttribute("aria-expanded", "false");
    }
    if (lang && langBtn) {
      langBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = lang.classList.toggle("is-open");
        langBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.addEventListener("click", function (e) {
        if (!lang.contains(e.target)) closeLangMenu();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLangMenu();
      });
    }
  }

  /* ------------------------------------- Smooth scrolling ---- */
  var lenis = null;

  function initSmoothScroll() {
    if (!reduceMotion && typeof window.Lenis === "function") {
      lenis = new window.Lenis({
        duration: 1.15,
        easing: function (x) { return Math.min(1, 1.001 - Math.pow(2, -10 * x)); },
      });
      var raf = function (time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    // Anchor links glide to their target with either engine.
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = -20;
        if (lenis) {
          lenis.scrollTo(target, { offset: offset, duration: 1.4 });
        } else {
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
      });
    });
  }

  function currentScrollY() {
    return lenis ? lenis.scroll : (window.scrollY || window.pageYOffset);
  }

  function onScroll(fn) {
    if (lenis) {
      lenis.on("scroll", fn);
    } else {
      window.addEventListener("scroll", fn, { passive: true });
    }
  }

  function stopScrolling() {
    if (lenis) lenis.stop();
    document.documentElement.style.overflow = "hidden";
  }

  function resumeScrolling() {
    if (lenis) lenis.start();
    document.documentElement.style.overflow = "";
  }

  /* ------------------------------------------- Navbar ---- */
  function initNav() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var solid = nav.hasAttribute("data-nav-solid");
    var lastY = 0;

    function update() {
      var y = currentScrollY();
      nav.classList.toggle("is-scrolled", solid || y > 10);
      if (document.body.classList.contains("menu-open")) {
        nav.classList.remove("is-hidden");
      } else if (y > lastY + 6 && y > 420) {
        nav.classList.add("is-hidden");
      } else if (y < lastY - 6 || y < 420) {
        nav.classList.remove("is-hidden");
      }
      lastY = y;
    }
    onScroll(update);
    update();
  }

  /* -------------------------------------- Mobile menu ---- */
  function initMobileMenu() {
    var burger = document.querySelector("[data-burger]");
    var menu = document.getElementById("mobileMenu");
    if (!burger || !menu) return;

    function setOpen(open) {
      burger.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      burger.setAttribute("aria-label", t(open ? "a11y.menuClose" : "a11y.menuOpen"));
      if (open) { stopScrolling(); } else { resumeScrolling(); }
    }

    burger.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
    });
  }

  /* --------------------------------- Scroll reveals ---- */
  function initReveals() {
    // Stagger children of reveal groups.
    document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
      var kids = group.querySelectorAll("[data-reveal]");
      kids.forEach(function (el, i) {
        el.style.setProperty("--d", Math.min(i * 90, 540) + "ms");
      });
    });

    var els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

    els.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------- Animated counters ---- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function animate(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dur = 1600;
      var start = null;
      var valueEl = el.querySelector(".stat-value") || el;
      function frame(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(2, -10 * p);
        if (p === 1) eased = 1;
        valueEl.textContent = Math.round(target * eased).toString();
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (reduceMotion || !("IntersectionObserver" in window)) return; // static values stay

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------ Parallax ---- */
  function initParallax() {
    if (reduceMotion) return;

    var heroLayer = document.querySelector("[data-parallax-hero]");
    var items = [];
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      items.push({ el: el, f: parseFloat(el.getAttribute("data-parallax")) || 0.12, y: 0 });
    });
    if (!heroLayer && !items.length) return;

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var y = currentScrollY();

      if (heroLayer) {
        var shift = Math.min(y * 0.14, vh * 0.12);
        heroLayer.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
      }
      items.forEach(function (it) {
        var r = it.el.getBoundingClientRect();
        var top = r.top - it.y; // untransformed position
        if (top + r.height < -160 || top > vh + 160) return;
        var center = top + r.height / 2 - vh / 2;
        it.y = -center * it.f;
        it.el.style.transform = "translate3d(0," + it.y.toFixed(1) + "px,0)";
      });
    }
    function request() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    onScroll(request);
    window.addEventListener("resize", request);
    update();
  }

  /* ---------------------------------------- Photo tour ---- */
  function initTour() {
    var tabs = document.querySelectorAll(".tour-tab");
    var media = document.querySelector(".tour-media");
    if (!tabs.length || !media) return;

    var TOUR_IMAGES = {
      villa: { src: "images/outdoors3.jpg", alt: "Villa Rina with its pool and sun loungers on a summer day" },
      bedrooms: { src: "images/bedroom3r.jpg", alt: "Modern double bedroom with sea view at Villa Rina" },
      terrace: { src: "images/outdoors7.jpg", alt: "Outdoor dining table on the covered terrace with a sea view" },
      kitchen: { src: "images/kitchen4r.jpg", alt: "Dining table with a sea view in the Villa Rina kitchen" },
      living: { src: "images/living1r.jpg", alt: "Open-plan living room with corner sofa at Villa Rina" },
      bath: { src: "images/wc1r.jpg", alt: "Modern bathroom with bathtub and wave-relief tiles at Villa Rina" },
    };

    var layers = media.querySelectorAll("img");
    var titleEl = document.querySelector("[data-tour-title]");
    var descEl = document.querySelector("[data-tour-desc]");
    var swapEls = document.querySelectorAll(".tour-swap");
    var activeLayer = 0;
    var current = "villa";

    // Preload tour images for instant swaps.
    Object.keys(TOUR_IMAGES).forEach(function (k) {
      var img = new Image();
      img.src = TOUR_IMAGES[k].src;
    });

    function select(area, instant) {
      if (area === current && !instant) return;
      current = area;

      tabs.forEach(function (tab) {
        var active = tab.getAttribute("data-tour") === area;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.setAttribute("tabindex", active ? "0" : "-1");
      });

      // Crossfade image layers.
      var next = layers[1 - activeLayer];
      var prev = layers[activeLayer];
      next.src = TOUR_IMAGES[area].src;
      next.alt = TOUR_IMAGES[area].alt;
      var show = function () {
        next.classList.add("is-active");
        prev.classList.remove("is-active");
        activeLayer = 1 - activeLayer;
      };
      if (next.complete) { show(); } else { next.onload = show; }

      // Swap text with a soft fade.
      if (titleEl && descEl) {
        swapEls.forEach(function (el) { el.classList.add("is-out"); });
        window.setTimeout(function () {
          titleEl.setAttribute("data-i18n", "tour." + area + ".t");
          descEl.setAttribute("data-i18n", "tour." + area + ".d");
          titleEl.textContent = t("tour." + area + ".t");
          descEl.textContent = t("tour." + area + ".d");
          swapEls.forEach(function (el) { el.classList.remove("is-out"); });
        }, reduceMotion ? 0 : 250);
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab.getAttribute("data-tour")); });
      tab.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var nextTab = tabs[(i + dir + tabs.length) % tabs.length];
        nextTab.focus();
        select(nextTab.getAttribute("data-tour"));
      });
    });
  }

  /* --------------------- Filterable grids (amenities, gallery) ---- */
  function initFilters(tabsSelector, itemsSelector) {
    var tabsWrap = document.querySelector(tabsSelector);
    if (!tabsWrap) return;
    var buttons = tabsWrap.querySelectorAll("[data-filter]");
    var items = document.querySelectorAll(itemsSelector);
    var timers = new WeakMap();

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });

        items.forEach(function (item) {
          var match = filter === "all" || item.getAttribute("data-cat") === filter;
          var pending = timers.get(item);
          if (pending) { clearTimeout(pending); timers.delete(item); }

          if (match) {
            item.classList.remove("is-gone");
            // Double rAF so the un-hide registers before the transition starts.
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                item.classList.remove("is-filtered");
              });
            });
          } else {
            item.classList.add("is-filtered");
            if (reduceMotion) {
              item.classList.add("is-gone");
            } else {
              timers.set(item, window.setTimeout(function () {
                item.classList.add("is-gone");
                timers.delete(item);
              }, 420));
            }
          }
        });
      });
    });
  }

  /* ---------------------------------------- Lightbox ---- */
  function initLightbox() {
    var anchors = Array.prototype.slice.call(document.querySelectorAll(".g-item"));
    if (!anchors.length) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("data-i18n-aria", "a11y.lightbox");
    box.setAttribute("aria-label", t("a11y.lightbox"));
    box.innerHTML =
      '<figure class="lightbox-fig">' +
      '<div class="lightbox-img-wrap"><img alt=""></div>' +
      '<figcaption class="lightbox-cap"><span class="lightbox-text"></span>' +
      '<span class="lightbox-count"></span></figcaption>' +
      "</figure>" +
      '<button class="lightbox-btn lightbox-prev" data-i18n-aria="a11y.prevPhoto" aria-label="' + t("a11y.prevPhoto") + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<button class="lightbox-btn lightbox-next" data-i18n-aria="a11y.nextPhoto" aria-label="' + t("a11y.nextPhoto") + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '<button class="lightbox-btn lightbox-close" data-i18n-aria="a11y.close" aria-label="' + t("a11y.close") + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
    document.body.appendChild(box);

    var img = box.querySelector("img");
    var text = box.querySelector(".lightbox-text");
    var count = box.querySelector(".lightbox-count");
    var btnPrev = box.querySelector(".lightbox-prev");
    var btnNext = box.querySelector(".lightbox-next");
    var btnClose = box.querySelector(".lightbox-close");

    var visible = [];
    var index = 0;
    var lastFocus = null;

    function visibleAnchors() {
      return anchors.filter(function (a) { return !a.classList.contains("is-gone"); });
    }

    function load(i) {
      index = (i + visible.length) % visible.length;
      var a = visible[index];
      img.classList.add("is-loading");
      img.src = a.getAttribute("href");
      img.alt = a.querySelector("img") ? a.querySelector("img").alt : "";
      if (img.complete) img.classList.remove("is-loading");
      img.onload = function () { img.classList.remove("is-loading"); };
      text.textContent = a.getAttribute("data-caption") || "";
      count.textContent = (index + 1) + " / " + visible.length;
      // Preload neighbours.
      [index + 1, index - 1].forEach(function (n) {
        var na = visible[(n + visible.length) % visible.length];
        if (na) { var pre = new Image(); pre.src = na.getAttribute("href"); }
      });
    }

    function open(i) {
      visible = visibleAnchors();
      if (!visible.length) return;
      lastFocus = document.activeElement;
      load(i);
      box.classList.add("is-open");
      stopScrolling();
      btnClose.focus();
    }

    function close() {
      box.classList.remove("is-open");
      resumeScrolling();
      if (lastFocus) lastFocus.focus();
    }

    anchors.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        open(visibleAnchors().indexOf(a));
      });
    });

    btnPrev.addEventListener("click", function () { load(index - 1); });
    btnNext.addEventListener("click", function () { load(index + 1); });
    btnClose.addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") load(index - 1);
      else if (e.key === "ArrowRight") load(index + 1);
      else if (e.key === "Tab") {
        // Simple focus trap across the three buttons.
        var focusables = [btnPrev, btnNext, btnClose];
        var pos = focusables.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? pos - 1 : pos + 1;
        focusables[(next + focusables.length) % focusables.length].focus();
      }
    });
  }

  /* --------------------------------- Testimonial carousel ---- */
  function initCarousel() {
    var root = document.querySelector("[data-carousel]");
    if (!root) return;
    var slides = root.querySelectorAll(".testi-slide");
    var dotsWrap = root.querySelector(".testi-dots");
    var prev = root.querySelector("[data-carousel-prev]");
    var next = root.querySelector("[data-carousel-next]");
    var index = 0;
    var timer = null;
    var dots = [];

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.className = "testi-dot" + (i === 0 ? " is-active" : "");
        dot.setAttribute("aria-label", t("a11y.goReview") + " " + (i + 1));
        dot.addEventListener("click", function () { go(i, true); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
      document.addEventListener("vr:langchange", function () {
        dots.forEach(function (dot, i) {
          dot.setAttribute("aria-label", t("a11y.goReview") + " " + (i + 1));
        });
      });
    }

    function go(i, user) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (slide, n) {
        slide.classList.toggle("is-active", n === index);
      });
      dots.forEach(function (dot, n) {
        dot.classList.toggle("is-active", n === index);
      });
      if (user) restart();
    }

    function restart() {
      if (timer) clearInterval(timer);
      if (!reduceMotion) {
        timer = setInterval(function () { go(index + 1); }, 7000);
      }
    }

    if (prev) prev.addEventListener("click", function () { go(index - 1, true); });
    if (next) next.addEventListener("click", function () { go(index + 1, true); });

    root.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
    root.addEventListener("mouseleave", restart);
    root.addEventListener("focusin", function () { if (timer) clearInterval(timer); });
    root.addEventListener("focusout", restart);
    restart();
  }

  /* ------------------------------------ FAQ accordion ---- */
  function initAccordion() {
    var items = document.querySelectorAll(".faq-item");
    if (!items.length) return;
    items.forEach(function (item) {
      var btn = item.querySelector(".faq-q");
      btn.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
        items.forEach(function (other) {
          other.classList.remove("is-open");
          other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* -------------------------------- Distance explorer ---- */
  function initDistances() {
    var wrap = document.querySelector("[data-dist]");
    if (!wrap) return;
    var items = wrap.querySelectorAll(".dist-item");
    var numEl = wrap.querySelector("[data-dist-num]");
    var nameEls = wrap.querySelectorAll("[data-dist-name]");
    var barEl = wrap.querySelector("[data-dist-bar]");
    var max = 0;
    items.forEach(function (item) {
      max = Math.max(max, parseFloat(item.getAttribute("data-km")));
    });

    var active = items[0];

    function formatKm(km) {
      var s = km.toFixed(1);
      return currentLang === "en" ? s : s.replace(".", ",");
    }

    function activate(item) {
      active = item;
      items.forEach(function (i) { i.classList.toggle("is-active", i === item); });
      var km = parseFloat(item.getAttribute("data-km"));
      if (numEl) numEl.textContent = formatKm(km);
      var nameNode = item.querySelector("[data-i18n]");
      nameEls.forEach(function (el) {
        el.textContent = nameNode ? nameNode.textContent : "";
      });
      if (barEl) barEl.style.width = Math.max(18, (km / max) * 100) + "%";
    }

    items.forEach(function (item) {
      item.addEventListener("mouseenter", function () { activate(item); });
      item.addEventListener("focus", function () { activate(item); });
      item.addEventListener("click", function () { activate(item); });
    });
    document.addEventListener("vr:langchange", function () { activate(active); });
    activate(items[0]);
  }

  /* ------------------------- Hover-reveal cards (tap support) ---- */
  function initRevealCards() {
    var cards = document.querySelectorAll(".rcard");
    if (!cards.length) return;
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        var open = card.classList.contains("is-open");
        cards.forEach(function (c) { c.classList.remove("is-open"); });
        if (!open) card.classList.add("is-open");
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".rcard")) {
        cards.forEach(function (c) { c.classList.remove("is-open"); });
      }
    });
  }

  /* -------------------------------------------- Forms ---- */
  function initForms() {
    var forms = document.querySelectorAll("[data-inquiry]");

    forms.forEach(function (form) {
      var checkin = form.querySelector('input[name="checkin"]');
      var checkout = form.querySelector('input[name="checkout"]');
      var guests = form.querySelector('select[name="guests"]');
      var avail = form.querySelector("[data-avail]");
      var availText = avail ? avail.querySelector("[data-avail-text]") : null;
      var status = form.querySelector(".form-status");

      // Sensible date minimums.
      var today = new Date();
      var iso = function (d) { return d.toISOString().slice(0, 10); };
      if (checkin) checkin.min = iso(today);
      if (checkout) checkout.min = iso(new Date(today.getTime() + 864e5));

      function nights() {
        if (!checkin || !checkout || !checkin.value || !checkout.value) return 0;
        var n = Math.round((new Date(checkout.value) - new Date(checkin.value)) / 864e5);
        return n > 0 ? n : 0;
      }

      function updateAvail() {
        if (!avail) return;
        var n = nights();
        if (!n) {
          avail.classList.remove("is-visible");
          return;
        }
        var g = guests ? parseInt(guests.value, 10) || 0 : 0;
        var line = n + " " + t(n === 1 ? "avail.night" : "avail.nights");
        if (g) line += " · " + g + " " + t(g === 1 ? "avail.guest" : "avail.guests");
        if (availText) availText.textContent = line;
        avail.classList.add("is-visible");
      }

      if (checkin) {
        checkin.addEventListener("change", function () {
          if (checkin.value) {
            var min = new Date(new Date(checkin.value).getTime() + 864e5);
            if (checkout) {
              checkout.min = iso(min);
              if (checkout.value && checkout.value <= checkin.value) checkout.value = "";
            }
          }
          updateAvail();
        });
      }
      if (checkout) checkout.addEventListener("change", updateAvail);
      if (guests) guests.addEventListener("change", updateAvail);
      document.addEventListener("vr:langchange", updateAvail);

      function setError(input, key) {
        var field = input.closest(".field");
        if (!field) return;
        var err = field.querySelector(".field-err");
        field.classList.add("has-error");
        if (err && key) {
          err.setAttribute("data-i18n", key);
          err.textContent = t(key);
        }
      }

      function clearError(input) {
        var field = input.closest(".field");
        if (field) field.classList.remove("has-error");
      }

      form.querySelectorAll("input, select, textarea").forEach(function (input) {
        input.addEventListener("input", function () {
          clearError(input);
          if (status) status.classList.remove("is-visible");
        });
      });

      form.addEventListener("submit", function (e) {
        var invalid = [];

        form.querySelectorAll("[required]").forEach(function (input) {
          if (!input.value.trim()) {
            setError(input, "err.required");
            invalid.push(input);
          }
        });

        var email = form.querySelector('input[type="email"]');
        if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
          setError(email, "err.email");
          invalid.push(email);
        }

        if (checkin && checkout && checkin.value && checkout.value && checkout.value <= checkin.value) {
          setError(checkout, "err.dates");
          invalid.push(checkout);
        }

        if (invalid.length) {
          e.preventDefault();
          if (status) status.classList.add("is-visible");
          invalid[0].focus();
        }
      });
    });

    // Footer mini form: jump to the contact page with the email pre-filled.
    var mini = document.querySelector("[data-mini-inquiry]");
    if (mini) {
      mini.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = mini.querySelector('input[type="email"]');
        var email = input && input.value.trim() ? "?email=" + encodeURIComponent(input.value.trim()) : "";
        window.location.href = "contact.html" + email + "#inquiry";
      });
    }

    // Contact page: pre-fill the email passed from the footer teaser.
    var params = new URLSearchParams(window.location.search);
    var passedEmail = params.get("email");
    if (passedEmail) {
      var target = document.querySelector('#inquiry input[type="email"]');
      if (target && !target.value) target.value = passedEmail;
    }
  }

  /* -------------------------------- Sticky mobile CTA ---- */
  function initStickyCta() {
    var cta = document.querySelector("[data-sticky-cta]");
    if (!cta) return;
    function update() {
      cta.classList.toggle("is-visible", currentScrollY() > 620);
    }
    onScroll(update);
    update();
  }

  /* ---------------------------------------------- Boot ---- */
  document.addEventListener("DOMContentLoaded", function () {
    initLang();
    initSmoothScroll();
    initNav();
    initMobileMenu();
    initTour();
    initFilters("[data-amenity-tabs]", ".amenity");
    initFilters("[data-gallery-tabs]", ".g-item");
    initLightbox();
    initCarousel();
    initAccordion();
    initDistances();
    initRevealCards();
    initForms();
    initStickyCta();
    initReveals();
    initCounters();
    initParallax();

    var year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  });
})();
