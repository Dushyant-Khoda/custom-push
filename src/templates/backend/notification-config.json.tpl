{
  "notification": {
    "defaultTitle": "{{PROJECT_ID}}",
    "defaultIcon": "/icon.png",
    "defaultBadge": "/badge.png",
    "clickAction": "/",
    "payload": {
      "route": "/",
      "type": "general"
    }
  },
  "credentials": {
    "serviceAccountPath": "{{CREDENTIALS_PATH}}",
    "vapidKey": "{{VAPID_KEY}}"
  },
  "endpoints": {
    "register": "{{REGISTER_URL}}",
    "unregister": "{{UNREGISTER_URL}}",
    "send": "/push/send"
  },
  "docs": {
    "firebaseConsole": "https://console.firebase.google.com",
    "cloudMessaging": "https://console.firebase.google.com/project/_/settings/cloudmessaging",
    "serviceAccounts": "https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk",
    "webPushDocs": "https://firebase.google.com/docs/cloud-messaging/js/client"
  }
}
