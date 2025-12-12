// src/components/WhoisLookup.jsx
import { useEffect, useState } from "react";

export default function WhoisLookup({ domain = "google.com" }) {
  const [whoisData, setWhoisData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiUrl = `${import.meta.env.VITE_API_BASE}/whois/?domain=${domain}`;

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setWhoisData(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setWhoisData(null);
      });
  }, [domain]);

  return (
    <div style={{ fontFamily: "monospace", padding: "1rem" }}>
      <h2>WHOIS Lookup for <code>{domain}</code></h2>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {whoisData ? (
        <pre>{JSON.stringify(whoisData, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
