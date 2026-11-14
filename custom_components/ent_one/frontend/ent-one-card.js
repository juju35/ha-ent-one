var ENT_ONE_CARD_VERSION = '1.0.0';

// ── Header icon: tinted round icon, the orange of the "e" of the ONE logo (16 % tint like the other cards) ─────
var ENT_ONE_ACCENT = '#f39c3c';

// ── i18n ──────────────────────────────────────────────────────────────────────
// One table for the cards and the panel (the panel loads this file). Flat keys, so every language splits out.
var EntOneI18n = {
  en: {
    default_title: 'ENT ONE',
    no_entity: 'ENT ONE sensors not found. Add the ENT ONE integration or set "config_entry_id".',
    unavailable: 'The ENT is unavailable. Its content will show up after the next successful update.',
    up_to_date: 'Up to date',
    partial: 'Partly updated',
    offline: 'Unavailable',
    refresh: 'Refresh',
    refresh_failed: 'Refresh failed:',
    open_ent: 'Open the ENT',
    show_full: 'Show the full card',
    show_compact: 'Back to the compact view',
    children: '{n} children',
    tile_messages: 'unread',
    tile_words: 'to sign',
    tile_homework: 'homework',
    section_words: 'Liaison book',
    section_homework: 'Homework',
    section_messages: 'Messages',
    section_news: 'News',
    section_events: 'Calendar',
    sign: 'Sign',
    signed: 'Signed',
    sign_title: 'Sign this word?',
    sign_text: 'The ENT records that you read “{title}” for {child}. This cannot be undone.',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Sign',
    signing: 'Signing…',
    mark_done: 'Mark as done',
    mark_todo: 'Mark as not done',
    no_words: 'No word to sign',
    no_homework: 'No homework to do',
    no_messages: 'No unread message',
    no_news: 'No news',
    no_events: 'Nothing planned',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    due: 'for {day}',
    due_today: 'for today',
    due_tomorrow: 'for tomorrow',
    all_day: 'All day',
    attachment: 'Attachment',
    more: '+{n} more',
    action_failed: 'The ENT refused the action:',
    tab_home: 'Home',
    tab_homework: 'Homework',
    tab_words: 'Liaison book',
    tab_messages: 'Messages',
    tab_news: 'News',
    tab_settings: 'Settings',
    all: 'All',
    hide_done: 'Hide done',
    no_account: 'No ENT ONE account is loaded. Add the integration in Settings → Devices and services.',
    account: 'Account',
    settings_scan: 'Update interval (minutes)',
    settings_scan_hint: 'The ENT is shared by the whole school: 10 minutes minimum.',
    settings_days: 'Homework window (days)',
    settings_notify: 'Notify actions',
    settings_notify_hint: 'New messages, words to sign and homework are sent to these actions.',
    settings_panel: 'Show this panel in the sidebar',
    save: 'Save',
    saved: 'Saved. The account reloads with the new settings.',
    admin_only: 'Only an administrator can change these settings.',
    last_update: 'Last update {time}',
    editor_entry: 'ENT ONE account',
    editor_title: 'Title',
    editor_show_title: 'Show the title',
    editor_show_refresh: 'Show the refresh button',
    editor_show_words: 'Show the liaison book',
    editor_show_homework: 'Show the homework',
    editor_show_done: 'Show done homework',
    editor_show_messages: 'Show the messages',
    editor_show_news: 'Show the news',
    editor_show_events: 'Show the calendar',
    editor_show_empty: 'Show empty sections',
    editor_max_items: 'Items per section',
    editor_language: 'Language',
    editor_lang_auto: 'Automatic',
  },
  fr: {
    default_title: 'ENT ONE',
    no_entity: 'Capteurs ENT ONE introuvables. Ajoutez l\'intégration ENT ONE ou renseignez « config_entry_id ».',
    unavailable: 'L\'ENT est indisponible. Son contenu s\'affichera après la prochaine mise à jour réussie.',
    up_to_date: 'À jour',
    partial: 'Mise à jour partielle',
    offline: 'Indisponible',
    refresh: 'Actualiser',
    refresh_failed: 'Actualisation impossible :',
    open_ent: 'Ouvrir l\'ENT',
    show_full: 'Afficher la carte complète',
    show_compact: 'Revenir à la vue compacte',
    children: '{n} enfants',
    tile_messages: 'non lus',
    tile_words: 'à signer',
    tile_homework: 'devoirs',
    section_words: 'Carnet de liaison',
    section_homework: 'Devoirs',
    section_messages: 'Messages',
    section_news: 'Actualités',
    section_events: 'Agenda',
    sign: 'Signer',
    signed: 'Signé',
    sign_title: 'Signer ce mot ?',
    sign_text: 'L\'ENT enregistre que vous avez lu « {title} » pour {child}. Impossible d\'annuler.',
    cancel: 'Annuler',
    close: 'Fermer',
    confirm: 'Signer',
    signing: 'Signature…',
    mark_done: 'Marquer comme fait',
    mark_todo: 'Marquer comme à faire',
    no_words: 'Aucun mot à signer',
    no_homework: 'Aucun devoir à faire',
    no_messages: 'Aucun message non lu',
    no_news: 'Aucune actualité',
    no_events: 'Rien de prévu',
    today: 'Aujourd\'hui',
    tomorrow: 'Demain',
    yesterday: 'Hier',
    due: 'pour {day}',
    due_today: 'pour aujourd\'hui',
    due_tomorrow: 'pour demain',
    all_day: 'Toute la journée',
    attachment: 'Pièce jointe',
    more: '+{n} autres',
    action_failed: 'L\'ENT a refusé l\'action :',
    tab_home: 'Accueil',
    tab_homework: 'Devoirs',
    tab_words: 'Carnet',
    tab_messages: 'Messages',
    tab_news: 'Actualités',
    tab_settings: 'Réglages',
    all: 'Tous',
    hide_done: 'Masquer les faits',
    no_account: 'Aucun compte ENT ONE chargé. Ajoutez l\'intégration dans Paramètres → Appareils et services.',
    account: 'Compte',
    settings_scan: 'Intervalle de mise à jour (minutes)',
    settings_scan_hint: 'L\'ENT est partagé par toute l\'école : 10 minutes minimum.',
    settings_days: 'Fenêtre des devoirs (jours)',
    settings_notify: 'Actions de notification',
    settings_notify_hint: 'Les nouveaux messages, mots à signer et devoirs sont envoyés à ces actions.',
    settings_panel: 'Afficher ce panneau dans la barre latérale',
    save: 'Enregistrer',
    saved: 'Enregistré. Le compte se recharge avec les nouveaux réglages.',
    admin_only: 'Seul un administrateur peut modifier ces réglages.',
    last_update: 'Mis à jour {time}',
    editor_entry: 'Compte ENT ONE',
    editor_title: 'Titre',
    editor_show_title: 'Afficher le titre',
    editor_show_refresh: 'Afficher le bouton Actualiser',
    editor_show_words: 'Afficher le carnet de liaison',
    editor_show_homework: 'Afficher les devoirs',
    editor_show_done: 'Afficher les devoirs faits',
    editor_show_messages: 'Afficher les messages',
    editor_show_news: 'Afficher les actualités',
    editor_show_events: 'Afficher l\'agenda',
    editor_show_empty: 'Afficher les sections vides',
    editor_max_items: 'Éléments par section',
    editor_language: 'Langue',
    editor_lang_auto: 'Automatique',
  },
  de: {
    no_entity: "ENT-ONE-Sensoren nicht gefunden. Füge die ENT-ONE-Integration hinzu oder setze „config_entry_id“.",
    unavailable: "Das ENT ist nicht erreichbar. Die Inhalte erscheinen nach der nächsten erfolgreichen Aktualisierung.",
    up_to_date: "Aktuell",
    partial: "Teilweise aktualisiert",
    offline: "Nicht verfügbar",
    refresh: "Aktualisieren",
    refresh_failed: "Aktualisierung fehlgeschlagen:",
    open_ent: "ENT öffnen",
    show_full: "Vollständige Karte anzeigen",
    show_compact: "Zurück zur kompakten Ansicht",
    children: "{n} Kinder",
    tile_messages: "ungelesen",
    tile_words: "zu unterschreiben",
    tile_homework: "Hausaufgaben",
    section_words: "Mitteilungsheft",
    section_homework: "Hausaufgaben",
    section_messages: "Nachrichten",
    section_news: "Neuigkeiten",
    section_events: "Kalender",
    sign: "Unterschreiben",
    signed: "Unterschrieben",
    sign_title: "Diese Mitteilung unterschreiben?",
    sign_text: "Das ENT vermerkt, dass du „{title}“ für {child} gelesen hast. Das lässt sich nicht rückgängig machen.",
    cancel: "Abbrechen",
    close: "Schließen",
    confirm: "Unterschreiben",
    signing: "Wird unterschrieben…",
    mark_done: "Als erledigt markieren",
    mark_todo: "Als nicht erledigt markieren",
    no_words: "Nichts zu unterschreiben",
    no_homework: "Keine Hausaufgaben",
    no_messages: "Keine ungelesene Nachricht",
    no_news: "Keine Neuigkeiten",
    no_events: "Nichts geplant",
    today: "Heute",
    tomorrow: "Morgen",
    yesterday: "Gestern",
    due: "bis {day}",
    due_today: "bis heute",
    due_tomorrow: "bis morgen",
    all_day: "Ganztägig",
    attachment: "Anhang",
    more: "+{n} weitere",
    action_failed: "Das ENT hat die Aktion abgelehnt:",
    tab_home: "Start",
    tab_homework: "Hausaufgaben",
    tab_words: "Mitteilungsheft",
    tab_messages: "Nachrichten",
    tab_news: "Neuigkeiten",
    tab_settings: "Einstellungen",
    all: "Alle",
    hide_done: "Erledigte ausblenden",
    no_account: "Kein ENT-ONE-Konto geladen. Füge die Integration unter Einstellungen → Geräte & Dienste hinzu.",
    account: "Konto",
    settings_scan: "Aktualisierungsintervall (Minuten)",
    settings_scan_hint: "Das ENT wird von der ganzen Schule genutzt: mindestens 10 Minuten.",
    settings_days: "Zeitraum für Hausaufgaben (Tage)",
    settings_notify: "Benachrichtigungsaktionen",
    settings_notify_hint: "Neue Nachrichten, zu unterschreibende Mitteilungen und Hausaufgaben werden an diese Aktionen gesendet.",
    settings_panel: "Dieses Panel in der Seitenleiste anzeigen",
    save: "Speichern",
    saved: "Gespeichert. Das Konto wird mit den neuen Einstellungen neu geladen.",
    admin_only: "Nur ein Administrator kann diese Einstellungen ändern.",
    last_update: "Aktualisiert {time}",
    editor_entry: "ENT-ONE-Konto",
    editor_title: "Titel",
    editor_show_title: "Titel anzeigen",
    editor_show_refresh: "Aktualisieren-Schaltfläche anzeigen",
    editor_show_words: "Mitteilungsheft anzeigen",
    editor_show_homework: "Hausaufgaben anzeigen",
    editor_show_done: "Erledigte Hausaufgaben anzeigen",
    editor_show_messages: "Nachrichten anzeigen",
    editor_show_news: "Neuigkeiten anzeigen",
    editor_show_events: "Kalender anzeigen",
    editor_show_empty: "Leere Abschnitte anzeigen",
    editor_max_items: "Einträge pro Abschnitt",
    editor_language: "Sprache",
    editor_lang_auto: "Automatisch",
  },
  es: {
    no_entity: "No se encuentran los sensores de ENT ONE. Añade la integración ENT ONE o indica «config_entry_id».",
    unavailable: "El ENT no está disponible. Su contenido aparecerá tras la próxima actualización correcta.",
    up_to_date: "Actualizado",
    partial: "Actualización parcial",
    offline: "No disponible",
    refresh: "Actualizar",
    refresh_failed: "No se pudo actualizar:",
    open_ent: "Abrir el ENT",
    show_full: "Mostrar la tarjeta completa",
    show_compact: "Volver a la vista compacta",
    children: "{n} hijos",
    tile_messages: "sin leer",
    tile_words: "por firmar",
    tile_homework: "deberes",
    section_words: "Cuaderno de enlace",
    section_homework: "Deberes",
    section_messages: "Mensajes",
    section_news: "Noticias",
    section_events: "Agenda",
    sign: "Firmar",
    signed: "Firmado",
    sign_title: "¿Firmar esta nota?",
    sign_text: "El ENT registra que has leído «{title}» para {child}. No se puede deshacer.",
    cancel: "Cancelar",
    close: "Cerrar",
    confirm: "Firmar",
    signing: "Firmando…",
    mark_done: "Marcar como hecho",
    mark_todo: "Marcar como pendiente",
    no_words: "Ninguna nota por firmar",
    no_homework: "Ningún deber pendiente",
    no_messages: "Ningún mensaje sin leer",
    no_news: "Ninguna noticia",
    no_events: "Nada previsto",
    today: "Hoy",
    tomorrow: "Mañana",
    yesterday: "Ayer",
    due: "para {day}",
    due_today: "para hoy",
    due_tomorrow: "para mañana",
    all_day: "Todo el día",
    attachment: "Adjunto",
    more: "+{n} más",
    action_failed: "El ENT rechazó la acción:",
    tab_home: "Inicio",
    tab_homework: "Deberes",
    tab_words: "Cuaderno",
    tab_messages: "Mensajes",
    tab_news: "Noticias",
    tab_settings: "Ajustes",
    all: "Todos",
    hide_done: "Ocultar los hechos",
    no_account: "No hay ninguna cuenta ENT ONE cargada. Añade la integración en Ajustes → Dispositivos y servicios.",
    account: "Cuenta",
    settings_scan: "Intervalo de actualización (minutos)",
    settings_scan_hint: "El ENT lo comparte toda la escuela: 10 minutos como mínimo.",
    settings_days: "Ventana de deberes (días)",
    settings_notify: "Acciones de notificación",
    settings_notify_hint: "Los nuevos mensajes, notas por firmar y deberes se envían a estas acciones.",
    settings_panel: "Mostrar este panel en la barra lateral",
    save: "Guardar",
    saved: "Guardado. La cuenta se recarga con los nuevos ajustes.",
    admin_only: "Solo un administrador puede cambiar estos ajustes.",
    last_update: "Actualizado {time}",
    editor_entry: "Cuenta ENT ONE",
    editor_title: "Título",
    editor_show_title: "Mostrar el título",
    editor_show_refresh: "Mostrar el botón Actualizar",
    editor_show_words: "Mostrar el cuaderno de enlace",
    editor_show_homework: "Mostrar los deberes",
    editor_show_done: "Mostrar los deberes hechos",
    editor_show_messages: "Mostrar los mensajes",
    editor_show_news: "Mostrar las noticias",
    editor_show_events: "Mostrar la agenda",
    editor_show_empty: "Mostrar las secciones vacías",
    editor_max_items: "Elementos por sección",
    editor_language: "Idioma",
    editor_lang_auto: "Automático",
  },
  sr: {
    no_entity: "Сензори ENT ONE нису пронађени. Додајте интеграцију ENT ONE или подесите „config_entry_id“.",
    unavailable: "ENT није доступан. Садржај ће се приказати после следећег успешног ажурирања.",
    up_to_date: "Ажурно",
    partial: "Делимично ажурирано",
    offline: "Недоступно",
    refresh: "Освежи",
    refresh_failed: "Освежавање није успело:",
    open_ent: "Отвори ENT",
    show_full: "Прикажи целу картицу",
    show_compact: "Назад на сажети приказ",
    children: "Деце: {n}",
    tile_messages: "непрочитано",
    tile_words: "за потпис",
    tile_homework: "домаћи",
    section_words: "Ђачка књижица",
    section_homework: "Домаћи задаци",
    section_messages: "Поруке",
    section_news: "Вести",
    section_events: "Календар",
    sign: "Потпиши",
    signed: "Потписано",
    sign_title: "Потписати ову белешку?",
    sign_text: "ENT бележи да сте прочитали „{title}“ за {child}. Ово се не може опозвати.",
    cancel: "Откажи",
    close: "Затвори",
    confirm: "Потпиши",
    signing: "Потписивање…",
    mark_done: "Означи као урађено",
    mark_todo: "Означи као неурађено",
    no_words: "Ништа за потпис",
    no_homework: "Нема домаћих задатака",
    no_messages: "Нема непрочитаних порука",
    no_news: "Нема вести",
    no_events: "Ништа није планирано",
    today: "Данас",
    tomorrow: "Сутра",
    yesterday: "Јуче",
    due: "за {day}",
    due_today: "за данас",
    due_tomorrow: "за сутра",
    all_day: "Цео дан",
    attachment: "Прилог",
    more: "+још {n}",
    action_failed: "ENT је одбио радњу:",
    tab_home: "Почетна",
    tab_homework: "Домаћи",
    tab_words: "Књижица",
    tab_messages: "Поруке",
    tab_news: "Вести",
    tab_settings: "Подешавања",
    all: "Све",
    hide_done: "Сакриј урађене",
    no_account: "Ниједан ENT ONE налог није учитан. Додајте интеграцију у Подешавања → Уређаји и услуге.",
    account: "Налог",
    settings_scan: "Интервал ажурирања (минути)",
    settings_scan_hint: "ENT користи цела школа: најмање 10 минута.",
    settings_days: "Период домаћих задатака (дани)",
    settings_notify: "Радње обавештења",
    settings_notify_hint: "Нове поруке, белешке за потпис и домаћи задаци шаљу се овим радњама.",
    settings_panel: "Прикажи овај панел на бочној траци",
    save: "Сачувај",
    saved: "Сачувано. Налог се поново учитава са новим подешавањима.",
    admin_only: "Само администратор може да мења ова подешавања.",
    last_update: "Ажурирано {time}",
    editor_entry: "ENT ONE налог",
    editor_title: "Наслов",
    editor_show_title: "Прикажи наслов",
    editor_show_refresh: "Прикажи дугме Освежи",
    editor_show_words: "Прикажи ђачку књижицу",
    editor_show_homework: "Прикажи домаће задатке",
    editor_show_done: "Прикажи урађене задатке",
    editor_show_messages: "Прикажи поруке",
    editor_show_news: "Прикажи вести",
    editor_show_events: "Прикажи календар",
    editor_show_empty: "Прикажи празне одељке",
    editor_max_items: "Ставки по одељку",
    editor_language: "Језик",
    editor_lang_auto: "Аутоматски",
  },
  'sr-Latn': {
    no_entity: "Senzori ENT ONE nisu pronađeni. Dodajte integraciju ENT ONE ili podesite „config_entry_id“.",
    unavailable: "ENT nije dostupan. Sadržaj će se prikazati posle sledećeg uspešnog ažuriranja.",
    up_to_date: "Ažurno",
    partial: "Delimično ažurirano",
    offline: "Nedostupno",
    refresh: "Osveži",
    refresh_failed: "Osvežavanje nije uspelo:",
    open_ent: "Otvori ENT",
    show_full: "Prikaži celu karticu",
    show_compact: "Nazad na sažeti prikaz",
    children: "Dece: {n}",
    tile_messages: "nepročitano",
    tile_words: "za potpis",
    tile_homework: "domaći",
    section_words: "Đačka knjižica",
    section_homework: "Domaći zadaci",
    section_messages: "Poruke",
    section_news: "Vesti",
    section_events: "Kalendar",
    sign: "Potpiši",
    signed: "Potpisano",
    sign_title: "Potpisati ovu belešku?",
    sign_text: "ENT beleži da ste pročitali „{title}“ za {child}. Ovo se ne može opozvati.",
    cancel: "Otkaži",
    close: "Zatvori",
    confirm: "Potpiši",
    signing: "Potpisivanje…",
    mark_done: "Označi kao urađeno",
    mark_todo: "Označi kao neurađeno",
    no_words: "Ništa za potpis",
    no_homework: "Nema domaćih zadataka",
    no_messages: "Nema nepročitanih poruka",
    no_news: "Nema vesti",
    no_events: "Ništa nije planirano",
    today: "Danas",
    tomorrow: "Sutra",
    yesterday: "Juče",
    due: "za {day}",
    due_today: "za danas",
    due_tomorrow: "za sutra",
    all_day: "Ceo dan",
    attachment: "Prilog",
    more: "+još {n}",
    action_failed: "ENT je odbio radnju:",
    tab_home: "Početna",
    tab_homework: "Domaći",
    tab_words: "Knjižica",
    tab_messages: "Poruke",
    tab_news: "Vesti",
    tab_settings: "Podešavanja",
    all: "Sve",
    hide_done: "Sakrij urađene",
    no_account: "Nijedan ENT ONE nalog nije učitan. Dodajte integraciju u Podešavanja → Uređaji i usluge.",
    account: "Nalog",
    settings_scan: "Interval ažuriranja (minuti)",
    settings_scan_hint: "ENT koristi cela škola: najmanje 10 minuta.",
    settings_days: "Period domaćih zadataka (dani)",
    settings_notify: "Radnje obaveštenja",
    settings_notify_hint: "Nove poruke, beleške za potpis i domaći zadaci šalju se ovim radnjama.",
    settings_panel: "Prikaži ovaj panel na bočnoj traci",
    save: "Sačuvaj",
    saved: "Sačuvano. Nalog se ponovo učitava sa novim podešavanjima.",
    admin_only: "Samo administrator može da menja ova podešavanja.",
    last_update: "Ažurirano {time}",
    editor_entry: "ENT ONE nalog",
    editor_title: "Naslov",
    editor_show_title: "Prikaži naslov",
    editor_show_refresh: "Prikaži dugme Osveži",
    editor_show_words: "Prikaži đačku knjižicu",
    editor_show_homework: "Prikaži domaće zadatke",
    editor_show_done: "Prikaži urađene zadatke",
    editor_show_messages: "Prikaži poruke",
    editor_show_news: "Prikaži vesti",
    editor_show_events: "Prikaži kalendar",
    editor_show_empty: "Prikaži prazne odeljke",
    editor_max_items: "Stavki po odeljku",
    editor_language: "Jezik",
    editor_lang_auto: "Automatski",
  },
  it: {
    no_entity: "Sensori ENT ONE non trovati. Aggiungi l'integrazione ENT ONE o imposta \"config_entry_id\".",
    unavailable: "L'ENT non è disponibile. Il contenuto apparirà dopo il prossimo aggiornamento riuscito.",
    up_to_date: "Aggiornato",
    partial: "Aggiornamento parziale",
    offline: "Non disponibile",
    refresh: "Aggiorna",
    refresh_failed: "Aggiornamento non riuscito:",
    open_ent: "Apri l'ENT",
    show_full: "Mostra la scheda completa",
    show_compact: "Torna alla vista compatta",
    children: "{n} figli",
    tile_messages: "non letti",
    tile_words: "da firmare",
    tile_homework: "compiti",
    section_words: "Diario",
    section_homework: "Compiti",
    section_messages: "Messaggi",
    section_news: "Notizie",
    section_events: "Agenda",
    sign: "Firma",
    signed: "Firmato",
    sign_title: "Firmare questo avviso?",
    sign_text: "L'ENT registra che hai letto «{title}» per {child}. Non si può annullare.",
    cancel: "Annulla",
    close: "Chiudi",
    confirm: "Firma",
    signing: "Firma in corso…",
    mark_done: "Segna come fatto",
    mark_todo: "Segna come da fare",
    no_words: "Nessun avviso da firmare",
    no_homework: "Nessun compito da fare",
    no_messages: "Nessun messaggio non letto",
    no_news: "Nessuna notizia",
    no_events: "Niente in programma",
    today: "Oggi",
    tomorrow: "Domani",
    yesterday: "Ieri",
    due: "per {day}",
    due_today: "per oggi",
    due_tomorrow: "per domani",
    all_day: "Tutto il giorno",
    attachment: "Allegato",
    more: "+{n} altri",
    action_failed: "L'ENT ha rifiutato l'azione:",
    tab_home: "Home",
    tab_homework: "Compiti",
    tab_words: "Diario",
    tab_messages: "Messaggi",
    tab_news: "Notizie",
    tab_settings: "Impostazioni",
    all: "Tutti",
    hide_done: "Nascondi i fatti",
    no_account: "Nessun account ENT ONE caricato. Aggiungi l'integrazione in Impostazioni → Dispositivi e servizi.",
    account: "Account",
    settings_scan: "Intervallo di aggiornamento (minuti)",
    settings_scan_hint: "L'ENT è condiviso da tutta la scuola: almeno 10 minuti.",
    settings_days: "Finestra dei compiti (giorni)",
    settings_notify: "Azioni di notifica",
    settings_notify_hint: "Nuovi messaggi, avvisi da firmare e compiti vengono inviati a queste azioni.",
    settings_panel: "Mostra questo pannello nella barra laterale",
    save: "Salva",
    saved: "Salvato. L'account si ricarica con le nuove impostazioni.",
    admin_only: "Solo un amministratore può modificare queste impostazioni.",
    last_update: "Aggiornato {time}",
    editor_entry: "Account ENT ONE",
    editor_title: "Titolo",
    editor_show_title: "Mostra il titolo",
    editor_show_refresh: "Mostra il pulsante Aggiorna",
    editor_show_words: "Mostra il diario",
    editor_show_homework: "Mostra i compiti",
    editor_show_done: "Mostra i compiti fatti",
    editor_show_messages: "Mostra i messaggi",
    editor_show_news: "Mostra le notizie",
    editor_show_events: "Mostra l'agenda",
    editor_show_empty: "Mostra le sezioni vuote",
    editor_max_items: "Elementi per sezione",
    editor_language: "Lingua",
    editor_lang_auto: "Automatica",
  },
  nl: {
    no_entity: "ENT ONE-sensoren niet gevonden. Voeg de ENT ONE-integratie toe of vul \"config_entry_id\" in.",
    unavailable: "De ENT is niet beschikbaar. De inhoud verschijnt na de volgende geslaagde update.",
    up_to_date: "Bijgewerkt",
    partial: "Deels bijgewerkt",
    offline: "Niet beschikbaar",
    refresh: "Vernieuwen",
    refresh_failed: "Vernieuwen mislukt:",
    open_ent: "ENT openen",
    show_full: "Volledige kaart tonen",
    show_compact: "Terug naar de compacte weergave",
    children: "{n} kinderen",
    tile_messages: "ongelezen",
    tile_words: "te ondertekenen",
    tile_homework: "huiswerk",
    section_words: "Heen-en-weerschrift",
    section_homework: "Huiswerk",
    section_messages: "Berichten",
    section_news: "Nieuws",
    section_events: "Agenda",
    sign: "Ondertekenen",
    signed: "Ondertekend",
    sign_title: "Dit bericht ondertekenen?",
    sign_text: "De ENT registreert dat je \"{title}\" voor {child} hebt gelezen. Dit kan niet ongedaan worden gemaakt.",
    cancel: "Annuleren",
    close: "Sluiten",
    confirm: "Ondertekenen",
    signing: "Ondertekenen…",
    mark_done: "Markeren als klaar",
    mark_todo: "Markeren als niet klaar",
    no_words: "Niets te ondertekenen",
    no_homework: "Geen huiswerk",
    no_messages: "Geen ongelezen bericht",
    no_news: "Geen nieuws",
    no_events: "Niets gepland",
    today: "Vandaag",
    tomorrow: "Morgen",
    yesterday: "Gisteren",
    due: "voor {day}",
    due_today: "voor vandaag",
    due_tomorrow: "voor morgen",
    all_day: "Hele dag",
    attachment: "Bijlage",
    more: "+{n} meer",
    action_failed: "De ENT weigerde de actie:",
    tab_home: "Start",
    tab_homework: "Huiswerk",
    tab_words: "Schrift",
    tab_messages: "Berichten",
    tab_news: "Nieuws",
    tab_settings: "Instellingen",
    all: "Alle",
    hide_done: "Klaar verbergen",
    no_account: "Geen ENT ONE-account geladen. Voeg de integratie toe via Instellingen → Apparaten en diensten.",
    account: "Account",
    settings_scan: "Update-interval (minuten)",
    settings_scan_hint: "De ENT wordt door de hele school gedeeld: minimaal 10 minuten.",
    settings_days: "Huiswerkperiode (dagen)",
    settings_notify: "Meldingsacties",
    settings_notify_hint: "Nieuwe berichten, te ondertekenen berichten en huiswerk worden naar deze acties gestuurd.",
    settings_panel: "Dit paneel in de zijbalk tonen",
    save: "Opslaan",
    saved: "Opgeslagen. Het account wordt herladen met de nieuwe instellingen.",
    admin_only: "Alleen een beheerder kan deze instellingen wijzigen.",
    last_update: "Bijgewerkt {time}",
    editor_entry: "ENT ONE-account",
    editor_title: "Titel",
    editor_show_title: "Titel tonen",
    editor_show_refresh: "Vernieuwknop tonen",
    editor_show_words: "Heen-en-weerschrift tonen",
    editor_show_homework: "Huiswerk tonen",
    editor_show_done: "Gemaakt huiswerk tonen",
    editor_show_messages: "Berichten tonen",
    editor_show_news: "Nieuws tonen",
    editor_show_events: "Agenda tonen",
    editor_show_empty: "Lege secties tonen",
    editor_max_items: "Items per sectie",
    editor_language: "Taal",
    editor_lang_auto: "Automatisch",
  },
  pt: {
    no_entity: "Sensores ENT ONE não encontrados. Adicione a integração ENT ONE ou defina \"config_entry_id\".",
    unavailable: "O ENT está indisponível. O conteúdo aparecerá após a próxima atualização bem-sucedida.",
    up_to_date: "Atualizado",
    partial: "Atualização parcial",
    offline: "Indisponível",
    refresh: "Atualizar",
    refresh_failed: "Falha ao atualizar:",
    open_ent: "Abrir o ENT",
    show_full: "Mostrar o cartão completo",
    show_compact: "Voltar à vista compacta",
    children: "{n} filhos",
    tile_messages: "por ler",
    tile_words: "por assinar",
    tile_homework: "trabalhos de casa",
    section_words: "Caderneta",
    section_homework: "Trabalhos de casa",
    section_messages: "Mensagens",
    section_news: "Notícias",
    section_events: "Agenda",
    sign: "Assinar",
    signed: "Assinado",
    sign_title: "Assinar esta nota?",
    sign_text: "O ENT regista que leu «{title}» para {child}. Não é possível anular.",
    cancel: "Cancelar",
    close: "Fechar",
    confirm: "Assinar",
    signing: "A assinar…",
    mark_done: "Marcar como feito",
    mark_todo: "Marcar como por fazer",
    no_words: "Nenhuma nota por assinar",
    no_homework: "Nenhum trabalho de casa",
    no_messages: "Nenhuma mensagem por ler",
    no_news: "Nenhuma notícia",
    no_events: "Nada previsto",
    today: "Hoje",
    tomorrow: "Amanhã",
    yesterday: "Ontem",
    due: "para {day}",
    due_today: "para hoje",
    due_tomorrow: "para amanhã",
    all_day: "Todo o dia",
    attachment: "Anexo",
    more: "+{n} mais",
    action_failed: "O ENT recusou a ação:",
    tab_home: "Início",
    tab_homework: "Trabalhos",
    tab_words: "Caderneta",
    tab_messages: "Mensagens",
    tab_news: "Notícias",
    tab_settings: "Definições",
    all: "Todos",
    hide_done: "Ocultar os feitos",
    no_account: "Nenhuma conta ENT ONE carregada. Adicione a integração em Definições → Dispositivos e serviços.",
    account: "Conta",
    settings_scan: "Intervalo de atualização (minutos)",
    settings_scan_hint: "O ENT é partilhado por toda a escola: 10 minutos no mínimo.",
    settings_days: "Janela dos trabalhos (dias)",
    settings_notify: "Ações de notificação",
    settings_notify_hint: "Novas mensagens, notas por assinar e trabalhos de casa são enviados para estas ações.",
    settings_panel: "Mostrar este painel na barra lateral",
    save: "Guardar",
    saved: "Guardado. A conta recarrega com as novas definições.",
    admin_only: "Só um administrador pode alterar estas definições.",
    last_update: "Atualizado {time}",
    editor_entry: "Conta ENT ONE",
    editor_title: "Título",
    editor_show_title: "Mostrar o título",
    editor_show_refresh: "Mostrar o botão Atualizar",
    editor_show_words: "Mostrar a caderneta",
    editor_show_homework: "Mostrar os trabalhos de casa",
    editor_show_done: "Mostrar os trabalhos feitos",
    editor_show_messages: "Mostrar as mensagens",
    editor_show_news: "Mostrar as notícias",
    editor_show_events: "Mostrar a agenda",
    editor_show_empty: "Mostrar as secções vazias",
    editor_max_items: "Elementos por secção",
    editor_language: "Idioma",
    editor_lang_auto: "Automático",
  },
  pl: {
    no_entity: "Nie znaleziono czujników ENT ONE. Dodaj integrację ENT ONE lub ustaw „config_entry_id”.",
    unavailable: "ENT jest niedostępny. Treść pojawi się po następnej udanej aktualizacji.",
    up_to_date: "Aktualne",
    partial: "Częściowo zaktualizowane",
    offline: "Niedostępny",
    refresh: "Odśwież",
    refresh_failed: "Nie udało się odświeżyć:",
    open_ent: "Otwórz ENT",
    show_full: "Pokaż pełną kartę",
    show_compact: "Wróć do widoku kompaktowego",
    children: "Dzieci: {n}",
    tile_messages: "nieprzeczytane",
    tile_words: "do podpisania",
    tile_homework: "prace domowe",
    section_words: "Dzienniczek",
    section_homework: "Prace domowe",
    section_messages: "Wiadomości",
    section_news: "Aktualności",
    section_events: "Kalendarz",
    sign: "Podpisz",
    signed: "Podpisano",
    sign_title: "Podpisać tę uwagę?",
    sign_text: "ENT zapisze, że przeczytano „{title}” dla: {child}. Nie można tego cofnąć.",
    cancel: "Anuluj",
    close: "Zamknij",
    confirm: "Podpisz",
    signing: "Podpisywanie…",
    mark_done: "Oznacz jako zrobione",
    mark_todo: "Oznacz jako niezrobione",
    no_words: "Nic do podpisania",
    no_homework: "Brak prac domowych",
    no_messages: "Brak nieprzeczytanych wiadomości",
    no_news: "Brak aktualności",
    no_events: "Nic nie zaplanowano",
    today: "Dziś",
    tomorrow: "Jutro",
    yesterday: "Wczoraj",
    due: "na {day}",
    due_today: "na dziś",
    due_tomorrow: "na jutro",
    all_day: "Cały dzień",
    attachment: "Załącznik",
    more: "+{n} więcej",
    action_failed: "ENT odrzucił operację:",
    tab_home: "Start",
    tab_homework: "Prace domowe",
    tab_words: "Dzienniczek",
    tab_messages: "Wiadomości",
    tab_news: "Aktualności",
    tab_settings: "Ustawienia",
    all: "Wszystkie",
    hide_done: "Ukryj zrobione",
    no_account: "Nie załadowano konta ENT ONE. Dodaj integrację w Ustawienia → Urządzenia i usługi.",
    account: "Konto",
    settings_scan: "Interwał aktualizacji (minuty)",
    settings_scan_hint: "Z ENT korzysta cała szkoła: co najmniej 10 minut.",
    settings_days: "Okres prac domowych (dni)",
    settings_notify: "Akcje powiadomień",
    settings_notify_hint: "Nowe wiadomości, uwagi do podpisania i prace domowe są wysyłane do tych akcji.",
    settings_panel: "Pokaż ten panel na pasku bocznym",
    save: "Zapisz",
    saved: "Zapisano. Konto zostanie przeładowane z nowymi ustawieniami.",
    admin_only: "Tylko administrator może zmienić te ustawienia.",
    last_update: "Zaktualizowano {time}",
    editor_entry: "Konto ENT ONE",
    editor_title: "Tytuł",
    editor_show_title: "Pokaż tytuł",
    editor_show_refresh: "Pokaż przycisk Odśwież",
    editor_show_words: "Pokaż dzienniczek",
    editor_show_homework: "Pokaż prace domowe",
    editor_show_done: "Pokaż zrobione prace",
    editor_show_messages: "Pokaż wiadomości",
    editor_show_news: "Pokaż aktualności",
    editor_show_events: "Pokaż kalendarz",
    editor_show_empty: "Pokaż puste sekcje",
    editor_max_items: "Elementy na sekcję",
    editor_language: "Język",
    editor_lang_auto: "Automatycznie",
  },
  ro: {
    no_entity: "Senzorii ENT ONE nu au fost găsiți. Adaugă integrarea ENT ONE sau setează „config_entry_id”.",
    unavailable: "ENT-ul nu este disponibil. Conținutul va apărea după următoarea actualizare reușită.",
    up_to_date: "Actualizat",
    partial: "Actualizat parțial",
    offline: "Indisponibil",
    refresh: "Reîmprospătează",
    refresh_failed: "Reîmprospătare eșuată:",
    open_ent: "Deschide ENT-ul",
    show_full: "Afișează cardul complet",
    show_compact: "Înapoi la vizualizarea compactă",
    children: "{n} copii",
    tile_messages: "necitite",
    tile_words: "de semnat",
    tile_homework: "teme",
    section_words: "Carnet de corespondență",
    section_homework: "Teme",
    section_messages: "Mesaje",
    section_news: "Noutăți",
    section_events: "Calendar",
    sign: "Semnează",
    signed: "Semnat",
    sign_title: "Semnezi acest mesaj?",
    sign_text: "ENT-ul înregistrează că ai citit „{title}” pentru {child}. Nu se poate anula.",
    cancel: "Anulează",
    close: "Închide",
    confirm: "Semnează",
    signing: "Se semnează…",
    mark_done: "Marchează ca făcut",
    mark_todo: "Marchează ca nefăcut",
    no_words: "Nimic de semnat",
    no_homework: "Nicio temă",
    no_messages: "Niciun mesaj necitit",
    no_news: "Nicio noutate",
    no_events: "Nimic planificat",
    today: "Azi",
    tomorrow: "Mâine",
    yesterday: "Ieri",
    due: "pentru {day}",
    due_today: "pentru azi",
    due_tomorrow: "pentru mâine",
    all_day: "Toată ziua",
    attachment: "Atașament",
    more: "+încă {n}",
    action_failed: "ENT-ul a refuzat acțiunea:",
    tab_home: "Acasă",
    tab_homework: "Teme",
    tab_words: "Carnet",
    tab_messages: "Mesaje",
    tab_news: "Noutăți",
    tab_settings: "Setări",
    all: "Toate",
    hide_done: "Ascunde cele făcute",
    no_account: "Niciun cont ENT ONE încărcat. Adaugă integrarea din Setări → Dispozitive și servicii.",
    account: "Cont",
    settings_scan: "Interval de actualizare (minute)",
    settings_scan_hint: "ENT-ul este folosit de toată școala: minimum 10 minute.",
    settings_days: "Perioada temelor (zile)",
    settings_notify: "Acțiuni de notificare",
    settings_notify_hint: "Mesajele noi, mesajele de semnat și temele sunt trimise acestor acțiuni.",
    settings_panel: "Afișează acest panou în bara laterală",
    save: "Salvează",
    saved: "Salvat. Contul se reîncarcă cu noile setări.",
    admin_only: "Doar un administrator poate modifica aceste setări.",
    last_update: "Actualizat {time}",
    editor_entry: "Cont ENT ONE",
    editor_title: "Titlu",
    editor_show_title: "Afișează titlul",
    editor_show_refresh: "Afișează butonul Reîmprospătează",
    editor_show_words: "Afișează carnetul",
    editor_show_homework: "Afișează temele",
    editor_show_done: "Afișează temele făcute",
    editor_show_messages: "Afișează mesajele",
    editor_show_news: "Afișează noutățile",
    editor_show_events: "Afișează calendarul",
    editor_show_empty: "Afișează secțiunile goale",
    editor_max_items: "Elemente pe secțiune",
    editor_language: "Limbă",
    editor_lang_auto: "Automat",
  },
  da: {
    no_entity: "ENT ONE-sensorer blev ikke fundet. Tilføj ENT ONE-integrationen, eller angiv \"config_entry_id\".",
    unavailable: "ENT er ikke tilgængelig. Indholdet vises efter næste vellykkede opdatering.",
    up_to_date: "Opdateret",
    partial: "Delvist opdateret",
    offline: "Utilgængelig",
    refresh: "Opdater",
    refresh_failed: "Opdatering mislykkedes:",
    open_ent: "Åbn ENT",
    show_full: "Vis hele kortet",
    show_compact: "Tilbage til kompakt visning",
    children: "{n} børn",
    tile_messages: "ulæste",
    tile_words: "til underskrift",
    tile_homework: "lektier",
    section_words: "Kontaktbog",
    section_homework: "Lektier",
    section_messages: "Beskeder",
    section_news: "Nyheder",
    section_events: "Kalender",
    sign: "Underskriv",
    signed: "Underskrevet",
    sign_title: "Underskriv denne besked?",
    sign_text: "ENT registrerer, at du har læst \"{title}\" for {child}. Det kan ikke fortrydes.",
    cancel: "Annuller",
    close: "Luk",
    confirm: "Underskriv",
    signing: "Underskriver…",
    mark_done: "Marker som udført",
    mark_todo: "Marker som ikke udført",
    no_words: "Intet at underskrive",
    no_homework: "Ingen lektier",
    no_messages: "Ingen ulæste beskeder",
    no_news: "Ingen nyheder",
    no_events: "Intet planlagt",
    today: "I dag",
    tomorrow: "I morgen",
    yesterday: "I går",
    due: "til {day}",
    due_today: "til i dag",
    due_tomorrow: "til i morgen",
    all_day: "Hele dagen",
    attachment: "Vedhæftet fil",
    more: "+{n} mere",
    action_failed: "ENT afviste handlingen:",
    tab_home: "Start",
    tab_homework: "Lektier",
    tab_words: "Kontaktbog",
    tab_messages: "Beskeder",
    tab_news: "Nyheder",
    tab_settings: "Indstillinger",
    all: "Alle",
    hide_done: "Skjul udførte",
    no_account: "Ingen ENT ONE-konto er indlæst. Tilføj integrationen under Indstillinger → Enheder og tjenester.",
    account: "Konto",
    settings_scan: "Opdateringsinterval (minutter)",
    settings_scan_hint: "ENT deles af hele skolen: mindst 10 minutter.",
    settings_days: "Lektieperiode (dage)",
    settings_notify: "Notifikationshandlinger",
    settings_notify_hint: "Nye beskeder, beskeder til underskrift og lektier sendes til disse handlinger.",
    settings_panel: "Vis dette panel i sidebjælken",
    save: "Gem",
    saved: "Gemt. Kontoen genindlæses med de nye indstillinger.",
    admin_only: "Kun en administrator kan ændre disse indstillinger.",
    last_update: "Opdateret {time}",
    editor_entry: "ENT ONE-konto",
    editor_title: "Titel",
    editor_show_title: "Vis titlen",
    editor_show_refresh: "Vis opdateringsknappen",
    editor_show_words: "Vis kontaktbogen",
    editor_show_homework: "Vis lektierne",
    editor_show_done: "Vis udførte lektier",
    editor_show_messages: "Vis beskederne",
    editor_show_news: "Vis nyhederne",
    editor_show_events: "Vis kalenderen",
    editor_show_empty: "Vis tomme sektioner",
    editor_max_items: "Elementer pr. sektion",
    editor_language: "Sprog",
    editor_lang_auto: "Automatisk",
  },
  sv: {
    no_entity: "ENT ONE-sensorerna hittades inte. Lägg till ENT ONE-integrationen eller ange \"config_entry_id\".",
    unavailable: "ENT är inte tillgängligt. Innehållet visas efter nästa lyckade uppdatering.",
    up_to_date: "Uppdaterad",
    partial: "Delvis uppdaterad",
    offline: "Inte tillgänglig",
    refresh: "Uppdatera",
    refresh_failed: "Uppdateringen misslyckades:",
    open_ent: "Öppna ENT",
    show_full: "Visa hela kortet",
    show_compact: "Tillbaka till kompakt vy",
    children: "{n} barn",
    tile_messages: "olästa",
    tile_words: "att signera",
    tile_homework: "läxor",
    section_words: "Kontaktbok",
    section_homework: "Läxor",
    section_messages: "Meddelanden",
    section_news: "Nyheter",
    section_events: "Kalender",
    sign: "Signera",
    signed: "Signerad",
    sign_title: "Signera det här meddelandet?",
    sign_text: "ENT registrerar att du har läst \"{title}\" för {child}. Det går inte att ångra.",
    cancel: "Avbryt",
    close: "Stäng",
    confirm: "Signera",
    signing: "Signerar…",
    mark_done: "Markera som klar",
    mark_todo: "Markera som inte klar",
    no_words: "Inget att signera",
    no_homework: "Inga läxor",
    no_messages: "Inga olästa meddelanden",
    no_news: "Inga nyheter",
    no_events: "Inget planerat",
    today: "Idag",
    tomorrow: "Imorgon",
    yesterday: "Igår",
    due: "till {day}",
    due_today: "till idag",
    due_tomorrow: "till imorgon",
    all_day: "Hela dagen",
    attachment: "Bilaga",
    more: "+{n} till",
    action_failed: "ENT avvisade åtgärden:",
    tab_home: "Start",
    tab_homework: "Läxor",
    tab_words: "Kontaktbok",
    tab_messages: "Meddelanden",
    tab_news: "Nyheter",
    tab_settings: "Inställningar",
    all: "Alla",
    hide_done: "Dölj klara",
    no_account: "Inget ENT ONE-konto är inläst. Lägg till integrationen under Inställningar → Enheter och tjänster.",
    account: "Konto",
    settings_scan: "Uppdateringsintervall (minuter)",
    settings_scan_hint: "ENT delas av hela skolan: minst 10 minuter.",
    settings_days: "Läxperiod (dagar)",
    settings_notify: "Aviseringsåtgärder",
    settings_notify_hint: "Nya meddelanden, meddelanden att signera och läxor skickas till dessa åtgärder.",
    settings_panel: "Visa den här panelen i sidofältet",
    save: "Spara",
    saved: "Sparat. Kontot laddas om med de nya inställningarna.",
    admin_only: "Endast en administratör kan ändra dessa inställningar.",
    last_update: "Uppdaterad {time}",
    editor_entry: "ENT ONE-konto",
    editor_title: "Titel",
    editor_show_title: "Visa titeln",
    editor_show_refresh: "Visa uppdateringsknappen",
    editor_show_words: "Visa kontaktboken",
    editor_show_homework: "Visa läxorna",
    editor_show_done: "Visa klara läxor",
    editor_show_messages: "Visa meddelandena",
    editor_show_news: "Visa nyheterna",
    editor_show_events: "Visa kalendern",
    editor_show_empty: "Visa tomma avsnitt",
    editor_max_items: "Objekt per avsnitt",
    editor_language: "Språk",
    editor_lang_auto: "Automatiskt",
  },
  bg: {
    no_entity: "Сензорите на ENT ONE не са намерени. Добавете интеграцията ENT ONE или задайте „config_entry_id“.",
    unavailable: "ENT не е достъпен. Съдържанието ще се покаже след следващото успешно обновяване.",
    up_to_date: "Актуално",
    partial: "Частично обновено",
    offline: "Недостъпно",
    refresh: "Обнови",
    refresh_failed: "Неуспешно обновяване:",
    open_ent: "Отвори ENT",
    show_full: "Покажи цялата карта",
    show_compact: "Обратно към компактния изглед",
    children: "{n} деца",
    tile_messages: "непрочетени",
    tile_words: "за подпис",
    tile_homework: "домашни",
    section_words: "Бележник",
    section_homework: "Домашни",
    section_messages: "Съобщения",
    section_news: "Новини",
    section_events: "Календар",
    sign: "Подпиши",
    signed: "Подписано",
    sign_title: "Да се подпише ли тази бележка?",
    sign_text: "ENT отбелязва, че сте прочели „{title}“ за {child}. Това не може да се отмени.",
    cancel: "Отказ",
    close: "Затвори",
    confirm: "Подпиши",
    signing: "Подписване…",
    mark_done: "Отбележи като готово",
    mark_todo: "Отбележи като неготово",
    no_words: "Няма нищо за подпис",
    no_homework: "Няма домашни",
    no_messages: "Няма непрочетени съобщения",
    no_news: "Няма новини",
    no_events: "Нищо не е планирано",
    today: "Днес",
    tomorrow: "Утре",
    yesterday: "Вчера",
    due: "за {day}",
    due_today: "за днес",
    due_tomorrow: "за утре",
    all_day: "Цял ден",
    attachment: "Прикачен файл",
    more: "+още {n}",
    action_failed: "ENT отказа действието:",
    tab_home: "Начало",
    tab_homework: "Домашни",
    tab_words: "Бележник",
    tab_messages: "Съобщения",
    tab_news: "Новини",
    tab_settings: "Настройки",
    all: "Всички",
    hide_done: "Скрий готовите",
    no_account: "Няма зареден акаунт ENT ONE. Добавете интеграцията от Настройки → Устройства и услуги.",
    account: "Акаунт",
    settings_scan: "Интервал на обновяване (минути)",
    settings_scan_hint: "ENT се ползва от цялото училище: минимум 10 минути.",
    settings_days: "Период за домашните (дни)",
    settings_notify: "Действия за известяване",
    settings_notify_hint: "Новите съобщения, бележките за подпис и домашните се изпращат към тези действия.",
    settings_panel: "Покажи този панел в страничната лента",
    save: "Запази",
    saved: "Запазено. Акаунтът се презарежда с новите настройки.",
    admin_only: "Само администратор може да променя тези настройки.",
    last_update: "Обновено {time}",
    editor_entry: "Акаунт ENT ONE",
    editor_title: "Заглавие",
    editor_show_title: "Покажи заглавието",
    editor_show_refresh: "Покажи бутона за обновяване",
    editor_show_words: "Покажи бележника",
    editor_show_homework: "Покажи домашните",
    editor_show_done: "Покажи готовите домашни",
    editor_show_messages: "Покажи съобщенията",
    editor_show_news: "Покажи новините",
    editor_show_events: "Покажи календара",
    editor_show_empty: "Показвай празните секции",
    editor_max_items: "Елементи в секция",
    editor_language: "Език",
    editor_lang_auto: "Автоматично",
  },
  ru: {
    no_entity: "Датчики ENT ONE не найдены. Добавьте интеграцию ENT ONE или укажите «config_entry_id».",
    unavailable: "ENT недоступен. Содержимое появится после следующего успешного обновления.",
    up_to_date: "Актуально",
    partial: "Обновлено частично",
    offline: "Недоступно",
    refresh: "Обновить",
    refresh_failed: "Не удалось обновить:",
    open_ent: "Открыть ENT",
    show_full: "Показать полную карточку",
    show_compact: "Вернуться к компактному виду",
    children: "Детей: {n}",
    tile_messages: "непрочитанные",
    tile_words: "на подпись",
    tile_homework: "домашние задания",
    section_words: "Дневник",
    section_homework: "Домашние задания",
    section_messages: "Сообщения",
    section_news: "Новости",
    section_events: "Календарь",
    sign: "Подписать",
    signed: "Подписано",
    sign_title: "Подписать эту запись?",
    sign_text: "ENT отметит, что вы прочитали «{title}» для {child}. Это нельзя отменить.",
    cancel: "Отмена",
    close: "Закрыть",
    confirm: "Подписать",
    signing: "Подписание…",
    mark_done: "Отметить как выполненное",
    mark_todo: "Отметить как невыполненное",
    no_words: "Нечего подписывать",
    no_homework: "Нет домашних заданий",
    no_messages: "Нет непрочитанных сообщений",
    no_news: "Нет новостей",
    no_events: "Ничего не запланировано",
    today: "Сегодня",
    tomorrow: "Завтра",
    yesterday: "Вчера",
    due: "к {day}",
    due_today: "к сегодня",
    due_tomorrow: "к завтра",
    all_day: "Весь день",
    attachment: "Вложение",
    more: "+ещё {n}",
    action_failed: "ENT отклонил действие:",
    tab_home: "Главная",
    tab_homework: "Домашние задания",
    tab_words: "Дневник",
    tab_messages: "Сообщения",
    tab_news: "Новости",
    tab_settings: "Настройки",
    all: "Все",
    hide_done: "Скрыть выполненные",
    no_account: "Учётная запись ENT ONE не загружена. Добавьте интеграцию в Настройки → Устройства и службы.",
    account: "Учётная запись",
    settings_scan: "Интервал обновления (минуты)",
    settings_scan_hint: "ENT используется всей школой: минимум 10 минут.",
    settings_days: "Период домашних заданий (дни)",
    settings_notify: "Действия уведомлений",
    settings_notify_hint: "Новые сообщения, записи на подпись и домашние задания отправляются этим действиям.",
    settings_panel: "Показывать эту панель на боковой панели",
    save: "Сохранить",
    saved: "Сохранено. Учётная запись перезагружается с новыми настройками.",
    admin_only: "Только администратор может изменить эти настройки.",
    last_update: "Обновлено {time}",
    editor_entry: "Учётная запись ENT ONE",
    editor_title: "Заголовок",
    editor_show_title: "Показывать заголовок",
    editor_show_refresh: "Показывать кнопку обновления",
    editor_show_words: "Показывать дневник",
    editor_show_homework: "Показывать домашние задания",
    editor_show_done: "Показывать выполненные задания",
    editor_show_messages: "Показывать сообщения",
    editor_show_news: "Показывать новости",
    editor_show_events: "Показывать календарь",
    editor_show_empty: "Показывать пустые разделы",
    editor_max_items: "Элементов в разделе",
    editor_language: "Язык",
    editor_lang_auto: "Автоматически",
  },
  uk: {
    no_entity: "Датчики ENT ONE не знайдено. Додайте інтеграцію ENT ONE або вкажіть «config_entry_id».",
    unavailable: "ENT недоступний. Вміст з'явиться після наступного успішного оновлення.",
    up_to_date: "Актуально",
    partial: "Оновлено частково",
    offline: "Недоступно",
    refresh: "Оновити",
    refresh_failed: "Не вдалося оновити:",
    open_ent: "Відкрити ENT",
    show_full: "Показати повну картку",
    show_compact: "Повернутися до компактного вигляду",
    children: "Дітей: {n}",
    tile_messages: "непрочитані",
    tile_words: "на підпис",
    tile_homework: "домашні завдання",
    section_words: "Щоденник",
    section_homework: "Домашні завдання",
    section_messages: "Повідомлення",
    section_news: "Новини",
    section_events: "Календар",
    sign: "Підписати",
    signed: "Підписано",
    sign_title: "Підписати цей запис?",
    sign_text: "ENT зазначить, що ви прочитали «{title}» для {child}. Це не можна скасувати.",
    cancel: "Скасувати",
    close: "Закрити",
    confirm: "Підписати",
    signing: "Підписання…",
    mark_done: "Позначити як виконане",
    mark_todo: "Позначити як невиконане",
    no_words: "Нічого підписувати",
    no_homework: "Немає домашніх завдань",
    no_messages: "Немає непрочитаних повідомлень",
    no_news: "Немає новин",
    no_events: "Нічого не заплановано",
    today: "Сьогодні",
    tomorrow: "Завтра",
    yesterday: "Учора",
    due: "до {day}",
    due_today: "на сьогодні",
    due_tomorrow: "на завтра",
    all_day: "Увесь день",
    attachment: "Вкладення",
    more: "+ще {n}",
    action_failed: "ENT відхилив дію:",
    tab_home: "Головна",
    tab_homework: "Домашні завдання",
    tab_words: "Щоденник",
    tab_messages: "Повідомлення",
    tab_news: "Новини",
    tab_settings: "Налаштування",
    all: "Усі",
    hide_done: "Сховати виконані",
    no_account: "Обліковий запис ENT ONE не завантажено. Додайте інтеграцію в Налаштування → Пристрої та служби.",
    account: "Обліковий запис",
    settings_scan: "Інтервал оновлення (хвилини)",
    settings_scan_hint: "ENT використовує вся школа: щонайменше 10 хвилин.",
    settings_days: "Період домашніх завдань (дні)",
    settings_notify: "Дії сповіщень",
    settings_notify_hint: "Нові повідомлення, записи на підпис і домашні завдання надсилаються цим діям.",
    settings_panel: "Показувати цю панель на бічній панелі",
    save: "Зберегти",
    saved: "Збережено. Обліковий запис перезавантажується з новими налаштуваннями.",
    admin_only: "Лише адміністратор може змінити ці налаштування.",
    last_update: "Оновлено {time}",
    editor_entry: "Обліковий запис ENT ONE",
    editor_title: "Заголовок",
    editor_show_title: "Показувати заголовок",
    editor_show_refresh: "Показувати кнопку оновлення",
    editor_show_words: "Показувати щоденник",
    editor_show_homework: "Показувати домашні завдання",
    editor_show_done: "Показувати виконані завдання",
    editor_show_messages: "Показувати повідомлення",
    editor_show_news: "Показувати новини",
    editor_show_events: "Показувати календар",
    editor_show_empty: "Показувати порожні розділи",
    editor_max_items: "Елементів у розділі",
    editor_language: "Мова",
    editor_lang_auto: "Автоматично",
  },
  hu: {
    no_entity: "Az ENT ONE érzékelők nem találhatók. Add hozzá az ENT ONE integrációt, vagy add meg a „config_entry_id” értéket.",
    unavailable: "Az ENT nem érhető el. A tartalom a következő sikeres frissítés után jelenik meg.",
    up_to_date: "Naprakész",
    partial: "Részben frissítve",
    offline: "Nem elérhető",
    refresh: "Frissítés",
    refresh_failed: "A frissítés sikertelen:",
    open_ent: "ENT megnyitása",
    show_full: "Teljes kártya megjelenítése",
    show_compact: "Vissza a kompakt nézethez",
    children: "{n} gyermek",
    tile_messages: "olvasatlan",
    tile_words: "aláírandó",
    tile_homework: "házi feladat",
    section_words: "Üzenőfüzet",
    section_homework: "Házi feladatok",
    section_messages: "Üzenetek",
    section_news: "Hírek",
    section_events: "Naptár",
    sign: "Aláírás",
    signed: "Aláírva",
    sign_title: "Aláírod ezt a bejegyzést?",
    sign_text: "Az ENT rögzíti, hogy elolvastad: „{title}” ({child}). Ez nem vonható vissza.",
    cancel: "Mégse",
    close: "Bezárás",
    confirm: "Aláírás",
    signing: "Aláírás…",
    mark_done: "Megjelölés készként",
    mark_todo: "Megjelölés nem készként",
    no_words: "Nincs mit aláírni",
    no_homework: "Nincs házi feladat",
    no_messages: "Nincs olvasatlan üzenet",
    no_news: "Nincsenek hírek",
    no_events: "Nincs tervezett esemény",
    today: "Ma",
    tomorrow: "Holnap",
    yesterday: "Tegnap",
    due: "határidő: {day}",
    due_today: "mára",
    due_tomorrow: "holnapra",
    all_day: "Egész nap",
    attachment: "Melléklet",
    more: "+{n} további",
    action_failed: "Az ENT elutasította a műveletet:",
    tab_home: "Kezdőlap",
    tab_homework: "Házi feladatok",
    tab_words: "Üzenőfüzet",
    tab_messages: "Üzenetek",
    tab_news: "Hírek",
    tab_settings: "Beállítások",
    all: "Mind",
    hide_done: "Készek elrejtése",
    no_account: "Nincs betöltött ENT ONE fiók. Add hozzá az integrációt a Beállítások → Eszközök és szolgáltatások menüben.",
    account: "Fiók",
    settings_scan: "Frissítési időköz (perc)",
    settings_scan_hint: "Az ENT-et az egész iskola használja: legalább 10 perc.",
    settings_days: "Házi feladatok időszaka (nap)",
    settings_notify: "Értesítési műveletek",
    settings_notify_hint: "Az új üzenetek, aláírandó bejegyzések és házi feladatok ezekre a műveletekre mennek.",
    settings_panel: "A panel megjelenítése az oldalsávon",
    save: "Mentés",
    saved: "Mentve. A fiók az új beállításokkal töltődik újra.",
    admin_only: "Ezeket a beállításokat csak rendszergazda módosíthatja.",
    last_update: "Frissítve: {time}",
    editor_entry: "ENT ONE fiók",
    editor_title: "Cím",
    editor_show_title: "Cím megjelenítése",
    editor_show_refresh: "Frissítés gomb megjelenítése",
    editor_show_words: "Üzenőfüzet megjelenítése",
    editor_show_homework: "Házi feladatok megjelenítése",
    editor_show_done: "Kész feladatok megjelenítése",
    editor_show_messages: "Üzenetek megjelenítése",
    editor_show_news: "Hírek megjelenítése",
    editor_show_events: "Naptár megjelenítése",
    editor_show_empty: "Üres szakaszok megjelenítése",
    editor_max_items: "Elemek szakaszonként",
    editor_language: "Nyelv",
    editor_lang_auto: "Automatikus",
  },
  sk: {
    no_entity: "Senzory ENT ONE sa nenašli. Pridajte integráciu ENT ONE alebo nastavte „config_entry_id“.",
    unavailable: "ENT nie je dostupný. Obsah sa zobrazí po ďalšej úspešnej aktualizácii.",
    up_to_date: "Aktuálne",
    partial: "Čiastočne aktualizované",
    offline: "Nedostupné",
    refresh: "Obnoviť",
    refresh_failed: "Obnovenie zlyhalo:",
    open_ent: "Otvoriť ENT",
    show_full: "Zobraziť celú kartu",
    show_compact: "Späť na kompaktné zobrazenie",
    children: "Deti: {n}",
    tile_messages: "neprečítané",
    tile_words: "na podpis",
    tile_homework: "úlohy",
    section_words: "Žiacka knižka",
    section_homework: "Domáce úlohy",
    section_messages: "Správy",
    section_news: "Novinky",
    section_events: "Kalendár",
    sign: "Podpísať",
    signed: "Podpísané",
    sign_title: "Podpísať tento záznam?",
    sign_text: "ENT zaznamená, že ste si prečítali „{title}“ pre {child}. Nedá sa to vrátiť späť.",
    cancel: "Zrušiť",
    close: "Zavrieť",
    confirm: "Podpísať",
    signing: "Podpisuje sa…",
    mark_done: "Označiť ako hotové",
    mark_todo: "Označiť ako nehotové",
    no_words: "Nič na podpis",
    no_homework: "Žiadne domáce úlohy",
    no_messages: "Žiadna neprečítaná správa",
    no_news: "Žiadne novinky",
    no_events: "Nič naplánované",
    today: "Dnes",
    tomorrow: "Zajtra",
    yesterday: "Včera",
    due: "na {day}",
    due_today: "na dnes",
    due_tomorrow: "na zajtra",
    all_day: "Celý deň",
    attachment: "Príloha",
    more: "+ďalšie {n}",
    action_failed: "ENT odmietol akciu:",
    tab_home: "Domov",
    tab_homework: "Úlohy",
    tab_words: "Žiacka knižka",
    tab_messages: "Správy",
    tab_news: "Novinky",
    tab_settings: "Nastavenia",
    all: "Všetky",
    hide_done: "Skryť hotové",
    no_account: "Nie je načítaný žiadny účet ENT ONE. Pridajte integráciu v Nastavenia → Zariadenia a služby.",
    account: "Účet",
    settings_scan: "Interval aktualizácie (minúty)",
    settings_scan_hint: "ENT používa celá škola: minimálne 10 minút.",
    settings_days: "Obdobie úloh (dni)",
    settings_notify: "Akcie upozornení",
    settings_notify_hint: "Nové správy, záznamy na podpis a domáce úlohy sa posielajú týmto akciám.",
    settings_panel: "Zobraziť tento panel na bočnom paneli",
    save: "Uložiť",
    saved: "Uložené. Účet sa znova načíta s novými nastaveniami.",
    admin_only: "Tieto nastavenia môže zmeniť iba správca.",
    last_update: "Aktualizované {time}",
    editor_entry: "Účet ENT ONE",
    editor_title: "Názov",
    editor_show_title: "Zobraziť názov",
    editor_show_refresh: "Zobraziť tlačidlo Obnoviť",
    editor_show_words: "Zobraziť žiacku knižku",
    editor_show_homework: "Zobraziť domáce úlohy",
    editor_show_done: "Zobraziť hotové úlohy",
    editor_show_messages: "Zobraziť správy",
    editor_show_news: "Zobraziť novinky",
    editor_show_events: "Zobraziť kalendár",
    editor_show_empty: "Zobraziť prázdne sekcie",
    editor_max_items: "Položky na sekciu",
    editor_language: "Jazyk",
    editor_lang_auto: "Automaticky",
  },
  cs: {
    no_entity: "Senzory ENT ONE nebyly nalezeny. Přidejte integraci ENT ONE nebo nastavte „config_entry_id“.",
    unavailable: "ENT není dostupný. Obsah se zobrazí po další úspěšné aktualizaci.",
    up_to_date: "Aktuální",
    partial: "Částečně aktualizováno",
    offline: "Nedostupné",
    refresh: "Obnovit",
    refresh_failed: "Obnovení selhalo:",
    open_ent: "Otevřít ENT",
    show_full: "Zobrazit celou kartu",
    show_compact: "Zpět na kompaktní zobrazení",
    children: "Děti: {n}",
    tile_messages: "nepřečtené",
    tile_words: "k podpisu",
    tile_homework: "úkoly",
    section_words: "Žákovská knížka",
    section_homework: "Domácí úkoly",
    section_messages: "Zprávy",
    section_news: "Novinky",
    section_events: "Kalendář",
    sign: "Podepsat",
    signed: "Podepsáno",
    sign_title: "Podepsat tento záznam?",
    sign_text: "ENT zaznamená, že jste si přečetli „{title}“ pro {child}. Nelze to vrátit zpět.",
    cancel: "Zrušit",
    close: "Zavřít",
    confirm: "Podepsat",
    signing: "Podepisuje se…",
    mark_done: "Označit jako hotové",
    mark_todo: "Označit jako nehotové",
    no_words: "Nic k podpisu",
    no_homework: "Žádné domácí úkoly",
    no_messages: "Žádná nepřečtená zpráva",
    no_news: "Žádné novinky",
    no_events: "Nic naplánováno",
    today: "Dnes",
    tomorrow: "Zítra",
    yesterday: "Včera",
    due: "na {day}",
    due_today: "na dnes",
    due_tomorrow: "na zítra",
    all_day: "Celý den",
    attachment: "Příloha",
    more: "+další {n}",
    action_failed: "ENT akci odmítl:",
    tab_home: "Domů",
    tab_homework: "Úkoly",
    tab_words: "Žákovská knížka",
    tab_messages: "Zprávy",
    tab_news: "Novinky",
    tab_settings: "Nastavení",
    all: "Vše",
    hide_done: "Skrýt hotové",
    no_account: "Není načten žádný účet ENT ONE. Přidejte integraci v Nastavení → Zařízení a služby.",
    account: "Účet",
    settings_scan: "Interval aktualizace (minuty)",
    settings_scan_hint: "ENT používá celá škola: minimálně 10 minut.",
    settings_days: "Období úkolů (dny)",
    settings_notify: "Akce oznámení",
    settings_notify_hint: "Nové zprávy, záznamy k podpisu a domácí úkoly se posílají těmto akcím.",
    settings_panel: "Zobrazit tento panel v postranním panelu",
    save: "Uložit",
    saved: "Uloženo. Účet se znovu načte s novým nastavením.",
    admin_only: "Toto nastavení může změnit pouze správce.",
    last_update: "Aktualizováno {time}",
    editor_entry: "Účet ENT ONE",
    editor_title: "Název",
    editor_show_title: "Zobrazit název",
    editor_show_refresh: "Zobrazit tlačítko Obnovit",
    editor_show_words: "Zobrazit žákovskou knížku",
    editor_show_homework: "Zobrazit domácí úkoly",
    editor_show_done: "Zobrazit hotové úkoly",
    editor_show_messages: "Zobrazit zprávy",
    editor_show_news: "Zobrazit novinky",
    editor_show_events: "Zobrazit kalendář",
    editor_show_empty: "Zobrazit prázdné sekce",
    editor_max_items: "Položky na sekci",
    editor_language: "Jazyk",
    editor_lang_auto: "Automaticky",
  },
  sl: {
    no_entity: "Senzorjev ENT ONE ni mogoče najti. Dodajte integracijo ENT ONE ali nastavite »config_entry_id«.",
    unavailable: "ENT ni na voljo. Vsebina bo prikazana po naslednji uspešni posodobitvi.",
    up_to_date: "Posodobljeno",
    partial: "Delno posodobljeno",
    offline: "Ni na voljo",
    refresh: "Osveži",
    refresh_failed: "Osvežitev ni uspela:",
    open_ent: "Odpri ENT",
    show_full: "Prikaži celotno kartico",
    show_compact: "Nazaj na strnjen pogled",
    children: "Otroci: {n}",
    tile_messages: "neprebrano",
    tile_words: "za podpis",
    tile_homework: "domače naloge",
    section_words: "Beležka",
    section_homework: "Domače naloge",
    section_messages: "Sporočila",
    section_news: "Novice",
    section_events: "Koledar",
    sign: "Podpiši",
    signed: "Podpisano",
    sign_title: "Podpišem to obvestilo?",
    sign_text: "ENT zabeleži, da ste prebrali »{title}« za {child}. Tega ni mogoče razveljaviti.",
    cancel: "Prekliči",
    close: "Zapri",
    confirm: "Podpiši",
    signing: "Podpisovanje…",
    mark_done: "Označi kot opravljeno",
    mark_todo: "Označi kot neopravljeno",
    no_words: "Ničesar za podpis",
    no_homework: "Ni domačih nalog",
    no_messages: "Ni neprebranih sporočil",
    no_news: "Ni novic",
    no_events: "Nič ni načrtovano",
    today: "Danes",
    tomorrow: "Jutri",
    yesterday: "Včeraj",
    due: "za {day}",
    due_today: "za danes",
    due_tomorrow: "za jutri",
    all_day: "Ves dan",
    attachment: "Priloga",
    more: "+še {n}",
    action_failed: "ENT je zavrnil dejanje:",
    tab_home: "Domov",
    tab_homework: "Naloge",
    tab_words: "Beležka",
    tab_messages: "Sporočila",
    tab_news: "Novice",
    tab_settings: "Nastavitve",
    all: "Vse",
    hide_done: "Skrij opravljene",
    no_account: "Noben račun ENT ONE ni naložen. Dodajte integracijo v Nastavitve → Naprave in storitve.",
    account: "Račun",
    settings_scan: "Interval posodabljanja (minute)",
    settings_scan_hint: "ENT uporablja vsa šola: najmanj 10 minut.",
    settings_days: "Obdobje nalog (dnevi)",
    settings_notify: "Dejanja obvestil",
    settings_notify_hint: "Nova sporočila, obvestila za podpis in domače naloge se pošljejo tem dejanjem.",
    settings_panel: "Prikaži ta panel v stranski vrstici",
    save: "Shrani",
    saved: "Shranjeno. Račun se znova naloži z novimi nastavitvami.",
    admin_only: "Te nastavitve lahko spremeni samo skrbnik.",
    last_update: "Posodobljeno {time}",
    editor_entry: "Račun ENT ONE",
    editor_title: "Naslov",
    editor_show_title: "Prikaži naslov",
    editor_show_refresh: "Prikaži gumb Osveži",
    editor_show_words: "Prikaži beležko",
    editor_show_homework: "Prikaži domače naloge",
    editor_show_done: "Prikaži opravljene naloge",
    editor_show_messages: "Prikaži sporočila",
    editor_show_news: "Prikaži novice",
    editor_show_events: "Prikaži koledar",
    editor_show_empty: "Prikaži prazne razdelke",
    editor_max_items: "Elementi na razdelek",
    editor_language: "Jezik",
    editor_lang_auto: "Samodejno",
  },
  lv: {
    no_entity: "ENT ONE sensori nav atrasti. Pievienojiet ENT ONE integrāciju vai iestatiet “config_entry_id”.",
    unavailable: "ENT nav pieejams. Saturs parādīsies pēc nākamās veiksmīgās atjaunināšanas.",
    up_to_date: "Atjaunināts",
    partial: "Daļēji atjaunināts",
    offline: "Nav pieejams",
    refresh: "Atsvaidzināt",
    refresh_failed: "Neizdevās atsvaidzināt:",
    open_ent: "Atvērt ENT",
    show_full: "Rādīt pilnu karti",
    show_compact: "Atpakaļ uz kompakto skatu",
    children: "Bērni: {n}",
    tile_messages: "nelasīti",
    tile_words: "jāparaksta",
    tile_homework: "mājasdarbi",
    section_words: "Dienasgrāmata",
    section_homework: "Mājasdarbi",
    section_messages: "Ziņojumi",
    section_news: "Jaunumi",
    section_events: "Kalendārs",
    sign: "Parakstīt",
    signed: "Parakstīts",
    sign_title: "Parakstīt šo ierakstu?",
    sign_text: "ENT reģistrē, ka esat izlasījis “{title}” ({child}). To nevar atsaukt.",
    cancel: "Atcelt",
    close: "Aizvērt",
    confirm: "Parakstīt",
    signing: "Paraksta…",
    mark_done: "Atzīmēt kā izpildītu",
    mark_todo: "Atzīmēt kā neizpildītu",
    no_words: "Nav ko parakstīt",
    no_homework: "Nav mājasdarbu",
    no_messages: "Nav nelasītu ziņojumu",
    no_news: "Nav jaunumu",
    no_events: "Nekas nav plānots",
    today: "Šodien",
    tomorrow: "Rīt",
    yesterday: "Vakar",
    due: "līdz {day}",
    due_today: "uz šodienu",
    due_tomorrow: "uz rītdienu",
    all_day: "Visu dienu",
    attachment: "Pielikums",
    more: "+vēl {n}",
    action_failed: "ENT noraidīja darbību:",
    tab_home: "Sākums",
    tab_homework: "Mājasdarbi",
    tab_words: "Dienasgrāmata",
    tab_messages: "Ziņojumi",
    tab_news: "Jaunumi",
    tab_settings: "Iestatījumi",
    all: "Visi",
    hide_done: "Paslēpt izpildītos",
    no_account: "Nav ielādēts neviens ENT ONE konts. Pievienojiet integrāciju sadaļā Iestatījumi → Ierīces un pakalpojumi.",
    account: "Konts",
    settings_scan: "Atjaunināšanas intervāls (minūtes)",
    settings_scan_hint: "ENT izmanto visa skola: vismaz 10 minūtes.",
    settings_days: "Mājasdarbu periods (dienas)",
    settings_notify: "Paziņojumu darbības",
    settings_notify_hint: "Jauni ziņojumi, parakstāmi ieraksti un mājasdarbi tiek nosūtīti šīm darbībām.",
    settings_panel: "Rādīt šo paneli sānjoslā",
    save: "Saglabāt",
    saved: "Saglabāts. Konts tiek pārlādēts ar jaunajiem iestatījumiem.",
    admin_only: "Šos iestatījumus var mainīt tikai administrators.",
    last_update: "Atjaunināts {time}",
    editor_entry: "ENT ONE konts",
    editor_title: "Virsraksts",
    editor_show_title: "Rādīt virsrakstu",
    editor_show_refresh: "Rādīt atsvaidzināšanas pogu",
    editor_show_words: "Rādīt dienasgrāmatu",
    editor_show_homework: "Rādīt mājasdarbus",
    editor_show_done: "Rādīt izpildītos mājasdarbus",
    editor_show_messages: "Rādīt ziņojumus",
    editor_show_news: "Rādīt jaunumus",
    editor_show_events: "Rādīt kalendāru",
    editor_show_empty: "Rādīt tukšās sadaļas",
    editor_max_items: "Elementi sadaļā",
    editor_language: "Valoda",
    editor_lang_auto: "Automātiski",
  },
  el: {
    no_entity: "Δεν βρέθηκαν αισθητήρες ENT ONE. Προσθέστε την ενσωμάτωση ENT ONE ή ορίστε «config_entry_id».",
    unavailable: "Το ENT δεν είναι διαθέσιμο. Το περιεχόμενο θα εμφανιστεί μετά την επόμενη επιτυχή ενημέρωση.",
    up_to_date: "Ενημερωμένο",
    partial: "Μερική ενημέρωση",
    offline: "Μη διαθέσιμο",
    refresh: "Ανανέωση",
    refresh_failed: "Η ανανέωση απέτυχε:",
    open_ent: "Άνοιγμα του ENT",
    show_full: "Εμφάνιση πλήρους κάρτας",
    show_compact: "Επιστροφή στη συμπαγή προβολή",
    children: "Παιδιά: {n}",
    tile_messages: "μη αναγνωσμένα",
    tile_words: "για υπογραφή",
    tile_homework: "εργασίες",
    section_words: "Τετράδιο επικοινωνίας",
    section_homework: "Εργασίες",
    section_messages: "Μηνύματα",
    section_news: "Νέα",
    section_events: "Ημερολόγιο",
    sign: "Υπογραφή",
    signed: "Υπογράφηκε",
    sign_title: "Υπογραφή αυτού του σημειώματος;",
    sign_text: "Το ENT καταγράφει ότι διαβάσατε «{title}» για {child}. Δεν αναιρείται.",
    cancel: "Ακύρωση",
    close: "Κλείσιμο",
    confirm: "Υπογραφή",
    signing: "Υπογραφή…",
    mark_done: "Σήμανση ως ολοκληρωμένο",
    mark_todo: "Σήμανση ως μη ολοκληρωμένο",
    no_words: "Τίποτα για υπογραφή",
    no_homework: "Καμία εργασία",
    no_messages: "Κανένα μη αναγνωσμένο μήνυμα",
    no_news: "Κανένα νέο",
    no_events: "Τίποτα προγραμματισμένο",
    today: "Σήμερα",
    tomorrow: "Αύριο",
    yesterday: "Χθες",
    due: "για {day}",
    due_today: "για σήμερα",
    due_tomorrow: "για αύριο",
    all_day: "Ολοήμερο",
    attachment: "Συνημμένο",
    more: "+{n} ακόμη",
    action_failed: "Το ENT απέρριψε την ενέργεια:",
    tab_home: "Αρχική",
    tab_homework: "Εργασίες",
    tab_words: "Τετράδιο",
    tab_messages: "Μηνύματα",
    tab_news: "Νέα",
    tab_settings: "Ρυθμίσεις",
    all: "Όλα",
    hide_done: "Απόκρυψη ολοκληρωμένων",
    no_account: "Δεν έχει φορτωθεί λογαριασμός ENT ONE. Προσθέστε την ενσωμάτωση από Ρυθμίσεις → Συσκευές και υπηρεσίες.",
    account: "Λογαριασμός",
    settings_scan: "Διάστημα ενημέρωσης (λεπτά)",
    settings_scan_hint: "Το ENT το μοιράζεται όλο το σχολείο: τουλάχιστον 10 λεπτά.",
    settings_days: "Περίοδος εργασιών (ημέρες)",
    settings_notify: "Ενέργειες ειδοποίησης",
    settings_notify_hint: "Τα νέα μηνύματα, τα σημειώματα για υπογραφή και οι εργασίες αποστέλλονται σε αυτές τις ενέργειες.",
    settings_panel: "Εμφάνιση αυτού του πίνακα στην πλαϊνή μπάρα",
    save: "Αποθήκευση",
    saved: "Αποθηκεύτηκε. Ο λογαριασμός επαναφορτώνεται με τις νέες ρυθμίσεις.",
    admin_only: "Μόνο διαχειριστής μπορεί να αλλάξει αυτές τις ρυθμίσεις.",
    last_update: "Ενημερώθηκε {time}",
    editor_entry: "Λογαριασμός ENT ONE",
    editor_title: "Τίτλος",
    editor_show_title: "Εμφάνιση τίτλου",
    editor_show_refresh: "Εμφάνιση κουμπιού ανανέωσης",
    editor_show_words: "Εμφάνιση τετραδίου επικοινωνίας",
    editor_show_homework: "Εμφάνιση εργασιών",
    editor_show_done: "Εμφάνιση ολοκληρωμένων εργασιών",
    editor_show_messages: "Εμφάνιση μηνυμάτων",
    editor_show_news: "Εμφάνιση νέων",
    editor_show_events: "Εμφάνιση ημερολογίου",
    editor_show_empty: "Εμφάνιση κενών ενοτήτων",
    editor_max_items: "Στοιχεία ανά ενότητα",
    editor_language: "Γλώσσα",
    editor_lang_auto: "Αυτόματα",
  },
};

