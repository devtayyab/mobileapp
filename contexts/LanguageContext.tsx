import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '@/lib/i18n';

export type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
};

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', rtl: false },
];

export type Translations = {
  settings: string;
  language: string;
  selectLanguage: string;
  notifications: string;
  pushNotifications: string;
  emailNotifications: string;
  orderUpdates: string;
  promotions: string;
  privacy: string;
  changePassword: string;
  privacySettings: string;
  general: string;
  currency: string;
  welcome: string;
  login: string;
  register: string;
  email: string;
  password: string;
  fullName: string;
  signIn: string;
  createAccount: string;
  profile: string;
  editProfile: string;
  orders: string;
  cart: string;
  search: string;
  home: string;
  shop: string;
  categories: string;
  addToCart: string;
  buyNow: string;
  checkout: string;
  total: string;
  save: string;
  cancel: string;
  confirm: string;
  loading: string;
  error: string;
  success: string;
  searchPlaceholder: string;
  newArrivals: string;
  bestDeals: string;
  featured: string;
  seeAll: string;
  specialOffer: string;
  flashSale: string;
  wholesalePricing: string;
  exclusiveDeals: string;
  browseAll: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  products: string;
  brands: string;
  deals: string;
  rating: string;
  loginSubtitle: string;
  dontHaveAccount: string;
  continueAsGuest: string;
  emailAddress: string;
  passwordPlaceholder: string;
  alreadyHaveAccount: string;
  joinMarketplace: string;
  accountType: string;
  customerRole: string;
  customerSub: string;
  wholesaleRole: string;
  wholesaleSub: string;
  supplierRole: string;
  supplierSub: string;
  confirmPassword: string;
  termsAgreement: string;
  termsOfService: string;
  privacyPolicy: string;
  all: string;
  soldOut: string;
  onlyLeft: string;
  minOrder: string;
  noProductsFound: string;
  loadingProducts: string;
  topPick: string;
  exploreCollections: string;
  tapToShop: string;
  noCategories: string;
  collections: string;
  myCart: string;
  signInToViewCart: string;
  loginToAddItems: string;
  yourCartIsEmpty: string;
  startAddingItems: string;
  browseShop: string;
  subtotalCount: string;
  proceedToCheckout: string;
  wholesaleSavings: string;
  subtotal: string;
  myOrders: string;
  ordersCount: string;
  signInToViewOrders: string;
  trackYourPurchases: string;
  noOrdersYet: string;
  ordersWillAppear: string;
  browseProducts: string;
  orderStatus: string;
  shipmentTracking: string;
  deliveryAddress: string;
  orderDetails: string;
  orderDate: string;
  orderNumber: string;
  orderItems: string;
  moreItems: string;
  trackingNum: string;
  via: string;
  pending: string;
  processing: string;
  confirmed: string;
  shipped: string;
  delivered: string;
  cancelled: string;
  refunded: string;
  searchForProducts: string;
  enterAtLeast2Chars: string;
  tryDifferentKeywords: string;
  noImage: string;
  productNotFound: string;
  wholesalePrice: string;
  inStock: string;
  outOfStock: string;
  sold: string;
  description: string;
  quantity: string;
  minOrderQuantity: string;
  available: string;
  units: string;
  orderPlaced: string;
  orderConfirmedMessage: string;
  totalPaid: string;
  payment: string;
  creditDebitCard: string;
  cashOnDelivery: string;
  viewMyOrders: string;
  continueShopping: string;
  shippingAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  paymentMethod: string;
  orderSummary: string;
  shipping: string;
  placeOrder: string;
  free: string;
  status: string;
  wholesaleCustomer: string;
  admin: string;
  administrator: string;
  supplier: string;
  guestUser: string;
  notSignedIn: string;
  signInToAccess: string;
  signOutConfirm: string;
  signOut: string;
  account: string;
  supplierTools: string;
  adminTools: string;
  support: string;
  helpCenter: string;
  termsConditions: string;
  version: string;
  filter: string;
  left: string;
  upTo50Off: string;
  limitedTimeDeals: string;
  browseAllProducts: string;
  thousandsProducts: string;
  clothing: string;
  fashion: string;
  accessories: string;
  lifestyle: string;
  electronics: string;
  footwear: string;
  bags: string;
  beauty: string;
  clothingDesc: string;
  fashionDesc: string;
  accessoriesDesc: string;
  lifestyleDesc: string;
  electronicsDesc: string;
  footwearDesc: string;
  bagsDesc: string;
  beautyDesc: string;
  welcomeTagline: string;
  welcomeSubtitle: string;
  globalReach: string;
  fastDelivery: string;
  secureTrade: string;
  browseAsGuest: string;
  termsAndPrivacy: string;
  signInToContinue: string;
  emailPlaceholder: string;
  passwordLength: string;
  fillAllFields: string;
  passwordsDoNotMatch: string;
  nameRequired: string;
  enterFullName: string;
  loginFailed: string;
  registrationFailed: string;
  atLeast6Chars: string;
  reEnterPassword: string;
  personalInfo: string;
  phone: string;
  businessInfo: string;
  companyName: string;
  taxId: string;
  profileUpdated: string;
  address: string;
  lipstick: string;
  'face-moisturizer': string;
  'summer-dress': string;
  'leather-bag': string;
  'smart-watch': string;
  'name_ne': string;
  'description_ne': string;
  and: string;
};

type LanguageContextType = {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = '@app_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(LANGUAGES[0]);
  const [tState, setTState] = useState<Translations>(null as any);

  const getEnTranslations = (): Translations => {
    // i18n.getResourceBundle returns the raw translation object
    return i18n.getResourceBundle('en', 'translation') || {};
  };

  const updateT = (langCode: string) => {
    const enRes = i18n.getResourceBundle('en', 'translation') || {};
    const newT: any = {};
    
    Object.keys(enRes).forEach(key => {
      // Always fallback to i18n.t which handles missing keys in other languages via fallbackLng: 'en'
      newT[key] = i18n.t(key, { lng: langCode });
    });
    
    setTState(newT);
  };

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((code: string | null) => {
      let targetCode = code;

      if (!targetCode) {
        // Use expo-localization to detect device language
        const deviceLanguage = Localization.getLocales()[0]?.languageCode;
        if (deviceLanguage && LANGUAGES.find(l => l.code === deviceLanguage)) {
          targetCode = deviceLanguage;
        } else {
          targetCode = 'en';
        }
      }

      const found = LANGUAGES.find((l) => l.code === targetCode);
      if (found) {
        setLanguageState(found);
        i18n.changeLanguage(targetCode).then(() => {
          updateT(targetCode!);
        });
      } else {
        updateT('en');
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await i18n.changeLanguage(lang.code);
    await AsyncStorage.setItem(STORAGE_KEY, lang.code);
    updateT(lang.code);
  };

  // Provide en translations if state is not set yet to avoid undefined errors in components
  const t = tState || getEnTranslations();

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
