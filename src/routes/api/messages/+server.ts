import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
  try {
    // Get the 10 most recent messages
    const messages = await prisma.message.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
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
    const formattedMessages = messages.map(message => {
      // Try to parse the JSON field, fallback to individual fields
      let signedMessage;
      try {
        signedMessage = JSON.parse(message.signedMessageJson);
      } catch (error) {
        signedMessage = {
          sender_username: message.sender.username,
          receiver_username: message.receiver.username,
          plaintext_message: message.plaintextContent,
          message_hash: message.messageHash,
          signature: {
            r: message.signatureR,
            s: message.signatureS
          },
          timestamp: message.createdAt.toISOString()
        };
      }

      return {
        id: message.id,
        from: message.sender.username,
        to: message.receiver.username,
        content: message.plaintextContent,
        status: message.status,
        signedMessage: signedMessage,
        createdAt: message.createdAt
      };
    });

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