import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      authProvider?: string;
    };
  }

  interface User {
    id: string;
    authProvider?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    shopUserId?: string;
    authProvider?: string;
  }
}
