/*
 * Google Analytics for the 6A06 Data Spotlight (data.aboagye.org).
 *
 * Loaded from index.html with one line in <head>:
 *   <script src="analytics.js" defer></script>
 * Keep that line in any new version of index.html, or tracking stops.
 *
 * Reports to the same GA4 property as aboagye.org (G-XT54D4R4Y2). Besides the
 * standard page view, it records how people use the dashboard. It only listens
 * to the page, so the dashboard's own code doesn't need to know it exists.
 *
 * Events (parameters in brackets):
 *   section_view          a section stayed in the middle of the screen for 1.5s [section]
 *   section_jump          section button in the right rail scrolled to a section [section]
 *   section_toggle        section shown or hidden from the rail [section, setting]
 *   timeline_play         Play pressed [setting = speed]
 *   timeline_pause        playback paused [setting = date reached]
 *   timeline_today        Today pressed
 *   timeline_scrub        date moved by the slider, a chart click or a date shortcut [setting = date, detail = how]
 *   playback_speed        speed changed [setting]
 *   lookback_change       look-back changed [setting]
 *   filter_change         Block or Storefronts filter changed [section = filter, setting = choice]
 *   search                storefront search [search_term]
 *   storefront_select     a storefront bar clicked to pin its details [detail = name, address]
 *   grant_select          a grant marker clicked [detail]
 *   map_select            a map marker clicked [section, detail = marker, setting = layer]
 *   map_layer             a map layer chip switched [section, detail = layer, setting = on/off]
 *   map_zoom              map zoomed [section, setting = in/out]
 *   expand                "Why darkness..." or the business table opened [detail]
 *   help_open             a "?" explainer opened [detail]
 *   owner_record_click    "View owner record" link [detail]
 *   email_click           Feedback button or email link [detail]
 *   campaign_site_click   link to aboagye.org [detail = which link]
 *   spotlight_open        campaign spotlight opened from the logo (once per visit) []
 * Outbound links (citations, DC sources) are recorded by GA's enhanced measurement.
 *
 * Off the live site (a local preview, for example) nothing is sent. Events are
 * logged to the console instead. Add ?ga_debug=1 to the live URL to see hits in
 * GA's DebugView.
 */
