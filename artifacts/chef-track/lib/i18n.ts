import AsyncStorage from "@react-native-async-storage/async-storage";

export type Lang = "en" | "fr" | "es" | "ar";

export const LANG_KEY = "@chef_track_language";

export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  ar: "العربية",
};

export const LANGUAGE_FLAGS: Record<Lang, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  es: "🇪🇸",
  ar: "🇸🇦",
};

export const LANGS: Lang[] = ["en", "fr", "es", "ar"];

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Language screen
    chooseLanguage: "Choose your language",
    chooseLanguageSub: "You can change this later in settings",
    continueBtn: "Continue",

    // Welcome
    tagline: "Production Tracker for sewing workshops",
    imTheManager: "I'm the Manager",
    managerDesc: "Create a new workspace for your workshop. You'll get a join code to share with your team.",
    createWorkspace: "Create workspace",
    joinWorkspace: "Join a workspace",
    joinDesc: "Already have a workspace? Enter the 6-character join code shown on the manager's dashboard.",
    enterCode: "Enter workspace code",
    or: "or",

    // Login
    welcomeBack: "Welcome back",
    signInSub: "Sign in to your workshop",
    manager: "Manager",
    operator: "Operator",
    continueWithGoogle: "Continue with Google",
    googleHint: "Each company uses their own Google account. Your workspace and all production data are tied to that account.",
    email: "Email",
    password: "Password",
    emailPlaceholder: "you@workshop.com",
    signIn: "Sign in",
    operatorHint: "Your password was assigned by the manager when your account was created. Ask them if you don't remember it.",
    wrongCredentials: "Email or password is incorrect.",
    googleFailed: "Google sign-in failed. Try again.",

    // Setup
    setUpWorkspace: "Set up your workspace",
    workshopNameLabel: "Workshop / company name",
    workshopNamePlaceholder: "e.g. Sunrise Garments",
    yourName: "Your name",
    yourNamePlaceholder: "e.g. Jordan Pierce",
    createWorkspaceBtn: "Create workspace",
    setupTip: "Your workspace is linked to your Google account. Only you can sign in as manager — operators join via the 6-letter code.",

    // General
    loading: "Loading...",
    error: "An error occurred. Try again.",
  },

  fr: {
    chooseLanguage: "Choisissez votre langue",
    chooseLanguageSub: "Vous pouvez modifier cela plus tard dans les paramètres",
    continueBtn: "Continuer",

    tagline: "Suivi de production pour ateliers de couture",
    imTheManager: "Je suis le responsable",
    managerDesc: "Créez un espace de travail pour votre atelier. Vous recevrez un code à partager avec votre équipe.",
    createWorkspace: "Créer un espace",
    joinWorkspace: "Rejoindre un espace",
    joinDesc: "Vous avez déjà un espace ? Entrez le code à 6 caractères affiché sur le tableau de bord du responsable.",
    enterCode: "Entrer le code",
    or: "ou",

    welcomeBack: "Bon retour",
    signInSub: "Connectez-vous à votre atelier",
    manager: "Responsable",
    operator: "Opérateur",
    continueWithGoogle: "Continuer avec Google",
    googleHint: "Chaque entreprise utilise son propre compte Google. Votre espace et toutes vos données y sont rattachés.",
    email: "Email",
    password: "Mot de passe",
    emailPlaceholder: "vous@atelier.com",
    signIn: "Se connecter",
    operatorHint: "Votre mot de passe a été attribué par le responsable lors de la création de votre compte.",
    wrongCredentials: "Email ou mot de passe incorrect.",
    googleFailed: "Échec de la connexion Google. Réessayez.",

    setUpWorkspace: "Configurer votre espace",
    workshopNameLabel: "Nom de l'atelier / entreprise",
    workshopNamePlaceholder: "ex. Coutures du Soleil",
    yourName: "Votre nom",
    yourNamePlaceholder: "ex. Marie Dupont",
    createWorkspaceBtn: "Créer l'espace",
    setupTip: "Votre espace est lié à votre compte Google. Seul vous pouvez vous connecter en tant que responsable.",

    loading: "Chargement...",
    error: "Une erreur s'est produite. Réessayez.",
  },

  es: {
    chooseLanguage: "Elige tu idioma",
    chooseLanguageSub: "Puedes cambiarlo más tarde en la configuración",
    continueBtn: "Continuar",

    tagline: "Seguimiento de producción para talleres de costura",
    imTheManager: "Soy el gerente",
    managerDesc: "Crea un espacio de trabajo para tu taller. Recibirás un código para compartir con tu equipo.",
    createWorkspace: "Crear espacio",
    joinWorkspace: "Unirse a un espacio",
    joinDesc: "¿Ya tienes un espacio? Ingresa el código de 6 caracteres que aparece en el panel del gerente.",
    enterCode: "Ingresar código",
    or: "o",

    welcomeBack: "Bienvenido de nuevo",
    signInSub: "Inicia sesión en tu taller",
    manager: "Gerente",
    operator: "Operador",
    continueWithGoogle: "Continuar con Google",
    googleHint: "Cada empresa usa su propia cuenta de Google. Tu espacio y todos tus datos están vinculados a ella.",
    email: "Correo",
    password: "Contraseña",
    emailPlaceholder: "tu@taller.com",
    signIn: "Iniciar sesión",
    operatorHint: "Tu contraseña fue asignada por el gerente al crear tu cuenta. Pregúntale si no la recuerdas.",
    wrongCredentials: "Correo o contraseña incorrectos.",
    googleFailed: "Error al iniciar sesión con Google. Intenta de nuevo.",

    setUpWorkspace: "Configura tu espacio",
    workshopNameLabel: "Nombre del taller / empresa",
    workshopNamePlaceholder: "ej. Confecciones Aurora",
    yourName: "Tu nombre",
    yourNamePlaceholder: "ej. Carlos García",
    createWorkspaceBtn: "Crear espacio",
    setupTip: "Tu espacio está vinculado a tu cuenta de Google. Solo tú puedes iniciar sesión como gerente.",

    loading: "Cargando...",
    error: "Ocurrió un error. Intenta de nuevo.",
  },

  ar: {
    chooseLanguage: "اختر لغتك",
    chooseLanguageSub: "يمكنك تغيير ذلك لاحقاً في الإعدادات",
    continueBtn: "متابعة",

    tagline: "متابعة الإنتاج لورش الخياطة",
    imTheManager: "أنا المدير",
    managerDesc: "أنشئ مساحة عمل لورشتك. ستحصل على رمز انضمام لمشاركته مع فريقك.",
    createWorkspace: "إنشاء مساحة عمل",
    joinWorkspace: "الانضمام إلى مساحة عمل",
    joinDesc: "هل لديك مساحة عمل بالفعل؟ أدخل رمز الانضمام المكون من 6 أحرف الظاهر في لوحة المدير.",
    enterCode: "أدخل الرمز",
    or: "أو",

    welcomeBack: "مرحباً بعودتك",
    signInSub: "تسجيل الدخول إلى ورشتك",
    manager: "مدير",
    operator: "موظف",
    continueWithGoogle: "المتابعة مع Google",
    googleHint: "كل شركة تستخدم حسابها الخاص على Google. مساحة عملك وبياناتك مرتبطة بهذا الحساب.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    emailPlaceholder: "أنت@ورشة.com",
    signIn: "تسجيل الدخول",
    operatorHint: "كلمة مرورك تم تعيينها من قبل المدير عند إنشاء حسابك. اسأله إذا نسيتها.",
    wrongCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    googleFailed: "فشل تسجيل الدخول عبر Google. حاول مجدداً.",

    setUpWorkspace: "إعداد مساحة العمل",
    workshopNameLabel: "اسم الورشة / الشركة",
    workshopNamePlaceholder: "مثال: ورشة الفجر للخياطة",
    yourName: "اسمك",
    yourNamePlaceholder: "مثال: أحمد محمد",
    createWorkspaceBtn: "إنشاء مساحة العمل",
    setupTip: "مساحة عملك مرتبطة بحسابك على Google. أنت فقط يمكنك تسجيل الدخول كمدير.",

    loading: "جارٍ التحميل...",
    error: "حدث خطأ. حاول مجدداً.",
  },
};

export function t(lang: Lang, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export async function loadSavedLang(): Promise<Lang | null> {
  try {
    const val = await AsyncStorage.getItem(LANG_KEY);
    if (val && (["en", "fr", "es", "ar"] as string[]).includes(val)) {
      return val as Lang;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveLang(lang: Lang): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, lang);
}
