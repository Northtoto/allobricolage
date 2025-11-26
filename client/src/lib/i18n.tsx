import { createContext, useContext, useState } from "react";

type Language = "fr" | "ar";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.findTech": "Trouver un Technicien",
    "nav.postJob": "Publier un Travail",
    "nav.forTech": "Espace Technicien",
    "nav.forClient": "Espace Client",
    "nav.dashboard": "Tableau de Bord",
    
    // Hero
    "hero.title": "Trouvez le Meilleur Technicien",
    "hero.titleHighlight": "en 2 Minutes",
    "hero.subtitle": "Notre plateforme intelligente analyse votre demande pour vous connecter avec le technicien parfait. Plomberie, électricité, peinture et plus encore.",
    "hero.searchPlaceholder": "Rechercher un technicien... (ex: plombier à Casablanca)",
    "hero.cta": "Trouver un Technicien",
    "hero.trust1": "Matching Intelligent",
    "hero.trust2": "500K+ Travaux Complétés",
    "hero.trust3": "Réponse en 2min",
    
    // Services
    "services.title": "Nos Services",
    "services.plomberie": "Plomberie",
    "services.electricite": "Électricité",
    "services.peinture": "Peinture",
    "services.menuiserie": "Menuiserie",
    "services.climatisation": "Climatisation",
    "services.maconnerie": "Maçonnerie",
    "services.carrelage": "Carrelage",
    "services.serrurerie": "Serrurerie",
    "services.jardinage": "Jardinage",
    "services.nettoyage": "Nettoyage",
    
    // Job posting
    "job.title": "Décrivez votre Travail",
    "job.description": "Description du problème",
    "job.descPlaceholder": "Expliquez en détail ce dont vous avez besoin...",
    "job.city": "Ville",
    "job.selectCity": "Sélectionnez votre ville",
    "job.urgency": "Urgence",
    "job.urgencyLow": "Pas pressé",
    "job.urgencyNormal": "Normal",
    "job.urgencyHigh": "Urgent",
    "job.urgencyEmergency": "Urgence",
    "job.analyzing": "Analyse de votre demande...",
    "job.findMatches": "Trouver des Techniciens",
    
    // AI Analysis
    "ai.service": "Service détecté",
    "ai.urgency": "Niveau d'urgence",
    "ai.complexity": "Complexité",
    "ai.duration": "Durée estimée",
    "ai.confidence": "Confiance IA",
    
    // Matching
    "match.title": "Techniciens Recommandés",
    "match.score": "Score de Match",
    "match.distance": "Distance",
    "match.response": "Temps de réponse",
    "match.jobs": "Travaux complétés",
    "match.available": "Disponible maintenant",
    "match.nextAvailable": "Prochaine disponibilité",
    "match.book": "Réserver",
    "match.whyMatch": "Pourquoi ce match?",
    "match.estimatedCost": "Coût estimé",
    
    // Pricing
    "price.breakdown": "Détail du prix",
    "price.base": "Tarif de base",
    "price.urgency": "Prime d'urgence",
    "price.time": "Prime horaire",
    "price.complexity": "Prime complexité",
    "price.confidence": "Intervalle de confiance",
    "price.belowMarket": "sous la moyenne du marché",
    "price.aboveMarket": "au-dessus de la moyenne",
    
    // Booking
    "booking.title": "Confirmer la Réservation",
    "booking.technician": "Technicien",
    "booking.date": "Date",
    "booking.time": "Heure",
    "booking.name": "Votre nom",
    "booking.phone": "Téléphone",
    "booking.confirm": "Confirmer la Réservation",
    "booking.success": "Réservation confirmée!",
    
    // Upsell
    "upsell.title": "Pendant que le technicien est là...",
    "upsell.discount": "de réduction",
    "upsell.add": "Ajouter",
    
    // Technician Dashboard
    "tech.dashboard": "Tableau de Bord Technicien",
    "tech.earnings": "Revenus",
    "tech.pendingJobs": "Travaux en Attente",
    "tech.rating": "Note Moyenne",
    "tech.completedJobs": "Travaux Complétés",
    "tech.accept": "Accepter",
    "tech.decline": "Refuser",
    "tech.newJob": "Nouvelle Demande",
    
    // Client Dashboard
    "client.dashboard": "Tableau de Bord Client",
    "client.activeJobs": "Travaux Actifs",
    "client.completedJobs": "Travaux Terminés",
    "client.totalSpent": "Total Dépensé",
    "client.noJobs": "Aucun travail en cours",
    "client.postFirst": "Publiez votre première demande",
    
    // DarijaChat
    "chat.title": "Support DarijaChat",
    "chat.placeholder": "Écrivez votre message en Darija, Français ou Arabe...",
    "chat.send": "Envoyer",
    "chat.greeting": "Salam! Ana hna bach n3awnek. Kifach nqdr n3awnek lyoum?",
    
    // Common
    "common.loading": "Chargement...",
    "common.error": "Une erreur s'est produite",
    "common.retry": "Réessayer",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.mad": "MAD",
    "common.km": "km",
    "common.min": "min",
    "common.hours": "heures",
    "common.days": "jours",
    "common.verified": "Vérifié",
    "common.reviews": "avis",
  },
  ar: {
    // Navigation
    "nav.home": "الرئيسية",
    "nav.findTech": "البحث عن تقني",
    "nav.postJob": "نشر عمل",
    "nav.forTech": "مساحة التقني",
    "nav.forClient": "مساحة العميل",
    "nav.dashboard": "لوحة التحكم",
    
    // Hero
    "hero.title": "اعثر على أفضل تقني",
    "hero.titleHighlight": "في دقيقتين",
    "hero.subtitle": "منصتنا الذكية تحلل طلبك للربط مع التقني المثالي. سباكة، كهرباء، دهان والمزيد.",
    "hero.searchPlaceholder": "ابحث عن تقني... (مثال: سباك في الدار البيضاء)",
    "hero.cta": "البحث عن تقني",
    "hero.trust1": "مطابقة ذكية",
    "hero.trust2": "+500 ألف عمل مكتمل",
    "hero.trust3": "رد في دقيقتين",
    
    // Services
    "services.title": "خدماتنا",
    "services.plomberie": "سباكة",
    "services.electricite": "كهرباء",
    "services.peinture": "دهان",
    "services.menuiserie": "نجارة",
    "services.climatisation": "تكييف",
    "services.maconnerie": "بناء",
    "services.carrelage": "بلاط",
    "services.serrurerie": "أقفال",
    "services.jardinage": "حدائق",
    "services.nettoyage": "تنظيف",
    
    // Job posting
    "job.title": "صف عملك",
    "job.description": "وصف المشكلة",
    "job.descPlaceholder": "اشرح بالتفصيل ما تحتاجه...",
    "job.city": "المدينة",
    "job.selectCity": "اختر مدينتك",
    "job.urgency": "الاستعجال",
    "job.urgencyLow": "غير مستعجل",
    "job.urgencyNormal": "عادي",
    "job.urgencyHigh": "مستعجل",
    "job.urgencyEmergency": "طوارئ",
    "job.analyzing": "تحليل طلبك...",
    "job.findMatches": "البحث عن تقنيين",
    
    // AI Analysis
    "ai.service": "الخدمة المكتشفة",
    "ai.urgency": "مستوى الاستعجال",
    "ai.complexity": "التعقيد",
    "ai.duration": "المدة المقدرة",
    "ai.confidence": "الثقة",
    
    // Matching
    "match.title": "التقنيون الموصى بهم",
    "match.score": "درجة التطابق",
    "match.distance": "المسافة",
    "match.response": "وقت الاستجابة",
    "match.jobs": "الأعمال المكتملة",
    "match.available": "متاح الآن",
    "match.nextAvailable": "التوفر القادم",
    "match.book": "حجز",
    "match.whyMatch": "لماذا هذا التطابق؟",
    "match.estimatedCost": "التكلفة المقدرة",
    
    // Pricing
    "price.breakdown": "تفصيل السعر",
    "price.base": "السعر الأساسي",
    "price.urgency": "علاوة الاستعجال",
    "price.time": "علاوة الوقت",
    "price.complexity": "علاوة التعقيد",
    "price.confidence": "نطاق الثقة",
    "price.belowMarket": "أقل من متوسط السوق",
    "price.aboveMarket": "أعلى من المتوسط",
    
    // Booking
    "booking.title": "تأكيد الحجز",
    "booking.technician": "التقني",
    "booking.date": "التاريخ",
    "booking.time": "الوقت",
    "booking.name": "اسمك",
    "booking.phone": "الهاتف",
    "booking.confirm": "تأكيد الحجز",
    "booking.success": "تم تأكيد الحجز!",
    
    // Upsell
    "upsell.title": "بينما التقني هنا...",
    "upsell.discount": "خصم",
    "upsell.add": "إضافة",
    
    // Technician Dashboard
    "tech.dashboard": "لوحة تحكم التقني",
    "tech.earnings": "الأرباح",
    "tech.pendingJobs": "الأعمال المعلقة",
    "tech.rating": "التقييم المتوسط",
    "tech.completedJobs": "الأعمال المكتملة",
    "tech.accept": "قبول",
    "tech.decline": "رفض",
    "tech.newJob": "طلب جديد",
    
    // Client Dashboard
    "client.dashboard": "لوحة تحكم العميل",
    "client.activeJobs": "الأعمال النشطة",
    "client.completedJobs": "الأعمال المكتملة",
    "client.totalSpent": "المجموع المنفق",
    "client.noJobs": "لا توجد أعمال حالية",
    "client.postFirst": "انشر طلبك الأول",
    
    // DarijaChat
    "chat.title": "دعم الدردشة",
    "chat.placeholder": "اكتب رسالتك بالدارجة أو الفرنسية أو العربية...",
    "chat.send": "إرسال",
    "chat.greeting": "سلام! أنا هنا باش نعاونك. كيفاش نقدر نعاونك اليوم?",
    
    // Common
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.retry": "إعادة المحاولة",
    "common.cancel": "إلغاء",
    "common.save": "حفظ",
    "common.mad": "درهم",
    "common.km": "كم",
    "common.min": "دقيقة",
    "common.hours": "ساعات",
    "common.days": "أيام",
    "common.verified": "موثق",
    "common.reviews": "تقييمات",
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("allobricolage-lang") as Language;
      return stored || "fr";
    }
    return "fr";
  });

  const t = (key: string): string => {
    return translations[lang][key] || key;
  };

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("allobricolage-lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t, isRTL: lang === "ar" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
