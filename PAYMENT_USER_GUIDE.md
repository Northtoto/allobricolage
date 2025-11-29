# 💳 AlloBricolage Payment System - User Guide

## 🎯 Complete Booking & Payment Flow

### Step 1: Browse & Select Technician
1. Go to **http://localhost:5000**
2. Click **"Trouver un technicien"** or browse the technician directory
3. View technician profiles with ratings, experience, and rates

### Step 2: Book a Technician
1. Click **"Réserver"** on any technician card
2. Fill in the booking form:
   - Your name
   - Phone number
   - Preferred date
   - Preferred time
   - Description of work needed
3. Click **"Confirmer la réservation"**

### Step 3: Payment Page (NEW!)
After booking, you'll see a success message with two options:

**Option A: Pay Now** (Recommended)
- Click **"Procéder au paiement"** 💳
- You'll be redirected to the secure payment page

**Option B: Pay Later**
- Click **"Payer plus tard"**
- You can pay anytime from your dashboard

---

## 💳 Payment Page Features

### What You'll See:
```
┌─────────────────────────────────────────────┐
│  🔒 Paiement sécurisé                       │
│  Choisissez votre mode de paiement          │
├─────────────────────────────────────────────┤
│                                             │
│  ○ 💳 Carte bancaire marocaine (CMI)       │
│     Paiement sécurisé avec votre carte     │
│     [Visa] [Mastercard] [Recommandé]       │
│                                             │
│  ○ 💵 Cash Plus                            │
│     Payez en espèces dans n'importe        │
│     quel point Cash Plus                    │
│                                             │
│  ○ 🏛️ Virement bancaire (RIB/IBAN)        │
│     Effectuez un virement depuis           │
│     votre banque                            │
│                                             │
├─────────────────────────────────────────────┤
│  🛡️ Paiement 100% sécurisé                │
│  Vos données sont cryptées                  │
├─────────────────────────────────────────────┤
│  [Procéder au paiement]                     │
└─────────────────────────────────────────────┘

┌─────────────────────┐
│  Récapitulatif      │
├─────────────────────┤
│  Service: Plomberie │
│  Date: 27/11/2025   │
│  Heure: 10:00       │
│                     │
│  Total: 250 MAD     │
└─────────────────────┘
```

---

## 💳 Payment Method Details

### 1. CMI (Carte Bancaire Marocaine)

**When to use**: You have a Moroccan Visa or Mastercard

**How it works**:
1. Select "Carte bancaire marocaine (CMI)"
2. Click "Procéder au paiement"
3. You'll be redirected to the secure CMI gateway
4. Enter your card details on CMI's secure page
5. Complete 3D Secure verification if required
6. Return to AlloBricolage with confirmation

**What you'll need**:
- Moroccan bank card (Visa/Mastercard)
- Card number, expiry date, CVV
- 3D Secure code (SMS from your bank)

**Payment confirmation**: Instant ✅

---

### 2. Cash Plus

**When to use**: You prefer to pay in cash

**How it works**:
1. Select "Cash Plus"
2. Click "Générer la référence"
3. **Reference code is generated** (Example: `CP1A2B3C4D`)
4. Copy the reference code
5. Visit any Cash Plus location in Morocco
6. Give them:
   - Reference code
   - Amount (250 MAD)
7. Payment confirmed automatically

**What you'll see**:
```
┌──────────────────────────────────────┐
│  💵 Référence Cash Plus générée      │
├──────────────────────────────────────┤
│  Référence: CP1A2B3C4D   [📋 Copy]  │
│                                      │
│  Présentez cette référence dans     │
│  n'importe quel point Cash Plus     │
│  avec le montant: 250 MAD           │
│                                      │
│  Valide pendant: 24 heures          │
└──────────────────────────────────────┘
```

**Where to pay**:
- Any Cash Plus location in Morocco
- Over 5,000 locations nationwide
- Find nearest: https://www.cashplus.ma

**Payment confirmation**: Within minutes after payment ✅

---

### 3. Bank Transfer (RIB/IBAN)

**When to use**: You prefer bank transfer

**How it works**:
1. Select "Virement bancaire"
2. View bank details:
   - Company name: **AlloBricolage SARL**
   - Bank: **Attijariwafa Bank**
   - RIB: **007 780 0001234567890 12**
   - IBAN: **MA64 007780 0001234567890 12**
   - **Reference**: **ALB-1A2B3C4D-XYZ** (Unique for your booking)
