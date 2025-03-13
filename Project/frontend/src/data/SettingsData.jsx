// src/data/SetiingsData.js
const accountSettingData = [
  {
    label: "Update Profile",
    type: "action",
    actionText: "Edit",
    function: "updateProfile",
    showOnMobile: true,
    inputField: "button",
    disabled: false,
  },
  {
    label: "Change Password",
    type: "action",
    actionText: "Change",
    function: "changePassword",
    showOnMobile: true,
    inputField: "button",
    disabled: false,
  },
  {
    label: "Manage Subscription",
    type: "action",
    actionText: "Manage",
    function: "manageSubscription",
    showOnMobile: true,
    inputField: "button",
    disabled: false,
  },
  {
    label: "Delete Account",
    type: "action",
    actionText: "Delete",
    function: "deleteAccount",
    showOnMobile: true,
    inputField: "button",
    disabled: false,
  },
];

// Display Settings
const displaySettingsData = [
  {
    label: "Language",
    type: "select",
    actionText: [
      "English",
      "Tamil",
      "Hindi",
    ],
    function: "updateLanguage",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
  {
    label: "Currency",
    type: "select",
    actionText: [
      "INR",
      "USD",
      "EUR",
    ],
    function: "updateCurrency",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
  // Date and time settings
  {
    label: "Date Format",
    type: "select",
    actionText: [
      "MM/DD/YYYY",
      "DD/MM/YYYY",
      "YYYY/MM/DD",
    ],
    function: "updateDateFormat",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
  {
    label: "Time Format",
    type: "select",
    actionText: [
      "12-hour",
      "24-hour",
    ],
    function: "updateTimeFormat",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
];

//  App Preferences
const appPreferencesData = [
  {
    label: "Language",
    type: "select",
    actionText: "Edit",
    function: "updateLanguage",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
  {
    label: "Location",
    type: "select",
    actionText: "Edit",
    function: "updateLocation",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
  {
    label: "Currency",
    type: "select",
    actionText: "Edit",
    function: "updateCurrency",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
  {
    label: "Timezone",
    type: "select",
    actionText: "Edit",
    function: "updateTimezone",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
  {
    label: "Date Format",
    type: "select",
    actionText: "Edit",
    function: "updateDateFormat",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
  {
    label: "Time Format",
    type: "select",
    actionText: "Edit",
    function: "updateTimeFormat",
    showOnMobile: true,
    inputField: "select",
    disabled: false,
  },
];

// Notification Settings
const notificationSettingsData = [
  {
    label: "Notification",
    type: "toggle",
    actionText: "Edit",
    function: "updateNotification",
    showOnMobile: true,
    inputField: "toggle",
    isChecked: true,
    disabled: false,
  },
  {
    label: "Email Notification",
    type: "toggle",
    actionText: "Edit",
    function: "updateEmailNotification",
    showOnMobile: true,
    inputField: "toggle",
    isChecked: false,
    disabled: false,
  },
  {
    label: "SMS Notification",
    type: "toggle",
    actionText: "Edit",
    function: "updateSMSNotification",
    showOnMobile: true,
    inputField: "toggle",
    isChecked: true,
    disabled: false,
  },
  {
    label: "Push Notification",
    type: "toggle",
    actionText: "Edit",
    function: "updatePushNotification",
    showOnMobile: true,
    inputField: "toggle",
    isChecked: false,
    disabled: false,
  },
];

// Privacy Settings
const privacySettingsData = [
  {
    label: "Privacy",
    type: "toggle",
    actionText: "Edit",
    function: "updatePrivacy",
    showOnMobile: true,
    inputField: "toggle",
    isChecked: true,
    disabled: false,
    tooltip: "This setting allows you to control your privacy settings.",
  },
  {
    label: "Sharing",
    type: "toggle",
    actionText: "Edit",
    function: "updateSharing",
    showOnMobile: true,
    inputField: "toggle",
    isChecked: true,
    disabled: false,
    tooltip: "This setting allows you to control your sharing settings.",
  },  
  {
    label: "Data Collection",
    type: "toggle",
    actionText: "Edit",
    function: "updateDataCollection",
    showOnMobile: true,
    inputField: "toggle",
    isChecked: true,
    disabled: false,
    tooltip: "This setting allows you to control your data collection settings.",
  },
];

export { accountSettingData, displaySettingsData ,appPreferencesData, notificationSettingsData, privacySettingsData };