var ENT_ONE_LANGUAGES = [
  ['en', 'English'], ['fr', 'Français'], ['de', 'Deutsch'], ['es', 'Español'], ['sr', 'Српски'],
  ['sr-Latn', 'Srpski (latinica)'], ['it', 'Italiano'], ['nl', 'Nederlands'], ['pt', 'Português (Portugal)'],
  ['pl', 'Polski'], ['ro', 'Română'], ['da', 'Dansk'], ['sv', 'Svenska'], ['bg', 'Български'], ['ru', 'Русский'],
  ['uk', 'Українська'], ['hu', 'Magyar'], ['sk', 'Slovenčina'], ['cs', 'Čeština'], ['sl', 'Slovenščina'],
  ['lv', 'Latviešu'], ['el', 'Ελληνικά'],
];

var ENT_ONE_DEFAULTS = {
  show_title: true,
  show_refresh: true,
  show_words: true,
  show_homework: true,
  show_done: true,
  show_messages: true,
  show_news: false,
  show_events: true,
  show_empty: false,
  max_items: 5,
};

// ── helpers (shared with the panel through window.EntOne) ─────────────────────
function entOneEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function entOneFormat(text, values) {
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (values && values[k] != null ? values[k] : m));
}

// The card's `language` option wins over the Home Assistant language; a full code the card knows (sr-Latn) is
// kept, else its base (fr-FR gives fr), else English.
function entOneLang(hass, config) {
  var lang = String(config?.language || (hass && (hass.locale?.language || hass.language)) || navigator.language || 'en');
  if (EntOneI18n[lang]) return lang;
  lang = lang.split('-')[0];
  return EntOneI18n[lang] ? lang : 'en';
}

