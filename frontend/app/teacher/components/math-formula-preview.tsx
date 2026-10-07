"use client";

import React, { useEffect, useState } from "react";

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
      return <span className="text-gray-400 italic">No formula entered yet</span>;
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
        className="font-serif tracking-wide text-indigo-900"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  };

  return (
    <div className={`p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200/60 text-xs ${className}`}>
      <div className="flex items-center justify-between text-[10px] text-indigo-700 font-bold mb-1">
        <span>Formula Live Preview</span>
        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-100/80 text-indigo-600">
          {katexLoaded ? "KaTeX Active" : "MathML Mode"}
        </span>
      </div>
      <div className="font-medium text-slate-800 text-sm overflow-x-auto py-1">
        {renderContent()}
      </div>
    </div>
  );
}
