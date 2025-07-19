const prisma = require('../lib/prisma');
const { getDbUser } = require('../middleware/auth');


exports.createUser = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
     const { firstName, lastName, emailAddresses, imageUrl } = req.auth.sessionClaims;


    // Check if already exists
    const userExists = await prisma.user.findUnique({
      where: { externalId: clerkId },
    });

    if (userExists) {
      return res.status(200).json({ message: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: {
        externalId: clerkId,
        name: `${firstName ?? ''} ${lastName ?? ''}`,
        email: emailAddresses?.[0]?.emailAddress || null,
        image: imageUrl,
        role: 'USER',
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
    });

   return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

// Get current authenticated user
exports.getCurrentUser = async (req, res) => {
    try {
    const externalId = req.auth.userId; // Provided by @clerk/express

    const user = await getDbUser(externalId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const externalId = req.auth.userId;
    const { name, image } = req.body;

    const updated = await prisma.user.update({
      where: { externalId },
      data: { name, image },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Could not update profile' });
  }
};
// Admin-only: get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Get current user from auth middleware
    const currentUserId = req.auth.userId;
    const requester = await prisma.user.findUnique({
      where: { externalId: currentUserId },
    });

    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Query params for pagination and filtering
    const { page = 1, limit = 10, search = '', role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter conditions
    const where = {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ],
    };
    if (role) {
      where.AND.push({ role: role.toUpperCase() });
    }

    const totalUsers = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      page: parseInt(page),
      limit: take,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / take),
      users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
// ❌ Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const requester = await getDbUser(req.auth.userId);
    if (requester.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Deletion failed' });
  }
};