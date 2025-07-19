const { users } = require('@clerk/clerk-sdk-node');

exports.getAllUsers = async (req, res) => {
  try {
    const list = await users.getUserList();
    res.json(list.map(u => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress,
      name: u.firstName + ' ' + u.lastName,
      role: u.publicMetadata.role || 'user'
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    await users.updateUser(id, {
      publicMetadata: { role },
    });

    res.json({ success: true, message: `Role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await users.deleteUser(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
