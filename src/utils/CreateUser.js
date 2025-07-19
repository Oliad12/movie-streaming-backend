const prisma = require('../lib/prisma');
const { clerkClient } = require('@clerk/clerk-sdk-node');

async function CreateUser(clerkId) {
  if (!clerkUser || !clerkUser.id) throw new Error('No user provided');
  
  const clerkUser = await clerkClient.users.getUser(clerkId);
  const email = clerkUser.emailAddresses[0].emailAddress;
  // Check if email already exists
  const existingEmailUser = await prisma.user.findUnique({ where:{ email }});
  if (existingEmailUser){
    throw new Error('Email is already registered');
  }
        // Create new user
  return await prisma.user.create({
    data: {
      externalId: clerkId.id,
      email: clerkId.emailAddresses[0].emailAddress,
      name: clerkId.username,
      image: clerkId.imageUrl,
    },
  });
}

module.exports = CreateUser;
