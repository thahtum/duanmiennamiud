/* Phiếu tính giá Green Paradise: hiển thị 4 cách thanh toán, xuất Excel (.xlsx) và xuất ảnh (.png) */
(function () {
  "use strict";
  var PR = window.GPPricing; if (!PR) return;
  var A = new Proxy({}, { get: function (_, k) { return window.GPApp ? window.GPApp[k] : undefined; } });
  var esc = function (s) { return A.esc(s); }, CS = PR.CSBH;
  var nfd = function (v) { return Math.round(v).toLocaleString("vi-VN"); };
  var ty2 = function (v) { return (v / 1e9).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var short = function (v) { return Math.abs(v) >= 1e9 ? ty2(v) + " tỷ" : Math.round(v / 1e6).toLocaleString("vi-VN") + " triệu"; };
  var pct = function (v) { return (v * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + "%"; };
  var D = PR.fmtDate;
  var today = new Date();
  var ST = { T: D(today), term: 24, fixedTerm: 24, vinclub: "none", guarantee: true };
  var POLNAME = { XL: "Xây luôn", GX: "Giãn xây", VIP: "Quỹ VIP" };
  var projOf = function () { return A.projBySlug["green-paradise"]; };

  function opt() { return { T: ST.T, term: +ST.term, fixedTerm: +ST.fixedTerm, vinclub: ST.vinclub, guarantee: ST.guarantee }; }
  function getQ(u) { return PR.quote(u, opt()); }

  function cardText(q, k) {
    var u = q.unit, gx = u.pol === "GX", T = PR.parseDate(ST.T);
    if (k === "early") return { title: "THANH TOÁN SỚM", line: "CK 7,5% vào giá" + (gx ? " phần đất" : "") + " · giảm ~" + short(q.std.total - q.early.total), small: "Cọc 300tr · " + (gx ? "đủ phần đất" : "thanh toán đủ") + " ngày " + D(PR.addDays(T, 30)) };
    if (k === "std") return { title: "TIẾN ĐỘ CHUẨN", line: gx ? "Đất 6 đợt 15-15-15-15-15-25%" : "6 đợt: 15-15-15-15-15-25%", small: gx ? "Phần xây " + short(q.std.xdTot) + " trả theo tiến độ xây" : "Từ ký HĐ đến bàn giao" };
    if (k === "loan0") { var alt = q.loans0.filter(function (x) { return x.term === (q.loan0.term === 36 ? 18 : 36); })[0];
      return { title: "VAY 70% · HTLS 0%", line: "0% lãi " + q.loan0.term + " tháng · giá +" + pct(q.loan0.plusRate), small: alt.term + " tháng: " + ty2(alt.total) + " tỷ (+" + pct(alt.plusRate) + ")" }; }
    var f = q.fixed; return { title: "VAY 70% · LÃI CỐ ĐỊNH", line: "Lãi cố định " + pct(f.rate) + "/năm · " + f.fixedTerm + " tháng", small: "≈ " + short(f.monthly) + "/tháng · vốn tự có 30%" };
  }
  var KEYS = ["early", "std", "loan0", "fixed"];
  var KNAME = { early: "Cách 1 · Thanh toán sớm", std: "Cách 2 · Theo tiến độ", loan0: "Cách 3 · Vay 70% lãi 0%", fixed: "Cách 4 · Vay 70% lãi cố định" };

  function breakdown(q) {
    var u = q.unit, gx = u.pol === "GX", vip = u.pol === "VIP", r = [];
    var row = function (label, f, cls) { r.push({ label: label, vals: KEYS.map(function (k) { return f(q[k]); }), cls: cls }); };
    row(gx ? "Giá gốc phần đất & thương mại (chưa VAT)" : vip ? "Giá gốc (đã gồm VAT, chưa KPBT)" : "Giá gốc (chưa VAT)", function (x) { return x.G; });
    row("Cộng thêm khi vay lãi 0% (" + pct(q.loan0.plusRate) + ")", function (x) { return x.plus ? x.plus : null; });
    row("Ưu đãi thanh toán sớm (7,5% vào giá)", function (x) { return x.early ? -x.early : null; });
    if (ST.guarantee) row("Ưu đãi không nhận bảo lãnh ngân hàng (0,5%)", function (x) { return -x.guar; });
    if (ST.vinclub !== "none") row("Ưu đãi VinClub " + CS.vinclubName[ST.vinclub] + " (" + pct(q.std.vcRate) + ")", function (x) { return -x.vc; });
    row(vip ? "Giá sau ưu đãi" : "Giá sau ưu đãi (chưa VAT)", function (x) { return x.net; }, "b");
    if (!vip) row("Thuế VAT", function (x) { return x.vat; });
    if (gx) row("Giá trị xây dựng gồm VAT + phí bảo trì (thu theo tiến độ xây, không giảm)", function (x) { return x.xdTot; });
    else row("Phí bảo trì (nộp khi nhận nhà)", function (x) { return x.kp; });
    row("TỔNG TIỀN PHẢI TRẢ", function (x) { return x.total; }, "tot");
    return r;
  }

  /* ---------------- giao diện phiếu ---------------- */
  function controls() {
    var o = function (obj, cur) { return Object.keys(obj).map(function (k) { return '<option value="' + k + '"' + (String(cur) === String(k) ? " selected" : "") + ">" + k + " tháng</option>"; }).join(""); };
    return '<div class="qx-ctrl">' +
      '<label>Ngày ký đặt cọc<input class="in" type="date" data-qx="T" value="' + toISO(ST.T) + '"></label>' +
      '<label>Gói vay lãi 0%<select class="in" data-qx="term">' + o(CS.htls0, ST.term) + "</select></label>" +
      '<label>Gói lãi cố định<select class="in" data-qx="fixedTerm">' + o(CS.fixed, ST.fixedTerm) + "</select></label>" +
      '<label>VinClub<select class="in" data-qx="vinclub">' + Object.keys(CS.vinclub).map(function (k) { return '<option value="' + k + '"' + (ST.vinclub === k ? " selected" : "") + ">" + CS.vinclubName[k] + (CS.vinclub[k] ? " (" + pct(CS.vinclub[k]) + ")" : "") + "</option>"; }).join("") + "</select></label>" +
      '<label class="qx-chk"><input type="checkbox" data-qx="guarantee"' + (ST.guarantee ? " checked" : "") + "> Ưu đãi 0,5% không nhận bảo lãnh NH</label></div>";
  }
  function toISO(s) { var d = PR.parseDate(s) || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function schedTable(x) {
    return '<table class="sched"><tr><th>Ngày</th><th>Nội dung</th><th class="r">Số tiền (đ)</th></tr>' + x.schedule.map(function (s) { return '<tr class="' + (s.kind === "bank" ? "bank" : "") + '"><td>' + esc(D(s.date)) + "</td><td>" + esc(s.label) + '</td><td class="r"><b>' + nfd(s.amount) + "</b></td></tr>"; }).join("") + "</table>";
  }
  function render(u) {
    var q = getQ(u), gx = u.pol === "GX";
    var cards = KEYS.map(function (k) { var c = cardText(q, k); return '<div class="qx-card' + (k === "early" ? " best" : "") + '"><div class="t">' + c.title + '</div><div class="v">' + ty2(q[k].total) + ' tỷ</div><div class="l">' + esc(c.line) + '</div><div class="s">' + esc(c.small) + "</div></div>"; }).join("");
    var bd = breakdown(q);
    var table = '<div class="tbl-wrap" style="max-height:none"><table class="units qx-bd" style="min-width:760px"><thead><tr><th>Đơn vị: đồng</th>' + KEYS.map(function (k) { return '<th class="r">' + KNAME[k].split(" · ")[0] + "</th>"; }).join("") + "</tr></thead><tbody>" +
      bd.map(function (r) { return '<tr class="' + (r.cls || "") + '"><td style="white-space:normal">' + esc(r.label) + "</td>" + r.vals.map(function (v) { return '<td class="r">' + (v == null ? "–" : (v > 0 && r.label.indexOf("Cộng thêm") === 0 ? "+" : "") + nfd(v)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
    var sch = KEYS.map(function (k) { var x = q[k], extra = "";
      if (k === "loan0") extra = "Tự trả " + nfd(x.own) + " đ" + (gx ? "*" : "") + " · NH giải ngân " + nfd(x.loan) + " đ · lãi 0% " + x.term + " tháng.";
      if (k === "fixed") extra = "Tự trả " + nfd(x.own) + " đ" + (gx ? "*" : "") + " · lãi " + pct(x.rate) + "/năm ≈ " + nfd(x.monthly) + " đ/tháng trong " + x.fixedTerm + " tháng.";
      return '<div class="qx-sch"><h4>' + KNAME[k] + " · " + nfd(x.P + x.kp) + " đ" + (gx ? " <small>(phần đất)</small>" : "") + "</h4>" + schedTable(x) + (extra ? '<p class="muted" style="font-size:13px;margin:6px 0 0">' + esc(extra) + "</p>" : "") + "</div>"; }).join("");
    var xdh = q.std.xdSchedule ? '<div class="qx-sch" style="grid-column:1/-1"><h4>Phần giá trị xây dựng – chung cho mọi cách (' + nfd(q.std.xdTot) + ' đ)</h4><table class="sched">' + q.std.xdSchedule.map(function (s) { return "<tr><td>" + esc(s.date) + "</td><td>" + esc(s.label) + '</td><td class="r"><b>' + nfd(s.amount) + "</b></td></tr>"; }).join("") + "</table></div>" : "";
    var loans = '<div class="two" style="gap:18px"><div><h4>Vay 70% lãi suất 0%</h4><table class="sched"><tr><th>Thời gian HTLS</th><th class="r">Trả thêm</th><th class="r">Tổng tiền</th></tr>' + q.loans0.map(function (x) { return "<tr" + (x.term === +ST.term ? ' style="background:#faf3df"' : "") + "><td>" + x.term + ' tháng</td><td class="r">+' + pct(x.plusRate) + '</td><td class="r"><b>' + nfd(x.total) + "</b></td></tr>"; }).join("") + "</table></div>" +
      '<div><h4>Vay 70% lãi cố định (KH tự trả)</h4><table class="sched"><tr><th>Thời gian</th><th class="r">Lãi/năm</th><th class="r">Lãi/tháng</th><th class="r">Tổng lãi</th></tr>' + q.fixeds.map(function (x) { return "<tr" + (x.fixedTerm === +ST.fixedTerm ? ' style="background:#faf3df"' : "") + "><td>" + x.fixedTerm + ' tháng</td><td class="r">' + pct(x.rate) + '</td><td class="r">' + nfd(x.monthly) + '</td><td class="r"><b>' + nfd(x.interestTotal) + "</b></td></tr>"; }).join("") + "</table></div></div>";
    return controls() +
      '<div class="qx-head"><div><div class="eyebrow">Phiếu tính giá · ' + esc(q.doc) + '</div><h2 style="margin:0">Căn ' + esc(u.code) + '</h2><div class="muted">' + esc(u.zone) + " · Dãy " + esc(u.block) + " · " + esc(u.type) + " · Đất " + u.land + " m²" + (u.build ? " · Sàn " + u.build + " m²" : "") + " · " + esc((u.tcbg && u.tcbg !== "—") ? u.tcbg : POLNAME[u.pol]) + (u.vip ? " · ★ Quỹ VIP" : "") + "</div></div>" +
      '<div style="text-align:right"><div class="muted" style="font-size:12.5px">Giá niêm yết (gồm VAT + KPBT)</div><div class="price-from" style="font-size:24px">' + nfd(q.std.listed) + " đ</div></div></div>" +
      '<div class="qx-actions"><button class="btn btn-green" data-qx-act="xlsx">⬇ Xuất file Excel</button><button class="btn btn-gold" data-qx-act="png">🖼 Xuất ảnh bảng giá</button><a class="btn btn-zalo" href="' + A.zaloUrl + '" target="_blank" rel="noopener">Gửi Zalo giữ căn</a><span class="qx-status muted"></span></div>' +
      '<div class="qx-cards">' + cards + "</div>" +
      '<h3 style="margin:22px 0 8px">Giá được tính như thế nào</h3>' + table +
      '<h3 style="margin:22px 0 8px">Lịch thanh toán chi tiết</h3><div class="qx-schs">' + sch + xdh + "</div>" +
      (gx ? '<p class="muted" style="font-size:12.5px">* Chưa gồm phần giá trị xây dựng.</p>' : "") +
      '<h3 style="margin:22px 0 8px">Các gói vay theo CSBH</h3>' + loans +
      '<p class="muted" style="font-size:12.5px;margin-top:16px">Giá tính theo ' + esc(q.doc) + ". Ngày đến hạn trùng ngày nghỉ được dời sang ngày làm việc kế tiếp. Ưu đãi 0,5% không nhận bảo lãnh áp dụng theo xác nhận của CĐT/NĐT tại thời điểm ký" + (u.estSplit ? ". Quỹ VIP: file quỹ căn chỉ có tổng giá, phí bảo trì đang ước tính" : "") + ". Phiếu mang tính tham khảo, giá chính thức theo hợp đồng.</p>";
  }
  var cur = null;
  function open(code) {
    var u = A.unitByCode[A.norm(code)]; if (!u || !u.g) return A.toast("Căn chưa có giá");
    cur = u; A.openModal('<div id="qx">' + render(u) + "</div>", true);
    $("#modal-box").classList.add("qx-wide"); bind();
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function bind() {
    var box = $("#qx"); if (!box) return;
    box.querySelectorAll("[data-qx]").forEach(function (el) {
      el.onchange = function () { var k = el.dataset.qx;
        if (k === "T") { var p = el.value.split("-"); ST.T = p[2] + "/" + p[1] + "/" + p[0]; }
        else if (k === "guarantee") ST.guarantee = el.checked; else ST[k] = el.value;
        box.innerHTML = render(cur); bind(); };
    });
    box.querySelectorAll("[data-qx-act]").forEach(function (b) { b.onclick = function () { var st = $(".qx-status", box); st.textContent = "Đang tạo file…"; (b.dataset.qxAct === "xlsx" ? exportXlsx(cur) : exportPng(cur)).then(function (m) { st.textContent = m || ""; }).catch(function (e) { st.textContent = "Lỗi: " + (e && e.message || e); }); }; });
  }
  function inline(u) {
    var q = getQ(u);
    return '<div class="slip"><div class="slip-head"><div><div style="font-size:12.5px;opacity:.8">PHIẾU TÍNH GIÁ · ' + esc(CS.label) + '</div><h3>Căn ' + esc(u.code) + '</h3><div style="font-size:14px;opacity:.9">' + esc(u.zone) + " · " + esc(u.type) + " · " + u.land + " m² · " + esc(u.tcbg || POLNAME[u.pol]) + '</div></div><div style="text-align:right"><div style="font-size:12px;opacity:.8">Giá full (tiến độ chuẩn)</div><div style="font-size:26px;font-weight:700;color:var(--gold-2)">' + ty2(q.std.total) + ' tỷ</div></div></div><div class="slip-body"><div class="qx-cards">' +
      KEYS.map(function (k) { var c = cardText(q, k); return '<div class="qx-card"><div class="t">' + c.title + '</div><div class="v">' + ty2(q[k].total) + ' tỷ</div><div class="l">' + esc(c.line) + "</div></div>"; }).join("") +
      '</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn btn-gold" data-phieu="' + esc(u.code) + '">📄 Mở phiếu tính giá đầy đủ · Xuất Excel / Ảnh</button><a class="btn btn-zalo" href="' + A.zaloUrl + '" target="_blank" rel="noopener">Gửi Zalo giữ căn</a></div></div></div>';
  }

  /* ---------------- lưu file ---------------- */
  var dlNS;
  function saveFile(name, blob) {
    var tryCap = (window.claude && typeof window.claude.use === "function") ? (dlNS ? Promise.resolve(dlNS) : window.claude.use("downloads").then(function (ns) { dlNS = ns; return ns; }).catch(function () { return null; })) : Promise.resolve(null);
    return tryCap.then(function (ns) {
      if (ns) return ns.save({ filename: name, data: blob }).then(function () { return "Đã lưu " + name; }).catch(function (e) { return e && e.code === "declined" ? "Đã huỷ lưu file" : "Không lưu được file ở chế độ xem này"; });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); return "Đã tải " + name;
    });
  }
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("không tải được " + src)); }; document.head.appendChild(s); }); }

  /* ---------------- xuất Excel ---------------- */
  function exportXlsx(u) {
    return (window.ExcelJS ? Promise.resolve() : loadScript("lib/exceljs.min.js")).then(function () {
      var q = getQ(u), gx = u.pol === "GX", wb = new window.ExcelJS.Workbook();
      wb.creator = A.B.name; wb.created = new Date();
      var GREEN = "FF0F3B2E", GOLD = "FFB8913F", CREAM = "FFF7F4EE", money = '#,##0" đ"';
      var hdr = function (row) { row.eachCell(function (c) { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } }; c.alignment = { vertical: "middle", horizontal: "center", wrapText: true }; }); row.height = 22; };
      var title = function (ws, text, sub, cols) { ws.mergeCells(1, 1, 1, cols); var c = ws.getCell(1, 1); c.value = text; c.font = { bold: true, size: 16, color: { argb: GREEN } };
        ws.mergeCells(2, 1, 2, cols); var d = ws.getCell(2, 1); d.value = sub; d.font = { italic: true, size: 10, color: { argb: "FF66706B" } }; };
      var border = function (row) { row.eachCell({ includeEmpty: true }, function (c) { c.border = { bottom: { style: "hair", color: { argb: "FFE4DED2" } } }; }); };

      /* Sheet 1: Phiếu tính giá */
      var s1 = wb.addWorksheet("Phiếu tính giá", { views: [{ showGridLines: false }] });
      s1.columns = [{ width: 52 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }];
      title(s1, "PHIẾU TÍNH GIÁ CĂN " + u.code + " – VINHOMES GREEN PARADISE", q.doc + " · Ngày lập " + D(new Date()) + " · Giả định ký đặt cọc " + ST.T + " · " + A.B.name + " – " + A.B.consultant + " " + A.B.hotline, 5);
      var info = [["Phân khu", u.zone], ["Dãy", u.block], ["Loại căn", u.type], ["Diện tích đất (m²)", u.land], ["Diện tích sàn xây dựng (m²)", u.build || "–"], ["Tiêu chuẩn bàn giao", u.tcbg || POLNAME[u.pol]], ["Loại quỹ / chính sách", POLNAME[u.pol] + " – " + q.doc], ["Giá niêm yết (gồm VAT + KPBT)", q.std.listed]];
      var r = 4; info.forEach(function (x) { var row = s1.getRow(r++); row.getCell(1).value = x[0]; row.getCell(2).value = x[1]; row.getCell(1).font = { color: { argb: "FF66706B" } }; row.getCell(2).font = { bold: true }; if (typeof x[1] === "number" && x[1] > 1e6) row.getCell(2).numFmt = money; border(row); });
      r++;
      var h = s1.getRow(r++); h.values = ["TÓM TẮT 4 CÁCH THANH TOÁN", "Cách 1 · Thanh toán sớm", "Cách 2 · Theo tiến độ", "Cách 3 · Vay 70% lãi 0% " + q.loan0.term + " th", "Cách 4 · Vay 70% lãi CĐ " + q.fixed.fixedTerm + " th"]; hdr(h);
      var sumRows = [["Tổng tiền phải trả", function (x) { return x.total; }], ["Tiết kiệm so với giá niêm yết", function (x) { return x.save; }], ["Khách tự trả (cọc + vốn tự có)" + (gx ? " – phần đất" : ""), function (x) { return x.own || null; }], ["Ngân hàng giải ngân", function (x) { return x.loan || null; }], ["Lãi KH tự trả mỗi tháng", function (x) { return x.monthly || null; }]];
      sumRows.forEach(function (sr, i) { var row = s1.getRow(r++); row.getCell(1).value = sr[0]; KEYS.forEach(function (k, j) { var v = sr[1](q[k]); var c = row.getCell(j + 2); c.value = v == null ? "–" : v; c.numFmt = money; c.alignment = { horizontal: "right" }; if (i === 0) { c.font = { bold: true, color: { argb: GREEN }, size: 12 }; } }); if (i === 0) row.getCell(1).font = { bold: true }; border(row); });
      r++;
      h = s1.getRow(r++); h.values = ["GIÁ ĐƯỢC TÍNH NHƯ THẾ NÀO (đồng)", "Cách 1", "Cách 2", "Cách 3", "Cách 4"]; hdr(h);
      breakdown(q).forEach(function (b) { var row = s1.getRow(r++); row.getCell(1).value = b.label; row.getCell(1).alignment = { wrapText: true };
        b.vals.forEach(function (v, j) { var c = row.getCell(j + 2); c.value = v == null ? "–" : v; c.numFmt = '#,##0;[Red]-#,##0'; c.alignment = { horizontal: "right" }; if (b.cls) c.font = { bold: true, color: { argb: b.cls === "tot" ? GREEN : "FF1D2421" } }; });
        if (b.cls === "tot") { row.eachCell(function (c) { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } }; }); row.getCell(1).font = { bold: true, color: { argb: GREEN } }; } border(row); });
      r++;
      var notes = ["Ưu đãi không nhận bảo lãnh ngân hàng 0,5% áp dụng theo xác nhận của CĐT/NĐT tại thời điểm ký.", "Thanh toán sớm từng đợt (không vay): chiết khấu 11%/năm trên số tiền và số ngày thanh toán trước hạn (tối thiểu 7 ngày, tròn đợt).", "VinClub Gold/Platinum/Diamond: ưu đãi 0,3%/0,4%/0,5% (" + (u.pol === "VIP" ? "100% chiết khấu vào giá – chương trình KH thân thiết" : "50% chiết khấu vào giá, 50% tích điểm VPoint khi nhận nhà") + ").", "Voucher Đặc quyền sở hữu nhà Vinhomes (đến 31/12/2026): dùng thanh toán tối đa 30% Giá trị nhà, không giảm giá.", "Phiếu mang tính tham khảo; giá và tiến độ chính thức theo hợp đồng ký với CĐT/NĐT."];
      if (u.estSplit) notes.unshift("Quỹ VIP: file quỹ căn chỉ có tổng giá; phí bảo trì đang ước tính.");
      notes.forEach(function (n) { s1.mergeCells(r, 1, r, 5); var c = s1.getCell(r, 1); c.value = "• " + n; c.font = { size: 10, color: { argb: "FF55635C" } }; c.alignment = { wrapText: true }; s1.getRow(r).height = 28; r++; });

      /* Sheet 2: Lịch thanh toán */
      var s2 = wb.addWorksheet("Lịch thanh toán", { views: [{ showGridLines: false }] });
      s2.columns = [{ width: 16 }, { width: 48 }, { width: 22 }, { width: 18 }];
      title(s2, "LỊCH THANH TOÁN CĂN " + u.code, "Ngày ký đặt cọc giả định: " + ST.T + " · " + q.doc, 4);
      r = 4;
      KEYS.forEach(function (k) { var x = q[k];
        s2.mergeCells(r, 1, r, 4); var c = s2.getCell(r, 1); c.value = KNAME[k].toUpperCase() + " – Tổng " + nfd(x.P + x.kp) + " đ" + (gx ? " (phần đất & TM)" : ""); c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } }; r++;
        var hh = s2.getRow(r++); hh.values = ["Ngày", "Nội dung", "Số tiền (đ)", "Lũy kế (đ)"]; hh.eachCell(function (c2) { c2.font = { bold: true }; c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6EFE9" } }; });
        var acc = 0; x.schedule.forEach(function (s) { acc += s.amount; var row = s2.getRow(r++); row.values = [D(s.date), s.label, s.amount, acc]; row.getCell(3).numFmt = money; row.getCell(4).numFmt = money; if (s.kind === "bank") row.getCell(2).font = { color: { argb: "FF1C5FA8" } }; border(row); });
        if (x.loan) { s2.mergeCells(r, 1, r, 4); var nn = s2.getCell(r, 1); nn.value = k === "loan0" ? "Lãi vay 0% trong " + x.term + " tháng kể từ lần giải ngân đầu tiên. Giá cao hơn " + pct(x.plusRate) + " giá gốc." : "Lãi " + pct(x.rate) + "/năm trên khoản vay ≈ " + nfd(x.monthly) + " đ/tháng trong " + x.fixedTerm + " tháng (tổng ≈ " + nfd(x.interestTotal) + " đ); phần lãi vượt mức do CĐT/NĐT hỗ trợ."; nn.font = { italic: true, size: 10 }; r++; }
        r++; });
      if (q.std.xdSchedule) { s2.mergeCells(r, 1, r, 4); var cx = s2.getCell(r, 1); cx.value = "PHẦN GIÁ TRỊ XÂY DỰNG – CHUNG CHO MỌI CÁCH (" + nfd(q.std.xdTot) + " đ)"; cx.font = { bold: true, color: { argb: "FFFFFFFF" } }; cx.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } }; r++;
        var acx = 0; q.std.xdSchedule.forEach(function (s) { acx += s.amount; var row = s2.getRow(r++); row.values = [s.date, s.label, s.amount, acx]; row.getCell(3).numFmt = money; row.getCell(4).numFmt = money; border(row); }); }

      /* Sheet 3: Các gói vay */
      var s3 = wb.addWorksheet("Các gói vay", { views: [{ showGridLines: false }] });
      s3.columns = [{ width: 22 }, { width: 18 }, { width: 24 }, { width: 24 }, { width: 24 }];
      title(s3, "CÁC GÓI VAY 70% – CĂN " + u.code, q.doc, 5);
      r = 4; h = s3.getRow(r++); h.values = ["Vay lãi suất 0%", "Trả thêm so với giá gốc", "Tổng tiền phải trả", "Khách tự trả", "Ngân hàng giải ngân"]; hdr(h);
      q.loans0.forEach(function (x) { var row = s3.getRow(r++); row.values = [x.term + " tháng", x.plusRate, x.total, x.own, x.loan]; row.getCell(2).numFmt = "0.0%"; [3, 4, 5].forEach(function (i) { row.getCell(i).numFmt = money; }); border(row); });
      r++; h = s3.getRow(r++); h.values = ["Vay lãi cố định", "Lãi suất KH trả/năm", "Lãi mỗi tháng", "Tổng lãi trong thời gian HTLS", "Tổng tiền mua (không đổi)"]; hdr(h);
      q.fixeds.forEach(function (x) { var row = s3.getRow(r++); row.values = [x.fixedTerm + " tháng", x.rate, x.monthly, x.interestTotal, x.total]; row.getCell(2).numFmt = "0.0%"; [3, 4, 5].forEach(function (i) { row.getCell(i).numFmt = money; }); border(row); });
      r++; s3.mergeCells(r, 1, r, 5); s3.getCell(r, 1).value = "Lãi cố định: nếu lãi suất thực tế của ngân hàng cao hơn, CĐT/NĐT trả phần vượt trong thời gian hỗ trợ. Vay 0%: không áp dụng cho quỹ căn nhận cam kết thuê bằng tiền định kỳ."; s3.getCell(r, 1).alignment = { wrapText: true }; s3.getRow(r).height = 32;

      /* Sheet 4: CSBH */
      var s4 = wb.addWorksheet("CSBH tóm tắt", { views: [{ showGridLines: false }] });
      s4.columns = [{ width: 44 }, { width: 70 }];
      title(s4, "TÓM TẮT CHÍNH SÁCH BÁN HÀNG ÁP DỤNG", q.doc, 2);
      var cs = [["Tiến độ thường", gx ? "Cọc 300tr · T+15: 15% (gồm cọc) · T+30/75/135/195: 15% · T+270: 25% phần Đất & TM; phần Xây dựng thu riêng theo thông báo (15%+5% · 10% · 15% · 15% · 15% · 25% + KPBT)" : u.pol === "VIP" ? "Cọc 300tr · T+15: 15% · T+30/75/135/195: 15% · Ký HĐCN (dự kiến " + CS.vipHDCN + "): 25% · KPBT khi nhận nhà" : "Cọc 300tr · T+15 (ký HĐCN): 15% · T+30/75/135/195: 15% · Bàn giao: 25% + 100% KPBT"],
        ["Thanh toán sớm", "Không vay, thanh toán 100% " + (gx ? "Giá trị QSD Đất & TM" : "Tổng giá trị") + " trong 30 ngày kể từ TTĐC: chiết khấu 7,5% vào giá gốc"],
        ["Thanh toán sớm từng đợt", "Chiết khấu 11%/năm × số ngày trước hạn (tối thiểu 7 ngày, tròn đợt)"],
        ["Vay lãi 0% (70%)", "18 th: +3,5% · 24 th: +8% · 30 th: +13,5% · 36 th: +19,5%" + (gx ? " (giãn xây vay 80%: +5,5% / +10,5% / +17,5% / +25%)" : "")],
        ["Vay lãi cố định (70%)", "18 th: 3% · 24 th: 4,5% · 30 th: 6% · 36 th: 7,5% · 48 th: 8,5% · 60 th: 9%/năm"],
        ["Tiến độ giải ngân vay", "Cọc 300tr · T+15: 15% · T+29: vốn tự có 15% · T+" + (u.pol === "VIP" ? "45" : "30") + ": ngân hàng giải ngân 70%"],
        ["VinClub", "Gold 0,3% · Platinum 0,4% · Diamond 0,5%"],
        ["Cam kết tiền thuê (quỹ áp dụng)", "6%/năm trên Tổng giá trị BĐS trước VAT · Vịnh Ngọc 60 tháng · Vịnh Tiên 36 tháng"],
        ["Voucher Vinhomes", "Thanh toán tối đa 30% Giá trị nhà, hiệu lực đến 31/12/2026"]];
      r = 4; cs.forEach(function (x) { var row = s4.getRow(r++); row.values = x; row.getCell(1).font = { bold: true, color: { argb: GREEN } }; row.getCell(2).alignment = { wrapText: true }; row.height = 34; border(row); });
      return wb.xlsx.writeBuffer().then(function (buf) { return saveFile("Phieu-tinh-gia-" + u.code + ".xlsx", new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })); });
    });
  }

  /* ---------------- xuất ảnh (canvas) ---------------- */
  function ovPos(u) {
    var O = projOf().overview; if (!O) return null;
    if (u.tmbPos) return u.tmbPos;
    var M = O.M;
    if (u.poly) { var sx = 0, sy = 0, n = u.poly.length / 2; for (var i = 0; i < u.poly.length; i += 2) { sx += u.poly[i]; sy += u.poly[i + 1]; } sx /= n; sy /= n; return [M[0] * sx + M[1] * sy + M[2], M[3] * sx + M[4] * sy + M[5]]; }
    var a = (O.approx || []).filter(function (r) { return new RegExp(r[0]).test(u.code); })[0]; return a ? [a[1], a[2]] : null;
  }
  function lotPoly(u) { var O = projOf().overview, M = O && O.M; if (!u.poly || !M || u.tmbPos) return null; var out = []; for (var i = 0; i < u.poly.length; i += 2) out.push([M[0] * u.poly[i] + M[1] * u.poly[i + 1] + M[2], M[3] * u.poly[i] + M[4] * u.poly[i + 1] + M[5]]); return out; }
  var imgCache = {};
  function loadImg(src) { if (!imgCache[src]) imgCache[src] = new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src; }); return imgCache[src]; }
  /* vẽ vùng bản đồ: tâm (cx,cy) theo toạ độ tổng mặt bằng, upp = đơn vị TMB trên mỗi pixel canvas */
  function drawMap(ctx, x, y, w, h, cx, cy, upp, levelIdx) {
    var O = projOf().overview, TL = O.tiles, L = TL.levels[levelIdx], span = TL.size * TL.k / L.z;
    var vx0 = cx - w * upp / 2, vy0 = cy - h * upp / 2, vx1 = vx0 + w * upp, vy1 = vy0 + h * upp, jobs = [];
    for (var j = Math.max(0, Math.floor(vy0 / span)); j <= Math.min(L.rows - 1, Math.floor(vy1 / span)); j++)
      for (var i = Math.max(0, Math.floor(vx0 / span)); i <= Math.min(L.cols - 1, Math.floor(vx1 / span)); i++)
        (function (i, j) { jobs.push(loadImg(L.dir + i + "_" + j + ".jpg").then(function (im) { if (!im) return; var k = L.z / TL.k; // px ảnh / đơn vị
          var sx = Math.max(vx0, i * span), sy = Math.max(vy0, j * span), ex = Math.min(vx1, i * span + im.width / k), ey = Math.min(vy1, j * span + im.height / k); if (ex <= sx || ey <= sy) return;
          ctx.drawImage(im, (sx - i * span) * k, (sy - j * span) * k, (ex - sx) * k, (ey - sy) * k, x + (sx - vx0) / upp, y + (sy - vy0) / upp, (ex - sx) / upp, (ey - sy) / upp); })); })(i, j);
    return Promise.all(jobs).then(function () { return function (px, py) { return [x + (px - vx0) / upp, y + (py - vy0) / upp]; }; });
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function goldGrad(ctx, y0, y1) { var g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, "#f7e3a3"); g.addColorStop(0.45, "#d9b45f"); g.addColorStop(0.55, "#b8913f"); g.addColorStop(1, "#8a6a26"); return g; }
  function marker(ctx, px, py, code, scale) {
    var s = scale || 1; ctx.save();
    ctx.fillStyle = "#c9a24e"; ctx.beginPath(); ctx.arc(px, py - 62 * s, 40 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px - 26 * s, py - 38 * s); ctx.lineTo(px, py); ctx.lineTo(px + 26 * s, py - 38 * s); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(px, py - 62 * s, 31 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f3b2e"; ctx.font = "700 " + (30 * s) + "px 'Playfair Display', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("V", px, py - 60 * s);
    ctx.font = "700 " + (30 * s) + "px 'Be Vietnam Pro', sans-serif"; var tw = ctx.measureText(code).width + 44 * s;
    rrect(ctx, px + 46 * s, py - 92 * s, tw, 60 * s, 30 * s); ctx.fillStyle = "#0f3b2e"; ctx.fill(); ctx.lineWidth = 3 * s; ctx.strokeStyle = "#d9b768"; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.fillText(code, px + 68 * s, py - 61 * s); ctx.restore();
  }
  function exportPng(u) {
    var q = getQ(u), pos = ovPos(u), W = 1080, H = 2400, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d"), poly = lotPoly(u);
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return fontsReady.then(function () {
      ctx.fillStyle = "#0e3a2e"; ctx.fillRect(0, 0, W, H);
      var bg = ctx.createLinearGradient(0, 600, 0, H); bg.addColorStop(0, "#123f32"); bg.addColorStop(1, "#0b2e24"); ctx.fillStyle = bg; ctx.fillRect(0, 600, W, H - 600);
      var chain = Promise.resolve();
      if (pos) {
        chain = drawMap(ctx, 0, 0, W, 600, pos[0], pos[1] - 40, 0.55, 0).then(function (P) { var g = ctx.createLinearGradient(0, 300, 0, 600); g.addColorStop(0, "rgba(14,58,46,0)"); g.addColorStop(1, "rgba(14,58,46,.95)"); ctx.fillStyle = g; ctx.fillRect(0, 300, W, 300);
          var t = ctx.createLinearGradient(0, 0, 0, 140); t.addColorStop(0, "rgba(14,58,46,.97)"); t.addColorStop(0.6, "rgba(14,58,46,.8)"); t.addColorStop(1, "rgba(14,58,46,0)"); ctx.fillStyle = t; ctx.fillRect(0, 0, W, 170); var p = P(pos[0], pos[1]); marker(ctx, p[0], p[1], u.code, 1); }).then(function () { ctx.save(); rrect(ctx, 612, 818, 436, 460, 14); ctx.clip(); ctx.fillStyle = "#f4f1e8"; ctx.fillRect(612, 818, 436, 460);
          return drawMap(ctx, 612, 818, 436, 460, pos[0], pos[1] - 10, 0.13, 1).then(function (P) { if (poly) { ctx.beginPath(); poly.forEach(function (pt, i) { var p = P(pt[0], pt[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fillStyle = "rgba(228,87,46,.55)"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "#d32f2f"; ctx.stroke(); }
            var p = P(pos[0], pos[1]); marker(ctx, p[0] - 60, p[1], u.code, 0.9); ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = "#d9b768"; rrect(ctx, 612, 818, 436, 460, 14); ctx.stroke(); }); });
      }
      return chain.then(function () {
        ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "600 26px 'Be Vietnam Pro', sans-serif"; ctx.fillText(A.B.name.toUpperCase(), 40, 56);
        ctx.font = "500 20px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText("Phiếu giá · " + CS.label, 40, 88);
        // mã căn
        ctx.font = "700 120px 'Playfair Display', serif"; ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fillStyle = goldGrad(ctx, 640, 750); ctx.fillText(u.code, 36, 745); ctx.shadowColor = "transparent";
        ctx.font = "400 25px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#e6efe9"; ctx.fillText("Vinhomes Green Paradise · " + u.zone + " · " + u.type + (u.vip ? " · ★ Quỹ VIP" : ""), 40, 795);
        // bảng thông tin
        var rows = [["Loại căn", u.type + (u.vip ? " · VIP" : "")], ["DT đất", String(u.land).replace(".", ",") + " m²"], ["DT xây dựng", u.build ? String(u.build).replace(".", ",") + " m²" : "–"], ["TCBG", (u.tcbg && u.tcbg !== "—") ? u.tcbg : "Chờ xác nhận"], ["Dãy / phân khu", u.block + " · " + u.zone], ["Bàn giao", u.hdate ? D(PR.parseDate(u.hdate) || u.hdate) : (u.pol === "GX" ? "Theo tiến độ xây" : "Theo thông báo")]];
        rows.forEach(function (r, i) { var y = 820 + i * 52; ctx.fillStyle = i % 2 ? "#e6efe9" : "#ffffff"; ctx.fillRect(36, y, 555, 52); ctx.fillStyle = "#33413b"; ctx.font = "400 21px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "left"; ctx.fillText(r[0], 52, y + 34); ctx.font = "700 21px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#0f3b2e"; ctx.textAlign = "right"; ctx.fillText(r[1], 575, y + 34); });
        // giá full
        ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "700 32px 'Be Vietnam Pro', sans-serif"; ctx.fillText("GIÁ FULL", 36, 1182); ctx.font = "400 18px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#cfe0d6"; ctx.fillText("gồm VAT & KPBT", 36, 1210);
        ctx.font = "700 84px 'Playfair Display', serif"; ctx.textAlign = "right"; ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; ctx.fillStyle = goldGrad(ctx, 1150, 1225); ctx.fillText(ty2(q.std.total) + " TỶ", 590, 1222); ctx.shadowColor = "transparent";
        ctx.font = "400 20px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#e6efe9"; ctx.fillText(nfd(q.std.total) + " VNĐ", 590, 1260);
        // phương án
        ctx.textAlign = "left"; ctx.font = "700 28px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#d9b768"; ctx.fillText("PHƯƠNG ÁN THANH TOÁN", 36, 1338); ctx.fillRect(36, 1350, 90, 3);
        ctx.textAlign = "right"; ctx.font = "400 17px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#b9cdc2"; ctx.fillText("Mô phỏng ngày cọc " + ST.T + " · " + CS.label, 1044, 1336);
        KEYS.forEach(function (k, i) { var c = cardText(q, k), x = 36 + (i % 2) * 515, y = 1370 + Math.floor(i / 2) * 215, w = 494, h = 195;
          rrect(ctx, x, y, w, h, 14); ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = "#c9a24e"; ctx.stroke();
          ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "700 22px 'Be Vietnam Pro', sans-serif"; ctx.fillText(c.title, x + 22, y + 38);
          ctx.font = "700 58px 'Playfair Display', serif"; ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; ctx.fillStyle = goldGrad(ctx, y + 52, y + 108); ctx.fillText(ty2(q[k].total) + " tỷ", x + 22, y + 106); ctx.shadowColor = "transparent";
          ctx.font = "400 19px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#e6efe9"; ctx.fillText(c.line, x + 22, y + 146); ctx.font = "400 16.5px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#a9c2b5"; ctx.fillText(c.small, x + 22, y + 174); });
        ctx.font = "400 16.5px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#b9cdc2"; ctx.textAlign = "left";
        ctx.fillText("Giá đã gồm VAT & KPBT" + (ST.guarantee ? ", đã trừ ưu đãi 0,5% không nhận bảo lãnh NH" : "") + ". Chưa trừ ưu đãi VinClub (đến 0,5%) và voucher.", 36, 1814);
        // vị trí
        ctx.font = "700 28px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#d9b768"; ctx.fillText("VỊ TRÍ TRÊN MẶT BẰNG", 36, 1872); ctx.fillRect(36, 1884, 90, 3);
        var mx = 36, my = 1900, mw = 1008, mh = 350;
        ctx.fillStyle = "#f4f1e8"; ctx.fillRect(mx, my, mw, mh);
        var after = pos ? drawMap(ctx, mx, my, mw, mh, pos[0] + 120, pos[1] - 30, 0.42, 0).then(function (P) { var p = P(pos[0], pos[1]); marker(ctx, p[0], p[1], u.code, 0.95);
            return loadImg(projOf().overview.image).then(function (im) { if (!im) return; var iw = 330, ih = iw * im.height / im.width, ix = mx + mw - iw - 12, iy = my + mh - ih - 12; ctx.fillStyle = "#fff"; ctx.fillRect(ix - 6, iy - 34, iw + 12, ih + 40); ctx.drawImage(im, ix, iy, iw, ih);
              ctx.fillStyle = "#0f3b2e"; ctx.font = "700 18px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "left"; ctx.fillText("Tổng thể dự án", ix + 4, iy - 10);
              var dx = ix + pos[0] / im.width * iw, dy = iy + pos[1] / im.height * ih; ctx.beginPath(); ctx.arc(dx, dy, 9, 0, Math.PI * 2); ctx.fillStyle = "#d32f2f"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke(); }); }) : Promise.resolve();
        return after.then(function () {
          ctx.lineWidth = 4; ctx.strokeStyle = "#d9b768"; ctx.strokeRect(mx, my, mw, mh);
          ctx.textAlign = "left"; ctx.font = "400 19px 'Be Vietnam Pro', sans-serif"; ctx.fillStyle = "#e6efe9";
          ctx.fillText(u.zone + " · dãy " + u.block + " · " + u.type + " " + String(u.land).replace(".", ",") + " m² đất" + (u.build ? " · sàn " + String(u.build).replace(".", ",") + " m²" : ""), 36, 2284);
          ctx.fillText("Giá theo " + q.doc + ", chưa xác nhận với CĐT.", 36, 2314);
          ctx.fillStyle = "#c9a24e"; ctx.fillRect(0, 2338, W, 62); ctx.fillStyle = "#0b2e24"; ctx.font = "700 24px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "center";
          ctx.fillText(A.B.consultant + " · Hotline/Zalo " + A.B.hotline + (A.B.hotline2 ? " · " + A.B.hotline2 : ""), W / 2, 2378);
          return new Promise(function (res, rej) { try { cv.toBlob(function (b) { b ? res(b) : rej(new Error("không tạo được ảnh")); }, "image/png"); } catch (e) { rej(new Error("Trình duyệt chặn xuất ảnh khi mở file trực tiếp – hãy mở qua hosting/web")); } });
        }).then(function (blob) {
          var url = URL.createObjectURL(blob); var pv = document.getElementById("qx-preview");
          if (pv) pv.innerHTML = '<img src="' + url + '" style="width:100%;max-width:420px;border-radius:10px;border:1px solid #ddd">';
          return saveFile("Bang-gia-" + u.code + ".png", blob);
        });
      });
    });
  }

  /* CSS cho phiếu */
  var css = document.createElement("style");
  css.textContent = ".modal-box.qx-wide{max-width:1100px}.qx-ctrl{display:flex;flex-wrap:wrap;gap:10px;align-items:end;background:#f7f4ee;border:1px solid var(--line);border-radius:12px;padding:12px;margin:0 0 16px}.qx-ctrl label{display:flex;flex-direction:column;font-size:12px;color:var(--muted);gap:4px;min-width:150px}.qx-ctrl label.qx-chk{flex-direction:row;align-items:center;font-size:13.5px;color:var(--ink);min-width:auto}.qx-head{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:end;margin-bottom:12px}.qx-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0 16px}.qx-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}@media(max-width:860px){.qx-cards{grid-template-columns:1fr 1fr}}.qx-card{background:linear-gradient(160deg,#12402f,#0e3326);color:#e6efe9;border-radius:14px;padding:14px 16px;border:1.5px solid #c9a24e}.qx-card.best{box-shadow:0 0 0 3px rgba(217,183,104,.35)}.qx-card .t{font-size:12.5px;font-weight:700;letter-spacing:.04em;color:#fff}.qx-card .v{font-family:var(--serif);font-size:30px;font-weight:700;color:#e8c977;margin:4px 0}.qx-card .l{font-size:13.5px}.qx-card .s{font-size:12px;opacity:.75;margin-top:2px}.qx-bd tr.b td{font-weight:700}.qx-bd tr.tot td{font-weight:700;color:var(--green);background:#f7f4ee}.qx-bd td{white-space:nowrap}.qx-schs{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:760px){.qx-schs{grid-template-columns:1fr}}.qx-sch{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}.qx-sch h4{margin:0 0 6px;color:var(--green)}";
  document.head.appendChild(css);

  window.GPQuote = { open: open, inline: inline, exportXlsx: exportXlsx, exportPng: exportPng, getQ: getQ };
})();
