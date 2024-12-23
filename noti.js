const { Expo } = require("expo-server-sdk");
const {
  getProjectsChecklistStatus_Noti,
} = require("./app/controllers/tb_checklistc.controller");
const { funcCreateYesterDay } = require("./app/utils/util");
const { Json } = require("sequelize/lib/utils");
const Ent_user = require("./app/models/ent_user.model");
const { Op } = require("sequelize");

// Tạo đối tượng Expo SDK client
let expo = new Expo();

exports.funcAllNoti = async () => {
  // Lấy danh sách user không bị xóa và có deviceToken hợp lệ
  const users = await Ent_user.findAll({
    attributes: ["ID_User", "ID_Chucvu", "deviceToken"],
    where: {
      isDelete: 0,
      deviceToken: { [Op.ne]: null }, 
    },
  });

  const messages ={
    title: "Thông báo",
    body: "Vui lòng không cập nhật phiên bản mới IOS",
  };

  for(const user of users){
    sendPushNotification(user.deviceToken, messages)
  }
};

async function sendPushNotification(expoPushToken, message) {
  const payload = {
    to: expoPushToken,
    sound: "default",
    title: message.title,
    body: message.body,
  };

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Error sending push notification: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  return data;
}


exports.funcAutoNoti = async () => {
  try {
    const yesterday = await funcCreateYesterDay();
    const projects = await getProjectsChecklistStatus_Noti();
    const notificationResults = [];

    // Sử dụng Promise.all để gửi thông báo song song
    await Promise.all(
      projects.map(async (project) => {
        // Duyệt qua từng người dùng của dự án
        await Promise.all(
          project.users.map(async (user) => {
            // Trả về nếu không có device token
            if (!user.deviceToken) return;

            let bodyMessage;
            let title;

            if (user.khoiCV != null) {
              bodyMessage = `${user.TenKhoi} : ${user.completionRatio || 0}%`;
              title = `Tỉ lệ checklist ngày: ${yesterday}`;
            } else {
              // const khoisInfo = project.createdKhois.map(khoi => {
              //   return `${khoi.TenKhoi}: ${khoi.completionRatio || 0}%`;
              // }).join('\n');
              const khoisInfo = project.createdKhois
                .reduce((result, khoi, index, array) => {
                  if (index % 2 === 0) {
                    const nextKhoi = array[index + 1];
                    const firstKhoi = `${khoi.TenKhoi}: ${
                      khoi.completionRatio || 0
                    }%`;
                    const secondKhoi = nextKhoi
                      ? ` | ${nextKhoi.TenKhoi}: ${
                          nextKhoi.completionRatio || 0
                        }%`
                      : "";
                    result.push(firstKhoi + secondKhoi);
                  }
                  return result;
                }, [])
                .join("\n");
              title = `Tỉ lệ checklist thấp ngày: ${yesterday}`;
              bodyMessage = khoisInfo;
            }

            //`Các khối có tỉ lệ checklist thấp ngày: ${yesterday}\n`

            // Cấu hình thông báo
            const message = {
              to: user.deviceToken,
              sound: "default",
              title: title,
              body: bodyMessage,
            };

            try {
              // Gửi thông báo với timeout
              const ticket = await Promise.race([
                expo.sendPushNotificationsAsync([message]),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Notification timeout")),
                    5000
                  )
                ),
              ]);

              // Ghi log kết quả gửi thông báo thành công
              notificationResults.push({
                userId: user.id,
                userName: user.name,
                status: "success",
              });
            } catch (error) {
              // Ghi log chi tiết lỗi
              console.error(`Notification error for user ${user.name}:`, error);
              notificationResults.push({
                userId: user.id,
                userName: user.name,
                status: "error",
                errorMessage: error.message,
              });
            }
          })
        );
      })
    );

    // Trả về kết quả dự án và thông báo
    return { projects, notificationResults };
  } catch (error) {
    // Xử lý lỗi toàn cục
    console.error("Failed in funcAutoNoti:", error);
    throw error;
  }
};

exports.funcAllNoti = async () => {
  // Lấy danh sách user không bị xóa và có deviceToken hợp lệ
  const users = await Ent_user.findAll({
    attributes: ["isDelete", "deviceToken", "ID_Duan", "ID_User"],
    where: {
      isDelete: 0,
      deviceToken: { [Op.ne]: null },
      ID_Duan: 1, // Chỉ lấy user thuộc dự án của bạn
    },
  });

  if (!users || users.length === 0) {
    console.log("Không có user nào có deviceToken để gửi thông báo.");
    return;
  }

  // Tạo danh sách thông báo
  const messages = users
    .filter((user) => Expo.isExpoPushToken(user.deviceToken)) // Chỉ lấy token hợp lệ
    .map((user) => ({
      to: user.deviceToken,
      sound: "default",
      title: "Thông báo",
      body: "Ai dùng điện thoại IOS vui lòng KHÔNG cập nhật phiên bản mới.",
    }));

  if (messages.length === 0) {
    console.log("Không có deviceToken hợp lệ để gửi thông báo.");
    return;
  }

  try {
    const chunks = expo.chunkPushNotifications(messages); // Chia nhỏ request
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(messages[0]);
      } catch (error) {
        console.error("Lỗi khi gửi chunk:", error.message);
      }
    }
  } catch (error) {
    console.error("Lỗi khi gửi thông báo:", error.message);
  }
};

