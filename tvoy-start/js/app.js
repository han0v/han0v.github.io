/* «Твой старт» — MVP. Чистый JS, без сборки и бэкенда. Команда МБ. */
(function () {
  "use strict";
  const D = window.TS_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("ts_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("ts_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const params = new URLSearchParams(location.search);
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const page = document.body.dataset.page || "";

  const co = (id) => D.companies.find((c) => c.id === id) || { name: id, rating: 5, reviews: 0, verified: false };
  const dName = (id) => id === "online" ? "Онлайн" : (D.districts.find((d) => d.id === id) || {}).name || "Уфа";
  const MODES = {
    hour: { name: "Час", full: "Подработка 1–3 ч", cls: "blue", law: "ГПХ / самозанятость, без медсправки для разовой работы" },
    season: { name: "Сезон", full: "Летняя работа", cls: "warn", law: "Срочный трудовой договор, неполный день" },
    perm: { name: "Постоянно", full: "Постоянная подработка", cls: "ok", law: "Трудовой договор, сокращённый день" }
  };
  const allVac = () => [...store.get("myvac", []), ...D.vacancies];
  const findVac = (id) => allVac().find((v) => v.id === id);
  const coName = (v) => v.coName || co(v.co).name;
  const fmtPay = (v) => `${Number(v.pay).toLocaleString("ru-RU")} ₽ <small>/ ${esc(v.unit)}</small>`;

  /* ===== Закон: лимиты смены ===== */
  function limit(age, hol) {
    if (age < 14) return 0;
    if (hol) return age < 15 ? 4 : age < 16 ? 5 : 7;
    return age < 16 ? 2.5 : 4;
  }
  function check(v, age, hol) {
    if (age < v.age) return { ok: false, why: `С ${v.age} лет` };
    if (v.mode === "season" && !hol) return { ok: true, why: "Летом" };
    if (!v.online && v.hours > limit(age, hol)) return { ok: false, why: `Смена ${v.hours} ч > лимита ${limit(age, hol)} ч` };
    return { ok: true, why: "" };
  }

  /* ===== Иконки ===== */
  const I = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    fs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ===== Тема ===== */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    store.set("theme", t);
    const b = $("#themeBtn"); if (b) b.innerHTML = t === "dark" ? I.sun : I.moon;
  }

  /* ===== Шапка, меню, подвал ===== */
  const NAV = [
    ["index.html", "Главная", "🏠", "home"], ["vacancies.html", "Вакансии", "💼", "vacancies"], ["map.html", "Карта", "🗺️", "map"],
    ["post.html", "Разместить", "➕", "post"], ["gigachat.html", "GigaChat-проверка", "🤖", "gigachat"], ["ratings.html", "Рейтинг", "⭐", "ratings"],
    ["teams.html", "Команды", "🤝", "teams"], ["academy.html", "Старт-академия", "🎓", "academy"], ["profile.html", "Цифровая трудовая", "📘", "profile"],
    ["parents.html", "Родителям", "👨‍👩‍👧", "parents"], ["business.html", "Бизнесу и партнёрам", "🏢", "business"], ["support.html", "Поддержка", "💬", "support"]
  ];
  const TOP = ["vacancies", "map", "post", "gigachat", "ratings", "teams", "business"];
  const ROLES = { teen: ["🧑‍🎓", "Подросток", "Амир, 15"], emp: ["🏢", "Работодатель", "Кофейня «Белая река»"], parent: ["👩", "Родитель", "Гульнара"] };

  const LOGO = `<a href="index.html" class="logo" aria-label="Твой старт — на главную">
      <img class="lm-light" src="assets/logo-mark-light.png" alt=""><img class="lm-dark" src="assets/logo-mark.png" alt="">
      <span class="logo-text">Твой<b>старт</b></span></a>`;

  function header() {
    const role = ROLES[store.get("role", "teen")];
    const h = document.createElement("header");
    h.className = "site-header";
    h.innerHTML = `<div class="container header-in">${LOGO}
      <nav class="nav" aria-label="Основное меню">${NAV.filter((n) => TOP.includes(n[3])).map((n) => `<a href="${n[0]}" class="${n[3] === page ? "active" : ""}">${n[1]}</a>`).join("")}</nav>
      <div class="h-actions">
        <button class="role-chip" id="roleChip" title="Сменить роль"><span class="ava">${role[0]}</span><span class="rc-name">${esc(role[2])}</span></button>
        <button class="icon-btn h-fs" id="fsBtn" title="Во весь экран" aria-label="Во весь экран">${I.fs}</button>
        <button class="icon-btn" id="themeBtn" title="Сменить тему" aria-label="Сменить тему"></button>
        <button class="icon-btn burger" id="burger" aria-label="Открыть меню"><div><span></span><span></span><span></span></div></button>
      </div></div>`;
    document.body.prepend(h);

    const bg = document.createElement("div"); bg.className = "drawer-bg";
    const dr = document.createElement("aside"); dr.className = "drawer"; dr.setAttribute("aria-label", "Меню");
    dr.innerHTML = `<div class="drawer-top">${LOGO}<button class="icon-btn" id="drClose" aria-label="Закрыть">${I.close}</button></div>
      <h4>Я на платформе как</h4>
      <div class="roles">${Object.entries(ROLES).map(([k, r]) => `<button data-role="${k}" class="${store.get("role", "teen") === k ? "on" : ""}">${r[0]}<br>${r[1]}</button>`).join("")}</div>
      <h4>Разделы</h4>
      <nav>${NAV.map((n) => `<a href="${n[0]}" class="${n[3] === page ? "active" : ""}"><span>${n[2]}</span>${n[1]}</a>`).join("")}</nav>
      <h4>Демо</h4>
      <button class="btn btn-ghost btn-sm" id="resetDemo">↺ Сбросить демо-данные</button>`;
    document.body.append(bg, dr);

    const open = () => { dr.classList.add("open"); bg.classList.add("open"); };
    const close = () => { dr.classList.remove("open"); bg.classList.remove("open"); };
    $("#burger").onclick = open; $("#drClose").onclick = close; bg.onclick = close;
    $("#roleChip").onclick = open;
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); closeModal(); } });
    $$("[data-role]", dr).forEach((b) => b.onclick = () => {
      store.set("role", b.dataset.role);
      $$("[data-role]", dr).forEach((x) => x.classList.toggle("on", x === b));
      const r = ROLES[b.dataset.role];
      $("#roleChip").innerHTML = `<span class="ava">${r[0]}</span><span class="rc-name">${esc(r[2])}</span>`;
      toast(`${r[0]} Вы вошли как: <b>${r[1]}</b> (демо-режим)`, true);
    });
    $("#resetDemo").onclick = () => {
      ["myvac", "applied", "seekers", "teams", "academy", "approved", "age"].forEach((k) => { try { localStorage.removeItem("ts_" + k); } catch (e) {} });
      toast("↺ Демо-данные сброшены", true); setTimeout(() => location.reload(), 700);
    };
    $("#themeBtn").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    const fs = $("#fsBtn");
    if (!document.fullscreenEnabled) fs.style.display = "none";
    fs.onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
    setTheme(document.documentElement.dataset.theme || "light");
  }

  function footer() {
    const f = document.createElement("footer");
    f.className = "site-footer";
    f.innerHTML = `<div class="container">
      <div class="f-grid">
        <div class="f-brand">${LOGO.replace('class="lm-light"', 'class="lm-light" style="display:none"').replace('class="lm-dark"', 'class="lm-dark" style="display:block"')}
          <p>Молодёжная платформа подработок: законно, безопасно и с гарантией оплаты. Первый опыт — с 14 лет.</p>
          <div class="f-social"><a href="#" title="ВКонтакте" aria-label="ВКонтакте">VK</a><a href="#" title="Telegram" aria-label="Telegram">TG</a><a href="support.html" title="Поддержка" aria-label="Поддержка">✉</a></div>
        </div>
        <div><h5>Подросткам</h5><a href="vacancies.html">Найти подработку</a><a href="map.html">Карта вакансий</a><a href="academy.html">Старт-академия</a><a href="profile.html">Цифровая трудовая</a><a href="teams.html">Старт-команды</a></div>
        <div><h5>Работодателям</h5><a href="post.html">Разместить вакансию</a><a href="gigachat.html">Проверка GigaChat</a><a href="business.html">Тарифы и партнёрам</a><a href="ratings.html">Рейтинг компаний</a></div>
        <div><h5>Помощь</h5><a href="support.html">Техподдержка</a><a href="parents.html">Родителям</a><a href="support.html#rules">Правила платформы</a><a href="support.html#privacy">Конфиденциальность</a></div>
      </div>
      <div class="mb-team">
        <div class="mb-logo"><div class="mb-badge">МБ</div><div><b>Сделано Командой МБ</b><span>«Мастера бизнеса» · «Большая перемена» 2026</span></div></div>
        <div class="muted" style="color:#9FB3AA;font-size:14px">⚡ Мы не ждём старта — мы его создаём</div>
      </div>
      <div class="f-bottom"><span>© 2026 «Твой старт» · Создано на мастерской «Большой перемены», партнёр — Сбер</span>
        <span class="mvp">MVP-прототип · компании, люди и данные демонстрационные</span></div>
    </div>`;
    document.body.append(f);
    const fab = document.createElement("a");
    fab.className = "fab"; fab.href = "support.html"; fab.title = "Техподдержка"; fab.setAttribute("aria-label", "Техподдержка"); fab.textContent = "💬";
    if (page !== "support") document.body.append(fab);
    const t = document.createElement("div"); t.className = "toasts"; t.id = "toasts"; document.body.append(t);
  }

  /* ===== Тосты ===== */
  function toast(html, main, ms = 4200) {
    const box = $("#toasts"); if (!box) return;
    const el = document.createElement("div");
    el.className = "toast" + (main ? " main" : "");
    el.innerHTML = html;
    box.append(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 380); }, ms);
  }

  /* ===== Модальное окно вакансии ===== */
  function ensureModal() {
    if ($("#modalBg")) return;
    const m = document.createElement("div");
    m.className = "modal-bg"; m.id = "modalBg";
    m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="icon-btn close" id="mClose" aria-label="Закрыть">${I.close}</button><div id="mBody"></div></div>`;
    document.body.append(m);
    m.addEventListener("click", (e) => { if (e.target === m) closeModal(); });
    $("#mClose").onclick = closeModal;
  }
  function closeModal() { const m = $("#modalBg"); if (m) m.classList.remove("open"); document.body.style.overflow = ""; }
  function openVac(id) {
    const v = findVac(id); if (!v) return;
    ensureModal();
    const c = co(v.co), md = MODES[v.mode], applied = store.get("applied", []).includes(v.id);
    $("#mBody").innerHTML = `
      <div class="vac-top" style="margin-bottom:8px"><div class="vac-emoji">${v.e}</div>
        <div style="flex:1"><h3 style="font-size:22px;margin:0 0 4px">${esc(v.title)}</h3>
        <div class="comp muted">${esc(coName(v))} ${c.verified || v.coName ? '<span class="badge ok">✓ Проверен</span>' : ""} <span><span class="star">★</span> ${c.rating}</span></div></div></div>
      <div class="vac-meta"><span class="badge ${md.cls}">${md.name} · ${md.full}</span><span class="badge">с ${v.age} лет</span><span class="badge">📍 ${dName(v.d)}</span><span class="badge grad">🛡 Оплата гарантирована</span></div>
      <div class="five">
        <div><b>🏢 Кто</b><span>${esc(coName(v))} — ИНН и адрес проверены платформой</span></div>
        <div><b>🧩 Что делать</b><span>${esc(v.what)}</span></div>
        <div><b>💰 Оплата</b><span><b style="color:var(--text)">${Number(v.pay).toLocaleString("ru-RU")} ₽ / ${esc(v.unit)}</b> — поступит на карту после подтверждения смены</span></div>
        <div><b>🕒 Когда и где</b><span>${esc(v.when)} · ${esc(v.where)}</span></div>
        <div><b>📄 Оформление</b><span>${md.law}. ${esc(v.docs)}</span></div>
      </div>
      <div class="gc-powered" style="margin-bottom:16px"><img src="assets/gigachat-icon.png" alt="">Вакансия проверена GigaChat: нарушений не найдено</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" id="mApply" ${applied ? "disabled" : ""}>${applied ? "✓ Отклик отправлен" : "Откликнуться"}</button>
        <a class="btn btn-ghost" href="gigachat.html?v=${encodeURIComponent(v.id)}">🤖 Разбор GigaChat</a>
        <button class="btn btn-ghost" id="mReport">⚠️ Пожаловаться</button>
      </div>`;
    $("#modalBg").classList.add("open");
    document.body.style.overflow = "hidden";
    $("#mApply").onclick = () => {
      const a = store.get("applied", []); if (!a.includes(v.id)) a.push(v.id); store.set("applied", a);
      $("#mApply").disabled = true; $("#mApply").textContent = "✓ Отклик отправлен";
      toast(`🙋 Отклик отправлен в «${esc(coName(v))}». Родитель получил уведомление.`, true);
      document.dispatchEvent(new Event("ts:applied"));
    };
    $("#mReport").onclick = () => toast("🛡 Жалоба передана модератору. Ответим в течение 2 часов.", true);
  }

  /* ===== Карточка вакансии ===== */
  function vacCard(v, st) {
    const c = co(v.co), md = MODES[v.mode];
    return `<article class="vac ${st && !st.ok ? "locked" : ""}" data-vac="${esc(v.id)}" tabindex="0">
      ${v.isNew ? '<span class="badge grad new-dot">Новая</span>' : ""}
      <div class="vac-top"><div class="vac-emoji">${v.e}</div><span class="badge ${md.cls}">${md.name}</span></div>
      <div><h3>${esc(v.title)}</h3><div class="comp">${esc(coName(v))} ${c.verified || v.coName ? '<span class="badge ok">✓</span>' : ""}</div></div>
      <div class="pay">${fmtPay(v)}</div>
      <div class="vac-meta"><span class="badge">📍 ${dName(v.d)}</span><span class="badge">⏱ ${String(v.hours).replace(".", ",")} ч</span><span class="badge">${v.age}+</span>${v.team ? '<span class="badge blue">👥 Команда</span>' : ""}</div>
      <div class="vac-foot"><span><span class="star">★</span> ${c.rating} · ${c.reviews} отзывов</span>${st && !st.ok ? `<span class="badge bad">🔒 ${st.why}</span>` : st && st.why ? `<span class="badge warn">${st.why}</span>` : '<span class="badge ok">Подходит</span>'}</div>
    </article>`;
  }
  function bindVac(root) { $$("[data-vac]", root).forEach((el) => { el.onclick = () => openVac(el.dataset.vac); el.onkeydown = (e) => { if (e.key === "Enter") openVac(el.dataset.vac); }; }); }

  /* ===== «Живые» боты ===== */
  function botEvent() {
    const B = D.bots;
    if (Math.random() < 0.72) {
      const [ic, t] = rnd(B.actions); const v = rnd(D.vacancies);
      return { ic, html: `<b>${rnd(B.names)}</b> ${t.replace("{v}", esc(v.title))}` };
    }
    const [ic, t] = rnd(B.employer);
    return { ic, html: t.replace("{c}", `<b>${esc(rnd(D.companies).name)}</b>`) };
  }
  function feedItem(ev, time) { return `<div class="feed-item"><span style="font-size:20px">${ev.ic}</span><span>${ev.html}</span><time>${time}</time></div>`; }
  function startBots() {
    const feed = $("#feed");
    if (feed) feed.innerHTML = [3, 7, 12, 18, 25].map((m) => feedItem(botEvent(), m + " мин назад")).join("");
    let n = 0;
    setInterval(() => {
      const ev = botEvent(); n++;
      if (feed) { feed.insertAdjacentHTML("afterbegin", feedItem(ev, "только что")); while (feed.children.length > 7) feed.lastElementChild.remove(); }
      if (n % 2 === 1) toast(`<span style="font-size:20px">${ev.ic}</span><span>${ev.html}</span>`, false, 4000);
      const on = $("#online"); if (on) on.textContent = (Number(on.textContent) + (Math.random() < .6 ? 1 : -1)).toString();
    }, 8500);
  }

  /* ===== Счётчики и появление ===== */
  function reveal() {
    const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 }) : null;
    $$(".reveal").forEach((el) => io ? io.observe(el) : el.classList.add("in"));
    $$("[data-count]").forEach((el) => {
      const to = Number(el.dataset.count), suf = el.dataset.suf || ""; let s = null;
      const step = (t) => { if (!s) s = t; const p = Math.min((t - s) / 1400, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString("ru-RU") + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  /* ===== GigaChat: анализ вакансии (демо-логика на правилах) ===== */
  const NOT_CYR = "(^|[^а-яё])";
  function analyze(text) {
    const t = " " + text.toLowerCase() + " ";
    const items = [];
    const add = (st, title, sub) => items.push({ st, title, sub });
    if (/(^|\D)(2[2-3]|0[0-5])[:.]\d{2}/.test(t) || /ночн(ая|ые|ой|ую) (смен|работ)/.test(t)) add("bad", "Ночное время", "Работа подростков с 22:00 до 06:00 запрещена (ст. 96 ТК РФ)");
    else add("ok", "Время работы", "Смена в пределах 06:00–22:00");
    if (/предоплат|взнос|залог|депозит|оплат\S* (за )?(обучени|форм)|купить форму|заплатить за/.test(t)) add("bad", "Деньги с соискателя", "Признак мошенничества: честный работодатель не берёт деньги с подростка");
    else add("ok", "Финансовая безопасность", "Нет требований платить работодателю");
    if (new RegExp("алкогол|пиво|пивн|вино" + "|табак|сигарет|вейп|кальян|казино|букмекер|ставки на спорт|ночн\\S* клуб|" + NOT_CYR + "бар([^а-яё]|$)").test(t)) add("bad", "Запрещённая сфера", "Алкоголь, табак, азартные игры и ночные клубы для несовершеннолетних запрещены");
    else add("ok", "Сфера деятельности", "Разрешена для подростков");
    if (/грузчик|тяжел|мешк|разгрузк|переноск/.test(t)) add("warn", "Переноска тяжестей", "Для подростков действуют предельные нормы веса (ст. 265 ТК РФ)");
    if (/бесплатн|без оплаты|за опыт|неоплачива|пробн\S* (день|смен)\S* без/.test(t)) add("bad", "Работа без оплаты", "Неоплачиваемые «пробные смены» запрещены: испытательный срок для подростков не устанавливается");
    const pm = t.match(/(\d[\d\s]{1,6})\s*(₽|руб)/);
    if (!pm) add("warn", "Оплата не указана", "Укажите ставку — без неё вакансия не пройдёт модерацию");
    else {
      const sum = Number(pm[1].replace(/\s/g, ""));
      if (/в час|\/\s*ч|за час|руб\.?\s*\/ч|₽\s*\/\s*ч/.test(t) && sum < 200) add("warn", "Низкая ставка", `${sum} ₽/ч — ниже минимальной ставки платформы 200 ₽/ч`);
      else add("ok", "Оплата", `Указана: ${sum.toLocaleString("ru-RU")} ₽`);
    }
    const hm = t.match(/(\d+(?:[.,]\d)?)\s*(час|ч)([^а-яё]|$)/);
    if (hm) {
      const h = Number(hm[1].replace(",", "."));
      if (h > 7) add("bad", "Слишком длинная смена", `${h} ч — больше максимума для несовершеннолетних (ст. 94 ТК РФ)`);
      else if (h > 4) add("warn", "Длинная смена", `${h} ч — только в каникулы и только для 15–17 лет`);
      else if (h > 2.5) add("ok", "Длительность смены", `${String(h).replace(".", ",")} ч — в учебное время подходит для 16–17 лет, в каникулы — для всех`);
      else add("ok", "Длительность смены", `${String(h).replace(".", ",")} ч — подходит в учебное время для любого возраста`);
    }
    if (/телеграм|telegram|whatsapp|ватсап|в личк|в лс/.test(t)) add("warn", "Связь вне платформы", "Просим вести переписку в защищённом чате платформы");
    if (/договор|самозанят|согласи|оформлени/.test(t)) add("ok", "Оформление", "Указан формат оформления");
    else add("warn", "Оформление не указано", "Платформа предложит договор и шаблон согласия родителя");
    if (text.trim().length < 60) add("warn", "Короткое описание", "Опишите задачи подробнее — так откликов будет больше");
    const bad = items.filter((i) => i.st === "bad").length, warn = items.filter((i) => i.st === "warn").length;
    const score = Math.max(5, 100 - bad * 30 - warn * 8);
    return { items, score, bad, warn };
  }
  function renderAnalysis(box, text, done) {
    const r = analyze(text);
    box.innerHTML = `<div class="gc-powered"><img src="assets/gigachat-icon.png" alt="">GigaChat анализирует вакансию…</div><div class="scan"><i></i></div><div class="legal"></div>`;
    const bar = $(".scan i", box), list = $(".legal", box);
    r.items.forEach((it, i) => setTimeout(() => {
      list.insertAdjacentHTML("beforeend", `<div class="lg ${it.st}" style="animation:fade .3s"><span class="dot">${it.st === "ok" ? "✓" : it.st === "warn" ? "!" : "✕"}</span><div><b>${it.title}</b><span>${it.sub}</span></div></div>`);
      bar.style.width = ((i + 1) / r.items.length * 100) + "%";
    }, 280 * (i + 1)));
    setTimeout(() => {
      const col = r.score >= 85 ? "var(--ok)" : r.score >= 60 ? "var(--warn)" : "var(--danger)";
      const verdict = r.score >= 85 ? "Можно публиковать" : r.score >= 60 ? "Нужны правки" : "Публикация заблокирована";
      box.insertAdjacentHTML("afterbegin", `<div class="score" style="animation:fade .4s"><div class="score-num" style="background:${col}">${r.score}</div><div><h3 style="margin:0">${verdict}</h3><span class="muted">Нарушений: ${r.bad} · Замечаний: ${r.warn}</span></div></div>`);
      $(".gc-powered", box).innerHTML = `<img src="assets/gigachat-icon.png" alt="">Проверено GigaChat · демо-режим`;
      if (done) done(r);
    }, 280 * (r.items.length + 1));
    return r;
  }

  /* ================= Страницы ================= */
  const P = {};

  P.home = () => {
    const box = $("#featured");
    if (box) { box.innerHTML = D.vacancies.filter((v) => ["v1", "v4", "v3", "v5", "v11", "v15"].includes(v.id)).map((v) => vacCard(v)).join(""); bindVac(box); }
  };

  P.vacancies = () => {
    const st = { age: store.get("age", 15), hol: false, mode: params.get("mode") || "all", d: params.get("d") || "all", q: "", only: false };
    const age = $("#age"), ageOut = $("#ageOut"), lim = $("#limitOut");
    age.value = st.age;
    const dSel = $("#fDistrict");
    dSel.innerHTML = `<option value="all">Все районы</option>` + D.districts.map((d) => `<option value="${d.id}">${d.name}</option>`).join("") + `<option value="online">Онлайн</option>`;
    dSel.value = st.d;
    $$("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === st.mode));
    function render() {
      ageOut.textContent = st.age;
      const L = limit(st.age, st.hol);
      lim.innerHTML = `Смена до <b>${String(L).replace(".", ",")} ч</b> в день · до <b>${st.age < 16 ? (st.hol ? 24 : 12) : (st.hol ? 35 : 17.5).toString().replace(".", ",")} ч</b> в неделю`;
      const newId = params.get("new");
      let list = allVac().map((v) => ({ ...v, isNew: v.isNew || v.id === newId }));
      list = list.filter((v) => (st.mode === "all" || v.mode === st.mode) && (st.d === "all" || v.d === st.d) && (!st.q || (v.title + coName(v) + v.cat).toLowerCase().includes(st.q)));
      const withSt = list.map((v) => ({ v, s: check(v, st.age, st.hol) })).filter((x) => !st.only || x.s.ok).sort((a, b) => (b.v.isNew ? 1 : 0) - (a.v.isNew ? 1 : 0) || (b.s.ok ? 1 : 0) - (a.s.ok ? 1 : 0));
      $("#vacCount").textContent = withSt.filter((x) => x.s.ok).length + " из " + withSt.length;
      const box = $("#vacList");
      box.innerHTML = withSt.length ? withSt.map((x) => vacCard(x.v, x.s)).join("") : `<div class="empty" style="grid-column:1/-1">😕 Ничего не нашлось. Попробуйте другой район или режим.</div>`;
      bindVac(box);
    }
    age.oninput = () => { st.age = Number(age.value); store.set("age", st.age); render(); };
    $("#hol").onchange = (e) => { st.hol = e.target.checked; render(); };
    $("#onlyOk").onchange = (e) => { st.only = e.target.checked; render(); };
    dSel.onchange = () => { st.d = dSel.value; render(); };
    $("#q").oninput = (e) => { st.q = e.target.value.trim().toLowerCase(); render(); };
    $$("[data-mode]").forEach((b) => b.onclick = () => { st.mode = b.dataset.mode; $$("[data-mode]").forEach((x) => x.classList.toggle("on", x === b)); render(); });
    render();
    // анкеты подростков
    const seekers = [...store.get("seekers", []), ...D.seekers];
    $("#seekList").innerHTML = seekers.map((s, i) => `<div class="card hover"><div class="who" style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><div class="ava-s">${esc(s.name[0])}</div><div><b>${esc(s.name)}, ${esc(s.age)}</b><div class="muted" style="font-size:13px">📍 ${dName(s.d)} · 🕒 ${esc(s.free)}</div></div>${s.mine ? '<span class="badge grad" style="margin-left:auto">Ваша</span>' : ""}</div>
      <p style="font-size:14px;margin-bottom:10px">${esc(s.about)}</p><div class="chips" style="margin-bottom:14px">${s.skills.map((k) => `<span class="badge">${esc(k)}</span>`).join("")}</div>
      <button class="btn btn-ghost btn-sm" data-invite="${i}">Пригласить на смену</button></div>`).join("");
    $$("[data-invite]").forEach((b) => b.onclick = () => { b.textContent = "✓ Приглашение отправлено"; b.disabled = true; toast("📨 Приглашение отправлено. Подросток и родитель получат уведомление.", true); });
    tabs();
    if (params.get("tab") === "seekers") { const b = $('[data-tab="seek"]'); if (b) b.click(); }
  };

  function tabs() {
    $$(".tabs").forEach((tb) => $$("button", tb).forEach((b) => b.onclick = () => {
      $$("button", tb).forEach((x) => x.classList.toggle("on", x === b));
      $$(".tab-pane").forEach((p) => p.classList.toggle("on", p.id === b.dataset.tab));
    }));
  }

  P.map = () => {
    const vac = allVac().filter((v) => v.x);
    const svg = $("#mapSvg");
    svg.innerHTML = `
      <path class="river" d="M70 100 C150 220 130 330 160 420 C175 470 140 500 145 560 C150 620 140 650 140 695"/>
      <path class="river" style="stroke-width:10" d="M565 40 C540 180 585 300 552 400 C522 480 472 560 440 695"/>
      ${D.districts.map((d) => `<polygon class="district" data-d="${d.id}" points="${d.pts}"><title>${d.name}</title></polygon>`).join("")}
      <text x="118" y="300" fill="#5AAFD3" font-size="13" font-weight="700" transform="rotate(68 118 300)">р. Белая</text>
      <text x="566" y="230" fill="#5AAFD3" font-size="13" font-weight="700" transform="rotate(80 566 230)">р. Уфа</text>
      ${vac.map((v) => { const c = v.mode === "hour" ? "#0FA8E0" : v.mode === "season" ? "#E8A317" : "#21A038"; return `<g class="pin" data-pin="${esc(v.id)}" transform="translate(${v.x} ${v.y})"><title>${esc(v.title)}</title>
        <circle class="pulse" r="12" fill="${c}"/><path d="M0 0 C-11 -14 -13 -20 -13 -25 A13 13 0 1 1 13 -25 C13 -20 11 -14 0 0Z" fill="${c}" stroke="#fff" stroke-width="2.5"/><text y="-21" text-anchor="middle" font-size="13">${v.e}</text></g>`; }).join("")}
      ${D.districts.map((d) => `<text class="d-label" x="${d.lx}" y="${d.ly}" text-anchor="middle">${d.name}</text>`).join("")}`;
    const list = $("#mapList");
    function renderList(d) {
      const arr = allVac().filter((v) => !d || v.d === d);
      $("#mapTitle").textContent = d ? dName(d) + " район" : "Все вакансии Уфы";
      $("#mapCount").textContent = arr.length;
      list.innerHTML = arr.map((v) => `<div class="mini-vac" data-vac="${esc(v.id)}"><div class="vac-emoji">${v.e}</div><div><b>${esc(v.title)}</b><span>${Number(v.pay).toLocaleString("ru-RU")} ₽/${esc(v.unit)} · ${dName(v.d)} · ${v.age}+</span></div></div>`).join("") || `<div class="empty">В этом районе пока нет вакансий — станьте первым работодателем!</div>`;
      bindVac(list);
      $$(".mini-vac", list).forEach((el) => { el.onmouseenter = () => hl(el.dataset.vac); });
    }
    function hl(id) { $$(".pin").forEach((p) => p.style.opacity = id && p.dataset.pin !== id ? .35 : 1); }
    list.addEventListener("mouseleave", () => hl(null));
    $$(".district", svg).forEach((p) => p.onclick = () => {
      const on = p.classList.contains("on");
      $$(".district", svg).forEach((x) => x.classList.remove("on"));
      if (!on) p.classList.add("on");
      renderList(on ? null : p.dataset.d);
    });
    $$(".pin", svg).forEach((p) => p.onclick = (e) => { e.stopPropagation(); openVac(p.dataset.pin); });
    renderList(null);
  };

  P.post = () => {
    tabs();
    if (params.get("as") === "teen") { const b = $('[data-tab="teen"]'); if (b) b.click(); }
    const f = $("#empForm"), legal = $("#legalLive");
    const val = (n) => (f.elements[n] ? f.elements[n].value : "").trim();
    function live() {
      const age = Number(val("age")) || 14, hours = Number(String(val("hours")).replace(",", ".")) || 0, pay = Number(val("pay")) || 0;
      const time = val("time"), mode = val("mode");
      const st = (ok, warn) => ok ? "ok" : warn ? "warn" : "bad";
      const studyLim = limit(age, false), holLim = limit(age, true);
      const night = /(^|\D)(2[2-3]|0[0-5])[:.]\d{2}/.test(time);
      const rows = [
        [st(hours > 0 && hours <= holLim, false), "Длительность смены", hours ? `${hours} ч · лимит для ${age} лет: ${studyLim} ч в учёбу, ${holLim} ч в каникулы` : "Укажите длительность"],
        [mode === "season" || hours <= studyLim ? "ok" : "warn", "Учебное время", hours <= studyLim ? "Подходит для совмещения с учёбой" : "Только в каникулы — отметим автоматически"],
        [night ? "bad" : "ok", "Время смены", night ? "Ночная работа (22:00–06:00) запрещена" : "Дневное время"],
        [pay >= 200 || val("unit") !== "ч" ? "ok" : "warn", "Ставка", pay ? (val("unit") === "ч" && pay < 200 ? "Ниже минимальной ставки 200 ₽/ч" : "Соответствует стандарту платформы") : "Укажите оплату"],
        [/^\d{10}(\d{2})?$/.test(val("inn")) ? "ok" : "warn", "ИНН работодателя", /^\d{10}(\d{2})?$/.test(val("inn")) ? "Формат верный · проверка по ЕГРЮЛ (демо)" : "10 или 12 цифр — для бейджа «Проверен»"],
        ["ok", "Оформление", MODES[mode] ? MODES[mode].law : ""]
      ];
      legal.innerHTML = rows.map((r) => `<div class="lg ${r[0]}"><span class="dot">${r[0] === "ok" ? "✓" : r[0] === "warn" ? "!" : "✕"}</span><div><b>${r[1]}</b><span>${esc(r[2])}</span></div></div>`).join("");
      return rows.some((r) => r[0] === "bad");
    }
    f.addEventListener("input", live); live();
    const text = () => `${val("title")}. ${val("desc")} Время: ${val("time")}. Смена ${val("hours")} ч. Оплата ${val("pay")} ₽ ${val("unit") === "ч" ? "в час" : "за " + val("unit")}. Оформление: ${MODES[val("mode")].law}.`;
    $("#gcBtn").onclick = () => { $("#gcInline").style.display = "block"; renderAnalysis($("#gcInline"), text()); };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (!val("title") || !val("company") || !val("pay") || !val("hours")) { toast("✍️ Заполните название, компанию, оплату и длительность", true); return; }
      if (live()) { toast("⛔ Вакансия нарушает закон — исправьте отмеченные пункты", true); return; }
      const r = analyze(text());
      if (r.bad) { $("#gcInline").style.display = "block"; renderAnalysis($("#gcInline"), text()); toast("⛔ GigaChat нашёл нарушения — публикация заблокирована", true); return; }
      const v = { id: "u" + Date.now(), e: val("emoji") || "✨", title: val("title"), co: "user", coName: val("company"), d: val("district"), pay: Number(val("pay")), unit: val("unit"), hours: Number(String(val("hours")).replace(",", ".")), age: Number(val("age")), mode: val("mode"), cat: "Новое",
        what: val("desc") || "Описание будет дополнено работодателем.", when: val("time") || "По договорённости", where: dName(val("district")), docs: "Паспорт, согласие родителя (шаблон на платформе)", isNew: true, online: val("district") === "online" };
      const d = D.districts.find((x) => x.id === v.d);
      if (d) { const pts = d.pts.split(" ").map((p) => p.split(",").map(Number)); v.x = Math.round(pts.reduce((s, p) => s + p[0], 0) / pts.length); v.y = Math.round(pts.reduce((s, p) => s + p[1], 0) / pts.length) + 18; }
      const my = store.get("myvac", []); my.unshift(v); store.set("myvac", my);
      toast("🚀 Вакансия опубликована и проверена GigaChat! Переходим в ленту…", true);
      setTimeout(() => location.href = "vacancies.html?new=" + v.id, 1300);
    };
    const tf = $("#teenForm");
    tf.onsubmit = (e) => {
      e.preventDefault();
      const g = (n) => tf.elements[n].value.trim();
      if (!g("name") || !g("about")) { toast("✍️ Напишите имя и пару слов о себе", true); return; }
      const s = { name: g("name"), age: Number(g("age")), d: g("district"), skills: g("skills").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 4), about: g("about"), free: g("free") || "Гибко", mine: true };
      if (!s.skills.length) s.skills = ["Готов учиться"];
      const arr = store.get("seekers", []); arr.unshift(s); store.set("seekers", arr);
      toast("🎉 Анкета опубликована! Работодатели Уфы уже могут вас пригласить.", true);
      setTimeout(() => location.href = "vacancies.html?tab=seekers", 1300);
    };
  };

  P.gigachat = () => {
    const ta = $("#gcText"), out = $("#gcOut");
    const PRE = {
      good: "Помощник на детском празднике в студии «Конфетти». Встречать гостей и помогать аниматору. Суббота 12:00–15:00, смена 3 ч. Оплата 300 ₽ в час, на карту после смены. Оформление по договору с самозанятым, нужен шаблон согласия родителя.",
      mid: "Нужен помощник на склад игрушек, иногда переноска коробок. Смена 5 ч по выходным. Оплата 180 ₽ в час. Пиши в телеграм.",
      bad: "Срочно! Работа в ночном клубе, промоутер на входе с 23:00 до 03:00. Бесплатная пробная смена, потом 1500 ₽. Нужен залог за форму 500 ₽."
    };
    $$("[data-preset]").forEach((b) => b.onclick = () => { ta.value = PRE[b.dataset.preset]; run(); });
    const v = params.get("v") && findVac(params.get("v"));
    if (v) ta.value = `${v.title} — ${coName(v)}. ${v.what} ${v.when}, смена ${v.hours} ч. Оплата ${v.pay} ₽ ${v.unit === "ч" ? "в час" : "за " + v.unit}. Оформление: ${MODES[v.mode].law}.`;
    function run() {
      if (ta.value.trim().length < 10) { toast("✍️ Вставьте текст вакансии", true); return; }
      $("#gcRun").disabled = true;
      renderAnalysis(out, ta.value, () => { $("#gcRun").disabled = false; });
      if (window.innerWidth < 980) out.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    $("#gcRun").onclick = run;
    if (v) run();
  };

  P.ratings = () => {
    const sorted = [...D.companies].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    $("#rateList").innerHTML = sorted.map((c, i) => `<div class="rate-row"><div class="place ${i < 3 ? "p" + (i + 1) : ""}">${i + 1}</div>
      <div><b>${esc(c.name)}</b> <span class="badge ok">✓ Проверен</span> <span class="badge">${esc(c.cat)}</span>
      <div class="crit">${["Оплата вовремя", "Как в описании", "Отношение", "Безопасность"].map((n, k) => `<div>${n}<div class="bar"><i style="width:${c.crit[k]}%"></i></div></div>`).join("")}</div></div>
      <div class="big-rate"><span class="star">★</span> ${c.rating.toFixed(1)}<small>${c.reviews} отзывов</small></div></div>`).join("");
    $("#reviews").innerHTML = D.reviews.map((r) => `<div class="review"><div class="who"><div class="ava-s">${esc(r.who[0])}</div><div><b>${esc(r.who)}</b><div class="muted" style="font-size:13px">о «${esc(co(r.co).name.replace(/^.*«|»$/g, ""))}» · ${"★".repeat(r.stars)}</div></div></div><p style="font-size:14px">${esc(r.text)}</p><span class="badge ok" style="margin-top:8px">✓ Подтверждённая смена</span></div>`).join("");
  };

  P.teams = () => {
    const box = $("#teamList");
    function render() {
      const all = [...store.get("teams", []), ...D.teams];
      box.innerHTML = all.map((t, i) => `<div class="card hover"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div class="ico">${t.e}</div>${t.open ? '<span class="badge ok">Набор открыт</span>' : '<span class="badge">Состав полный</span>'}</div>
        <h3>${esc(t.name)}</h3><p style="font-size:14px">${esc(t.dir)}</p>
        <div class="chips" style="margin:12px 0">${t.members.map((m) => `<span class="badge">${esc(m)}</span>`).join("")}</div>
        <div class="vac-foot"><span>✅ ${t.done} заказов · <span class="star">★</span> ${t.rating}</span>${t.open ? `<button class="btn btn-primary btn-sm" data-join="${i}">Вступить</button>` : ""}</div></div>`).join("");
      $$("[data-join]", box).forEach((b) => b.onclick = () => { b.textContent = "✓ Заявка"; b.disabled = true; toast("🤝 Заявка отправлена капитану команды", true); });
    }
    render();
    $("#teamForm").onsubmit = (e) => {
      e.preventDefault();
      const fm = e.target, name = fm.elements.name.value.trim();
      if (!name) { toast("✍️ Придумайте название команды", true); return; }
      const t = { name, e: fm.elements.emoji.value, dir: fm.elements.dir.value, members: ["Вы (капитан)"], done: 0, rating: 5.0, open: true };
      const arr = store.get("teams", []); arr.unshift(t); store.set("teams", arr);
      fm.reset(); render(); toast(`🚀 Команда «${esc(name)}» создана! Пригласите друзей по ссылке.`, true);
      box.scrollIntoView({ behavior: "smooth" });
    };
  };

  P.profile = () => {
    const base = [
      { e: "🎈", t: "Помощник на детском празднике", c: "Студия праздников «Конфетти»", date: "12 октября 2026", h: 3, r: "Ответственный, дети были в восторге!" },
      { e: "🐕", t: "Выгул собак по выходным", c: "Зоогостиница «Хвост»", date: "5 октября 2026", h: 1, r: "Пунктуальный, отличный фотоотчёт." },
      { e: "📣", t: "Раздача листовок у ТЦ", c: "Агентство «Промо-Лаб»", date: "28 сентября 2026", h: 2, r: "Выполнил план на 120%." },
      { e: "🌳", t: "Озеленение парка — летний отряд", c: "Проект «Зелёная Уфа»", date: "Июль 2026", h: 72, r: "Лучший в отряде по качеству работы." }
    ];
    const applied = store.get("applied", []).map(findVac).filter(Boolean);
    $("#tl").innerHTML = applied.map((v) => `<div class="tl"><div class="card" style="padding:18px"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="font-size:24px">${v.e}</span><div style="flex:1"><b>${esc(v.title)}</b><div class="muted" style="font-size:13px">${esc(coName(v))}</div></div><span class="badge warn">⏳ Отклик на рассмотрении</span></div></div></div>`).join("") +
      base.map((s) => `<div class="tl"><div class="card" style="padding:18px"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="font-size:24px">${s.e}</span><div style="flex:1"><b>${s.t}</b><div class="muted" style="font-size:13px">${s.c} · ${s.date} · ${s.h} ч</div></div><span class="badge ok">✓ Подтверждено работодателем</span></div><p style="font-size:14px;margin-top:10px">💬 «${s.r}»</p></div></div>`).join("");
    const acad = store.get("academy", []);
    const B = [["🎓", "Готов к старту", acad.length >= 3], ["⚖️", "Знаю свои права", acad.includes("m1")], ["💰", "Финграмотность", acad.includes("m2")], ["🛡️", "Антимошенник", acad.includes("m3")], ["⏰", "Пунктуальность", true], ["🤝", "Командный игрок", true], ["🌱", "Эко-волонтёр", true], ["🏆", "10 смен", false]];
    $("#badges").innerHTML = B.map((b) => `<span class="bdg ${b[2] ? "" : "off"}">${b[0]} ${b[1]}</span>`).join("");
    $("#hoursTotal").textContent = base.reduce((s, x) => s + x.h, 0);
    $("#printBtn").onclick = () => window.print();
  };

  P.parents = () => {
    const box = $("#pending");
    function render() {
      const ap = store.get("approved", {});
      const list = store.get("applied", []).map(findVac).filter(Boolean);
      const demo = list.length ? list : [findVac("v1"), findVac("v11")];
      box.innerHTML = demo.map((v) => { const s = ap[v.id]; return `<div class="card" style="padding:18px"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div class="vac-emoji">${v.e}</div><div style="flex:1;min-width:180px"><b>${esc(v.title)}</b><div class="muted" style="font-size:13px">${esc(coName(v))} · ${esc(v.when)} · ${Number(v.pay).toLocaleString("ru-RU")} ₽/${esc(v.unit)}</div></div>
        ${s ? `<span class="badge ${s === "yes" ? "ok" : "bad"}">${s === "yes" ? "✓ Согласовано" : "✕ Отклонено"}</span>` : `<div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" data-ok="${esc(v.id)}">Согласовать</button><button class="btn btn-ghost btn-sm" data-no="${esc(v.id)}">Отклонить</button></div>`}</div>
        <div class="vac-meta" style="margin-top:12px"><span class="badge ok">✓ Работодатель проверен</span><span class="badge ok">✓ Дневное время</span><span class="badge ok">✓ ${v.hours} ч — в пределах нормы</span><span class="badge blue">🛡 Безопасная оплата</span></div></div>`; }).join("");
      $$("[data-ok]", box).forEach((b) => b.onclick = () => { ap[b.dataset.ok] = "yes"; store.set("approved", ap); render(); toast("✅ Согласие подписано электронно. Работодатель получил документ.", true); });
      $$("[data-no]", box).forEach((b) => b.onclick = () => { ap[b.dataset.no] = "no"; store.set("approved", ap); render(); toast("Отклик отклонён. Подросток увидит ваш комментарий.", true); });
    }
    render();
    $$(".switch input").forEach((s) => s.onchange = () => toast(s.checked ? "✓ Разрешение включено" : "Разрешение выключено", true));
    setTimeout(() => { const m = $("#weekMeter"); if (m) m.style.width = "50%"; }, 300);
  };

  P.academy = () => {
    const box = $("#modules");
    const done = () => store.get("academy", []);
    function prog() {
      const n = done().length; $("#acadBar").style.width = (n / 3 * 100) + "%"; $("#acadTxt").textContent = `${n} из 3 модулей`;
      $("#acadBadge").classList.toggle("off", n < 3);
    }
    box.innerHTML = D.academy.map((m) => `<div class="card" id="${m.id}"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div class="ico">${m.e}</div><span class="badge" data-st="${m.id}">${done().includes(m.id) ? "✓ Пройдено" : "⏱ " + m.time}</span></div>
      <h3>${m.title}</h3><p style="font-size:15px;margin-bottom:16px">${m.text}</p>
      ${m.q.map((q, qi) => `<div style="margin-bottom:14px"><b style="font-size:14px;display:block;margin-bottom:8px">${qi + 1}. ${q.q}</b><div class="chips">${q.a.map((a, ai) => `<button class="chip" data-m="${m.id}" data-q="${qi}" data-a="${ai}">${a}</button>`).join("")}</div></div>`).join("")}</div>`).join("");
    const answers = {};
    $$("[data-m]", box).forEach((b) => b.onclick = () => {
      const m = D.academy.find((x) => x.id === b.dataset.m), qi = Number(b.dataset.q), ai = Number(b.dataset.a), ok = m.q[qi].ok === ai;
      $$(`[data-m="${m.id}"][data-q="${qi}"]`, box).forEach((x) => { x.classList.remove("on"); x.style.borderColor = ""; });
      b.classList.toggle("on", ok); if (!ok) b.style.borderColor = "var(--danger)";
      toast(ok ? "✅ Верно!" : "❌ Не совсем — попробуйте ещё раз", false, 1800);
      answers[m.id] = answers[m.id] || {}; answers[m.id][qi] = ok;
      if (m.q.every((_, i) => answers[m.id][i])) {
        const d = done(); if (!d.includes(m.id)) { d.push(m.id); store.set("academy", d); toast(`🏅 Модуль «${m.title}» пройден!`, true); }
        $(`[data-st="${m.id}"]`).textContent = "✓ Пройдено"; prog();
        if (done().length === 3) toast("🎓 Бейдж «Готов к старту» получен! Работодатели видят его в вашем профиле.", true, 5500);
      }
    });
    prog();
  };

  P.support = () => {
    const body = $("#chatBody"), form = $("#chatForm"), inp = $("#chatInput");
    const A = [
      [/привет|здравств|добр/, "Привет! 👋 Я Стартик — помощник платформы. Спросите про возраст, оформление, оплату или безопасность."],
      [/14|15|возраст|сколько лет|лет/, "Работать можно с 14 лет: лёгкий труд, в свободное от учёбы время, с письменного согласия родителя. В учебное время смена до 2,5 ч (до 16 лет) или до 4 ч (16–17 лет). Ночью нельзя."],
      [/самозан|налог|чек/, "Самозанятость можно оформить с 14 лет с согласия родителей — прямо из платформы за 3 минуты. Налог 4% с физлиц и 6% с компаний, есть бонус-вычет 10 000 ₽."],
      [/оплат|деньг|заплат|зарплат/, "Работодатель вносит оплату заранее, а вы получаете её на карту сразу после подтверждения смены. Если смену не подтвердили за 24 часа — подключается модератор."],
      [/родит|соглас|мам|пап/, "Родитель подтверждает аккаунт и согласует отклики в разделе «Родителям». Шаблон согласия генерируется автоматически."],
      [/мошен|обман|жалоб|развод/, "Если вас просят заплатить за форму, обучение или «залог» — это мошенничество. Нажмите «Пожаловаться» на вакансии, модератор проверит за 2 часа."],
      [/пособ/, "По разъяснению Минтруда заработок подростка в свободное от учёбы время не учитывается при назначении единого пособия семье. По самозанятости уточняйте в СФР."],
      [/команд|бригад|вместе/, "В разделе «Команды» можно собрать Старт-команду из 2–5 человек и брать проекты вместе. Оплата делится между участниками, у каждого свой чек."],
      [/gigachat|гигачат|провер/, "Каждую вакансию проверяет GigaChat: ночное время, запрещённые сферы, оплату, признаки мошенничества. Попробуйте на странице «GigaChat-проверка»."]
    ];
    const add = (cls, html) => { body.insertAdjacentHTML("beforeend", `<div class="msg ${cls}">${html}</div>`); body.scrollTop = body.scrollHeight; };
    function reply(q) {
      add("me", esc(q));
      body.insertAdjacentHTML("beforeend", `<div class="typing" id="typing"><i></i><i></i><i></i></div>`); body.scrollTop = body.scrollHeight;
      setTimeout(() => {
        const t = $("#typing"); if (t) t.remove();
        const hit = A.find((a) => a[0].test(q.toLowerCase()));
        add("bot", hit ? hit[1] : `Спасибо за вопрос! Передал его оператору — обращение <b>№${Math.floor(10000 + Math.random() * 89999)}</b>. Обычно отвечаем за 15 минут.`);
      }, 900);
    }
    add("bot", A[0][1]);
    form.onsubmit = (e) => { e.preventDefault(); const q = inp.value.trim(); if (!q) return; inp.value = ""; reply(q); };
    $$("[data-q]").forEach((b) => b.onclick = () => reply(b.dataset.q));
    $("#ticketForm").onsubmit = (e) => { e.preventDefault(); toast(`📨 Обращение №${Math.floor(10000 + Math.random() * 89999)} создано. Ответим на почту в течение 2 часов.`, true); e.target.reset(); };
  };

  P.business = () => {
    const r = $("#calcRange"), out = () => {
      const n = Number(r.value);
      $("#calcN").textContent = n;
      $("#calcSave").textContent = (n * 3 * 4 * 260).toLocaleString("ru-RU") + " ₽";
      $("#calcHours").textContent = (n * 3 * 4).toLocaleString("ru-RU");
    };
    if (r) { r.oninput = out; out(); }
    $$("[data-plan]").forEach((b) => b.onclick = () => toast(`🎉 Тариф «${b.dataset.plan}» подключён в демо-режиме. Менеджер свяжется с вами.`, true));
  };

  /* ===== Запуск ===== */
  document.addEventListener("DOMContentLoaded", () => {
    header(); footer(); ensureModal();
    try { if (P[page]) P[page](); } catch (e) { console.error(e); }
    reveal(); startBots();
    document.addEventListener("click", (e) => { const a = e.target.closest("[data-open-vac]"); if (a) { e.preventDefault(); openVac(a.dataset.openVac); } });
  });
})();
