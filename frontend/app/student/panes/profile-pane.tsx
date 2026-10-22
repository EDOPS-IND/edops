'use client';

import React, { useState, useEffect } from 'react';
import { api, logout, getStudentAvatarUrl, updateStudentProfile } from '../../edops-api';
import { ShieldCheck, FileText, Download, Award, LogOut, Phone, Calendar, Key, AlertCircle, Laptop, Edit2, MapPin, X, Check } from 'lucide-react';

interface ProfilePaneProps {
  organizationId: string;
  onLogout?: () => void;
}

export const ProfilePane: React.FC<ProfilePaneProps> = ({ organizationId, onLogout }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpenEdit = () => {
    if (student) {
      setBloodGroup(student.bloodGroup || 'O+');
      setAddress(student.address || '');
      setPhone(student.phone || '');
      setEmergencyContact(student.emergencyContact || '');
      setGender(student.gender || 'Male');
      setDob(student.dob ? String(student.dob).split('T')[0] : '');
    }
    setEditing(true);
    setSaveSuccess(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateStudentProfile(organizationId, {
        bloodGroup,
        address,
        phone,
        emergencyContact,
        gender,
        dob,
      });
      setData(updated);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update student profile:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setData(null);
    setLoading(true);
    api<any>(`/organizations/${organizationId}/student/profile`)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [organizationId]);

  const student = data?.student;
  const documents: any[] = data?.documents || [];

  if (loading) {
    return (
      <div
        className="p-10 text-center text-[#495d72] bg-white rounded-[10px] border border-[#e4e6e9] animate-pulse"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Loading student profile &amp; credentials vault...
      </div>
    );
  }

  const studentName = student?.name || student?.email || 'Student';
  const avatarUrl =
    student?.avatarUrl ||
    getStudentAvatarUrl(studentName, student?.email);

  const handleLogoutAction = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      try {
        await logout();
      } catch {}
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header Row */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] mb-1">
          Student Identity &amp; Credential Vault
        </div>
        <h2 className="text-[18px] font-semibold text-[#0c1e33] tracking-tight">
          Student Profile &amp; Account Settings
        </h2>
        <p className="text-[13px] text-[#495d72] mt-0.5" style={{ lineHeight: '1.5' }}>
          Official CBSE student credentials, institutional enrolment, academic records, and security controls.
        </p>
      </div>

      {/* Hero Identity Card */}
      <div className="bg-white rounded-[10px] border border-[#e4e6e9] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e4e6e9] gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[10px] overflow-hidden shrink-0 border border-[#ced8e5] bg-[#f5f6f8]">
              <img
                src={avatarUrl}
                alt={studentName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-[17px] font-semibold text-[#0c1e33]">{studentName}</h3>
                <span className="px-2.5 py-0.5 rounded-[100px] bg-[#d9eed1] text-[#1a5c0a] text-[10px] font-semibold capitalize">
                  {student?.status ? `${student.status} Scholar` : 'Active Scholar'}
                </span>
              </div>
              <p className="text-[12px] text-[#495d72] mt-0.5">
                Admission No: <strong className="text-[#0c1e33]">{student?.admissionNo || 'Not Assigned'}</strong> &bull; Roll No: <strong className="text-[#0c1e33]">{student?.rollNo || 'Not Assigned'}</strong> &bull; Class: <strong className="text-[#0c1e33]">{student?.classSection || 'Not Enrolled'}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="text-[12px] font-semibold text-[#ffffff] flex items-center gap-1.5 bg-[#0c1e33] hover:bg-[#132840] px-3.5 py-1.5 rounded-[8px] transition-colors cursor-pointer border-none"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Update Profile</span>
            </button>
            <div className="text-[12px] font-semibold text-[#0c1e33] flex items-center gap-2 bg-[#f5f6f8] px-3.5 py-1.5 rounded-[100px] border border-[#ced8e5]">
              <ShieldCheck className="w-4 h-4 text-[#1a5c0a]" />
              <span>Verified Student Dossier</span>
            </div>
          </div>
        </div>

        {/* Primary Institutional Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-[6px] bg-[#f5f6f8] border border-[#e4e6e9]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] block">
              Academic Year
            </span>
            <span className="font-semibold text-[#0c1e33] text-[13px] mt-1 block">
              {student?.academicYear || 'Active Session'}
            </span>
            <span className="text-[11px] text-[#495d72] block mt-0.5">
              {student?.status === 'active' ? 'Active Enrolment' : (student?.status || 'Active Enrolment')}
            </span>
          </div>

          <div className="p-3.5 rounded-[6px] bg-[#f5f6f8] border border-[#e4e6e9]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] block">
              Enrolled Class
            </span>
            <span className="font-semibold text-[#0c1e33] text-[13px] mt-1 block">
              {student?.classSection ? `Class ${student.classSection}` : 'Not Enrolled'}
            </span>
            <span className="text-[11px] text-[#495d72] block mt-0.5">
              {student?.category || 'Secondary Program'}
            </span>
          </div>

          <div className="p-3.5 rounded-[6px] bg-[#f5f6f8] border border-[#e4e6e9]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] block">
              Class Teacher
            </span>
            <span className="font-semibold text-[#0c1e33] text-[13px] mt-1 block">
              {student?.classTeacher || 'Not Assigned'}
            </span>
            <span className="text-[11px] text-[#495d72] block mt-0.5">Faculty Lead</span>
          </div>

          <div className="p-3.5 rounded-[6px] bg-[#f5f6f8] border border-[#e4e6e9]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] block">
              Cadre &amp; Category
            </span>
            <span className="font-semibold text-[#0c1e33] text-[13px] mt-1 block">
              {student?.house || (student?.category ? `${student.category} Cadre` : 'General Cadre')}
            </span>
            <span className="text-[11px] text-[#495d72] block mt-0.5">
              {student?.gender || 'Student Profile'}
            </span>
          </div>
        </div>

        {/* Secondary Info & Guardian Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-[6px] bg-white border border-[#e4e6e9] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#495d72]" /> Date of Birth &amp; Blood
            </span>
            <p className="text-[12px] font-semibold text-[#0c1e33] mt-1">
              {student?.dob ? String(student.dob).split('T')[0] : 'Not Recorded'} &bull; Blood: <strong className="text-[#0c1e33]">{student?.bloodGroup || 'Not Recorded'}</strong>
            </p>
          </div>

          <div className="p-3.5 rounded-[6px] bg-white border border-[#e4e6e9] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#495d72]" /> Residential Address
            </span>
            <p className="text-[12px] font-semibold text-[#0c1e33] mt-1 truncate" title={student?.address || 'Not Recorded'}>
              {student?.address || 'Not Recorded'}
            </p>
          </div>

          <div className="p-3.5 rounded-[6px] bg-white border border-[#e4e6e9] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#495d72]" /> Primary Phone
            </span>
            <p className="text-[12px] font-semibold text-[#0c1e33] mt-1">
              {student?.phone || 'No Phone'}
            </p>
          </div>

          <div className="p-3.5 rounded-[6px] bg-white border border-[#e4e6e9] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#495d72]" /> Registered Student Email
            </span>
            <p className="text-[12px] font-semibold text-[#0c1e33] mt-1 truncate" title={student?.email}>
              {student?.email || 'No email registered'}
            </p>
          </div>
        </div>
      </div>

      {/* Academic Documents Vault */}
      <div className="bg-white rounded-[10px] border border-[#e4e6e9] overflow-hidden">
        <div className="p-4 border-b border-[#e4e6e9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0c1e33]" />
            <h3 className="text-[14px] font-semibold text-[#0c1e33]">
              Official Academic Documents &amp; Transcripts
            </h3>
          </div>
          <span className="text-[11px] font-medium text-[#495d72] px-2.5 py-0.5 rounded-[100px] bg-[#f5f6f8] border border-[#e4e6e9]">
            Read-Only Vault
          </span>
        </div>

        <div className="divide-y divide-[#e4e6e9]">
          {documents.length > 0 ? (
            documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f5f6f8] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-[36px] h-[36px] rounded-[8px] bg-[#f5f6f8] border border-[#ced8e5] text-[#0c1e33] flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#0c1e33]">{doc.title}</h4>
                    <p className="text-[11px] text-[#495d72] mt-0.5">
                      {doc.type} &bull; {doc.size} &bull; Issued on {doc.date}
                    </p>
                    <p className="text-[10px] text-[#495d72] mt-0.5">Certified: {doc.verifiedBy}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Accessing official record: ${doc.title}`)}
                  className="h-[32px] px-3.5 rounded-[6px] bg-white border border-[#ced8e5] hover:bg-[#f5f6f8] text-[#0c1e33] text-[12px] font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5 text-[#495d72]" />
                  <span>Download</span>
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[#495d72] text-[13px]">
              <FileText className="w-8 h-8 text-[#ced8e5] mx-auto mb-2" />
              <p className="font-semibold text-[#0c1e33]">No Official Documents Uploaded</p>
              <p className="text-[12px] text-[#495d72] mt-1">
                Official CBSE consolidated grade sheets, merit certificates, and attestations will appear here once published by school administration.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account Security & Session Management (Bottom Card) */}
      <div className="bg-white rounded-[10px] border border-[#e4e6e9] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Laptop size={16} strokeWidth={1.75} className="text-[#0c1e33]" />
              <h3 className="text-[14px] font-semibold text-[#0c1e33]">
                Account Security &amp; Session Management
              </h3>
            </div>
            <p className="text-[12px] text-[#495d72]">
              Active browser session on this device. Sign out when using shared campus laboratory workstations.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-[#495d72]">
              <span className="inline-flex items-center gap-1 text-[#1a5c0a] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a5c0a]" /> Two-Factor Enrolment Verified
              </span>
              <span>&bull;</span>
              <span>Password updated recently</span>
            </div>
          </div>

          <div className="shrink-0">
            {showLogoutConfirm ? (
              <div className="flex items-center gap-2 bg-[#fff1f2] border border-[#fecdd3] p-1.5 rounded-[6px]">
                <span className="text-[12px] font-medium text-[#9f1239] px-2">Log out now?</span>
                <button
                  type="button"
                  onClick={handleLogoutAction}
                  className="h-[32px] px-3.5 rounded-[4px] bg-[#e11d48] text-white text-[12px] font-semibold hover:bg-[#be123c] transition-colors"
                >
                  Yes, Log Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="h-[32px] px-3 rounded-[4px] bg-white border border-[#ced8e5] text-[#0c1e33] text-[12px] font-semibold hover:bg-[#f5f6f8] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="h-[36px] px-4 rounded-[6px] bg-[#fff1f2] border border-[#fecdd3] hover:bg-[#ffe4e6] text-[#e11d48] text-[12px] font-semibold flex items-center gap-2 transition-colors"
              >
                <LogOut size={15} strokeWidth={1.75} />
                <span>Log Out of Student Account</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "520px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(12, 30, 51, 0.2)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E6E9", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0c1e33" }}>Update Profile Details</h3>
                <span style={{ fontSize: "12px", color: "#495D72" }}>Personal identity, blood group &amp; residential contact</span>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{ all: "unset", cursor: "pointer", width: "28px", height: "28px", borderRadius: "50%", background: "#F4F6F7", display: "flex", alignItems: "center", justifyContent: "center", color: "#495D72" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  Blood Group
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D0D5DD", fontSize: "13px", outline: "none", color: "#101828", background: "#FFFFFF" }}
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  Gender
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D0D5DD", fontSize: "13px", outline: "none", color: "#101828", background: "#FFFFFF" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  Date of Birth
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #D0D5DD", fontSize: "13px", outline: "none", color: "#101828", background: "#FFFFFF" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                  Primary Contact Phone
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D0D5DD", fontSize: "13px", outline: "none", color: "#101828", background: "#FFFFFF" }}
                  />
                </label>
              </div>

              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                Emergency Phone Number
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D0D5DD", fontSize: "13px", outline: "none", color: "#101828", background: "#FFFFFF" }}
                />
              </label>

              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#344054" }}>
                Residential Address
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / Flat No, Street, Landmark, City, State, PIN"
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D0D5DD", fontSize: "13px", outline: "none", color: "#101828", background: "#FFFFFF", resize: "vertical" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px", paddingTop: "12px", borderTop: "1px solid #E4E6E9" }}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #D0D5DD", background: "#FFFFFF", fontSize: "12.5px", fontWeight: 600, color: "#344054", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#0c1e33", fontSize: "12.5px", fontWeight: 600, color: "#FFFFFF", cursor: "pointer", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
