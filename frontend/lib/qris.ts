/**
 * QRIS EMVCo Dynamic Payload Generator & CRC16-CCITT Calculator
 */

/**
 * Calculates CRC16-CCITT checksum for QRIS payload string (Polynomial 0x1021, Init 0xFFFF)
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Standard default static QRIS payload for Rumah Cantik Irma (Fallback placeholder)
 */
export const DEFAULT_STATIC_QRIS_PAYLOAD =
  "00020101021126580016ID.CO.QRIS.WWW01189360091400000000005204599953033605802ID5918RUMAH CANTIK IRMA6008SURABAYA6304B76B";

/**
 * Transforms a static QRIS payload string into a dynamic QRIS payload with exact amount
 */
export function generateDynamicQrisPayload(staticPayload: string, amount: number): string {
  const basePayload = (staticPayload && staticPayload.trim()) ? staticPayload.trim() : DEFAULT_STATIC_QRIS_PAYLOAD;
  let payload = basePayload;

  // 1. Remove existing CRC (Tag 63: 6304XXXX) at the end if present
  if (payload.includes("6304")) {
    const crcIdx = payload.lastIndexOf("6304");
    if (crcIdx !== -1) {
      payload = payload.substring(0, crcIdx);
    }
  }

  // 2. Change Tag 01 (Point of Initiation Method) from 11 (Static) to 12 (Dynamic)
  if (payload.startsWith("000201010211")) {
    payload = "000201010212" + payload.substring(12);
  } else if (payload.includes("010211")) {
    payload = payload.replace("010211", "010212");
  }

  // 3. Remove existing Tag 54 (Transaction Amount) if present in payload
  const tag54Idx = payload.indexOf("540");
  if (tag54Idx !== -1) {
    const len = parseInt(payload.substring(tag54Idx + 2, tag54Idx + 4), 10);
    if (!isNaN(len) && len > 0) {
      payload = payload.substring(0, tag54Idx) + payload.substring(tag54Idx + 4 + len);
    }
  }

  // 4. Construct new Tag 54 for requested transaction amount
  const amountStr = Math.round(amount).toString();
  const tag54Len = amountStr.length.toString().padStart(2, "0");
  const tag54 = `54${tag54Len}${amountStr}`;

  // 5. Insert Tag 54 before Tag 58 (Country Code 5802ID) or Tag 53 (Currency 5303360)
  if (payload.includes("5802")) {
    const tag58Idx = payload.indexOf("5802");
    payload = payload.substring(0, tag58Idx) + tag54 + payload.substring(tag58Idx);
  } else if (payload.includes("5303360")) {
    const tag53Idx = payload.indexOf("5303360");
    payload = payload.substring(0, tag53Idx + 7) + tag54 + payload.substring(tag53Idx + 7);
  } else {
    payload += tag54;
  }

  // 6. Append Tag 63 header (6304) and calculate new CRC16-CCITT
  const payloadToSign = payload + "6304";
  const crc = calculateCRC16(payloadToSign);

  return payloadToSign + crc;
}

export interface QrisParsedInfo {
  merchantName: string;
  nmid: string | null;
}

/**
 * Parses Merchant Name (Tag 59) and NMID (Tag 26/51 sub-tags or pattern match) from EMVCo QRIS string
 */
export function parseQrisPayloadInfo(rawPayload: string): QrisParsedInfo {
  let merchantName = "RUMAH CANTIK IRMA";
  let nmid: string | null = null;

  if (!rawPayload || typeof rawPayload !== "string") {
    return { merchantName, nmid };
  }

  const payload = rawPayload.trim();
  let i = 0;

  while (i < payload.length - 4) {
    const tag = payload.substring(i, i + 2);
    const lenStr = payload.substring(i + 2, i + 4);
    const len = parseInt(lenStr, 10);

    if (isNaN(len) || len < 0 || i + 4 + len > payload.length) {
      break;
    }

    const value = payload.substring(i + 4, i + 4 + len);

    // Tag 59: Merchant Name
    if (tag === "59" && value) {
      merchantName = value.trim();
    }

    // Tag 26 or Tag 51: Merchant Account Information
    if (tag === "26" || tag === "51") {
      let subI = 0;
      while (subI < value.length - 4) {
        const subTag = value.substring(subI, subI + 2);
        const subLenStr = value.substring(subI + 2, subI + 4);
        const subLen = parseInt(subLenStr, 10);

        if (isNaN(subLen) || subLen < 0 || subI + 4 + subLen > value.length) {
          break;
        }

        const subValue = value.substring(subI + 4, subI + 4 + subLen);

        // NMID in Indonesia starts with ID1, ID2, or ID followed by numbers
        if (/^ID[12]?\d{9,15}$/i.test(subValue)) {
          nmid = subValue;
        }

        subI += 4 + subLen;
      }
    }

    i += 4 + len;
  }

  // Fallback regex search for NMID in the entire payload string if sub-TLV parser didn't catch it
  if (!nmid) {
    const match = payload.match(/ID[12]?\d{9,15}/i);
    if (match) {
      nmid = match[0];
    }
  }

  return { merchantName, nmid };
}
