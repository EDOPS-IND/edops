"use client";

import { useState } from "react";

export function ConfigPane({
  onSaveConfig
}: {
  onSaveConfig: (cfg: any) => void;
}) {
  const [configSettings, setConfigSettings] = useState({
    academicYear: "2026-27",
    minAttendancePct: 75,
    lateGraceMinutes: 15,
    fileUploadLimitMb: 50,
  });

  return (
    <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "24px", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 16px" }}>Platform Defaults Configuration</h2>

      <div style={{ display: "grid", gap: "16px" }}>
        <div>
          <label style={{ fontSize: "12.5px", fontWeight: 600 }}>Default Academic Year</label>
          <input
            type="text"
            value={configSettings.academicYear}
            onChange={e => setConfigSettings({ ...configSettings, academicYear: e.target.value })}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "12.5px", fontWeight: 600 }}>Late Arrival Grace Period (Minutes)</label>
          <input
            type="number"
            value={configSettings.lateGraceMinutes}
            onChange={e => setConfigSettings({ ...configSettings, lateGraceMinutes: Number(e.target.value) })}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "12.5px", fontWeight: 600 }}>Minimum Attendance Percentage</label>
          <input
            type="number"
            value={configSettings.minAttendancePct}
            onChange={e => setConfigSettings({ ...configSettings, minAttendancePct: Number(e.target.value) })}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "12.5px", fontWeight: 600 }}>Max File Upload Size (MB)</label>
          <input
            type="number"
            value={configSettings.fileUploadLimitMb}
            onChange={e => setConfigSettings({ ...configSettings, fileUploadLimitMb: Number(e.target.value) })}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
          />
        </div>
        <button
          onClick={() => onSaveConfig(configSettings)}
          style={{ padding: "8px 20px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer", justifySelf: "flex-start" }}
        >
          Save Global Configuration
        </button>
      </div>
    </div>
  );
}
