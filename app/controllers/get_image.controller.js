const fs = require('fs');
const axios = require("axios");
const FormData = require("form-data");
const endpointUrl = "https://lens.google.com/v3/upload";  

const postImage = async (imageBuffer, endpointUrl) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append("encoded_image", imageBuffer, {
      filename: "image.jpg", 
      contentType: "image/jpeg", 
    });

    const response = await axios.post(endpointUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });

    const regexPattern = /",\[\[(\[".*?"\])\],"/;
    const match = response.data.match(regexPattern);

    if (match && match[1]) {
      const extractedData = match[1];
      const textData = JSON.parse(extractedData);

      // Định nghĩa các đơn vị cần ưu tiên
      const specialUnits = ['kWh', 'm³', 'bar']; // Các đơn vị cần ưu tiên

      // Lọc ra các chuỗi có chứa đơn vị đặc biệt và lấy số
      const specialUnitData = textData.filter(item => {
        return specialUnits.some(unit => item.includes(unit)); // Kiểm tra xem item có chứa đơn vị đặc biệt không
      }).map(item => {
        const numbersOnly = item.match(/\d+(\.\d+)?/); // Lọc số trong item
        return numbersOnly ? numbersOnly[0] : item;
      });

      // Nếu có các giá trị từ đơn vị đặc biệt, trả về chúng
      if (specialUnitData.length > 0) {
        return specialUnitData;
      }

      // Nếu không có thông tin từ các đơn vị đặc biệt, lọc và trả về số lớn nhất
      const filteredData = textData
        .filter(item => {
          const numbers = item.match(/\d+(\.\d+)?/g); // Tìm tất cả số trong text
          return numbers && numbers.some(number => number.length >= 5); // Kiểm tra nếu số có ít nhất 5 chữ số
        })
        .map(item => {
          // Lọc bỏ phần đơn vị, chỉ giữ lại số
          const numbersOnly = item.match(/\d+(\.\d+)?/); // Lọc các số hợp lệ
          return numbersOnly ? numbersOnly[0] : item;
        });

      // Nếu có số hợp lệ từ filteredData, trả về số lớn nhất
      if (filteredData.length > 0) {
        const largestNumber = filteredData.reduce((max, current) => {
          return parseFloat(current) > parseFloat(max) ? current : max;
        });
        return [largestNumber]; // Trả về mảng chỉ chứa số lớn nhất
      } else {
        return "Không tìm thấy thông tin phù hợp.";
      }
    } else {
      return "Không lấy được thông tin ảnh.";
    }

  } catch (error) {
    throw error;  
  }
};


const uploadFile = async (req, res) => {
  try {

    // Kiểm tra xem file có được upload lên không
    if (!req.file) {
      return res.status(401).json({ error: "Please provide an image" });
    }

    // Gửi ảnh trực tiếp từ buffer lên API OCR
    const data = await postImage(req.file.buffer, endpointUrl);

    // Trả kết quả về cho client
    return res.status(200).json({ result: data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadFile,
  postImage
};
