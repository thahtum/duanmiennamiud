/* Ứng dụng website BĐS — đọc dữ liệu từ data.js (window.SITE) */
(function () {
  "use strict";
  const S = window.SITE, B = S.brand, P = S.policy;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const TY = 1e9;
  const nf = (v, d = 2) => Number(v).toLocaleString("vi-VN", { maximumFractionDigits: d });
  const fmtTy = (v) => (v == null ? "Liên hệ" : nf(v) + " tỷ");
  const fmtVnd = (v) => Math.round(v).toLocaleString("vi-VN") + " đ";
  const fmtTr = (v) => (Math.abs(v) >= 1e9 ? nf(v / 1e9, 2) + " tỷ" : nf(v / 1e6, 1) + " tr");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const zaloUrl = "https://zalo.me/" + B.phone;
  const telUrl = "tel:" + B.phone;
  const projBySlug = Object.fromEntries(S.projects.map((p) => [p.slug, p]));

  /* ---------------- dữ liệu giỏ hàng ---------------- */
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  function genSample(p) {
    const s = p.sample || {}; if (!s.count) return [];
    const r = rng(hash(p.slug)); const out = [];
    const per = s.apartment ? 12 : 10;
    const typeCycle = s.apartment ? null : [0, 0, 0, 1, 2, 0];
    for (let i = 0; i < s.count; i++) {
      const bi = Math.floor(i / per), idx = i % per;
      const nB = Math.ceil(s.count / per);
      const zone = p.zoneList[Math.floor((bi * p.zoneList.length) / nB)] || "";
      let u;
      if (s.apartment) {
        const tower = s.prefix[bi % s.prefix.length];
        const zA = s.prefixZone ? p.zoneList[s.prefixZone[bi % s.prefix.length]] : zone;
        const fl = 5 + Math.floor(r() * 30);
        const ti = Math.floor(r() * p.unitTypes.length);
        const area = Math.round([30, 50, 70, 95][ti] * (0.9 + r() * 0.2) * 10) / 10;
        const ppm = s.ppm[0] + r() * (s.ppm[1] - s.ppm[0]);
        u = { code: `${tower}-${fl}${String(idx + 1).padStart(2, "0")}`, zone: zA, type: p.unitTypes[ti], land: area, build: null, floors: fl,
          price: Math.round(area * ppm / 10) / 100, block: `Tòa ${tower}` };
      } else {
        const ti = typeCycle[bi % typeCycle.length] % p.unitTypes.length;
        const ranges = [[s.landRange[0], s.landRange[0] + 50], [200, 320], [320, s.landRange[1]]];
        const rg = ranges[ti] || ranges[0];
        const land = Math.round(rg[0] + r() * (rg[1] - rg[0]));
        const floors = ti === 0 ? 4 + Math.floor(r() * 2) : 3;
        const ppm = s.ppm[0] + r() * (s.ppm[1] - s.ppm[0]) - ti * 10;
        const blockName = `${s.prefix[ti] || "L"}${bi + 1}`;
        u = { code: `${blockName}-${String(idx + 1).padStart(2, "0")}`, zone, type: p.unitTypes[ti], land,
          build: Math.round(land * (ti === 0 ? 0.85 : 0.5) * floors), floors, price: Math.round(land * ppm / 10) / 100, block: blockName };
      }
      const st = r();
      Object.assign(u, {
        project: p.slug, handover: pick(r, p.handovers.length ? p.handovers : ["—"]),
        dir: pick(r, S.directions), legal: p.slug === "grand-park" && r() < 0.5 ? "Sổ hồng sẵn" : (r() < 0.8 ? "Hợp đồng mua bán" : "Đang chờ sổ"),
        status: st < 0.66 ? "con" : st < 0.84 ? "coc" : "ban", rent: !s.apartment && r() < 0.3, sample: true
      });
      out.push(u);
    }
    return out;
  }
  /* giỏ hàng thật theo dự án (file data-<du-an>.js) */
  const REAL = {};
  /* Tính các trường giá của 1 căn từ dòng sheet (GP_SHEET) */
  function sheetRec(d) {
    const total = d.total || null, r = { status: total ? (d.status || "con") : "na", vip: !!d.vip, tcbg: d.tcbg || null, build: d.build || null, total };
    if (!total) return r;
    let pre, vat, kp;
    if (d.pre != null && d.vat != null) { pre = d.pre; vat = d.vat; kp = d.kpbt || 0; } else { vat = total * 0.0876; kp = total * 0.00493; pre = total - vat - kp; r.estSplit = true; }
    r.price = Math.round((pre + vat) / 1e7) / 100; r.vatAmt = Math.round(vat); r.kpbt = r.kpbtAmt = Math.round(kp);
    const dat = d.dat || [];
    r.pol = d.vip ? "VIP" : d.gx && dat[0] ? "GX" : "XL";
    if (r.pol === "GX") { r.g = Math.round(dat[0]); r.gv = Math.round(dat[1] || 0); r.xd = (d.xd || []).map((x) => Math.round(x || 0)); }
    else if (r.pol === "VIP") { r.g = Math.round(total - kp); r.gv = 0; }
    else { r.g = Math.round(pre); r.gv = Math.round(vat); }
    return r;
  }
  if (window.GP_UNITS) {
    const SH = (window.GP_SHEET && window.GP_SHEET.rows) || {}, TP = window.TMB_POS || {}, used = new Set();
    const lot = (r, plan, zone, extra) => {
      const d = SH[r[0]]; if (d) used.add(r[0]);
      const pr = d ? sheetRec(d) : { status: "na" };
      return Object.assign({ code: r[0], project: "green-paradise", plan, zone, block: r[2], type: r[3], land: d && d.land ? d.land : r[4], px: r[5], py: r[6], ang: r[7], poly: r[8] && r[8].length ? r[8] : null,
        floors: null, dir: "—", legal: "Hợp đồng mua bán", handover: pr.tcbg || "—", price: pr.price != null ? pr.price : null, rent: false, onMap: true, tmbPos: TP[r[0]] }, extra || {}, pr, { build: pr.build || null });
    };
    REAL["green-paradise"] = window.GP_UNITS.map((r) => lot(r, "vt", "Vịnh Tiên", { street: r[1] }))
      .concat((window.VN_UNITS || []).map((r) => lot(r, "vn", "Vịnh Ngọc")));
    const gp = S.projects.find((x) => x.slug === "green-paradise"), M = gp && gp.overview && gp.overview.M, vt = gp && gp.maps && gp.maps[0];
    Object.keys(SH).forEach((code) => {
      if (used.has(code)) return;
      const d = SH[code], pr = sheetRec(d), zone = /ngọc/i.test(d.zone || "") ? "Vịnh Ngọc" : "Vịnh Tiên";
      const u = Object.assign({ code, project: "green-paradise", zone, block: code.split("-")[0], type: d.type || "Liền kề", land: d.land, floors: null, dir: "—", legal: "Hợp đồng mua bán",
        handover: pr.tcbg || "—", price: pr.price != null ? pr.price : null, rent: false, onMap: false, tmbPos: TP[code] }, pr);
      // căn Vịnh Tiên nằm ngoài bản vẽ mã căn: đặt chấm theo vị trí trên tổng mặt bằng
      if (u.tmbPos && M && vt && zone === "Vịnh Tiên") { const det = M[0] * M[4] - M[1] * M[3], X = u.tmbPos[0] - M[2], Y = u.tmbPos[1] - M[5];
        const px = (M[4] * X - M[1] * Y) / det, py = (-M[3] * X + M[0] * Y) / det; if (px > 0 && py > 0 && px < vt.width && py < vt.height) Object.assign(u, { px, py, plan: "vt", onMap: true, pin: true }); }
      REAL["green-paradise"].push(u);
    });
  }
  const UNITS = S.projects.flatMap((p) => REAL[p.slug] || genSample(p)).concat((S.units || []).map((u) => Object.assign({ block: u.zone || "Khu", status: "con" }, u)));
  const IS_SAMPLE = UNITS.some((u) => u.sample);
  UNITS.forEach((u) => { u.preVat = u.price != null ? u.price / (1 + P.vat) : null; u.ppm = u.price != null && u.land ? (u.price * 1000) / u.land : null; u.cat = catOf(u.type); });
  S.projects.forEach((p) => { const ps = UNITS.filter((u) => u.project === p.slug && !u.sample && u.price != null && u.status === "con").map((u) => u.price); if (ps.length) p.priceFrom = Math.min(...ps); });
  const unitByCode = Object.fromEntries(UNITS.map((u) => [norm(u.code), u]));
  function catOf(t) { const n = norm(t); if (/studio|pn|can ho/.test(n)) return "Căn hộ"; if (/song lap|don lap|biet thu/.test(n)) return "Biệt thự"; return "Nhà phố"; }
  const STATUS = { con: ["Còn hàng", "b-con", "#2e9e5b"], coc: ["Đã cọc", "b-coc", "#e39b2d"], ban: ["Đã bán", "b-ban", "#c9483c"], lock: ["Đang lock", "b-coc", "#e8b923"], lockdeal: ["Lock deal", "b-lock", "#8e7cc3"], na: ["Chưa có giá", "b-na", "#cfd5d1"] };
  const TYPE_COLOR = { "Liền kề": "#efcf45", "Shophouse": "#f2a65a", "Song lập": "#8f86c9", "Đơn lập": "#ec7d95", "Biệt thự": "#ec7d95" };
  const projSample = (slug) => UNITS.some((u) => u.project === slug && u.sample);
  const sampleTag = (slug) => ((slug ? projSample(slug) : IS_SAMPLE) ? `<span class="sample-tag">DỮ LIỆU MẪU – sẽ thay bằng giỏ hàng thật</span>` : "");
  const byPrice = (a, b) => (a.price == null) - (b.price == null);

  /* ---------------- tiện ích UI ---------------- */
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  let favs = new Set(store.get("favs", []));
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2200); }
  async function copy(text) { try { await navigator.clipboard.writeText(text); toast("Đã sao chép"); } catch (e) { toast("Không sao chép được – hãy bôi đen để copy"); } }
  function openModal(html, wide) { $("#modal-body").innerHTML = html; $("#modal-box").classList.toggle("wide", !!wide); $("#modal-box").classList.remove("qx-wide"); $("#modal").classList.add("show"); }
  function closeModal() { $("#modal").classList.remove("show"); }
  function art(c1, c2, seed, kind) {
    const r = rng(seed);
    let s = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${c2}'/><stop offset='1' stop-color='${c1}'/></linearGradient></defs><rect width='400' height='240' fill='url(#g)'/><circle cx='${290 + r() * 70}' cy='${45 + r() * 30}' r='24' fill='#fff' opacity='.28'/>`;
    let x = 0;
    while (x < 400) { const w = 12 + r() * 24, h = 30 + r() * 80; s += `<rect x='${x}' y='${165 - h}' width='${w}' height='${h}' fill='${c1}' opacity='.32'/>`; x += w + 3; }
    if (kind === "apt") {
      x = 20; while (x < 400) { const w = 40 + r() * 20, h = 90 + r() * 70; s += `<rect x='${x}' y='${205 - h}' width='${w}' height='${h}' fill='#fff' opacity='.9'/>`;
        for (let yy = 205 - h + 8; yy < 198; yy += 10) s += `<rect x='${x + 5}' y='${yy}' width='${w - 10}' height='4' fill='${c1}' opacity='.35'/>`; x += w + 18 + r() * 20; }
    } else {
      x = -10; while (x < 410) { const w = 32 + r() * 18, h = 36 + r() * 30; s += `<rect x='${x}' y='${205 - h}' width='${w}' height='${h}' fill='#fff' opacity='.9'/><polygon points='${x - 3},${205 - h} ${x + w / 2},${191 - h} ${x + w + 3},${205 - h}' fill='${c1}'/><rect x='${x + w * 0.3}' y='${190}' width='${w * 0.4}' height='15' fill='${c1}' opacity='.5'/><rect x='${x + 6}' y='${212 - h}' width='${w - 12}' height='8' fill='${c2}' opacity='.6'/>`; x += w + 3; }
    }
    s += `<rect y='205' width='400' height='35' fill='${c1}'/><path d='M0 218 Q50 212 100 218 T200 218 T300 218 T400 218' stroke='#fff' stroke-opacity='.3' fill='none' stroke-width='2'/></svg>`;
    return `url('data:image/svg+xml,${encodeURIComponent(s).replace(/'/g, "%27")}')`;
  }
  const projArt = (p, i = 0) => (p.image ? `url('${p.thumb || p.image}')` : art(p.color[0], p.color[1], hash(p.slug) + i, p.types[0] === "Căn hộ" ? "apt" : "house"));
  const bgStyle = (img) => `background:${img} center/cover no-repeat`;

  /* ---------------- khung chung ---------------- */
  function chrome() {
    $("#brand-name").textContent = B.name; $("#brand-tag").textContent = B.tagline; $("#logo-mark").textContent = "V";
    $("#tb-phone").textContent = B.hotline; $("#tb-phone").href = telUrl; const t2 = $("#tb-phone2"); if (B.hotline2) { t2.textContent = B.hotline2; t2.href = "tel:" + B.phone2; } else t2.previousSibling && (t2.previousSibling.textContent = ""), t2.remove(); $("#tb-hours").textContent = "Tư vấn " + B.hours;
    $("#cta-call").href = telUrl; $("#cta-zalo").href = zaloUrl;
    const hasU = (p) => UNITS.some((u) => u.project === p.slug);
    const menuP = S.projects.filter(hasU).map((p) => `<a href="#${p.slug}">${esc(p.name)}</a>`).join("") + S.projects.filter((p) => !hasU(p)).map((p) => `<a href="#${p.slug}">${esc(p.name)}</a>`).join("");
    $("#nav").innerHTML = `<a href="#trang-chu" data-nav="trang-chu">Trang nhất</a>
      <div class="dd"><button>Dự án ▾</button><div class="dd-menu">${menuP}</div></div>
      <div class="dd"><button>Loại hình ▾</button><div class="dd-menu"><a href="#can-ho">Căn hộ chung cư</a><a href="#nha-pho">Nhà phố – Shophouse</a><a href="#biet-thu">Biệt thự</a></div></div>
      <a href="#tin-dang" data-nav="tin-dang">Tin đăng</a><a href="#tin-tuc" data-nav="tin-tuc">Tin tức</a><a href="#lien-he" data-nav="lien-he">Liên hệ</a>`;
    $("#burger").onclick = () => $("#nav").classList.toggle("open");
    $("#foot-cols").innerHTML = `<div><div class="logo" style="color:#fff;margin-bottom:12px"><span class="logo-mark">V</span>${esc(B.name)}</div><p>${esc(B.disclaimer)}</p></div>
      <div><h4>Dự án</h4><ul>${S.projects.map((p) => `<li><a href="#${p.slug}">${esc(p.name)}</a></li>`).join("")}</ul></div>
      <div><h4>Chính sách & pháp lý</h4><ul><li><a href="#chinh-sach-bao-mat">Chính sách bảo mật</a></li><li><a href="#chinh-sach-bao-mat">Cookie & quảng cáo</a></li><li><a href="#tin-tuc">Tin tức dự án</a></li><li><a href="#tin-dang">Tất cả tin đăng</a></li></ul></div>
      <div><h4>Liên hệ</h4><ul><li>${esc(B.consultant)}</li><li>Hotline/Zalo: <a href="${telUrl}">${esc(B.hotline)}</a></li>${B.hotline2 ? `<li>Hotline 2: <a href="tel:${B.phone2}">${esc(B.hotline2)}</a></li>` : ""}<li>${esc(B.email)}</li><li>Khu vực: ${esc(B.area)}</li><li>Giờ làm việc: ${esc(B.hours)}</li></ul></div>`;
    $("#foot-copy").textContent = `© ${new Date().getFullYear()} ${B.name}. Thông tin mang tính tham khảo.`;
  }
  function updateFab() { const f = $("#fab-fav"); f.classList.toggle("show", favs.size > 0); $("span", f).textContent = favs.size; }
  function toggleFav(code) { favs.has(code) ? favs.delete(code) : favs.add(code); store.set("favs", [...favs]); updateFab(); $$(`.fav[data-fav="${CSS.escape(code)}"]`).forEach((b) => { b.classList.toggle("on", favs.has(code)); b.textContent = favs.has(code) ? "♥" : "♡"; }); toast(favs.has(code) ? "Đã lưu căn " + code : "Đã bỏ lưu"); }
  function showFavs() {
    const list = [...favs].map((c) => unitByCode[norm(c)]).filter(Boolean);
    const txt = list.map((u) => `${u.code} – ${projBySlug[u.project].short} – ${u.type} ${u.land}m² – ${fmtTy(u.price)}`).join("\n");
    openModal(`<h2 style="font-size:26px">Căn đã lưu</h2>${list.length ? `<table class="sched"><tr><th>Mã căn</th><th>Dự án</th><th>Loại</th><th class="r">Giá</th><th></th></tr>${list.map((u) => `<tr><td><a href="#" data-unit="${esc(u.code)}"><b>${esc(u.code)}</b></a></td><td>${esc(projBySlug[u.project].short)}</td><td>${esc(u.type)} · ${u.land}m²</td><td class="r">${fmtTy(u.price)}</td><td class="r"><button class="btn btn-ghost btn-sm" data-unfav="${esc(u.code)}">Bỏ</button></td></tr>`).join("")}</table>
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap"><button class="btn btn-green" id="fav-copy">Sao chép danh sách</button><a class="btn btn-zalo" href="${zaloUrl}" target="_blank" rel="noopener">Gửi qua Zalo</a><button class="btn btn-gold" data-lead data-note="Tư vấn các căn: ${esc(list.map((u) => u.code).join(", "))}">Nhận báo giá các căn này</button></div><p class="muted" style="font-size:13px">Mẹo: bấm “Sao chép danh sách” rồi dán vào Zalo.</p>` : `<p class="muted">Chưa có căn nào.</p>`}`);
    const c = $("#fav-copy"); if (c) c.onclick = () => copy(txt);
  }

  /* ---------------- form khách hàng ---------------- */
  const BUDGETS = ["Dưới 5 tỷ", "5 – 10 tỷ", "10 – 20 tỷ", "20 – 40 tỷ", "Trên 40 tỷ"];
  function leadFormHtml(opts = {}) {
    const dark = opts.dark;
    return `<form class="form" data-form>
      <div class="row2"><input class="in" name="name" placeholder="Họ và tên *" required><input class="in" name="phone" placeholder="Số điện thoại / Zalo *" required inputmode="tel"></div>
      <div class="row2"><select class="in" name="project"><option value="">Chưa chọn, cần tư vấn</option>${S.projects.map((p) => `<option ${opts.project === p.slug ? "selected" : ""} value="${esc(p.name)}">${esc(p.name)}</option>`).join("")}</select>
      <select class="in" name="type"><option value="">Loại hình</option><option>Căn hộ</option><option>Nhà phố – Shophouse</option><option>Biệt thự</option><option>Chưa xác định</option></select></div>
      <select class="in" name="budget"><option value="">Ngân sách dự kiến</option>${BUDGETS.map((b) => `<option>${b}</option>`).join("")}</select>
      <textarea class="in" name="note" placeholder="Ghi chú (không bắt buộc)">${esc(opts.note || "")}</textarea>
      <button class="btn btn-gold" type="submit">Gửi – nhận bảng giá</button>
      <small style="${dark ? "" : "color:var(--muted)"}">Thông tin chỉ dùng để gửi bảng giá và tư vấn. Xem <a href="#chinh-sach-bao-mat" style="text-decoration:underline">chính sách bảo mật</a>.</small>
      <div class="form-msg"></div></form>`;
  }
  function openLead(project, note) {
    openModal(`<div class="eyebrow">Miễn phí · gửi trong ngày</div><h2 style="font-size:26px">Nhận bảng giá & giỏ hàng</h2><p class="muted" style="margin-top:-4px">Bảng giá cập nhật ${esc(B.updated)}, kèm chính sách thanh toán và căn còn hàng.</p>${leadFormHtml({ project, note })}`);
  }
  async function submitLead(form) {
    const d = Object.fromEntries(new FormData(form).entries());
    const msg = $(".form-msg", form);
    const phone = d.phone.replace(/[^\d+]/g, "");
    if (d.name.trim().length < 2) { msg.className = "form-msg show"; msg.textContent = "Vui lòng nhập họ tên."; return; }
    if (!/^(\+?84|0)\d{9,10}$/.test(phone)) { msg.className = "form-msg show"; msg.textContent = "Số điện thoại chưa đúng (VD: 0912345678)."; return; }
    const text = `Đăng ký nhận bảng giá\nHọ tên: ${d.name}\nSĐT: ${phone}\nDự án: ${d.project || "Cần tư vấn"}\nLoại hình: ${d.type || "-"}\nNgân sách: ${d.budget || "-"}\nGhi chú: ${d.note || "-"}`;
    msg.className = "form-msg show";
    if (B.leadWebhook) {
      try { await fetch(B.leadWebhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(Object.assign(d, { phone, time: new Date().toISOString(), page: location.href })) });
        msg.innerHTML = `✅ Đã gửi thông tin. ${esc(B.consultant)} sẽ liên hệ bạn trong ngày.`; form.reset(); return;
      } catch (e) { /* rơi xuống phương án Zalo */ }
    }
    msg.innerHTML = `Để nhận bảng giá nhanh nhất, gửi thông tin qua Zalo:<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button type="button" class="btn btn-green btn-sm" data-copytext>Sao chép thông tin</button><a class="btn btn-zalo btn-sm" href="${zaloUrl}" target="_blank" rel="noopener">Mở Zalo ${esc(B.hotline)}</a></div>`;
    $("[data-copytext]", msg).onclick = () => copy(text);
  }

  /* ---------------- modal chi tiết căn ---------------- */
  function unitModal(u) {
    const p = projBySlug[u.project], st = STATUS[u.status];
    openModal(`<div class="pimg" style="height:160px;border-radius:12px;margin:-4px 0 16px;${bgStyle(projArt(p, 3))}"><span class="badge ${st[1]}">${st[0]}</span></div>
      <div class="eyebrow">${esc(p.name)} · ${esc(u.zone)}</div><h2 style="font-size:28px;margin-bottom:4px">Căn ${esc(u.code)}</h2>
      <div class="price-from" style="font-size:24px">${u.price != null ? fmtTy(u.price) + ` <span class="muted" style="font-size:13px;font-weight:400">gồm VAT</span>` : "Giá: liên hệ để nhận báo giá"}</div>
      <table class="kv" style="margin:14px 0"><tr><td>Loại hình</td><td>${esc(u.type)}</td></tr><tr><td>Dãy</td><td>${esc(u.block)}${u.street ? " · Trục " + esc(u.street) : ""}</td></tr>${u.total ? `<tr><td>Tổng gồm VAT + KPBT</td><td><b>${fmtVnd(u.total)}</b></td></tr>` : ""}${u.vip ? `<tr><td>Quỹ căn</td><td><b style="color:var(--gold)">★ Quỹ VIP</b></td></tr>` : ""}${u.handover && u.handover !== "—" ? "" : ""}<tr><td>${u.cat === "Căn hộ" ? "DT thông thủy" : "Diện tích đất"}</td><td>${u.land} m²</td></tr>${u.build ? `<tr><td>DT xây dựng</td><td>${u.build} m² · ${u.floors} tầng</td></tr>` : ""}${u.cat === "Căn hộ" ? `<tr><td>Tầng</td><td>${u.floors}</td></tr>` : ""}<tr><td>Hướng</td><td>${esc(u.dir)}</td></tr><tr><td>Bàn giao</td><td>${esc(u.handover)}</td></tr><tr><td>Pháp lý</td><td>${esc(u.legal)}</td></tr>${u.price != null ? `<tr><td>Giá trước VAT</td><td>${fmtTy(u.preVat)}</td></tr><tr><td>Đơn giá</td><td>${nf(u.ppm, 1)} tr/m²</td></tr>` : ""}${u.rent ? `<tr><td>Cam kết thuê</td><td>Có chương trình</td></tr>` : ""}</table>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${u.g && window.GPQuote ? `<button class="btn btn-gold" data-phieu="${esc(u.code)}">📄 Phiếu tính giá · Xuất Excel / Ảnh</button>` : ""}<a class="btn btn-green" href="#${p.slug}" data-quote="${esc(u.code)}">Báo giá chi tiết</a><button class="btn btn-ghost fav-btn" data-favtoggle="${esc(u.code)}">${favs.has(u.code) ? "♥ Đã lưu" : "♡ Lưu căn"}</button><button class="btn btn-gold" data-lead data-project="${p.slug}" data-note="Tư vấn căn ${esc(u.code)}">Nhận tư vấn căn này</button></div>
      ${sampleTag(u.project) ? `<p style="margin:12px 0 0">${sampleTag(u.project)}</p>` : ""}`);
  }

  /* ---------------- TRANG CHỦ ---------------- */
  function home() {
    const sale = S.projects;
    const app = $("#app");
    app.innerHTML = `
    <section class="hero"><svg class="hero-lines" viewBox="0 0 1200 500" preserveAspectRatio="none"><path d="M0 380 C 300 300 500 460 800 340 S 1100 300 1200 320" stroke="#d9b768" fill="none" stroke-width="2"/><path d="M0 420 C 300 340 520 500 820 380 S 1100 340 1200 360" stroke="#d9b768" fill="none"/></svg>
      <div class="wrap"><div class="eyebrow">Cập nhật ${esc(B.updated)}</div>
      <h1>Bảng giá căn hộ, nhà phố, biệt thự <em>Vinhomes miền Nam</em></h1>
      <p>Giỏ hàng trực tiếp theo đợt mở bán, báo giá theo từng mã căn, mặt bằng quỹ căn tương tác và chính sách thanh toán cập nhật hằng tháng.</p>
      <div class="hero-stats"><div><b>${S.projects.length}</b><span>dự án đang bán</span></div><div><b>${UNITS.length.toLocaleString("vi-VN")}</b><span>căn/lô trong giỏ hàng</span></div><div><b>70%</b><span>hỗ trợ vay</span></div></div>
      <p class="note">${esc(B.disclaimer)}</p></div></section>
    <div class="wrap">${searchBox()}</div>
    <section><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Dự án</div><h2>${sale.length} dự án Vinhomes đang bán</h2></div><a class="btn btn-line" href="#tin-dang">Xem tất cả căn</a></div>
      <div class="grid g3">${sale.map(projectCard).join("")}</div></div></section>
    <section style="background:#fff"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Vị trí</div><h2>Vị trí các dự án so với trung tâm</h2></div><p class="muted">Sơ đồ minh họa, không theo tỷ lệ. Bấm vào dự án để xem thời gian di chuyển.</p></div>${locationMap()}</div></section>
    <section><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Vì sao chọn</div><h2>Vì sao nên chọn Vinhomes phía Nam</h2></div></div>
      <div class="grid g4">${[["🛣️", "Hạ tầng đang mở rộng", "Metro số 1, Vành đai 3, cầu Cần Giờ kéo gần các đô thị về trung tâm."], ["🏫", "Tiện ích nội khu", "Công viên, trường học, bệnh viện, trung tâm thương mại trong cùng đô thị."], ["📜", "Pháp lý minh bạch", "Ghi rõ tình trạng pháp lý trên từng căn trong giỏ hàng."], ["📈", "Thanh khoản tốt", "Nhu cầu thuê và mua lại cao ở các đại đô thị đã hình thành."]].map((w) => `<div class="why"><div class="ic">${w[0]}</div><h3>${w[1]}</h3><p class="muted" style="margin:0">${w[2]}</p></div>`).join("")}</div></div></section>
    <section style="background:#fff"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Kinh nghiệm</div><h2>Kinh nghiệm mua nhà</h2></div><a class="btn btn-line" href="#tin-tuc">Xem tất cả bài viết</a></div>
      <div class="grid g3">${S.articles.slice(0, 3).map(articleCard).join("")}</div></div></section>
    <section><div class="wrap two"><div><div class="eyebrow">Hỏi đáp</div><h2>Câu hỏi thường gặp</h2><p class="muted">Chưa thấy câu trả lời? Gọi ${esc(B.hotline)} để được giải đáp.</p></div><div class="faq">${faqHtml(S.homeFaq)}</div></div></section>
    <section id="lien-he" style="scroll-margin-top:80px"><div class="wrap"><div class="lead"><div><div class="eyebrow" style="color:var(--gold-2)">Liên hệ</div><h2>Bạn đang băn khoăn chọn căn nào?</h2><p>Để lại thông tin, ${esc(B.consultant)} gửi bảng giá, giỏ hàng còn trống và phương án tài chính phù hợp ngân sách của bạn.</p><p>📞 <a href="${telUrl}"><b>${esc(B.hotline)}</b></a> · ${esc(B.hours)}</p></div>${leadFormHtml({ dark: true })}</div></div></section>`;
    bindSearch(); bindLocation();
  }
  function projectCard(p) {
    const n = UNITS.filter((u) => u.project === p.slug && u.status === "con").length;
    const has = UNITS.some((u) => u.project === p.slug);
    return `<div class="card pcard"><a href="#${p.slug}" class="pimg" style="${bgStyle(projArt(p))}"><span class="badge">${esc(p.status)}</span></a>
      <div class="pbody"><h3><a href="#${p.slug}">${esc(p.name)}</a></h3><div class="meta"><span>📍 ${esc(p.location)}</span><span>📐 ${esc(p.area)}</span></div>
      <div class="meta"><span>${p.types.map(esc).join(" · ")}</span>${has ? `<span>🏠 ${n ? n + " căn còn hàng" : UNITS.filter((u) => u.project === p.slug).length.toLocaleString("vi-VN") + " lô trên mặt bằng"}</span>` : ""}</div>
      <div class="price-from">${p.priceFrom ? "Từ " + fmtTy(p.priceFrom) : "Giá: liên hệ"}</div>
      <div class="acts">${has ? `<a class="btn btn-green btn-sm" href="#${p.slug}">Xem mặt bằng & giá</a>` : `<a class="btn btn-zalo btn-sm" href="${zaloUrl}" target="_blank" rel="noopener">Nhận giỏ hàng qua Zalo</a>`}<button class="btn btn-ghost btn-sm" data-lead data-project="${p.slug}">Báo giá</button></div></div></div>`;
  }
  function faqHtml(list) { return list.map((f, i) => `<details ${i === 0 ? "open" : ""}><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join(""); }
  function articleCard(a) {
    return `<a class="card pcard acard" href="#bai-${a.slug}"><div class="pimg" style="${bgStyle(art("#17533f", "#d9b768", hash(a.slug), "house"))}"><span class="badge">${esc(a.tag)}</span></div><div class="pbody"><span class="muted" style="font-size:13px">${esc(a.date)}</span><h3 style="font-size:18px">${esc(a.title)}</h3><p class="muted" style="margin:0;font-size:14px">${esc(a.excerpt)}</p></div></a>`;
  }

  /* bộ tìm kiếm */
  const LS = { kw: "", project: "", cat: "", pmin: "", pmax: "", amin: "", amax: "", dir: "", legal: "", status: "", sort: "price-asc", page: 1 };
  function searchBox() {
    return `<div class="search" id="search"><div class="search-grid">
      <div class="field kw"><label>Từ khóa</label><input class="in" id="q-kw" placeholder="Mã căn, dự án, phân khu..."></div>
      <div class="field"><label>Dự án</label><select class="in" id="q-project"><option value="">Tất cả dự án</option>${S.projects.map((p) => `<option value="${p.slug}">${esc(p.short)}</option>`).join("")}</select></div>
      <div class="field"><label>Loại hình</label><select class="in" id="q-cat"><option value="">Tất cả</option><option>Căn hộ</option><option>Nhà phố</option><option>Biệt thự</option></select></div>
      <div class="field"><label>Khoảng giá (tỷ)</label><div class="range2"><input class="in" id="q-pmin" placeholder="Từ" inputmode="decimal"><input class="in" id="q-pmax" placeholder="Đến" inputmode="decimal"></div></div>
      <div class="field"><label>&nbsp;</label><button class="btn btn-green" id="q-go" style="height:44px">Tìm kiếm</button></div></div>
      <div class="search-adv"><div class="field"><label>Diện tích (m²)</label><div class="range2"><input class="in" id="q-amin" placeholder="Từ" inputmode="numeric"><input class="in" id="q-amax" placeholder="Đến" inputmode="numeric"></div></div>
      <div class="field"><label>Hướng</label><select class="in" id="q-dir"><option value="">Tất cả hướng</option>${S.directions.map((d) => `<option>${d}</option>`).join("")}</select></div>
      <div class="field"><label>Pháp lý</label><select class="in" id="q-legal"><option value="">Tất cả</option>${S.legals.map((d) => `<option>${d}</option>`).join("")}</select></div>
      <div class="field"><label>Trạng thái</label><select class="in" id="q-status"><option value="">Tất cả</option><option value="con">Còn hàng</option></select></div></div>
      <div class="search-actions"><button id="q-adv">Bộ lọc ▾</button><button id="q-clear">Xóa lọc</button></div></div>`;
  }
  function bindSearch() {
    $("#q-adv").onclick = () => $("#search").classList.toggle("adv");
    $("#q-clear").onclick = () => $$("#search .in").forEach((i) => (i.value = ""));
    const go = () => { ["kw", "project", "cat", "pmin", "pmax", "amin", "amax", "dir", "legal", "status"].forEach((k) => (LS[k] = $("#q-" + k).value)); LS.page = 1; location.hash = "tin-dang"; };
    $("#q-go").onclick = go; $("#q-kw").onkeydown = (e) => { if (e.key === "Enter") go(); };
  }

  /* sơ đồ vị trí trang chủ */
  const LOC = [
    { slug: "grand-park", x: 640, y: 170, eta: "~35 phút", label: "TP. Thủ Đức" },
    { slug: "sai-gon-park", x: 250, y: 110, eta: "~40 phút", label: "Hóc Môn" },
    { slug: "green-paradise", x: 640, y: 400, eta: "~45 phút khi có cầu Cần Giờ (hiện 1h30–2h qua phà)", label: "Cần Giờ" },
    { slug: "green-city", x: 90, y: 250, eta: "~50 phút", label: "Hậu Nghĩa, Tây Ninh" }
  ];
  function locationMap() {
    const cx = 440, cy = 260;
    const svg = `<svg viewBox="0 0 800 480" id="locsvg"><rect width="800" height="480" fill="#eef3ee"/>
      <path d="M520 0 C 500 80 560 140 520 200 S 440 260 500 320 S 640 380 620 480" stroke="#9cc6d8" stroke-width="18" fill="none" opacity=".8"/>
      <text x="548" y="70" font-size="12" fill="#4e8aa3" font-style="italic">Sông Sài Gòn</text>
      <path d="M600 480 C 660 430 760 430 800 400 L800 480Z" fill="#9cc6d8" opacity=".6"/><text x="770" y="468" text-anchor="end" font-size="12" fill="#3f7f99" font-style="italic">Biển Đông</text>
      ${LOC.map((l) => `<line x1="${cx}" y1="${cy}" x2="${l.x}" y2="${l.y}" stroke="#b8913f" stroke-dasharray="6 6" stroke-width="2" data-line="${l.slug}"/>`).join("")}
      <circle cx="${cx}" cy="${cy}" r="30" fill="#0f3b2e"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">Quận 1</text>
      ${LOC.map((l) => `<g class="pin" data-loc="${l.slug}" transform="translate(${l.x},${l.y})"><circle r="22" fill="${projBySlug[l.slug].color[0]}" stroke="#fff" stroke-width="4"/><text y="5" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">${projBySlug[l.slug].short.split(" ").map((w) => w[0]).join("")}</text><text y="42" text-anchor="middle" font-size="13" fill="#0f3b2e" font-weight="600">${esc(l.label)}</text></g>`).join("")}</svg>`;
    const out = S.projects.filter((p) => !LOC.find((l) => l.slug === p.slug));
    return `<div class="locmap"><div>${svg}</div><div>${LOC.map((l) => { const p = projBySlug[l.slug]; return `<div class="loc-item" data-loc="${l.slug}"><b>${esc(p.name)}</b><div class="muted" style="font-size:14px">${esc(l.label)} · ${esc(p.area)} · tới trung tâm: <b style="color:var(--gold)">${esc(l.eta)}</b></div></div>`; }).join("")}
      <div class="muted" style="font-size:13px;margin:16px 0 8px">Ngoài TP.HCM</div>${out.map((p) => `<a class="loc-item" style="display:block" href="#${p.slug}"><b>${esc(p.name)}</b><div class="muted" style="font-size:14px">${esc(p.location)}</div></a>`).join("")}</div></div>`;
  }
  function bindLocation() {
    const set = (slug) => { $$("[data-loc]").forEach((e) => e.classList.toggle("on", e.dataset.loc === slug)); $$("[data-line]").forEach((l) => { l.setAttribute("stroke-width", l.dataset.line === slug ? 4 : 2); l.setAttribute("stroke", l.dataset.line === slug ? "#0f3b2e" : "#b8913f"); }); };
    $$("[data-loc]").forEach((e) => { e.addEventListener("mouseenter", () => set(e.dataset.loc)); e.addEventListener("click", () => { if (e.tagName === "g") location.hash = e.dataset.loc; else set(e.dataset.loc); }); });
    set("grand-park");
  }

  /* ---------------- TRANG DỰ ÁN ---------------- */
  let pendingQuote = null;
  function projectPage(p) {
    const units = UNITS.filter((u) => u.project === p.slug);
    const has = units.length > 0;
    const nCon = units.filter((u) => u.status === "con").length;
    const secs = [p.overview && ["s-tmb", "Tổng mặt bằng"], has && ["s-matbang", "Mặt bằng quỹ căn"], has && ["s-banghang", "Giỏ hàng"], has && ["s-baogia", "Báo giá"], ["s-vay", "Tính vay"], ["s-tongquan", "Tổng quan"], p.routes.length && ["s-vitri", "Vị trí"], p.zones.length && ["s-phankhu", "Phân khu"], p.products.length && ["s-sanpham", "Sản phẩm"], ["s-hinhanh", "Hình ảnh"], ["s-chinhsach", "Chính sách"], p.amenities.length && ["s-tienich", "Tiện ích"], p.timeline.length && ["s-tiendo", "Tiến độ"], p.faq.length && ["s-hoidap", "Hỏi đáp"], ["s-dangky", "Đăng ký"]].filter(Boolean);
    $("#app").innerHTML = `
    <section class="p-hero" style="background:linear-gradient(100deg,rgba(8,30,24,.92),rgba(8,30,24,.55)),${p.image ? `url('${p.image}')` : projArt(p)} center/cover"><div class="wrap">
      <div class="crumb"><a href="#trang-chu">Trang chủ</a> / Dự án / ${esc(p.short)}</div>
      <div class="eyebrow" style="color:var(--gold-2)">${esc(p.status)} · Giỏ hàng ${esc(B.updated)}</div>
      <h1>${esc(p.name)}</h1><p style="max-width:680px;color:#d6e2dc">${esc(p.summary)}</p>
      <div class="chips"><span class="chip">📍 ${esc(p.location)}</span><span class="chip">📐 ${esc(p.area)}</span>${has ? `<span class="chip">🏠 ${units.length.toLocaleString("vi-VN")} ${units[0].cat === "Căn hộ" ? "căn" : "lô"}${nCon ? " · " + nCon + " còn hàng" : ""}</span>` : ""}<span class="chip">💰 ${p.priceFrom ? "Từ " + fmtTy(p.priceFrom) + " (gồm VAT)" : "Giá liên hệ"}</span><span class="chip">🏦 Vay tối đa ${Math.round(P.loan.maxLtv * 100)}%</span></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${p.overview ? `<button class="btn btn-gold" data-go="s-tmb">Xem tổng mặt bằng & giá</button>` : has ? `<button class="btn btn-gold" data-go="s-matbang">Xem mặt bằng quỹ căn</button>` : ""}<button class="btn btn-line" style="color:#fff;border-color:#fff" data-lead data-project="${p.slug}">Nhận bảng giá</button></div>
      <p style="font-size:12px;color:#9fb6aa;margin-top:16px">${esc(B.disclaimer)}</p></div></section>
    <div class="subnav"><div class="wrap">${secs.map((s) => `<button data-go="${s[0]}">${s[1]}</button>`).join("")}</div></div>
    <div id="psecs">
    ${p.overview ? `<div class="p-sec" id="s-tmb"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Tổng mặt bằng</div><h2>Tổng mặt bằng & căn đang bán</h2></div><p class="muted">Bấm nhóm căn để phóng to, bấm từng căn để xem chi tiết. Căn <b style="color:#c47f0e">★ quỹ VIP</b> được làm nổi bật.</p></div><div class="ov-legend" id="ov-legend"></div><div class="ov" id="ov"></div><p class="muted" style="font-size:12.5px;margin-top:8px">${esc(p.overview.note || "")}. Vị trí các căn ngoài Phân khu A là vị trí tham khảo theo phân khu.</p></div></div>` : ""}
    ${has ? `<div class="p-sec" id="s-matbang"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Tương tác</div><h2>Mặt bằng quỹ căn</h2></div><p class="muted">Kéo để di chuyển, cuộn / chụm 2 ngón để phóng to. Bấm vào lô để xem giá. ${sampleTag(p.slug)}</p></div>
      <div class="filters"><div class="field"><label>${esc(p.zoneLabel || "Phân khu")}</label><select class="in" id="m-zone"><option value="">Tất cả</option>${p.zoneList.map((z) => `<option>${esc(z)}</option>`).join("")}</select></div><div class="field"><label>Loại hình</label><select class="in" id="m-type"><option value="">Tất cả</option>${p.unitTypes.map((z) => `<option>${esc(z)}</option>`).join("")}</select></div><div class="field"><label>Tìm mã căn</label><input class="in" id="m-code" placeholder="VD: ${esc(units[0].code)}" list="codes-${p.slug}"></div></div>
      ${p.maps && p.maps.length > 1 ? `<div class="seg" id="mp-tabs" style="max-width:640px;margin-bottom:12px">${p.maps.map((m, i) => `<button data-mp="${i}" class="${i ? "" : "on"}">${esc(m.name)} <span class="muted" style="font-weight:400">(${units.filter((u) => u.plan === m.id && u.price != null && u.status !== "ban").length} căn đang bán)</span></button>`).join("")}</div>` : ""}
      <div class="mp" id="mp"></div></div></div>
    <div class="p-sec" id="s-banghang"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Bảng hàng</div><h2>Giỏ hàng tháng ${esc(B.updated)}</h2></div><p>${sampleTag(p.slug)}${p.slug === "green-paradise" && window.GP_SHEET ? `<span class="muted">Giỏ hàng đồng bộ từ quỹ căn lúc ${esc(window.GP_SHEET.sync)} · ${UNITS.filter((u) => u.project === p.slug && u.price != null).length} căn có giá</span>` : ""}</p></div><div id="tbl"></div></div></div>
    <div class="p-sec" id="s-baogia"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Báo giá</div><h2>Báo giá chi tiết theo mã căn</h2></div><p class="muted">Nhập mã căn, chọn hạng VinClub, quốc tịch, cam kết thuê và phương án thanh toán để xem phiếu báo giá và lịch thanh toán tham khảo.</p></div><div id="quote"></div></div></div>` :
      `<div class="p-sec"><div class="wrap"><div class="card" style="padding:30px;text-align:center"><h2>Giỏ hàng đang được cập nhật</h2><p class="muted">Đăng ký để nhận giỏ hàng đợt đầu sớm nhất qua Zalo.</p><div style="display:flex;gap:10px;justify-content:center"><a class="btn btn-zalo" href="${zaloUrl}" target="_blank" rel="noopener">Nhận giỏ hàng qua Zalo</a><button class="btn btn-gold" data-lead data-project="${p.slug}">Đăng ký</button></div></div></div></div>`}
    <div class="p-sec" id="s-vay"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Tài chính</div><h2>Tính khoản vay & trả hàng tháng</h2></div><p class="muted">Ước tính theo gói hỗ trợ lãi suất 0% và ân hạn gốc. Lãi suất sau hỗ trợ là giả định, tùy ngân hàng.</p></div><div id="loan"></div></div></div>
    <div class="p-sec" id="s-tongquan"><div class="wrap"><div class="eyebrow">Tổng quan</div><h2>Tổng quan dự án</h2><div class="stats" style="margin:18px 0 24px">${p.stats.filter((s) => s[0]).map((s) => `<div class="stat"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join("")}</div><table class="kv">${p.info.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</table></div></div>
    ${p.routes.length ? `<div class="p-sec" id="s-vitri"><div class="wrap two"><div><div class="eyebrow">Vị trí</div><h2>Kết nối & hạ tầng</h2><p class="muted">${esc(p.location)}</p></div><table class="kv">${p.routes.map((r) => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join("")}</table></div>${p.locationImage ? `<div class="wrap" style="margin-top:24px"><img class="loc-img" src="${esc(p.locationImage)}" alt="Bản đồ kết nối hạ tầng ${esc(p.short)}" loading="lazy" data-zoomimg>${p.locationImage2 ? `<img class="loc-img" src="${esc(p.locationImage2)}" alt="Hạ tầng ${esc(p.short)}" loading="lazy" data-zoomimg style="margin-top:14px">` : ""}<p class="muted" style="font-size:12.5px">Bản đồ kết nối hạ tầng (nguồn: tài liệu dự án). Bấm để phóng to.</p></div>` : ""}</div>` : ""}
    ${p.zones.length ? `<div class="p-sec" id="s-phankhu"><div class="wrap"><div class="eyebrow">Phân khu</div><h2>${p.zones.length} phân khu</h2><div class="grid g4" style="margin-top:18px">${p.zones.map((z) => `<div class="zone"><div class="code">${esc(z.code)}</div><h3>${esc(z.name)}</h3><span class="badge ${z.status === "Đang mở bán" ? "b-con" : "b-coc"}">${esc(z.status)}</span><p class="muted" style="font-size:14px">${esc(z.desc)}</p></div>`).join("")}</div></div></div>` : ""}
    ${p.products.length ? `<div class="p-sec" id="s-sanpham"><div class="wrap"><div class="eyebrow">Sản phẩm</div><h2>Sản phẩm & diện tích</h2><div class="grid g3" style="margin-top:18px">${p.products.map((r, i) => `<div class="card"><div class="pimg" ${r[3] ? `data-zimg="${esc(r[4] || r[3])}" ` : ""}style="height:${r[3] ? 210 : 150}px;${r[3] ? "cursor:zoom-in;" : ""}${bgStyle(r[3] ? `url('${r[3]}')` : projArt(p, i + 10))}"></div><div class="pbody"><h3>${esc(r[0])}</h3><div class="price-from">${esc(r[1])}</div><span class="muted" style="font-size:14px">${esc(r[2])}</span></div></div>`).join("")}</div></div></div>` : ""}
    <div class="p-sec" id="s-hinhanh"><div class="wrap"><div class="eyebrow">Hình ảnh</div><h2>Phối cảnh dự án</h2><div class="gal" style="margin-top:18px">${(p.gallery || ["Toàn cảnh đô thị", "Dãy nhà phố", "Nhà góc", "Mặt tiền liền kề", "Cảnh quan"].map((l) => ({ label: l }))).map((g, i) => `<div data-gal="${i}" ${g.src ? `data-zimg="${esc(g.src)}" ` : ""}style="${bgStyle(g.src ? `url('${g.thumb || g.src}')` : projArt(p, 20 + i))}"><span>${esc(g.label)}</span></div>`).join("")}</div><p class="muted" style="font-size:12.5px">Hình ảnh minh họa (nguồn: tài liệu dự án). Bấm vào ảnh để xem lớn.</p></div></div>
    <div class="p-sec" id="s-chinhsach"><div class="wrap"><div class="eyebrow">Chính sách</div><h2>Chính sách bán hàng</h2><div class="grid g2" style="margin:18px 0">${p.perks.map((x) => `<div class="perk"><i>✓</i><span>${esc(x)}</span></div>`).join("")}</div>
      <div class="grid g3">${P.paymentPlans.map((pl) => `<div class="card" style="padding:18px"><h3>${esc(pl.name)}</h3>${pl.discount ? `<div class="price-from">Chiết khấu ${nf(pl.discount * 100, 1)}%</div>` : ""}<table class="sched">${pl.steps.map((s) => `<tr class="${s.bank ? "bank" : ""}"><td>${esc(s.label)}</td><td class="r"><b>${nf(s.pct * 100, 1)}%</b></td></tr>`).join("")}</table></div>`).join("")}</div><p class="muted" style="font-size:13px">Chính sách thay đổi theo đợt và theo từng mã căn.</p></div></div>
    ${p.amenities.length ? `<div class="p-sec" id="s-tienich"><div class="wrap"><div class="eyebrow">Tiện ích</div><h2>Hệ sinh thái tiện ích all-in-one</h2><div class="tags" style="margin-top:16px">${p.amenities.map((a) => `<span class="tag">${esc(a)}</span>`).join("")}</div>${p.amenityCards ? `<div class="ti-grid">${p.amenityCards.map((a, i) => `<figure data-zimg="${esc(a[0])}" data-cap="${esc(a[1])}"><div style="${bgStyle(`url('${a[0]}')`)}"></div><figcaption><b>${i + 1}</b>${esc(a[1])}</figcaption></figure>`).join("")}</div>` : ""}${p.amenityMap ? `<div style="margin-top:22px"><h3 style="margin:0 0 10px">Tổng mặt bằng tiện ích</h3><img class="loc-img" src="${esc(p.amenityMap)}" alt="Tổng mặt bằng tiện ích ${esc(p.short)}" loading="lazy" data-zoomimg><p class="muted" style="font-size:12.5px">Bấm để phóng to. Hình ảnh minh họa, theo tài liệu chủ đầu tư.</p></div>` : ""}</div></div>` : ""}
    ${p.timeline.length ? `<div class="p-sec" id="s-tiendo"><div class="wrap two"><div><div class="eyebrow">Tiến độ</div><h2>Tiến độ dự án</h2><p class="muted">Theo thông tin chủ đầu tư công bố, có thể điều chỉnh.</p></div><div class="tl">${p.timeline.map((t) => `<div class="tl-i"><b>${esc(t[0])}</b><div>${esc(t[1])}</div></div>`).join("")}</div></div></div>` : ""}
    ${p.faq.length ? `<div class="p-sec" id="s-hoidap"><div class="wrap two"><div><div class="eyebrow">Hỏi đáp</div><h2>Câu hỏi về ${esc(p.short)}</h2></div><div class="faq">${faqHtml(p.faq)}</div></div></div>` : ""}
    <div class="p-sec" id="s-dangky"><div class="wrap"><div class="lead"><div><div class="eyebrow" style="color:var(--gold-2)">Miễn phí</div><h2>Nhận bảng giá & giỏ hàng ${esc(p.short)}</h2><p>Gửi trong ngày: bảng giá theo mã căn, mặt bằng, chính sách thanh toán mới nhất.</p></div>${leadFormHtml({ dark: true, project: p.slug })}</div></div></div>
    </div><datalist id="codes-${p.slug}">${units.map((u) => `<option value="${esc(u.code)}">`).join("")}</datalist>`;
    $$(".p-sec").forEach((s) => (s.style.scrollMarginTop = "120px"));
    let mapApi = null;
    if (has) {
      let curMap = 0;
      const mapUnits = (i) => (p.maps ? units.filter((u) => u.onMap && u.plan === p.maps[i].id) : units);
      const showMap = (i) => { curMap = i; const pv = p.maps ? Object.assign({}, p, { map: p.maps[i] }) : p; mapApi = mountMap($("#mp"), pv, mapUnits(i)); window.__mapApi = wrapApi; $$("#mp-tabs button").forEach((b) => b.classList.toggle("on", +b.dataset.mp === i)); applyMapFilter && applyMapFilter(); };
      const wrapApi = { focus(code) { const u = unitByCode[norm(code)]; if (u && p.maps && u.plan) { const i = p.maps.findIndex((m) => m.id === u.plan); if (i >= 0 && i !== curMap) { showMap(i); return setTimeout(() => mapApi.focus(u.code), 120); } } if (u && !u.onMap) return toast("Căn " + u.code + " chưa có trên bản vẽ mã căn – xem vị trí ở Tổng mặt bằng"); mapApi.focus(code); }, setFilter(f) { mapApi.setFilter(f); } };
      var applyMapFilter = null;
      showMap(0);
      $$("#mp-tabs button").forEach((b) => (b.onclick = () => showMap(+b.dataset.mp)));
      applyMapFilter = () => { const z = $("#m-zone").value, t = $("#m-type").value; mapApi.setFilter((u) => (!z || u.zone === z) && (!t || u.type === t)); };
      $("#m-zone").onchange = applyMapFilter; $("#m-type").onchange = applyMapFilter;
      $("#m-code").onchange = () => { const u = unitByCode[norm($("#m-code").value)]; if (u && u.project === p.slug) wrapApi.focus(u.code); else toast("Không tìm thấy mã căn"); };
      unitTable($("#tbl"), p, units, (u) => { $("#s-matbang").scrollIntoView(); setTimeout(() => wrapApi.focus(u.code), 350); });
      quoteTool($("#quote"), p, units);
    }
    if (p.overview) mountOverview($("#ov"), $("#ov-legend"), p, units);
    loanTool($("#loan"), p);
    $$("[data-gal]:not([data-zimg])").forEach((g) => (g.onclick = () => openModal(`<div style="height:420px;border-radius:12px;${g.getAttribute("style")}"></div><p class="muted">${esc($("span", g).textContent)}</p>`, true)));
    // subnav highlight
    const btns = $$(".subnav button");
    const obs = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) btns.forEach((b) => b.classList.toggle("on", b.dataset.go === e.target.id)); }), { rootMargin: "-130px 0px -60% 0px" });
    secs.forEach((s) => { const el = document.getElementById(s[0]); if (el) obs.observe(el); });
    if (pendingQuote) { const c = pendingQuote; pendingQuote = null; setTimeout(() => { fillQuote(c); $("#s-baogia").scrollIntoView(); }, 60); }
    if (!window.__mapApi || !has) window.__mapApi = mapApi;
  }

  /* ---------- mặt bằng tương tác ---------- */
  function buildAutoPlan(units) {
    const blocks = [], bm = {};
    units.forEach((u) => { const k = u.zone + "|" + u.block; if (!bm[k]) { bm[k] = { name: u.block, zone: u.zone, units: [] }; blocks.push(bm[k]); } bm[k].units.push(u); });
    const LW = { "Liền kề": 15, "Shophouse": 17, "Song lập": 24, "Đơn lập": 30, "Biệt thự": 28 };
    const lotH = 32, road = 38, maxRow = 980;
    let x = road, y = road + 30, rowH = 0, W = 0, zone = null;
    const placed = [], pos = {}, zoneLabels = [];
    blocks.forEach((b) => {
      if (b.zone !== zone) { if (zone !== null) { x = road; y += rowH + road + 40; rowH = 0; } zone = b.zone; zoneLabels.push({ name: zone, y: y - 22 }); }
      const w0 = LW[b.units[0].type] || 14, half = Math.ceil(b.units.length / 2);
      const bw = half * w0 + 8, bh = lotH * 2 + 8;
      if (x + bw > maxRow && x > road) { x = road; y += rowH + road; rowH = 0; }
      placed.push({ b, x, y, bw, bh, w0, half });
      x += bw + road; rowH = Math.max(rowH, bh); W = Math.max(W, x);
    });
    W = Math.max(W, 700) + 220; const H = y + rowH + road + 150;
    let s = `<rect width="${W}" height="${H}" fill="#f4f1e8"/>`;
    s += `<path d="M0 ${H - 110} C ${W * 0.25} ${H - 150} ${W * 0.5} ${H - 60} ${W * 0.75} ${H - 110} S ${W} ${H - 80} ${W} ${H - 120} L ${W} ${H} L0 ${H}Z" fill="#a9d3e0"/>`;
    s += `<rect x="${W - 190}" y="${road + 10}" width="160" height="${Math.min(H - 220, 380)}" rx="24" fill="#bcd9a8"/><text x="${W - 110}" y="${road + 50}" text-anchor="middle" font-size="14" fill="#3c6b2f" font-weight="600">Công viên</text>`;
    for (let i = 0; i < 6; i++) s += `<circle cx="${W - 160 + (i % 3) * 50}" cy="${road + 90 + Math.floor(i / 3) * 60}" r="14" fill="#8fbf7a"/>`;
    zoneLabels.forEach((z) => (s += `<text x="${road}" y="${z.y}" font-size="17" font-weight="700" fill="#0f3b2e">${esc(z.name)}</text>`));
    placed.forEach((pl) => {
      s += `<rect x="${pl.x - 6}" y="${pl.y - 6}" width="${pl.bw + 12}" height="${pl.bh + 12}" rx="6" fill="#d7e4cf"/><text x="${pl.x + pl.bw / 2}" y="${pl.y - 10}" text-anchor="middle" font-size="11" fill="#55635c" font-weight="600">${esc(pl.b.name)}</text>`;
      pl.b.units.forEach((u, i) => {
        const row = i < pl.half ? 0 : 1, col = row ? i - pl.half : i;
        const lx = pl.x + 4 + col * pl.w0, ly = pl.y + 4 + row * lotH, lw = pl.w0 - 1.6, lh = lotH - 1.6;
        pos[u.code] = { x: lx, y: ly, w: lw, h: lh };
        s += `<rect class="lot" data-code="${esc(u.code)}" x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="1.5" fill="${STATUS[u.status][2]}"/>`;
        if (u.rent) s += `<circle cx="${lx + lw / 2}" cy="${ly + lh / 2}" r="3" fill="#fff" pointer-events="none"/>`;
      });
    });
    return { W, H, svg: s, pos };
  }
  function lotFill(u, mode) { return mode === "type" ? TYPE_COLOR[u.type] || "#9aa5a0" : u.vip && u.status === "con" ? "#e0a526" : STATUS[u.status][2]; }
  function buildImagePlan(p, units, mode) {
    const lf = (u) => (p.map.naFill && u.status === "na" && mode === "status" ? p.map.naFill : lotFill(u, mode));
    const W = p.map.width || 2000, H = p.map.height || 1400, pos = {};
    let s = `<image href="${esc(p.map.image)}" width="${W}" height="${H}"/>`, lb = "";
    units.forEach((u) => {
      const c = esc(u.code), f = lf(u);
      if (u.poly) {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, pts = [];
        for (let i = 0; i < u.poly.length; i += 2) { const x = u.poly[i], y = u.poly[i + 1]; pts.push(x + "," + y); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        pos[u.code] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        s += `<polygon class="lot" data-code="${c}" points="${pts.join(" ")}" fill="${f}"/>`;
      } else {
        const x = u.px != null ? u.px : (u.x / 100) * W, y = u.py != null ? u.py : (u.y / 100) * H, r = u.pin ? 2.4 : u.px != null ? 2.2 * (p.map.labelSize || 1.15) / 1.15 : 9;
        if (x == null || isNaN(x)) return;
        pos[u.code] = { x: x - r, y: y - r, w: 2 * r, h: 2 * r };
        s += `<circle class="lot" data-code="${c}" cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
      }
      if (u.px != null) lb += `<text x="${u.px}" y="${u.py}" transform="rotate(${u.ang || 0} ${u.px} ${u.py})">${c}</text>`;
    });
    if (p.map.labels && window[p.map.labels]) lb = window[p.map.labels].map((t) => `<text class="tl" x="${t[0]}" y="${t[1]}" font-size="${t[2]}"${t[3] ? ` transform="rotate(${t[3]} ${t[0]} ${t[1]})"` : ""} textLength="${t[4]}" lengthAdjust="spacingAndGlyphs">${esc(t[5])}</text>`).join("");
    return { W, H, svg: s + `<g class="lbls" style="font-size:${p.map.labelSize || 1.15}px">${lb}</g>`, pos };
  }
  function mountMap(el, p, units) {
    const priced = units.some((u) => u.status !== "na");
    let mode = priced ? "status" : "type";
    const plan = p.map.image ? buildImagePlan(p, units, mode) : buildAutoPlan(units);
    const types = [...new Set(units.map((u) => u.type))];
    const legendHtml = () => (mode === "type" ? types.map((k) => `<label><input type="checkbox" checked data-st="${esc(k)}"><span class="dot" style="background:${TYPE_COLOR[k] || "#999"}"></span>${esc(k)} (${units.filter((u) => u.type === k).length.toLocaleString("vi-VN")})</label>`)
      : Object.entries(STATUS).filter(([k]) => units.some((u) => u.status === k)).map(([k, v]) => `<label><input type="checkbox" checked data-st="${k}"><span class="dot" style="background:${v[2]}"></span>${v[0]} (${units.filter((u) => u.status === k).length})</label>`)).join("")
      + (mode === "status" && units.some((u) => u.vip) ? `<label><span class="dot" style="background:#e0a526"></span>★ Quỹ VIP (${units.filter((u) => u.vip).length})</label>` : "")
      + (priced && p.map.image ? `<label style="margin-left:6px"><select data-mode style="font-size:12px;border:1px solid #ddd;border-radius:6px"><option value="status">Màu theo trạng thái</option><option value="type">Màu theo loại hình</option></select></label>` : "");
    const byCode = Object.fromEntries(units.map((u) => [u.code, u]));
    el.innerHTML = `<div class="mp-stage"><svg width="${plan.W}" height="${plan.H}" viewBox="0 0 ${plan.W} ${plan.H}">${plan.svg}</svg></div>
      <div class="mp-ctrl"><button data-z="in" title="Phóng to">+</button><button data-z="out" title="Thu nhỏ">−</button><button data-z="fit" title="Vừa khung">⤢</button></div>
      <div class="mp-legend"></div>
      <div class="mp-note">${esc(p.map.note || "")}</div><div class="mp-pop"></div>`;
    const stage = $(".mp-stage", el), pop = $(".mp-pop", el), svg = $("svg", el);
    let s = 1, tx = 0, ty = 0, minS = 0.2, fitS = 1;
    const maxS = p.map.image ? 16 : 8;
    const apply = () => { stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; stage.style.setProperty("--k", (1 / s).toFixed(4)); stage.classList.toggle("zoomed", s >= (p.map.labelZoom || 4.5)); };
    const fit = () => { const cw = el.clientWidth, ch = el.clientHeight; s = fitS = Math.min(cw / plan.W, ch / plan.H) * 0.98; minS = s * 0.6; tx = (cw - plan.W * s) / 2; ty = (ch - plan.H * s) / 2; apply(); };
    const zoomAt = (f, cx, cy) => { const ns = clamp(s * f, minS, maxS); tx = cx - (cx - tx) * (ns / s); ty = cy - (cy - ty) * (ns / s); s = ns; apply(); };
    requestAnimationFrame(fit);
    window.addEventListener("resize", fit, { passive: true });
    $$(".mp-ctrl button", el).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const z = b.dataset.z; if (z === "fit") fit(); else zoomAt(z === "in" ? 1.4 : 1 / 1.4, el.clientWidth / 2, el.clientHeight / 2); }));
    el.addEventListener("wheel", (e) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    const pts = new Map(); let moved = false, last = null;
    const ui = (t) => t.closest(".mp-ctrl,.mp-legend,.mp-pop");
    el.addEventListener("pointerdown", (e) => { if (ui(e.target)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false; last = null; el.classList.add("drag"); });
    const onMove = (e) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { const dx = e.clientX - prev.x, dy = e.clientY - prev.y; if (Math.abs(dx) + Math.abs(dy) > 0) { tx += dx; ty += dy; apply(); } if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; }
      else if (pts.size === 2) { const [a, b] = [...pts.values()]; const r = el.getBoundingClientRect(); const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
        if (last) { zoomAt(d / last.d, mx, my); tx += mx - last.mx; ty += my - last.my; apply(); } last = { d, mx, my }; moved = true; }
    };
    const onUp = (e) => { pts.delete(e.pointerId); last = null; if (!pts.size) el.classList.remove("drag"); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp); window.addEventListener("pointercancel", onUp);
    let selEl = null;
    function showPop(u, px, py) {
      if (pop.classList.contains("show") && pop.dataset.code === u.code) return;
      pop.dataset.code = u.code;
      if (selEl) selEl.classList.remove("sel");
      selEl = svg.querySelector(`[data-code="${CSS.escape(u.code)}"]`); if (selEl) selEl.classList.add("sel");
      const st = STATUS[u.status];
      pop.innerHTML = `<button class="x">✕</button><h4>${esc(u.code)} <span class="badge ${st[1]}" style="font-size:11px">${st[0]}</span></h4><div class="kvs"><span>Loại</span><b>${esc(u.type)}</b><span>${u.cat === "Căn hộ" ? "DT TT" : "DT đất"}</span><b>${u.land} m²</b>${u.build ? `<span>DT XD</span><b>${u.build} m²</b>` : ""}${u.dir !== "—" ? `<span>Hướng</span><b>${esc(u.dir)}</b>` : ""}${u.handover !== "—" ? `<span>Bàn giao</span><b>${esc(u.handover)}</b>` : ""}<span>Dãy</span><b>${esc(u.block)}</b><span>Giá gồm VAT</span><b style="color:var(--gold)">${fmtTy(u.price)}</b>${u.total ? `<span>Gồm KPBT</span><b>${fmtTy(u.total / TY)}</b>` : ""}${u.vip ? `<span>Quỹ</span><b style="color:var(--gold)">★ VIP</b>` : ""}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${u.g && window.GPQuote ? `<button class="btn btn-gold btn-sm" data-phieu="${esc(u.code)}">📄 Phiếu tính giá</button>` : ""}<button class="btn btn-green btn-sm" data-q>Báo giá chi tiết</button><button class="btn btn-ghost btn-sm" data-unit="${esc(u.code)}">Chi tiết</button></div>`;
      const cw = el.clientWidth, ch = el.clientHeight;
      pop.style.left = clamp(px + 14, 8, cw - 284) + "px"; pop.style.top = clamp(py - 20, 8, ch - 250) + "px"; pop.classList.add("show");
      $(".x", pop).onclick = () => { pop.classList.remove("show"); pop.dataset.code = ""; if (selEl) selEl.classList.remove("sel"); };
      $("[data-q]", pop).onclick = () => { fillQuote(u.code); $("#s-baogia").scrollIntoView(); };
    }
    svg.addEventListener("click", (e) => { if (moved) return; const t = e.target.closest("[data-code]"); if (!t) { pop.classList.remove("show"); pop.dataset.code = ""; return; } const r = el.getBoundingClientRect(); showPop(byCode[t.dataset.code], e.clientX - r.left, e.clientY - r.top); });
    let on = null, extra = () => true;
    const key = (u) => (mode === "type" ? u.type : u.status);
    const refresh = () => $$(".lot", svg).forEach((l) => { const u = byCode[l.dataset.code]; l.classList.toggle("dim", !(on.has(key(u)) && extra(u))); });
    const legend = $(".mp-legend", el);
    const drawLegend = () => {
      legend.innerHTML = legendHtml(); on = new Set($$("[data-st]", legend).map((c) => c.dataset.st));
      $$("[data-st]", legend).forEach((c) => (c.onchange = () => { c.checked ? on.add(c.dataset.st) : on.delete(c.dataset.st); refresh(); }));
      const ms = $("[data-mode]", legend); if (ms) { ms.value = mode; ms.onchange = () => { mode = ms.value; $$(".lot", svg).forEach((l) => { const uu = byCode[l.dataset.code]; l.setAttribute("fill", p.map.naFill && uu.status === "na" && mode === "status" ? p.map.naFill : lotFill(uu, mode)); }); drawLegend(); refresh(); }; }
    };
    drawLegend();
    return {
      setFilter(fn) { extra = fn; refresh(); },
      focus(code) { const ps = plan.pos[code], u = byCode[code]; if (!ps) return toast("Căn chưa có vị trí trên mặt bằng");
        const cw = el.clientWidth, ch = el.clientHeight; s = clamp(Math.max(s, (p.map.image ? 100 : 70) / Math.max(ps.w, ps.h, 1)), minS, maxS); tx = cw / 2 - (ps.x + ps.w / 2) * s; ty = ch / 2 - (ps.y + ps.h / 2) * s; apply(); showPop(u, cw / 2, ch / 2); }
    };
  }

  /* ---------- tổng mặt bằng (badge giá theo nhóm) ---------- */
  function mountOverview(el, legendEl, p, units) {
    const O = p.overview, M = O.M, W = O.width, H = O.height;
    const tf = (x, y) => [M[0] * x + M[1] * y + M[2], M[3] * x + M[4] * y + M[5]];
    const items = [];
    units.forEach((u) => {
      if (u.price == null || u.status === "ban" || u.status === "na") return;
      let pt = null;
      if (u.tmbPos) pt = u.tmbPos;
      else if (u.onMap && u.poly) { let sx = 0, sy = 0, n = u.poly.length / 2; for (let i = 0; i < u.poly.length; i += 2) { sx += u.poly[i]; sy += u.poly[i + 1]; } pt = tf(sx / n, sy / n); }
      else if (u.onMap && u.px != null) pt = tf(u.px, u.py);
      else { const a = (O.approx || []).find((r) => new RegExp(r[0]).test(u.code)); if (a) { const h = hash(u.code); pt = [a[1] + ((h % 41) - 20), a[2] + (((h >> 6) % 41) - 20)]; } }
      if (pt) items.push({ u, x: pt[0], y: pt[1], val: (u.total || u.price * TY) / TY });
    });
    const nVip = items.filter((i) => i.u.vip).length;
    let showPrice = true;
    legendEl.innerHTML = `<span><span class="dot" style="background:var(--green)"></span>Căn trong giỏ hàng (${items.length} căn, giá gồm VAT + KPBT)</span><span><span class="dot" style="background:#e0a526"></span>★ Quỹ VIP (${nVip} căn)</span><span><span class="dot" style="background:#8e7cc3"></span>Đang lock</span><span><span class="dot" style="background:#c62828"></span>Nhóm nhiều căn (bấm để phóng to)</span><label style="display:flex;gap:6px;align-items:center;font-weight:600;cursor:pointer"><input type="checkbox" id="ov-price" checked> Hiện giá</label>`;
    el.innerHTML = `<div class="ov-stage"><img src="${esc(O.image)}" width="${W}" height="${H}" alt="Tổng mặt bằng ${esc(p.name)}" draggable="false"><div class="ov-tiles"></div><svg class="ov-text" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg></div><div class="ov-pins"></div>
      <div class="mp-ctrl"><button data-z="in" title="Phóng to">+</button><button data-z="out" title="Thu nhỏ">−</button><button data-z="fit" title="Vừa khung">⤢</button><button data-z="fs" title="Toàn màn hình">⛶</button></div>`;
    const stage = $(".ov-stage", el), pins = $(".ov-pins", el), tilesEl = $(".ov-tiles", el), textEl = $(".ov-text", el);
    let s = 1, tx = 0, ty = 0, minS = 0.1, maxS = O.tiles ? 24 : 6;
    /* ô ảnh độ phân giải cao + lớp chữ vector khi phóng to */
    const TL = O.tiles, tileMade = {}, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let textReady = !!window.TMB_TEXT, textLoading = false, grid = null, detailT = 0;
    const buildGrid = () => { grid = {}; const D = window.TMB_TEXT.d; D.forEach((r, i) => { const k = ((r[0] / 200) | 0) + "_" + ((r[1] / 200) | 0); (grid[k] = grid[k] || []).push(i); }); };
    const detail = () => {
      if (!TL) return;
      const cw = el.clientWidth, ch = el.clientHeight, vx0 = -tx / s, vy0 = -ty / s, vx1 = (cw - tx) / s, vy1 = (ch - ty) / s;
      const r = s * dpr, hi = r > TL.levels[0].min; tilesEl.style.display = hi ? "" : "none"; textEl.style.display = r > 1.6 ? "" : "none";
      if (!hi) return;
      TL.levels.forEach((L, li) => {
        let box = tilesEl.children[li]; if (!box) { box = document.createElement("div"); box.style.cssText = "position:absolute;left:0;top:0"; tilesEl.appendChild(box); }
        const on = r > L.min; box.style.display = on ? "" : "none"; if (!on) return;
        const top = li === TL.levels.length - 1 || r <= TL.levels[li + 1].min;
        if (!top && box.childElementCount) return; // tầng dưới đã có ảnh, chỉ tải tầng đang dùng
        const span = TL.size * TL.k / L.z;
        for (let j = Math.max(0, (vy0 / span) | 0); j <= Math.min(L.rows - 1, (vy1 / span) | 0); j++)
          for (let i = Math.max(0, (vx0 / span) | 0); i <= Math.min(L.cols - 1, (vx1 / span) | 0); i++) {
            const key = li + ":" + i + "_" + j; if (tileMade[key]) continue; tileMade[key] = 1;
            const im = new Image(); im.decoding = "async"; im.src = `${L.dir}${i}_${j}.jpg`; im.draggable = false;
            im.style.cssText = `position:absolute;left:${i * span}px;top:${j * span}px;width:${span + 0.6}px;height:${span + 0.6}px`; box.appendChild(im);
          }
      });
      if (r > 4.4) { drawLots(vx0, vy0, vx1, vy1); return; }
      if (!textReady) { if (!textLoading && O.text) { textLoading = true; const sc = document.createElement("script"); sc.src = O.text; sc.onload = () => { textReady = true; buildGrid(); detail(); }; document.head.appendChild(sc); } return; }
      if (!grid) buildGrid();
      const D = window.TMB_TEXT.d, C = window.TMB_TEXT.c, out = [];
      for (let gy = Math.max(0, (vy0 / 200) | 0) - 1; gy <= ((vy1 / 200) | 0) + 1; gy++)
        for (let gx = Math.max(0, (vx0 / 200) | 0) - 1; gx <= ((vx1 / 200) | 0) + 1; gx++) {
          const L = grid[gx + "_" + gy]; if (!L) continue;
          for (const i of L) { const r = D[i]; if (r[2] * s < 5.5 || r[0] < vx0 - 50 || r[0] > vx1 + 10 || r[1] < vy0 - 10 || r[1] > vy1 + 50) continue; out.push(r); if (out.length > 3500) break; }
        }
      textEl.innerHTML = out.map((r) => `<text x="${r[0]}" y="${r[1]}" font-size="${r[2]}" fill="${C[r[5]]}"${r[6] ? ' font-weight="700"' : ""}${r[3] ? ` transform="rotate(${r[3]} ${r[0]} ${r[1]})"` : ""}${r[4] > 0 ? ` textLength="${r[4]}" lengthAdjust="spacingAndGlyphs"` : ""}>${esc(r[7])}</text>`).join("");
    };
    /* nhãn số lô + diện tích trên từng lô khi phóng to sâu */
    let lotGrid = null;
    const lotCol = (u) => (u.status === "ban" ? "#b23b3b" : u.status === "lock" || u.status === "lockdeal" ? "#6b4fb3" : u.price != null ? "#0b5d3b" : "#1d2421");
    function drawLots(vx0, vy0, vx1, vy1) {
      if (s < 13) { textEl.innerHTML = ""; return; }
      if (!lotGrid) { lotGrid = {}; units.forEach((u) => { if (!u.tmbPos) return; const k = ((u.tmbPos[0] / 50) | 0) + "_" + ((u.tmbPos[1] / 50) | 0); (lotGrid[k] = lotGrid[k] || []).push(u); }); }
      const showA = s >= 16, f1 = 0.58, f2 = 0.4, out = [];
      for (let gy = ((vy0 / 50) | 0) - 1; gy <= ((vy1 / 50) | 0) + 1; gy++)
        for (let gx = ((vx0 / 50) | 0) - 1; gx <= ((vx1 / 50) | 0) + 1; gx++) {
          const L = lotGrid[gx + "_" + gy]; if (!L) continue;
          for (const u of L) {
            const [x, y] = u.tmbPos; if (x < vx0 - 2 || x > vx1 + 2 || y < vy0 - 2 || y > vy1 + 2) continue;
            const num = u.code.split("-").pop(), c = lotCol(u), b = u.price != null || u.status === "ban" ? ' font-weight="700"' : "";
            out.push(`<text x="${x}" y="${showA ? y - 0.05 : y + f1 * 0.35}" font-size="${f1}" fill="${c}"${b} text-anchor="middle" stroke="#fff" stroke-width="${f1 * 0.22}" paint-order="stroke">${esc(num)}</text>`);
            if (showA && u.land) out.push(`<text x="${x}" y="${y + f2 * 1.15}" font-size="${f2}" fill="${c}" text-anchor="middle" stroke="#fff" stroke-width="${f2 * 0.22}" paint-order="stroke">${String(Math.round(u.land * 10) / 10).replace(".", ",")}m²</text>`);
            if (out.length > 4000) break;
          }
        }
      textEl.innerHTML = out.join("");
    }
    const draw = () => {
      const cw = el.clientWidth, ch = el.clientHeight, R = cw < 600 ? 40 : 52;
      const pts = items.map((it) => ({ it, sx: it.x * s + tx, sy: it.y * s + ty })).filter((q) => q.sx > -60 && q.sx < cw + 60 && q.sy > -60 && q.sy < ch + 80);
      pts.sort((a, b) => b.it.u.vip - a.it.u.vip || a.it.val - b.it.val);
      const used = new Set(), groups = [];
      pts.forEach((q, i) => { if (used.has(i)) return; const g = [q]; used.add(i);
        pts.forEach((r, j) => { if (!used.has(j) && Math.hypot(r.sx - q.sx, r.sy - q.sy) < R) { g.push(r); used.add(j); } }); groups.push(g); });
      pins.innerHTML = groups.map((g, gi) => {
        if (g.length === 1) { const u = g[0].it.u, cls = u.vip ? "vip" : u.status === "con" ? "one" : "lock";
          return `<div class="pinb ${showPrice ? cls : cls + " dot"}" data-unit="${esc(u.code)}" style="left:${g[0].sx}px;top:${g[0].sy}px">${showPrice ? `${u.vip ? "★ " : ""}${nf(g[0].it.val)} tỷ<small>${esc(u.code)}${u.status !== "con" ? " · " + STATUS[u.status][0] : ""}</small>` : ""}</div>`; }
        const cx = g.reduce((a, q) => a + q.sx, 0) / g.length, cy = g.reduce((a, q) => a + q.sy, 0) / g.length, mn = Math.min(...g.map((q) => q.it.val)), nv = g.filter((q) => q.it.u.vip).length;
        return `<div class="pinb grp ${nv ? "hasvip" : ""} ${showPrice ? "" : "dot"}" data-grp="${gi}" style="left:${cx}px;top:${cy}px">${showPrice ? `${g.length} căn<small>từ ${nf(mn)} tỷ${nv ? ` · ★${nv} VIP` : ""}</small>` : ""}</div>`;
      }).join("");
      $$("[data-grp]", pins).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const g = groups[+b.dataset.grp];
        if (s >= maxS * 0.95) { const L = g.map((q) => q.it).sort((x, y) => x.val - y.val);
          openModal(`<h2 style="font-size:24px">${L.length} căn tại vị trí này</h2><table class="sched"><tr><th>Mã căn</th><th>Loại</th><th class="r">DT đất</th><th class="r">Giá gồm VAT + KPBT</th></tr>${L.map((it) => `<tr><td><a href="#" data-unit="${esc(it.u.code)}"><b>${it.u.vip ? "★ " : ""}${esc(it.u.code)}</b></a></td><td>${esc(it.u.type)}</td><td class="r">${it.u.land} m²</td><td class="r"><b>${nf(it.val)} tỷ</b></td></tr>`).join("")}</table>`); return; }
        const xs = g.map((q) => q.it.x), ys = g.map((q) => q.it.y), bw = Math.max(...xs) - Math.min(...xs) + 1, bh = Math.max(...ys) - Math.min(...ys) + 1;
        const ns = clamp(Math.min(cw / bw, ch / bh) * 0.5, s * 1.8, maxS), mx = (Math.max(...xs) + Math.min(...xs)) / 2, my = (Math.max(...ys) + Math.min(...ys)) / 2;
        s = ns; tx = cw / 2 - mx * s; ty = ch / 2 - my * s; apply(); }));
    };
    const apply = () => { stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; draw(); clearTimeout(detailT); detailT = setTimeout(detail, 90); };
    const fit = () => { const cw = el.clientWidth, ch = el.clientHeight; s = Math.min(cw / W, ch / H); minS = s * 0.8; tx = (cw - W * s) / 2; ty = (ch - H * s) / 2; apply(); };
    const zoomAt = (f, cx, cy) => { const ns = clamp(s * f, minS, maxS); tx = cx - (cx - tx) * (ns / s); ty = cy - (cy - ty) * (ns / s); s = ns; apply(); };
    requestAnimationFrame(fit); window.addEventListener("resize", fit, { passive: true });
    document.addEventListener("fullscreenchange", () => setTimeout(fit, 60));
    $("#ov-price").onchange = (e) => { showPrice = e.target.checked; draw(); };
    $$(".mp-ctrl button", el).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const z = b.dataset.z;
      if (z === "fit") fit(); else if (z === "fs") { try { document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen().catch(() => toast("Trình duyệt không cho phép toàn màn hình")); } catch (er) { toast("Không mở được toàn màn hình"); } }
      else zoomAt(z === "in" ? 1.5 : 1 / 1.5, el.clientWidth / 2, el.clientHeight / 2); }));
    el.addEventListener("wheel", (e) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    const P2 = new Map(); let last = null;
    el.addEventListener("pointerdown", (e) => { if (e.target.closest(".mp-ctrl,.pinb")) return; P2.set(e.pointerId, { x: e.clientX, y: e.clientY }); last = null; el.classList.add("drag"); });
    window.addEventListener("pointermove", (e) => { if (!P2.has(e.pointerId)) return; const prev = P2.get(e.pointerId); P2.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (P2.size === 1) { tx += e.clientX - prev.x; ty += e.clientY - prev.y; apply(); }
      else if (P2.size === 2) { const [a1, b1] = [...P2.values()], r = el.getBoundingClientRect(), d = Math.hypot(a1.x - b1.x, a1.y - b1.y), mx = (a1.x + b1.x) / 2 - r.left, my = (a1.y + b1.y) / 2 - r.top;
        if (last) { zoomAt(d / last.d, mx, my); tx += mx - last.mx; ty += my - last.my; apply(); } last = { d, mx, my }; } });
    const up = (e) => { P2.delete(e.pointerId); last = null; if (!P2.size) el.classList.remove("drag"); };
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  }

  /* ---------- bảng hàng ---------- */
  function unitTable(el, p, units, onLocate) {
    const st = { zone: "", type: "", handover: "", status: "", amin: "", amax: "", sort: units.some((u) => u.price != null) ? "price-asc" : "code-asc", limit: 100, block: "" };
    const apt = units[0] && units[0].cat === "Căn hộ";
    el.innerHTML = `<div class="filters">
      <div class="field"><label>${esc(p.zoneLabel || "Phân khu")}</label><select class="in" data-f="zone"><option value="">Tất cả</option>${p.zoneList.map((z) => `<option>${esc(z)}</option>`).join("")}</select></div>
      <div class="field"><label>Loại hình</label><select class="in" data-f="type"><option value="">Tất cả</option>${p.unitTypes.map((z) => `<option>${esc(z)}</option>`).join("")}</select></div>
      ${p.handovers.length ? `<div class="field"><label>Bàn giao</label><select class="in" data-f="handover"><option value="">Tất cả</option>${p.handovers.map((z) => `<option>${esc(z)}</option>`).join("")}</select></div>` : ""}
      <div class="field"><label>Trạng thái</label><select class="in" data-f="status"><option value="">Tất cả</option>${Object.entries(STATUS).filter(([k]) => units.some((u) => u.status === k)).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join("")}</select></div>
      <div class="field"><label>${apt ? "DT thông thủy" : "DT đất"} (m²)</label><div class="range2"><input class="in" data-f="amin" placeholder="Từ" inputmode="numeric"><input class="in" data-f="amax" placeholder="Đến" inputmode="numeric"></div></div>
      <div class="field"><label>Sắp xếp</label><select class="in" data-f="sort"><option value="code-asc">Mã căn A → Z</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option><option value="ppm-asc">Đơn giá thấp nhất</option><option value="land-asc">Diện tích nhỏ → lớn</option><option value="land-desc">Diện tích lớn → nhỏ</option>${apt ? "" : `<option value="build-desc">DT xây dựng lớn nhất</option>`}</select></div></div>
      <div class="tbl-wrap"><table class="units"><thead><tr><th data-s="code">Mã căn</th><th data-s="price" class="r">Giá gồm VAT</th><th class="r" data-s="price">Giá trước VAT</th><th class="r" data-s="ppm">Đơn giá (tr/m²)</th><th>Loại hình</th><th>Bàn giao</th><th class="r" data-s="land">${apt ? "DT TT" : "DT đất"}</th>${apt ? "<th class='r'>Tầng</th>" : `<th class="r" data-s="build">DT XD</th>`}<th>Hướng</th><th>${esc(p.zoneLabel || "Phân khu")}</th><th>Trạng thái</th><th></th></tr></thead><tbody></tbody></table></div>
      <div class="tbl-foot"><span id="tbl-count"></span><span class="muted">Bấm vào dòng để xem chi tiết · 📍 để xem vị trí trên mặt bằng</span></div>`;
    const tb = $("tbody", el);
    const render = () => {
      let list = units.filter((u) => (!st.zone || u.zone === st.zone) && (!st.type || u.type === st.type) && (!st.handover || u.handover === st.handover) && (!st.status || u.status === st.status) && (!st.amin || u.land >= +st.amin) && (!st.amax || u.land <= +st.amax));
      const [k, dir] = st.sort.split("-"); list.sort((a, b) => (k === "code" ? a.code.localeCompare(b.code, "vi", { numeric: true }) : (a[k] == null) - (b[k] == null) || ((a[k] || 0) - (b[k] || 0)) * (dir === "desc" ? -1 : 1) || a.code.localeCompare(b.code, "vi", { numeric: true })));
      const full = list; list = list.slice(0, st.limit);
      tb.innerHTML = list.map((u) => `<tr data-unit="${esc(u.code)}" style="cursor:pointer"><td class="code">${esc(u.code)}${u.vip ? " <span title='Quỹ VIP' style='color:var(--gold)'>★</span>" : ""}${u.rent ? " <span title='Cam kết thuê'>🔑</span>" : ""}</td><td class="r"><b>${fmtTy(u.price)}</b></td><td class="r">${u.price != null ? fmtTy(u.preVat) : "–"}</td><td class="r">${u.ppm != null ? nf(u.ppm, 1) : "–"}</td><td>${esc(u.type)}</td><td>${esc(u.handover)}</td><td class="r">${u.land}</td><td class="r">${apt ? u.floors : u.build || "–"}</td><td>${esc(u.dir)}</td><td>${esc(u.zone)}</td><td><span class="badge ${STATUS[u.status][1]}">${STATUS[u.status][0]}</span></td><td><button class="btn btn-ghost btn-sm" data-locate="${esc(u.code)}" title="Xem trên mặt bằng">📍</button></td></tr>`).join("") || `<tr><td colspan="12" class="empty">Không có căn phù hợp bộ lọc.</td></tr>`;
      const nc = full.filter((u) => u.status === "con").length;
      $("#tbl-count").innerHTML = `Hiển thị <b>${list.length.toLocaleString("vi-VN")}</b> / ${full.length.toLocaleString("vi-VN")} kết quả (tổng ${units.length.toLocaleString("vi-VN")})${nc ? ` · còn hàng <b>${nc}</b>` : ""}` + (full.length > list.length ? ` <button class="btn btn-ghost btn-sm" id="tbl-more">Xem thêm ${Math.min(100, full.length - list.length)}</button>` : "");
      const mb = $("#tbl-more"); if (mb) mb.onclick = () => { st.limit += 100; render(); };
    };
    $$("[data-f]", el).forEach((i) => { i.value = st[i.dataset.f]; i.oninput = () => { st[i.dataset.f] = i.value; st.limit = 100; render(); }; });
    $$("th[data-s]", el).forEach((th) => (th.onclick = () => { const k = th.dataset.s; st.sort = st.sort === k + "-asc" ? k + "-desc" : k + "-asc"; render(); }));
    tb.addEventListener("click", (e) => { const l = e.target.closest("[data-locate]"); if (l) { e.stopPropagation(); onLocate(unitByCode[norm(l.dataset.locate)]); } }, true);
    render();
  }

  /* ---------- báo giá ---------- */
  let quoteState = null;
  function quoteTool(el, p, units) {
    const first = units.find((u) => u.status === "con") || units[0];
    quoteState = { p, units, code: first.code, tier: "none", nat: "vn", rent: true, plan: P.paymentPlans[0].id };
    el.innerHTML = `<div class="quote"><div class="qform">
      <div class="field"><label>Mã căn</label><input class="in" id="qt-code" list="codes-${p.slug}" value="${esc(first.code)}"></div>
      <div class="field"><label>Hạng VinClub</label><div class="seg" data-seg="tier">${Object.keys(P.vinclub).map((k) => `<button data-v="${k}">${P.vinclubLabel[k]}</button>`).join("")}</div></div>
      <div class="field"><label>Quốc tịch</label><div class="seg" data-seg="nat"><button data-v="vn">Việt Nam</button><button data-v="fo">Nước ngoài</button></div></div>
      <div class="field"><label>Cam kết thuê lại</label><div class="seg" data-seg="rent"><button data-v="1">Có</button><button data-v="0">Không</button></div></div>
      <div class="field"><label>Phương án thanh toán</label><select class="in" id="qt-plan">${P.paymentPlans.map((pl) => `<option value="${pl.id}">${esc(pl.name)}</option>`).join("")}</select></div>
      <p class="muted" style="font-size:12.5px;margin:0">Phiếu báo giá mang tính tham khảo, chính sách áp dụng theo thời điểm ký.</p></div>
      <div id="qt-out"></div></div>`;
    $("#qt-code").oninput = () => { quoteState.code = $("#qt-code").value; renderQuote(); };
    $("#qt-plan").onchange = () => { quoteState.plan = $("#qt-plan").value; renderQuote(); };
    $$("[data-seg]", el).forEach((sg) => sg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const k = sg.dataset.seg; quoteState[k] = k === "rent" ? b.dataset.v === "1" : b.dataset.v; renderQuote(); }));
    renderQuote();
  }
  function fillQuote(code) { if (!quoteState) return; quoteState.code = code; const i = $("#qt-code"); if (i) i.value = code; renderQuote(); }
  function calcQuote(u, q) {
    const plan = P.paymentPlans.find((x) => x.id === q.plan);
    const list = u.price * TY, lines = [], disc = [];
    lines.push(["Giá niêm yết (gồm VAT)", list]);
    if (P.vinclub[q.tier]) disc.push([`Ưu đãi VinClub ${P.vinclubLabel[q.tier]} (${nf(P.vinclub[q.tier] * 100, 1)}%)`, list * P.vinclub[q.tier]]);
    if (plan.discount) disc.push([`Chiết khấu ${plan.name.toLowerCase()} (${nf(plan.discount * 100, 1)}%)`, list * plan.discount]);
    if (u.rent && !q.rent) disc.push([`Không nhận cam kết thuê (${nf(P.noRentDiscount * 100, 1)}%)`, list * P.noRentDiscount]);
    const net = list - disc.reduce((a, d) => a + d[1], 0);
    const k = net / list;
    const vat = u.vatAmt != null ? u.vatAmt * k : net - net / (1 + P.vat), pre = net - vat, kpbt = u.kpbtAmt != null ? u.kpbtAmt * k : pre * P.maintenance;
    const sched = plan.steps.map((s, i) => ({ ...s, amt: net * s.pct + (i === plan.steps.length - 1 ? 0 : 0) }));
    let hi = sched.findIndex((s) => /bàn giao/i.test(s.label)); if (hi < 0) { hi = sched.length - 1; while (hi > 0 && sched[hi].bank) hi--; } sched[hi].kpbt = kpbt;
    return { plan, list, disc, net, pre, vat, kpbt, total: net + kpbt, sched, rentInc: u.rent && q.rent ? pre * P.rentYield * P.rentYears : 0 };
  }
  function renderQuote() {
    const q = quoteState, out = $("#qt-out"); if (!out) return;
    $$("[data-seg]").forEach((sg) => $$("button", sg).forEach((b) => { const k = sg.dataset.seg; const v = k === "rent" ? (q.rent ? "1" : "0") : q[k]; b.classList.toggle("on", b.dataset.v === v); }));
    const sel = $("#qt-plan"); if (sel) sel.value = q.plan;
    const u = unitByCode[norm(q.code)];
    if (!u || u.project !== q.p.slug) { out.innerHTML = `<div class="slip"><div class="empty">Nhập đúng mã căn thuộc ${esc(q.p.short)} để xem báo giá.<br>VD: ${q.units.slice(0, 3).map((x) => `<a href="#" data-qc="${esc(x.code)}" style="color:var(--gold);font-weight:600">${esc(x.code)}</a>`).join(", ")}</div></div>`; $$("[data-qc]", out).forEach((a) => (a.onclick = (e) => { e.preventDefault(); fillQuote(a.dataset.qc); })); return; }
    if (u.price == null) {
      out.innerHTML = `<div class="slip"><div class="slip-head"><div><div style="font-size:12.5px;opacity:.8">THÔNG TIN LÔ · ${esc(q.p.short)}</div><h3>Căn ${esc(u.code)}</h3><div style="font-size:14px;opacity:.9">${esc(u.zone)} · Dãy ${esc(u.block)} · ${esc(u.type)} · ${u.land} m² đất</div></div><div><span class="badge b-na">Chưa có giá trên web</span></div></div>
        <div class="slip-body"><p>Mã căn này đã có trên mặt bằng nhưng <b>chưa được cập nhật giá</b>. Gửi mã căn cho tư vấn viên để nhận phiếu báo giá chính thức, cách tính chiết khấu và lịch thanh toán.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-zalo" href="${zaloUrl}" target="_blank" rel="noopener">Nhận báo giá qua Zalo</a><button class="btn btn-gold" data-lead data-project="${q.p.slug}" data-note="Báo giá căn ${esc(u.code)} (${esc(u.type)}, ${u.land} m²)">Để lại SĐT nhận báo giá</button><button class="btn btn-ghost" data-favtoggle="${esc(u.code)}">${favs.has(u.code) ? "♥ Đã lưu" : "♡ Lưu căn"}</button><button class="btn btn-ghost" id="qt-onmap">📍 Xem trên mặt bằng</button></div></div></div>`;
      $("#qt-onmap").onclick = () => { $("#s-matbang").scrollIntoView(); setTimeout(() => window.__mapApi && window.__mapApi.focus(u.code), 350); };
      return;
    }
    if (u.g && window.GPQuote) { out.innerHTML = window.GPQuote.inline(u); return; }
    const r = calcQuote(u, q), st = STATUS[u.status];
    const txt = [`PHIẾU BÁO GIÁ THAM KHẢO – ${q.p.name}`, `Căn: ${u.code} | ${u.type} | ${u.land}m²${u.build ? " | XD " + u.build + "m²" : ""} | Hướng ${u.dir}`, `Phương án: ${r.plan.name}`, `Giá niêm yết: ${fmtVnd(r.list)}`, ...r.disc.map((d) => `${d[0]}: -${fmtVnd(d[1])}`), `Giá sau ưu đãi (gồm VAT): ${fmtVnd(r.net)}`, `Kinh phí bảo trì: ${fmtVnd(r.kpbt)}`, `TỔNG: ${fmtVnd(r.total)}`, "Lịch thanh toán:", ...r.sched.map((s) => `- ${s.label} (${nf(s.pct * 100, 1)}%): ${fmtVnd(s.amt + (s.kpbt || 0))}${s.bank ? " [ngân hàng]" : ""}`), `Liên hệ: ${B.hotline}`].join("\n");
    out.innerHTML = `<div class="slip"><div class="slip-head"><div><div style="font-size:12.5px;opacity:.8">PHIẾU BÁO GIÁ THAM KHẢO · ${esc(B.updated)}</div><h3>Căn ${esc(u.code)}</h3><div style="font-size:14px;opacity:.9">${esc(q.p.short)} · ${esc(u.zone)} · ${esc(u.type)} · ${u.land} m²${u.build ? " · XD " + u.build + " m²" : ""} ${u.dir !== "—" ? "· Hướng " + esc(u.dir) : ""}${u.handover !== "—" ? " · " + esc(u.handover) : ""}</div></div><div style="text-align:right"><span class="badge ${st[1]}">${st[0]}</span><div style="font-size:12px;opacity:.8;margin-top:8px">Tổng thanh toán</div><div style="font-size:26px;font-weight:700;color:var(--gold-2)">${fmtTy(r.total / TY)}</div></div></div>
      <div class="slip-body"><div class="two" style="gap:26px"><div><h3>Cách tính giá</h3><table class="lines"><tr><td>Giá niêm yết (gồm VAT)</td><td>${fmtVnd(r.list)}</td></tr>${r.disc.map((d) => `<tr class="neg"><td>${esc(d[0])}</td><td>−${fmtVnd(d[1])}</td></tr>`).join("")}<tr><td><b>Giá sau ưu đãi (gồm VAT)</b></td><td><b>${fmtVnd(r.net)}</b></td></tr><tr><td class="muted">Trong đó giá trước VAT</td><td class="muted">${fmtVnd(r.pre)}</td></tr><tr><td class="muted">Thuế VAT</td><td class="muted">${fmtVnd(r.vat)}</td></tr><tr><td>Kinh phí bảo trì (KPBT)</td><td>${fmtVnd(r.kpbt)}</td></tr><tr class="tot"><td>Tổng thanh toán</td><td>${fmtVnd(r.total)}</td></tr></table>
        ${r.rentInc ? `<div class="perk" style="margin-top:12px"><i>🔑</i><span>Cam kết thuê ${nf(P.rentYield * 100)}%/năm × ${P.rentYears} năm ≈ <b>${fmtTy(r.rentInc / TY)}</b> (tham khảo)</span></div>` : ""}
        ${q.nat === "fo" ? `<div class="perk" style="margin-top:12px"><i>ℹ</i><span>${esc(P.foreignNote)}</span></div>` : ""}</div>
        <div><h3>Lịch thanh toán – ${esc(r.plan.name)}</h3><table class="sched"><tr><th>Đợt</th><th>Thời điểm</th><th class="r">Tỷ lệ</th><th class="r">Số tiền</th></tr>${r.sched.map((s) => `<tr class="${s.bank ? "bank" : ""}"><td><b>${esc(s.label)}</b></td><td style="font-size:13px">${esc(s.when)}${s.kpbt ? "<br><span class='muted'>+ KPBT</span>" : ""}</td><td class="r">${nf(s.pct * 100, 1)}%</td><td class="r"><b>${fmtTr(s.amt + (s.kpbt || 0))}</b></td></tr>`).join("")}</table>
        ${r.plan.loan ? `<p style="font-size:13.5px;margin-top:10px">Khách thanh toán: <b>${fmtTy((r.net * (1 - r.plan.loan) + r.kpbt) / TY)}</b> · Ngân hàng giải ngân: <b style="color:#1c5fa8">${fmtTy((r.net * r.plan.loan) / TY)}</b></p>` : ""}</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px"><button class="btn btn-green" id="qt-copy">Sao chép báo giá</button><a class="btn btn-zalo" href="${zaloUrl}" target="_blank" rel="noopener">Gửi Zalo để giữ căn</a><button class="btn btn-ghost" id="qt-loan">Tính vay cho căn này</button><button class="btn btn-ghost" data-favtoggle="${esc(u.code)}">${favs.has(u.code) ? "♥ Đã lưu" : "♡ Lưu căn"}</button></div>
        ${sampleTag(q.p.slug) ? `<p style="margin:12px 0 0">${sampleTag(q.p.slug)}</p>` : ""}</div></div>`;
    $("#qt-copy").onclick = () => copy(txt);
    $("#qt-loan").onclick = () => { if (window.__loanSet) window.__loanSet(r.net / TY); $("#s-vay").scrollIntoView(); };
  }

  /* ---------- tính vay ---------- */
  function loanTool(el, p) {
    const L = P.loan;
    const st = { price: p.priceFrom || 10, ltv: L.maxLtv * 100, sup: L.supportMonths, rate: L.rateAfter, years: L.termYears, method: "goc" };
    el.innerHTML = `<div class="loan"><div class="qform" style="position:static">
      <div class="field"><label>Giá trị căn (tỷ)</label><input class="in" id="ln-price" type="number" step="0.01" min="0.5" value="${st.price}"></div>
      <div class="rng"><div class="top"><span>Tỷ lệ vay</span><b id="ln-ltv-v"></b></div><input type="range" id="ln-ltv" min="0" max="${L.maxLtv * 100}" step="5" value="${st.ltv}"></div>
      <div class="rng"><div class="top"><span>Hỗ trợ lãi 0% & ân hạn gốc</span><b id="ln-sup-v"></b></div><input type="range" id="ln-sup" min="0" max="60" step="6" value="${st.sup}"></div>
      <div class="rng"><div class="top"><span>Lãi suất sau hỗ trợ</span><b id="ln-rate-v"></b></div><input type="range" id="ln-rate" min="6" max="14" step="0.1" value="${st.rate}"></div>
      <div class="rng"><div class="top"><span>Thời hạn vay</span><b id="ln-years-v"></b></div><input type="range" id="ln-years" min="5" max="35" step="1" value="${st.years}"></div>
      <div class="field"><label>Cách trả</label><div class="seg" id="ln-method"><button data-v="goc" class="on">Gốc đều, lãi giảm dần</button><button data-v="deu">Trả đều hằng tháng</button></div></div></div>
      <div><div class="kpis"><div class="kpi"><span>Số tiền vay</span><b id="k-loan"></b></div><div class="kpi"><span>Vốn tự có cần chuẩn bị</span><b id="k-own"></b></div><div class="kpi"><span>Trả tháng đầu sau hỗ trợ</span><b id="k-first"></b></div><div class="kpi"><span>Tổng lãi phải trả</span><b id="k-int"></b></div><div class="kpi"><span>Lãi được hỗ trợ (ước tính)</span><b id="k-save"></b></div><div class="kpi"><span>Thu nhập tối thiểu gợi ý</span><b id="k-inc"></b></div></div>
      <div class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;font-size:13.5px"><b>Tiền trả theo từng năm</b><span class="muted"><span class="dot" style="background:var(--gold)"></span> Gốc &nbsp;<span class="dot" style="background:var(--green)"></span> Lãi</span></div><div class="bars" id="ln-bars"></div><div class="muted" style="font-size:12.5px;display:flex;justify-content:space-between"><span>Năm 1</span><span id="ln-last"></span></div></div></div></div>`;
    const calc = () => {
      const price = (+$("#ln-price").value || 0) * TY, loan = price * st.ltv / 100, n = st.years * 12, sup = Math.min(st.sup, n - 1), m = n - sup, i = st.rate / 100 / 12;
      $("#ln-ltv-v").textContent = st.ltv + "%"; $("#ln-sup-v").textContent = sup + " tháng"; $("#ln-rate-v").textContent = nf(st.rate, 1) + "%/năm"; $("#ln-years-v").textContent = st.years + " năm";
      const months = []; let bal = loan, tot = 0;
      for (let k = 1; k <= n; k++) {
        if (k <= sup) { months.push([0, 0]); continue; }
        let pr, it = bal * i;
        if (st.method === "goc") pr = loan / m; else { const pay = i ? loan * i / (1 - Math.pow(1 + i, -m)) : loan / m; pr = pay - it; }
        bal -= pr; tot += it; months.push([pr, it]);
      }
      const first = months[sup] ? months[sup][0] + months[sup][1] : 0;
      $("#k-loan").textContent = fmtTy(loan / TY); $("#k-own").textContent = fmtTy((price - loan) / TY);
      $("#k-first").textContent = fmtTr(first) + "/th"; $("#k-int").textContent = fmtTy(tot / TY); $("#k-save").textContent = fmtTy(loan * (st.rate / 100 / 12) * sup / TY);
      $("#k-inc").textContent = fmtTr(first / 0.45) + "/th";
      const yrs = []; for (let y = 0; y < st.years; y++) { const sl = months.slice(y * 12, y * 12 + 12); yrs.push([sl.reduce((a, x) => a + x[0], 0), sl.reduce((a, x) => a + x[1], 0)]); }
      const mx = Math.max(...yrs.map((y) => y[0] + y[1]), 1);
      $("#ln-bars").innerHTML = yrs.map((y, k) => `<div title="Năm ${k + 1}: gốc ${fmtTr(y[0])}, lãi ${fmtTr(y[1])}" style="height:${((y[0] + y[1]) / mx) * 100}%;background:linear-gradient(to top,var(--gold) ${(y[0] / (y[0] + y[1] || 1)) * 100}%,var(--green) 0)"></div>`).join("");
      $("#ln-last").textContent = "Năm " + st.years;
    };
    ["ltv", "sup", "rate", "years"].forEach((k) => ($("#ln-" + k).oninput = (e) => { st[k] = +e.target.value; calc(); }));
    $("#ln-price").oninput = calc;
    $("#ln-method").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; st.method = b.dataset.v; $$("#ln-method button").forEach((x) => x.classList.toggle("on", x === b)); calc(); };
    window.__loanSet = (v) => { $("#ln-price").value = Math.round(v * 100) / 100; calc(); };
    calc();
  }

  /* ---------------- TIN ĐĂNG ---------------- */
  function listings() {
    $("#app").innerHTML = `<div class="page-head"><div class="wrap"><div class="crumb"><a href="#trang-chu">Trang chủ</a> / Tin đăng</div><h1>Tin đăng – giỏ hàng Vinhomes</h1></div></div>
    <section style="padding-top:30px"><div class="wrap layout-side"><aside class="side">
      <div class="field"><label>Từ khóa</label><input class="in" data-l="kw" placeholder="Mã căn, phân khu..."></div>
      <div class="field"><label>Dự án</label><select class="in" data-l="project"><option value="">Tất cả dự án</option>${S.projects.map((p) => `<option value="${p.slug}">${esc(p.short)}</option>`).join("")}</select></div>
      <div class="field"><label>Loại hình</label><select class="in" data-l="cat"><option value="">Tất cả</option><option>Căn hộ</option><option>Nhà phố</option><option>Biệt thự</option></select></div>
      <div class="field"><label>Giá (tỷ)</label><div class="range2"><input class="in" data-l="pmin" placeholder="Từ"><input class="in" data-l="pmax" placeholder="Đến"></div></div>
      <div class="field"><label>Diện tích (m²)</label><div class="range2"><input class="in" data-l="amin" placeholder="Từ"><input class="in" data-l="amax" placeholder="Đến"></div></div>
      <div class="field"><label>Hướng</label><select class="in" data-l="dir"><option value="">Tất cả</option>${S.directions.map((d) => `<option>${d}</option>`).join("")}</select></div>
      <div class="field"><label>Pháp lý</label><select class="in" data-l="legal"><option value="">Tất cả</option>${S.legals.map((d) => `<option>${d}</option>`).join("")}</select></div>
      <div class="field"><label>Trạng thái</label><select class="in" data-l="status"><option value="">Tất cả</option><option value="con">Còn hàng</option><option value="coc">Đã cọc</option><option value="na">Chưa có giá</option></select></div>
      <button class="btn btn-ghost" id="l-clear">Xóa lọc</button></aside>
      <div><div class="sec-head" style="margin-bottom:16px"><div id="l-count"></div><div style="display:flex;gap:10px;align-items:center">${sampleTag()}<select class="in" data-l="sort" style="width:auto"><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option><option value="ppm-asc">Đơn giá thấp nhất</option><option value="land-desc">Diện tích lớn nhất</option></select></div></div>
      <div class="grid g3" id="l-grid"></div><div class="pager" id="l-pager"></div></div></div></section>`;
    $$("[data-l]").forEach((i) => { i.value = LS[i.dataset.l]; i.oninput = () => { LS[i.dataset.l] = i.value; LS.page = 1; renderListings(); }; });
    $("#l-clear").onclick = () => { Object.assign(LS, { kw: "", project: "", cat: "", pmin: "", pmax: "", amin: "", amax: "", dir: "", legal: "", status: "", page: 1 }); listings(); };
    renderListings();
  }
  function renderListings() {
    const kw = norm(LS.kw);
    let list = UNITS.filter((u) => (!kw || norm(u.code + " " + u.zone + " " + projBySlug[u.project].name + " " + u.type).includes(kw)) && (!LS.project || u.project === LS.project) && (!LS.cat || u.cat === LS.cat) && (!LS.pmin || u.price >= +LS.pmin.replace(",", ".")) && (!LS.pmax || u.price <= +LS.pmax.replace(",", ".")) && (!LS.amin || u.land >= +LS.amin) && (!LS.amax || u.land <= +LS.amax) && (!LS.dir || u.dir === LS.dir) && (!LS.legal || u.legal === LS.legal) && (LS.status ? u.status === LS.status : u.status !== "na"));
    const [k, d] = LS.sort.split("-"); list.sort((a, b) => (a[k] == null) - (b[k] == null) || ((a[k] || 0) - (b[k] || 0)) * (d === "desc" ? -1 : 1));
    const per = 12, pages = Math.max(1, Math.ceil(list.length / per)); LS.page = Math.min(LS.page, pages);
    $("#l-count").innerHTML = `<b style="font-size:18px">${list.length}</b> <span class="muted">căn phù hợp</span>`;
    $("#l-grid").innerHTML = list.slice((LS.page - 1) * per, LS.page * per).map(unitCard).join("") || `<div class="card empty" style="grid-column:1/-1">Không có căn phù hợp. <a href="#" id="l-reset" style="color:var(--gold)">Xóa bộ lọc</a> hoặc <a href="#" data-lead style="color:var(--gold)">nhờ tư vấn tìm căn</a>.</div>`;
    const rs = $("#l-reset"); if (rs) rs.onclick = (e) => { e.preventDefault(); $("#l-clear").click(); };
    $("#l-pager").innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `<button class="${i + 1 === LS.page ? "on" : ""}" data-pg="${i + 1}">${i + 1}</button>`).join("") : "";
    $$("[data-pg]").forEach((b) => (b.onclick = () => { LS.page = +b.dataset.pg; renderListings(); window.scrollTo({ top: 200, behavior: "smooth" }); }));
  }
  function unitCard(u) {
    const p = projBySlug[u.project], st = STATUS[u.status];
    return `<div class="card pcard ucard"><button class="fav ${favs.has(u.code) ? "on" : ""}" data-fav="${esc(u.code)}" data-favtoggle="${esc(u.code)}" aria-label="Lưu">${favs.has(u.code) ? "♥" : "♡"}</button>
      <div class="pimg" data-unit="${esc(u.code)}" style="cursor:pointer;${bgStyle(projArt(p, hash(u.code) % 7))}"><span class="badge ${st[1]}">${st[0]}</span></div>
      <div class="pbody"><div class="muted" style="font-size:13px">${esc(p.short)} · ${esc(u.zone)}</div><h3 style="font-size:18px;font-family:var(--sans)"><a href="#" data-unit="${esc(u.code)}">${esc(u.type)} ${esc(u.code)}</a></h3>
      <div class="price">${fmtTy(u.price)}${u.ppm != null ? ` <span class="muted" style="font-size:12.5px;font-weight:400">· ${nf(u.ppm, 1)} tr/m²</span>` : ""}</div>
      <div class="meta"><span>📐 ${u.land} m²</span>${u.build ? `<span>🏗 ${u.build} m²</span>` : u.floors ? `<span>🏢 Tầng ${u.floors}</span>` : ""}${u.dir !== "—" ? `<span>🧭 ${esc(u.dir)}</span>` : `<span>Dãy ${esc(u.block)}</span>`}</div>
      <div class="meta"><span>📜 ${esc(u.legal)}</span>${u.handover !== "—" ? `<span>🔨 ${esc(u.handover)}</span>` : ""}</div>
      <div class="acts"><button class="btn btn-green btn-sm" data-unit="${esc(u.code)}">Chi tiết</button><a class="btn btn-ghost btn-sm" href="#${p.slug}" data-quote="${esc(u.code)}">Báo giá</a></div></div></div>`;
  }

  /* ---------------- TIN TỨC ---------------- */
  function news() {
    $("#app").innerHTML = `<div class="page-head"><div class="wrap"><div class="crumb"><a href="#trang-chu">Trang chủ</a> / Tin tức</div><h1>Tin tức & kinh nghiệm</h1></div></div><section><div class="wrap"><div class="grid g3">${S.articles.map(articleCard).join("")}</div></div></section>`;
  }
  function article(slug) {
    const a = S.articles.find((x) => x.slug === slug); if (!a) return news();
    const others = S.articles.filter((x) => x !== a).slice(0, 3);
    $("#app").innerHTML = `<div class="page-head"><div class="wrap"><div class="crumb"><a href="#trang-chu">Trang chủ</a> / <a href="#tin-tuc">Tin tức</a></div><h1>${esc(a.title)}</h1><div style="margin-top:8px;font-size:14px">${esc(a.date)} · ${esc(a.tag)}</div></div></div>
      <section><div class="wrap"><div class="article"><p style="font-size:17px;color:var(--muted)">${esc(a.excerpt)}</p>${a.body.map((x) => `<p>${x}</p>`).join("")}<div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-gold" data-lead>Nhận tư vấn miễn phí</button><a class="btn btn-ghost" href="#tin-dang">Xem giỏ hàng</a></div></div>
      <h2 style="margin-top:50px">Bài viết khác</h2><div class="grid g3">${others.map(articleCard).join("")}</div></div></section>`;
  }
  function policyPage() {
    $("#app").innerHTML = `<div class="page-head"><div class="wrap"><h1>Chính sách bảo mật</h1></div></div><section><div class="wrap"><div class="article">
      <h3>1. Thông tin thu thập</h3><p>Họ tên, số điện thoại/Zalo, nhu cầu và ngân sách bạn tự nguyện cung cấp qua biểu mẫu.</p>
      <h3>2. Mục đích sử dụng</h3><p>Gửi bảng giá, giỏ hàng, tư vấn sản phẩm theo yêu cầu. Không bán hoặc chia sẻ thông tin cho bên thứ ba ngoài mục đích tư vấn.</p>
      <h3>3. Lưu trữ</h3><p>Thông tin được lưu trong thời gian cần thiết cho việc tư vấn; bạn có thể yêu cầu xóa bất kỳ lúc nào qua hotline ${esc(B.hotline)}.</p>
      <h3 id="4-cookie">4. Cookie & quảng cáo</h3><p>Website có thể dùng cookie và công cụ đo lường (Google Analytics, Facebook Pixel) để cải thiện trải nghiệm và hiển thị quảng cáo phù hợp. Bạn có thể tắt cookie trong trình duyệt.</p>
      <h3>5. Miễn trừ</h3><p>${esc(B.disclaimer)}</p></div></div></section>`;
  }

  /* ---------------- điều hướng ---------------- */
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || "trang-chu";
    $("#nav").classList.remove("open"); closeModal();
    const cats = { "can-ho": "Căn hộ", "nha-pho": "Nhà phố", "biet-thu": "Biệt thự" };
    if (h === "trang-chu") home();
    else if (h === "lien-he") { home(); setTimeout(() => $("#lien-he").scrollIntoView(), 30); }
    else if (h === "tin-dang") listings();
    else if (cats[h]) { Object.assign(LS, { cat: cats[h], project: "", kw: "", page: 1 }); listings(); }
    else if (h === "tin-tuc") news();
    else if (h.startsWith("bai-")) article(h.slice(4));
    else if (h === "chinh-sach-bao-mat") policyPage();
    else if (projBySlug[h]) projectPage(projBySlug[h]);
    else home();
    if (h !== "lien-he" && !(projBySlug[h] && pendingQuote)) window.scrollTo(0, 0);
    $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === h));
    const p = projBySlug[h]; document.title = p ? `${p.name} – Bảng giá & giỏ hàng ${B.updated} | ${B.name}` : `${B.name} – Bảng giá & giỏ hàng`;
  }

  /* sự kiện toàn cục */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const q = t.closest("[data-quote]");
    if (q) { const u = unitByCode[norm(q.dataset.quote)]; pendingQuote = q.dataset.quote; closeModal(); if (u && location.hash.slice(1) === u.project) { e.preventDefault(); const c = pendingQuote; pendingQuote = null; fillQuote(c); $("#s-baogia").scrollIntoView(); } return; }
    const lead = t.closest("[data-lead]"); if (lead) { e.preventDefault(); openLead(lead.dataset.project, lead.dataset.note); return; }
    const fv = t.closest("[data-favtoggle]"); if (fv) { e.preventDefault(); e.stopPropagation(); toggleFav(fv.dataset.favtoggle); if (fv.classList.contains("btn")) fv.textContent = favs.has(fv.dataset.favtoggle) ? "♥ Đã lưu" : "♡ Lưu căn"; return; }
    const uf = t.closest("[data-unfav]"); if (uf) { toggleFav(uf.dataset.unfav); showFavs(); return; }
    const un = t.closest("[data-unit]"); if (un) { e.preventDefault(); const u = unitByCode[norm(un.dataset.unit)]; if (u) unitModal(u); return; }
    const ph = t.closest("[data-phieu]"); if (ph) { e.preventDefault(); if (window.GPQuote) window.GPQuote.open(ph.dataset.phieu); return; }
    const zg = t.closest("[data-zimg]"); if (zg) { const cap = zg.dataset.cap || ($("span", zg) || {}).textContent || ""; openModal(`<img src="${esc(zg.dataset.zimg)}" style="width:100%;border-radius:10px">${cap ? `<p class="muted">${esc(cap)}</p>` : ""}`, true); return; }
    const zi = t.closest("[data-zoomimg]"); if (zi) { openModal(`<img src="${zi.getAttribute("src")}" style="width:100%;border-radius:10px">`, true); return; }
    const go = t.closest("[data-go]"); if (go) { const el = document.getElementById(go.dataset.go); if (el) el.scrollIntoView(); return; }
    if (t.closest("[data-close]") || t.id === "modal") closeModal();
  });
  document.addEventListener("submit", (e) => { const f = e.target.closest("[data-form]"); if (f) { e.preventDefault(); submitLead(f); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  $("#fab-fav").onclick = showFavs;
  window.addEventListener("hashchange", route);
  window.GPApp = { S: S, B: B, UNITS: UNITS, unitByCode: unitByCode, projBySlug: projBySlug, openModal: openModal, closeModal: closeModal, toast: toast, esc: esc, norm: norm, zaloUrl: zaloUrl, telUrl: telUrl };
  chrome(); updateFab(); route();
})();
