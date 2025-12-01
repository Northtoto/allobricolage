import type {
  User, InsertUser,
  Technician, InsertTechnician,
  TechnicianWithUser,
  Job, InsertJob,
  Booking, InsertBooking,
  Payment, InsertPayment,
  Notification, InsertNotification,
  Review, InsertReview,
  TechnicianLocation, InsertTechnicianLocation,
  JobAddress, InsertJobAddress,
  VirtualIdCard, InsertVirtualIdCard,
} from "@shared/schema";

// Storage keys for LocalStorage
const STORAGE_KEYS = {
  USERS: 'allobricolage_users',
  TECHNICIANS: 'allobricolage_technicians',
  JOBS: 'allobricolage_jobs',
  BOOKINGS: 'allobricolage_bookings',
  PAYMENTS: 'allobricolage_payments',
  REVIEWS: 'allobricolage_reviews',
  NOTIFICATIONS: 'allobricolage_notifications',
  TRACKING: 'allobricolage_tracking',
  JOB_ADDRESSES: 'allobricolage_job_addresses',
  VIRTUAL_CARDS: 'allobricolage_virtual_cards',
  CURRENT_USER: 'allobricolage_current_user',
  SEED_VERSION: 'allobricolage_seed_v1'
};

export interface TechnicianFilters {
  city?: string;
  service?: string;
  minRating?: number;
  available?: boolean;
  search?: string;
  sortBy?: 'rating' | 'price-low' | 'price-high' | 'reviews' | 'experience';
}

// Generate UUID-like IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// LocalStorage Service implementing the same interface as server storage
export class LocalStorageService {
  
