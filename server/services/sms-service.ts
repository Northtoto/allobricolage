import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let client: twilio.Twilio | null = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
} else {
  console.warn("⚠️ Twilio not configured. SMS notifications will be skipped.");
}

interface BookingDetails {
  service: string;
  city: string;
  price: number;
  date: string;
  time: string;
  clientName: string;
}

export async function sendTechnicianNotification(
  phone: string,
  details: BookingDetails
): Promise<boolean> {
  if (!client || !fromNumber) {
    console.log("Mock SMS to", phone, ":", `New booking! ${details.service} in ${details.city} for ${details.price} MAD.`);
    return false;
  }

  try {
    const message = `🔔 Nouvelle réservation AlloBricolage!
📅 ${details.date} à ${details.time}
📍 ${details.city}
🔧 ${details.service}
💰 ${details.price} MAD
👤 ${details.clientName}

Connectez-vous pour accepter: ${process.env.BASE_URL}/technician-dashboard`;

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: phone,
    });

    console.log(`✅ SMS sent to ${phone}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
    return false;
  }
}

