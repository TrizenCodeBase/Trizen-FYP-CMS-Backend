import { User } from '../models/User';

/**
 * Ensure a default admin account exists from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Safe to call on every boot: creates if missing, never downgrades existing users.
 */
export const seedAdmin = async (): Promise<void> => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ℹ️  Admin seed skipped (set ADMIN_EMAIL and ADMIN_PASSWORD to enable)');
    return;
  }

  try {
    const existing = await User.findOne({ email }).select('+password');

    if (existing) {
      let changed = false;

      if (existing.role !== 'admin') {
        existing.role = 'admin';
        changed = true;
      }
      if (!existing.isActive) {
        existing.isActive = true;
        changed = true;
      }
      if (!existing.phone) {
        existing.phone = '9999999999';
        changed = true;
      }
      if (!existing.course) {
        existing.course = 'Administration';
        changed = true;
      }
      if (!existing.name) {
        existing.name = 'System Administrator';
        changed = true;
      }

      // In development only, optionally sync password from env
      if (
        process.env.NODE_ENV !== 'production' &&
        process.env.ADMIN_RESET_PASSWORD === 'true'
      ) {
        existing.password = password;
        changed = true;
      }

      if (changed) {
        await existing.save();
        console.log(`✅ Admin account updated: ${email}`);
      } else {
        console.log(`ℹ️  Admin already exists: ${email}`);
      }
      return;
    }

    await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      email,
      password,
      phone: process.env.ADMIN_PHONE || '9999999999',
      course: process.env.ADMIN_COURSE || 'Administration',
      college: process.env.ADMIN_COLLEGE || 'Trizen Ventures',
      role: 'admin',
      isActive: true,
    });

    console.log(`✅ Admin account created: ${email}`);
  } catch (error) {
    console.error('❌ Admin seed failed:', error instanceof Error ? error.message : error);
  }
};