3. Copy the details (click 📋 to copy)
4. Go to your bank (online or branch)
5. Make transfer with the **exact reference**
6. Keep transfer receipt

**What you'll see**:
```
┌────────────────────────────────────────┐
│  🏛️ Détails du virement bancaire      │
├────────────────────────────────────────┤
│  Bénéficiaire: AlloBricolage SARL     │
│  Banque: Attijariwafa Bank            │
│                                        │
│  RIB: 007 780 0001234567890 12        │
│  [📋 Copy]                            │
│                                        │
│  IBAN: MA64 007780 0001234567890 12   │
│  [📋 Copy]                            │
│                                        │
│  ⚠️ Référence à mentionner:           │
│  ALB-1A2B3C4D-XYZ [📋 Copy]          │
│                                        │
│  Important: Mentionnez cette          │
│  référence dans le motif du virement  │
└────────────────────────────────────────┘
```

**Important**: 
- ⚠️ **Always include the reference** in transfer description
- Without reference, payment cannot be matched to your booking

**Payment confirmation**: 1-2 business days (manual verification)

---

## 🔔 What Happens After Payment

### Immediate:
1. ✅ Payment recorded in system
2. ✅ Booking status updated to "Confirmed"
3. 🔔 **Technician receives notification**:
   ```
   💰 Paiement reçu
   Paiement de 250 MAD confirmé pour 
   votre réservation du 27/11/2025
   ```
4. 🔔 **You receive confirmation**:
   ```
   ✅ Réservation confirmée
   Votre réservation du 27/11/2025 à 
   10:00 est confirmée
   ```

### Next Steps:
- Technician will contact you to confirm details
- You'll receive SMS reminder before appointment
- Technician arrives at scheduled time
- Service completed ✅

---

## 🔒 Security & Trust

### Your Payment is Protected:
- ✅ **SSL/TLS Encryption** - All data encrypted in transit
- ✅ **No card storage** - Card details never touch our servers
- ✅ **PCI Compliant** - Industry standard security
- ✅ **Secure gateways** - CMI certified payment gateway
- ✅ **Fraud protection** - Automatic fraud detection
- ✅ **3D Secure** - Additional verification for cards

### Trust Signals:
- 🛡️ Paiement 100% sécurisé
- 🔒 Données cryptées
- ✅ Certifié PCI-DSS
- 💳 Accepted cards: Visa, Mastercard

---

## 📱 Mobile Experience

The payment page is **fully responsive**:
- ✅ Works on all devices (phone, tablet, desktop)
- ✅ Touch-friendly buttons
- ✅ Easy copy-paste on mobile
- ✅ Clear, readable text
- ✅ Fast loading

---

## ❓ FAQ

### Q: Can I pay later?
**A**: Yes! Click "Payer plus tard" after booking. You can pay anytime from your dashboard.

### Q: Which payment method is fastest?
**A**: CMI (card payment) is instant. Cash Plus confirms within minutes. Bank transfer takes 1-2 days.

### Q: Is my card information safe?
**A**: Yes! Card details go directly to CMI's secure gateway. We never see or store your card information.

### Q: What if I forget the Cash Plus reference?
**A**: You can find it in your booking details or dashboard.

### Q: Can I get a refund?
**A**: Contact support with your booking ID. Refunds are processed within 5-7 business days.

### Q: Do I need to create an account?
**A**: Not required for booking, but recommended for tracking payments and bookings.

---

## 🎯 Tips for Best Experience

### Before Booking:
- ✅ Have your preferred date/time ready
- ✅ Describe your problem clearly
- ✅ Check technician availability

### When Paying:
- ✅ Choose the method you're most comfortable with
- ✅ Keep payment confirmation/receipt
- ✅ Save reference codes
- ✅ Check your email for confirmation

### After Payment:
- ✅ Wait for technician to contact you
- ✅ Prepare the work area
- ✅ Be available at scheduled time

---

## 📞 Need Help?

### Payment Issues:
- **CMI problems**: Contact your bank or CMI support
- **Cash Plus**: Call Cash Plus hotline: 0801 00 1818
- **Bank transfer**: Check with your bank

### Platform Support:
- **Email**: support@allobricolage.ma
- **Phone**: +212 5XX-XXXXXX
- **Chat**: Click the chat icon (bottom right)

---

**🎉 You're all set! Book your technician and pay securely with AlloBricolage!**


