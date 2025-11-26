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
    "nav.findTech": "Trouver un Artisan",
    "nav.postJob": "Publier un Travail",
    "nav.forTech": "Pour les Artisans",
    "nav.dashboard": "Tableau de Bord",
    
    // Hero
    "hero.title": "Trouvez le Meilleur Artisan",
    "hero.titleHighlight": "en 2 Minutes",
    "hero.subtitle": "47 modèles IA analysent votre demande pour vous connecter avec l'artisan parfait. Plomberie, électricité, peinture et plus encore.",
    "hero.searchPlaceholder": "Décrivez votre problème... (ex: fuite d'eau dans la cuisine)",
    "hero.cta": "Trouver un Artisan",
    "hero.trust1": "47 Modèles IA",
    "hero.trust2": "500K+ Travaux Complétés",
    "hero.trust3": "Matching en 2min",
    
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
    "job.analyzing": "L'IA analyse votre demande...",
    "job.findMatches": "Trouver des Artisans",
    
    // AI Analysis
    "ai.service": "Service détecté",
    "ai.urgency": "Niveau d'urgence",
    "ai.complexity": "Complexité",
    "ai.duration": "Durée estimée",
    "ai.confidence": "Confiance IA",
    
    // Matching
    "match.title": "Artisans Recommandés",
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
    "booking.technician": "Artisan",
    "booking.date": "Date",
    "booking.time": "Heure",
    "booking.name": "Votre nom",
    "booking.phone": "Téléphone",
    "booking.confirm": "Confirmer la Réservation",
    "booking.success": "Réservation confirmée!",
    
    // Upsell
    "upsell.title": "Pendant que l'artisan est là...",
    "upsell.discount": "de réduction",
    "upsell.add": "Ajouter",
    
    // Technician Dashboard
    "tech.dashboard": "Tableau de Bord Artisan",
    "tech.earnings": "Revenus",
    "tech.pendingJobs": "Travaux en Attente",
    "tech.rating": "Note Moyenne",
    "tech.completedJobs": "Travaux Complétés",
    "tech.accept": "Accepter",
    "tech.decline": "Refuser",
    "tech.newJob": "Nouvelle Demande",
    
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
    "nav.findTech": "البحث عن حرفي",
    "nav.postJob": "نشر عمل",
    "nav.forTech": "للحرفيين",
    "nav.dashboard": "لوحة التحكم",
    
    // Hero
    "hero.title": "اعثر على أفضل حرفي",
    "hero.titleHighlight": "في دقيقتين",
    "hero.subtitle": "47 نموذج ذكاء اصطناعي يحلل طلبك للربط مع الحرفي المثالي. سباكة، كهرباء، دهان والمزيد.",
    "hero.searchPlaceholder": "صف مشكلتك... (مثال: تسرب مياه في المطبخ)",
    "hero.cta": "البحث عن حرفي",
    "hero.trust1": "47 نموذج ذكاء اصطناعي",
    "hero.trust2": "+500 ألف عمل مكتمل",
    "hero.trust3": "مطابقة في دقيقتين",
    
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
    "job.analyzing": "الذكاء الاصطناعي يحلل طلبك...",
    "job.findMatches": "البحث عن حرفيين",
    
    // AI Analysis
    "ai.service": "الخدمة المكتشفة",
    "ai.urgency": "مستوى الاستعجال",
    "ai.complexity": "التعقيد",
    "ai.duration": "المدة المقدرة",
    "ai.confidence": "ثقة الذكاء الاصطناعي",
    
    // Matching
    "match.title": "الحرفيون الموصى بهم",
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
    "booking.technician": "الحرفي",
    "booking.date": "التاريخ",
    "booking.time": "الوقت",
    "booking.name": "اسمك",
    "booking.phone": "الهاتف",
    "booking.confirm": "تأكيد الحجز",
    "booking.success": "تم تأكيد الحجز!",
    
    // Upsell
    "upsell.title": "بينما الحرفي هنا...",
    "upsell.discount": "خصم",
    "upsell.add": "إضافة",
    
    // Technician Dashboard
    "tech.dashboard": "لوحة تحكم الحرفي",
    "tech.earnings": "الأرباح",
    "tech.pendingJobs": "الأعمال المعلقة",
    "tech.rating": "التقييم المتوسط",
    "tech.completedJobs": "الأعمال المكتملة",
    "tech.accept": "قبول",
    "tech.decline": "رفض",
    "tech.newJob": "طلب جديد",
    
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
