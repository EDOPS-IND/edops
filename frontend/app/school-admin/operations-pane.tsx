"use client";

import React, { useState, useEffect } from "react";
import { TransportVehicle, LibraryBook, SchoolAsset } from "./types";
import { getSchoolAdminOperations } from "../edops-api";
import {
  Bus,
  BookMarked,
  PackageCheck,
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
} from "lucide-react";

export function OperationsPane({
  organizationId,
  activeTab,
  onTabChange,
}: {
  organizationId?: string;
  activeTab?: "transport" | "library" | "inventory" | "ptm";
  onTabChange?: (tab: "transport" | "library" | "inventory" | "ptm") => void;
}) {
  const [subtab, setSubtab] = useState<"transport" | "library" | "inventory" | "ptm">(activeTab || "transport");

  useEffect(() => {
    if (activeTab && activeTab !== subtab) {
      setSubtab(activeTab);
    }
  }, [activeTab]);

  const [vehicles, setVehicles] = useState<TransportVehicle[]>(([] as any[]));
  const [books, setBooks] = useState<LibraryBook[]>(([] as any[]));
  const [assets, setAssets] = useState<SchoolAsset[]>(([] as any[]));

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [ptmModalOpen, setPtmModalOpen] = useState(false);
  const [ptmSessions, setPtmSessions] = useState<any[]>([
    { id: "ptm-1", title: "Term 1 Academic Progress PTM", date: "2026-11-15", time: "09:00 AM - 01:00 PM", grades: "All Classes (Grades 1-12)", status: "Scheduled" },
  ]);

  const [transportForm, setTransportForm] = useState({ busNo: "", route: "", driverName: "", driverPhone: "", capacity: "40" });
  const [libraryForm, setLibraryForm] = useState({ isbn: "", title: "", author: "", category: "General", totalCopies: "10" });
  const [inventoryForm, setInventoryForm] = useState({ assetId: "", name: "", category: "IT / Electronics", location: "Main Campus", condition: "Good" });
  const [ptmForm, setPtmForm] = useState({ title: "", date: "", time: "09:00 AM - 01:00 PM", grades: "All Classes" });

  useEffect(() => {
    if (!organizationId) return;
    getSchoolAdminOperations(organizationId)
      .then((data) => {
        if (data?.fleet && Array.isArray(data.fleet) && data.fleet.length > 0) {
          setVehicles(
            data.fleet.map((v: any) => ({
              id: v.id,
              busNo: v.vehicle_number,
              route: v.route_name,
              driverName: v.driver_name,
              driverPhone: v.driver_phone,
              capacity: v.capacity,
              enrolledStudents: v.students_assigned,
              currentStatus: v.status === "on_route" ? "On Route" : "At School",
            }))
          );
        }
        if (data?.library && Array.isArray(data.library) && data.library.length > 0) {
          setBooks(
            data.library.map((b: any) => ({
              id: b.id,
              isbn: b.isbn,
              title: b.title,
              author: b.author,
              category: b.category,
              totalCopies: b.total_copies,
              issuedCopies: b.issued_copies,
            }))
          );
        }
        if (data?.assets && Array.isArray(data.assets) && data.assets.length > 0) {
          setAssets(
            data.assets.map((a: any) => ({
              id: a.id,
              assetId: a.asset_code,
              category: a.category,
              name: a.name,
              location: a.location,
              condition: a.condition ? (a.condition.charAt(0).toUpperCase() + a.condition.slice(1)) : "Good",
              assignedTo: a.custodian_name || "Faculty",
              purchaseDate: "2024-01-01",
              value: Number(a.purchase_cost || 0),
              warrantyUntil: "Active",
            }))
          );
        }
      })
      .catch(() => {});
  }, [organizationId]);

  return (
    <div className="edops-operations-pane" style={{ display: "grid", gap: "20px" }}>
      {/* Top 4 Pastel Metric Cards (Strictly 148px) */}
      <section className="edops-operations-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {/* 1. Fleet Vehicles (Pastel Violet) */}
        <article
          onClick={() => {
            setSubtab("transport");
            if (onTabChange) onTabChange("transport");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#e1d2ff",
            border: "1px solid #e1d2ff",
            borderRadius: "10px",
            color: "#4a0e8f",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Bus Fleet
            </span>
            <Bus size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
            {vehicles.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Covering all campus routes</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Transit</span>
          </div>
        </article>

        {/* 2. Library Circulation (Pastel Mint) */}
        <article
          onClick={() => {
            setSubtab("library");
            if (onTabChange) onTabChange("library");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ccefbf",
            border: "1px solid #ccefbf",
            borderRadius: "10px",
            color: "#1a5c0a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Library Titles
            </span>
            <BookMarked size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
            {books.reduce((acc, b) => acc + (b.totalCopies || 0), 0)}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Across {books.length} cataloged subjects</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Catalog</span>
          </div>
        </article>

        {/* 3. Tracked Assets (Pastel Sky) */}
        <article
          onClick={() => {
            setSubtab("inventory");
            if (onTabChange) onTabChange("inventory");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#bae5f5",
            border: "1px solid #bae5f5",
            borderRadius: "10px",
            color: "#0a5a7a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Campus Assets
            </span>
            <PackageCheck size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            {assets.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Laboratory, sports &amp; IT inventory</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Assets</span>
          </div>
        </article>

        {/* 4. Events & PTM (Pastel Coral) */}
        <article
          onClick={() => {
            setSubtab("ptm");
            if (onTabChange) onTabChange("ptm");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ffd8c7",
            border: "1px solid #ffd8c7",
            borderRadius: "10px",
            color: "#782a00",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              PTM Sessions
            </span>
            <CalendarDays size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#782a00" }}>
            Active
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Parent appointment slots open</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Events</span>
          </div>
        </article>
      </section>

      {/* Subtab Bar */}
      <div className="edops-operations-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e4e6e9", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div className="edops-operations-tabs" style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "transport", label: "Transport Fleet & Routes" },
            { id: "library", label: "Library Circulation" },
            { id: "inventory", label: "Inventory & Assets" },
            { id: "ptm", label: "Events & PTM Desk" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSubtab(tab.id as any);
                if (onTabChange) onTabChange(tab.id as any);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 700 : 500,
                background: subtab === tab.id ? "#0c1e33" : "transparent",
                color: subtab === tab.id ? "#ffffff" : "#4a5568",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            if (subtab === "ptm") {
              setPtmModalOpen(true);
            } else {
              setRecordModalOpen(true);
            }
          }}
          className="edops-operations-action"
          style={{ padding: "8px 16px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={15} /> Add Record
        </button>
      </div>

      {/* 1. TRANSPORT FLEET TAB */}
      {subtab === "transport" && (
        <div className="edops-operations-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Transport Fleet, Routes & Real-Time Tracking</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Live bus allocation, driver telephone contacts, GPS telemetry and student manifests</p>

          <div className="edops-operations-table" style={{ overflowX: "auto" }}>
          <table className="edops-operations-grid" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Bus No & Model</th>
                <th style={{ padding: "10px" }}>Route Details</th>
                <th style={{ padding: "10px" }}>Driver & Phone</th>
                <th style={{ padding: "10px" }}>Enrolled / Capacity</th>
                <th style={{ padding: "10px" }}>Fleet Status</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b style={{ color: "#0c1e33" }}>{v.busNo}</b>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <b style={{ color: "#0c1e33" }}>{v.route}</b>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <div>{v.driverName}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{v.driverPhone}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{v.enrolledStudents} / {v.capacity}</b>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                      background: v.currentStatus === "At School" ? "#ECFDF5" : "#FEF3C7",
                      color: v.currentStatus === "At School" ? "#047857" : "#92400E",
                    }}>
                      {v.currentStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>
                    <button style={{ padding: "4px 8px", background: "#f8fafc", border: "1px solid #e4e6e9", color: "#0c1e33", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                      Passenger List
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* 2. LIBRARY CIRCULATION TAB */}
      {subtab === "library" && (
        <div className="edops-operations-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Library Circulation & Catalog Desk</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Manage active book issues, overdues, student library cards, and inventory</p>

          <div className="edops-operations-table" style={{ overflowX: "auto" }}>
          <table className="edops-operations-grid" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Book Title</th>
                <th style={{ padding: "10px" }}>Author & ISBN</th>
                <th style={{ padding: "10px" }}>Category</th>
                <th style={{ padding: "10px" }}>Copies (Total / Issued)</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b style={{ color: "#0c1e33" }}>{b.title}</b>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <div>{b.author}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>ISBN: {b.isbn}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>{b.category}</td>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{b.issuedCopies} issued</b> out of {b.totalCopies}
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>
                    <button style={{ padding: "4px 8px", background: "#f8fafc", border: "1px solid #e4e6e9", color: "#0c1e33", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                      Issue / Return
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* 3. INVENTORY & ASSETS TAB */}
      {subtab === "inventory" && (
        <div className="edops-operations-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>School Assets & Equipment Register</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>IT Infrastructure, science lab apparatus, smart boards and warranty tracking</p>

          <div className="edops-operations-table" style={{ overflowX: "auto" }}>
          <table className="edops-operations-grid" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Asset ID & Item Name</th>
                <th style={{ padding: "10px" }}>Category & Location</th>
                <th style={{ padding: "10px" }}>Assigned Custodian</th>
                <th style={{ padding: "10px" }}>Valuation</th>
                <th style={{ padding: "10px" }}>Condition</th>
                <th style={{ padding: "10px" }}>Warranty</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b style={{ color: "#0c1e33" }}>{a.name}</b>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{a.assetId}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <div>{a.category}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{a.location}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>{a.assignedTo}</td>
                  <td style={{ padding: "12px 10px", fontWeight: 700, color: "#0c1e33" }}>
                    ₹{a.value.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                      background: a.condition === "Good" ? "#ECFDF5" : "#FEF3C7",
                      color: a.condition === "Good" ? "#047857" : "#92400E",
                    }}>
                      {a.condition}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", fontSize: "12px" }}>{a.warrantyUntil}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* 4. EVENTS & PTM DESK */}
      {subtab === "ptm" && (
        <div className="edops-operations-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Parent Teacher Meeting (PTM) Desk</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Time slot booking, teacher tables, and attendance confirmation records</p>
            </div>
            <button
              type="button"
              onClick={() => setPtmModalOpen(true)}
              style={{ padding: "8px 14px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              + Schedule Next PTM Window
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {ptmSessions.map((ptm) => (
              <div key={ptm.id} style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <b style={{ color: "#0c1e33", fontSize: "14px" }}>{ptm.title}</b>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    📅 {ptm.date} &nbsp;·&nbsp; ⏰ {ptm.time} &nbsp;·&nbsp; 👥 {ptm.grades}
                  </div>
                </div>
                <span style={{ background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                  ● {ptm.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OPERATIONS RECORD MODAL */}
      {recordModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12, 30, 51, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#FFFFFF", borderRadius: "10px", padding: "24px", maxWidth: "480px", width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0C1E33" }}>
                {subtab === "transport" ? "Add Transport Fleet Vehicle" : subtab === "library" ? "Catalog Library Book" : "Register School Asset"}
              </h3>
              <button onClick={() => setRecordModalOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748B" }}>✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (subtab === "transport") {
                if (!transportForm.busNo.trim()) return;
                setVehicles(prev => [
                  ...prev,
                  {
                    id: `vh-${Date.now()}`,
                    busNo: transportForm.busNo.trim(),
                    route: transportForm.route.trim() || "Campus Route",
                    driverName: transportForm.driverName.trim() || "Assigned Driver",
                    driverPhone: transportForm.driverPhone.trim() || "+91 98765 43210",
                    capacity: Number(transportForm.capacity) || 40,
                    enrolledStudents: 0,
                    currentStatus: "At School",
                  }
                ]);
                setTransportForm({ busNo: "", route: "", driverName: "", driverPhone: "", capacity: "40" });
              } else if (subtab === "library") {
                if (!libraryForm.title.trim()) return;
                setBooks(prev => [
                  ...prev,
                  {
                    id: `bk-${Date.now()}`,
                    isbn: libraryForm.isbn.trim() || `978-${Math.floor(100000000 + Math.random() * 900000000)}`,
                    title: libraryForm.title.trim(),
                    author: libraryForm.author.trim() || "Faculty Author",
                    category: libraryForm.category || "General",
                    totalCopies: Number(libraryForm.totalCopies) || 1,
                    issuedCopies: 0,
                  }
                ]);
                setLibraryForm({ isbn: "", title: "", author: "", category: "General", totalCopies: "10" });
              } else if (subtab === "inventory") {
                if (!inventoryForm.name.trim()) return;
                setAssets(prev => [
                  ...prev,
                  {
                    id: `as-${Date.now()}`,
                    assetId: inventoryForm.assetId.trim() || `AST-${Date.now().toString().slice(-4)}`,
                    name: inventoryForm.name.trim(),
                    category: (inventoryForm.category || "Computers & IT") as any,
                    location: inventoryForm.location.trim() || "Main Campus",
                    condition: (inventoryForm.condition || "Good") as any,
                    assignedTo: "General Inventory",
                    purchaseDate: new Date().toISOString().split("T")[0],
                    value: 0,
                    warrantyUntil: "Active",
                  }
                ]);
                setInventoryForm({ assetId: "", name: "", category: "IT / Electronics", location: "Main Campus", condition: "Good" });
              }
              setRecordModalOpen(false);
            }} style={{ display: "grid", gap: "14px" }}>

              {subtab === "transport" && (
                <>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Vehicle / Bus Number *</label>
                    <input required placeholder="e.g. Bus 14 (DL-01-AB-1234)" value={transportForm.busNo} onChange={e => setTransportForm({ ...transportForm, busNo: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Route Name / Description *</label>
                    <input required placeholder="e.g. North Sector - Downtown - Campus" value={transportForm.route} onChange={e => setTransportForm({ ...transportForm, route: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Driver Name</label>
                      <input placeholder="e.g. Ramesh Kumar" value={transportForm.driverName} onChange={e => setTransportForm({ ...transportForm, driverName: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Driver Phone</label>
                      <input placeholder="+91 9876543210" value={transportForm.driverPhone} onChange={e => setTransportForm({ ...transportForm, driverPhone: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Passenger Capacity</label>
                    <input type="number" min="1" value={transportForm.capacity} onChange={e => setTransportForm({ ...transportForm, capacity: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                  </div>
                </>
              )}

              {subtab === "library" && (
                <>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Book Title *</label>
                    <input required placeholder="e.g. Principles of Physics - Class 11" value={libraryForm.title} onChange={e => setLibraryForm({ ...libraryForm, title: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Author *</label>
                      <input required placeholder="e.g. H.C. Verma" value={libraryForm.author} onChange={e => setLibraryForm({ ...libraryForm, author: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>ISBN / Code</label>
                      <input placeholder="e.g. 978-0198526636" value={libraryForm.isbn} onChange={e => setLibraryForm({ ...libraryForm, isbn: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Category</label>
                      <select value={libraryForm.category} onChange={e => setLibraryForm({ ...libraryForm, category: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}>
                        <option value="Science">Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Literature">Literature</option>
                        <option value="Social Studies">Social Studies</option>
                        <option value="Reference">Reference</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Total Copies</label>
                      <input type="number" min="1" value={libraryForm.totalCopies} onChange={e => setLibraryForm({ ...libraryForm, totalCopies: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                    </div>
                  </div>
                </>
              )}

              {subtab === "inventory" && (
                <>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Asset Name *</label>
                    <input required placeholder="e.g. Dell OptiPlex Desktop PC" value={inventoryForm.name} onChange={e => setInventoryForm({ ...inventoryForm, name: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Asset Code / ID</label>
                      <input placeholder="e.g. IT-LAB1-024" value={inventoryForm.assetId} onChange={e => setInventoryForm({ ...inventoryForm, assetId: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Category</label>
                      <select value={inventoryForm.category} onChange={e => setInventoryForm({ ...inventoryForm, category: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}>
                        <option value="IT / Electronics">IT / Electronics</option>
                        <option value="Laboratory Equipment">Laboratory Equipment</option>
                        <option value="Sports">Sports</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Musical Instruments">Musical Instruments</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Location</label>
                      <input placeholder="e.g. Computer Lab 2" value={inventoryForm.location} onChange={e => setInventoryForm({ ...inventoryForm, location: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Physical Condition</label>
                      <select value={inventoryForm.condition} onChange={e => setInventoryForm({ ...inventoryForm, condition: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }}>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Needs Maintenance">Needs Maintenance</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button type="submit" style={{ flex: 1, padding: "10px", background: "#0C1E33", color: "#FFFFFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Save Record</button>
                <button type="button" onClick={() => setRecordModalOpen(false)} style={{ padding: "10px 16px", background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE PTM WINDOW MODAL */}
      {ptmModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12, 30, 51, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#FFFFFF", borderRadius: "10px", padding: "24px", maxWidth: "480px", width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0C1E33" }}>Schedule PTM Window</h3>
              <button onClick={() => setPtmModalOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748B" }}>✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!ptmForm.title.trim()) return;
              setPtmSessions(prev => [
                ...prev,
                {
                  id: `ptm-${Date.now()}`,
                  title: ptmForm.title.trim(),
                  date: ptmForm.date || new Date().toISOString().split("T")[0],
                  time: ptmForm.time || "09:00 AM - 01:00 PM",
                  grades: ptmForm.grades || "All Classes",
                  status: "Scheduled",
                }
              ]);
              setPtmForm({ title: "", date: "", time: "09:00 AM - 01:00 PM", grades: "All Classes" });
              setPtmModalOpen(false);
            }} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>PTM Session Title *</label>
                <input required placeholder="e.g. Mid-Term Parent-Teacher Meeting" value={ptmForm.title} onChange={e => setPtmForm({ ...ptmForm, title: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Meeting Date *</label>
                  <input required type="date" value={ptmForm.date} onChange={e => setPtmForm({ ...ptmForm, date: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Time Window</label>
                  <input placeholder="09:00 AM - 01:00 PM" value={ptmForm.time} onChange={e => setPtmForm({ ...ptmForm, time: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", display: "block", marginBottom: "4px" }}>Participating Classes / Grades</label>
                <input placeholder="e.g. Grades 1-12 or Class 10 & 12" value={ptmForm.grades} onChange={e => setPtmForm({ ...ptmForm, grades: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button type="submit" style={{ flex: 1, padding: "10px", background: "#0C1E33", color: "#FFFFFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Save PTM Window</button>
                <button type="button" onClick={() => setPtmModalOpen(false)} style={{ padding: "10px 16px", background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
