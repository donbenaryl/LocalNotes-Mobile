import UserNotifications

/// Downloads actor/preview images before the system displays the notification so
/// richContent / Communication-style attachments work when mutable-content is set.
class NotificationService: UNNotificationServiceExtension {
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

    guard let bestAttemptContent else {
      contentHandler(request.content)
      return
    }

    let userInfo = bestAttemptContent.userInfo
    let data = (userInfo["body"] as? [String: Any])
      ?? (userInfo["data"] as? [String: Any])
      ?? flatten(userInfo)

    let imageURLString =
      (data["previewImageUrl"] as? String)
      ?? (data["actorAvatarUrl"] as? String)
      ?? ((userInfo["richContent"] as? [String: Any])?["image"] as? String)

    guard let imageURLString, let url = URL(string: imageURLString) else {
      contentHandler(bestAttemptContent)
      return
    }

    downloadAttachment(from: url) { attachment in
      if let attachment {
        bestAttemptContent.attachments = [attachment]
      }
      contentHandler(bestAttemptContent)
    }
  }

  override func serviceExtensionTimeWillExpire() {
    if let contentHandler, let bestAttemptContent {
      contentHandler(bestAttemptContent)
    }
  }

  private func flatten(_ userInfo: [AnyHashable: Any]) -> [String: Any] {
    var result: [String: Any] = [:]
    for (key, value) in userInfo {
      if let key = key as? String, key != "aps" {
        result[key] = value
      }
    }
    return result
  }

  private func downloadAttachment(
    from url: URL,
    completion: @escaping (UNNotificationAttachment?) -> Void
  ) {
    let task = URLSession.shared.downloadTask(with: url) { location, response, _ in
      guard let location else {
        completion(nil)
        return
      }
      let tmp = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString)
        .appendingPathExtension((response?.suggestedFilename as NSString?)?.pathExtension ?? "jpg")
      do {
        try FileManager.default.moveItem(at: location, to: tmp)
        let attachment = try UNNotificationAttachment(identifier: "rich-image", url: tmp)
        completion(attachment)
      } catch {
        completion(nil)
      }
    }
    task.resume()
  }
}
