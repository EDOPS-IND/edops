import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("School Admin Student 360 view has active Send Attendance Warning to Parent buttons and modal", async () => {
  const peoplePaneSource = await readFile(
    new URL("../app/school-admin/people-pane.tsx", import.meta.url),
    "utf8"
  );

  // 1. Verify buttons exist in all key 360 view sections
  assert.match(
    peoplePaneSource,
    /id="btn-send-attendance-warning-attendance-tab"/,
    "Attendance tab must have the Send Attendance Warning to Parent button"
  );
  assert.match(
    peoplePaneSource,
    /id="btn-send-attendance-warning-primary-parent"/,
    "Parents tab Primary Guardian card must have the Send Attendance Warning to Parent button"
  );
  assert.match(
    peoplePaneSource,
    /id=\{`btn-send-attendance-warning-parent-\$\{p\.id\}`\}/,
    "Parents tab Linked Parent cards must have individual Send Attendance Warning buttons"
  );
  assert.match(
    peoplePaneSource,
    /id="btn-header-send-attendance-warning"/,
    "360 Drawer header must have the below-75% Defaulter warning button"
  );

  // 2. Verify modal structure and dispatch button
  assert.match(
    peoplePaneSource,
    /Send Attendance Warning to Parent/,
    "Modal header must state Send Attendance Warning to Parent"
  );
  assert.match(
    peoplePaneSource,
    /id="btn-confirm-dispatch-attendance-warning"/,
    "Modal must contain the confirmed dispatch button"
  );

  // 3. Verify zero hardcoding & dynamic multi-channel dispatch
  assert.match(
    peoplePaneSource,
    /createSchoolAdminBroadcast\(organizationId, \{/,
    "Must trigger school broadcast notice to parent audience"
  );
  assert.match(
    peoplePaneSource,
    /createSchoolAdminDiscipline\(organizationId, \{/,
    "Must record official disciplinary/governance warning incident"
  );
  assert.match(
    peoplePaneSource,
    /sendCommunicationMessage\(organizationId, \{/,
    "Must send direct communication message when parent user account exists"
  );
  assert.match(
    peoplePaneSource,
    /getSchoolAdminStudent360\(organizationId, selectedStudent\.id\)/,
    "Must refresh the student 360 dossier live after dispatching warning"
  );

  // 4. Verify dynamic calculations (no hardcoded attendance values or parent names)
  assert.match(
    peoplePaneSource,
    /student360Dossier\?\.attendance\?\.overallPercentage \?\?/,
    "Attendance percentage must dynamically pull from live dossier and student record"
  );
  assert.match(
    peoplePaneSource,
    /availableWarningParents = useMemo\(/,
    "Available parents must resolve dynamically from student parents and primary guardian"
  );
  assert.match(
    peoplePaneSource,
    /CBSE/,
    "Statutory CBSE 75% rule benchmark must be explicitly referenced in notice"
  );
});

test("AttendanceLeavePane defaulters desk has active Send Attendance Warning to Parent button", async () => {
  const attendancePaneSource = await readFile(
    new URL("../app/school-admin/attendance-leave-pane.tsx", import.meta.url),
    "utf8"
  );

  assert.match(
    attendancePaneSource,
    /Send Attendance Warning to Parent/,
    "Defaulters desk must have Send Attendance Warning to Parent button"
  );
  assert.match(
    attendancePaneSource,
    /onClick=\{.*handleSendDefaulterWarning\(st\)\}/,
    "Button must be wired to handleSendDefaulterWarning"
  );
  assert.match(
    attendancePaneSource,
    /createSchoolAdminBroadcast\(organizationId, \{/,
    "Defaulters warning must dispatch via broadcast notices"
  );
  assert.match(
    attendancePaneSource,
    /createSchoolAdminDiscipline\(organizationId, \{/,
    "Defaulters warning must log official disciplinary record"
  );
});

test("ClassCommandCenter inline Student 360 has active Send Attendance Warning to Parent button", async () => {
  const cccSource = await readFile(
    new URL("../app/components/class-command-center.tsx", import.meta.url),
    "utf8"
  );

  assert.match(
    cccSource,
    /Send Attendance Warning to Parent/,
    "ClassCommandCenter student 360 must have Send Attendance Warning to Parent button"
  );
  assert.match(
    cccSource,
    /onClick=\{handleSendAttendanceWarning\}/,
    "Button must be wired to handleSendAttendanceWarning"
  );
  assert.match(
    cccSource,
    /createSchoolAdminBroadcast\(organizationId, \{/,
    "Command center warning must dispatch via broadcast notices"
  );
});
