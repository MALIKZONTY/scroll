(() => {
  "use strict";

  /* ---------- Topics & card styles ---------- */

  const TOPICS = [
    ["pickup", "pk", "💘", "Pickup lines", ["Send this to your crush 👀", "Try this one. We dare you.", "Smooth or cringe? 😏"]],
    ["love", "lv", "❤️", "Love", ["Tag your person ❤️", "Save this for later.", "Some things just need to be said."]],
    ["heartbreak", "hb", "💔", "Heartbreak", ["It gets better. Promise.", "For the 2 AM thoughts.", "Healing isn't linear."]],
    ["quotes", "qt", "💬", "Quotes", ["Read it twice.", "Screenshot-worthy.", "Words to keep."]],
    ["motivation", "mo", "💪", "Motivation", ["Your sign to start.", "Read this before you give up.", "Future you says thanks."]],
    ["relatable", "rl", "😂", "Relatable", ["Why is this so accurate 😭", "Send this to the friend who does this.", "Called out."]],
    ["friendship", "fr", "👯", "Friendship", ["Tag your bestie 👯", "Friends like these 🫶", "Send this to them. Now."]],
    ["space", "sp", "🌌", "Space", ["Space is wild. 🌌", "Did you know? 🔭", "The universe, explained."]],
    ["earth", "ea", "🌍", "Earth", ["Our planet is weird. 🌍", "Did you know? 🌋", "Nature never stops."]],
    ["time", "tm", "⏳", "Time & universe", ["Think about this for a sec. ⏳", "Mind = bent.", "Reality is strange."]],
    ["psychology", "ps", "🧠", "Psychology", ["Your brain is fascinating. 🧠", "This explains a lot.", "Ever noticed this?"]],
    ["mindblown", "mb", "🤯", "Mind-blowing", ["Wait, what? 🤯", "You'll tell someone this today.", "History is wild."]],
    ["animals", "an", "🐾", "Animals", ["Animals are amazing. 🐾", "Nature's coolest facts.", "Cuteness + science."]],
  ].map(([key, code, emoji, name, caps]) => ({ key, code, emoji, name, caps }));
  const byKey = new Map(TOPICS.map((t) => [t.key, t]));
  const byCode = new Map(TOPICS.map((t) => [t.code, t]));
  const SPECIAL = {
    foryou: { emoji: "✨", name: "For you" },
    liked: { emoji: "❤️", name: "Liked" },
    seen: { emoji: "👀", name: "Seen" },
  };
  // Tabs that list the visitor's own posts instead of a shuffled feed.
  const isList = (t) => t === "liked" || t === "seen";

  // One source for both the on-screen card and the downloaded image.
  const STYLES = [
    { bg: ["#ff5f9e", "#ff9a62"], angle: 135, fg: "#ffffff", family: "Inter", weight: 800 },
    { bg: ["#1e1b4b", "#4c1d95", "#db2777"], angle: 160, fg: "#fdf2f8", family: "Playfair Display", weight: 600, italic: true },
    { bg: ["#fef3c7"], fg: "#3b2a12", family: "Caveat", weight: 700, scale: 1.3 },
    { bg: ["#0f766e", "#22d3ee"], angle: 135, fg: "#ffffff", family: "Inter", weight: 800 },
    { bg: ["#111114"], fg: "#f5f5f7", family: "DM Serif Display", weight: 400, scale: 1.05 },
    { bg: ["#a78bfa", "#f0abfc"], angle: 135, fg: "#1e1033", family: "Space Grotesk", weight: 700 },
    { bg: ["#d9f99d", "#4ade80"], angle: 135, fg: "#052e16", family: "Inter", weight: 800 },
    { bg: ["#f5f5f4"], fg: "#1c1917", family: "Playfair Display", weight: 600, italic: true },
    { bg: ["#7f1d1d", "#f97316"], angle: 160, fg: "#fff7ed", family: "DM Serif Display", weight: 400, scale: 1.05 },
    { bg: ["#0ea5e9", "#6366f1"], angle: 180, fg: "#ffffff", family: "Space Grotesk", weight: 700 },
    { bg: ["#ffe4e6"], fg: "#881337", family: "Caveat", weight: 700, scale: 1.3 },
    { bg: ["#020617", "#1e3a8a"], angle: 160, fg: "#e0f2fe", family: "Inter", weight: 800 },
  ];

  const hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const styleFor = (id) => STYLES[hash(id) % STYLES.length];
  const topicOf = (id) => byCode.get(id.slice(0, id.indexOf("-")));
  const cssBg = (st) => (st.bg.length === 1 ? st.bg[0] : `linear-gradient(${st.angle}deg, ${st.bg.join(", ")})`);
  // Font size as a % of the card's text width, by text length.
  const fontPct = (text, st) => {
    const n = text.length;
    const base = n < 60 ? 10.5 : n < 110 ? 9 : n < 170 ? 7.6 : n < 240 ? 6.6 : n < 320 ? 5.9 : 5.2;
    return base * (n < 170 ? st.scale || 1 : Math.min(st.scale || 1, 1.1));
  };

  /* ---------- Storage (per-browser; every access may throw) ---------- */

  const store = {
    get(k, d) {
      try { const v = localStorage.getItem("connect:" + k); return v ? JSON.parse(v) : d; } catch { return d; }
    },
    set(k, v) {
      try { localStorage.setItem("connect:" + k, JSON.stringify(v)); } catch {}
    },
  };
  const seen = new Set(store.get("seen", []));
  let liked = store.get("liked", []); // newest first
  const likedSet = new Set(liked);
  let tab = store.get("tab", "foryou");
  if (!SPECIAL[tab] && !byKey.has(tab)) tab = "foryou";

  let seenTimer = 0;
  // Merge with what's stored so two open tabs don't overwrite each other's progress.
  const saveSeen = () => {
    clearTimeout(seenTimer);
    for (const id of store.get("seen", [])) seen.add(id);
    store.set("seen", [...seen]);
  };
  const markSeen = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    clearTimeout(seenTimer);
    seenTimer = setTimeout(saveSeen, 600);
  };
  addEventListener("pagehide", saveSeen);
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveSeen(); });

  /* ---------- Data ---------- */

  const textById = new Map();
  const loaded = new Map(); // topic key -> Promise<ids[]>
  const loadTopic = (key) => {
    if (!loaded.has(key)) {
      const p = fetch(`/data/${key}.json`)
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((rows) => rows.map(([id, text]) => (textById.set(id, text), id)))
        .catch((err) => { loaded.delete(key); throw err; });
      loaded.set(key, p);
    }
    return loaded.get(key);
  };

  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- DOM ---------- */

  const $ = (s) => document.querySelector(s);
  const feed = $("#feed");
  const sentinel = $("#sentinel");
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ICON = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3.1 5 6.6 5c2.1 0 3.6 1.2 5.4 3.2C13.8 6.2 15.3 5 17.4 5 20.9 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M22 3 11 14M22 3l-7 19-4-8-8-4z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>',
  };

  let toastTimer = 0;
  const toast = (msg) => {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  };

  function postHTML(id) {
    const text = textById.get(id);
    const t = topicOf(id);
    const st = styleFor(id);
    const cap = t.caps[hash(id + "c") % t.caps.length];
    const font = `font-family:'${st.family}';font-weight:${st.weight};font-style:${st.italic ? "italic" : "normal"};font-size:${fontPct(text, st)}cqw`;
    return `<article class="post" data-id="${id}">
  <div class="head"><div class="av">${t.emoji}</div><b>${t.name}</b><span>· Connect</span></div>
  <div class="card" style="background:${cssBg(st)};color:${st.fg}"><p style="${font}">${esc(text)}</p><span class="wm">Connect</span><div class="burst">❤️</div></div>
  <div class="actions">
    <button class="like${likedSet.has(id) ? " on" : ""}" data-act="like" aria-label="Like">${ICON.heart}</button>
    <button data-act="share" aria-label="Share">${ICON.share}</button>
    <button data-act="download" aria-label="Save as image">${ICON.download}</button>
  </div>
  <p class="cap">${esc(cap)}</p>
</article>`;
  }

  /* ---------- "Seen" = the whole card box is on screen ---------- */

  let seenIO;
  function buildSeenObserver() {
    seenIO?.disconnect();
    const header = $(".top");
    const topInset = header && getComputedStyle(header).display !== "none" ? header.offsetHeight : 0;
    seenIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const room = e.rootBounds ? e.rootBounds.height : innerHeight;
          // Fully visible, or as visible as it can be when the card is taller than the screen.
          if (e.intersectionRatio >= 0.99 || e.intersectionRect.height >= room - 2) {
            markSeen(e.target.closest(".post").dataset.id);
            seenIO.unobserve(e.target);
          }
        }
      },
      { rootMargin: `-${topInset}px 0px 0px 0px`, threshold: [0, 0.5, 0.9, 0.99, 1] },
    );
    for (const card of feed.querySelectorAll(".post .card")) {
      if (!seen.has(card.closest(".post").dataset.id)) seenIO.observe(card);
    }
  }

  /* ---------- Feed ---------- */

  const cfg = (window.CONNECT_CONFIG && window.CONNECT_CONFIG.ads) || {};
  const adsOn = () => !isList(tab) && cfg.every > 0 && typeof cfg.renderSlot === "function";

  let gen = 0; // bumps on every refresh so stale async work is dropped
  let queue = []; // ids not yet rendered
  let pending = 0; // topic files still loading for this feed
  let sinceAd = 0;
  let lastTopic = null;
  let ended = false;

  function takeNext() {
    // In the mixed feed, avoid two posts from the same topic in a row when possible.
    if (tab === "foryou" && lastTopic) {
      const look = Math.min(queue.length, 12);
      for (let i = 0; i < look; i++) {
        if (topicOf(queue[i]) !== lastTopic) {
          const [id] = queue.splice(i, 1);
          return id;
        }
      }
    }
    return queue.shift();
  }

  function renderMore(n = 8) {
    if (ended) return;
    const html = [];
    const slots = [];
    for (let i = 0; i < n && queue.length; i++) {
      const id = takeNext();
      lastTopic = topicOf(id);
      html.push(postHTML(id));
      if (adsOn() && ++sinceAd >= cfg.every) {
        sinceAd = 0;
        const sid = `ad-${gen}-${Math.random().toString(36).slice(2, 8)}`;
        slots.push(sid);
        html.push(`<section class="ad"><small>Sponsored</small><div class="slot" id="${sid}"></div></section>`);
      }
    }
    if (html.length) {
      $(".loading")?.remove();
      feed.insertAdjacentHTML("beforeend", html.join(""));
      for (const card of feed.querySelectorAll(".post:not([data-o]) .card")) {
        const post = card.closest(".post");
        post.dataset.o = "1";
        if (!seen.has(post.dataset.id)) seenIO.observe(card);
      }
      for (const sid of slots) {
        try { cfg.renderSlot(document.getElementById(sid)); } catch (err) { console.warn("ad slot", err); }
      }
    }
    if (!queue.length && !pending) showEnd();
  }

  function fill() {
    let guard = 0;
    while (queue.length && !ended && sentinel.getBoundingClientRect().top < innerHeight + 1500 && guard++ < 20) renderMore();
    if (!queue.length && !pending) showEnd();
  }

  function showEnd() {
    if (ended) return;
    ended = true;
    $(".loading")?.remove();
    const info = SPECIAL[tab] || byKey.get(tab);
    const hasPosts = feed.querySelector(".post");
    let body;
    if (tab === "liked") {
      body = hasPosts
        ? "<h2>That's all your liked posts</h2>Double-tap or ❤️ more posts to add them here."
        : "<h2>No liked posts yet</h2>Double-tap a post or tap ❤️ and it'll show up here.";
    } else if (tab === "seen") {
      body = hasPosts
        ? "<h2>That's everything you've seen</h2>Posts land here once their whole card has been on screen."
        : "<h2>Nothing seen yet</h2>Scroll the feed and posts you've fully seen will show up here.";
    } else {
      body = `<h2>You're all caught up 🎉</h2>You've seen every post in ${esc(info.name)}.<br><button data-restart>Start over</button>`;
    }
    feed.insertAdjacentHTML("beforeend", `<div class="empty">${body}</div>`);
  }

  async function refresh({ top = true } = {}) {
    const my = ++gen;
    queue = [];
    pending = 0;
    sinceAd = 0;
    lastTopic = null;
    ended = false;
    feed.innerHTML = '<div class="loading">Loading…</div>';
    if (top) scrollTo({ top: 0 });

    try {
      if (isList(tab)) {
        if (tab === "seen") saveSeen(); // pick up anything seen in other tabs
        const ids = tab === "liked" ? liked : [...seen].reverse(); // newest first
        const keys = [...new Set(ids.map((id) => topicOf(id)?.key).filter(Boolean))];
        await Promise.all(keys.map(loadTopic));
        if (my !== gen) return;
        queue = ids.filter((id) => textById.has(id));
        feed.innerHTML = "";
        fill();
        return;
      }

      const keys = tab === "foryou" ? shuffle(TOPICS.map((t) => t.key)) : [tab];
      const first = keys.slice(0, tab === "foryou" ? 3 : 1);
      const rest = keys.slice(first.length);
      const add = (ids) => {
        const fresh = ids.filter((id) => !seen.has(id));
        queue = shuffle(queue.concat(fresh));
      };

      (await Promise.all(first.map(loadTopic))).forEach(add);
      if (my !== gen) return;
      feed.innerHTML = "";
      pending = rest.length;
      fill();

      for (const key of rest) {
        loadTopic(key)
          .then((ids) => { if (my === gen) add(ids); })
          .catch(() => {})
          .finally(() => {
            if (my !== gen) return;
            pending--;
            if (ended && queue.length) {
              // More posts arrived after we showed the end message.
              feed.querySelector(".empty")?.remove();
              ended = false;
            }
            fill();
          });
      }
    } catch {
      if (my !== gen) return;
      feed.innerHTML = '<div class="empty"><h2>Couldn\'t load posts</h2>Check your connection and try again.<br><button data-retry>Retry</button></div>';
    }
  }

  new IntersectionObserver((e) => { if (e[0].isIntersecting) fill(); }, { rootMargin: "1500px 0px" }).observe(sentinel);

  /* ---------- Tabs ---------- */

  function buildTabs() {
    const items = [["foryou", SPECIAL.foryou], ...TOPICS.map((t) => [t.key, t]), ["liked", SPECIAL.liked], ["seen", SPECIAL.seen]];
    $("#tabs").innerHTML = items
      .map(([k, t]) => `<button class="chip${k === tab ? " on" : ""}" data-tab="${k}">${t.emoji} ${esc(t.name)}</button>`)
      .join("");
    $("#side-tabs").innerHTML = items
      .map(([k, t]) => `<button class="side-tab${k === tab ? " on" : ""}" data-tab="${k}"><span class="e">${t.emoji}</span>${esc(t.name)}</button>`)
      .join("");
    $("#tabs .chip.on")?.scrollIntoView({ inline: "center", block: "nearest" });
  }

  function setTab(k) {
    if (k === tab) { refresh(); toast("Fresh feed ✨"); return; }
    tab = k;
    store.set("tab", tab);
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === k));
    document.querySelector(`#tabs [data-tab="${k}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    refresh();
  }

  /* ---------- Actions ---------- */

  function toggleLike(id, forceOn = false) {
    const post = feed.querySelector(`.post[data-id="${id}"]`);
    if (likedSet.has(id)) {
      if (forceOn) return;
      likedSet.delete(id);
      liked = liked.filter((x) => x !== id);
    } else {
      likedSet.add(id);
      liked.unshift(id);
    }
    store.set("liked", liked);
    post?.querySelector(".like")?.classList.toggle("on", likedSet.has(id));
  }

  async function share(id) {
    const text = `${textById.get(id)}\n\n— via Connect ${location.origin}`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch (err) {
      if (err && err.name !== "AbortError") toast("Couldn't share");
    }
  }

  function wrapLines(ctx, text, maxW) {
    const out = [];
    for (const para of text.split("\n")) {
      if (!para.trim()) { out.push(""); continue; }
      let line = "";
      for (const word of para.split(/\s+/)) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
      }
      out.push(line);
    }
    return out;
  }

  async function toImage(id) {
    const text = textById.get(id);
    const st = styleFor(id);
    const W = 1080, H = 1350, textW = W * 0.8;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    if (st.bg.length === 1) ctx.fillStyle = st.bg[0];
    else {
      const a = (st.angle * Math.PI) / 180;
      const dx = Math.sin(a), dy = -Math.cos(a);
      const half = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
      const g = ctx.createLinearGradient(W / 2 - dx * half, H / 2 - dy * half, W / 2 + dx * half, H / 2 + dy * half);
      st.bg.forEach((col, i) => g.addColorStop(i / (st.bg.length - 1), col));
      ctx.fillStyle = g;
    }
    ctx.fillRect(0, 0, W, H);

    let size = (fontPct(text, st) / 100) * textW;
    const font = (px) => `${st.italic ? "italic " : ""}${st.weight} ${px}px "${st.family}"`;
    try { await document.fonts.load(font(size)); } catch {}
    let lines;
    for (;;) {
      ctx.font = font(size);
      lines = wrapLines(ctx, text, textW);
      if (lines.length * size * 1.35 <= H * 0.78 || size < 24) break;
      size *= 0.92;
    }
    ctx.fillStyle = st.fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lh = size * 1.35;
    let y = H / 2 - ((lines.length - 1) * lh) / 2;
    for (const l of lines) { ctx.fillText(l, W / 2, y); y += lh; }

    ctx.globalAlpha = 0.65;
    try { await document.fonts.load('700 30px "Space Grotesk"'); } catch {}
    ctx.font = '700 30px "Space Grotesk"';
    ctx.textAlign = "right";
    ctx.fillText("Connect", W - 40, H - 44);

    return new Promise((res) => c.toBlob(res, "image/png"));
  }

  async function download(id) {
    try {
      const blob = await toImage(id);
      const file = new File([blob], `connect-${id}.png`, { type: "image/png" });
      const touch = matchMedia("(pointer: coarse)").matches;
      if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast("Image saved");
    } catch (err) {
      if (err && err.name !== "AbortError") toast("Couldn't save image");
    }
  }

  let lastTap = { id: null, t: 0 };
  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) return setTab(tabBtn.dataset.tab);
    if (e.target.closest("[data-refresh]")) { refresh(); toast("Fresh feed ✨"); return; }
    if (e.target.closest("[data-retry]")) return refresh();
    if (e.target.closest("[data-restart]")) {
      const prefix = tab === "foryou" ? null : byKey.get(tab).code + "-";
      for (const id of store.get("seen", [])) seen.add(id);
      for (const id of [...seen]) if (!prefix || id.startsWith(prefix)) seen.delete(id);
      clearTimeout(seenTimer);
      store.set("seen", [...seen]);
      return refresh();
    }

    const post = e.target.closest(".post");
    if (!post) return;
    const id = post.dataset.id;
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "like") return toggleLike(id);
    if (act === "share") return share(id);
    if (act === "download") return download(id);

    // Double-tap the card to like, Instagram style.
    if (e.target.closest(".card")) {
      const now = Date.now();
      if (lastTap.id === id && now - lastTap.t < 320) {
        toggleLike(id, true);
        const b = post.querySelector(".burst");
        b.classList.remove("go");
        void b.offsetWidth;
        b.classList.add("go");
        lastTap = { id: null, t: 0 };
      } else lastTap = { id, t: now };
    }
  });

  /* ---------- Pull to refresh (touch) ---------- */

  const ptr = $("#ptr");
  let startY = null, pull = 0, busy = false;
  const resetPtr = () => {
    ptr.classList.remove("pulling");
    ptr.style.removeProperty("--pull");
    ptr.style.removeProperty("--rot");
  };
  addEventListener("touchstart", (e) => {
    startY = scrollY <= 0 && !busy && e.touches.length === 1 ? e.touches[0].clientY : null;
    pull = 0;
  }, { passive: true });
  addEventListener("touchmove", (e) => {
    if (startY === null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0 || scrollY > 0) { pull = 0; resetPtr(); return; }
    pull = Math.min(dy * 0.5, 110);
    ptr.classList.add("pulling");
    ptr.style.setProperty("--pull", `${pull - 40}px`);
    ptr.style.setProperty("--rot", `${pull * 3}deg`);
  }, { passive: true });
  addEventListener("touchend", async () => {
    if (startY === null) return;
    startY = null;
    if (pull < 70) { resetPtr(); return; }
    busy = true;
    resetPtr();
    ptr.classList.add("spinning");
    await Promise.all([refresh(), new Promise((r) => setTimeout(r, 500))]);
    ptr.classList.remove("spinning");
    busy = false;
    toast("Fresh feed ✨");
  });

  /* ---------- Start ---------- */

  buildTabs();
  buildSeenObserver();
  matchMedia("(min-width: 1000px)").addEventListener("change", buildSeenObserver);
  refresh();
})();