// Locale for Intl: plain "pt" is European Portuguese in Home Assistant but Brazilian in Intl.
function entOneLocale(hass, config) {
  var lang = entOneLang(hass, config);
  var full = String(config?.language || (hass && (hass.locale?.language || hass.language)) || '');
  var sameScript = /-Latn\b/i.test(full) === /-Latn\b/i.test(lang);
  var locale = full && full.split('-')[0] === lang.split('-')[0] && sameScript ? full : lang;
  return locale === 'pt' ? 'pt-PT' : locale;
}

// English key by key until the language file is loaded (the split leaves `{}` in its place).
function entOneT(hass, config) {
  return Object.assign({}, EntOneI18n.en, EntOneI18n[entOneLang(hass, config)]);
}

function entOneErrorText(hass, err) {
  var fallback = String(err?.message || err || '').replace(/^Validation error: /, '');
  var key = err?.translation_key;
  if (!key || err.translation_domain !== 'ent_one' || typeof hass?.loadBackendTranslation !== 'function') {
    return Promise.resolve(fallback);
  }
  return Promise.resolve(hass.loadBackendTranslation('exceptions', 'ent_one'))
    .then((localize) => (localize || hass.localize)(`component.ent_one.exceptions.${key}.message`, err.translation_placeholders || {}) || fallback)
    .catch(() => fallback);
}

