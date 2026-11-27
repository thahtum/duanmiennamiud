/* =====================================================================
   DỮ LIỆU WEBSITE — chỉ cần sửa file này để thay nội dung.
   - BRAND: tên, hotline, Zalo, giờ làm việc, nơi nhận form (leadWebhook)
   - POLICY: chiết khấu, VAT, phí bảo trì, phương án thanh toán, vay
   - PROJECTS: thông tin từng dự án (+ map.image khi có ảnh mặt bằng thật)
   - UNITS: giỏ hàng (mỗi căn 1 dòng). Đang để TRỐNG -> web tự sinh dữ liệu MẪU.
   - ARTICLES: bài viết
   ===================================================================== */

window.SITE = {
  brand: {
    name: "Dự án Vinhomes miền Nam",
    tagline: "Tư vấn: Trần Thanh Tâm",
    consultant: "Trần Thanh Tâm",
    hotline: "0876 070 701",          // hiển thị
    phone: "0876070701",              // dùng cho tel: và zalo.me
    hotline2: "0373 185 292",
    phone2: "0373185292",
    hours: "7h – 22h mỗi ngày",
    area: "TP. Hồ Chí Minh",
    email: "tranthanhtam.hcmc@gmail.com",
    leadWebhook: "https://script.google.com/macros/s/AKfycbxzg9J2t0yMdHrAfYZkqNDzP15WWnxU0ZORUenQTPbqFhaBbyRjeElvPT0wJ0vJ00lQ6w/exec",                  // URL nhận form (Google Apps Script / Telegram bot...). Để trống = gửi qua Zalo
    updated: "11/2026",
    disclaimer: "Đây là trang của đơn vị tư vấn độc lập, không phải trang chính thức của chủ đầu tư. Giá và chính sách theo công bố của chủ đầu tư tại từng thời điểm, có thể thay đổi."
  },

  /* ---------- CHÍNH SÁCH & CÔNG THỨC BÁO GIÁ (GIÁ TRỊ MẪU — thay theo chính sách thật) ---------- */
  policy: {
    vat: 0.10,                 // VAT
    maintenance: 0.02,         // kinh phí bảo trì 2% (trên giá trước VAT)
    vinclub: { none: 0, gold: 0.005, platinum: 0.01, diamond: 0.015 },
    vinclubLabel: { none: "Không", gold: "Gold", platinum: "Platinum", diamond: "Diamond" },
    noRentDiscount: 0.03,      // chiết khấu thêm nếu KHÔNG nhận cam kết thuê lại (căn có chương trình thuê)
    rentYield: 0.06,           // lợi nhuận cam kết thuê %/năm (tham khảo)
    rentYears: 2,
    foreignNote: "Người nước ngoài sở hữu tối đa 50 năm, áp dụng theo hạn mức của Luật Nhà ở.",
    paymentPlans: [
      { id: "vay70", name: "Vay ngân hàng 70% – hỗ trợ lãi 0%", discount: 0, loan: 0.70,
        steps: [
          { label: "Đặt cọc", pct: 0.05, when: "Khi ký thỏa thuận đặt cọc" },
          { label: "Ký HĐMB", pct: 0.10, when: "Trong 30 ngày" },
          { label: "Đợt 3", pct: 0.15, when: "Sau 2 tháng" },
          { label: "Ngân hàng giải ngân", pct: 0.70, when: "Theo tiến độ, hỗ trợ lãi 0% đến 24–36 tháng", bank: true }
        ] },
      { id: "chuan", name: "Thanh toán theo tiến độ chuẩn", discount: 0.02, loan: 0,
        steps: [
          { label: "Đặt cọc", pct: 0.05, when: "Khi ký thỏa thuận đặt cọc" },
          { label: "Ký HĐMB", pct: 0.15, when: "Trong 30 ngày" },
          { label: "Đợt 3", pct: 0.10, when: "Sau 3 tháng" },
          { label: "Đợt 4", pct: 0.10, when: "Sau 6 tháng" },
          { label: "Đợt 5", pct: 0.15, when: "Sau 9 tháng" },
          { label: "Nhận bàn giao", pct: 0.40, when: "Thông báo bàn giao" },
          { label: "Nhận sổ", pct: 0.05, when: "Khi cấp GCN" }
        ] },
      { id: "som", name: "Thanh toán sớm 95%", discount: 0.08, loan: 0,
        steps: [
          { label: "Đặt cọc", pct: 0.05, when: "Khi ký thỏa thuận đặt cọc" },
          { label: "Thanh toán sớm", pct: 0.90, when: "Trong 30 ngày kể từ ký HĐMB" },
          { label: "Nhận sổ", pct: 0.05, when: "Khi cấp GCN" }
        ] }
    ],
    loan: { maxLtv: 0.70, supportMonths: 24, rateAfter: 9.5, termYears: 25 }
  },

  /* ---------- DỰ ÁN ---------- */
  projects: [
    {
      slug: "green-paradise", name: "Vinhomes Green Paradise", short: "Green Paradise",
      location: "Cần Giờ, TP.HCM", area: "2.870 ha", status: "Đang mở bán",
      types: ["Nhà phố", "Biệt thự"], priceFrom: 12.95, color: ["#0e5a5a", "#4fb3a3"],
      summary: "Siêu đô thị biển Cần Giờ với quần thể nghỉ dưỡng, golf, Paradise Lagoon và hệ thống trường – viện – thương mại. Phân khu A – Vịnh Tiên (The Haven Bay) đang mở bán với 2.517 lô liền kề, song lập, đơn lập.",
      stats: [["2.870 ha", "Quy mô toàn dự án"], ["2.517 lô", "Phân khu A – Vịnh Tiên"], ["70 – 725 m²", "Diện tích đất"], ["~800 ha", "Paradise Lagoon"]],
      info: [["Tên thương mại", "Vinhomes Green Paradise Cần Giờ"], ["Chủ đầu tư", "CTCP Vinhomes (Vingroup)"], ["Vị trí", "Xã Long Hòa & TT Cần Thạnh, Cần Giờ, TP.HCM"], ["Phân khu đang mở bán", "Phân khu A – The Haven Bay (Vịnh Tiên)"], ["Sản phẩm Phân khu A", "1.478 liền kề · 797 song lập · 239 đơn lập"], ["Trục đường chính", "Đại lộ Thời Đại 120m · Đường Tương Lai 50m · Đường Sóng Xanh 26m"], ["Pháp lý", "Theo hồ sơ chủ đầu tư công bố"], ["Khởi công", "19/04/2025"]],
      routes: [["Quận 1 (đường bộ, khi cầu Cần Giờ hoàn thành)", "~45 phút"], ["Ga Bến Thành – đường sắt tốc độ cao Bến Thành – Cần Giờ (tương lai)", "~13 phút"], ["Vũng Tàu – tuyến Cần Giờ – Vũng Tàu (tương lai)", "~10 phút"], ["Sân bay Long Thành", "Qua cầu Phước Khánh & cao tốc Bến Lức – Long Thành"], ["Hiện tại qua phà Bình Khánh", "1h30 – 2h"]],
      image: "img/gp/pc-bview.jpg", thumb: "img/gp/pc-bview-m.jpg",
      locationImage: "img/gp/vi-tri.jpg", locationImage2: "img/gp-ha-tang.jpg",
      zones: [
        { code: "A", name: "Vịnh Tiên – The Haven Bay", desc: "Phân khu mở bán đầu tiên: 2.517 lô thấp tầng ven vịnh, kề công viên trung tâm và bãi biển.", status: "Đang mở bán" },
        { code: "B", name: "Vịnh Ngọc – The Green Bay", desc: "Phân khu để ở mật độ thấp, Vincom – Vinmec – Vinschool.", status: "Sắp ra mắt" },
        { code: "C", name: "Mũi Danh Vọng – The Paradise", desc: "Trung tâm kinh tế, tháp biểu tượng, khách sạn.", status: "Sắp ra mắt" },
        { code: "D", name: "Đảo Mặt Trời – The Grand Island", desc: "Lễ hội biển, Paradise Lagoon, nghỉ dưỡng.", status: "Sắp ra mắt" }
      ],
      products: [["Nhà liền kề / Shophouse", "70 – 224 m²", "1.478 lô · phổ biến 75 – 100 m² · ảnh: mặt cắt mẫu nhà VN48", "img/gp/shop-vn48-m.jpg", "img/gp/shop-vn48.jpg"], ["Biệt thự song lập", "157 – 452,5 m²", "797 lô · phổ biến ~234 m²", "img/gp/sp-songlap.jpg"], ["Biệt thự đơn lập", "259,5 – 725 m²", "239 lô · phổ biến ~418 m²", "img/gp/sp-donlap.jpg"]],
      perks: ["Vay tối đa 70% giá trị", "Hỗ trợ lãi suất, ân hạn gốc đến 60 tháng", "Ưu đãi đến 1,5% cho VinClub", "Chiết khấu thêm khi thanh toán sớm"],
      amenities: ["Sân golf", "Bến du thuyền", "Paradise Lagoon", "Công viên trung tâm", "Bãi biển", "Vinmec", "Vinschool", "Vincom", "Rừng ngập mặn Cần Giờ", "Quảng trường biển"],
      amenityMap: "img/gp/tmb-tienich.jpg",
      amenityCards: [
        ["img/gp/ti-01.jpg", "Ga depot đường sắt tốc độ cao Q7 – Cần Giờ & Vincom Mega Mall"],
        ["img/gp/ti-02.jpg", "Quảng trường chào đón Welcome Park"],
        ["img/gp/ti-03.jpg", "Bộ đôi sân golf 18 lỗ"],
        ["img/gp/ti-04.jpg", "Khách sạn Vinpearl Themed Hotel"],
        ["img/gp/ti-05.jpg", "Chuỗi khách sạn mini thương hiệu quốc tế"],
        ["img/gp/ti-06.jpg", "Tổ hợp khách sạn 5 sao (tới 7.000 phòng)"],
        ["img/gp/ti-07.jpg", "Quần thể vui chơi giải trí 122 ha"],
        ["img/gp/ti-08.jpg", "Trung tâm Outlet 20 ha"],
        ["img/gp/ti-09.jpg", "Quảng trường lễ hội biển Cần Giờ"],
        ["img/gp/ti-10.jpg", "Bệnh viện Vinmec"],
        ["img/gp/ti-11.jpg", "Vincom Center Luxury"],
        ["img/gp/ti-12.jpg", "Tòa tháp 108 tầng"],
        ["img/gp/ti-13.jpg", "Cảng tàu quốc tế 5 sao Landmark Harbour"],
        ["img/gp/ti-14.jpg", "Tổ hợp vui chơi – mua sắm 24/7 mô hình Clarke Quay"],
        ["img/gp/ti-15.jpg", "TTTM Vincom Plaza – chợ đêm & chợ đặc sản 3 miền"],
        ["img/gp/ti-16.jpg", "Bệnh viện Vinmec Cleveland Connected"],
        ["img/gp/ti-17.jpg", "Nhà thi đấu đa năng"],
        ["img/gp/ti-18.jpg", "Trung tâm cộng đồng Young Paradise Hub"],
        ["img/gp/ti-19.jpg", "Biển hồ nhân tạo Paradise Lagoon"],
        ["img/gp/ti-20.jpg", "Văn phòng 15 tầng"],
        ["img/gp/ti-21.jpg", "Nhà hát Blue Waves Theatre"]
      ],
      gallery: [
        { src: "img/gp/pc-bview.jpg", thumb: "img/gp/pc-bview-m.jpg", label: "Phối cảnh toàn dự án lúc hoàng hôn" },
        { src: "img/gp/pc-tong.jpg", thumb: "img/gp/pc-tong-s.jpg", label: "Phối cảnh tổng thể" },
        { src: "img/gp/topdown.jpg", thumb: "img/gp/topdown-s.jpg", label: "Toàn cảnh từ trên cao" },
        { src: "img/gp/shop-vn48.jpg", thumb: "img/gp/shop-vn48-m.jpg", label: "Mặt cắt mẫu nhà phố VN48" },
        { src: "img/gp/bien-ho.jpg", thumb: "img/gp/bien-ho-s.jpg", label: "Biển hồ nhân tạo" },
        { src: "img/gp/ti-12.jpg", label: "Tháp 108 tầng" },
        { src: "img/gp/ti-07.jpg", label: "Quần thể vui chơi 122 ha" },
        { src: "img/gp/ti-09.jpg", label: "Quảng trường lễ hội biển" }
      ],
      timeline: [["19/04/2025", "Khởi công dự án"], ["12/2026", "Hoàn thành san lấp, bàn giao lô đầu tiên"], ["2027", "Hoàn thiện nhà phố các đợt tiếp theo, khai trương tiện ích lớn"], ["2028", "Hoàn thành trường học, khách sạn, các cây cầu nội khu"]],
      faq: [["Đi từ trung tâm mất bao lâu?", "Hiện tại qua phà Bình Khánh khoảng 1h30–2h. Khi cầu Cần Giờ và đại lộ Rừng Sác hoàn thành, từ Quận 1 khoảng 45 phút; tuyến đường sắt tốc độ cao từ ga Bến Thành khoảng 13 phút."], ["Phân khu A có những loại sản phẩm nào?", "1.478 nhà liền kề (70–224 m²), 797 biệt thự song lập (157–452,5 m²) và 239 biệt thự đơn lập (259,5–725 m²)."], ["Sở hữu lâu dài không?", "Người Việt Nam sở hữu lâu dài; người nước ngoài tối đa 50 năm theo luật."], ["Giá bao nhiêu?", "Tham khảo từ 12,95 tỷ (gồm VAT), tùy vị trí, diện tích và chính sách từng đợt. Gửi mã căn để nhận báo giá chính xác."]],
      overview: {
        image: "img/gp-tmb.jpg", width: 3842, height: 2345,
        tiles: { k: 1.5, size: 1024, levels: [{ dir: "img/tmb/m/", z: 3.125, cols: 8, rows: 5, min: 1.1 }, { dir: "img/tmb/h/", z: 6.25, cols: 16, rows: 10, min: 2.2 }, { dir: "img/tmb/x/", z: 12.5, cols: 32, rows: 20, min: 4.4 }, { dir: "img/tmb/u/", z: 25, cols: 63, rows: 39, min: 9 }, { dir: "img/tmb/s/", z: 50, cols: 126, rows: 77, min: 18 }] },   // ô ảnh nét cao khi phóng to
                                                               // lớp chữ vector (mã lô, diện tích)
        note: "Tổng mặt bằng dự án Vinhomes Green Paradise (nguồn: TMB A0 251001 của chủ đầu tư)",
        // ma trận chuyển tọa độ mặt bằng Phân khu A -> ảnh tổng mặt bằng [a, b, c, d, e, f]: X = a*x + b*y + c, Y = d*x + e*y + f
        M: [0.515423, -0.035354, 922.477, 0.0047, 0.557494, 1212.230],
        // vị trí tham khảo cho các mã chưa có trên bản vẽ Phân khu A (theo tiền tố mã căn)
        approx: [["^VN", 2741, 887], ["^AS", 2661, 1027], ["^TĐX", 2831, 1032], ["^TL-1093$", 1041, 1397], ["^TL", 2581, 917], ["^VT-", 1051, 1457]]
      },
      maps: [
        { id: "vt", name: "Vịnh Tiên – Phân khu A", image: "img/gp-khu-a.jpg", width: 1760, height: 850, labelSize: 1.15, labelZoom: 4.5, note: "Mặt bằng mã căn – diện tích Vịnh Tiên (The Haven Bay). Phóng to để xem mã căn." },
        { id: "vn", name: "Vịnh Ngọc", image: "img/gp-vinh-ngoc.jpg", width: 3616, height: 2424, labelSize: 3.4, labelZoom: 1.3, labels: "VN_LABELS", naFill: "rgba(255,255,255,0.02)", note: "Mặt bằng mã căn – diện tích Vịnh Ngọc (The Green Bay), theo TMB 2606. Phóng to để xem mã căn." }
      ],
      map: { image: "img/gp-khu-a.jpg", width: 1760, height: 850, note: "Tổng mặt bằng mã căn – diện tích Phân khu A (The Haven Bay). Phóng to để xem mã căn." },
      zoneLabel: "Phân khu", zoneList: ["Vịnh Tiên", "Vịnh Ngọc"], unitTypes: ["Liền kề", "Song lập", "Đơn lập"], handovers: ["Thô", "Thô có thang", "Thô không thang", "Giãn xây", "Hoàn thiện Tầng 1"],
      sample: { count: 0 }
    },
    {
      slug: "sai-gon-park", name: "Vinhomes Sài Gòn Park", short: "Sài Gòn Park",
      location: "Hóc Môn, TP.HCM", area: "~1.080 ha", status: "Đang mở bán",
      types: ["Nhà phố", "Biệt thự"], priceFrom: 5.81, color: ["#2d4a2b", "#9bbf5a"],
      summary: "Đại đô thị cửa ngõ Tây Bắc, hưởng lợi Vành đai 3, cao tốc TP.HCM – Mộc Bài và Metro số 2 kéo dài.",
      stats: [["~1.080 ha", "Quy mô"], ["5,81 tỷ", "Liền kề từ"], ["Vành đai 3", "Hạ tầng"], ["Metro 2", "Kết nối"]],
      info: [["Tên thương mại", "Vinhomes Sài Gòn Park"], ["Chủ đầu tư", "CTCP Vinhomes"], ["Vị trí", "Huyện Hóc Môn, TP.HCM"], ["Loại hình", "Liền kề, shophouse, biệt thự"], ["Pháp lý", "Theo hồ sơ chủ đầu tư công bố"]],
      routes: [["Trung tâm Quận 1", "~40 phút"], ["Sân bay Tân Sơn Nhất", "~30 phút"], ["Vành đai 3", "Kết nối trực tiếp"], ["Cao tốc TP.HCM – Mộc Bài", "Đang triển khai"]],
      zones: [{ code: "1", name: "Phân khu 1", desc: "Liền kề, shophouse trục chính.", status: "Đang mở bán" }, { code: "2", name: "Phân khu 2", desc: "Biệt thự ven hồ.", status: "Sắp ra mắt" }],
      products: [["Liền kề", "70 – 120 m²", ""], ["Shophouse", "90 – 180 m²", ""], ["Biệt thự", "180 – 400 m²", ""]],
      perks: ["Vay tối đa 70%", "Hỗ trợ lãi 0% đến 24 tháng", "Ưu đãi VinClub"],
      amenities: ["Công viên trung tâm", "Hồ cảnh quan", "Vinschool", "Vinmec", "Vincom"],
      timeline: [["2025", "Hoàn tất pháp lý giai đoạn 1"], ["2026", "Khởi công, mở bán đợt đầu"], ["2028", "Dự kiến bàn giao giai đoạn 1"]],
      faq: [["Khi nào bàn giao?", "Theo tiến độ chủ đầu tư công bố cho từng phân khu."]],
      map: { image: "", note: "Mặt bằng minh họa." },
      zoneList: ["Phân khu 1", "Phân khu 2"], unitTypes: ["Liền kề", "Shophouse", "Biệt thự"], handovers: ["Nhà thô", "Hoàn thiện mặt ngoài"],
      sample: { count: 60, prefix: ["LK", "SH", "BT"], landRange: [70, 380], ppm: [70, 120] }
    },
    {
      slug: "grand-park", name: "Vinhomes Grand Park & The Opus One", short: "Grand Park",
      location: "TP. Thủ Đức", area: "~272 ha", status: "Đang bàn giao",
      types: ["Căn hộ", "Nhà phố", "Biệt thự"], priceFrom: 2.6, color: ["#1d3557", "#5fa8d3"],
      summary: "Đại đô thị phía Đông đã hình thành, cạnh Metro số 1, có công viên 36 ha, Vincom Mega Mall. The Opus One là dòng căn hộ cao cấp mới.",
      stats: [["~272 ha", "Quy mô"], ["36 ha", "Công viên"], ["Metro 1", "Kết nối"], ["Studio–3PN", "Căn hộ"]],
      info: [["Tên thương mại", "Vinhomes Grand Park / The Opus One"], ["Chủ đầu tư", "CTCP Vinhomes"], ["Vị trí", "Phường Long Thạnh Mỹ & Long Bình, TP. Thủ Đức"], ["Loại hình", "Căn hộ, nhà phố, biệt thự"]],
      routes: [["Ga Metro Suối Tiên", "~10 phút"], ["Trung tâm Quận 1", "~35 phút"], ["Cao tốc Long Thành", "~5 phút"]],
      zones: [{ code: "OP", name: "The Opus One", desc: "Tòa căn hộ cao cấp mới.", status: "Đang mở bán" }, { code: "GP", name: "Grand Park", desc: "Căn hộ chuyển nhượng, nhà phố, biệt thự.", status: "Đang bàn giao" }],
      products: [["Studio", "~30 m²", ""], ["1PN – 2PN", "45 – 70 m²", ""], ["3PN", "80 – 110 m²", ""]],
      perks: ["Vay 70%", "Hỗ trợ lãi suất theo kỳ hạn", "Ưu đãi VinClub"],
      amenities: ["Công viên 36 ha", "Vincom Mega Mall", "Vinschool", "Vinmec", "Bể bơi", "Gym"],
      timeline: [["2020", "Bàn giao các phân khu đầu"], ["2026", "Mở bán The Opus One"], ["2028", "Dự kiến bàn giao The Opus One"]],
      faq: [["Có căn chuyển nhượng không?", "Có, liên hệ để nhận danh sách căn chuyển nhượng cập nhật."]],
      map: { image: "", note: "Mặt bằng minh họa." },
      zoneList: ["The Opus One", "Grand Park"], unitTypes: ["Studio", "1PN", "2PN", "3PN"], handovers: ["Cơ bản", "Nội thất liền tường"],
      sample: { count: 48, apartment: true, prefix: ["OP1", "OP2", "GP-S"], prefixZone: [0, 0, 1], landRange: [30, 110], ppm: [70, 95] }
    },
    {
      slug: "hai-van-bay", name: "Vinhomes Hải Vân Bay", short: "Hải Vân Bay",
      location: "Đà Nẵng", area: "512,2 ha", status: "Đang mở bán",
      types: ["Nhà phố", "Biệt thự"], priceFrom: 5.84, color: ["#5a3e2b", "#e0a458"],
      summary: "Đô thị nghỉ dưỡng ven vịnh dưới chân đèo Hải Vân, phân khu Bạch Vân mở bán đầu tiên.",
      stats: [["512,2 ha", "Quy mô"], ["5,84 tỷ", "Liền kề từ"], ["Bạch Vân", "Phân khu mở bán"], ["Ven vịnh", "Vị trí"]],
      info: [["Tên thương mại", "Vinhomes Hải Vân Bay"], ["Chủ đầu tư", "CTCP Vinhomes"], ["Vị trí", "Liên Chiểu, Đà Nẵng"], ["Loại hình", "Liền kề, shophouse, biệt thự"]],
      routes: [["Sân bay Đà Nẵng", "~25 phút"], ["Trung tâm Đà Nẵng", "~20 phút"]],
      zones: [{ code: "BV", name: "Bạch Vân", desc: "Phân khu mở bán đầu tiên.", status: "Đang mở bán" }],
      products: [["Liền kề", "75 – 120 m²", ""], ["Biệt thự", "200 – 400 m²", ""]],
      perks: ["Vay 70%", "Hỗ trợ lãi suất", "Ưu đãi VinClub"],
      amenities: ["Bãi biển", "Bến du thuyền", "Công viên", "Trường học"],
      timeline: [["2026", "Mở bán phân khu Bạch Vân"]],
      faq: [["Người ngoài Đà Nẵng mua được không?", "Được, công dân Việt Nam mua và đứng tên bình thường."]],
      map: { image: "", note: "Mặt bằng minh họa." },
      zoneList: ["Bạch Vân"], unitTypes: ["Liền kề", "Biệt thự"], handovers: ["Nhà thô"],
      sample: { count: 36, prefix: ["BV", "BT"], landRange: [75, 360], ppm: [70, 110] }
    },
    {
      slug: "green-city", name: "Vinhomes Green City", short: "Green City",
      location: "Hậu Nghĩa, Tây Ninh", area: "197,2 ha", status: "Nhận giỏ hàng",
      types: ["Nhà phố", "Biệt thự"], priceFrom: null, color: ["#3b5d2a", "#c4d96f"],
      summary: "Đô thị vệ tinh phía Tây TP.HCM, sản phẩm nhà phố 5 tầng và biệt thự.",
      stats: [["197,2 ha", "Quy mô"], ["5 tầng", "Nhà phố"], ["Tây Ninh", "Vị trí"], ["Liên hệ", "Giá"]],
      info: [["Chủ đầu tư", "CTCP Vinhomes"], ["Vị trí", "Hậu Nghĩa, Tây Ninh"]],
      routes: [["Trung tâm TP.HCM", "~50 phút"]], zones: [], products: [["Nhà phố 5 tầng", "", ""], ["Biệt thự", "", ""]],
      perks: ["Nhận giỏ hàng qua Zalo"], amenities: [], timeline: [], faq: [], map: { image: "" },
      zoneList: [], unitTypes: [], handovers: [], sample: { count: 0 }
    },
    {
      slug: "pearl-bay", name: "Vinhomes Pearl Bay Nha Trang", short: "Pearl Bay",
      location: "Nha Trang, Khánh Hòa", area: "—", status: "Đăng ký giỏ hàng",
      types: ["Nhà phố", "Biệt thự"], priceFrom: null, color: ["#174c6b", "#7fd1e8"],
      summary: "Đô thị biển Nha Trang — nhận đăng ký giỏ hàng đợt đầu.",
      stats: [["Nha Trang", "Vị trí"], ["Đợt đầu", "Giỏ hàng"], ["", ""], ["Liên hệ", "Giá"]],
      info: [["Vị trí", "Nha Trang, Khánh Hòa"]], routes: [], zones: [], products: [], perks: ["Đăng ký giỏ hàng đợt đầu qua Zalo"],
      amenities: [], timeline: [], faq: [], map: { image: "" }, zoneList: [], unitTypes: [], handovers: [], sample: { count: 0 }
    }
  ],

  /* ---------- GIỎ HÀNG ----------
     Mỗi căn: { code, project(slug), zone, type, handover, land(m²), build(m²), floors, dir, legal,
                price(tỷ, gồm VAT), status("con"|"coc"|"ban"), rent(true/false), x, y (vị trí % trên ảnh mặt bằng), block }
     Để trống => tự sinh dữ liệu MẪU. */
  units: [],

  directions: ["Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc"],
  legals: ["Sổ hồng sẵn", "Đang chờ sổ", "Hợp đồng mua bán"],

  homeFaq: [
    ["Mua nhà cần chuẩn bị bao nhiêu tiền?", "Thông thường khách chuẩn bị 30% giá trị căn (đặt cọc tối đa 5% theo luật, phần còn lại theo tiến độ), 70% còn lại có thể vay ngân hàng với gói hỗ trợ lãi suất."],
    ["Giá trên web có phải giá chủ đầu tư không?", "Giá tham khảo theo bảng giá chủ đầu tư công bố từng đợt. Báo giá chính xác theo mã căn và chính sách tại thời điểm ký."],
    ["Gói vay lãi suất 0% hoạt động thế nào?", "Chủ đầu tư hỗ trợ lãi suất và ân hạn gốc trong một số tháng. Kỳ hạn hỗ trợ càng dài thì giá căn có thể điều chỉnh tương ứng — bạn có thể so sánh bằng công cụ tính vay ở từng dự án."],
    ["Hiện có những dự án nào đang mở bán?", "Green Paradise (Cần Giờ), Sài Gòn Park (Hóc Môn), Grand Park & The Opus One (Thủ Đức), Hải Vân Bay (Đà Nẵng) và nhận giỏ hàng Green City, Pearl Bay."]
  ],

  /* ---------- BÀI VIẾT ---------- */
  articles: [
    { slug: "quy-trinh-mua-nha", title: "Quy trình 6 bước mua nhà trực tiếp từ chủ đầu tư", date: "17/11/2026", tag: "Kinh nghiệm",
      excerpt: "Từ chọn căn, đặt cọc đến ký hợp đồng và nhận nhà — những gì cần chuẩn bị ở từng bước.",
      body: ["<b>1. Chọn dự án và mã căn.</b> Xem giỏ hàng, mặt bằng và báo giá theo mã căn để chốt 2–3 lựa chọn.", "<b>2. Giữ chỗ / đặt cọc.</b> Ký thỏa thuận đặt cọc, mức cọc tối đa 5% giá trị theo quy định hiện hành.", "<b>3. Chọn phương án thanh toán.</b> Vay ngân hàng, thanh toán chuẩn hay thanh toán sớm — mỗi phương án có chiết khấu khác nhau.", "<b>4. Ký hợp đồng mua bán.</b> Kiểm tra kỹ phụ lục tiến độ, bàn giao, phạt chậm.", "<b>5. Thanh toán theo tiến độ</b> và theo dõi giải ngân nếu vay.", "<b>6. Nhận bàn giao và làm sổ.</b> Thanh toán đợt cuối khi nhận Giấy chứng nhận.", "Chi phí cần dự trù thêm: kinh phí bảo trì 2%, lệ phí trước bạ, phí công chứng (nếu có)."] },
    { slug: "so-sanh-goi-vay", title: "So sánh gói vay 0% lãi suất 18, 24, 30, 36 tháng", date: "17/11/2026", tag: "Tài chính",
      excerpt: "Kỳ hỗ trợ dài hơn giúp giãn áp lực trả nợ nhưng giá căn thường điều chỉnh tăng. Cách chọn cho phù hợp.",
      body: ["Gói hỗ trợ lãi 0% nghĩa là trong thời gian hỗ trợ, chủ đầu tư trả lãi thay bạn và ngân hàng ân hạn nợ gốc.", "Kỳ hỗ trợ càng dài, giá bán thường được điều chỉnh tăng tương ứng. Nếu có kế hoạch bán lại sớm, kỳ hỗ trợ dài giúp giảm chi phí vốn.", "Nếu dự định ở lâu dài và có dòng tiền ổn định, kỳ ngắn kèm chiết khấu cao hơn thường có lợi hơn về tổng chi phí.", "Hãy dùng công cụ tính vay ở trang từng dự án để thấy số tiền trả hàng tháng sau khi hết hỗ trợ."] },
    { slug: "chon-huong-nha", title: "Kinh nghiệm chọn hướng nhà liền kề tại TP.HCM", date: "17/11/2026", tag: "Kinh nghiệm",
      excerpt: "Ưu nhược điểm của từng hướng và cách chống nóng cho nhà hướng Tây.",
      body: ["Hướng Nam và Đông Nam đón gió mát, ít nắng gắt — được ưa chuộng nhất.", "Hướng Tây nắng chiều gắt nhưng giá thường mềm hơn; có thể khắc phục bằng lam chắn nắng, kính hộp, cây xanh mặt tiền.", "Với shophouse kinh doanh, vị trí mặt đường và lưu lượng người qua lại quan trọng hơn hướng."] },
    { slug: "chuan-bi-tai-chinh", title: "Chuẩn bị tài chính trước khi xuống tiền", date: "17/11/2026", tag: "Tài chính",
      excerpt: "Tỷ lệ vốn tự có, khả năng trả nợ và khoản dự phòng nên có.",
      body: ["Quy tắc an toàn: khoản trả nợ hàng tháng không vượt quá 40–50% thu nhập ổn định.", "Chuẩn bị tối thiểu 30% vốn tự có cùng khoản dự phòng 6 tháng trả nợ.", "Tính trước khoản trả sau khi hết thời gian hỗ trợ lãi suất — đây là lúc áp lực lớn nhất."] }
  ]
};
