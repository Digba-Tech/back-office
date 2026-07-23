import { en, type LocaleShape } from "./en"

// Typed against en's key tree (see LocaleShape) — a missing or extra key
// here is a compile error, not a silently-blank string in production.
export const fr: LocaleShape<typeof en> = {
  common: {
    close: "Fermer",
    save: "Enregistrer les modifications",
    saving: "Enregistrement…",
  },
  language: {
    label: "Langue",
  },
  nav: {
    sources: "Sources",
    requirements: "Exigences",
    logout: "Déconnexion",
  },
  login: {
    title: "Administration back-office",
    description: "Connectez-vous avec le compte fondateur qui vous a été attribué.",
    emailLabel: "E-mail",
    passwordLabel: "Mot de passe",
    signIn: "Se connecter",
    signingIn: "Connexion…",
    emailInvalid: "Saisissez une adresse e-mail valide",
    passwordRequired: "Le mot de passe est requis",
    failedFallback:
      "Nécessite votre attention — échec de la connexion. Vérifiez votre e-mail et votre mot de passe, puis réessayez.",
  },
  setPassword: {
    title: "Définissez votre mot de passe",
    description:
      "Vous vous êtes connecté avec un mot de passe temporaire. Choisissez le vôtre avant de continuer.",
    newPasswordLabel: "Nouveau mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    submit: "Définir le mot de passe",
    submitting: "Enregistrement…",
    logoutInstead: "Se déconnecter à la place",
    minLength: "Au moins 8 caractères",
    mismatch: "Les mots de passe ne correspondent pas",
    failedFallback:
      "Nécessite votre attention — impossible de définir votre mot de passe. Réessayez, ou déconnectez-vous et demandez à l'équipe ops de le réinitialiser.",
  },
  notAuthorized: {
    title: "Non autorisé en tant qu'administrateur",
    bodyWithEmailIntro: "Le compte",
    bodyWithEmailRest:
      "est un utilisateur valide et connecté, mais n'est pas marqué comme administrateur.",
    bodyWithoutEmail:
      "Ce compte est un utilisateur valide et connecté, mais n'est pas marqué comme administrateur.",
    explanation:
      "Cela peut être normal (vous n'êtes pas fondateur/administrateur), ou l'équipe backend/ops n'a pas encore effectué l'étape d'attribution des droits d'administrateur pour ce compte. Dans les deux cas, cette application ne peut pas résoudre le problème — contactez l'équipe backend/ops.",
    logout: "Se déconnecter",
  },
  errorBoundary: {
    title: "Une erreur est survenue",
    description: "Vos données sont en sécurité — cet écran a juste besoin d'être rafraîchi.",
    backToSources: "Retour aux sources",
  },
  infoTooltip: {
    moreInfo: "Plus d'informations",
  },
  tagListInput: {
    placeholder: "Saisissez une valeur et appuyez sur Entrée",
    clickToRemove: "Cliquez pour supprimer",
    clickToAdd: "Cliquez pour ajouter",
  },
  enums: {
    requirementStatus: {
      draft: "Brouillon",
      active: "Active",
      deprecated: "Obsolète",
    },
    criticality: {
      core: "Essentielle",
      mandatory: "Obligatoire",
      improvement: "Amélioration",
    },
    checkKind: {
      document_presence: "Présence de document",
      deterministic: "Déterministe",
      llm: "IA (LLM)",
    },
    sourceType: {
      pdf: "PDF",
      webpage: "Page web",
      rss_feed: "Flux RSS",
    },
    scrapeFrequency: {
      daily: "Quotidienne",
      weekly: "Hebdomadaire",
      monthly: "Mensuelle",
    },
  },
  sources: {
    fields: {
      name: { label: "Nom" },
      url: { label: "URL" },
      type: {
        label: "Type",
        info: "Page web : une page de réglementation classique, relue intégralement à chaque fois. Flux RSS : une URL de flux qui liste les mises à jour — à choisir uniquement si l'URL est réellement un flux RSS/Atom.",
      },
      scrapeFrequency: {
        label: "Fréquence d'extraction",
        info: "À quelle fréquence cette source est automatiquement revérifiée pour des mises à jour, une fois enregistrée.",
      },
      deepCrawl: {
        label: "Exploration approfondie",
        info: "Suit les liens de cette page vers des pages associées au lieu de ne lire que celle-ci. À activer si le texte complet de la réglementation s'étend sur plusieurs pages — plus lent, mais plus complet.",
      },
      sectors: {
        label: "Secteurs",
        info: "Les secteurs auxquels s'appliquent les exigences de cette source. Laissez vide pour s'appliquer à tous les secteurs.",
      },
      operatingCountries: {
        label: "Pays d'exploitation",
        info: "Les pays dans lesquels un client doit opérer pour que les exigences de cette source s'appliquent. Laissez vide pour s'appliquer partout.",
      },
      exportRegions: {
        label: "Régions d'exportation",
        info: "Les marchés d'exportation qui déclenchent les exigences de cette source. Laissez vide pour s'appliquer quelle que soit la destination d'exportation du client.",
      },
      certifications: {
        label: "Certifications",
        info: "S'applique uniquement aux clients visant ces certifications. Laissez vide pour s'appliquer quelle que soit la certification.",
      },
    },
    list: {
      title: "Sources documentaires",
      newSource: "Nouvelle source",
      statTotal: "Total",
      statActive: "Actives",
      statInactive: "Inactives",
      filterAllStatuses: "Tous les statuts",
      filterActiveOnly: "Actives uniquement",
      filterInactiveOnly: "Inactives uniquement",
      filterAllTypes: "Tous les types",
      filterStandardPlaceholder: "Filtrer par norme…",
      colName: "Nom",
      colType: "Type",
      colStatus: "Statut",
      colLastScraped: "Dernière extraction",
      colError: "Erreur",
      errorBadge: "Erreur",
      never: "Jamais",
      loadFailed: "Échec du chargement des sources : {{message}}",
      emptyFiltered: "Aucune source ne correspond à ces filtres.",
    },
    new: {
      title: "Enregistrer une nouvelle source",
      detailsCard: "Détails",
      namePlaceholder: "ex. Règlement REACH de l'UE",
      tabUrl: "Source à partir d'une URL",
      tabPdf: "Téléverser un PDF",
      urlPlaceholder: "https://…",
      fileLabel: "Fichier PDF",
      submit: "Enregistrer la source",
      submitting: "Création…",
      errorNameRequired: "Le nom est requis",
      errorUrlRequired: "L'URL est requise",
      errorFileRequired: "Choisissez un fichier PDF à téléverser",
      errorFallback: "Échec de la création de la source",
    },
    detail: {
      loadFailed: "Échec du chargement de la source : {{message}}",
      deactivateInfo:
        "Désactive cette source — elle n'est plus utilisée pour vérifier la conformité des clients, mais rien de ce qui a déjà été approuvé à partir d'elle n'est affecté.",
      activateInfo:
        "Réactive cette source afin qu'elle compte à nouveau lors de la vérification de la conformité des clients.",
      deactivate: "Désactiver",
      activate: "Activer",
      scopingLocked: "Portée verrouillée",
      lastScrapeFailedTitle: "Échec de la dernière extraction",
      ingestionCard: "Ingestion",
      lastScrapedLabel: "Dernière extraction :",
      deepCrawlThisRun: {
        label: "Exploration approfondie pour cette exécution",
        info: "Suit les liens de cette page vers des pages associées au lieu de ne lire que celle-ci. Plus lent, à utiliser quand le texte complet de la réglementation est réparti sur plusieurs pages.",
      },
      runIngestion: "Lancer l'extraction",
      ingesting: "Extraction en cours…",
      runIngestionInfo:
        "Relit cette source et réextrait les exigences qui s'y trouvent. Cela s'exécute en arrière-plan et peut prendre quelques minutes — les exigences nouvelles ou modifiées apparaissent en « brouillon » pour révision, elles ne sont jamais mises en ligne automatiquement.",
      pollingNote:
        "Vérification du statut d'extraction toutes les 5 s — ceci exécute un navigateur sans interface, cela peut prendre du temps.",
      pollTimedOut:
        "Toujours aucun résultat après 15 minutes — l'extraction est peut-être encore en cours. Revenez vérifier plus tard, ou actualisez la page.",
      forceExtract: "Forcer la réextraction des exigences",
      forceExtracting: "Mise en file d'attente…",
      forceExtractInfo:
        "Lance l'extraction des exigences à partir du texte déjà stocké pour cette source, sans réextraire la page ni attendre que le contenu change. À utiliser si l'ingestion réussit mais que l'onglet Exigences reste vide (par exemple si la certification a été ajoutée après la première extraction).",
      forceExtractNoCertification:
        "Ajoutez d'abord une certification à cette source ci-dessous — l'extraction a besoin de savoir contre quel standard extraire les exigences.",
      forceExtractQueued:
        "Extraction mise en file d'attente — vérifiez l'onglet Exigences dans un instant.",
      forceExtractFailed: "Impossible de mettre l'extraction en file d'attente : {{message}}",
      editCard: "Modifier",
      versionHistoryCard: "Historique des versions",
      noIngestedText: "Aucun texte extrait pour le moment — lancez une extraction ci-dessus.",
      loadTextsFailed: "Échec du chargement de l'historique des versions : {{message}}",
      lockScoping: {
        label: "Verrouiller la portée (empêche la réextraction d'écraser ces champs)",
        info: "Si vous avez corrigé manuellement les secteurs/pays/régions/certifications auxquels cette source s'applique, activez ceci pour que la prochaine revérification automatique n'écrase pas votre correction avec sa propre estimation.",
      },
      saveFailed:
        "Nécessite votre attention — impossible d'enregistrer vos modifications. Réessayez.",
    },
  },
  requirements: {
    list: {
      title: "Révision des exigences",
      filterDraft: "À examiner (brouillon)",
      filterActive: "Active",
      filterDeprecated: "Obsolète",
      filterAll: "Tous les statuts",
      standardPlaceholder: "Filtrer par norme…",
      colTitle: "Titre",
      colStandard: "Norme",
      colCriticality: "Criticité",
      colDueYear: "Année d'échéance",
      colStatus: "Statut",
      dueImmediate: "Immédiate",
      loadFailed: "Échec du chargement des exigences : {{message}}",
      emptyFiltered: "Aucune exigence ne correspond à ces filtres.",
    },
    detail: {
      loadFailed: "Échec du chargement de l'exigence : {{message}}",
      reviewedByOn: "Révisé par {{name}} le {{date}}",
      reviewedByOnly: "Révisé par {{name}}",
      rejectionReason: "Motif du rejet : {{reason}}",
      notReviewable: "Non révisable ({{status}})",
      awaitingReviewNote:
        "En attente de révision — vérifiez que la citation à droite n'est pas fabriquée par l'IA avant d'approuver.",
      reject: "Rejeter",
      rejectDialogTitle: "Rejeter l'exigence",
      rejectReasonLabel: "Motif (obligatoire, journal d'audit)",
      rejectReasonInfo:
        "Ceci est conservé afin que toute personne consultant l'historique plus tard puisse voir pourquoi la demande a été refusée.",
      rejecting: "Rejet en cours…",
      rejectInfo:
        "Marque cette exigence comme inutilisable — elle n'affectera jamais le résultat de conformité d'un client. À utiliser quand le texte extrait est incorrect ou ne s'applique pas. Cela n'affecte rien de ce qui est déjà en ligne pour les clients.",
      approve: "Approuver",
      approving: "Approbation en cours…",
      approveInfo:
        "Fait immédiatement compter cette exigence dans la vérification de conformité de chaque client concerné. Si une ancienne version de la même exigence était déjà en ligne, celle-ci la remplace. À faire uniquement après avoir vérifié que la citation à droite n'est pas fabriquée par l'IA.",
      approveDialogTitle: "Approuver cette exigence ?",
      approveConfirm:
        "Ceci remplace la version précédemment en ligne pour tous les clients concernés, immédiatement.",
      approveConfirmButton: "Oui, approuver et mettre en ligne",
      approveFailed: "Échec de l'approbation",
      rejectFailed: "Échec du rejet",
      extractedCard: "Exigence extraite",
      citationCard: "Citation de la source",
      citationHelp:
        "Le passage exact dont ceci a été extrait — vérifiez qu'il n'est pas fabriqué par l'IA avant d'approuver.",
      citationScrapedAt: "extrait le {{date}}",
      citationStale: "La source a été réextraite depuis — ceci est peut-être obsolète",
      citationNoContent: "Aucun contenu enregistré pour cette version.",
      citationNone: "Aucune citation enregistrée.",
      backToQueue: "← Retour à la file de révision",
      saveFailed:
        "Nécessite votre attention — impossible d'enregistrer vos modifications. Réessayez.",
      fields: {
        title: { label: "Titre" },
        text: { label: "Texte" },
        sectionRef: { label: "Référence de section" },
        checkKind: {
          label: "Type de vérification",
          info: "Comment ceci est vérifié. Présence de document : le client doit simplement avoir le bon type de document au dossier. Déterministe : une règle fixe exécutée automatiquement par le système (nécessite un code de vérification ci-dessous). LLM : évalué au cas par cas par l'IA.",
        },
        criticality: {
          label: "Criticité",
          info: "L'importance de ceci dans le résultat global d'un client. Essentielle : un écart sérieux et bloquant. Obligatoire : requis mais moins sévère. Amélioration : un plus, ne bloque pas la conformité.",
        },
        checkCode: {
          label: "Code de vérification (requis pour les vérifications déterministes)",
          info: "Désigne la règle intégrée exacte que le système doit exécuter pour cette exigence. Doit correspondre à une règle déjà construite par l'équipe technique — un texte libre ici ne suffira pas.",
        },
        dueImmediately: {
          label: "Échéance immédiate (pas d'année d'échéance)",
          info: "Certaines exigences ne s'appliquent qu'à partir d'une année future (réglementation à mise en œuvre progressive). Laissez ceci coché si elle s'applique dès maintenant.",
        },
        dueYearPlaceholder: "Année d'échéance",
        sectors: {
          label: "Secteurs",
          info: "Les secteurs auxquels s'applique cette exigence. Laissez vide pour s'appliquer à tous les secteurs.",
        },
        operatingCountries: {
          label: "Pays d'exploitation",
          info: "Les pays dans lesquels un client doit opérer pour que ceci s'applique. Laissez vide pour s'appliquer partout.",
        },
        exportRegions: {
          label: "Régions d'exportation",
          info: "Les marchés d'exportation qui déclenchent cette exigence. Laissez vide pour s'appliquer quelle que soit la destination d'exportation du client.",
        },
        certifications: {
          label: "Certifications",
          info: "S'applique uniquement aux clients visant ces certifications. Laissez vide pour s'appliquer quelle que soit la certification.",
        },
        documentTypes: {
          label: "Preuve attendue : types de documents",
          info: "Les types de documents qui constituent une preuve que le client satisfait cette exigence.",
        },
        hint: {
          label: "Preuve attendue : indice",
          info: "Une courte note en langage simple pour aider à identifier le bon document — non utilisée dans la vérification automatisée elle-même.",
        },
      },
    },
  },
  api: {
    sessionExpired: "Session expirée — veuillez vous reconnecter.",
    notAuthorized: "Non autorisé en tant qu'administrateur",
    requestFailed: "Échec de la requête ({{status}})",
  },
}