// The ENT ONE accounts found in the states: each sensor carries config_entry_id and its own list attribute.
var ENT_ONE_KINDS = { messages: 'messages', words: 'words', homework: 'homework', news: 'news', account: 'last' };

function entOneAccounts(hass) {
  var accounts = {};
  var states = hass?.states || {};
  var entities = hass?.entities || {};
  Object.keys(states).forEach((id) => {
    if (id.indexOf('sensor.') !== 0) return;
    var reg = entities[id];
    if (reg && reg.platform !== 'ent_one') return;
    var st = states[id];
    var entry = st.attributes?.config_entry_id;
    if (!entry) return;
    var kind = Object.keys(ENT_ONE_KINDS).find((k) => k in st.attributes);
    if (!kind) return;
    accounts[entry] = accounts[entry] || { entryId: entry };
    accounts[entry][ENT_ONE_KINDS[kind]] = st;
  });
  return accounts;
}

function entOneData(hass, entryId) {
  var accounts = entOneAccounts(hass);
  var acc = entryId ? accounts[entryId] : accounts[Object.keys(accounts)[0]];
  if (!acc) return null;
  var a = (st, key, fallback) => (st && Array.isArray(st.attributes?.[key]) ? st.attributes[key] : fallback);
  var down = (st) => !st || st.state === 'unavailable' || st.state === 'unknown';
  var last = acc.last;
  var stale = [];
  [acc.messages, acc.words, acc.homework, acc.news].forEach((st) => {
    (st?.attributes?.stale || []).forEach((s) => {
      if (stale.indexOf(s) === -1) stale.push(s);
    });
  });
  return {
    entryId: acc.entryId,
    unavailable: down(acc.messages) && down(acc.words) && down(acc.homework),
    unread: down(acc.messages) ? 0 : Number(acc.messages.state) || 0,
    messages: a(acc.messages, 'messages', []),
    words: a(acc.words, 'words', []),
    homework: a(acc.homework, 'homework', []),
    books: acc.homework?.attributes?.books || {},
    news: a(acc.news, 'news', []),
    events: a(last, 'events', []),
    children: a(last, 'children', []),
    account: last?.attributes?.account || {},
    url: last?.attributes?.url || '',
    updated: last && !down(last) ? last.state : null,
    stale: stale,
    states: [acc.messages, acc.words, acc.homework, acc.news, last],
  };
}

