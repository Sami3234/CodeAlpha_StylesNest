import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import Credentials from 'next-auth/providers/credentials';
import { isShopUploadedProfileImage } from '@/lib/shop-profile-image';
import {
  findCredentialsUser,
  isShopUserBlocked,
  upsertShopUser,
  verifyShopPassword,
} from '@/lib/shop-users';

const providers: NonNullable<NextAuthConfig['providers']> = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    })
  );
}

providers.push(
  Credentials({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? '').trim().toLowerCase();
      const password = String(credentials?.password ?? '');

      if (!email || !password) return null;

      const user = await findCredentialsUser(email);
      if (!user || user.is_blocked || !verifyShopPassword(password, user.password_hash)) {
        return null;
      }

      return {
        id: String(user.id),
        email: user.email,
        name: user.name ?? email.split('@')[0],
        image: isShopUploadedProfileImage(user.image) ? user.image! : undefined,
      };
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user) return false;

      if (account?.provider === 'credentials') {
        const dbUser = await findCredentialsUser(user.email ?? '');
        if (!dbUser || dbUser.is_blocked) return false;
        await upsertShopUser({
          email: dbUser.email,
          name: dbUser.name,
          image: isShopUploadedProfileImage(dbUser.image) ? dbUser.image : null,
          provider: 'credentials',
          providerAccountId: dbUser.email,
        });
        user.id = String(dbUser.id);
        return true;
      }

      const provider =
        account?.provider === 'apple'
          ? 'apple'
          : account?.provider === 'google'
            ? 'google'
            : null;

      if (!provider || !account?.providerAccountId) return false;

      const id = await upsertShopUser({
        email: user.email,
        name: user.name,
        image: null,
        provider,
        providerAccountId: account.providerAccountId,
      });

      if (await isShopUserBlocked(id)) {
        return false;
      }

      user.id = String(id);
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user?.id) {
        token.shopUserId = user.id;
      }
      if (account?.provider) {
        token.authProvider = account.provider;
      }
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      if (user?.image && isShopUploadedProfileImage(user.image)) {
        token.picture = user.image;
      } else if (user) {
        token.picture = null;
      }

      if (trigger === 'update' && session) {
        const nextName = session.name ?? session.user?.name;
        const nextImage = session.image ?? session.user?.image;
        if (typeof nextName === 'string') token.name = nextName;
        if (isShopUploadedProfileImage(nextImage)) {
          token.picture = nextImage as string;
        } else if (nextImage === null) {
          token.picture = null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.shopUserId as string;
        session.user.authProvider = (token.authProvider as string) ?? 'credentials';
        session.user.name = (token.name as string | undefined) ?? session.user.name;
        const picture = token.picture as string | undefined;
        session.user.image = isShopUploadedProfileImage(picture) ? picture! : null;
        session.user.email = (token.email as string | undefined) ?? session.user.email;
      }
      return session;
    },
  },
});
