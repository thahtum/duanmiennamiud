/* =====================================================================
   BỘ TÍNH GIÁ VINHOMES GREEN PARADISE – theo CSBH ngày 19/11/2026
   - XL : Quỹ căn xây luôn Vịnh Ngọc & Vịnh Tiên (CSBH V17)
   - GX : Quỹ căn thô giãn xây Vịnh Ngọc (CSBH V16) – tách phần Đất & TM / phần Xây dựng
   - VIP: Quỹ căn xây luôn Vịnh Tiên VIP2 (CSBH V06) – giá đã gồm VAT
   Đầu vào mỗi căn: g (giá gốc chưa VAT; GX = phần đất & TM), gv (VAT của g),
   kpbt, xd = [xây trước VAT, VAT xây, KPBT, tổng xây] (chỉ GX), total (giá niêm yết).
   Khi CĐT ra CSBH mới: sửa bảng CSBH bên dưới.
   ===================================================================== */
(function (root) {
  "use strict";
  var CSBH = {
    date: "19/11/2026",
    label: "CSBH 19/11/2026",
    deposit: 300000000,          // cọc lần 1 / căn
    early: 0.075,                // CK thanh toán sớm 100% trong 30 ngày (vào giá gốc)
    earlyPerYear: 0.11,          // CK thanh toán sớm từng đợt: 11%/năm × số ngày trước hạn
    guarantee: 0.005,            // ưu đãi không nhận bảo lãnh ngân hàng (theo xác nhận CĐT/NĐT)
    ltv: 0.70,                   // tỷ lệ vay
    htls0: { 18: 0.035, 24: 0.08, 30: 0.135, 36: 0.195 },               // vay lãi 0% – phần trả thêm so với giá gốc
    htls0_80: { 18: 0.055, 24: 0.105, 30: 0.175, 36: 0.25 },            // giãn xây – lựa chọn vay 80%
    fixed: { 18: 0.03, 24: 0.045, 30: 0.06, 36: 0.075, 48: 0.085, 60: 0.09 }, // vay lãi cố định KH tự trả
    vinclub: { none: 0, gold: 0.003, platinum: 0.004, diamond: 0.005 },
    vinclubName: { none: "Không", gold: "Gold", platinum: "Platinum", diamond: "Diamond" },
    vipHDCN: "25/07/2027",       // VIP2: dự kiến ký HĐCN (đợt 25%)
    docs: {
      XL: "CSBH V17 – Quỹ căn xây luôn Vịnh Ngọc & Vịnh Tiên (19/11/2026)",
      GX: "CSBH V16 – Quỹ căn thô giãn xây Vịnh Ngọc (19/11/2026)",
      VIP: "CSBH V06 – Quỹ căn xây luôn Vịnh Tiên VIP2 (19/11/2026)"
    }
  };

  var R = Math.round;
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function fmtDate(d) { if (!(d instanceof Date)) return d; var z = function (n) { return (n < 10 ? "0" : "") + n; }; return z(d.getDate()) + "/" + z(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function parseDate(s) { if (s instanceof Date) return s; var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || "")); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; }

  /* Tính giá 1 phương án. sc: early | std | loan0 | fixed */
  function calc(u, sc, opt) {
    opt = opt || {};
    var term = opt.term || 24, fterm = opt.fixedTerm || opt.term || 24;
    var G = u.g, r = u.g ? (u.gv || 0) / u.g : 0;
    var isGX = u.pol === "GX", isVIP = u.pol === "VIP";
    var kp = isGX ? 0 : (u.kpbt || 0);
    var xd = isGX && u.xd ? u.xd : null, xdTot = xd ? xd[3] : 0;
    var plusRate = sc === "loan0" ? ((isGX && opt.ltv80 ? CSBH.htls0_80 : CSBH.htls0)[term] || 0) : 0;
    var plus = R(G * plusRate);
    var early = sc === "early" ? R(G * CSBH.early) : 0;
    var a = G + plus - early;
    var guar = opt.guarantee === false ? 0 : R(a * CSBH.guarantee);
    var vcRate = (CSBH.vinclub[opt.vinclub || "none"] || 0) * (isVIP ? 1 : 0.5);
    var vc = R((a - guar) * vcRate);
    var net = a - guar - vc;
    var vat = R(net * r);
    var P = net + vat;                 // phần chịu CSBH, gồm VAT (GX = phần đất & TM)
    var total = P + kp + xdTot;
    var res = { sc: sc, term: term, fixedTerm: fterm, G: G, plusRate: plusRate, plus: plus, early: early, guar: guar, vcRate: vcRate, vc: vc, net: net, vat: vat, P: P, kp: kp, xdTot: xdTot, total: total,
      listed: u.total || (G + (u.gv || 0) + kp + xdTot), schedule: [], xdSchedule: null };
    res.save = res.listed - total;

    var T = parseDate(opt.T) || new Date(); T = new Date(T.getFullYear(), T.getMonth(), T.getDate());
    var H = u.hdate ? (parseDate(u.hdate) || u.hdate) : "Theo thông báo";
    var dep = CSBH.deposit, s = res.schedule;
    function push(d, label, amt, kind) { s.push({ date: d, label: label, amount: amt, kind: kind || "kh" }); }
    var p15 = R(P * 0.15);
    push(T, "Đặt cọc", dep);
    if (sc === "early") {
      push(addDays(T, 15), "Ký hợp đồng chuyển nhượng (15%)", p15 - dep);
      push(addDays(T, 30), "Thanh toán phần còn lại (85%)", P - p15);
      if (kp) push(H, "Nhận nhà: phí bảo trì", kp);
    } else if (sc === "std") {
      push(addDays(T, 15), "Đợt 1 – ký hợp đồng (15%)", p15 - dep);
      var days = isGX ? [30, 75, 135, 195] : [30, 75, 135, 195];
      days.forEach(function (d, i) { push(addDays(T, d), "Đợt " + (i + 2) + " (15%)", p15); });
      var rest = P - p15 * 5;
      if (isGX) push(addDays(T, 270), "Đợt 6 (25%)", rest);
      else if (isVIP) { push(parseDate(CSBH.vipHDCN), "Đợt 6 – ký HĐCN (25%)", rest); if (kp) push(H, "Nhận nhà: phí bảo trì", kp); }
      else push(H, "Nhận nhà (25% + phí bảo trì)", rest + kp);
    } else { // loan0 | fixed
      var loan = P - p15 * 2;
      push(addDays(T, 15), "Ký hợp đồng (15%)", p15 - dep);
      push(addDays(T, 29), "Vốn tự có (15%)", p15);
      push(addDays(T, isVIP ? 45 : 30), "Ngân hàng giải ngân (70%)", loan, "bank");
      if (kp) push(H, "Nhận nhà: phí bảo trì", kp);
      res.loan = loan; res.own = dep + (p15 - dep) + p15 + kp;
      if (sc === "fixed") { res.rate = CSBH.fixed[fterm] || 0; res.monthly = R(loan * res.rate / 12); res.interestTotal = res.monthly * fterm; }
    }
    if (xd) {
      var x = xd[0], xv = xd[0] + xd[1], k = xd[2];
      var l1 = R(xv * 0.15) + R(x * 0.05), l2 = R(xv * 0.10), l3 = R(xv * 0.15);
      var l6 = xdTot - (l1 + l2 + l3 * 3);
      res.xdSchedule = [
        { date: "Theo thông báo", label: "Phần xây dựng – đợt 1 (15% + 5% TTĐC)", amount: l1 },
        { date: "Theo thông báo", label: "Phần xây dựng – đợt 2 (10%)", amount: l2 },
        { date: "Theo thông báo", label: "Phần xây dựng – đợt 3 (15%)", amount: l3 },
        { date: "Theo thông báo", label: "Phần xây dựng – đợt 4 (15%)", amount: l3 },
        { date: "Theo thông báo", label: "Phần xây dựng – đợt 5 (15%)", amount: l3 },
        { date: "Theo thông báo bàn giao", label: "Phần xây dựng – đợt 6 (25% + KPBT + 5% VAT)", amount: l6 }
      ];
    }
    return res;
  }

  /* Toàn bộ phiếu: 4 cách chính + bảng các gói vay */
  function quote(u, opt) {
    opt = opt || {};
    var o = function (extra) { var x = {}; for (var k in opt) x[k] = opt[k]; for (var j in extra) x[j] = extra[j]; return x; };
    var term = opt.term || 24, fterm = opt.fixedTerm || term;
    var q = {
      unit: u, opt: opt, csbh: CSBH, doc: CSBH.docs[u.pol] || CSBH.docs.XL,
      early: calc(u, "early", opt), std: calc(u, "std", opt),
      loan0: calc(u, "loan0", o({ term: term })), fixed: calc(u, "fixed", o({ fixedTerm: fterm })),
      loans0: Object.keys(CSBH.htls0).map(function (t) { return calc(u, "loan0", o({ term: +t })); }),
      fixeds: Object.keys(CSBH.fixed).map(function (t) { return calc(u, "fixed", o({ fixedTerm: +t })); })
    };
    return q;
  }

  var API = { CSBH: CSBH, calc: calc, quote: quote, fmtDate: fmtDate, parseDate: parseDate, addDays: addDays };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.GPPricing = API;
})(this);
