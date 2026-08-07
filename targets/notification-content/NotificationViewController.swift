import UIKit
import UserNotifications
import UserNotificationsUI

/// Rich expanded notification UI for LocalNotes.
/// Shows LOCALNOTES brand header, optional actor avatar, body text, entity preview,
/// and (for FOLLOWED_USER_NEW_LIST) in-card Dismiss / React actions.
@objc(NotificationViewController)
class NotificationViewController: UIViewController, UNNotificationContentExtension {
  private let card = UIStackView()
  private let brandRow = UIStackView()
  private let logoView = UIImageView()
  private let brandLabel = UILabel()
  private let actorRow = UIStackView()
  private let avatarView = UIImageView()
  private let actorNameLabel = UILabel()
  private let bodyLabel = UILabel()
  private let previewCard = UIStackView()
  private let previewTitleLabel = UILabel()
  private let previewSubtitleLabel = UILabel()
  private let actionsRow = UIStackView()
  private let dismissButton = UIButton(type: .system)
  private let reactButton = UIButton(type: .system)

  private var listId: String?

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear
    configureLayout()
  }

  func didReceive(_ notification: UNNotification) {
    let content = notification.request.content
    let userInfo = content.userInfo
    let data = (userInfo["body"] as? [String: Any])
      ?? (userInfo["data"] as? [String: Any])
      ?? flattenExpoData(userInfo)

    brandLabel.text = (data["brand"] as? String) ?? "LOCALNOTES"
    logoView.image = UIImage(named: "AppLogo") ?? UIImage(named: "AppIcon")

    let actorName = data["actorName"] as? String
    let actorAvatarUrl = data["actorAvatarUrl"] as? String
    let hasActor = !(actorName ?? "").isEmpty || !(actorAvatarUrl ?? "").isEmpty
    actorRow.isHidden = !hasActor
    actorNameLabel.text = actorName ?? content.title
    if let avatarUrl = actorAvatarUrl, let url = URL(string: avatarUrl) {
      loadImage(from: url, into: avatarView)
    } else {
      avatarView.image = nil
      avatarView.backgroundColor = UIColor(white: 0.35, alpha: 1)
    }

    let bodyText = content.body
    bodyLabel.text = bodyText
    bodyLabel.isHidden = bodyText.isEmpty

    let previewTitle = data["previewTitle"] as? String
    let previewSubtitle = data["previewSubtitle"] as? String
    let hasPreview = !(previewTitle ?? "").isEmpty || !(previewSubtitle ?? "").isEmpty
    previewCard.isHidden = !hasPreview
    previewTitleLabel.text = previewTitle
    previewSubtitleLabel.text = previewSubtitle
    previewSubtitleLabel.isHidden = (previewSubtitle ?? "").isEmpty

    let notificationType = data["notificationType"] as? String
    let deepLink = data["deepLink"] as? String
    listId = Self.extractListId(from: deepLink)
    let showActions = notificationType == "FOLLOWED_USER_NEW_LIST" && listId != nil
    actionsRow.isHidden = !showActions
  }

  private func flattenExpoData(_ userInfo: [AnyHashable: Any]) -> [String: Any] {
    // Expo may nest custom fields under "data" or flatten them at the root.
    var result: [String: Any] = [:]
    for (key, value) in userInfo {
      if let key = key as? String, key != "aps" {
        result[key] = value
      }
    }
    return result
  }

  private static func extractListId(from deepLink: String?) -> String? {
    guard let deepLink, deepLink.hasPrefix("/lists/") else { return nil }
    let remainder = String(deepLink.dropFirst("/lists/".count))
    guard let firstSegment = remainder.split(separator: "/").first else { return nil }
    let listId = String(firstSegment.split(separator: "?").first ?? firstSegment)
    return listId.isEmpty ? nil : listId
  }

  private func configureLayout() {
    card.axis = .vertical
    card.spacing = 10
    card.translatesAutoresizingMaskIntoConstraints = false
    card.isLayoutMarginsRelativeArrangement = true
    card.layoutMargins = UIEdgeInsets(top: 14, left: 14, bottom: 14, right: 14)
    card.backgroundColor = UIColor(white: 0.12, alpha: 0.92)
    card.layer.cornerRadius = 18
    card.clipsToBounds = true

    brandRow.axis = .horizontal
    brandRow.alignment = .center
    brandRow.spacing = 8
    logoView.contentMode = .scaleAspectFill
    logoView.clipsToBounds = true
    logoView.layer.cornerRadius = 6
    logoView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      logoView.widthAnchor.constraint(equalToConstant: 22),
      logoView.heightAnchor.constraint(equalToConstant: 22),
    ])
    brandLabel.font = UIFont.systemFont(ofSize: 12, weight: .bold)
    brandLabel.textColor = .white
    brandLabel.text = "LOCALNOTES"
    brandRow.addArrangedSubview(logoView)
    brandRow.addArrangedSubview(brandLabel)

    actorRow.axis = .horizontal
    actorRow.alignment = .center
    actorRow.spacing = 10
    avatarView.contentMode = .scaleAspectFill
    avatarView.clipsToBounds = true
    avatarView.layer.cornerRadius = 16
    avatarView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      avatarView.widthAnchor.constraint(equalToConstant: 32),
      avatarView.heightAnchor.constraint(equalToConstant: 32),
    ])
    actorNameLabel.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
    actorNameLabel.textColor = .white
    actorNameLabel.numberOfLines = 1
    actorRow.addArrangedSubview(avatarView)
    actorRow.addArrangedSubview(actorNameLabel)

    bodyLabel.font = UIFont.systemFont(ofSize: 14, weight: .regular)
    bodyLabel.textColor = UIColor(white: 0.92, alpha: 1)
    bodyLabel.numberOfLines = 0

    previewCard.axis = .vertical
    previewCard.spacing = 4
    previewCard.isLayoutMarginsRelativeArrangement = true
    previewCard.layoutMargins = UIEdgeInsets(top: 10, left: 12, bottom: 10, right: 12)
    previewCard.backgroundColor = UIColor(white: 1, alpha: 0.08)
    previewCard.layer.cornerRadius = 12
    previewTitleLabel.font = UIFont.systemFont(ofSize: 14, weight: .semibold)
    previewTitleLabel.textColor = .white
    previewTitleLabel.numberOfLines = 2
    previewSubtitleLabel.font = UIFont.italicSystemFont(ofSize: 13)
    previewSubtitleLabel.textColor = UIColor(white: 0.85, alpha: 1)
    previewSubtitleLabel.numberOfLines = 3
    previewCard.addArrangedSubview(previewTitleLabel)
    previewCard.addArrangedSubview(previewSubtitleLabel)

    configureActionsRow()

    card.addArrangedSubview(brandRow)
    card.addArrangedSubview(actorRow)
    card.addArrangedSubview(bodyLabel)
    card.addArrangedSubview(previewCard)
    card.addArrangedSubview(actionsRow)
    view.addSubview(card)

    NSLayoutConstraint.activate([
      card.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 4),
      card.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -4),
      card.topAnchor.constraint(equalTo: view.topAnchor, constant: 4),
      card.bottomAnchor.constraint(lessThanOrEqualTo: view.bottomAnchor, constant: -4),
    ])
  }

  private func configureActionsRow() {
    actionsRow.axis = .horizontal
    actionsRow.spacing = 10
    actionsRow.distribution = .fillEqually
    actionsRow.isHidden = true

    styleActionButton(
      dismissButton,
      title: "Dismiss",
      titleColor: .white,
      backgroundColor: UIColor(white: 0.28, alpha: 1),
      includeHeart: false
    )
    styleActionButton(
      reactButton,
      title: "React",
      titleColor: .black,
      backgroundColor: .white,
      includeHeart: true
    )

    dismissButton.addTarget(self, action: #selector(dismissTapped), for: .touchUpInside)
    reactButton.addTarget(self, action: #selector(reactTapped), for: .touchUpInside)

    actionsRow.addArrangedSubview(dismissButton)
    actionsRow.addArrangedSubview(reactButton)

    NSLayoutConstraint.activate([
      dismissButton.heightAnchor.constraint(equalToConstant: 40),
      reactButton.heightAnchor.constraint(equalToConstant: 40),
    ])
  }

  private func styleActionButton(
    _ button: UIButton,
    title: String,
    titleColor: UIColor,
    backgroundColor: UIColor,
    includeHeart: Bool
  ) {
    var config = UIButton.Configuration.filled()
    config.baseForegroundColor = titleColor
    config.baseBackgroundColor = backgroundColor
    config.cornerStyle = .medium
    config.contentInsets = NSDirectionalEdgeInsets(top: 10, leading: 12, bottom: 10, trailing: 12)
    config.title = title
    config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
      var outgoing = incoming
      outgoing.font = UIFont.systemFont(ofSize: 15, weight: .bold)
      return outgoing
    }
    if includeHeart {
      config.image = UIImage(systemName: "heart.fill")
      config.imagePadding = 6
    }
    button.configuration = config
    button.layer.cornerRadius = 12
    button.clipsToBounds = true
  }

  @objc private func dismissTapped() {
    extensionContext?.dismissNotificationContentExtension()
  }

  @objc private func reactTapped() {
    guard let listId else {
      extensionContext?.dismissNotificationContentExtension()
      return
    }
    var components = URLComponents()
    components.scheme = "localnotes"
    components.host = "push-react"
    components.queryItems = [URLQueryItem(name: "listId", value: listId)]
    guard let url = components.url else {
      extensionContext?.dismissNotificationContentExtension()
      return
    }
    extensionContext?.open(url) { [weak self] _ in
      self?.extensionContext?.dismissNotificationContentExtension()
    }
  }

  private func loadImage(from url: URL, into imageView: UIImageView) {
    URLSession.shared.dataTask(with: url) { data, _, _ in
      guard let data, let image = UIImage(data: data) else { return }
      DispatchQueue.main.async {
        imageView.image = image
      }
    }.resume()
  }
}
