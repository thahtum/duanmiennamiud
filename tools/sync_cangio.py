"""Đồng bộ giỏ hàng Cần Giờ từ file Excel quỹ căn -> gio-hang-cangio.js
Dùng: python3 sync_cangio.py <file.xlsx> <output.js>
Đọc 3 trang: 'CẦN GIỜ', 'CẦN GIỜ GHC', 'CẦN GIỜ QUỸ VIP'. Trạng thái lấy theo màu ô mã căn
(đỏ = đã bán, vàng = đang lock, tím = lock deal) và cột Tình trạng/Ghi chú."""
import openpyxl, re, json, sys, datetime, warnings
warnings.filterwarnings("ignore")
src, dst = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src, data_only=True)

def num(v):
    if v is None or v == '-' or v == '': return None
    if isinstance(v, (int, float)): return float(v)
    s = str(v).strip()
    if re.fullmatch(r'\d{1,3}(\.\d{3})+(,\d+)?', s): s = s.replace('.', '').replace(',', '.')
    elif re.fullmatch(r'\d{1,3}(,\d{3})+(\.\d+)?', s): s = s.replace(',', '')
    elif re.fullmatch(r'\d+,\d+', s): s = s.replace(',', '.')
    try: return float(s)
    except: return None

STAT = {"FFFF0000": "ban", "FFFFFF00": "lock", "FF8E7CC3": "lockdeal"}
TYPE = {"LK": "Liền kề", "SL": "Song lập", "ĐL": "Đơn lập", "DL": "Đơn lập", "SH": "Shophouse"}
def fill(c):
    rgb = c.fill.fgColor.rgb if c.fill and c.fill.fgColor is not None else None
    return rgb if isinstance(rgb, str) else ""
def sheet(name):
    for ws in wb.worksheets:
        if ws.title.strip() == name: return ws
    return None
rows = {}
def add(code, d):
    code = str(code).strip().upper().replace(' ', '')
    if not re.match(r'^[A-ZĐ]+\d*[A-Z]?-\d+', code) or code in rows: return
    d = {k: v for k, v in d.items() if v not in (None, [], "")}
    rows[code] = d

ws = sheet("CẦN GIỜ")
if ws:
    # Tìm cột theo tiêu đề (sheet hay bị chèn thêm cột); không thấy thì dùng vị trí cũ.
    H = [str(c.value or "").strip().lower() for c in next(ws.iter_rows(min_row=1, max_row=1))]
    def col(pred, default, start=0):
        for i in range(start, len(H)):
            if pred(H[i]): return i
        return default
    cC = col(lambda h: h.startswith("mã căn"), 2)
    cT = col(lambda h: h.startswith("loại"), 3)
    cF = col(lambda h: h.startswith("tcbg"), None)
    cL = col(lambda h: h.startswith("dt đất"), 4)
    cB = col(lambda h: h.startswith("dtxd"), cL + 1)
    cP = col(lambda h: "chưa" in h and "vat" in h, cL + 3)
    cTot = col(lambda h: h.startswith("giá gồm vat"), cP + 3)
    cX = col(lambda h: h.startswith("xây tr"), cTot + 1)
    cD = col(lambda h: h.startswith("đất tr"), cX + 4)
    cG = cD + 4  # cột ghi CKTT / Giãn xây ngay sau "Tổng tiền đất"
    for r in ws.iter_rows(min_row=2):
        v = [c.value for c in r] + [None] * 40
        if not v[cC]: continue
        tc = str(v[cG] or "").strip()
        fin = str(v[cF] or "").strip() if cF is not None else ""
        add(v[cC], {"zone": str(v[1] or "").strip(), "type": TYPE.get(str(v[cT]).strip(), v[cT]), "land": num(v[cL]), "build": num(v[cB]),
                   "pre": num(v[cP]), "vat": num(v[cP + 1]), "kpbt": num(v[cP + 2]), "total": num(v[cTot]),
                   "xd": [num(x) for x in v[cX:cX + 4]], "dat": [num(x) for x in v[cD:cD + 4]],
                   "tcbg": tc or None, "fin": fin or None, "gx": tc.lower().startswith("giãn") or fin.lower().startswith("giãn"),
                   "status": STAT.get(fill(r[cC]), "con"), "src": "CG"})
ws = sheet("CẦN GIỜ GHC")
if ws:
    for r in ws.iter_rows(min_row=4):
        v = [c.value for c in r] + [None] * 30
        if not v[4]: continue
        st = STAT.get(fill(r[4]), "con"); t = (str(v[22] or "") + " " + str(v[23] or "")).lower()
        if "đã bán" in t: st = "ban"
        elif "lock deal" in t: st = "lockdeal"
        elif "lock" in t: st = "lock"
        tc = str(v[6] or "").strip()
        add(v[4], {"zone": str(v[1] or "").strip(), "type": TYPE.get(str(v[5]).strip(), v[5]), "tcbg": tc or None, "gx": tc.lower().startswith("giãn"),
                   "land": num(v[7]), "build": num(v[8]), "pre": num(v[10]), "vat": num(v[11]), "kpbt": num(v[12]), "total": num(v[13]),
                   "xd": [num(x) for x in v[14:18]], "dat": [num(x) for x in v[18:22]], "status": st, "src": "GHC"})
ws = sheet("CẦN GIỜ QUỸ VIP")
if ws:
    for r in ws.iter_rows(min_row=2):
        v = [c.value for c in r] + [None] * 30
        if not v[3]: continue
        p = v[9]
        if isinstance(p, datetime.datetime): p = float(f"{p.day}.{p.month}")   # Excel hiểu nhầm 17.4 thành ngày 17/04
        else:
            p = num(p); p = p / 1e9 if p and p > 1e6 else p
        add(v[3], {"zone": str(v[1] or "").strip(), "type": TYPE.get(str(v[4]).strip(), v[4]), "tcbg": v[5], "land": num(v[6]), "build": num(v[7]),
                   "total": p * 1e9 if p else None, "vip": True, "status": STAT.get(fill(r[3]), "con"), "src": "VIP"})

now = datetime.datetime.utcnow() + datetime.timedelta(hours=7)
out = ("/* GIỎ HÀNG CẦN GIỜ – đồng bộ tự động từ file \"CG+LV+HLX+NT_QUỸ CĂN KDTD MN\" (trang CẦN GIỜ, CẦN GIỜ GHC, CẦN GIỜ QUỸ VIP).\n"
       "   Giá: đồng. status: con | lock | lockdeal | ban. Trang web tự tính giá theo pricing.js. */\n"
       f"window.GP_SHEET = {{ sync: \"{now.strftime('%H:%M %d/%m/%Y')}\", rows: {json.dumps(rows, ensure_ascii=False, separators=(',', ':'))} }};\n")
open(dst, "w", encoding="utf-8").write(out)
print(len(rows), "căn ·", sum(1 for d in rows.values() if d.get("total")), "có giá ·",
      {s: sum(1 for d in rows.values() if d.get("status") == s) for s in ("con", "lock", "lockdeal", "ban")})
