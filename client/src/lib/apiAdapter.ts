import { localStorageService } from "./localStorage";
import { localAuth } from "./authLocal";
import {
  mockAnalyzeJob,
  mockAnalyzeImage,
  mockEstimateCost,
  mockMatchTechnicians,
  mockProcessPayment,
  mockGetPaymentMethods,
  mockGenerateBankTransferReference,
  mockSendSMS,
  mockCreateNotification,
  mockUploadImage,
  mockGenerateInvoice,
  mockCalculateRoute,
  mockDarijaChat,
} from "./mockServices";
import type { User, UpsellSuggestion } from "@shared/schema";

// Generate upsell suggestions based on service
function generateUpsellSuggestions(service: string): UpsellSuggestion[] {
  const upsellMap: Record<string, UpsellSuggestion[]> = {
    plomberie: [
      {
        service: "Détartrage chauffe-eau",
        description: "Prolongez la durée de vie de votre chauffe-eau",
        probability: 0.75,
        discount: 10,
        reason: "Recommandé avec les interventions de plomberie",
      },
      {
        service: "Inspection canalisation",
        description: "Détectez les problèmes avant qu'ils ne s'aggravent",
        probability: 0.65,
        discount: 15,
        reason: "Préventif pour éviter les fuites futures",
      },
    ],
    electricite: [
      {
        service: "Mise aux normes électriques",
        description: "Assurez la sécurité de votre installation",
        probability: 0.8,
        discount: 20,
        reason: "Important pour la sécurité",
      },
      {
        service: "Installation détecteur de fumée",
        description: "Protection incendie obligatoire",
        probability: 0.9,
        discount: 5,
        reason: "Sécurité et conformité",
      },
    ],
    peinture: [
      {
        service: "Traitement anti-humidité",
        description: "Protégez vos murs de l'humidité",
        probability: 0.7,
        discount: 15,
        reason: "Prolonge la durée de vie de la peinture",
      },
    ],
    climatisation: [
      {
        service: "Contrat d'entretien annuel",
        description: "Maintenez votre climatisation en bon état",
        probability: 0.85,
        discount: 25,
        reason: "Économies sur le long terme",
      },
    ],
  };
  
  return upsellMap[service] || [];
}

// Parse API URL to extract entity, action, and ID
function parseApiUrl(url: string): {
  entity: string;
  action: string;
  id?: string;
  subEntity?: string;
} {
  const parts = url.replace("/api/", "").split("/");
  
  return {
    entity: parts[0] || "",
    action: parts[1] || "",
    id: parts[1] && !isNaN(Number(parts[1])) ? parts[1] : parts[2],
    subEntity: parts[2],
  };
}

// Create mock Response object
function createResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "Content-Type": "application/json" },
  });
}

// Create error Response
function createErrorResponse(message: string, status: number = 500): Response {
  return createResponse({ error: message }, status);
}

