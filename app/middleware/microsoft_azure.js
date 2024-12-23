const { Client } = require("@microsoft/microsoft-graph-client");
const { InteractiveBrowserCredential } = require("@azure/identity"); // Dùng InteractiveBrowserCredential để xác thực người dùng

// Cấu hình ứng dụng Azure và các quyền của người dùng
const credential = new InteractiveBrowserCredential({
  clientId: "7a410b47-d95c-4fa1-832d-dcbafc54ec4f",
  tenantId: "975ee0c8-1f39-4322-946d-4bd91351f7a8",
});

// Lấy token người dùng
async function getAccessToken() {
  const accessToken = await credential.getToken([
    "https://graph.microsoft.com/.default",
  ]);
  return accessToken.token;
}

// Cấu hình Microsoft Graph client
function getGraphClient(accessToken) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

async function uploadFileToOneDrive(image) {
  try {
    const accessToken = await getAccessToken(); // Lấy token người dùng
    const client = getGraphClient(accessToken);

    const fileName = image.originalname;
    const media = {
      mimeType: image.mimetype,
      body: Buffer.from(image.buffer),
    };

    const uploadPath =
      "/me/drive/root:/Documents/Backup/Data Checklist/" +
      fileName +
      ":/content";

    const uploadResult = await client.api(uploadPath).put(media.body);

    return uploadResult.id;
  } catch (error) {
    console.error("Error uploading file to OneDrive:", error);
    return undefined;
  }
}

const oneDriveAuth = async (imageByte) => {
  request.get(
    {
      url: "https://login.microsoftonline.com/common/oauth2/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      form: {
        client_id: "7a410b47-d95c-4fa1-832d-dcbafc54ec4f", // client id will be provided by oneDrive administrator
        scope: "https://graph.microsoft.com/User.ReadWrite.All",
        grant_type: "refresh_token",
        client_secert: "xxxxxxxxxxxxx", // client secret will be provided by oneDrive administrator
        refresh_token: "xxxxxxxxxxxx", //// refresh token will be provided by oneDrive administrator
      },
    },
    function (error, response, body) {
      request.put(
        {
          //00910684.jpeg
          url: `https://graph.microsoft.com/v1.0/me/drive/root:/Documents/Backup/Data Checklist/${file}:/content`,
          headers: {
            Authorization: "Bearer " + JSON.parse(body).access_token,
            "Content-Type": "image/JPEG",
          },
          body: imageByte, //give image in ByteArray format
        },
        function (er, re, bo) {
          const result = JSON.parse(bo);
        }
      );
    }
  );
};

module.exports = { uploadFileToOneDrive };
