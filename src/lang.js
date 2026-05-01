/* eslint-disable */
// ============================================================
//  FALCOM — Language System (EN / FR)
//  Usage: import { useLang } from '../lang';
//         const { t, lang, toggleLang } = useLang();
//         <span>{t.overview}</span>
// ============================================================

import { createContext, useContext, useState } from "react";

export const translations = {
  en: {
    // Nav
    overview:      "Overview",
    statistics:    "Statistics",
    products:      "My Products",
    orders:        "My Orders",
    website:       "My Website",
    justcredit:    "Just Credit",
    suggestions:   "Suggestions",
    profile:       "My Profile",
    logout:        "Logout",
    administrator: "Administrator",
    projectOwner:  "Project Owner",

    // Overview
    welcomeBack:      "Welcome back",
    workspaceSummary: "Here's a summary of your FALCOM workspace.",
    quickAccess:      "Quick Access",
    latestSuggestions:"Latest Suggestions",
    currentProject:   "Current Project",
    memberSince:      "Member Since",
    active:           "Active",

    // Products
    myProducts:       "My Products",
    noProducts:       "No products assigned to your account yet. Your administrator will add them soon.",
    viewHistory:      "View Sales History",
    history:          "History",
    salesHistory:     "Sales History",
    noSales:          "No sales recorded yet for this product.",
    unitsSold:        "Units Sold",
    totalRevenue:     "Total Revenue",
    currentStock:     "Current Stock",
    totalProducts:    "Products",
    inStock:          "In Stock",
    price:            "Sale Price",
    stock:            "Stock",
    sold:             "Sold",
    revenue:          "Revenue",
    units:            "units",
    date:             "Date",
    time:             "Time",
    qty:              "Qty",
    unitPrice:        "Unit Price",
    total:            "Total",
    note:             "Note",
    close:            "Close",

    // Orders / Website / JustCredit
    myOrders:         "My Orders",
    ordersDesc:       "Access your complete order history, track current orders, and manage your purchases.",
    goToOrders:       "Go to My Orders",
    myWebsite:        "My Website",
    websiteDesc:      "Visit your website to see how it looks live. Check your pages and overall online presence.",
    visitWebsite:     "Visit My Website",
    notSetYet:        "Your administrator hasn't set this link yet. Please check back later or contact them.",
    justCreditDesc:   "Follow the 3 steps below to log in to your Just Credit account in seconds.",
    copyEmail:        "Copy Email",
    copyPassword:     "Copy Password",
    openSite:         "Open Site",
    startOver:        "↺ Start over",
    quickCopy:        "Quick copy:",
    notConfigured:    "Your Just Credit credentials haven't been set yet. Please contact your administrator.",
    howToLogin:       "How to login:",
    step1:            "Copy your Email",
    step2:            "Copy your Password",
    step3:            "Open Just Credit & Paste",
    step3sub:         "The site opens — paste email, then paste password",

    // Suggestions
    suggestionsFrom:  "Suggestions from Admin",
    noSuggestions:    "No suggestions yet. Your admin will post recommendations here.",
    general:          "General",
    personal:         "Personal",

    // Profile
    myProfile:        "My Profile",
    fullName:         "Full Name",
    email:            "Email",
    project:          "Project",
    status:           "Status",
    profileNote:      "To update your info, contact your FALCOM administrator.",
    notAssigned:      "Not assigned",
  },

  fr: {
    // Nav
    overview:      "Aperçu",
    statistics:    "Statistiques",
    products:      "Mes Produits",
    orders:        "Mes Commandes",
    website:       "Mon Site Web",
    justcredit:    "Just Credit",
    suggestions:   "Suggestions",
    profile:       "Mon Profil",
    logout:        "Déconnexion",
    administrator: "Administrateur",
    projectOwner:  "Responsable Projet",

    // Overview
    welcomeBack:      "Bon retour",
    workspaceSummary: "Voici un résumé de votre espace FALCOM.",
    quickAccess:      "Accès Rapide",
    latestSuggestions:"Dernières Suggestions",
    currentProject:   "Projet en cours",
    memberSince:      "Membre depuis",
    active:           "Actif",

    // Products
    myProducts:       "Mes Produits",
    noProducts:       "Aucun produit assigné à votre compte. Votre administrateur les ajoutera bientôt.",
    viewHistory:      "Voir l'historique des ventes",
    history:          "Historique",
    salesHistory:     "Historique des ventes",
    noSales:          "Aucune vente enregistrée pour ce produit.",
    unitsSold:        "Unités vendues",
    totalRevenue:     "Chiffre d'affaires",
    currentStock:     "Stock actuel",
    totalProducts:    "Produits",
    inStock:          "En stock",
    price:            "Prix de vente",
    stock:            "Stock",
    sold:             "Vendus",
    revenue:          "Revenus",
    units:            "unités",
    date:             "Date",
    time:             "Heure",
    qty:              "Qté",
    unitPrice:        "Prix unitaire",
    total:            "Total",
    note:             "Note",
    close:            "Fermer",

    // Orders / Website / JustCredit
    myOrders:         "Mes Commandes",
    ordersDesc:       "Accédez à l'historique de vos commandes, suivez vos commandes en cours et gérez vos achats.",
    goToOrders:       "Voir mes commandes",
    myWebsite:        "Mon Site Web",
    websiteDesc:      "Visitez votre site pour voir son apparence en ligne. Vérifiez vos pages et votre présence.",
    visitWebsite:     "Visiter mon site",
    notSetYet:        "Votre administrateur n'a pas encore configuré ce lien. Veuillez le contacter.",
    justCreditDesc:   "Suivez les 3 étapes ci-dessous pour vous connecter à Just Credit en quelques secondes.",
    copyEmail:        "Copier l'email",
    copyPassword:     "Copier le mot de passe",
    openSite:         "Ouvrir le site",
    startOver:        "↺ Recommencer",
    quickCopy:        "Copie rapide :",
    notConfigured:    "Vos identifiants Just Credit ne sont pas encore configurés. Contactez votre administrateur.",
    howToLogin:       "Comment se connecter :",
    step1:            "Copiez votre email",
    step2:            "Copiez votre mot de passe",
    step3:            "Ouvrez Just Credit & Collez",
    step3sub:         "Le site s'ouvre — collez l'email puis le mot de passe",

    // Suggestions
    suggestionsFrom:  "Suggestions de l'Admin",
    noSuggestions:    "Aucune suggestion pour l'instant. Votre admin publiera des recommandations ici.",
    general:          "Général",
    personal:         "Personnel",

    // Profile
    myProfile:        "Mon Profil",
    fullName:         "Nom complet",
    email:            "Email",
    project:          "Projet",
    status:           "Statut",
    profileNote:      "Pour mettre à jour vos informations, contactez votre administrateur FALCOM.",
    notAssigned:      "Non assigné",
  },
};

export const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("falcom_lang") || "en");
  const toggleLang = () => {
    const next = lang === "en" ? "fr" : "en";
    setLang(next);
    localStorage.setItem("falcom_lang", next);
  };
  const t = translations[lang];
  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);