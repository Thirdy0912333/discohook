import { Resource } from "i18next";

export const resources = {
  en: {
    translation: {
      // Menu
      settings: "Settings",
      help: "Help",
      logIn: "Log In",
      logOut: "Log Out",
      name: "Name",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      editBackupTitle: "Edit Backup Details",
      editBackupMessages:
        "To edit the messages in a backup, click the <0/> button.",
      saveMessageTitle: "Save Message",
      temporaryShareUrl: "Temporary Share URL",
      generate: "Generate",
      copy: "Copy",
      copyLink: "Copy Link",
      clickGenerate: 'Press "Generate" to generate a share link',
      includeWebhookUrls: "Include webhook URLs",
      linkExpiresAt: "This link expires at {{time}} ({{relativeTime}}).",
      options: "Options",
      manageBackups: "Visit your user page to manage backups.",
      logInToSaveBackups: "Log in to save permanent backups.",
      savedAutomatically: "Saved automatically",
      saveBackup: "Save Backup",
      send: "Send",
      sendToAll: "Send to All",
      sendAll: "Send All",
      sendNoMessages: "You have no messages to send.",
      willBeEdited: "This message has a reference set, so it will be edited.",
      skippedEdit: "Skipped edit due to mismatched webhook ID.",
      submitResultTitle: "Submit Result",
      success: "Success",
      error: "Error",
      fullError: "Full Error:",
      messageDetails: "Message Details",
      messageId: "Message ID: <0/>",
      channelId: "Channel ID: <0/>",
      guildId: "Server ID: <0/>",
      createdAt: "Created at: {{createdAt}}",
      successResultTroubleshoot:
        "If you cannot see the message, make sure it wasn't deleted by another bot. Some moderation bots consider all webhook messages to be spam by default.",
      theme: "Theme",
      messageDisplay: "Message Display",
      addTargetModalTitle: "Add Target",
      webhookUrl: "Webhook URL",
      invalidWebhookUrl:
        "Invalid webhook URL. They start with https://discord.com/api/webhooks/...",
      createdAtBy: "Created {{createdAt}} by {{username}}",
      someone: "someone",
      addWebhook: "Add Webhook",
      createWebhook: "Create Webhook",
      editWebhook: "Edit Webhook",
      editor: "Editor",
      preview: "Preview",
      saveMessage: "Save Message",
      addMessage: "Add Message",
      embedExample: "Example",
      previewInfo: "Preview Info",
      editingBackupNote:
        'You\'re editing a backup, so your work is saved periodically while you edit. In order to share this message with others, use the "Save Message" button.',
      editingLinkBackupNote:
        "You're editing a backup, so your work is saved periodically while you edit.",
      channel: "Channel",
      cannotChangeChannel: "Webhook channel must be set inside Discord.",
      requestedBy: "Requested on Discohook by {{username}}",
      resetAvatar: "Remove",
      webhookCreated: "Webhook Created",
      webhookCreateFailed: "Failed to create webhook",
      webhookCreateSubtitle: "You should be returned to the editor shortly.",
      profile: "Profile",
      linkEmbeds: "Link Embeds",
      backups: "Backups",
      noBackups: "You haven't created any backups.",
      import: "Import",
      importBackups: "Import Backups",
      export: "Export",
      exportBackups: "Export Backups",
      exportBackupsNote:
        "This menu is for exporting backup files to your computer. This is not really necessary, but it's a great way to copy your messages offline or for use with other bots. Your schedule setup, if any, will only be exported for repeating schedules.",
      version: "Version: {{version}}",
      shareLinks: "Share Links",
      noLinks: "You haven't created any share links.",
      id: "ID: {{id}}",
      noShareLinkData:
        "Share link data is not kept after expiration. If you need to permanently store a message, use <backups>Backups</backups> instead.",
      subscribedSince: "Subscribed Since",
      notSubscribed: "Not subscribed",
      firstSubscribed: "First Subscribed",
      never: "Never",
      donate: "Donate",
      deluxe: "Deluxe",
      lifetime: "Lifetime",
      graceRemaining_one: "{{count}} day remaining",
      graceRemaining_other: "{{count}} days remaining",
      server_one: "Server",
      server_other: "Servers",
      noServers: "You don't appear to share any servers with Discohook Utils.",
      inviteBot: "Invite Bot",
      schedule: "Schedule",
      scheduleSendAll: "Schedule All",
      scheduleBackup: "Schedule this backup",
      repeating: "Repeating",
      day: "Day",
      time: "Time ({{timezone}})",
      month: "Month",
      everyMonth: "Every month",
      dayOfMonth: "Day of Month",
      everyDayOfMonth: "Any day of the month",
      weekday: "Weekday",
      everyWeekday: "Any weekday",
      hourTime: "Hour ({{timezone}})",
      minute: "Minute",
      scheduleFrequencyNote: [
        "Scheduled backups can be no sooner than 2 hours apart from each",
        'other. To reset a field to "Every month/day/weekday," remove all',
        "chosen options.",
      ].join(" "),
      havingTrouble: "Having Trouble?",
      troubleshootMessage: [
        "If you press the send button and nothing happens, it may be because",
        "your browser is blocking connections to Discord, which is not",
        "uncommon for privacy-focused extensions like Privacy Badger. Try",
        "disabling privacy extensions or entering incognito/private mode.",
      ].join(" "),
      // Editor
      rowEmpty: "Must contain at least one component (button/select)",
      labelEmpty: "Must have a label or emoji, or both",
      urlEmpty: "Link button must have a URL",
      optionsEmpty: "Must contain at least one select option",
      embedEmpty: "Must contain text or an image",
      embedsTooLarge:
        "Embeds must contain at most 6000 characters total (currently {{count}} too many)",
      history: "History",
      noHistory: "This editor session has no history recorded.",
      historyDescription:
        'This is cleared whenever the editor is loaded. If you need to store messages persistently, use the "Save Message" button.',
      resetEditor: "Reset Editor",
      resetEditorWarning: "Click to confirm",
      resetFinished: "Reset Finished",
      nMessage_one: "{{count}} message",
      nMessage_other: "{{count}} messages",
      nEmbed_one: "{{count}} embed",
      nEmbed_other: "{{count}} embeds",
      historyRestore: "Restore to this point",
      historyRemove: "Remove from history",
      // Preview
      defaultPlaceholder: "Make a selection",
      todayAt: "Today at {{time}}",
    },
  },
  de: {
    translation: {
      defaultPlaceholder: "Triff eine Auswahl",
      donate: "Spenden",
      todayAt: "heute um {{time}} Uhr",
    },
  },
  it: {
    translation: {
      defaultPlaceholder: "Seleziona",
    },
  },
  es: {
    translation: {
      defaultPlaceholder: "Haz una selección",
      todayAt: "hoy a las {{time}}",
    },
  },
  se: {
    translation: {
      defaultPlaceholder: "Gör ett val",
    },
  },
  ne: {
    translation: {
      defaultPlaceholder: "Maak een selectie",
    },
  },
  fr: {
    translation: {
      settings: "Paramètres",
      help: "Aide",
      name: "Nom",
      save: "Enregistrer",
      embedExample: "Exemple",
      editBackupTitle: "Modifier les détails de la sauvegarde",
      editBackupMessages:
        "Pour modifier les messages d'une sauvegarde, cliquez sur le bouton <0/>.",
      resetAvatar: "Supprimer",
      donate: "Faire un don",
      defaultPlaceholder: "Fais un choix",
      todayAt: "Aujourd’hui à {{time}}",
    },
  },
} satisfies Resource;

export type i18nResources = typeof resources;