// "YYYY-MM-DD" is read as UTC midnight by Date.parse: give a date alone a local midnight.
function entOneParse(raw) {
  var s = String(raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00';
  return new Date(s);
}

function entOneDayDiff(raw) {
  var d = entOneParse(raw);
  if (Number.isNaN(d.getTime())) return null;
  var a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var now = new Date();
  var b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

// Today / Tomorrow / Yesterday, else the short weekday within a week, else the date.
function entOneDay(raw, t, locale) {
  var diff = entOneDayDiff(raw);
  if (diff === null) return '';
  if (diff === 0) return t.today;
  if (diff === 1) return t.tomorrow;
  if (diff === -1) return t.yesterday;
  var d = entOneParse(raw);
  // Within a week the weekday is enough; further away the weekday stays, with the date (Thu 26 Nov).
  var opts = Math.abs(diff) < 7 ? { weekday: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' };
  try {
    return d.toLocaleDateString(locale, opts);
  } catch (_e) {
    return d.toLocaleDateString('en', opts);
  }
}

// "for today", "for tomorrow", else "for" and the day.
function entOneDue(raw, t, locale) {
  var diff = entOneDayDiff(raw);
  if (diff === 0) return t.due_today;
  if (diff === 1) return t.due_tomorrow;
  return entOneFormat(t.due, { day: entOneDay(raw, t, locale) });
}

// The time format of the user's Home Assistant profile: '12', '24', or the language's ('language' / 'system').
var entOneHour12;

function entOneSetTimeFormat(hass) {
  var f = hass?.locale?.time_format;
  entOneHour12 = f === '12' ? true : f === '24' ? false : undefined;
}

function entOneTime(raw, locale) {
  var d = entOneParse(raw);
  if (Number.isNaN(d.getTime())) return '';
  var opts = { hour: '2-digit', minute: '2-digit' };
  if (entOneHour12 !== undefined) opts.hour12 = entOneHour12;
  try {
    return d.toLocaleTimeString(locale, opts);
  } catch (_e) {
    return d.toLocaleTimeString('en', opts);
  }
}

// Signing is an admin-only action (a child's Home Assistant account must not sign): true while hass.user is unknown.
function entOneCanSign(hass) {
  return hass?.user?.is_admin !== false;
}

function entOneSign(hass, entryId, word) {
  return hass.callService('ent_one', 'sign_word', { config_entry_id: entryId, word_id: String(word.id), child_id: String(word.child_id) });
}

function entOneSetDone(hass, entryId, item, done) {
  return hass.callWS({
    type: 'ent_one/homework_done',
    config_entry_id: entryId,
    book_id: String(item.book_id),
    homework_id: String(item.id),
    done: !!done,
  });
}

function entOneRefresh(hass, entryId) {
  return hass.callService('ent_one', 'refresh', { config_entry_id: entryId });
}

// A click inside a Home Assistant dialog (more-info, editor) is not a click outside the card.
function entOneInDialog(ev) {
  return ev.composedPath().some((el) => el?.tagName && /^(HA-DIALOG|HA-MORE-INFO-DIALOG|HUI-DIALOG-EDIT-CARD)$/.test(el.tagName));
}

// Undone homework first by due date, done homework after (when shown).
function entOneSortedHomework(items, showDone) {
  return items
    .filter((h) => showDone || !h.done)
    .slice()
    .sort((x, y) => (x.done === y.done ? String(x.date).localeCompare(String(y.date)) : x.done ? 1 : -1));
}

function entOneUpcomingEvents(events) {
  var now = Date.now();
  return events.filter((e) => {
    var end = entOneParse(e.end || e.start).getTime();
    return Number.isNaN(end) || end >= now - (e.all_day ? 86400000 : 0);
  });
}

// Shared row renderers: the card and the panel draw the same rows. A row with more to read (text, description,
// link) gets a chevron and data-toggle; opts.open shows that part (the panel always does with opts.full).
function entOneToggle(key, open, hasMore) {
  if (!hasMore) return { attrs: '', chevron: '' };
  return {
    attrs: ' data-toggle="' + entOneEsc(key) + '" role="button" tabindex="0" aria-expanded="' + !!open + '"',
    chevron: '<ha-icon class="chevron' + (open ? '' : ' closed') + '" icon="mdi:chevron-down"></ha-icon>',
  };
}

// Open when the panel shows everything (full), or when the caller's isOpen(key) says so (rows unfolded by a click).
function entOneOpen(opts, key) {
  return !!(opts && (opts.full || opts.isOpen?.(key)));
}

function entOneWordRow(w, t, locale, opts) {
  var meta = [w.child, w.author, entOneDay(w.date, t, locale)].filter(Boolean).join(' · ');
  var key = 'word:' + w.id + ':' + w.child_id;
  var open = entOneOpen(opts, key);
  var tg = opts?.full ? { attrs: '', chevron: '' } : entOneToggle(key, open, !!w.text);
  return '<div class="item word' + (w.signed ? ' done' : '') + '">' +
    '<ha-icon class="item-icon" icon="' + (w.signed ? 'mdi:check-circle-outline' : 'mdi:notebook-edit-outline') + '"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(w.title || w.category || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc(meta) + '</div>' +
    (open && w.text ? '<div class="item-text">' + entOneEsc(w.text) + '</div>' : '') + '</div>' + tg.chevron +
    (w.signed
      ? '<span class="chip ok">' + entOneEsc(t.signed) + '</span>'
      : opts?.canSign
        ? '<button class="act" data-action="sign" data-id="' + entOneEsc(w.id) + '" data-child="' + entOneEsc(w.child_id) + '">' + entOneEsc(t.sign) + '</button>'
        : '<span class="chip">' + entOneEsc(t.tile_words) + '</span>') +
    '</div>';
}

function entOneHomeworkRow(h, t, locale, opts) {
  var label = h.done ? t.mark_todo : t.mark_done;
  var key = 'homework:' + h.book_id + ':' + h.id;
  var open = entOneOpen(opts, key);
  var more = !!(h.text && h.title);
  var tg = opts?.full ? { attrs: '', chevron: '' } : entOneToggle(key, open, more);
  return '<div class="item hw' + (h.done ? ' done' : '') + '">' +
    '<button class="check" role="checkbox" aria-checked="' + !!h.done + '" aria-label="' + entOneEsc(label) + '" title="' + entOneEsc(label) + '"' +
    ' data-action="homework" data-id="' + entOneEsc(h.id) + '" data-book="' + entOneEsc(h.book_id) + '">' +
    '<ha-icon icon="' + (h.done ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline') + '"></ha-icon></button>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(h.title || (h.text || '').split('\n')[0] || h.book) + '</div>' +
    '<div class="item-meta">' + entOneEsc([h.book, entOneDue(h.date, t, locale)].filter(Boolean).join(' · ')) + '</div>' +
    (open && more ? '<div class="item-text">' + entOneEsc(h.text) + '</div>' : '') + '</div>' + tg.chevron + '</div>';
}

// The message body is not read (that would mark it read in the ENT): the row opens on a link to the ENT messaging.
function entOneMessageRow(m, t, locale, opts) {
  var key = 'message:' + m.id;
  var open = entOneOpen(opts, key);
  var tg = opts?.url && !opts.full ? entOneToggle(key, open, true) : { attrs: '', chevron: '' };
  return '<div class="item msg' + (m.unread ? ' unread' : ' done') + '">' +
    '<ha-icon class="item-icon" icon="' + (m.unread ? 'mdi:email-outline' : 'mdi:email-open-outline') + '"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(m.subject || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc([m.sender, entOneDay(m.date, t, locale)].filter(Boolean).join(' · ')) + '</div>' +
    (open && opts?.url
      ? '<div class="item-text"><a class="link" href="' + entOneEsc(opts.url + '/conversation/conversation') + '" target="_blank" rel="noopener">' + entOneEsc(t.open_ent) + '</a></div>'
      : '') + '</div>' +
    (m.attachment ? '<ha-icon class="item-side" icon="mdi:paperclip" title="' + entOneEsc(t.attachment) + '"></ha-icon>' : '') + tg.chevron +
    '</div>';
}

function entOneNewsRow(n, t, locale, opts) {
  var key = 'news:' + n.id;
  var open = entOneOpen(opts, key);
  var tg = opts?.full ? { attrs: '', chevron: '' } : entOneToggle(key, open, !!n.text);
  return '<div class="item news">' +
    '<ha-icon class="item-icon" icon="mdi:newspaper-variant-outline"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(n.title || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc([n.author, entOneDay(n.date, t, locale)].filter(Boolean).join(' · ')) + '</div>' +
    (open && n.text ? '<div class="item-text">' + entOneEsc(n.text) + '</div>' : '') + '</div>' + tg.chevron + '</div>';
}

function entOneEventRow(e, t, locale, opts) {
  var when = entOneDay(e.start, t, locale) + ' · ' + (e.all_day ? t.all_day : entOneTime(e.start, locale));
  var key = 'event:' + e.id;
  var open = entOneOpen(opts, key);
  var tg = opts?.full ? { attrs: '', chevron: '' } : entOneToggle(key, open, !!e.description);
  return '<div class="item event">' +
    '<ha-icon class="item-icon" icon="mdi:calendar-blank-outline"></ha-icon>' +
    '<div class="item-main"' + tg.attrs + '><div class="item-title">' + entOneEsc(e.title || '—') + '</div>' +
    '<div class="item-meta">' + entOneEsc([when, e.location].filter(Boolean).join(' · ')) + '</div>' +
    (open && e.description ? '<div class="item-text">' + entOneEsc(e.description) + '</div>' : '') + '</div>' + tg.chevron + '</div>';
}

// Styles of the rows, chips and buttons, shared by the card and the panel.
function entOneItemStyles(accent) {
  return [
    '.item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
    '.item:first-child, .section-title + .item, h2 + .item, h3 + .item { border-top: none; }',
    '.item-icon, .item-side { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; margin-top: 1px; }',
    '.item.unread .item-icon, .word:not(.done) .item-icon { color: ' + accent + '; }',
    '.item-main { flex: 1; min-width: 0; }',
    '.item-title { font-weight: 500; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.item.done .item-title { color: var(--secondary-text-color); font-weight: 400; }',
    '.hw.done .item-title { text-decoration: line-through; }',
    '.item-meta { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '.item-text { font-size: 13px; color: var(--primary-text-color); white-space: pre-line; margin-top: 4px; overflow-wrap: anywhere; }',
    // 40 px touch target around the 20 px box, without moving the row's text.
    '.check { all: unset; cursor: pointer; flex: none; display: grid; place-items: center; width: 40px; height: 40px; margin: -8px -8px -8px -10px; border-radius: 10px; color: var(--secondary-text-color); --mdc-icon-size: 20px; }',
    '.check:hover { background: color-mix(in srgb, var(--primary-text-color) 6%, transparent); }',
    '[data-toggle] { cursor: pointer; }',
    '[data-toggle]:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }',
    // Collapsed: chevron to the right; open: down (like the other cards).
    '.chevron { flex: none; align-self: flex-start; margin-top: 10px; color: var(--secondary-text-color); --mdc-icon-size: 20px; transition: transform .2s ease; }',
    '.chevron.closed { transform: rotate(-90deg); }',
    '.link { color: color-mix(in srgb, ' + accent + ' 65%, var(--primary-text-color)); font-weight: 500; text-decoration: none; }',
    '.link:hover { text-decoration: underline; }',
    '@media (prefers-reduced-motion: reduce) { .chevron { transition: none; } }',
    '.hw.done .check { color: var(--success-color, #43a047); }',
    '.check:focus-visible, .act:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }',
    // Outlined, never filled (card convention): accent text on an accent hairline.
    '.act { flex: none; font: inherit; font-size: 12px; font-weight: 500; cursor: pointer; padding: 3px 10px; border-radius: 10px; background: transparent;' +
      ' color: color-mix(in srgb, ' + accent + ' 60%, var(--primary-text-color)); border: 1px solid color-mix(in srgb, ' + accent + ' 50%, transparent); }',
    '.act:hover { background: color-mix(in srgb, ' + accent + ' 10%, transparent); }',
    '.act:disabled { opacity: .6; cursor: default; }',
    '.chip { flex: none; font-size: 11px; font-weight: 500; border-radius: 12px; padding: 2px 8px; white-space: nowrap;' +
      ' color: color-mix(in srgb, ' + accent + ' 55%, var(--primary-text-color)); background: color-mix(in srgb, ' + accent + ' 15%, transparent); }',
    '.chip.ok { color: color-mix(in srgb, var(--success-color, #43a047) 55%, var(--primary-text-color)); background: color-mix(in srgb, var(--success-color, #43a047) 15%, transparent); }',
    '.empty { padding: 4px 0; font-size: 13px; color: var(--secondary-text-color); }',
    '.error-text { color: color-mix(in srgb, var(--error-color, #db4437) 55%, var(--primary-text-color)); font-size: 13px; }',
  ].join('\n');
}

window.EntOne = {
  version: ENT_ONE_CARD_VERSION,
  accent: ENT_ONE_ACCENT,
  i18n: EntOneI18n,
  t: entOneT,
  lang: entOneLang,
  locale: entOneLocale,
  esc: entOneEsc,
  format: entOneFormat,
  errorText: entOneErrorText,
  accounts: entOneAccounts,
  data: entOneData,
  day: entOneDay,
  time: entOneTime,
  setTimeFormat: entOneSetTimeFormat,
  sign: entOneSign,
  canSign: entOneCanSign,
  setDone: entOneSetDone,
  refresh: entOneRefresh,
  sortedHomework: entOneSortedHomework,
  upcomingEvents: entOneUpcomingEvents,
  rows: { word: entOneWordRow, homework: entOneHomeworkRow, message: entOneMessageRow, news: entOneNewsRow, event: entOneEventRow },
  itemStyles: entOneItemStyles,
};

// ── ent-one-card ──────────────────────────────────────────────────────────────
var ENT_ONE_PANEL_PATH = 'ent-one';

class EntOneCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('ent-one-card-editor');
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = Object.assign({}, ENT_ONE_DEFAULTS, config || {});
    this.toggleAttribute?.('hide-title', config?.show_title === false);
    this._open = this._open || {};
    if (this._hass) this._render(true);
  }

  set hass(hass) {
    var first = !this._hass;
    this._hass = hass;
    var data = entOneData(hass, this._config?.config_entry_id);
    var key = data ? data.states : null;
    // Only redraw when one of the account's sensors changed.
    var changed = first || !key !== !this._lastKey || (key?.some((st, i) => st !== this._lastKey[i]));
    if (changed) {
      this._lastKey = key;
      // A new successful update clears the error shown since the one before.
      if (this._error && data?.updated && data.updated !== this._errorAt) this._error = '';
      this._render();
    }
  }

  connectedCallback() {
    this._onOutside = this._onOutside || ((ev) => {
      var anyOpen = Object.keys(this._open || {}).length > 0;
      if ((!this._confirm && !anyOpen) || ev.composedPath().indexOf(this) !== -1 || entOneInDialog(ev)) return;
      // Like the other cards: a click elsewhere closes the popup and folds the open rows.
      this._confirm = null;
      this._open = {};
      this._render(true);
    });
    document.addEventListener('click', this._onOutside, true);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onOutside, true);
    // Leaving the page (view change, conditional card hidden) closes the popup without doing anything.
    if (this._confirm || Object.keys(this._open || {}).length) {
      this._confirm = null;
      this._open = {};
      this._render(true);
    }
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  _t() {
    return entOneT(this._hass, this._config);
  }

  _locale() {
    return entOneLocale(this._hass, this._config);
  }

  _compact() {
    return false;
  }

  _detailButton() {
    return '';
  }

  _ensureShell() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = '<style>' + EntOneCard._styles() + '</style><ha-card><div class="header"></div><div class="popup" hidden></div><div class="body"></div></ha-card>';
    var card = this._root.querySelector('ha-card');
    card.addEventListener('click', this._onClick.bind(this));
    card.addEventListener('keydown', (ev) => {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.hasAttribute?.('data-toggle')) {
        ev.preventDefault();
        this._toggleRow(ev.target.getAttribute('data-toggle'));
      }
    });
  }

  _render() {
    if (!this._config || !this._hass) return;
    this._ensureShell();
    entOneSetTimeFormat(this._hass);
    var t = this._t();
    var data = entOneData(this._hass, this._config.config_entry_id);
    this._data = data;
    this._root.querySelector('ha-card').classList.toggle('mini', this._compact());
    this._renderHeader(t, data);
    this._renderPopup(t, data);
    var body = this._root.querySelector('.body');
    if (!data) {
      body.innerHTML = '<div class="pad empty">' + entOneEsc(t.no_entity) + '</div>';
      return;
    }
    if (data.unavailable) {
      body.innerHTML = '<div class="pad empty">' + entOneEsc(t.unavailable) + '</div>';
      return;
    }
    // innerHTML replaces the focused row: give the keyboard focus back to the same toggle.
    var focused = this._root.activeElement?.getAttribute?.('data-toggle');
    body.innerHTML = this._renderTiles(t, data) + (this._compact() ? '' : this._renderSections(t, data));
    if (focused) body.querySelector(`[data-toggle="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
  }

  _time(iso) {
    return entOneTime(iso, this._locale());
  }

  _renderHeader(t, data) {
    var c = this._config;
    var header = this._root.querySelector('.header');
    var title = c.title || (data?.account.schools?.[0]) || t.default_title;
    // The children's first names (or the classes of a staff account) say whose ENT this is.
    var who = '';
    if (data) {
      var names = data.children.map((ch) => ch.first_name).filter(Boolean);
      who = names.length ? names.join(' · ') : (data.account.classes || []).join(', ');
    }
    var updated = data?.updated ? entOneFormat(t.last_update, { time: this._time(data.updated) }) : '';
    var pill = '';
    if (data && !this._compact()) {
      var kind = data.unavailable ? 'bad' : data.stale.length ? 'warn' : 'ok';
      var text = data.unavailable ? t.offline : data.stale.length ? t.partial : t.up_to_date;
      pill = '<span class="status ' + kind + '" title="' + entOneEsc(updated || text) + '"><span class="status-text">' + entOneEsc(text) + '</span></span>';
    }
    var buttons = '';
    if (data && !this._compact()) {
      if (c.show_refresh) {
        buttons += '<ha-icon-button class="refresh-btn' + (this._refreshing ? ' spinning' : '') + '" data-action="refresh" label="' + entOneEsc(t.refresh) + '" title="' + entOneEsc(t.refresh) + '"><ha-icon icon="mdi:refresh"></ha-icon></ha-icon-button>';
      }
      if (data.url) {
        buttons += '<ha-icon-button data-action="open" label="' + entOneEsc(t.open_ent) + '" title="' + entOneEsc(t.open_ent) + '"><ha-icon icon="mdi:open-in-new"></ha-icon></ha-icon-button>';
      }
    }
    var sub = this._error
      ? '<div class="sub error"><span>' + entOneEsc(this._error) + '</span><button class="dismiss" data-action="dismiss" aria-label="' + entOneEsc(t.close) + '" title="' + entOneEsc(t.close) + '"><ha-icon icon="mdi:close"></ha-icon></button></div>'
      : who ? '<div class="sub">' + entOneEsc(who) + '</div>' : '';
    header.innerHTML =
      '<div class="title"><div class="logo" aria-hidden="true"><ha-icon icon="mdi:school-outline"></ha-icon></div>' +
      '<div class="titles"><div class="name">' + entOneEsc(title) + '</div>' + sub + '</div></div>' +
      pill + (buttons ? '<div class="buttons">' + buttons + '</div>' : '') + this._detailButton(t);
  }

  // Confirmation popup at the top of the card (card convention), never centered on the screen.
  _renderPopup(t, data) {
    var popup = this._root.querySelector('.popup');
    var w = this._confirm && data ? data.words.find((x) => String(x.id) === this._confirm.id && String(x.child_id) === this._confirm.child) : null;
    if (!w) {
      this._confirm = null;
      popup.hidden = true;
      popup.innerHTML = '';
      return;
    }
    popup.hidden = false;
    popup.innerHTML =
      '<div class="popup-title">' + entOneEsc(t.sign_title) + '</div>' +
      '<div class="popup-text">' + entOneEsc(entOneFormat(t.sign_text, { title: w.title || '—', child: w.child || '' })) + '</div>' +
      (w.text ? '<div class="item-text quote">' + entOneEsc(w.text) + '</div>' : '') +
      '<div class="popup-actions"><button class="act ghost" data-action="cancel">' + entOneEsc(t.cancel) + '</button>' +
      '<button class="act" data-action="confirm"' + (this._confirm.busy ? ' disabled' : '') + '>' + entOneEsc(this._confirm.busy ? t.signing : t.confirm) + '</button></div>';
  }

  _renderTiles(t, data) {
    var toSign = data.words.filter((w) => !w.signed).length;
    var todo = data.homework.filter((h) => !h.done).length;
    var tile = (value, label, icon, hot, tab) =>
      '<button class="tile' + (hot ? ' hot' : '') + '" data-action="goto" data-tab="' + tab + '" aria-label="' + entOneEsc(value + ' ' + label) + '">' +
      '<span class="v"><ha-icon icon="' + icon + '"></ha-icon>' + value + '</span><span class="l">' + entOneEsc(label) + '</span></button>';
    return '<div class="tiles">' +
      tile(data.unread, t.tile_messages, 'mdi:email-outline', false, 'messages') +
      tile(toSign, t.tile_words, 'mdi:notebook-edit-outline', toSign > 0, 'words') +
      tile(todo, t.tile_homework, 'mdi:pencil-outline', false, 'homework') +
      '</div>';
  }

  _section(key, title, rows, empty, extra) {
    // An empty section is left out (but homework, which says "nothing to do"), unless show_empty.
    if (!rows.length && !this._config.show_empty && key !== 'homework') return '';
    return '<div class="section" data-section="' + key + '"><div class="section-title">' + entOneEsc(title) + '</div>' +
      (rows.length ? rows.join('') : '<div class="empty">' + entOneEsc(empty) + '</div>') +
      (extra ? '<div class="more">' + entOneEsc(extra) + '</div>' : '') + '</div>';
  }

  _renderSections(t, data) {
    var c = this._config;
    var max = Math.max(1, Number(c.max_items) || ENT_ONE_DEFAULTS.max_items);
    var locale = this._locale();
    var isOpen = (key) => !!this._open[key];
    var limit = (list) => ({ shown: list.slice(0, max), rest: Math.max(0, list.length - max) });
    var more = (n) => (n ? entOneFormat(t.more, { n: n }) : '');
    var html = '';
    if (c.show_words) {
      var canSign = entOneCanSign(this._hass);
      var words = limit(data.words.filter((w) => !w.signed));
      html += this._section('words', t.section_words, words.shown.map((w) => entOneWordRow(w, t, locale, { canSign: canSign, isOpen: isOpen })), t.no_words, more(words.rest));
    }
    if (c.show_homework) {
      var hw = limit(entOneSortedHomework(data.homework, c.show_done));
      html += this._section('homework', t.section_homework, hw.shown.map((h) => entOneHomeworkRow(h, t, locale, { isOpen: isOpen })), t.no_homework, more(hw.rest));
    }
    if (c.show_messages) {
      var msgs = limit(data.messages.filter((m) => m.unread));
      html += this._section('messages', t.section_messages, msgs.shown.map((m) => entOneMessageRow(m, t, locale, { url: data.url, isOpen: isOpen })), t.no_messages, more(msgs.rest));
    }
    if (c.show_events) {
      var events = limit(entOneUpcomingEvents(data.events));
      html += this._section('events', t.section_events, events.shown.map((e) => entOneEventRow(e, t, locale, { isOpen: isOpen })), t.no_events, more(events.rest));
    }
    if (c.show_news) {
      var news = limit(data.news);
      html += this._section('news', t.section_news, news.shown.map((n) => entOneNewsRow(n, t, locale, { isOpen: isOpen })), t.no_news, more(news.rest));
    }
    return html;
  }

  _toggleRow(key) {
    if (this._open[key]) delete this._open[key];
    else this._open[key] = true;
    this._render(true);
  }

  // A count opens the panel on its tab; without the panel, the card scrolls to the section (the mini card opens).
  _goto(tab) {
    if (this._hass?.panels?.[ENT_ONE_PANEL_PATH]) {
      window.history.pushState(null, '', `/${ENT_ONE_PANEL_PATH}?tab=${tab}`);
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
      return;
    }
    if (this._compact()) this._setZoom?.(true);
    var section = { messages: 'messages', words: 'words', homework: 'homework' }[tab];
    this._root.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  _onClick(ev) {
    var toggle = ev.target.closest ? ev.target.closest('[data-toggle]') : null;
    var el = ev.target.closest ? ev.target.closest('[data-action]') : null;
    if (toggle && !el && !ev.target.closest('a')) {
      ev.stopPropagation();
      this._toggleRow(toggle.getAttribute('data-toggle'));
      return;
    }
    if (!el || !this._data) return;
    var action = el.getAttribute('data-action');
    var data = this._data;
    if (action === 'refresh') this._refresh();
    else if (action === 'open') window.open(data.url, '_blank', 'noopener');
    else if (action === 'detail') this._toggleDetail(ev);
    else if (action === 'goto') {
      ev.stopPropagation();
      this._goto(el.getAttribute('data-tab'));
    } else if (action === 'dismiss') {
      this._error = '';
      this._render(true);
    } else if (action === 'sign' && entOneCanSign(this._hass)) {
      ev.stopPropagation();
      this._confirm = { id: el.getAttribute('data-id'), child: el.getAttribute('data-child') };
      this._render(true);
    } else if (action === 'cancel') {
      this._confirm = null;
      this._render(true);
    } else if (action === 'confirm') this._doSign();
    else if (action === 'homework') {
      var item = data.homework.find((h) => String(h.id) === el.getAttribute('data-id') && String(h.book_id) === el.getAttribute('data-book'));
      if (item) this._toggleHomework(item);
    }
  }

  _fail(err, prefix) {
    entOneErrorText(this._hass, err).then((text) => {
      this._error = `${prefix || this._t().action_failed} ${text}`;
      this._errorAt = this._data?.updated;
      this._render(true);
    });
  }

  _doSign() {
    var w = this._data.words.find((x) => String(x.id) === this._confirm.id && String(x.child_id) === this._confirm.child);
    if (!w || this._confirm.busy) return;
    this._confirm.busy = true;
    this._error = '';
    this._render(true);
    entOneSign(this._hass, this._data.entryId, w)
      .then(() => {
        this._confirm = null;
        this._render(true);
      })
      .catch((err) => {
        this._confirm = null;
        this._fail(err);
      });
  }

  _toggleHomework(item) {
    this._error = '';
    entOneSetDone(this._hass, this._data.entryId, item, !item.done).catch((err) => this._fail(err));
  }

  _refresh() {
    if (this._refreshing) return;
    this._refreshing = true;
    this._error = '';
    this._render(true);
    entOneRefresh(this._hass, this._data.entryId)
      .catch((err) => this._fail(err, this._t().refresh_failed))
      .finally(() => {
        this._refreshing = false;
        this._render(true);
      });
  }

  static _styles() {
    var A = ENT_ONE_ACCENT;
    return [
      ':host { display: block; }',
      ':host::before { content: ""; display: grid; grid-template-columns: minmax(0, 360px); height: 0; }',
      'ha-card { padding: 0 0 10px; overflow: hidden; container-type: inline-size; }',
      '.header { display: flex; align-items: center; gap: 10px; padding: 12px 10px 8px 12px; min-height: 40px; }',
      '.title { flex: 1 1 0; min-width: calc(5ch + 50px); display: flex; align-items: center; gap: 10px; }',
      '.logo { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; color: ' + A + '; background: color-mix(in srgb, ' + A + ' 16%, transparent); }',
      '.logo ha-icon { --mdc-icon-size: 24px; }',
      '.titles { flex: 1 1 0; min-width: 5ch; overflow: hidden; }',
      ':host([hide-title]) .titles > .name { display: none; }',
      '.name { font-size: 16px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.sub.error { display: flex; align-items: flex-start; gap: 4px; white-space: normal; color: color-mix(in srgb, var(--error-color, #db4437) 55%, var(--primary-text-color)); }',
      '.dismiss { all: unset; cursor: pointer; flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; --mdc-icon-size: 14px; }',
      '.dismiss:hover { background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent); }',
      '.dismiss:focus-visible { outline: 2px solid var(--primary-color); }',
      '.status { --c: var(--success-color, #43a047); flex: 0 1 auto; min-width: 0; max-width: 45%; display: flex; align-items: center; overflow: hidden; font-size: 12px; font-weight: 500; line-height: 1; white-space: nowrap;' +
        ' border-radius: 12px; padding: 5px 10px; color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); background: color-mix(in srgb, var(--c) 15%, transparent); }',
      '.status.warn { --c: var(--warning-color, #ffa600); }',
      '.status.bad { --c: var(--error-color, #db4437); }',
      '.status-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }',
      '.buttons { display: flex; align-items: center; flex: none; }',
      '.buttons ha-icon-button { --mdc-icon-button-size: 28px; --mdc-icon-size: 16px; color: var(--secondary-text-color); }',
      '.spinning ha-icon { animation: ent-one-spin 1s linear infinite; }',
      '@keyframes ent-one-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '@container (max-width: 320px) { .header { gap: 4px; } .logo { display: none; } .status { padding: 5px 8px; } }',
      '@container (max-width: 240px) { .status { padding: 5px; } .status::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }' +
        ' .status-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); } }',
      '.pad { padding: 4px 16px; }',
      '.tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 0 12px; }',
      '.tile { all: unset; box-sizing: border-box; cursor: pointer; display: block; min-width: 0; padding: 8px 10px; border-radius: 12px; background: color-mix(in srgb, var(--primary-text-color) 5%, transparent); }',
      '.tile:hover { background: color-mix(in srgb, var(--primary-text-color) 9%, transparent); }',
      '.tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }',
      '.tile.hot:hover { background: color-mix(in srgb, ' + A + ' 20%, transparent); }',
      '.tile.hot { background: color-mix(in srgb, ' + A + ' 14%, transparent); }',
      '.tile .v { display: flex; align-items: center; gap: 6px; font-size: 22px; font-weight: 500; line-height: 1.1; color: var(--primary-text-color); --mdc-icon-size: 18px; }',
      '.tile .v ha-icon { color: var(--secondary-text-color); }',
      '.tile.hot .v ha-icon { color: ' + A + '; }',
      '.tile .l { display: block; font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.section { padding: 10px 12px 0; }',
      '.section-title { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); margin-bottom: 2px; }',
      '.more { font-size: 12px; color: var(--secondary-text-color); padding-top: 2px; }',
      entOneItemStyles(A),
      '.popup { margin: 0 12px 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid color-mix(in srgb, ' + A + ' 40%, transparent); background: color-mix(in srgb, ' + A + ' 6%, var(--card-background-color, #fff)); }',
      '.popup[hidden] { display: none; }',
      '.popup-title { font-weight: 500; color: var(--primary-text-color); }',
      '.popup-text { font-size: 13px; color: var(--secondary-text-color); margin-top: 2px; }',
      '.quote { max-height: 8em; overflow: auto; padding: 6px 8px; border-radius: 8px; background: color-mix(in srgb, var(--primary-text-color) 5%, transparent); }',
      '.popup-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }',
      '.act.ghost { color: var(--secondary-text-color); border-color: var(--divider-color, rgba(0,0,0,.2)); }',
      ':host([mini])::before { grid-template-columns: minmax(0, 260px); }',
      '.detail { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin-right: 4px; border-radius: 50%; align-self: flex-start;' +
        ' display: grid; place-items: center; color: var(--secondary-text-color); --mdc-icon-size: 16px; }',
      '.detail:hover { background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent); color: var(--primary-text-color); }',
      '.detail:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }',
      '@container (max-width: 320px) { ha-card.mini .logo { display: grid; } }',
      '@container (max-width: 200px) { .tiles { grid-template-columns: minmax(0, 1fr); } }',
      '@media (prefers-reduced-motion: reduce) { .spinning ha-icon { animation: none; opacity: .5; } }',
    ].join('\n');
  }
}

// ── ent-one-mini-card: the three counts, and a button to show the full card ───
class EntOneMiniCard extends EntOneCard {
  constructor() {
    super();
    this._zoomed = false;
    this._onOutsideMini = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !entOneInDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onOutsideMini, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onOutsideMini, true);
    if (this._zoomed) this._setZoom(false);
  }

  setConfig(config) {
    this.setAttribute?.('mini', '');
    super.setConfig(config);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 2;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 4, rows: 'auto' };
  }

  _compact() {
    return !this._zoomed;
  }

  _detailButton(t) {
    var label = this._zoomed ? t.show_compact : t.show_full;
    return '<button class="detail" data-action="detail" title="' + entOneEsc(label) + '" aria-label="' + entOneEsc(label) + '">' +
      '<ha-icon icon="mdi:' + (this._zoomed ? 'arrow-collapse' : 'arrow-expand') + '"></ha-icon></button>';
  }

  _toggleDetail(ev) {
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    if (!ev.detail) this._root.querySelector('.detail')?.focus?.({ preventScroll: true });
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    if (!zoomed) this._confirm = null;
    this._render(true);
  }
}

// ── editor ────────────────────────────────────────────────────────────────────
var ENT_ONE_EDITOR_KEYS = {
  config_entry_id: 'editor_entry',
  title: 'editor_title',
  show_title: 'editor_show_title',
  show_refresh: 'editor_show_refresh',
  show_words: 'editor_show_words',
  show_homework: 'editor_show_homework',
  show_done: 'editor_show_done',
  show_messages: 'editor_show_messages',
  show_news: 'editor_show_news',
  show_events: 'editor_show_events',
  show_empty: 'editor_show_empty',
  max_items: 'editor_max_items',
  language: 'editor_language',
};

function entOneEditorSchema(t) {
  var bool = (name) => ({ name: name, selector: { boolean: {} } });
  return [
    { name: 'config_entry_id', selector: { config_entry: { integration: 'ent_one' } } },
    { name: 'title', selector: { text: {} } },
    {
      type: 'grid',
      name: '',
      schema: ['show_title', 'show_refresh', 'show_words', 'show_homework', 'show_done', 'show_messages', 'show_events', 'show_news', 'show_empty'].map(bool),
    },
    { name: 'max_items', selector: { number: { min: 1, max: 20, mode: 'box' } } },
    {
      name: 'language',
      selector: { select: { mode: 'dropdown', options: [{ value: '', label: t.editor_lang_auto }].concat(ENT_ONE_LANGUAGES.map((l) => ({ value: l[0], label: l[1] }))) } },
    },
  ];
}

class EntOneCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({}, config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    else this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.addEventListener('value-changed', this._valueChanged.bind(this));
      this.appendChild(this._form);
    }
    var lang = entOneLang(this._hass, this._config);
    if (lang !== this._lang) {
      this._lang = lang;
      var t = entOneT(this._hass, this._config);
      this._form.schema = entOneEditorSchema(t);
      this._form.computeLabel = (field) => t[ENT_ONE_EDITOR_KEYS[field.name]] || field.name;
    }
    this._form.hass = this._hass;
    this._form.data = Object.assign({}, ENT_ONE_DEFAULTS, this._config);
  }

  _valueChanged(ev) {
    var value = Object.assign({}, ev.detail.value);
    Object.keys(ENT_ONE_DEFAULTS).forEach((key) => {
      if (value[key] === ENT_ONE_DEFAULTS[key]) delete value[key];
    });
    ['title', 'config_entry_id', 'language'].forEach((key) => {
      if (!value[key]) delete value[key];
    });
    this._config = value;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: value }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('ent-one-card-editor')) customElements.define('ent-one-card-editor', EntOneCardEditor);

var entOneDefined = false;
if (!customElements.get('ent-one-card')) {
  customElements.define('ent-one-card', EntOneCard);
  entOneDefined = true;
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'ent-one-card',
    name: 'ENT ONE',
    description: 'Liaison book, homework, messages, calendar and news of an ENT ONE account.',
    preview: true,
    documentationURL: 'https://github.com/juju35/ha-ent-one',
  });
}
if (!customElements.get('ent-one-mini-card')) {
  customElements.define('ent-one-mini-card', EntOneMiniCard);
  entOneDefined = true;
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'ent-one-mini-card',
    name: 'ENT ONE mini',
    description: 'Unread messages, words to sign and homework, with a button to show the full ENT ONE card.',
    preview: true,
    documentationURL: 'https://github.com/juju35/ha-ent-one',
  });
}
if (entOneDefined) {
  console.info(`%c ENT-ONE-CARD %c v${ENT_ONE_CARD_VERSION} `, 'color:#fff;background:#f39c3c;font-weight:700', 'color:#f39c3c;background:#fff');
}
