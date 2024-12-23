require("dotenv").config();
const cron = require("node-cron");
const cookieParser = require("cookie-parser");
const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const mysqldump = require("mysqldump");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const AdmZip = require("adm-zip");
const archiver = require("archiver");
const { Readable } = require('stream');
const app = express();
const { exec } = require("child_process");


var serviceAccount = require("./pmc-cskh-2088353edcc9.json");
const sequelize = require("./app/config/db.config");
const { Sequelize, Op } = require("sequelize");
const { funcAutoNoti } = require("./noti");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

const SCOPES = "https://www.googleapis.com/auth/drive";

const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: SCOPES,
});

const drive = google.drive({
  version: "v3",
  auth: auth,
});

var corsOptions = {
  origin: [
    "*",
    "http://localhost:3000",
    "http://localhost:3636",
    "https://checklist.pmcweb.vn",
    "https://demo.pmcweb.vn",
    "https://qlts.pmcweb.vn",
  ],

  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use("/upload", express.static("app/public"));

app.get("/", (req, res) => {
  res.json("Hello World!");
});

// backup folder
if (process.env.BACKUP_ENV === "development") {
  async function exportDatabaseFromYesterday() {
    // Tính ngày hôm qua
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

    // Lấy tháng và năm hiện tại
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');  // Tháng hiện tại (01-12)
    const year = yesterday.getFullYear();  // Năm hiện tại

    // Tạo tên các bảng động
    const dynamicTables = [
      "HSSE",
      "ent_checklist",
      "ent_khuvuc",
      "ent_hangmuc",
      "tb_checklistc",
      "tb_checklistchitietdone",
      "tb_checklistchitiet",
      `tb_checklistchitiet_${month}_${year}`,
      `tb_checklistchitietdone_${month}_${year}`,
    ];

    try {
      // Lấy dữ liệu từ các bảng
      const backupDir = path.join(__dirname, "backup");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }

      const sqlFilePath = path.join(backupDir, `backup_yesterday_${new Date().toISOString().slice(0, 10)}.sql`);

      let sqlData = '';

      for (const table of dynamicTables) {
        // Lấy dữ liệu từ mỗi bảng
        const results = await sequelize.query(
          `SELECT * FROM ${table} WHERE createdAt BETWEEN ? AND ?`,
          {
            replacements: [startOfDay, endOfDay],
            type: Sequelize.QueryTypes.SELECT,
          }
        );

        if (results.length > 0) {
          sqlData += `-- Data from table: ${table}\n`;
          results.forEach((row) => {
            const insertSQL = `INSERT INTO ${table} (${Object.keys(row).join(", ")}) VALUES (${Object.values(row).map((value) => `'${value}'`).join(", ")});\n`;
            sqlData += insertSQL;
          });
          sqlData += `\n`;
        }
      }

      if (!sqlData) {
        console.log("Không có dữ liệu nào trong ngày hôm qua.");
        return;
      }

      // Tạo file SQL từ dữ liệu truy vấn
      fs.writeFileSync(sqlFilePath, sqlData);

      // Nén file SQL thành file ZIP
      const zipFilePath = sqlFilePath + ".zip";
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver("zip", {
        zlib: { level: 9 } // Đặt mức độ nén
      });

      archive.pipe(output);
      archive.file(sqlFilePath, { name: path.basename(sqlFilePath) });
      await archive.finalize();
      
      // Xóa file SQL gốc sau khi nén
      fs.unlinkSync(sqlFilePath);
      
      return zipFilePath;
    } catch (error) {
      console.error("Lỗi khi xuất dữ liệu:", error);
    }
  }

  // Lên lịch chạy hàng ngày lúc 12 giờ trưa
  cron.schedule("30 12 * * *", async () => {
    try {
      console.log("Đang xuất cơ sở dữ liệu...");
      const backupFile = await exportDatabaseFromYesterday();
      console.log(`Đã xuất thành công vào ${backupFile}`);
    } catch (error) {
      console.error("Lỗi khi xuất cơ sở dữ liệu:", error);
    }
  });
} else {
  console.log("Backup chỉ chạy ở môi trường local. NODE_ENV hiện tại là:", process.env.NODE_ENV);
}


