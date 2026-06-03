// frontend/lib/whatsapp.ts

/**
 * Sends a WhatsApp notification by calling the backend service
 * @param phone - Target phone number (e.g. 08123456789 or 628123456789)
 * @param message - Message content
 */
export async function sendWaNotification(phone: string, message: string): Promise<boolean> {
  if (!phone) {
    console.error("[WhatsApp Helper] Phone number is empty, skipping message.");
    return false;
  }

  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    console.log(`[WhatsApp Helper] Triggering WhatsApp notification to ${phone}...`);
    
    const res = await fetch(`${backendUrl}/api/whatsapp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: message,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WhatsApp Helper] Backend returned error: ${errText}`);
      return false;
    }

    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("[WhatsApp Helper] Error calling backend send API:", err);
    return false;
  }
}
