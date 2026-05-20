import crypto from "crypto";

const ENV_URLS = {
  staging: "https://zaakstaging.zaakpay.com",
  live: "https://api.zaakpay.com",
};

export function getZaakpayBaseUrl() {
  return ENV_URLS[process.env.ZAAKPAY_ENV] || ENV_URLS.staging;
}

export function calculateChecksum(dataString, secretKey) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(dataString)
    .digest("hex");
}

export function verifyResponseChecksum(responseParams, receivedChecksum) {
  const orderedKeys = [
    "amount", "bank", "bankid", "cardId", "cardScheme", "cardToken",
    "cardhashid", "doRedirect", "orderId", "paymentMethod", "paymentMode",
    "responseCode", "responseDescription", "productDescription",
    "product1Description", "product2Description", "product3Description",
    "product4Description", "pgTransId", "pgTransTime",
  ];

  const checksumString = orderedKeys
    .filter((key) => responseParams[key] !== undefined)
    .map((key) => `${key}=${responseParams[key]}&`)
    .join("");

  const computed = calculateChecksum(checksumString, process.env.ZAAKPAY_SECRET_KEY);
  return computed === receivedChecksum;
}

export function encryptWithPublicKey(data, publicKeyPem) {
  const buffer = Buffer.from(data, "utf-8");
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return encrypted.toString("base64");
}
