/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'notification-content',
  name: 'LocalNotesNotificationContent',
  displayName: 'LocalNotes Notifications',
  deploymentTarget: '15.1',
  bundleIdentifier: '.notification-content',
  frameworks: ['UserNotifications', 'UserNotificationsUI', 'UIKit'],
  icon: '../../assets/icon.png',
  images: {
    AppLogo: '../../assets/icon.png',
  },
};
