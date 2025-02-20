const { readFile, writeFile, access } = require("fs").promises;

exports.handler = async (event, context) => {
  const DATA_FILE = "/tmp/data.json"; // Các hàm Netlify sử dụng /tmp để lưu trữ có thể ghi

  // Hàm trợ giúp để xử lý lỗi
  const handleErrors = (statusCode, message, error) => {
    console.error(message, error);
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Bắt buộc để hỗ trợ CORS
        "Access-Control-Allow-Credentials": true // Bắt buộc để hỗ trợ CORS
      },
      body: JSON.stringify({ message }),
    };
  };

  // Middleware để đảm bảo file dữ liệu tồn tại
  const ensureDataFileExists = async () => {
    try {
      await access(DATA_FILE);
    } catch (error) {
      console.warn("Không tìm thấy file dữ liệu, tạo mới.");
      try {
        await writeFile(DATA_FILE, "[]");
      } catch (writeError) {
        return handleErrors(500, "Lỗi tạo file dữ liệu:", writeError);
      }
    }
    return null; // Không có lỗi
  };

  // Lấy danh sách hồ sơ
  const getRecords = async () => {
    try {
      console.log("Đang cố gắng đọc dữ liệu từ:", DATA_FILE);
      const data = await readFile(DATA_FILE, "utf8");
      console.log("Đọc dữ liệu thành công:", data);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Bắt buộc để hỗ trợ CORS
          "Access-Control-Allow-Credentials": true // Bắt buộc để hỗ trợ CORS
        },
        body: data,
      };
    } catch (err) {
      return handleErrors(500, "Lỗi đọc dữ liệu:", err);
    }
  };

  // Thêm hồ sơ
  const addRecord = async (body) => {
    const newRecord = JSON.parse(body);
    console.log("Đã nhận hồ sơ mới:", newRecord);

    try {
      console.log("Đang cố gắng đọc dữ liệu từ:", DATA_FILE);
      const data = await readFile(DATA_FILE, "utf8");
      console.log("Đọc dữ liệu thành công:", data);
      let records;
      try {
        records = JSON.parse(data);
      } catch (parseError) {
        console.error("Lỗi phân tích cú pháp JSON:", parseError);
        records = []; // Tạo một mảng rỗng nếu phân tích cú pháp lỗi
      }

      records.push(newRecord);

      console.log("Đang lưu các bản ghi:", records);

      const jsonData = JSON.stringify(records, null, 2);

      console.log("Đang cố gắng ghi dữ liệu vào:", DATA_FILE);
      await writeFile(DATA_FILE, jsonData);
      console.log("Lưu thành công vào:", DATA_FILE);

      return {
        statusCode: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Bắt buộc để hỗ trợ CORS
          "Access-Control-Allow-Credentials": true // Bắt buộc để hỗ trợ CORS
        },
        body: "Hồ sơ đã lưu",
      };
    } catch (err) {
      return handleErrors(500, "Lỗi lưu hồ sơ:", err);
    }
  };

  // Chỉnh sửa hồ sơ
  const editRecord = async (index, body) => {
    try {
      const data = await readFile(DATA_FILE, "utf8");
      let records = JSON.parse(data);

      if (index < 0 || index >= records.length) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Bắt buộc để hỗ trợ CORS
            "Access-Control-Allow-Credentials": true // Bắt buộc để hỗ trợ CORS
          },
          body: "Không tìm thấy hồ sơ",
        };
      }

      records[index] = { ...records[index], ...JSON.parse(body) };

      await writeFile(DATA_FILE, JSON.stringify(records, null, 2));

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Bắt buộc để hỗ trợ CORS
          "Access-Control-Allow-Credentials": true // Bắt buộc để hỗ trợ CORS
        },
        body: "Hồ sơ đã được cập nhật",
      };
    } catch (err) {
      return handleErrors(500, "Lỗi chỉnh sửa hồ sơ:", err);
    }
  };

  // Xóa hồ sơ
  const deleteRecord = async (index) => {
    try {
      const data = await readFile(DATA_FILE, "utf8");
      let records = JSON.parse(data);

      if (index < 0 || index >= records.length) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Bắt buộc để hỗ trợ CORS
            "Access-Control-Allow-Credentials": true // Bắt buộc để hỗ trợ CORS
          },
          body: "Không tìm thấy hồ sơ",
        };
      }

      records.splice(index, 1);

      await writeFile(DATA_FILE, JSON.stringify(records, null, 2));

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Bắt buộc để hỗ trợ CORS
          "Access-Control-Allow-Credentials": true // Bắt buộc để hỗ trợ CORS
        },
        body: "Hồ sơ đã được xóa",
      };
    } catch (err) {
      return handleErrors(500, "Lỗi xóa hồ sơ:", err);
    }
  };

  // Hàm xử lý chính
  try {
    // Đảm bảo file dữ liệu tồn tại
    const fileCheckResult = await ensureDataFileExists();
    if (fileCheckResult) {
      return fileCheckResult;
    }

    const { path, httpMethod, body } = event;

    // Loại bỏ đường dẫn gốc từ route của hàm
    const route = path.replace(/^\/\.netlify\/functions\/api/, ''); // Giả sử tên hàm là "api"

    if (httpMethod === "GET" && route === "/get-records") {
      return await getRecords();
    } else if (httpMethod === "POST" && route === "/add-record") {
      return await addRecord(body);
    } else if (httpMethod === "PUT" && route.startsWith("/edit-record/")) {
      const index = parseInt(route.split("/")[2]);
      return await editRecord(index, body);
    } else if (httpMethod === "DELETE" && route.startsWith("/delete-record/")) {
      const index = parseInt(route.split("/")[2]);
      return await deleteRecord(index);
    } else {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Bắt buộc để hỗ trợ CORS
          "Access-Control-Allow-Credentials": true // Bắt buộc để hỗ trợ CORS
        },
        body: JSON.stringify({ message: "Không tìm thấy route" }),
      };
    }
  } catch (error) {
    console.error("Lỗi chưa được xử lý:", error);
    return handleErrors(500, "Lỗi máy chủ chưa được xử lý", error);
  }
};