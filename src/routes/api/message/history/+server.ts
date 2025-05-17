import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const user1 = url.searchParams.get('user1');
    const user2 = url.searchParams.get('user2');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    if (!user1 || !user2) {
      return json({ error: 'Both user1 and user2 parameters are required' }, { status: 400 });
    }
    
    // Fetch messages between these users (in both directions)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { 
            sender: { username: user1 },
            receiver: { username: user2 }
          },
          { 
            sender: { username: user2 },
            receiver: { username: user1 }
          }
        ]
      },
      include: {
        sender: {
          select: { username: true }
        },
        receiver: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit
    });
    
    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: {
        OR: [
          { 
            sender: { username: user1 },
            receiver: { username: user2 }
          },
          { 
            sender: { username: user2 },
            receiver: { username: user1 }
          }
        ]
      }
    });
    
    return json({
      messages,
      totalCount,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error('Failed to fetch message history:', error);
    return json({ error: 'Failed to fetch message history' }, { status: 500 });
  }
};