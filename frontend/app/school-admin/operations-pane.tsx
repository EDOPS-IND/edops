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

export function OperationsPane({ organizationId }: { organizationId?: string }) {
  const [subtab, setSubtab] = useState<"transport" | "library" | "inventory" | "ptm">("transport");

  const [vehicles, setVehicles] = useState<TransportVehicle[]>(([] as any[]));

  const [books, setBooks] = useState<LibraryBook[]>(([] as any[]));

  const [assets, setAssets] = useState<SchoolAsset[]>(([] as any[]));

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
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e4e6e9", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "transport", label: "Transport Fleet & Routes (§49)" },
            { id: "library", label: "Library Circulation (§50)" },
            { id: "inventory", label: "Inventory & Assets (§51)" },
            { id: "ptm", label: "Events & PTM Desk (§47)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubtab(tab.id as any)}
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

        <button style={{ padding: "8px 16px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Plus size={15} /> Add Record
        </button>
      </div>

      {/* 1. TRANSPORT FLEET TAB (§49) */}
      {subtab === "transport" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Transport Fleet, Routes & Real-Time Tracking</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Live bus allocation, driver telephone contacts, GPS telemetry and student manifests</p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
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
      )}

      {/* 2. LIBRARY CIRCULATION TAB (§50) */}
      {subtab === "library" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Library Circulation & Catalog Desk</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Manage active book issues, overdues, student library cards, and inventory</p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
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
      )}

      {/* 3. INVENTORY & ASSETS TAB (§51) */}
      {subtab === "inventory" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>School Assets & Equipment Register</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>IT Infrastructure, science lab apparatus, smart boards and warranty tracking</p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
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
      )}

      {/* 4. EVENTS & PTM DESK (§47) */}
      {subtab === "ptm" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Parent Teacher Meeting (PTM) Desk (§47)</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Time slot booking, teacher tables, and attendance confirmation records</p>
            </div>
            <button style={{ padding: "8px 14px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
              + Schedule Next PTM Window
            </button>
          </div>

          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ color: "#0c1e33", fontSize: "14.5px" }}>PTM schedules</b>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                  See saved meeting schedules
                </div>
              </div>
              <span style={{ background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                Meeting availability is based on saved bookings
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