(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-XT54D4R4Y2';
  var host = location.hostname;
  var LIVE = /(^|\.)aboagye\.org$/.test(host) || /\.github\.io$/.test(host);
  var DEBUG = /[?&]ga_debug=1\b/.test(location.search);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (LIVE) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(s);
  }
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, DEBUG ? { debug_mode: true } : {});

  // ---------- helpers ----------

  function clip(v) {
    return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  function send(name, params) {
    var p = {};
    params = params || {};
    Object.keys(params).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') p[k] = clip(params[k]);
    });
    if (DEBUG) p.debug_mode = true;
    window.gtag('event', name, p);
    if (!LIVE || DEBUG) {
      (window.__gaLog = window.__gaLog || []).push([name, p]);
      if (window.console && console.debug) console.debug('[analytics]', name, p);
    }
  }

  function txt(el) {
    return el ? clip(el.textContent) : '';
  }

  var SECTION_NAMES = {
    'why-dark': 'Why darkness',
    'sec-tl': 'Timeline',
    'sec-vac': 'Vacancy',
    'sec-crime': 'Safety',
    'sec-street': 'Sanitation',
    'sec-move': 'Transit',
    'sec-housing': 'Housing',
    'sec-notes': 'Notes'
  };

  function sectionName(idOrEl) {
    var id = typeof idOrEl === 'string' ? idOrEl : '';
    if (!id && idOrEl && idOrEl.closest) {
      var sec = idOrEl.closest('section[id]');
      id = sec ? sec.id : '';
    }
    if (!id) return 'Top';
    if (SECTION_NAMES[id]) return SECTION_NAMES[id];
    var rail = document.querySelector('nav.rail button[data-sec="' + id + '"] .lf');
    if (rail) return txt(rail);
    var sec2 = document.getElementById(id);
    var h = sec2 && sec2.querySelector('h2');
    return h ? txt(h.firstElementChild || h) : id;
  }

  function asofLabel() {
    return txt(document.getElementById('asof-val'));
  }

  function asofValue() {
    var el = document.getElementById('asof');
    return el ? el.value : null;
  }

  function after(fn) { setTimeout(fn, 0); }

  // ---------- clicks (capture phase: the dashboard stops propagation on some controls) ----------

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var asofBefore = asofValue();
    var handledDateChange = false;

    var rail = t.closest('nav.rail button[data-sec]');
    var play = t.closest('#play-btn');
    var today = t.closest('#today-btn');
    var seg = t.closest('.seg button');
    var bar = t.closest('button.bar');
    var gmark = t.closest('button.gmark');
    var mk = t.closest('.mk');
    var chip = t.closest('button.chip');
    var zoom = t.closest('button.map-zoom');
    var why = t.closest('.why-toggle');
    var q = t.closest('.qbtn');
    var summary = t.closest('summary');
    var link = t.closest('a[href]');

    if (rail) {
      var id = rail.getAttribute('data-sec');
      var wasPressed = rail.getAttribute('aria-pressed');
      after(function () {
        var nowPressed = rail.getAttribute('aria-pressed');
        if (nowPressed !== wasPressed) {
          send('section_toggle', { section: sectionName(id), setting: nowPressed === 'true' ? 'shown' : 'hidden' });
        } else {
          send('section_jump', { section: sectionName(id) });
        }
      });
    } else if (play) {
      handledDateChange = true;
      if (/play/i.test(play.textContent)) {
        var sp = document.getElementById('speed');
        send('timeline_play', { setting: sp && sp.selectedOptions[0] ? sp.selectedOptions[0].text : '' });
      } else {
        after(function () { send('timeline_pause', { setting: asofLabel() }); });
      }
    } else if (today) {
      handledDateChange = true;
      send('timeline_today');
    } else if (seg) {
      var group = seg.parentElement;
      var label = group && group.previousElementSibling ? txt(group.previousElementSibling) : (group && group.id) || 'Filter';
      if (seg.getAttribute('aria-pressed') !== 'true') {
        send('filter_change', { section: label, setting: txt(seg) });
      }
    } else if (bar) {
      after(function () {
        if (bar.classList.contains('pin')) {
          var al = bar.getAttribute('aria-label') || txt(bar);
          send('storefront_select', { detail: al.split('. ')[0] });
        }
      });
    } else if (gmark) {
      send('grant_select', { detail: gmark.getAttribute('aria-label') || txt(gmark) });
    } else if (mk) {
      var layerG = mk.closest('[data-layer]');
      var layerKey = layerG ? layerG.getAttribute('data-layer') : '';
      var layerChip = layerKey ? document.querySelector('button.chip[data-layer="' + layerKey + '"]') : null;
      var mapParams = { section: sectionName(mk), setting: layerChip ? txt(layerChip) : layerKey };
      if (mk.getAttribute('aria-label')) {
        mapParams.detail = mk.getAttribute('aria-label');
        send('map_select', mapParams);
      } else {
        // No label on the marker: use the title of the tooltip it opens.
        after(function () {
          var box = mk.parentElement;
          var tip = null;
          while (box && box !== document.body && !tip) {
            tip = box.querySelector(':scope > .mtip');
            box = box.parentElement;
          }
          var title = tip ? (tip.querySelector('b') || tip.firstElementChild || tip) : null;
          mapParams.detail = title ? txt(title) : '';
          send('map_select', mapParams);
        });
      }
    } else if (chip) {
      after(function () {
        send('map_layer', { section: sectionName(chip), detail: txt(chip), setting: chip.getAttribute('aria-pressed') === 'true' ? 'on' : 'off' });
      });
    } else if (zoom) {
      after(function () {
        send('map_zoom', { section: sectionName(zoom), setting: zoom.getAttribute('aria-pressed') === 'true' ? 'in' : 'out' });
      });
    } else if (why) {
      after(function () {
        if (why.getAttribute('aria-expanded') === 'true') send('expand', { detail: 'Why darkness makes a difference' });
      });
    } else if (q) {
      after(function () {
        if (q.getAttribute('aria-expanded') === 'true') send('help_open', { detail: q.getAttribute('aria-label') || 'Help' });
      });
    } else if (summary) {
      var det = summary.parentElement;
      after(function () {
        if (det && det.open) send('expand', { detail: txt(summary) });
      });
    } else if (link) {
      var href = link.getAttribute('href') || '';
      if (/^mailto:/i.test(href)) {
        send('email_click', { detail: link.id === 'issue-btn' ? 'Feedback button' : 'Email link' });
      } else if (link.closest('.rec')) {
        var tipBox = link.closest('.tip, .mtip');
        var tb = tipBox && tipBox.querySelector('b');
        send('owner_record_click', { section: sectionName(link), detail: tb ? txt(tb) : '' });
      } else if (link.hostname && /(^|\.)aboagye\.org$/.test(link.hostname) && link.hostname !== host) {
        var which = link.classList.contains('logo-badge') ? 'Logo'
          : link.classList.contains('spot-go') ? 'Spotlight'
          : txt(link) || href;
        send('campaign_site_click', { detail: which });
      }
    }

    // Any other click that moved the date: chart clicks and date shortcuts.
    if (!handledDateChange && !t.closest('#asof')) {
      after(function () {
        var now = asofValue();
        if (now !== null && now !== asofBefore) {
          var btn = t.closest('button');
          send('timeline_scrub', { setting: asofLabel(), detail: btn ? 'shortcut: ' + txt(btn) : 'chart' });
        }
      });
    }
  }, true);

  // ---------- form controls ----------

  var scrubTimer = null;
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'asof') {
      clearTimeout(scrubTimer);
      scrubTimer = setTimeout(function () {
        send('timeline_scrub', { setting: asofLabel(), detail: 'slider' });
      }, 800);
    } else if (t.id === 'speed') {
      send('playback_speed', { setting: t.selectedOptions[0] ? t.selectedOptions[0].text : t.value });
    } else if (t.id === 'lookback') {
      send('lookback_change', { setting: t.selectedOptions[0] ? t.selectedOptions[0].text : t.value });
    }
  }, true);

  var searchTimer = null;
  var lastSearch = '';
  function flushSearch(input) {
    clearTimeout(searchTimer);
    var term = clip(input.value).toLowerCase();
    if (term.length >= 2 && term !== lastSearch) {
      lastSearch = term;
      send('search', { search_term: term });
    }
  }
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t && t.id === 'q') {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { flushSearch(t); }, 1500);
    }
  }, true);
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'q') flushSearch(e.target);
  }, true);

  // ---------- section views ----------

  function watchSections() {
    if (!('IntersectionObserver' in window)) return;
    var seen = {};
    var timers = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var id = en.target.id;
        if (seen[id]) return;
        if (en.isIntersecting) {
          timers[id] = setTimeout(function () {
            seen[id] = true;
            io.unobserve(en.target);
            send('section_view', { section: sectionName(id) });
          }, 1500);
        } else {
          clearTimeout(timers[id]);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    Array.prototype.forEach.call(document.querySelectorAll('section[id]'), function (sec) {
      io.observe(sec);
    });
  }

  // ---------- campaign spotlight (opens when hovering the logo) ----------

  function watchSpotlight() {
    if (!('MutationObserver' in window)) return;
    var opened = false;
    var mo = new MutationObserver(function () {
      if (!opened && document.body.classList.contains('spot')) {
        opened = true;
        send('spotlight_open');
        mo.disconnect();
      }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    watchSections();
    watchSpotlight();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
