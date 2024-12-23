const path = require("path");
const stream = require("stream");
const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const app = express();
const upload = multer();
const sharp = require('sharp');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const credentials = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN
};

const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: process.env.SCOPES,
});


const uploadFile = async (fileObject) => {
  try{
    const resizedBuffer = await sharp(fileObject.buffer)
    .resize({ width: 600, height: 800 }) // Set desired width
    .toBuffer();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(resizedBuffer);
    const { data } = await google.drive({ version: "v3", auth }).files.create({
      media: {
        mimeType: fileObject.mimeType,
        body: bufferStream,
      },
      requestBody: {
        name: fileObject.originalname,
        parents: [process.env.PARENT_NAME],
      },
      fields: "id,name",
    });
    return {
      name: data.name,
      id: data.id,
    }
  }catch(err){
    return undefined;
  }
};

module.exports = { uploadFile };
