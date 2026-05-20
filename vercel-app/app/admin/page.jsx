import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="shell narrow">
        <p className="eyebrow">Admin portal</p>
        <h1>Sign in with GitHub.</h1>
        <p className="muted">
          Only GitHub users in the admin allowlist can maintain flowcharts.
          Updates will be stamped with the signed-in GitHub account.
        </p>
        <div className="actions">
          <a className="button primary" href="/api/auth/signin/github">Sign in with GitHub</a>
        </div>
      </main>
    );
  }

  return <AdminDashboard user={session.user} />;
}
