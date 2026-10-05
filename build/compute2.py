"""Six-dimension model. Network comes from the earlier tiering workbook; indicators from the source workbook."""
import re, openpyxl

SRC = "/root/.claude/uploads/84c6249e-43fc-52c8-9191-239551ec3fc2/70e8a2a7-Samanvay_Consularium_NovaDrive_Data.xlsx"
TIER_WB = "/home/claude/NovaDrive_Supplier_Tiering.xlsx"
wb0 = openpyxl.load_workbook(SRC, data_only=True)
wbT = openpyxl.load_workbook(TIER_WB, data_only=True)

def rows(name, wb=wb0):
    ws = wb[name]
    hdr = list(next(ws.iter_rows(min_row=1, max_row=1, values_only=True)))
    return [dict(zip(hdr, r)) for r in ws.iter_rows(min_row=2, values_only=True) if r[0] is not None]

IND = {r["Entity ID"]: r for r in rows("Supplier business Indicators")}
UNI = {r["Entity ID"]: r for r in rows("Supplier Universe")}
EVD = {r["Evidence ID"]: r for r in rows("Relationship Evidence")}
BUS = {r["Product ID"]: r for r in rows("Business Context")}
COMPS = {r["Component ID"]: r for r in rows("Components Context")}
NAME2ID = {v["Legal Name"]: k for k, v in UNI.items()}
CP = {k: [p.strip() for p in re.search(r"Products Using This Component:\s*([^\n]+)", v["Key Criteria for Alternate Supplier Search"]).group(1).split(",")] for k, v in COMPS.items()}
LEAD = {k: v["Indicative supplier Qualification Lead Time (Weeks)"] for k, v in COMPS.items()}
REV = {p: BUS[p]["Annual Revenue (USD m)"] for p in BUS}
REV_TOTAL = sum(REV.values())

# ---------- network from the tiering workbook ----------
LINKS = []
for r in wbT["Network Links"].iter_rows(min_row=2, values_only=True):
    if r[0] is None: continue
    seller = re.search(r"\((ORG-\d+)\)", r[2]).group(1)
    m = re.search(r"\((ORG-\d+)\)", r[3])
    buyer = m.group(1) if m else "NOVADRIVE"
    LINKS.append(dict(id=r[0], tier=r[1], seller=seller, buyer=buyer, comps=[x.strip() for x in r[4].split(",")],
                      status=r[7], direct=[x.strip() for x in r[8].split(",")], fams=r[10], famids=r[11]))
assert len(LINKS) == 32

# Tier-1 allocations parsed from the disclosure text itself
ALLOC = {}
for e in EVD.values():
    m = re.match(r"(.+?) has been named a production supplier to NovaDrive Technologies for component (\w+), .*?approximately (\d+)% of NovaDrive requirements", e["Evidence Detail"])
    if m:
        ALLOC.setdefault(NAME2ID[m.group(1)], {})[m.group(2)] = int(m.group(3))
T1 = {l["seller"] for l in LINKS if l["buyer"] == "NOVADRIVE"}
assert set(ALLOC) == T1 and len(T1) == 8
for l in LINKS:
    if l["buyer"] == "NOVADRIVE":
        assert all(ALLOC[l["seller"]][c] for c in l["comps"])

EDGES = [(l["seller"], l["buyer"], l["comps"], l["status"], l) for l in LINKS if l["buyer"] != "NOVADRIVE"]
# tier from the buyer (robust check against the file's own tier labels)
tier_of = {}
for l in LINKS: tier_of[l["seller"]] = l["tier"]
for s, b, p, st, l in EDGES:
    assert (b in T1) == (l["tier"] == "Tier-2")

def chains():
    out = {}
    for t1, comps in ALLOC.items():
        for cmp_ in comps:
            out.setdefault(t1, set()).add((cmp_, t1))
            for s2, b2, p2, _, _ in EDGES:
                if b2 == t1 and cmp_ in p2:
                    out.setdefault(s2, set()).add((cmp_, t1))
                    for s3, b3, p3, _, _ in EDGES:
                        if b3 == s2 and cmp_ in p3:
                            out.setdefault(s3, set()).add((cmp_, t1))
    return out
CH = chains()
NODES = list(CH.keys()); assert len(NODES) == 24
TIER = {n: tier_of[n] for n in NODES}
STATUS = {n: "Confirmed" for n in NODES}
for s, b, p, st, l in EDGES:
    if st == "Inferred": STATUS[s] = "Inferred"
# best-supported link per seller (independent source families)
FAMS = {}
for l in LINKS: FAMS[l["seller"]] = max(FAMS.get(l["seller"], 0), l["fams"])

# ---------- explicit single-source statements in the evidence ----------
SOLE_EXPLICIT = {}
for eid, e in EVD.items():
    if "No second die source is currently qualified" in e["Evidence Detail"]: SOLE_EXPLICIT[NAME2ID["IonPeak Semiconductor Ltd."]] = eid
    if "no presently qualified independent substrate" in e["Evidence Detail"]: SOLE_EXPLICIT[NAME2ID["Jade Printed Circuits Ltd."]] = eid
assert set(SOLE_EXPLICIT.values()) == {"DOC-078", "DOC-079"}
PARENT_PAIR = set()
for eid, e in EVD.items():
    if "consolidates Aster Power Assemblies Ltd. and Boreal Power Systems Ltd." in e["Evidence Detail"]:
        PARENT_PAIR = {NAME2ID["Aster Power Assemblies Ltd."], NAME2ID["Boreal Power Systems Ltd."]}
assert len(PARENT_PAIR) == 2

