/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'notification-service',
  name: 'LocalNotesNotificationService',
  displayName: 'LocalNotes Notification Service',
  deploymentTarget: '15.1',
  bundleIdentifier: '.notification-service',
  frameworks: ['UserNotifications'],
};
