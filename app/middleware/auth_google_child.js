const { google } = require("googleapis");
const stream = require("stream");
const sharp = require("sharp");

// Authentication setup
const credentials = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"), // to handle newlines in private key
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: SCOPES,
});

// Google Drive instance
const drive = google.drive({ version: "v3", auth });
const getFolderId = async (folderName) => {
  // Kiểm tra xem thư mục đã tồn tại chưa
  const folderSearch = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and '${process.env.CHILD_NAME}' in parents`,
    fields: 'files(id, name)',
  });

  if (folderSearch.data.files.length > 0) {
    return folderSearch.data.files[0].id; // Trả về ID của thư mục đã tồn tại
  } else {
    // Nếu thư mục chưa tồn tại, tạo thư mục mới
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.CHILD_NAME],  // ID của thư mục gốc chứa tất cả dự án
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id',
    });

    return folder.data.id; // Trả về ID của thư mục mới tạo
  }
};

/**
 * Find or create a folder on Google Drive
 * @param {string} name - Folder name
 * @param {string} parentId - ID of the parent folder
 * @returns {Promise<string>} - Folder ID
 */
/**
 * Upload a file to Google Drive, resizing it as needed
 * @param {Object} fileObject - The file object from multer
 * @param {Object} userData - The user data containing project information
 * @param {string} imageType - Image type ("ImageElectrical" or "ImageWater")
 * @param {string} month - The month for the file's folder structure
 * @param {string} year - The year for the file's folder structure
 * @returns {Promise<Object>} - Uploaded file data
 */
const uploadFile = async (fileObject, folderName, imageType, month, year) => {
  // Lấy ID của thư mục chung
  const folderId = await getFolderId(folderName);

  // Resize ảnh trước khi upload (nếu cần)
  const resizedBuffer = await sharp(fileObject.buffer)
    .resize({ width: 600, height: 800 })  // Đổi kích thước theo yêu cầu
    .toBuffer();
  const bufferStream = new stream.PassThrough();
  bufferStream.end(resizedBuffer);

  // Đặt tên file ảnh theo format `ImageType_Month_Year`
  const formattedName = `${month}_${year}_${imageType}.jpg`;

  // Upload file vào thư mục chung của dự án
  const { data } = await drive.files.create({
    media: {
      mimeType: fileObject.mimeType,
      body: bufferStream,
    },
    requestBody: {
      name: formattedName,  // Tên mới của file ảnh
      parents: [folderId],  // Đặt trong thư mục chung của dự án
    },
    fields: 'id, name',
  });

  return {
    name: data.name,
    id: data.id,
  };
};

const deleteFileFromGoogleDrive = async (fileId) => {
  const drive = google.drive({ version: 'v3', auth });
  try {
    await drive.files.delete({ fileId });
  } catch (error) {
    console.error('Error deleting file: ', error);
  }
};


module.exports = { uploadFile, deleteFileFromGoogleDrive };