  // Generic storage methods
  private getItem<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return [];
    }
  }

  private setItem<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing to localStorage key ${key}:`, error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please clear some data or use browser settings to increase storage.');
      }
    }
  }

  // ============================================
  // USERS
  // ============================================

  async getUser(id: string): Promise<User | undefined> {
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    return users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    return users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    return users.find(u => u.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    return users.find(u => u.googleId === googleId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    const newUser: User = {
      id: generateId(),
      username: user.username,
      password: user.password || null,
      name: user.name,
      role: user.role || "client",
      email: user.email || null,
      phone: user.phone || null,
      city: user.city || null,
      googleId: user.googleId || null,
      profilePicture: user.profilePicture || null,
      createdAt: new Date(),
    };
    users.push(newUser);
    this.setItem(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    users[index] = { ...users[index], ...updates };
    this.setItem(STORAGE_KEYS.USERS, users);
    return users[index];
  }

  // ============================================
  // TECHNICIANS
  // ============================================

  async getTechnician(id: string): Promise<Technician | undefined> {
    const technicians = this.getItem<Technician>(STORAGE_KEYS.TECHNICIANS);
    return technicians.find(t => t.id === id);
  }

  async getTechnicianByUserId(userId: string): Promise<Technician | undefined> {
    const technicians = this.getItem<Technician>(STORAGE_KEYS.TECHNICIANS);
    return technicians.find(t => t.userId === userId);
  }

  async getTechnicianWithUser(id: string): Promise<TechnicianWithUser | undefined> {
    const technician = await this.getTechnician(id);
    if (!technician) return undefined;

    const user = await this.getUser(technician.userId);
    if (!user) return undefined;

    return this.mergeTechnicianWithUser(technician, user);
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return this.getItem<Technician>(STORAGE_KEYS.TECHNICIANS);
  }

  async getAllTechniciansWithUsers(): Promise<TechnicianWithUser[]> {
    const technicians = this.getItem<Technician>(STORAGE_KEYS.TECHNICIANS);
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    
    return technicians.map(tech => {
      const user = users.find(u => u.id === tech.userId);
      if (!user) return null;
      return this.mergeTechnicianWithUser(tech, user);
    }).filter(Boolean) as TechnicianWithUser[];
  }

  async getTechniciansByCity(city: string): Promise<TechnicianWithUser[]> {
    const allTechs = await this.getAllTechniciansWithUsers();
    return allTechs.filter(t => t.city?.toLowerCase() === city.toLowerCase());
  }

  async getTechniciansByService(service: string): Promise<TechnicianWithUser[]> {
    const allTechs = await this.getAllTechniciansWithUsers();
    return allTechs.filter(t => t.services.includes(service));
  }

  async searchTechnicians(filters: TechnicianFilters): Promise<TechnicianWithUser[]> {
    let results = await this.getAllTechniciansWithUsers();
    console.log("🔍 searchTechnicians called");
    console.log("   Total technicians:", results.length);
    console.log("   Filters:", filters);

    // Apply filters
    if (filters.city) {
      results = results.filter(t => t.city?.toLowerCase() === filters.city?.toLowerCase());
    }

    if (filters.service) {
      results = results.filter(t => t.services.includes(filters.service!));
    }

    if (filters.minRating) {
      results = results.filter(t => t.rating >= filters.minRating!);
    }

    if (filters.available !== undefined) {
      results = results.filter(t => t.isAvailable === filters.available);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.bio?.toLowerCase().includes(searchLower) ||
        t.skills.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'rating':
          results.sort((a, b) => b.rating - a.rating);
          break;
        case 'price-low':
          results.sort((a, b) => a.hourlyRate - b.hourlyRate);
          break;
        case 'price-high':
          results.sort((a, b) => b.hourlyRate - a.hourlyRate);
          break;
        case 'reviews':
          results.sort((a, b) => b.reviewCount - a.reviewCount);
          break;
        case 'experience':
          results.sort((a, b) => b.yearsExperience - a.yearsExperience);
          break;
      }
    }

    console.log("   Results after filtering:", results.length);
    return results;
  }

  async createTechnician(technician: InsertTechnician): Promise<Technician> {
    const technicians = this.getItem<Technician>(STORAGE_KEYS.TECHNICIANS);
    const newTech: Technician = {
      id: generateId(),
      userId: technician.userId,
      services: technician.services,
      skills: technician.skills || [],
      bio: technician.bio || null,
      photo: technician.photo || null,
      rating: technician.rating || 0,
      reviewCount: technician.reviewCount || 0,
      completedJobs: technician.completedJobs || 0,
      responseTimeMinutes: technician.responseTimeMinutes || 30,
      completionRate: technician.completionRate || 0.95,
      yearsExperience: technician.yearsExperience || 1,
      hourlyRate: technician.hourlyRate || 150,
      isVerified: technician.isVerified || false,
      isAvailable: technician.isAvailable !== undefined ? technician.isAvailable : true,
      isPro: technician.isPro || false,
      isPromo: technician.isPromo || false,
      availability: technician.availability || "Sur RDV",
      certifications: technician.certifications || [],
      latitude: technician.latitude || null,
      longitude: technician.longitude || null,
      languages: technician.languages || ["français", "arabe"],
    };
    technicians.push(newTech);
    this.setItem(STORAGE_KEYS.TECHNICIANS, technicians);
    return newTech;
  }

  async updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician | undefined> {
    const technicians = this.getItem<Technician>(STORAGE_KEYS.TECHNICIANS);
    const index = technicians.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    technicians[index] = { ...technicians[index], ...updates };
    this.setItem(STORAGE_KEYS.TECHNICIANS, technicians);
    return technicians[index];
  }

  private mergeTechnicianWithUser(tech: Technician, user: User): TechnicianWithUser {
    return {
      id: tech.id,
      userId: tech.userId,
      name: user.name,
      phone: user.phone || null,
      email: user.email || null,
      city: user.city || null,
      services: tech.services,
      skills: tech.skills,
      bio: tech.bio,
      photo: tech.photo,
      rating: tech.rating,
      reviewCount: tech.reviewCount,
      completedJobs: tech.completedJobs,
      responseTimeMinutes: tech.responseTimeMinutes,
      completionRate: tech.completionRate,
      yearsExperience: tech.yearsExperience,
      hourlyRate: tech.hourlyRate,
      isVerified: tech.isVerified,
      isAvailable: tech.isAvailable,
      isPro: tech.isPro,
      isPromo: tech.isPromo,
      availability: tech.availability,
      certifications: tech.certifications,
      latitude: tech.latitude,
      longitude: tech.longitude,
      languages: tech.languages,
    };
  }

  // ============================================
  // JOBS
  // ============================================

  async getJob(id: string): Promise<Job | undefined> {
    const jobs = this.getItem<Job>(STORAGE_KEYS.JOBS);
    return jobs.find(j => j.id === id);
  }

  async getAllJobs(): Promise<Job[]> {
    return this.getItem<Job>(STORAGE_KEYS.JOBS);
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    const jobs = this.getItem<Job>(STORAGE_KEYS.JOBS);
    return jobs.filter(j => j.status === status);
  }

  async getJobsByClientId(clientId: string): Promise<Job[]> {
    const jobs = this.getItem<Job>(STORAGE_KEYS.JOBS);
    return jobs.filter(j => j.clientId === clientId);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const jobs = this.getItem<Job>(STORAGE_KEYS.JOBS);
    const newJob: Job = {
      id: generateId(),
      clientId: job.clientId || null,
      description: job.description,
      service: job.service,
      subServices: job.subServices || null,
      city: job.city,
      urgency: job.urgency || "normal",
      complexity: job.complexity || "moderate",
      estimatedDuration: job.estimatedDuration || null,
      minCost: job.minCost || null,
      maxCost: job.maxCost || null,
      likelyCost: job.likelyCost || null,
      confidence: job.confidence || null,
      status: job.status || "pending",
      extractedKeywords: job.extractedKeywords || null,
      aiAnalysis: job.aiAnalysis || null,
      createdAt: new Date(),
    };
    jobs.push(newJob);
    this.setItem(STORAGE_KEYS.JOBS, jobs);
    return newJob;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const jobs = this.getItem<Job>(STORAGE_KEYS.JOBS);
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) return undefined;
    
    jobs[index] = { ...jobs[index], ...updates };
    this.setItem(STORAGE_KEYS.JOBS, jobs);
    return jobs[index];
  }

  // ============================================
  // BOOKINGS
  // ============================================

  async getBooking(id: string): Promise<Booking | undefined> {
    const bookings = this.getItem<Booking>(STORAGE_KEYS.BOOKINGS);
    return bookings.find(b => b.id === id);
  }

  async getAllBookings(): Promise<Booking[]> {
    return this.getItem<Booking>(STORAGE_KEYS.BOOKINGS);
  }

  async getBookingsByTechnician(technicianId: string): Promise<Booking[]> {
    const bookings = this.getItem<Booking>(STORAGE_KEYS.BOOKINGS);
    return bookings.filter(b => b.technicianId === technicianId);
  }

  async getBookingsByJob(jobId: string): Promise<Booking[]> {
    const bookings = this.getItem<Booking>(STORAGE_KEYS.BOOKINGS);
    return bookings.filter(b => b.jobId === jobId);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const bookings = this.getItem<Booking>(STORAGE_KEYS.BOOKINGS);
    const newBooking: Booking = {
      id: generateId(),
      jobId: booking.jobId,
      technicianId: booking.technicianId,
      clientId: booking.clientId || null,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      status: booking.status || "pending",
      estimatedCost: booking.estimatedCost || null,
      finalCost: booking.finalCost || null,
      matchScore: booking.matchScore || null,
      matchExplanation: booking.matchExplanation || null,
      createdAt: new Date(),
    };
    bookings.push(newBooking);
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);
    return newBooking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const bookings = this.getItem<Booking>(STORAGE_KEYS.BOOKINGS);
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    
    bookings[index] = { ...bookings[index], ...updates };
    this.setItem(STORAGE_KEYS.BOOKINGS, bookings);
    return bookings[index];
  }

  // ============================================
  // PAYMENTS
  // ============================================

  async getPayment(id: string): Promise<Payment | undefined> {
    const payments = this.getItem<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.find(p => p.id === id);
  }

  async getPaymentByBooking(bookingId: string): Promise<Payment | undefined> {
    const payments = this.getItem<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.find(p => p.bookingId === bookingId);
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.getItem<Payment>(STORAGE_KEYS.PAYMENTS);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const payments = this.getItem<Payment>(STORAGE_KEYS.PAYMENTS);
    const newPayment: Payment = {
      id: generateId(),
      bookingId: payment.bookingId,
      amount: payment.amount,
      currency: payment.currency || "MAD",
      paymentMethod: payment.paymentMethod,
      status: payment.status || "pending",
      paymentIntentId: payment.paymentIntentId || null,
      transactionId: payment.transactionId || null,
      bankReference: payment.bankReference || null,
      paymentDetails: payment.paymentDetails || null,
      paidAt: payment.paidAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    payments.push(newPayment);
    this.setItem(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const payments = this.getItem<Payment>(STORAGE_KEYS.PAYMENTS);
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    payments[index] = { ...payments[index], ...updates, updatedAt: new Date() };
    this.setItem(STORAGE_KEYS.PAYMENTS, payments);
    return payments[index];
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotification(id: string): Promise<Notification | undefined> {
    const notifications = this.getItem<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    return notifications.find(n => n.id === id);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const notifications = this.getItem<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    return notifications.filter(n => n.userId === userId).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    const notifications = await this.getNotificationsByUser(userId);
    return notifications.filter(n => !n.isRead);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const notifications = this.getItem<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const newNotification: Notification = {
      id: generateId(),
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      bookingId: notification.bookingId || null,
      paymentId: notification.paymentId || null,
      isRead: notification.isRead || false,
      createdAt: new Date(),
    };
    notifications.push(newNotification);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    return this.updateNotification(id, { isRead: true });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = this.getItem<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const updated = notifications.map(n => 
      n.userId === userId ? { ...n, isRead: true } : n
    );
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  private async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification | undefined> {
    const notifications = this.getItem<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) return undefined;
    
    notifications[index] = { ...notifications[index], ...updates };
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return notifications[index];
  }

  // ============================================
  // REVIEWS
  // ============================================

  async getReview(id: string): Promise<Review | undefined> {
    const reviews = this.getItem<Review>(STORAGE_KEYS.REVIEWS);
    return reviews.find(r => r.id === id);
  }

  async getReviewsByTechnician(technicianId: string): Promise<Review[]> {
    const reviews = this.getItem<Review>(STORAGE_KEYS.REVIEWS);
    return reviews.filter(r => r.technicianId === technicianId).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getReviewsByClient(clientId: string): Promise<Review[]> {
    const reviews = this.getItem<Review>(STORAGE_KEYS.REVIEWS);
    return reviews.filter(r => r.clientId === clientId);
  }

  async getAllReviews(): Promise<Review[]> {
    return this.getItem<Review>(STORAGE_KEYS.REVIEWS);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const reviews = this.getItem<Review>(STORAGE_KEYS.REVIEWS);
    const newReview: Review = {
      id: generateId(),
      technicianId: review.technicianId,
      clientId: review.clientId,
      bookingId: review.bookingId || null,
      rating: review.rating,
      comment: review.comment,
      serviceQuality: review.serviceQuality || null,
      punctuality: review.punctuality || null,
      professionalism: review.professionalism || null,
      valueForMoney: review.valueForMoney || null,
      isVerified: review.isVerified || false,
      technicianResponse: review.technicianResponse || null,
      createdAt: new Date(),
    };
    reviews.push(newReview);
    this.setItem(STORAGE_KEYS.REVIEWS, reviews);

    // Update technician rating
    await this.updateTechnicianRating(review.technicianId);

    return newReview;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const reviews = this.getItem<Review>(STORAGE_KEYS.REVIEWS);
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    reviews[index] = { ...reviews[index], ...updates };
    this.setItem(STORAGE_KEYS.REVIEWS, reviews);
    return reviews[index];
  }

  private async updateTechnicianRating(technicianId: string): Promise<void> {
    const reviews = await this.getReviewsByTechnician(technicianId);
    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await this.updateTechnician(technicianId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
  }

  // ============================================
  // TECHNICIAN LOCATIONS (GPS Tracking)
  // ============================================

  async getTechnicianLocation(id: string): Promise<TechnicianLocation | undefined> {
    const locations = this.getItem<TechnicianLocation>(STORAGE_KEYS.TRACKING);
    return locations.find(l => l.id === id);
  }

  async getLatestTechnicianLocation(bookingId: string): Promise<TechnicianLocation | undefined> {
    const locations = this.getItem<TechnicianLocation>(STORAGE_KEYS.TRACKING);
    const bookingLocations = locations
      .filter(l => l.bookingId === bookingId && l.isActive)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
    
    return bookingLocations[0];
  }

  async getTechnicianLocationHistory(technicianId: string, bookingId?: string): Promise<TechnicianLocation[]> {
    const locations = this.getItem<TechnicianLocation>(STORAGE_KEYS.TRACKING);
    let filtered = locations.filter(l => l.technicianId === technicianId);
    
    if (bookingId) {
      filtered = filtered.filter(l => l.bookingId === bookingId);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    );
  }

  async createTechnicianLocation(location: InsertTechnicianLocation): Promise<TechnicianLocation> {
    const locations = this.getItem<TechnicianLocation>(STORAGE_KEYS.TRACKING);
    const newLocation: TechnicianLocation = {
      id: generateId(),
      technicianId: location.technicianId,
      bookingId: location.bookingId || null,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null,
      heading: location.heading || null,
      speed: location.speed || null,
      altitude: location.altitude || null,
      isActive: location.isActive !== undefined ? location.isActive : true,
      batteryLevel: location.batteryLevel || null,
      timestamp: new Date(),
      updatedAt: new Date(),
    };
    locations.push(newLocation);
    this.setItem(STORAGE_KEYS.TRACKING, locations);
    return newLocation;
  }

  async deactivateTechnicianLocation(bookingId: string): Promise<void> {
    const locations = this.getItem<TechnicianLocation>(STORAGE_KEYS.TRACKING);
    const updated = locations.map(l => 
      l.bookingId === bookingId ? { ...l, isActive: false } : l
    );
    this.setItem(STORAGE_KEYS.TRACKING, updated);
  }

  // ============================================
  // JOB ADDRESSES
  // ============================================

  async getJobAddress(bookingId: string): Promise<JobAddress | undefined> {
    const addresses = this.getItem<JobAddress>(STORAGE_KEYS.JOB_ADDRESSES);
    return addresses.find(a => a.bookingId === bookingId);
  }

  async createJobAddress(address: InsertJobAddress): Promise<JobAddress> {
    const addresses = this.getItem<JobAddress>(STORAGE_KEYS.JOB_ADDRESSES);
    const newAddress: JobAddress = {
      id: generateId(),
      bookingId: address.bookingId,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode || null,
      latitude: address.latitude,
      longitude: address.longitude,
      placeId: address.placeId || null,
      formattedAddress: address.formattedAddress || null,
      additionalInstructions: address.additionalInstructions || null,
      createdAt: new Date(),
    };
    addresses.push(newAddress);
    this.setItem(STORAGE_KEYS.JOB_ADDRESSES, addresses);
    return newAddress;
  }

  async updateJobAddress(bookingId: string, updates: Partial<JobAddress>): Promise<JobAddress | undefined> {
    const addresses = this.getItem<JobAddress>(STORAGE_KEYS.JOB_ADDRESSES);
    const index = addresses.findIndex(a => a.bookingId === bookingId);
    if (index === -1) return undefined;
    
    addresses[index] = { ...addresses[index], ...updates };
    this.setItem(STORAGE_KEYS.JOB_ADDRESSES, addresses);
    return addresses[index];
  }

  // ============================================
  // VIRTUAL ID CARDS
  // ============================================

  async getVirtualCard(id: string): Promise<VirtualIdCard | undefined> {
    const cards = this.getItem<VirtualIdCard>(STORAGE_KEYS.VIRTUAL_CARDS);
    return cards.find(c => c.id === id);
  }

  async getVirtualCardByNumber(cardNumber: string): Promise<VirtualIdCard | undefined> {
    const cards = this.getItem<VirtualIdCard>(STORAGE_KEYS.VIRTUAL_CARDS);
    return cards.find(c => c.cardNumber === cardNumber);
  }

  async getVirtualCardByTechnician(technicianId: string): Promise<VirtualIdCard | undefined> {
    const cards = this.getItem<VirtualIdCard>(STORAGE_KEYS.VIRTUAL_CARDS);
    return cards.find(c => c.technicianId === technicianId);
  }

  async createVirtualCard(card: InsertVirtualIdCard): Promise<VirtualIdCard> {
    const cards = this.getItem<VirtualIdCard>(STORAGE_KEYS.VIRTUAL_CARDS);
    const newCard: VirtualIdCard = {
      id: generateId(),
      cardNumber: card.cardNumber,
      technicianId: card.technicianId,
      theme: card.theme || "default",
      qrCodeData: card.qrCodeData,
      issuedDate: card.issuedDate,
      expiryDate: card.expiryDate,
      isActive: card.isActive !== undefined ? card.isActive : true,
      viewsCount: card.viewsCount || 0,
      sharesCount: card.sharesCount || 0,
      lastViewedAt: card.lastViewedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cards.push(newCard);
    this.setItem(STORAGE_KEYS.VIRTUAL_CARDS, cards);
    return newCard;
  }

  async updateVirtualCard(id: string, updates: Partial<VirtualIdCard>): Promise<VirtualIdCard | undefined> {
    const cards = this.getItem<VirtualIdCard>(STORAGE_KEYS.VIRTUAL_CARDS);
    const index = cards.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    cards[index] = { ...cards[index], ...updates, updatedAt: new Date() };
    this.setItem(STORAGE_KEYS.VIRTUAL_CARDS, cards);
    return cards[index];
  }

  async incrementCardViews(cardNumber: string): Promise<void> {
    const card = await this.getVirtualCardByNumber(cardNumber);
    if (!card) return;
    
    await this.updateVirtualCard(card.id, {
      viewsCount: card.viewsCount + 1,
      lastViewedAt: new Date(),
    });
  }

  async incrementCardShares(cardNumber: string): Promise<void> {
    const card = await this.getVirtualCardByNumber(cardNumber);
    if (!card) return;
    
    await this.updateVirtualCard(card.id, {
      sharesCount: card.sharesCount + 1,
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  // Clear all data (for testing/reset)
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Export data for backup
  exportData(): string {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = this.getItem(key);
    });
    return JSON.stringify(data, null, 2);
  }

  // Import data from backup
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (data[name]) {
          this.setItem(key, data[name]);
        }
      });
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();
export { STORAGE_KEYS };

