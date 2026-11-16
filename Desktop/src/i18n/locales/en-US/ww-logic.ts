/**
 * WebWord logic-layer strings (user-visible messages in composables/stores/App/api)
 * All keys prefixed with `wwl.`
 */
export default {
  // ── Startup / add-ons (App.vue / stores/app.ts / stores/addons.ts) ──
  'wwl.startupComplete': 'Startup complete',
  'wwl.starting': 'Starting...',
  'wwl.splashLoadingAddonList': 'Loading add-on list...',
  'wwl.splashLoadingAddonManager': 'Loading add-on manager...',
  'wwl.splashRegisteringAddons': 'Registering add-ons...',
  'wwl.addonLoadFailed': 'Failed to load add-on',

  // ── Document (stores/document.ts / useExport.ts) ──
  'wwl.untitledDocument': 'Untitled document',
  'wwl.docTitle': 'Document',
  'wwl.newDocTitle': 'New document',
  'wwl.newDocPlaceholder': 'Start typing here...',

  // ── Export (useExport.ts) ──
  'wwl.exportPdfTitle': 'Export PDF',
  'wwl.exportPngSizeError': 'Unable to get the document dimensions. Please make sure the document is open.',
  'wwl.exportPngUnsupported': 'PNG export failed: this browser does not support this operation.',
  'wwl.exportPngExternalResource': 'PNG export failed: the document may contain external resources that cannot be exported. Please remove images and try again.',
  'wwl.exportPngRenderError': 'PNG export failed: unable to render the document content.',
  'wwl.exportPngReadError': 'PNG export failed: an error occurred while reading the document content.',

  // ── File menu greeting (useFileMenu.ts) ──
  'wwl.greetingLateNight': 'It\'s late at night',
  'wwl.greetingEarlyMorning': 'Good morning',
  'wwl.greetingMorning': 'Good morning',
  'wwl.greetingNoon': 'Good noon',
  'wwl.greetingAfternoon': 'Good afternoon',
  'wwl.greetingEvening': 'Good evening',

  // ── Format (useFormat.ts) ──
  'wwl.findPrompt': 'Find:',
  'wwl.replacePrompt': 'Replace with:',

  // ── Ribbon tabs (useTabs.ts) ──
  'wwl.tabStart': 'Start',
  'wwl.tabInsert': 'Insert',
  'wwl.tabDesign': 'Design',
  'wwl.tabLayout': 'Layout',
  'wwl.tabReferences': 'References',
  'wwl.tabMailings': 'Mailings',
  'wwl.tabReview': 'Review',
  'wwl.tabView': 'View',
  'wwl.tabAddons': 'Add-ons',
}