def struct(n):
    ch = CH[n]
    comps = sorted({c for c, _ in ch})
    prods = sorted({p for c in comps for p in CP[c]})
    rev = sum(REV[p] for p in prods)
    exposed = 0
    for c in comps:
        t1s = {t for cc, t in ch if cc == c}
        exposed = max(exposed, min(100, sum(ALLOC[t][c] for t in t1s)))
    t1_aff = len({t for _, t in ch})
    if n in PARENT_PAIR: t1_aff = 2
    # single-source level: 100 explicit/sole 100%, 50 not stated or one parent, 0 second independent Tier-1 disclosed
    if n in SOLE_EXPLICIT: single = 100
    elif n in ALLOC and all(v == 100 for v in ALLOC[n].values()): single = 100
    elif n in PARENT_PAIR: single = 50
    elif n in ALLOC: single = 0
    else: single = 50
    return dict(comps=comps, prods=prods, rev=rev, rev_pct=rev / REV_TOTAL * 100, exposed=exposed,
                weeks=max(LEAD[c] for c in comps), t1_aff=t1_aff, single=single)
ST = {n: struct(n) for n in NODES}

# ---------- scales ----------
def col(name): return [r[name] for r in IND.values() if r[name] is not None]
SC = dict(cr=(min(col("Current Ratio")), max(col("Current Ratio"))), nd=(min(col("Net Debt / EBITDA")), max(col("Net Debt / EBITDA"))),
          tl=(min(col("Shipment Timeliness - 3M Avg (%)")), max(col("Shipment Timeliness - 3M Avg (%)"))),
          tc=(min(col("Timeliness Change - Jan To Latest (pp)")), max(col("Timeliness Change - Jan To Latest (pp)"))))
WEEKS_MAX = max(LEAD.values()); T1_MAX = max(s["t1_aff"] for s in ST.values())
FIELDS = ["Current Ratio", "Net Debt / EBITDA", "Shipment Timeliness - 3M Avg (%)", "Timeliness Change - Jan To Latest (pp)",
          "Assurance Gap Index", "Physical Hazard Index", "Logistics Friction Index", "Infrastructure Index"]

# ---------- events (decisions made on the text; severity levels are assumptions, editable) ----------
SEV = {"zone_watch": 40, "supplier_adverse": 60, "confirmed_disruption": 100}
ZONE_EVENTS = {"EV-001": ("Z01", "zone_watch")}
NAME_EVENTS = {"EV-003": (NAME2ID["Meridian Dielectrics Ltd."], "supplier_adverse")}

def hi(x, lo, hi_): return (x - lo) / (hi_ - lo) * 100
def lo_(x, lo, hi_): return (hi_ - x) / (hi_ - lo) * 100

WEIGHTS = dict(d1=20, d2=15, d3=30, d4=15, d5=10, d6=10)
def scores(n):
    r = IND[n]; s = {}
    parts = []
    if r["Current Ratio"] is not None and r["Net Debt / EBITDA"] is not None:
        parts += [lo_(r["Current Ratio"], *SC["cr"]), hi(r["Net Debt / EBITDA"], *SC["nd"])]
    parts += [lo_(r["Shipment Timeliness - 3M Avg (%)"], *SC["tl"]), lo_(r["Timeliness Change - Jan To Latest (pp)"], *SC["tc"])]
    s["d1"] = sum(parts) / len(parts)
    s["d2"] = (r["Physical Hazard Index"] + r["Logistics Friction Index"] + r["Infrastructure Index"]) / 3
    t = ST[n]
    s["d3"] = (hi(t["t1_aff"], 1, T1_MAX) + t["exposed"] + t["single"]) / 3
    s["d4"] = (t["rev_pct"] + t["weeks"] / WEEKS_MAX * 100) / 2
    ev = 0
    for e, (z, lvl) in ZONE_EVENTS.items():
        if UNI[n]["Facility Zone"] == z: ev = max(ev, SEV[lvl])
    for e, (oid, lvl) in NAME_EVENTS.items():
        if oid == n: ev = max(ev, SEV[lvl])
    s["d5"] = ev
    missing = sum(1 for f in FIELDS if r[f] is None)
    ass = r["Assurance Gap Index"] if r["Assurance Gap Index"] is not None else 100
    ev_pen = 100 if STATUS[n] == "Inferred" else (0 if FAMS[n] >= 2 else 50)
    s["d6"] = (ass + missing / 8 * 100) / 2   # link-evidence strength is NOT scored; it only feeds Confidence
    s["missing"] = missing; s["ev_pen"] = ev_pen
    return s

def overall(s, w=WEIGHTS): return sum(w[k] * s[k] for k in ("d1", "d2", "d3", "d4", "d5", "d6")) / sum(w.values())

if __name__ == "__main__":
    print("scales", SC, WEEKS_MAX, T1_MAX)
    print("ALLOC", ALLOC)
    print("SOLE", SOLE_EXPLICIT, "PARENT", PARENT_PAIR)
    res = sorted(((overall(scores(n)), n) for n in NODES), reverse=True)
    for o, n in res:
        s = scores(n); t = ST[n]
        print(f'{UNI[n]["Legal Name"][:27]:27} {TIER[n]} {STATUS[n][:3]} D1={s["d1"]:3.0f} D2={s["d2"]:3.0f} D3={s["d3"]:3.0f} D4={s["d4"]:3.0f} D5={s["d5"]:3.0f} D6={s["d6"]:3.0f} => {o:5.1f} | single={t["single"]} fam={FAMS[n]} miss={s["missing"]}')
