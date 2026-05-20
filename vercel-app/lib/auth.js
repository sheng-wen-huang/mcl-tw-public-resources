import GitHubProvider from "next-auth/providers/github";

function parseAdminUsers() {
  return (process.env.ADMIN_GITHUB_USERS || "")
    .split(",")
    .map((user) => user.trim().toLowerCase())
    .filter(Boolean);
}

export const authOptions = {
  session: {
    strategy: "jwt"
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubUsername: profile.login
        };
      }
    })
  ],
  callbacks: {
    async signIn({ profile }) {
      const admins = parseAdminUsers();
      const login = profile?.login?.toLowerCase();
      return Boolean(login && admins.includes(login));
    },
    async jwt({ token, profile, user }) {
      if (profile?.login) {
        token.githubUsername = profile.login;
      }
      if (user?.name) {
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.githubUsername = token.githubUsername;
      session.user.role = "admin";
      return session;
    }
  },
  pages: {
    signIn: "/admin"
  }
};

export function getPublicCorsHeaders() {
  const site = process.env.PUBLIC_SITE_URL;
  let origin = "*";

  if (site) {
    try {
      origin = new URL(site).origin;
    } catch {
      origin = site;
    }
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}
