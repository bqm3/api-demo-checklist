const {
  Ent_user,
  Ent_duan,
  Ent_khoicv,
  Ent_chucvu,
  Ent_chinhanh,
  Ent_toanha,
  Ent_nhom,
  Ent_phanloaida,
} = require("../models/setup.model");
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const { Op, where } = require("sequelize");
const fetch = require("node-fetch");
const sequelize = require("../config/db.config");
const xlsx = require("xlsx");
const { convertDateFormat, formatVietnameseText } = require("../utils/util");

// Login User
exports.login = async (req, res) => {
  try {
    // Check if username and password are provided
    if (!req.body.UserName || !req.body.Password) {
      return res.status(400).json({
        message: "Sai tài khoản hoặc mật khẩu. Vui lòng thử lại!!",
      });
    }
    // Find user by username
    const user = await Ent_user.findOne({
      where: {
        UserName: req.body.UserName.trim(),
        isDelete: 0,
      },
      attributes: [
        "ID_User",
        "UserName",
        "ID_Chucvu",
        "ID_Chinhanh",
        "ID_Duan",
        "Hoten",
        "ID_KhoiCV",
        "Password",
        "PasswordPrivate",
        "arr_Duan",
        "Email",
        "isError",
        "isDelete",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "Diachi", "Logo", "ID_LoaiCS"],
          include: [
            {
              model: Ent_chinhanh,
              attributes: ["Tenchinhanh", "ID_Chinhanh"],
            },
            {
              model: Ent_nhom,
              attributes: ["Tennhom", "ID_Nhom"],
            },
            {
              model: Ent_phanloaida,
              as: "ent_phanloaida",
              attributes: ["ID_Phanloai", "Phanloai"],
            },
          ],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu", "Role", "isDelete"],
        },
      ],
    });

    // Check if user exists and is not deleted
    if (user && user.isDelete === 0) {
      // Compare passwords
      const passwordValid = await bcrypt.compare(
        req.body.Password.trim(),
        user.Password
      );

      if (passwordValid) {
        let projects = [];

        // Check if Role is 0 or 4
        if (user?.ent_chucvu?.Role === 0 || user?.ent_chucvu?.Role === 4) {
          // Fetch all projects related to the branch (chi nhánh)
          projects = await Ent_duan.findAll({
            where: {
              // Giả định rằng bạn có một trường ID_KhoiCV liên kết chi nhánh trong bảng dự án
              ID_Chinhanh: user.ID_Chinhanh,
            },
            attributes: ["ID_Duan", "Duan", "Diachi", "Logo", "ID_Chinhanh"],
          });
        }

        // Generate JWT token
        const token = jsonwebtoken.sign(
          {
            data: user,
          },
          process.env.JWT_SECRET,
          {
            algorithm: "HS256",
            expiresIn: "7d",
          }
        );

        // Set token as cookie
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 4 * 60 * 60 * 1000), // 7 days
        });

        // Return the token, user info, and projects if applicable
        return res.status(200).json({
          token: token,
          user: user,
          projects: projects.length > 0 ? projects : "Không có dự án nào",
        });
      } else {
        // Incorrect password
        return res
          .status(400)
          .json({ message: "Sai mật khẩu. Vui lòng thử lại." });
      }
    } else {
      // User not found or deleted
      return res.status(400).json({
        message:
          "Bạn không thể đăng nhập. Vui lòng nhắn tin cho phòng chuyển đổi số.",
      });
    }
  } catch (err) {
    // Internal server error
    return res.status(500).json({
      message: err ? err.message : "Lỗi! Vui lòng thử lại sau.",
    });
  }
};
// Create User
exports.register = async (req, res, next) => {
  try {
    const {
      UserName,
      Password,
      ID_Chucvu,
      Hoten,
      Sodienthoai,
      Gioitinh,
      Ngaysinh,
      ID_KhoiCV,
      Email,
      ID_Duan,
      arr_Duan,
    } = req.body;
    if (!UserName || !Password || !ID_Chucvu) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu.",
      });
    }
    const userData = req.user.data;
    const user = await Ent_user.findOne({
      where: {
        [Op.and]: [
          { UserName: UserName },
          { ID_Duan: ID_Duan },
          { isDelete: 0 },
        ],
      },
      attributes: [
        "ID_User",
        "UserName",
        "ID_Chucvu",
        "ID_Duan",
        "ID_KhoiCV",
        "Email",
        "isDelete",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan"],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu", "Role"],
        },
      ],
    });

    if (user !== null) {
      return res.status(401).json({
        message: "Tài khoản đã bị trùng.",
      });
    }

    const salt = genSaltSync(10);
    var data = {
      UserName: UserName,
      Email: Email || null,
      Password: await hashSync(Password, salt),
      PasswordPrivate: Password,
      ID_Chucvu: ID_Chucvu,
      ID_Duan: ID_Duan || null,
      Hoten: Hoten || null,
      Sodienthoai: Sodienthoai || null,
      Gioitinh: Gioitinh || null,
      Ngaysinh: Ngaysinh || null,
      ID_KhoiCV:
        ID_Chucvu == 1 ||
        ID_Chucvu == 5 ||
        ID_Chucvu == 6 ||
        ID_Chucvu == 7 ||
        ID_Chucvu == 2
          ? null
          : ID_KhoiCV,
      arr_Duan: `${arr_Duan}`,
      isDelete: 0,
    };

    Ent_user.create(data)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau",
    });
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
    }

    const userData = req.user.data;
    if (userData) {
      const { currentPassword, newPassword } = req.body;
      const isPasswordValid = await compareSync(
        currentPassword,
        userData?.Password
      );
      if (!isPasswordValid) {
        return res.status(403).json({ message: "Sai mật khẩu" });
      }
      const now = new Date();
      const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
      const vietnamTime = new Date(utcNow + 7 * 60 * 60000);

      const year = vietnamTime.getFullYear();
      const month = String(vietnamTime.getMonth() + 1).padStart(2, "0");
      const day = String(vietnamTime.getDate()).padStart(2, "0");
      const hours = String(vietnamTime.getHours()).padStart(2, "0");
      const minutes = String(vietnamTime.getMinutes()).padStart(2, "0");
      const seconds = String(vietnamTime.getSeconds()).padStart(2, "0");

      const formattedVietnamTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      const hashedNewPassword = await hashSync(newPassword, 10);
      await Ent_user.update(
        {
          Password: hashedNewPassword,
          PasswordPrivate: newPassword, // Store the plain text password for auditing purposes
          updateTime: formattedVietnamTime, // Add the current time to the update
        },
        {
          where: {
            ID_User: userData.ID_User,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật mật khẩu thành công!",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
    }

    const userData = req.user.data;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const {
      ID_Duan,
      ID_Chucvu,
      ID_KhoiCV,
      UserName,
      Email,
      Password,
      Hoten,
      arrData,
      Sodienthoai,
      Ngaysinh,
      Gioitinh,
      arr_Duan,
    } = req.body;

    const now = new Date();
      const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
      const vietnamTime = new Date(utcNow + 7 * 60 * 60000);

      const year = vietnamTime.getFullYear();
      const month = String(vietnamTime.getMonth() + 1).padStart(2, "0");
      const day = String(vietnamTime.getDate()).padStart(2, "0");
      const hours = String(vietnamTime.getHours()).padStart(2, "0");
      const minutes = String(vietnamTime.getMinutes()).padStart(2, "0");
      const seconds = String(vietnamTime.getSeconds()).padStart(2, "0");

      const formattedVietnamTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    // Kiểm tra xem có dữ liệu mật khẩu được gửi không
    let updateData = {
      ID_Duan: ID_Duan !== ''? ID_Duan: null,
      ID_Chucvu,
      ID_KhoiCV: ID_KhoiCV == '' ? null : ( ID_Chucvu == 1 || ID_Chucvu == 2 ? null : ID_KhoiCV),
      UserName,
      Hoten,
      Sodienthoai,
      Gioitinh,
      PasswordPrivate: Password,
      Email,
      Ngaysinh,
      arrData,
      arr_Duan: `${arr_Duan}`,
      isDelete: 0,
      updateTime: formattedVietnamTime, // Add the current time to the update
    };

    if (Password) {
      const hashedNewPassword = await hashSync(Password, 10);
      updateData.Password = hashedNewPassword;
    }

    await Ent_user.update(updateData, {
      where: {
        ID_User: req.params.id,
      },
    });

    return res.status(200).json({ message: "Cập nhật thông tin thành công!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

// Get All User
exports.deleteUser = async (req, res, next) => {
  try {
    const userData = req.user.data;
    if (userData) {
      await Ent_user.update(
        {
          isDelete: 1,
        },
        {
          where: {
            ID_User: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa tài khoản thành công!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// Get User Online
exports.getUserOnline = async (req, res, next) => {
  try {
    const userData = req.user.data;
    let whereClause = {
      isDelete: 0,
    };

    if (
      (userData.ent_chucvu.Role !== 10 &&
      userData.ID_Duan !== null) || (userData.ent_chucvu.Role !== 0 &&
        userData.ID_Duan !== null) || (userData.ent_chucvu.Role !== 4 &&
          userData.ID_Duan !== null)
    ) {
      whereClause.ID_Duan = userData.ID_Duan;
    }

    if (userData.ent_chucvu.Role === 10 && userData.ID_Duan === null) {
      whereClause["$ent_chucvu.Role$"] = { [Op.notIn]: [2, 3] };
    }

    await Ent_user.findAll({
      attributes: [
        "ID_User",
        "UserName",
        "Email",
        "Hoten",
        "Sodienthoai",
        "PasswordPrivate",
        "arr_Duan",
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Chucvu",
        "isDelete",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "Diachi", "Logo"],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu", "Role"],
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
      ],
      where: whereClause,
      order: [
        ["ID_Duan", "ASC"],
        ["ID_Chucvu", "ASC"],
      ],
    })
      .then((data) => {
        res.status(200).json({
          message: "Danh sách nhân viên!",
          data: data,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getUserRoleOnline = async (req, res, next) => {
  try {
    const userData = req.user.data;
    let whereClause = {
      isDelete: 0,
    };

    if (
      (userData.ent_chucvu.Role !== 10 &&
      userData.ID_Duan !== null) || (userData.ent_chucvu.Role !== 0 &&
        userData.ID_Duan !== null) || (userData.ent_chucvu.Role !== 4 &&
          userData.ID_Duan !== null)
    ) {
      whereClause.ID_Duan = userData.ID_Duan;
    }

    if (userData.ent_chucvu.Role === 10 && userData.ID_Duan === null) {
      whereClause["$ent_chucvu.Role$"] = { [Op.notIn]: [2, 3] };
    }

    await Ent_user.findAll({
      attributes: [
        "ID_User",
        "UserName",
        "Email",
        "Hoten",
        "Sodienthoai",
        "PasswordPrivate",
        "arr_Duan",
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Chucvu",
        "isDelete",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "Diachi", "Logo"],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu", "Role"],
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
      ],
      where: whereClause,
      order: [
        ["ID_Duan", "ASC"],
        ["ID_Chucvu", "ASC"],
      ],
    })
      .then((data) => {
        res.status(200).json({
          message: "Danh sách nhân viên!",
          data: data,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      let whereClause = {
        isDelete: 0,
      };

      if (userData.ID_Chucvu !== 1 || userData.ent_chucvu.Chucvu !== "PSH") {
        whereClause.ID_Duan = userData.ID_Duan;
      }

      await Ent_user.findByPk(req.params.id, {
        attributes: [
          "ID_User",
          "UserName",
          "Email",
          "Hoten",
          "Sodienthoai",
          "Ngaysinh",
          "Gioitinh",
          "PasswordPrivate",
          "arr_Duan",
          "ID_Duan",
          "ID_KhoiCV",
          "ID_Chucvu",
          "isDelete",
          "ID_Chucvu",
        ],
        order: [
          ["ID_Duan", "ASC"],
          ["ID_Chucvu", "ASC"],
        ],
        include: [
          {
            model: Ent_duan,
            attributes: [
              "ID_Duan",
              "Duan",
              "Diachi",
              "ID_Nhom",
              "ID_Chinhanh",
              "ID_Linhvuc",
              "ID_Loaihinh",
              "ID_Phanloai",
              "Vido",
              "Kinhdo",
              "Logo",
              "isDelete",
            ],
            include: [
              {
                model: Ent_toanha,
                as: "ent_toanha",
                attributes: ["Toanha", "Sotang", "ID_Duan", "Vido", "Kinhdo"],
                where: { isDelete: 0 },
                required: false,
              },
              {
                model: Ent_nhom,
                as: "ent_nhom",
                attributes: ["Tennhom", "ID_Nhom"],
              },
            ],
          },
          {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          {
            model: Ent_khoicv,
            attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
          },
        ],
        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Thông tin User!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

//get Check auth
exports.checkAuth = async (req, res, next) => {
  try {
    const userData = req.user.data;

    await Ent_user.findByPk(userData.ID_User, {
      attributes: [
        "ID_User",
        "UserName",
        "Email",
        "Hoten",
        "Gioitinh",
        "Sodienthoai",
        "Ngaysinh",
        "PasswordPrivate",
        "arr_Duan",
        "ID_Duan",
        "ID_KhoiCV",
        "deviceToken",
        "ID_Chucvu",
      ],
      include: [
        {
          model: Ent_duan,
          attributes: [
            "ID_Duan",
            "Duan",
            "Diachi",
            "ID_Nhom",
            "ID_Chinhanh",
            "ID_Linhvuc",
            "ID_Loaihinh",
            "ID_Phanloai",
            "Vido",
            "Kinhdo",
            "Logo",
            "isDelete",
          ],
          include: [
            {
              model: Ent_toanha,
              as: "ent_toanha",
              attributes: ["Toanha", "Sotang", "ID_Duan", "Vido", "Kinhdo"],
              where: { isDelete: 0 },
              required: false,
            },
            {
              model: Ent_nhom,
              as: "ent_nhom",
              attributes: ["Tennhom", "ID_Nhom"],
            },
          ],
        },
        {
          model: Ent_chucvu,
          attributes: ["Chucvu", "Role"],
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
      ],
      where: {
        isDelete: 0,
      },
    })
      .then((data) => {
        res.status(200).json({
          message: "Thông tin User!",
          data: data,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// get account checklist giam sat by du an
exports.getGiamSat = async (req, res, next) => {
  try {
    const userData = req.user.data;
    if (userData) {
      const whereCondition = {
        isDelete: 0,
        ID_Chucvu: 4,
        ID_Duan: userData.ID_Duan,
      };
      await Ent_user.findAll({
        attributes: [
          "ID_User",
          "UserName",
          "Email",
          "ID_Duan",
          "ID_KhoiCV",
          "ID_Chucvu",
          "isDelete",
        ],
        include: [
          {
            model: Ent_duan,
            attributes: [
              "ID_Duan",
              "Duan",
              "Diachi",
              "ID_Nhom",
              "ID_Chinhanh",
              "ID_Linhvuc",
              "ID_Loaihinh",
              "ID_Phanloai",
              "Vido",
              "Kinhdo",
              "Logo",
              "isDelete",
            ],
            include: [
              {
                model: Ent_toanha,
                as: "ent_toanha",
                attributes: ["Toanha", "Sotang", "ID_Duan", "Vido", "Kinhdo"],
                where: { isDelete: 0 },
                required: false,
              },
              {
                model: Ent_nhom,
                as: "ent_nhom",
                attributes: ["Tennhom", "ID_Nhom"],
              },
            ],
          },
          {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          {
            model: Ent_khoicv,
            attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
          },
        ],
        where: whereCondition,
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách nhân viên!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.deviceToken = async (req, res, next) => {
  try {
    const userData = req.user.data;
    if (userData) {
      const { deviceToken } = req.body;

      // Tìm kiếm deviceToken trong bảng Ent_user
      const existingUser = await Ent_user.findOne({
        attributes: [
          "ID_User",
          "UserName",
          "Email",
          "PasswordPrivate",
          "arr_Duan",
          "ID_Duan",
          "ID_KhoiCV",
          "deviceToken",
          "ID_Chucvu",
        ],
        where: {
          deviceToken: deviceToken,
          ID_User: { [Op.ne]: userData.ID_User },
        },
      });
      // Nếu tìm thấy user khác có deviceToken này, cập nhật deviceToken của họ thành null
      if (existingUser) {
        await Ent_user.update(
          { deviceToken: null },
          {
            where: {
              ID_User: existingUser.ID_User,
            },
          }
        );
      }
      // Cập nhật deviceToken cho user hiện tại
      await Ent_user.update(
        { deviceToken: deviceToken },
        {
          where: {
            ID_User: userData.ID_User,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật device token thành công!",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });

      // return res.status(200).json({ message: "Cập nhật device token thành công!" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

async function sendPushNotification(expoPushToken, message) {
  const payload = {
    to: expoPushToken,
    sound: "default",
    title: message.title,
    body: message.body,
    data: message.data,
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

exports.notiPush = async (message) => {
  try {
    const users = await Ent_user.findAll({
      attributes: [
        "deviceToken",
        "ID_User",
        "UserName",
        "Email",
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Chucvu",
        "isDelete",
      ],
      where: { isDelete: 0 },
    });
    const tokens = users
      .filter(
        (user) =>
          user.deviceToken &&
          user.ID_Duan === message.data.userData.ID_Duan &&
          user.ID_KhoiCV == message.data.userData.ID_KhoiCV &&
          user.ID_User !== message.data.userData.ID_User
      )
      .map((user) => user.deviceToken);

    const new_message = {
      title: message.title,
      body: message.body,
      data: {
        Ketqua: message.data.Ketqua[0],
        Gioht: message.data.Gioht[0],
        Ghichu: message.data.Ghichu[0],
      },
    };
    const notificationPromises = tokens.map((token) =>
      sendPushNotification(token, new_message)
    );

    const results = await Promise.all(notificationPromises);

    return {
      success: true,
      message: "Notifications sent to all users",
      results,
    };
  } catch (error) {
    console.error("Error sending notifications:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadFileUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const userData = req.user.data;

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    await sequelize.transaction(async (transaction) => {
      const removeSpacesFromKeys = (obj) => {
        return Object.keys(obj).reduce((acc, key) => {
          const newKey = key?.replace(/\s+/g, "")?.toUpperCase();
          acc[newKey] = obj[key];
          return acc;
        }, {});
      };

      for (const item of data) {
        const transformedItem = removeSpacesFromKeys(item);

        const tenKhoiCongViec = transformedItem["KHỐICÔNGVIỆC"];
        const duAn = transformedItem["DỰÁN"];
        const hoTen = formatVietnameseText(transformedItem["HỌTÊN"]);
        const gioiTinh = transformedItem["GIỚITÍNH"];
        const soDienThoai = transformedItem["SỐĐIỆNTHOẠI"];
        const namSinh = convertDateFormat(transformedItem["NGÀYSINH"]);
        const chucVu = transformedItem["CHỨCVỤ"];
        const gmail = transformedItem["GMAIL"];
        const taiKhoan = transformedItem["TÀIKHOẢN"];
        const matKhau = transformedItem["MẬTKHẨU"];

        const sanitizedTenToanha = duAn?.replace(/\t/g, ""); // Loại bỏ tất cả các ký tự tab

        const dataChucvu = await Ent_chucvu.findOne({
          attributes: ["ID_Chucvu", "Chucvu", "isDelete"],
          where: {
            isDelete: 0,
            Chucvu: sequelize.where(
              sequelize.fn(
                "UPPER",
                sequelize.fn("TRIM", sequelize.col("Chucvu"))
              ),
              "LIKE",
              chucVu.trim().toUpperCase()
            ),
          },
        });

        if (!dataChucvu) {
          return res.status(500).json({
            message: "Không tìm chức vụ phù hợp",
          });
        }

        let dataKhoiCV;
        if (tenKhoiCongViec !== undefined) {
          dataKhoiCV = await Ent_khoicv.findOne({
            attributes: ["ID_KhoiCV", "KhoiCV", "isDelete"],

            where: {
              KhoiCV: sequelize.where(
                sequelize.fn(
                  "UPPER",
                  sequelize.fn("TRIM", sequelize.col("KhoiCV"))
                ),
                "LIKE",
                tenKhoiCongViec.trim().toUpperCase()
              ),
              isDelete: 0,
            },
          });
          if (!dataKhoiCV) {
            return res.status(500).json({
              message: "Không tìm khối công việc phù hợp",
            });
          }
        }

        const dataUser = await Ent_user.findOne({
          attributes: [
            "ID_User",
            "ID_Duan",
            "ID_Chucvu",
            "ID_KhoiCV",
            "isDelete",
            "Hoten",
            "UserName",
            "Email",
          ],
          where: {
            UserName: sequelize.where(
              sequelize.fn(
                "UPPER",
                sequelize.fn("TRIM", sequelize.col("UserName"))
              ),
              "LIKE",
              taiKhoan.trim().toUpperCase()
            ),
            ID_Duan: userData.ID_Duan,
            isDelete: 0,
          },
          transaction,
        });

        if (dataUser) {
          console.log(`User đã tồn tại, bỏ qua`);
          continue; // Skip the current iteration and move to the next item
        }
        const salt = genSaltSync(10);
        if (!matKhau) {
          return res.status(400).json({
            message: "Mật khẩu không được để trống",
          });
        }

        const mk = hashSync(`${matKhau}`, salt);
        const dataInsert = {
          ID_Duan: userData.ID_Duan,
          ID_Chucvu: dataChucvu.ID_Chucvu || null,
          ID_KhoiCV: dataKhoiCV?.ID_KhoiCV || null,
          Password: mk,
          Email: gmail || null,
          UserName: taiKhoan,
          Hoten: hoTen,
          Gioitinh: gioiTinh,
          Sodienthoai: soDienThoai,
          Ngaysinh: namSinh || null,
          isDelete: 0,
        };

        await Ent_user.create(dataInsert, {
          transaction,
        });
      }
    });

    res.send({
      message: "File uploaded and data processed successfully",
      data,
    });
  } catch (err) {
    console.error("Error at line", err.stack.split("\n")[1].trim());
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
      error: err.stack,
    });
  }
};

//
exports.fixUserError = async (req, res) => {
  try {
    const userName = req.body.UserName.split(",").map((t) => t.trim());

    const users = await Ent_user.findAll({
      where: { UserName: { [Op.in]: userName }, isDelete: 0 },
      attributes: ["UserName"],
    });

    const existingUserNames = users.map((user) => user.UserName);
    const nonExistentUserNames = userName.filter(
      (name) => !existingUserNames.includes(name)
    );

    if (nonExistentUserNames.length > 0) {
      return res.status(400).send({
        message: `Tên tài khoản không tồn tại: ${nonExistentUserNames.join(
          ", "
        )}`,
      });
    }

    await Ent_user.update(
      { isError: 1 },
      { where: { UserName: { [Op.in]: userName }, isDelete: 0 } }
    );

    res.status(200).send({ message: "Thành công" });
  } catch (error) {
    res.status(500).send({ message: "Có lỗi xảy ra" });
  }
};

exports.updateDuanByRole = async (req, res) => {
  const ID_Duan = req.params.id;
  try {
    const userData = req.user.data;

    const whereCondition = {
      isDelete: 0,
      ID_User: userData.ID_User,
    };
    if (userData) {
      await Ent_user.update({ ID_Duan: ID_Duan }, { where: whereCondition })
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật thành công!!!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (error) {
    res.status(500).send({ message: "Có lỗi xảy ra" });
  }
};

exports.clearDuanByRole = async (req, res) => {
  try {
    const userData = req.user.data;
    const whereCondition = {
      isDelete: 0,
      ID_User: userData.ID_User,
    };
    if (userData) {
      await Ent_user.update({ ID_Duan: null }, { where: whereCondition })
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật thành công!!!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (error) {
    res.status(500).send({ message: "Có lỗi xảy ra" });
  }
};

exports.resetPassword = async (req, res) => {
  // Validate input
  const { UserName, Password } = req.body;
  if (!UserName?.trim() || !Password?.trim()) {
    return res.status(400).json({
      message: "Phải nhập đầy đủ dữ liệu!",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    // Prepare data
    const userNames = UserName.split(",")
      .map((name) => name.trim())
      .filter((name) => name); // Remove empty strings

    const hashedPassword = hashSync(Password, 10);
    const vietnamTime = new Date(Date.now() + 7 * 60 * 60000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // Find all users in one query
    const users = await Ent_user.findAll({
      where: {
        UserName: {
          [Op.in]: userNames,
        },
      },
      attributes: ["ID_User", "UserName"],
      transaction,
    });

    // Check for missing users
    const foundUserNames = users.map((user) => user.UserName);
    const missingUsers = userNames.filter(
      (name) => !foundUserNames.includes(name)
    );

    if (missingUsers.length > 0) {
      throw new Error(`Người dùng ${missingUsers.join(", ")} không tồn tại`);
    }

    // Update all passwords in one query
    await Ent_user.update(
      {
        Password: hashedPassword,
        updateTime: vietnamTime,
      },
      {
        where: {
          ID_User: {
            [Op.in]: users.map((user) => user.ID_User),
          },
        },
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Cập nhật mật khẩu thành công !",
    });
  } catch (error) {
    await transaction.rollback();
    const isValidationError = error.message.includes("không tồn tại");
    return res.status(isValidationError ? 400 : 500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

//lấy sdt giám đốc dự án, kỹ sư trưởng, giám sát trưởng, trưởng ca kỹ thuật
exports.getPhone = async (req, res) => {
  try {
    const userData = req.user.data;

    // Tìm danh sách người dùng theo điều kiện
    const users = await Ent_user.findAll({
      attributes: ["ID_Chucvu", "Hoten","Sodienthoai"],
      where: {
        ID_Duan: userData.ID_Duan, 
        isDelete: 0, 
      },
      include: [
        {
          model: Ent_chucvu,
          attributes: ["ID_Chucvu","Chucvu", "Role", "isDelete"],
          where: {
            Role: { [Op.in]: [1, 2] },
            isDelete: 0,
          },
        },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng nào phù hợp.',
      });
    }

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong khi lấy dữ liệu.',
      error: error.message,
    });
  }
};
