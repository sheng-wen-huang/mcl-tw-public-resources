import "./styles.css";

export const metadata = {
  title: "WMS Config Explorer Admin",
  description: "Admin portal and API for WMS Config Explorer"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <div className="brand">
            <span className="brand-mark">WMS / 01</span>
            <span className="brand-title">Config <em>Explorer</em></span>
          </div>
          <span className="header-meta">Admin portal</span>
        </header>
        {children}
      </body>
    </html>
  );
}
