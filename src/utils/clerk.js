import { Clerk } from '@clerk/clerk-sdk-node';

export const clerk = Clerk({
  apiKey: process.env.CLERK_API_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});
