import NextAuth from "next-auth";
import Line from "next-auth/providers/line";
import { logActivity } from "@/lib/activity-logger";
import { type AppRole, resolveLineRole } from "@/lib/rbac";

function readRole(value: unknown): AppRole | null {
  return value === "admin" || value === "user" ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Line({
      clientId: process.env.AUTH_LINE_ID,
      clientSecret: process.env.AUTH_LINE_SECRET,
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      const lineUserId =
        account?.provider === "line"
          ? readString(account.providerAccountId) || readString(profile?.sub) || readString(user?.id) || null
          : readString(token.lineUserId);

      if (lineUserId) token.lineUserId = lineUserId;

      // Extract email and name, merging from token, user, and profile
      const email = readString(user?.email) || readString(profile?.email) || readString(token.email) || null;
      const name = readString(user?.name) || readString(profile?.name) || readString(token.name) || null;

      if (email) token.email = email;
      if (name) token.name = name;

      token.role = resolveLineRole({
        id: lineUserId || readString(token.sub),
        email,
        name,
      });
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.role = readRole(token.role) || resolveLineRole({
          id: readString(token.lineUserId) || readString(token.sub),
          email: session.user.email,
          name: session.user.name,
        });
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      await logActivity({
        eventType: "login",
        eventName: "line_login_success",
        userId: user.id || user.email || "line-user",
        userName: user.name || user.email || null,
        userSource: "authjs",
        targetType: "auth_provider",
        targetLabel: account?.provider || "line",
        metadata: {
          provider: account?.provider || "line",
          role: resolveLineRole({
            id: account?.providerAccountId || user.id,
            email: user.email,
            name: user.name,
          }),
        },
      });
    },
  },
});
