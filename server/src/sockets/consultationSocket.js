/**
 * sockets/consultationSocket.js
 * Socket.IO handler for real-time consultation chat and WebRTC signalling.
 *
 * Events (client → server):
 *   join_room       { bookingId }
 *   send_message    { bookingId, content }
 *   typing          { bookingId, isTyping }
 *   call_offer      { bookingId, offer }
 *   call_answer     { bookingId, answer }
 *   call_ice        { bookingId, candidate }
 *   session_ended   { bookingId }
 *
 * Events (server → client):
 *   message         { message }
 *   typing_update   { userId, isTyping }
 *   call_offer      { offer, from }
 *   call_answer     { answer, from }
 *   call_ice        { candidate, from }
 *   session_ended   { endedBy, durationSeconds }
 *   error           { message }
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Booking } from '../modules/bookings/Booking.model.js';
import { Consultation } from '../modules/consultations/Consultation.model.js';
import { logger } from '../utils/logger.js';

export function registerConsultationSockets(io) {
  // ── JWT Authentication for sockets ─────────────────────────
  io.use(async (socket, next) => {
    try {
      // Read token from cookie (sent automatically by browser) or auth handshake
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('accessToken='))
          ?.split('=')[1];

      if (!token) return next(new Error('Authentication required'));

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id, userId: socket.userId }, 'Socket connected');

    // ── join_room ─────────────────────────────────────────────
    socket.on('join_room', async ({ bookingId }) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return socket.emit('error', { message: 'Booking not found' });

        // Only the two parties can join
        const isParticipant =
          booking.userId.toString() === socket.userId ||
          booking.advocateId.toString() === socket.userId;
        if (!isParticipant) return socket.emit('error', { message: 'Access denied' });
        if (booking.status !== 'paid') return socket.emit('error', { message: 'Consultation not yet active' });

        // Mark booking as active on first join
        if (booking.status === 'paid') {
          await Booking.findByIdAndUpdate(bookingId, { status: 'active' });
          await Consultation.findOneAndUpdate(
            { bookingId },
            { startedAt: new Date() },
          );
        }

        socket.join(`consultation:${bookingId}`);
        socket.bookingId = bookingId;
        logger.debug({ userId: socket.userId, bookingId }, 'Joined consultation room');
      } catch (err) {
        logger.error({ err }, 'join_room error');
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ── send_message ──────────────────────────────────────────
    socket.on('send_message', async ({ bookingId, content }) => {
      try {
        if (!content?.trim()) return;

        const consultation = await Consultation.findOneAndUpdate(
          { bookingId },
          {
            $push: {
              messages: {
                senderId: socket.userId,
                senderRole: socket.userRole,
                content: content.slice(0, 4000),
              },
            },
          },
          { new: true },
        );

        const lastMsg = consultation.messages[consultation.messages.length - 1];
        io.to(`consultation:${bookingId}`).emit('message', { message: lastMsg });
      } catch (err) {
        logger.error({ err }, 'send_message error');
      }
    });

    // ── typing ───────────────────────────────────────────────
    socket.on('typing', ({ bookingId, isTyping }) => {
      socket.to(`consultation:${bookingId}`).emit('typing_update', {
        userId: socket.userId,
        isTyping,
      });
    });

    // ── WebRTC signalling ─────────────────────────────────────
    socket.on('call_offer', ({ bookingId, offer }) => {
      socket.to(`consultation:${bookingId}`).emit('call_offer', { offer, from: socket.userId });
    });

    socket.on('call_answer', ({ bookingId, answer }) => {
      socket.to(`consultation:${bookingId}`).emit('call_answer', { answer, from: socket.userId });
    });

    socket.on('call_ice', ({ bookingId, candidate }) => {
      socket.to(`consultation:${bookingId}`).emit('call_ice', { candidate, from: socket.userId });
    });

    // ── session_ended ─────────────────────────────────────────
    socket.on('session_ended', async ({ bookingId }) => {
      try {
        const consultation = await Consultation.findOneAndUpdate(
          { bookingId, endedAt: null },
          { endedAt: new Date(), endedBy: socket.userRole },
          { new: true },
        );

        if (consultation) {
          const durationSeconds = Math.round(
            (consultation.endedAt - consultation.startedAt) / 1000,
          );
          await Consultation.findByIdAndUpdate(consultation._id, { durationSeconds });
          await Booking.findByIdAndUpdate(bookingId, { status: 'completed' });

          io.to(`consultation:${bookingId}`).emit('session_ended', {
            endedBy: socket.userRole,
            durationSeconds,
          });
        }
      } catch (err) {
        logger.error({ err }, 'session_ended error');
      }
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });
}
