// Lightweight client for Judge0 (Community Edition)
// Docs: https://ce.judge0.com/

const JUDGE0_BASE = "https://ce.judge0.com";

// Map common language slugs to Judge0 language IDs
export const judge0LanguageIdFor = (language) => {
  const map = {
    javascript: 63, // Node.js
    node: 63,
    python: 71, // Python 3
    python3: 71,
    c: 50, // C (GCC)
    cpp: 54, // C++ (G++)
    'c++': 54,
    java: 62, // Java
  };
  const key = String(language || "").toLowerCase();
  return map[key] || null;
};

const encodeBase64 = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (_) {
    return btoa(str);
  }
};

export async function runCodeWithJudge0({ sourceCode, language, stdin }) {
  const languageId = judge0LanguageIdFor(language);
  if (!languageId) {
    throw new Error("Unsupported language for Judge0");
  }

  const payload = {
    language_id: languageId,
    source_code: encodeBase64(sourceCode || ""),
    stdin: encodeBase64(stdin || ""),
  };

  const res = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Judge0 error: ${res.status} ${text}`);
  }

  const data = await res.json();
  // data contains base64 encoded outputs; decode
  const decode = (b64) => {
    if (!b64) return "";
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch (_) {
      return atob(b64);
    }
  };

  return {
    status: data.status?.description || "",
    stdout: decode(data.stdout),
    stderr: decode(data.stderr),
    compile_output: decode(data.compile_output),
    time: data.time,
    memory: data.memory,
  };
}


