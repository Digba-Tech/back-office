// Canonical key shape — fr.ts is typed against this so a missing/extra key
// is a compile error, not a silently-blank string in production.
export const en = {
  common: {
    close: "Close",
    save: "Save changes",
    saving: "Saving…",
  },
  language: {
    label: "Language",
  },
  nav: {
    sources: "Sources",
    requirements: "Requirements",
    logout: "Log out",
  },
  login: {
    title: "Back-office admin",
    description: "Sign in with the founder account you were given.",
    emailLabel: "Email",
    passwordLabel: "Password",
    signIn: "Sign in",
    signingIn: "Signing in…",
    emailInvalid: "Enter a valid email address",
    passwordRequired: "Password is required",
    failedFallback: "Login failed",
  },
  setPassword: {
    title: "Set your password",
    description:
      "You signed in with a temporary password. Choose your own before continuing.",
    newPasswordLabel: "New password",
    confirmPasswordLabel: "Confirm password",
    submit: "Set password",
    submitting: "Saving…",
    logoutInstead: "Log out instead",
    minLength: "At least 8 characters",
    mismatch: "Passwords don't match",
    failedFallback: "Failed to set password",
  },
  notAuthorized: {
    title: "Not authorized as admin",
    bodyWithEmailIntro: "The account",
    bodyWithEmailRest:
      "is a valid logged-in user, but isn't flagged as an admin.",
    bodyWithoutEmail:
      "This account is a valid logged-in user, but isn't flagged as an admin.",
    explanation:
      "This is either expected (you're not a founder/admin), or the backend/ops team hasn't run the admin provisioning step for this account yet. Either way, it isn't something this app can fix — contact the backend/ops team.",
    logout: "Log out",
  },
  errorBoundary: {
    title: "Something went wrong",
    backToSources: "Back to sources",
  },
  infoTooltip: {
    moreInfo: "More info",
  },
  tagListInput: {
    placeholder: "Type a value and press Enter",
    clickToRemove: "Click to remove",
    clickToAdd: "Click to add",
  },
  enums: {
    requirementStatus: {
      draft: "Draft",
      active: "Active",
      deprecated: "Deprecated",
    },
    criticality: {
      core: "Core",
      mandatory: "Mandatory",
      improvement: "Improvement",
    },
    checkKind: {
      document_presence: "Document presence",
      deterministic: "Deterministic",
      llm: "LLM",
    },
    sourceType: {
      pdf: "PDF",
      webpage: "Webpage",
      rss_feed: "RSS feed",
    },
    scrapeFrequency: {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    },
  },
  sources: {
    fields: {
      name: { label: "Name" },
      url: { label: "URL" },
      type: {
        label: "Type",
        info: "Webpage: a normal regulation page, re-read in full each time. RSS feed: a feed URL that lists updates — pick this only if the URL is actually an RSS/Atom feed.",
      },
      scrapeFrequency: {
        label: "Scrape frequency",
        info: "How often this source is automatically re-checked for updates after it's registered.",
      },
      deepCrawl: {
        label: "Deep crawl",
        info: "Follows links from this page to related pages instead of reading only this one. Turn on if the regulation's full text spans multiple pages — it's slower, but more complete.",
      },
      sectors: {
        label: "Sectors",
        info: "Which industries this source's requirements apply to. Leave empty to apply to every sector.",
      },
      operatingCountries: {
        label: "Operating countries",
        info: "Which countries a customer must operate in for this source's requirements to apply. Leave empty to apply everywhere.",
      },
      exportRegions: {
        label: "Export regions",
        info: "Which export markets trigger this source's requirements. Leave empty to apply regardless of where a customer exports to.",
      },
      certifications: {
        label: "Certifications",
        info: "Only applies to customers pursuing these certifications. Leave empty to apply regardless of certification.",
      },
    },
    list: {
      title: "Knowledge sources",
      newSource: "New source",
      statTotal: "Total",
      statActive: "Active",
      statInactive: "Inactive",
      filterAllStatuses: "All statuses",
      filterActiveOnly: "Active only",
      filterInactiveOnly: "Inactive only",
      filterAllTypes: "All types",
      filterStandardPlaceholder: "Filter by standard…",
      colName: "Name",
      colType: "Type",
      colStatus: "Status",
      colLastScraped: "Last scraped",
      colError: "Error",
      errorBadge: "Error",
      never: "Never",
      loadFailed: "Failed to load sources: {{message}}",
      emptyFiltered: "No sources match these filters.",
    },
    new: {
      title: "Register a new source",
      detailsCard: "Details",
      namePlaceholder: "e.g. EU REACH Regulation",
      tabUrl: "URL-located source",
      tabPdf: "Upload PDF",
      urlPlaceholder: "https://…",
      fileLabel: "PDF file",
      submit: "Register source",
      submitting: "Creating…",
      errorNameRequired: "Name is required",
      errorUrlRequired: "URL is required",
      errorFileRequired: "Choose a PDF file to upload",
      errorFallback: "Failed to create source",
    },
    detail: {
      loadFailed: "Failed to load source: {{message}}",
      deactivateInfo:
        "Turns this source off — it stops being used to check customer compliance, but nothing already approved from it is affected.",
      activateInfo:
        "Turns this source back on so it counts again when checking customer compliance.",
      deactivate: "Deactivate",
      activate: "Activate",
      scopingLocked: "Scoping locked",
      lastScrapeFailedTitle: "Last scrape failed",
      ingestionCard: "Ingestion",
      lastScrapedLabel: "Last scraped:",
      deepCrawlThisRun: {
        label: "Deep crawl this run",
        info: "Follows links from this page to related pages instead of reading only this one. Slower, but use it when the regulation's full text is spread across multiple pages.",
      },
      runIngestion: "Run ingestion",
      ingesting: "Ingesting…",
      runIngestionInfo:
        "Re-reads this source and re-extracts requirements from it. This runs in the background and can take a few minutes — new/changed requirements show up as \"draft\" for review, they don't go live on their own.",
      pollingNote:
        "Polling ingest-status every 5s — this runs a headless browser, it can take a while.",
      pollTimedOut:
        "Still hasn't reported a result after 15 minutes — it may still be running. Check back in a bit, or refresh the page.",
      editCard: "Edit",
      versionHistoryCard: "Version history",
      noIngestedText: "No ingested text yet — run ingestion above.",
      loadTextsFailed: "Failed to load version history: {{message}}",
      lockScoping: {
        label: "Lock scoping (stop re-ingestion from overwriting these fields)",
        info: "If you've manually corrected which sectors/countries/regions/certifications this source applies to, turn this on so the next automatic re-check doesn't overwrite your correction with its own guess.",
      },
      saveFailed: "Failed to save",
    },
  },
  requirements: {
    list: {
      title: "Requirements review",
      filterDraft: "Needs review (draft)",
      filterActive: "Active",
      filterDeprecated: "Deprecated",
      filterAll: "All statuses",
      standardPlaceholder: "Filter by standard…",
      colTitle: "Title",
      colStandard: "Standard",
      colCriticality: "Criticality",
      colDueYear: "Due year",
      colStatus: "Status",
      dueImmediate: "Immediate",
      loadFailed: "Failed to load requirements: {{message}}",
      emptyFiltered: "No requirements match these filters.",
    },
    detail: {
      loadFailed: "Failed to load requirement: {{message}}",
      reviewedByOn: "Reviewed by {{name}} on {{date}}",
      reviewedByOnly: "Reviewed by {{name}}",
      rejectionReason: "Rejection reason: {{reason}}",
      notReviewable: "Not reviewable ({{status}})",
      reject: "Reject",
      rejectDialogTitle: "Reject requirement",
      rejectReasonLabel: "Reason (required, audit trail)",
      rejectReasonInfo:
        "This is kept on record so anyone reviewing history later can see why it was turned down.",
      rejecting: "Rejecting…",
      rejectInfo:
        "Marks this requirement as not usable — it will never affect a customer's compliance result. Use this when the extracted text is wrong or doesn't apply. This does not affect anything already live for customers.",
      approve: "Approve",
      approving: "Approving…",
      approveInfo:
        "Makes this requirement count immediately in every customer's compliance check that it applies to. If an older version of the same requirement was already live, this replaces it. Only do this once you've checked the citation on the right isn't hallucinated.",
      approveConfirm:
        "Approving supersedes the prior active version and goes live for every customer in scope immediately. Continue?",
      approveFailed: "Approve failed",
      rejectFailed: "Reject failed",
      extractedCard: "Extracted requirement",
      citationCard: "Source citation",
      citationHelp:
        "The exact passage this was extracted from — verify it's not hallucinated before approving.",
      citationScrapedAt: "scraped {{date}}",
      citationStale: "Source has been re-ingested since — this may be stale",
      citationNoContent: "No content on record for this version.",
      citationNone: "No citation on record.",
      backToQueue: "← Back to review queue",
      saveFailed: "Failed to save",
      fields: {
        title: { label: "Title" },
        text: { label: "Text" },
        sectionRef: { label: "Section reference" },
        checkKind: {
          label: "Check kind",
          info: "How this gets checked. Document presence: a customer just needs the right document type on file. Deterministic: a fixed rule the system runs automatically (needs a check code below). LLM: judged case-by-case by the AI.",
        },
        criticality: {
          label: "Criticality",
          info: "How much this matters for a customer's overall result. Core: a serious, must-have gap. Mandatory: required but less severe. Improvement: a nice-to-have, doesn't block compliance.",
        },
        checkCode: {
          label: "Check code (required for deterministic checks)",
          info: "Names the exact built-in rule the system should run for this requirement. Must match a rule the engineering team has already built — free text here won't work on its own.",
        },
        dueImmediately: {
          label: "Due immediately (no due year)",
          info: "Some requirements only kick in from a future year (a phased-in regulation). Leave this checked if it applies right away.",
        },
        dueYearPlaceholder: "Due year",
        sectors: {
          label: "Sectors",
          info: "Which industries this requirement applies to. Leave empty to apply to every sector.",
        },
        operatingCountries: {
          label: "Operating countries",
          info: "Which countries a customer must operate in for this to apply. Leave empty to apply everywhere.",
        },
        exportRegions: {
          label: "Export regions",
          info: "Which export markets trigger this requirement. Leave empty to apply regardless of where a customer exports to.",
        },
        certifications: {
          label: "Certifications",
          info: "Only applies to customers pursuing these certifications. Leave empty to apply regardless of certification.",
        },
        documentTypes: {
          label: "Expected evidence: document types",
          info: "Which document types count as proof a customer satisfies this requirement.",
        },
        hint: {
          label: "Expected evidence: hint",
          info: "A short plain-language note shown to help identify the right document — not used in the automated check itself.",
        },
      },
    },
  },
  api: {
    sessionExpired: "Session expired — please log in again.",
    notAuthorized: "Not authorized as admin",
    requestFailed: "Request failed with {{status}}",
  },
} as const

// Widens every leaf to `string` while still requiring the exact same key
// tree — so fr.ts gets a compile error on a missing/extra key, but isn't
// forced to reuse English's literal string values.
export type LocaleShape<T> = {
  [K in keyof T]: T[K] extends string ? string : LocaleShape<T[K]>
}
