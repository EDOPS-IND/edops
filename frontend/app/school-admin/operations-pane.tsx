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

  const [vehicles, setVehicles] = useState<TransportVehicle[]>([
    { id: "v-1", busNo: "DL-1VA-4401", route: "Route 1: Vasant Kunj → Saket → School", driverName: "Mahesh Singh", driverPhone: "+91 98123 45678", capacity: 42, enrolledStudents: 40, currentStatus: "At School" },
    { id: "v-2", busNo: "DL-1VA-4402", route: "Route 2: Dwarka Sector 6 → Janakpuri → School", driverName: "Rakesh Yadav", driverPhone: "+91 98234 56789", capacity: 42, enrolledStudents: 41, currentStatus: "At School" },
    { id: "v-3", busNo: "DL-1VA-4403", route: "Route 3: Noida Sector 62 → Mayur Vihar → School", driverName: "Satish Kumar", driverPhone: "+91 98345 67890", capacity: 35, enrolledStudents: 32, currentStatus: "At School" },
    { id: "v-4", busNo: "DL-1VA-4404", route: "Route 4: Defence Colony → Lajpat Nagar → School", driverName: "Hari Om", driverPhone: "+91 98456 78901", capacity: 42, enrolledStudents: 38, currentStatus: "On Route" },
  ]);

  const [books, setBooks] = useState<LibraryBook[]>([
    { id: "b-1", isbn: "978-0143452678", title: "Wings of Fire", author: "Dr. A.P.J. Abdul Kalam", category: "Biography / Science", totalCopies: 12, issuedCopies: 10 },
    { id: "b-2", isbn: "978-0199535569", title: "Great Expectations", author: "Charles Dickens", category: "English Literature", totalCopies: 25, issuedCopies: 18 },
    { id: "b-3", isbn: "978-9352923450", title: "NCERT Exemplar Mathematics X", author: "NCERT Editorial", category: "Academic Reference", totalCopies: 30, issuedCopies: 28 },
  ]);

  const [assets, setAssets] = useState<SchoolAsset[]>([
    { id: "a-1", assetId: "IT-DESK-042", category: "Computers & IT", name: "Dell OptiPlex 7090 Desktop (Computer Lab 1)", location: "IT Tower Lab 1", condition: "Good", assignedTo: "Kunal Mehra (HOD IT)", purchaseDate: "2023-08-15", value: 52000, warrantyUntil: "2026-08-15" },
    { id: "a-2", assetId: "AV-PROJ-012", category: "Audio Visual", name: "Epson 4K Laser Projector (Auditorium)", location: "Main Auditorium", condition: "Good", assignedTo: "AV Team", purchaseDate: "2024-02-10", value: 145000, warrantyUntil: "2027-02-10" },
    { id: "a-3", assetId: "SCI-MIC-088", category: "Lab Equipment", name: "Olympus Binocular Microscope (x1000)", location: "Biology Lab", condition: "Needs Maintenance", assignedTo: "Biology Faculty", purchaseDate: "2022-11-20", value: 38000, warrantyUntil: "Expired" },
  ]);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
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
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 750 : 600,
                background: subtab === tab.id ? "#064E3B" : "transparent",
                color: subtab === tab.id ? "#F8E7C9" : "#064E3B",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button style={{ padding: "8px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Plus size={15} /> Add Record
        </button>
      </div>

      {/* 1. TRANSPORT FLEET TAB (§49) */}
      {subtab === "transport" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Transport Fleet, Routes & Real-Time Tracking</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Live bus allocation, driver telephone contacts, GPS telemetry and student manifests</p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
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
                <tr key={v.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{v.busNo}</b>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{v.route}</b>
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
                      color: v.currentStatus === "At School" ? "#064E3B" : "#92400E",
                    }}>
                      {v.currentStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>
                    <button style={{ padding: "4px 8px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#064E3B", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
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
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Library Circulation & Catalog Desk</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Manage active book issues, overdues, student library cards, and inventory</p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Book Title</th>
                <th style={{ padding: "10px" }}>Author & ISBN</th>
                <th style={{ padding: "10px" }}>Category</th>
                <th style={{ padding: "10px" }}>Copies (Total / Issued)</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{b.title}</b>
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
                    <button style={{ padding: "4px 8px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#064E3B", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
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
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>School Assets & Equipment Register</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>IT Infrastructure, science lab apparatus, smart boards and warranty tracking</p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
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
                <tr key={a.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{a.name}</b>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{a.assetId}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <div>{a.category}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{a.location}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>{a.assignedTo}</td>
                  <td style={{ padding: "12px 10px", fontWeight: 700, color: "#064E3B" }}>
                    ₹{a.value.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                      background: a.condition === "Good" ? "#ECFDF5" : "#FEF3C7",
                      color: a.condition === "Good" ? "#064E3B" : "#92400E",
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
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Parent Teacher Meeting (PTM) Desk (§47)</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Time slot booking, teacher tables, and attendance confirmation records</p>
            </div>
            <button style={{ padding: "8px 14px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
              + Schedule Next PTM Window
            </button>
          </div>

          <div style={{ padding: "16px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ color: "#064E3B", fontSize: "14.5px" }}>Mid-Term PTM Session (Oct 15, 2026)</b>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                  Schedule: 09:00 AM – 01:30 PM · 32 Class Teacher Desks in Main Academic Hall
                </div>
              </div>
              <span style={{ background: "#ECFDF5", color: "#064E3B", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                1,420 Slots Configured (84% Booked)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
