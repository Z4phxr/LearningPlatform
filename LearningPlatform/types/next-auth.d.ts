import { DefaultSession } from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      isPro: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
    isPro: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    isPro: boolean;
  }
}
