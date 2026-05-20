import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell narrow">
      <p className="eyebrow">WMS Config Explorer</p>
      <h1>Admin API is running.</h1>
      <p className="muted">
        Use the admin portal to manage flowcharts. The GitHub Pages viewer can
        read published flowcharts from this deployment's public API.
      </p>
      <div className="actions">
        <Link className="button primary" href="/admin">Open admin</Link>
        <Link className="button" href="/api/flows">View API data</Link>
      </div>
    </main>
  );
}
