// Service Worker para notificaciones push
// Versión mejorada con mejor soporte para móviles

const SW_VERSION = 'v1.0.0';

self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Instalado', SW_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activado', SW_VERSION);
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[ServiceWorker] Push recibido');
  
  if (!event.data) {
    console.log('[ServiceWorker] Push sin datos');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[ServiceWorker] Datos del push:', data);
    
    const options = {
      body: data.body,
      icon: '/favicon/android-chrome-192x192.png',
      badge: '/favicon/favicon-32x32.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: data.tag || 'notification',
      // requireInteraction true hace que la notificación permanezca hasta que el usuario la cierre
      requireInteraction: true,
      // Renotify asegura que se muestre aunque haya una notificación con el mismo tag
      renotify: true,
      silent: false,
      // Actions que el usuario puede tomar (no todos los navegadores las soportan)
      actions: [
        {
          action: 'open',
          title: 'Ver',
          icon: '/favicon/favicon-32x32.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/favicon/favicon-32x32.png'
        }
      ],
      data: {
        url: data.url || '/',
        notificationId: data.notificationId,
        dateTime: Date.now()
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => {
          console.log('[ServiceWorker] Notificación mostrada');
        })
        .catch((error) => {
          console.error('[ServiceWorker] Error al mostrar notificación:', error);
        })
    );
  } catch (error) {
    console.error('[ServiceWorker] Error al procesar push:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[ServiceWorker] Notificación clickeada:', event.action);
  
  event.notification.close();

  // Si el usuario presionó "cerrar", no hacer nada más
  if (event.action === 'close') {
    return;
  }

  // Obtener la URL de la notificación
  const urlToOpen = event.notification.data.url || '/';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then(function(clientList) {
      console.log('[ServiceWorker] Clientes encontrados:', clientList.length);
      
      // Buscar si ya hay una ventana abierta con la app
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Si hay una ventana de la app abierta, navegarla a la URL y enfocarla
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          console.log('[ServiceWorker] Navegando cliente existente a:', fullUrl);
          return client.navigate(fullUrl).then(client => client.focus());
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        console.log('[ServiceWorker] Abriendo nueva ventana:', fullUrl);
        return clients.openWindow(fullUrl);
      }
    }).catch(function(error) {
      console.error('[ServiceWorker] Error al abrir notificación:', error);
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[ServiceWorker] Notificación cerrada:', event.notification.tag);
});

self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[ServiceWorker] Subscripción cambió');
  
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(function(subscription) {
        console.log('[ServiceWorker] Nueva subscripción creada');
        // Enviar la nueva subscripción al servidor
        return fetch('/api/trpc/push.subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          })
        });
      })
      .catch(function(error) {
        console.error('[ServiceWorker] Error al renovar subscripción:', error);
      })
  );
});

