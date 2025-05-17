// src/routes/api/messages/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
  try {
    // Get the 10 most recent messages
    const messages = await prisma.message.findMany({
      take: 10,  // Limit to 10 messages
      orderBy: {
        createdAt: 'desc'  // Newest first
      },
      include: {
        sender: {
          select: {
            username: true
          }
        },
        receiver: {
          select: {
            username: true
          }
        }
      }
    });

    // Transform the messages to a more readable format
    const formattedMessages = messages.map(message => ({
      id: message.id,
      from: message.sender.username,
      to: message.receiver.username,
      content: message.plaintextContent,
      status: message.status,
      messageHash: message.messageHash,
      signature: {
        r: message.signatureR,
        s: message.signatureS
      },
      createdAt: message.createdAt
    }));

    return json({
      count: messages.length,
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
};