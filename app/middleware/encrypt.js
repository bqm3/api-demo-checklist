const crypto = require("crypto");

const secretKey = process.env.SECRET_KEY; 
const SECRET_KEY = crypto.createHash("sha256").update(secretKey).digest("base64").substr(0, 32);

const algorithm = "aes-256-ctr";

// Hàm mã hóa
const encrypt = (text) => {
  const formatData = JSON.stringify(text);
  const iv = crypto.randomBytes(16); // Tạo IV (khởi tạo ngẫu nhiên)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(SECRET_KEY, 'utf-8'), iv);
  const encrypted = Buffer.concat([cipher.update(formatData, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

// Hàm giải mã
const decrypt = (hash) => {
  const [iv, encryptedText] = hash.split(":").map(part => Buffer.from(part, "hex"));
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(SECRET_KEY, 'utf-8'), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString("utf8");
};

module.exports = { encrypt, decrypt };
