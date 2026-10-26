import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("CommunicationChat helper functions format roles, initials, and dates accurately", async () => {
  const source = await readFile(new URL("../app/components/communication-chat.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });

  const module = { exports: {} };
  const requireShim = (name) => {
    if (name === "react") return require("react");
    if (name === "react/jsx-runtime") return require("react/jsx-runtime");
    if (name === "lucide-react") return require("lucide-react");
    if (name === "../edops-api") return {};
    return {};
  };

  new Function("require", "module", "exports", outputText)(requireShim, module, module.exports);
  const { getRoleMeta, getInitials, formatSidebarTime, formatMessageTime, formatDividerDate } = module.exports;

  // Role Meta
  assert.equal(getRoleMeta("teacher").label, "Teacher");
  assert.equal(getRoleMeta("teacher").bg, "#d0e6ff");
  assert.equal(getRoleMeta("student").label, "Student");
  assert.equal(getRoleMeta("parent").label, "Parent");
  assert.equal(getRoleMeta("principal").label, "Principal");
  assert.equal(getRoleMeta("school_admin").label, "Admin");
  assert.equal(getRoleMeta("staff").label, "Staff");

  // Initials
  assert.equal(getInitials("John Doe"), "JD");
  assert.equal(getInitials("Alice"), "AL");
  assert.equal(getInitials("Dr. Martin Luther King"), "DK");
  assert.equal(getInitials(""), "•");

  // Formatted date
  const now = new Date();
  assert.equal(formatDividerDate(now.toISOString()), "Today");
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  assert.equal(formatDividerDate(yesterday.toISOString()), "Yesterday");
  assert.equal(formatSidebarTime(yesterday.toISOString()), "Yesterday");
});

test("CommunicationChat renders complete accessible interface in empty and active states", async () => {
  const source = await readFile(new URL("../app/components/communication-chat.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });

  const module = { exports: {} };
  const requireShim = (name) => {
    if (name === "react") return require("react");
    if (name === "react/jsx-runtime") return require("react/jsx-runtime");
    if (name === "lucide-react") return require("lucide-react");
    if (name === "../edops-api") {
      return {
        getCommunicationConversations: async () => [],
        getCommunicationConversation: async () => [],
        getCommunicationRecipients: async () => [],
        markCommunicationRead: async () => {},
        openCommunicationStream: () => () => {},
        sendCommunicationMessage: async () => {},
      };
    }
    return {};
  };

  new Function("require", "module", "exports", outputText)(requireShim, module, module.exports);
  const { CommunicationChat } = module.exports;

  const html = renderToStaticMarkup(createElement(CommunicationChat, {
    organizationId: "test-org-123",
    title: "Direct Messages",
  }));

  // Structure and hierarchy assertions
  assert.match(html, /Direct Messages/);
  assert.match(html, /New Chat/);
  assert.match(html, /Search conversations\.\.\./);
  assert.match(html, /aria-label="Search conversations or members"/);
  assert.match(html, /aria-label="Filter conversations by role"/);
  assert.match(html, /Teachers/);
  assert.match(html, /Students/);
  assert.match(html, /Parents/);
  assert.match(html, /Direct Messages Desk/);
  assert.match(html, /Start New Conversation/);
  assert.match(html, /edops-chat-textarea/);
  assert.match(html, /aria-label="Write direct message"/);
  assert.match(html, /aria-label="Send message"/);
  assert.match(html, /Press <strong[^>]*>Enter ↵<\/strong> to send · <strong[^>]*>Shift \+ Enter<\/strong> for new line/);
  assert.doesNotMatch(html, /💬/); // Replaced raw emoji with professional SVG icons
});

test("Verification Item 1: Switching between Student, Principal, and Teacher displays only each conversation's own messages", async () => {
  const source = await readFile(new URL("../app/components/communication-chat.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });

  const mockConversations = [
    {
      conversationId: "conv-student",
      participantId: "student-101",
      participantName: "Aryan Student",
      participantEmail: "aryan@school.org",
      participantRole: "student",
      subject: "Math Homework Doubt",
      preview: "I have a question on quadratic formulas.",
      unreadCount: 0,
      lastMessageAt: new Date().toISOString(),
    },
    {
      conversationId: "conv-principal",
      participantId: "principal-201",
      participantName: "Dr. Alistair Principal",
      participantEmail: "principal@school.org",
      participantRole: "principal",
      subject: "Annual Board Review",
      preview: "Please submit your self-assessment by Friday.",
      unreadCount: 0,
      lastMessageAt: new Date().toISOString(),
    },
  ];

  const studentMessages = [
    {
      id: "msg-s1",
      senderId: "student-101",
      senderName: "Aryan Student",
      body: "Could you clarify problem #4 on exercise 3.2?",
      createdAt: new Date().toISOString(),
    },
  ];

  const principalMessages = [
    {
      id: "msg-p1",
      senderId: "principal-201",
      senderName: "Dr. Alistair Principal",
      body: "All department faculty should be present at 9:00 AM.",
      createdAt: new Date().toISOString(),
    },
  ];

  const module = { exports: {} };

  // Render Student Conversation
  const renderForConversation = (targetConvId, targetMessages) => {
    let stateIndex = 0;
    const requireShim = (name) => {
      if (name === "react") {
        const realReact = require("react");
        return {
          ...realReact,
          useState: (initial) => {
            const idx = stateIndex++;
            if (idx === 0) return [mockConversations, () => {}];
            if (idx === 1) return [targetConvId, () => {}];
            if (idx === 2) return [targetMessages, () => {}];
            if (idx === 3) return ["", () => {}];
            if (idx === 10) return [false, () => {}];
            return realReact.useState(initial);
          },
        };
      }
      if (name === "react/jsx-runtime") return require("react/jsx-runtime");
      if (name === "lucide-react") return require("lucide-react");
      if (name === "../edops-api") {
        return {
          getCommunicationConversations: async () => mockConversations,
          getCommunicationConversation: async () => targetMessages,
          getCommunicationRecipients: async () => [],
          markCommunicationRead: async () => {},
          openCommunicationStream: () => () => {},
          sendCommunicationMessage: async () => {},
        };
      }
      return {};
    };

    new Function("require", "module", "exports", outputText)(requireShim, module, module.exports);
    return renderToStaticMarkup(createElement(module.exports.CommunicationChat, {
      organizationId: "org-test",
      title: "Direct Messages",
    }));
  };

  const studentHtml = renderForConversation("conv-student", studentMessages);
  assert.match(studentHtml, /Aryan Student/);
  assert.match(studentHtml, /Could you clarify problem #4 on exercise 3\.2\?/);
  assert.doesNotMatch(studentHtml, /All department faculty should be present at 9:00 AM\./);

  const principalHtml = renderForConversation("conv-principal", principalMessages);
  assert.match(principalHtml, /Dr\. Alistair Principal/);
  assert.match(principalHtml, /All department faculty should be present at 9:00 AM\./);
  assert.doesNotMatch(principalHtml, /Could you clarify problem #4 on exercise 3\.2\?/);
});

test("Verification Item 2 & 3: Race condition cancellation & message deduplication prevent stale and duplicate messages", async () => {
  const source = await readFile(new URL("../app/components/communication-chat.tsx", import.meta.url), "utf8");
  
  // Verify cancellation token pattern is present in useEffect
  assert.match(source, /let isCurrent = true;/, "Must use isCurrent cancellation token");
  assert.match(source, /return \(\) => \{\s*isCurrent = false;\s*\};/, "Must cancel in-flight queries on conversation unmount/switch");
  assert.match(source, /setMessages\(\[\]\);/, "Must clear messages immediately on conversation switch to prevent stale message bleed");

  // Verify deduplication set in groupedMessageList
  assert.match(source, /const seen = new Set<string>\(\);/, "Must maintain set of seen message IDs");
  assert.match(source, /seen\.add\(m\.id\);/, "Must deduplicate messages by ID");

  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });

  const duplicateMessages = [
    { id: "dup-1", senderId: "user-1", senderName: "User 1", body: "Hello World", createdAt: new Date().toISOString() },
    { id: "dup-1", senderId: "user-1", senderName: "User 1", body: "Hello World", createdAt: new Date().toISOString() },
    { id: "dup-1", senderId: "user-1", senderName: "User 1", body: "Hello World", createdAt: new Date().toISOString() },
  ];

  const mockConversations = [
    { conversationId: "c1", participantId: "user-1", participantName: "User 1", unreadCount: 0 },
  ];

  let stateIndex = 0;
  const module = { exports: {} };
  const requireShim = (name) => {
    if (name === "react") {
      const realReact = require("react");
      return {
        ...realReact,
        useState: (initial) => {
          const idx = stateIndex++;
          if (idx === 0) return [mockConversations, () => {}];
          if (idx === 1) return ["c1", () => {}];
          if (idx === 2) return [duplicateMessages, () => {}];
          if (idx === 3) return ["", () => {}];
          if (idx === 10) return [false, () => {}];
          return realReact.useState(initial);
        },
      };
    }
    if (name === "react/jsx-runtime") return require("react/jsx-runtime");
    if (name === "lucide-react") return require("lucide-react");
    if (name === "../edops-api") {
      return {
        getCommunicationConversations: async () => mockConversations,
        getCommunicationConversation: async () => duplicateMessages,
        getCommunicationRecipients: async () => [],
        markCommunicationRead: async () => {},
        openCommunicationStream: () => () => {},
        sendCommunicationMessage: async () => {},
      };
    }
    return {};
  };

  new Function("require", "module", "exports", outputText)(requireShim, module, module.exports);
  const html = renderToStaticMarkup(createElement(module.exports.CommunicationChat, {
    organizationId: "org-1",
  }));

  // Confirm "Hello World" is rendered exactly once despite 3 identical IDs in messages array
  const matches = [...html.matchAll(/Hello World/g)];
  assert.equal(matches.length, 1, "Duplicate messages must be filtered out by message.id");
});

test("Verification Item 5 & 6: Unread badges display valid accessible markup without malformed tags", async () => {
  const source = await readFile(new URL("../app/components/communication-chat.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });

  const mockConversations = [
    {
      conversationId: "conv-unread",
      participantId: "u-1",
      participantName: "Parent User",
      preview: "New report inquiry",
      unreadCount: 4,
      lastMessageAt: new Date().toISOString(),
    },
  ];

  let stateIndex = 0;
  const module = { exports: {} };
  const requireShim = (name) => {
    if (name === "react") {
      const realReact = require("react");
      return {
        ...realReact,
        useState: (initial) => {
          const idx = stateIndex++;
          if (idx === 0) return [mockConversations, () => {}];
          if (idx === 1) return ["", () => {}];
          if (idx === 2) return [[], () => {}];
          if (idx === 3) return ["", () => {}];
          if (idx === 10) return [false, () => {}];
          return realReact.useState(initial);
        },
      };
    }
    if (name === "react/jsx-runtime") return require("react/jsx-runtime");
    if (name === "lucide-react") return require("lucide-react");
    if (name === "../edops-api") {
      return {
        getCommunicationConversations: async () => mockConversations,
        getCommunicationConversation: async () => [],
        getCommunicationRecipients: async () => [],
        markCommunicationRead: async () => {},
        openCommunicationStream: () => () => {},
        sendCommunicationMessage: async () => {},
      };
    }
    return {};
  };

  new Function("require", "module", "exports", outputText)(requireShim, module, module.exports);
  const html = renderToStaticMarkup(createElement(module.exports.CommunicationChat, {
    organizationId: "org-1",
  }));

  // Verify well-formed unread badge
  assert.match(html, /<span class="edops-unread-badge" aria-label="4 unread messages"[^>]*>4<\/span>/);
  // Ensure no unclosed or malformed tags
  assert.doesNotMatch(html, /<<|>>|<span[^>]*<span/);
});

test("Verification Item 7 & 8: Responsive breakpoints and API multi-tenant contracts are preserved", async () => {
  const source = await readFile(new URL("../app/components/communication-chat.tsx", import.meta.url), "utf8");

  // Item 7: Responsive styles
  assert.match(source, /@media \(max-width: 720px\)/, "Must include mobile breakpoint rule");
  assert.match(source, /@media \(max-width: 900px\)/, "Must include tablet breakpoint rule");
  assert.match(source, /\.edops-chat-mobile-back-btn/, "Must have mobile back button class");
  assert.match(source, /\.edops-chat-shell\.has-active-chat/, "Must switch between master list and detail view on mobile");

  // Item 8: Multi-tenant API parameters
  assert.match(source, /getCommunicationConversations\(organizationId\)/);
  assert.match(source, /getCommunicationConversation\(organizationId, selectedId\)/);
  assert.match(source, /sendCommunicationMessage\(organizationId, \{/);
  assert.match(source, /markCommunicationRead\(organizationId, selectedId\)/);
  assert.match(source, /openCommunicationStream\(organizationId,/);
});

test("Verification: CommunicationChat contains zero hardcoded demo data, mock users, or static threads", async () => {
  const source = await readFile(new URL("../app/components/communication-chat.tsx", import.meta.url), "utf8");

  // Ensure no mock datasets or hardcoded conversations exist in component source
  assert.doesNotMatch(source, /mockConversations|demoUsers|mockMessages|mockThreads/);
  assert.doesNotMatch(source, /"Dr\. Eleanor Vance"|"Aryan Student"|"Marcus Brody"/);
  assert.doesNotMatch(source, /"vance@edops\.edu"|"brody@parent\.org"/);
  // Ensure recipient role is not hardcoded to "parent"
  assert.doesNotMatch(source, /\|\|\s*"parent"/);
});

