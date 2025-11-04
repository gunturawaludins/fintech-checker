// pages/index.js
import { useEffect, useState } from "react";

const MONTHS_ID = {
  "januari": "01",
  "februari": "02",
  "maret": "03",
  "april": "04",
  "mei": "05",
  "juni": "06",
  "juli": "07",
  "agustus": "08",
  "september": "09",
  "oktober": "10",
  "november": "11",
  "desember": "12"
};

/**
 * Try parse date like "23 Desember 2021" (Indonesian months)
 * Returns ISO string "YYYY-MM-DD" or null if can't parse
 */
function parseIndoDate(text) {
  if (!text) return null;
  try {
    const parts = text.toLowerCase().replace(",", "").split(" ").filter(Boolean);
    // expect [day, month, year] but sometimes format may vary
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, "0");
      const monthName = parts[1];
      const year = parts[2];
      const mm = MONTHS_ID[monthName];
      if (!mm) return null;
      return `${year}-${mm}-${day}`;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default function Home() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // search & filter states
  const [q, setQ] = useState("");

  // hamburger menu and column selection
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({
    no: true,
    company: true,
    system: true,
    license: true,
    date: true,
    businessType: true,
    website: true
  });

  // load data.json from public folder
  useEffect(() => {
    setLoading(true);
    fetch("/data.json")
      .then((r) => r.json())
      .then((json) => {
        // normalize each item by adding an ISO date if possible
        const normalized = json.map((it, idx) => {
          const iso = parseIndoDate(it["Tanggal Berizin/Terdaftar"]);
          return { __id: idx, __isoDate: iso, ...it };
        });
        setData(normalized);
        setFiltered(normalized);
      })
      .catch((err) => {
        console.error("Failed load data.json", err);
        setData([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // apply filters
  function applyFilters() {
    const res = data.filter((it) => {
      // helper for case-insensitive substring check; empty filter => true
      const includes = (field, term) => {
        if (!term) return true;
        if (!field && field !== 0) return false;
        return String(field).toLowerCase().includes(term.toLowerCase());
      };

      // search q across several fields
      if (q) {
        const any = [
          it["Nama Perusahaan"],
          it["Nama Sistem Elektronik"],
          it["Alamat Website"],
          it["Surat Tanda Berizin/Terdaftar"],
          it["Jenis Usaha"]
        ].some((f) => includes(f, q));
        if (!any) return false;
      }

      return true;
    });

    setFiltered(res);
  }

  function resetFilters() {
    setQ("");
    setFiltered(data);
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>FINTECH CHECKER — Prototype</h1>
          <p>Search & filter fintech registration. If not found → dianggap <strong>ILEGAL</strong>.</p>
        </div>
        <div style={{ textAlign: "right", color: "#6b7280", fontSize: 13 }}>
          Client-side only • Static JSON
        </div>
      </div>

      {isMenuOpen && (
        <div className="sidebar">
          <h3>Column Visibility</h3>
          {Object.keys(selectedColumns).map((key) => (
            <label key={key} style={{ display: "block", marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={selectedColumns[key]}
                onChange={(e) =>
                  setSelectedColumns({ ...selectedColumns, [key]: e.target.checked })
                }
              />
              {key === "no" ? "No" : key === "company" ? "Nama Perusahaan" : key === "system" ? "Nama Sistem Elektronik" : key === "license" ? "Surat Tanda" : key === "date" ? "Tanggal Terdaftar" : key === "businessType" ? "Jenis Usaha" : "Alamat Website"}
            </label>
          ))}
        </div>
      )}

      <div className="controls card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
          <input className="input" placeholder="Search (company, system, website, surat...)" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}} />
          <button className="btn" onClick={applyFilters}>Search</button>
          <button className="btn secondary" onClick={resetFilters}>Reset</button>
        </div>

        <div style={{ marginTop:12, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ marginLeft: "auto", color:"#6b7280", fontSize:13 }}>
            Total records: <strong>{data.length}</strong>
          </div>
        </div>
      </div>

      <div style={{ marginTop:16 }}>
        {loading ? (
          <div className="card">Loading data...</div>
        ) : q === "" ? (
          <div className="card summary">
            <h2>Fintech Registration Summary</h2>
            <p>Total registered fintech companies: <strong>{data.length}</strong></p>
            <p>Use the search bar above to find specific fintech registrations.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card notice-illegal">
            ❌ <strong>Tidak ditemukan dalam daftar resmi — kemungkinan ILEGAL / UNLISTED</strong>
            <div style={{ marginTop:6, color:"#374151", fontSize:13 }}>
              Tips: cek kembali ejaan nama, sistem, website, surat, atau jenis usaha.
            </div>
          </div>
        ) : (
          <div className="card">
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div>Found <strong>{filtered.length}</strong> result(s).</div>
              <div style={{color:"#6b7280", fontSize:13}}>Showing matches</div>
            </div>

            <table className="table" aria-label="Results table">
              <thead>
                <tr>
                  {selectedColumns.no && <th style={{width:80}}>No</th>}
                  {selectedColumns.company && <th>Nama Perusahaan</th>}
                  {selectedColumns.system && <th>Nama Sistem Elektronik</th>}
                  {selectedColumns.license && <th>Surat Tanda</th>}
                  {selectedColumns.date && <th>Tanggal Terdaftar</th>}
                  {selectedColumns.businessType && <th>Jenis Usaha</th>}
                  {selectedColumns.website && <th>Alamat Website</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((it, i) => (
                  <tr key={it.__id || i}>
                    {selectedColumns.no && <td>{it.Nomor ?? (i+1)}</td>}
                    {selectedColumns.company && <td>{it["Nama Perusahaan"]}</td>}
                    {selectedColumns.system && <td>{it["Nama Sistem Elektronik"]}</td>}
                    {selectedColumns.license && <td>{it["Surat Tanda Berizin/Terdaftar"]}</td>}
                    {selectedColumns.date && <td>{it["Tanggal Berizin/Terdaftar"]}</td>}
                    {selectedColumns.businessType && <td>{it["Jenis Usaha"]}</td>}
                    {selectedColumns.website && <td>
                      {it["Alamat Website"] ? (
                        <a href={it["Alamat Website"]} target="_blank" rel="noreferrer">
                          {it["Alamat Website"]}
                        </a>
                      ) : "-"}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop:18, color:"#6b7280", fontSize:13 }}>
        <strong>Catatan:</strong> Masih dalam tahapan prototyping
      </div>
    </div>
  );
}
