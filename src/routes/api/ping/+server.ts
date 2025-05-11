import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
  const count = await prisma.user.count();
  return new Response(JSON.stringify({ userCount: count }));
};