// Get current user or throw error
function requireAuth(): User {
  const user = localAuth.getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * API Adapter - Routes API requests to LocalStorage
 */
export async function apiAdapter(
  method: string,
  url: string,
  data?: any
): Promise<Response> {
  console.log("🌐 API Adapter called:", { method, url, data });
  try {
    const { entity, action, id, subEntity } = parseApiUrl(url);
    console.log("📍 Parsed URL:", { entity, action, id, subEntity });
    
    // ============================================
    // AUTHENTICATION ROUTES
    // ============================================
    
    if (entity === "auth") {
      if (action === "login" && method === "POST") {
        console.log("🔐 Login attempt:", { username: data.username });
        try {
          const user = await localAuth.login(data.username, data.password);
          console.log("✅ Login successful:", user);
          return createResponse(user);
        } catch (error: any) {
          console.error("❌ Login failed:", error.message);
          return createErrorResponse(error.message || "Invalid credentials", 401);
        }
      }
      
      if (action === "signup" && method === "POST") {
        const user = await localAuth.signup(data);
        
        // If technician, create technician profile
        if (data.role === "technician") {
          await localStorageService.createTechnician({
            userId: user.id,
            services: data.services || [],
            skills: [],
            bio: data.bio || null,
            photo: null,
            rating: 0,
            reviewCount: 0,
            completedJobs: 0,
            responseTimeMinutes: 30,
            completionRate: 0.95,
            yearsExperience: parseInt(data.yearsExperience) || 1,
            hourlyRate: parseInt(data.hourlyRate) || 150,
            isVerified: false,
            isAvailable: true,
            isPro: false,
            isPromo: false,
            availability: "Sur RDV",
            certifications: [],
            latitude: null,
            longitude: null,
            languages: ["français", "arabe"],
          });
        }
        
        return createResponse(user);
      }
      
      if (action === "logout" && method === "POST") {
        await localAuth.logout();
        return createResponse({ success: true });
      }
      
      if (action === "me" && method === "GET") {
        const user = localAuth.getCurrentUser();
        if (!user) {
          return createErrorResponse("Not authenticated", 401);
        }
        return createResponse(user);
      }
    }
    
    // ============================================
    // JOBS ROUTES
    // ============================================
    
    if (entity === "jobs") {
      if (action === "analyze" && method === "POST") {
        const analysis = await mockAnalyzeJob(data.description);
        const costEstimate = await mockEstimateCost({
          service: analysis.service,
          urgency: data.urgency || analysis.urgency,
          complexity: analysis.complexity,
        });
        return createResponse({ analysis, costEstimate });
      }
      
      if (action === "analyze-image" && method === "POST") {
        const imageAnalysis = await mockAnalyzeImage(data.imageData);
        
        // Create a full analysis response similar to text analysis
        const analysis = {
          service: "plomberie", // Default, could be enhanced with actual image recognition
          subServices: ["Réparation"],
          urgency: "normal",
          complexity: "moderate",
          estimatedDuration: "2-3 heures",
          confidence: 0.75,
          visualDescription: imageAnalysis.description,
          recommendations: imageAnalysis.recommendations,
        };
        
        const costEstimate = await mockEstimateCost({
          service: analysis.service,
          urgency: analysis.urgency,
          complexity: analysis.complexity,
        });
        
        return createResponse({
          analysis,
          costEstimate,
        });
      }
      
      if (method === "POST" && !action) {
        const user = requireAuth();
        
        // Create the job
        const job = await localStorageService.createJob({
          clientId: user.id,
          description: data.description,
          service: data.analysis?.service || "services_generaux",
          city: data.city,
          urgency: data.urgency || "normal",
          complexity: data.analysis?.complexity || "moderate",
          status: "pending",
        });
        
        // Find matching technicians
        const matches = await mockMatchTechnicians(job);
        
        console.log("🔍 Job created:", job);
        console.log("🔍 Matches found:", matches);
        console.log("🔍 Number of matches:", matches.length);
        
        // Generate upsell suggestions based on the service
        const upsellSuggestions = generateUpsellSuggestions(data.analysis?.service || job.service);
        
        return createResponse({ job, matches, upsellSuggestions });
      }
      
      if (method === "GET" && id) {
        const job = await localStorageService.getJob(id);
        if (!job) {
          return createErrorResponse("Job not found", 404);
        }
        return createResponse(job);
      }
    }
    
    // ============================================
    // TECHNICIANS ROUTES
    // ============================================
    
    if (entity === "technicians") {
      if (method === "GET" && !id) {
        const filters = data || {};
        console.log("🔍 Fetching technicians with filters:", filters);
        const technicians = await localStorageService.searchTechnicians(filters);
        console.log("✅ Found technicians:", technicians.length);
        return createResponse(technicians);
      }
      
      if (method === "GET" && id) {
        if (id === "me") {
          const user = requireAuth();
          const tech = await localStorageService.getTechnicianByUserId(user.id);
          if (!tech) {
            return createErrorResponse("Technician profile not found", 404);
          }
          const techWithUser = await localStorageService.getTechnicianWithUser(tech.id);
          return createResponse(techWithUser);
        }
        
        if (subEntity === "reviews") {
          const reviews = await localStorageService.getReviewsByTechnician(id);
          return createResponse(reviews);
        }
        
        const tech = await localStorageService.getTechnicianWithUser(id);
        if (!tech) {
          return createErrorResponse("Technician not found", 404);
        }
        return createResponse(tech);
      }
      
      if (method === "POST" && subEntity === "photo") {
        // Mock photo upload
        const photoUrl = await mockUploadImage(data.photo);
        await localStorageService.updateTechnician(id!, { photo: photoUrl });
        return createResponse({ photo: photoUrl });
      }
    }
    
    // ============================================
    // BOOKINGS ROUTES
    // ============================================
    
    if (entity === "bookings") {
      if (method === "POST" && !id) {
        const user = requireAuth();
        
        // Create or get job
        let jobId = data.jobId;
        if (jobId === "direct") {
          const job = await localStorageService.createJob({
            clientId: user.id,
            description: data.description || "Réservation directe",
            service: data.service || "services_generaux",
            city: user.city || "Casablanca",
            urgency: "normal",
            complexity: "moderate",
            status: "pending",
          });
          jobId = job.id;
        }
        
        const booking = await localStorageService.createBooking({
          jobId,
          technicianId: data.technicianId,
          clientId: user.id,
          clientName: data.clientName,
          clientPhone: data.clientPhone,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          status: "pending",
          estimatedCost: data.estimatedCost,
          matchScore: data.matchScore || 0.9,
          matchExplanation: data.matchExplanation || "Réservation confirmée",
        });
        
        // Send mock SMS notification
        const tech = await localStorageService.getTechnicianWithUser(data.technicianId);
        if (tech?.phone) {
          await mockSendSMS(
            tech.phone,
            `Nouvelle réservation: ${data.clientName} le ${data.scheduledDate} à ${data.scheduledTime}`
          );
        }
        
        // Create notification for technician
        const techUser = await localStorageService.getUser(tech!.userId);
        if (techUser) {
          await mockCreateNotification(techUser.id, {
            type: "booking",
            title: "Nouvelle réservation",
            message: `${data.clientName} a réservé vos services`,
            bookingId: booking.id,
          });
        }
        
        return createResponse(booking);
      }
      
      if (method === "GET" && !id) {
        const user = requireAuth();
        let bookings = await localStorageService.getAllBookings();
        
        // Filter based on user role
        if (user.role === "client") {
          bookings = bookings.filter(b => b.clientId === user.id);
        } else if (user.role === "technician") {
          const tech = await localStorageService.getTechnicianByUserId(user.id);
          if (tech) {
            bookings = bookings.filter(b => b.technicianId === tech.id);
          } else {
            bookings = [];
          }
        }
        
        return createResponse(bookings);
      }
      
      if (method === "GET" && id) {
        const booking = await localStorageService.getBooking(id);
        if (!booking) {
          return createErrorResponse("Booking not found", 404);
        }
        return createResponse(booking);
      }
      
      if (method === "POST" && subEntity === "complete") {
        const booking = await localStorageService.updateBooking(id!, { status: "completed" });
        return createResponse(booking);
      }
    }
    
    // ============================================
    // PAYMENT ROUTES
    // ============================================
    
    if (entity === "payment") {
      if (action === "methods" && method === "GET") {
        return createResponse(mockGetPaymentMethods());
      }
      
      if (action === "bank-transfer" && subEntity === "details" && method === "GET") {
        const reference = mockGenerateBankTransferReference(data.bookingId);
        return createResponse({
          bankName: "Banque Demo",
          accountNumber: "DEMO-123456789",
          rib: "DEMO-RIB-123",
          reference,
        });
      }
      
      if (action === "create" && method === "POST") {
        const result = await mockProcessPayment(data);
        const payment = await localStorageService.createPayment({
          bookingId: data.bookingId,
          amount: data.amount,
          currency: "MAD",
          paymentMethod: data.paymentMethod,
          status: "completed",
          transactionId: result.transactionId,
        });
        return createResponse(payment);
      }
      
      if (action === "booking" && method === "GET") {
        const payment = await localStorageService.getPaymentByBooking(id!);
        return createResponse(payment || null);
      }
      
      if (method === "POST" && subEntity === "confirm") {
        const payment = await localStorageService.updatePayment(id!, {
          status: "completed",
          paidAt: new Date(),
        });
        return createResponse(payment);
      }
    }
    
    // ============================================
    // REVIEWS ROUTES
    // ============================================
    
    if (entity === "reviews") {
      if (method === "POST" && !id) {
        const user = requireAuth();
        const review = await localStorageService.createReview({
          ...data,
          clientId: user.id,
        });
        return createResponse(review);
      }
      
      if (method === "PATCH" && subEntity === "response") {
        const review = await localStorageService.updateReview(id!, {
          technicianResponse: data.response,
        });
        return createResponse(review);
      }
    }
    
    // ============================================
    // TRACKING ROUTES
    // ============================================
    
    if (entity === "tracking") {
      if (action === "location" && subEntity === "update" && method === "POST") {
        const location = await localStorageService.createTechnicianLocation(data);
        return createResponse(location);
      }
      
      if (action === "location" && subEntity === "latest" && method === "GET") {
        const location = await localStorageService.getLatestTechnicianLocation(id!);
        return createResponse(location);
      }
      
      if (action === "booking" && method === "GET") {
        const location = await localStorageService.getLatestTechnicianLocation(id!);
        const address = await localStorageService.getJobAddress(id!);
        return createResponse({ location, address });
      }
      
      if (action === "address" && subEntity === "save" && method === "POST") {
        const address = await localStorageService.createJobAddress(data);
        return createResponse(address);
      }
      
      if (action === "address" && method === "GET") {
        const address = await localStorageService.getJobAddress(id!);
        return createResponse(address);
      }
      
      if (action === "route" && subEntity === "calculate" && method === "POST") {
        const route = await mockCalculateRoute(data.origin, data.destination);
        return createResponse(route);
      }
    }
    
    // ============================================
    // TECHNICIAN DASHBOARD ROUTES
    // ============================================
    
    if (entity === "technician") {
      if (action === "stats" && method === "GET") {
        const user = requireAuth();
        const tech = await localStorageService.getTechnicianByUserId(user.id);
        if (!tech) {
          return createErrorResponse("Technician profile not found", 404);
        }
        
        const bookings = await localStorageService.getBookingsByTechnician(tech.id);
        const reviews = await localStorageService.getReviewsByTechnician(tech.id);
        
        const stats = {
          totalBookings: bookings.length,
          pendingBookings: bookings.filter(b => b.status === "pending").length,
          completedBookings: bookings.filter(b => b.status === "completed").length,
          averageRating: tech.rating,
          totalReviews: reviews.length,
          totalEarnings: bookings
            .filter(b => b.status === "completed")
            .reduce((sum, b) => sum + (b.finalCost || b.estimatedCost || 0), 0),
        };
        
        return createResponse(stats);
      }
      
      if (action === "pending-jobs" && method === "GET") {
        const user = requireAuth();
        const tech = await localStorageService.getTechnicianByUserId(user.id);
        if (!tech) {
          return createErrorResponse("Technician profile not found", 404);
        }
        
        const bookings = await localStorageService.getBookingsByTechnician(tech.id);
        const pending = bookings.filter(b => b.status === "pending");
        return createResponse(pending);
      }
      
      if (action === "jobs" && subEntity === "accept" && method === "POST") {
        const booking = await localStorageService.updateBooking(id!, { status: "accepted" });
        return createResponse(booking);
      }
      
      if (action === "jobs" && subEntity === "decline" && method === "POST") {
        const booking = await localStorageService.updateBooking(id!, { status: "cancelled" });
        return createResponse(booking);
      }
    }
    
    // ============================================
    // CLIENT DASHBOARD ROUTES
    // ============================================
    
    if (entity === "client") {
      if (action === "stats" && method === "GET") {
        const user = requireAuth();
        const bookings = (await localStorageService.getAllBookings())
          .filter(b => b.clientId === user.id);
        const jobs = await localStorageService.getJobsByClientId(user.id);
        
        const stats = {
          totalBookings: bookings.length,
          activeBookings: bookings.filter(b => b.status === "pending" || b.status === "accepted").length,
          completedBookings: bookings.filter(b => b.status === "completed").length,
          totalJobs: jobs.length,
        };
        
        return createResponse(stats);
      }
      
      if (action === "jobs" && method === "GET") {
        const user = requireAuth();
        const jobs = await localStorageService.getJobsByClientId(user.id);
        return createResponse(jobs);
      }
    }
    
    // ============================================
    // CHAT ROUTES
    // ============================================
    
    if (entity === "chat") {
      if (action === "darija" && method === "POST") {
        const response = await mockDarijaChat(data.message, data.history || []);
        return createResponse(response);
      }
    }
    
    // ============================================
    // INVOICES ROUTES
    // ============================================
    
    if (entity === "invoices") {
      if (method === "GET" && id) {
        const invoice = await mockGenerateInvoice(id);
        return createResponse(invoice);
      }
    }
    
    // ============================================
    // NOTIFICATIONS ROUTES (if needed)
    // ============================================
    
    if (entity === "notifications") {
      if (method === "GET") {
        const user = requireAuth();
        const notifications = await localStorageService.getNotificationsByUser(user.id);
        return createResponse(notifications);
      }
      
      if (method === "PATCH" && id) {
        await localStorageService.markNotificationAsRead(id);
        return createResponse({ success: true });
      }
    }
    
    // Default: not found
    return createErrorResponse(`Route not found: ${method} ${url}`, 404);
    
  } catch (error: any) {
    console.error("API Adapter Error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      url,
      method,
      data
    });
    
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    
    return createErrorResponse(error.message || "Internal server error", 500);
  }
}

