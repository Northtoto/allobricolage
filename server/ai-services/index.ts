/**
 * 🤖 AI SERVICES - Central Export
 * 
 * All AI-powered features for AlloBricolage:
 * 1. Photo Verification - Before/After work verification
 * 2. Voice Booking - Darija/French/Arabic voice commands
 * 3. Chat Assistant - 24/7 AI support with function calling
 * 4. Dynamic Pricing - Smart pricing engine
 * 5. Smart Matching - 9-factor technician matching
 * 6. Sentiment Analysis - Review sentiment detection
 * 7. Fraud Detection - Pattern-based fraud prevention
 * 8. Predictive Maintenance - Proactive maintenance alerts
 */

// Photo Verification
export {
  verifyWorkCompletion,
  identifyEquipment,
  checkWorkQuality,
  type PhotoVerificationResult
} from "./photo-verification";

// Voice Booking
export {
  processVoiceBooking,
  understandSMSIntent,
  translateText,
  translateReview,
  type VoiceBookingIntent,
  type VoiceBookingResult
} from "./voice-booking";

// Chat Assistant
export {
  processChatMessage,
  answerFAQ,
  type ChatMessage,
  type ChatResponse
} from "./chat-assistant";

// Dynamic Pricing
export {
  calculateDynamicPrice,
  getPriceRange,
  estimateTotalJobCost,
  applyDiscountCode,
  type PricingParams,
  type PricingResult
} from "./dynamic-pricing";

// Smart Matching
export {
  intelligentTechnicianMatching,
  findMultiSkillTechnician,
  getPersonalizedRecommendations,
  type MatchScore
} from "./smart-matching";

// Sentiment Analysis
export {
  analyzeSentiment,
  handleNegativeReview,
  analyzeReviewTrends,
  type SentimentResult
} from "./sentiment-analysis";

// Fraud Detection
export {
  detectFraud,
  detectTechnicianFraud,
  logInteraction,
  type FraudFlag,
  type FraudDetectionResult
} from "./fraud-detection";

// Predictive Maintenance
export {
  predictMaintenanceNeeds,
  sendPredictiveMaintenanceNotifications,
  getEquipmentMaintenanceSchedule,
  type MaintenancePrediction
} from "./predictive-maintenance";

// Vision Service - Smart Photo Diagnosis
export {
  analyzeEquipmentPhoto,
  analyzeMultiplePhotos,
  getSeverityDescription,
  getUrgencyColor,
  getUrgencyLabel,
  type PhotoAnalysisResult
} from "./vision-service";

