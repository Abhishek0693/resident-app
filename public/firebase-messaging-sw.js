importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            'AIzaSyBCTQQlNjY_VQSzWwRqsCVnzAZpR6AUYGE',
  authDomain:        'resident-app-c7655.firebaseapp.com',
  projectId:         'resident-app-c7655',
  storageBucket:     'resident-app-c7655.firebasestorage.app',
  messagingSenderId: '604567386140',
  appId:             '1:604567386140:web:6cc2f6caab98fd1ef587d9',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {}
  self.registration.showNotification(title || 'NIWAS', {
    body: body || '',
    icon: icon || '/icon.png',
  })
})