if(process.env.BACKUP_DRIVER === "development") {
  async function exportDatabaseFromYesterday() {
    // Tính ngày hôm qua
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));
  
    // Lấy tháng và năm hiện tại
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');  // Tháng hiện tại (01-12)
    const year = yesterday.getFullYear();  // Năm hiện tại
  
    // Tạo tên các bảng động
    const dynamicTables = [
      "HSSE",
      "ent_checklist",
      "ent_khuvuc",
      "ent_hangmuc",
      "tb_checklistc",
      "tb_checklistchitietdone",
      "tb_checklistchitiet",
      `tb_checklistchitiet_${month}_${year}`,
      `tb_checklistchitietdone_${month}_${year}`,
    ];
  
    try {
      // Lấy dữ liệu từ các bảng
      const backupDir = path.join(__dirname, "backup");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
  
      const sqlFilePath = path.join(backupDir, `backup_yesterday_${new Date().toISOString().slice(0, 10)}.sql`);
  
      let sqlData = '';
  
      for (const table of dynamicTables) {
        const results = await sequelize.query(
          `SELECT * FROM ${table} WHERE createdAt BETWEEN ? AND ?`,
          {
            replacements: [startOfDay, endOfDay],
            type: Sequelize.QueryTypes.SELECT,
          }
        );
  
        if (results.length > 0) {
          sqlData += `-- Data from table: ${table}\n`;
          results.forEach((row) => {
            const insertSQL = `INSERT INTO ${table} (${Object.keys(row).join(", ")}) VALUES (${Object.values(row).map((value) => `'${value}'`).join(", ")});\n`;
            sqlData += insertSQL;
          });
          sqlData += `\n`;
        }
      }
  
      if (!sqlData) {
        console.log("Không có dữ liệu nào trong ngày hôm qua.");
        return;
      }
  
      // Tạo file SQL từ dữ liệu truy vấn
      fs.writeFileSync(sqlFilePath, sqlData);
  
      // Nén file SQL thành file ZIP
      const zipFilePath = sqlFilePath + ".zip";
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver("zip", {
        zlib: { level: 9 } // Đặt mức độ nén
      });
  
      archive.pipe(output);
      archive.file(sqlFilePath, { name: path.basename(sqlFilePath) });
      await archive.finalize();
      
      // Xóa file SQL gốc sau khi nén
      fs.unlinkSync(sqlFilePath);
      
      return zipFilePath;
    } catch (error) {
      console.error("Lỗi khi xuất dữ liệu:", error);
    }
  }
  
  async function uploadFile(filePath) {
    try {
      const folderId = "1TAMvnXHdhkTov68oKrLbB6DE0bVZezAL"; // Thay bằng ID thư mục của bạn
  
      // Tạo stream từ file ZIP
      const fileStream = fs.createReadStream(filePath);
  
      // Tạo file và upload lên Google Drive
      const createFile = await drive.files.create({
        requestBody: {
          name: path.basename(filePath),
          mimeType: 'application/zip',  // Đặt loại MIME cho file zip
          parents: [folderId],
        },
        media: {
          mimeType: 'application/zip',
          body: fileStream,  // Dùng stream từ file
        },
      });
  
      const fileId = createFile.data.id;
  
      // Đặt quyền công khai cho file
      const getUrl = await setFilePublic(fileId);
  
      // Xóa file ZIP sau khi upload thành công
      fs.unlinkSync(filePath);
  
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }
  
  // Hàm đặt quyền công khai cho file trên Google Drive
  async function setFilePublic(fileId) {
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
  
      const getUrl = await drive.files.get({
        fileId,
        fields: 'webViewLink, webContentLink',
      });
  
      return getUrl;
    } catch (error) {
      console.error("Error setting file permissions:", error);
    }
  }
  
  // Hàm thực hiện toàn bộ quá trình
  async function handleBackup() {
    try {
      const sqlData = await exportDatabaseFromYesterday(); // Xuất cơ sở dữ liệu
      if (sqlData) {
        await uploadFile(sqlData); // Upload file ZIP lên Google Drive
      }
    } catch (error) {
      console.error("Error during backup process:", error);
    }
  }
  
  // Lên lịch chạy hàng ngày lúc 4 AM
  cron.schedule('30 12 * * *', async () => {
    console.log('Running Cron Job at 4 AM');
    try {
      await handleBackup();
      console.log('Cron job completed successfully');
    } catch (error) {
      console.error('Error running cron job:', error);
    }
  });
} else {
  console.log("Backup chỉ chạy ở môi trường development. NODE_ENV hiện tại là:", process.env.NODE_ENV);
}

if(process.env.BACKUP_NOTI === "development") {
cron.schedule('30 11 * * *', async () => {
  try {
     await funcAutoNoti();
    console.log('Cron job completed successfully');
  } catch (error) {
    console.error('Error running cron job:', error);
  }
});
}else{
  console.log("Notification chỉ chạy ở môi trường development. NODE_ENV hiện tại là:", process.env.NODE_ENV);
}



// funcAutoNoti();
require("./app/routes/ent_calv.routes")(app);
require("./app/routes/ent_user.routes")(app);
require("./app/routes/ent_hsse.routes")(app);
require("./app/routes/ent_tang.routes")(app);
require("./app/routes/ent_toanha.routes")(app);
require("./app/routes/ent_khuvuc.routes")(app);
require("./app/routes/ent_thietlapca.routes")(app);
require("./app/routes/ent_duan.routes")(app);
require("./app/routes/ent_hangmuc.routes")(app);
require("./app/routes/ent_khoicv.routes")(app);
require("./app/routes/ent_checklist.routes")(app);
require("./app/routes/ent_chucvu.routes")(app);
require("./app/routes/tb_checklistc.routes")(app);
require("./app/routes/tb_checklistchitiet.routes")(app);
require("./app/routes/tb_checklistchitietdone.routes")(app);
require("./app/routes/ent_duan_khoicv.routes")(app);
require("./app/routes/tb_sucongoai.routes")(app);
require("./app/routes/mail.routes")(app);
require("./app/routes/noti.routes")(app);
require("./app/routes/ent_all.routes")(app);
require("./app/routes/ai.routes")(app);
require("./app/routes/sql.routes")(app);
require("./app/routes/get_image.routes")(app);
require("./app/routes/ent_baocaochiso.routes")(app);
require("./app/routes/p0.routes")(app);

const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
  console.log(`📝 Original Source By: ${process.env.AUTHOR}`);
  console.log(`📝 Modified Into JavaScript By: ${process.env.AUTHOR}`);
  console.log(`Server is running on port ${PORT}.`);
});
