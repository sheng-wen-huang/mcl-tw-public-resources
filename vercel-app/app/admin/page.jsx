import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import AdminDashboard from "./AdminDashboard";
import SignInButton from "./SignInButton";

export default async function AdminPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const error = params?.error;

  if (!session) {
    return (
      <main className="shell narrow">
        <p className="eyebrow">Admin portal</p>
        <h1>Sign in with GitHub.</h1>
        <p className="muted">
          Only GitHub users in the admin allowlist can maintain flowcharts.
          Updates will be stamped with the signed-in GitHub account.
        </p>
        {error ? (
          <div className="notice error">
            GitHub sign-in failed. Check the OAuth app callback URL, Vercel
            environment variables, and admin allowlist.
          </div>
        ) : null}
        <div className="actions">
          <SignInButton />
        </div>
      </main>
    );
  }

  return <AdminDashboard user={session.user} publicSiteUrl={process.env.PUBLIC_SITE_URL || "/"} />;
}
