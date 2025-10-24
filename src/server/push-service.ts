import webpush from 'web-push';
import { db } from './db';

// Configurar web-push con las claves VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  notificationId?: number;
}

/**
 * Envía una notificación push a un usuario específico
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys no configuradas, notificaciones push deshabilitadas');
    return;
  }

  try {
    // Obtener todas las suscripciones del usuario
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(`No hay suscripciones push para el usuario ${userId}`);
      return;
    }

    // Enviar notificación a cada suscripción
    const promises = subscriptions.map(async (subscription) => {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );
        console.log(`Notificación push enviada a ${subscription.endpoint}`);
      } catch (error: any) {
        console.error('Error al enviar notificación push:', error);
        
        // Si la suscripción es inválida (410 Gone), eliminarla
        if (error.statusCode === 410) {
          console.log(`Eliminando suscripción inválida: ${subscription.endpoint}`);
          await db.pushSubscription.delete({
            where: { id: subscription.id },
          });
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error general al enviar notificaciones push:', error);
  }
}

/**
 * Envía una notificación push a múltiples usuarios
 */
export async function sendPushNotificationToMany(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<void> {
  const promises = userIds.map((userId) => 
    sendPushNotification(userId, payload)
  );
  await Promise.all(promises);
}

/**
 * Verifica si las claves VAPID están configuradas
 */
export function isWebPushConfigured(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey);
}

