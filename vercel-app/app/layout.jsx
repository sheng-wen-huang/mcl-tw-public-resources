import "./styles.css";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

export const metadata = {
  title: "WMS Config Explorer Admin",
  description: "Admin portal and API for WMS Config Explorer"
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <div className="brand">
            <span className="brand-mark">WMS / 01</span>
            <span className="brand-title">Config <em>Explorer</em></span>
          </div>
          <div className="header-meta">
            <span className="info"><span className="dot"></span>System synced · v1.0</span>
            {session ? (
              <a className="btn-login btn-login-danger" href="/api/auth/signout">Sign out</a>
            ) : null}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
