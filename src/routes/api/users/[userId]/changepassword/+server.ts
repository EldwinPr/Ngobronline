import type { RequestEvent } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export async function POST(event: RequestEvent) {
  const { locals, params, request } = event;

  // 1) Ensure the user is logged in
  const authUser = locals.user;  
  if (!authUser) {
    throw error(401, 'Not authenticated');
  }

  // 2) Ensure they only change their own password
  if (authUser.id !== params.userId) {
    throw error(403, 'Cannot change another user’s password');
  }

  // 3) Parse & manually validate input
  let body: any;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON');
  }

  const { oldPassword, newPassword } = body ?? {};
  if (typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
    throw error(400, 'Both oldPassword and newPassword are required');
  }
  if (newPassword.length < 8) {
    throw error(400, 'New password must be at least 8 characters');
  }

  // 4) Fetch the user record
  const user = await prisma.user.findUnique({
    where: { id: params.userId }
  });
  if (!user) {
    throw error(404, 'User not found');
  }

  // 5) Verify old password
  const match = await bcrypt.compare(oldPassword, user.hashedPassword);
  if (!match) {
    throw error(400, 'Current password is incorrect');
  }

  // 6) Hash & save the new password
  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword: newHash }
  });

  return json({ success: true });
}
