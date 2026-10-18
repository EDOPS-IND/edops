"use client";

import React, { useEffect, useState } from "react";

const S = {
  navy: "#0c1e33",
  slate: "#495d72",
  chip: "#f5f6f8",
  border: "#e4e6e9",
  line: "#ced8e5",
  blue: "#17a1fa",
};

interface MathFormulaPreviewProps {
  formula: string;
  className?: string;
}

export function MathFormulaPreview({ formula, className = "" }: MathFormulaPreviewProps) {
  const [katexLoaded, setKatexLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).katex) {
      setKatexLoaded(true);
      return;
    }

    // Dynamically inject KaTeX stylesheet and script from CDN without adding bundle weight
    const existingScript = document.getElementById("katex-cdn-script");
    if (!existingScript) {
      const link = document.createElement("link");
      link.id = "katex-cdn-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.id = "katex-cdn-script";
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
      script.async = true;
      script.onload = () => setKatexLoaded(true);
      document.head.appendChild(script);
    } else {
      setKatexLoaded(true);
    }
  }, []);

  const renderContent = () => {
    if (!formula.trim()) {
      return <span style={{ color: "#a6abb5", fontStyle: "italic" }}>No formula entered yet</span>;
    }

    // 1. Try KaTeX if loaded
    if (typeof window !== "undefined" && (window as any).katex) {
      try {
        const rendered = (window as any).katex.renderToString(formula, {
          throwOnError: false,
          displayMode: false,
        });
        return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
      } catch {
        // Fall back to native MathML
      }
    }

    // 2. Native MathML & styled tokens fallback (works offline in all modern browsers)
    let processed = formula
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<math display="inline"><mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac></math>')
      .replace(/\\sqrt\{([^}]+)\}/g, '<math display="inline"><msqrt><mrow>$1</mrow></msqrt></math>')
      .replace(/(\w+)\^\{([^}]+)\}/g, '<math display="inline"><msup><mi>$1</mi><mn>$2</mn></msup></math>')
      .replace(/(\w+)\^([0-9a-zA-Z]+)/g, '<math display="inline"><msup><mi>$1</mi><mn>$2</mn></msup></math>')
      .replace(/(\w+)_\{([^}]+)\}/g, '<math display="inline"><msub><mi>$1</mi><mn>$2</mn></msub></math>')
      .replace(/(\w+)_([0-9a-zA-Z]+)/g, '<math display="inline"><msub><mi>$1</mi><mn>$2</mn></msub></math>')
      .replace(/\\pm/g, "&plusmn;")
      .replace(/\\times/g, "&times;")
      .replace(/\\div/g, "&divide;")
      .replace(/\\le/g, "&le;")
      .replace(/\\ge/g, "&ge;")
      .replace(/\\neq/g, "&ne;")
      .replace(/\\approx/g, "&asymp;")
      .replace(/\\alpha/g, "&alpha;")
      .replace(/\\beta/g, "&beta;")
      .replace(/\\pi/g, "&pi;");

    return (
      <span
        style={{ fontFamily: "'Poppins', serif", letterSpacing: "0.03em", color: S.navy }}
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  };

  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        background: S.chip,
        border: `1px solid ${S.border}`,
        fontSize: "12px",
      }}
      className={className}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: S.slate, fontWeight: 700, marginBottom: "6px" }}>
        <span>Formula Live Preview</span>
        <span style={{ fontSize: "9px", textTransform: "uppercase", padding: "1px 6px", borderRadius: "4px", background: "#e8eff7", color: S.navy, fontWeight: 600 }}>
          {katexLoaded ? "KaTeX Active" : "MathML Mode"}
        </span>
      </div>
      <div style={{ fontWeight: 500, color: S.navy, fontSize: "14px", overflowX: "auto", padding: "4px 0" }}>
        {renderContent()}
      </div>
    </div>
  );
}
