document.getElementById("medical-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = document.getElementById("record-id").value; // Lấy ID từ form
    const name = document.getElementById("name").value;
    const age = parseInt(document.getElementById("age").value);  // Parse to integer
    const disease = document.getElementById("disease").value;
    const description = document.getElementById("description").value;

    if (!name || !age || !disease) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
        return;
    }

    if (isNaN(age) || age <= 0) {
        alert("Tuổi phải là một số dương.");
        return;
    }

    const newRecord = { name, age, disease, description };

    try {
        let response;
        const baseURL = "/.netlify/functions/api"; // Base URL for Netlify Functions

        if (id) {
            // Chỉnh sửa hồ sơ (sử dụng ID lấy từ form)
            response = await fetch(`${baseURL}/edit-record/${id}`, { // URL ĐẦY ĐỦ và sử dụng ID
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRecord)
            });
            alert("Hồ sơ đã được cập nhật!");

        } else {
            // Thêm mới hồ sơ
            response = await fetch(`${baseURL}/add-record`, { // URL ĐẦY ĐỦ
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRecord)
            });
            alert("Hồ sơ đã được lưu!");
        }

        if (!response.ok) {
            const errorText = await response.text(); // Lấy thông tin lỗi từ server
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

    } catch (error) {
        console.error("Lỗi khi gửi yêu cầu:", error);
        alert("Đã xảy ra lỗi. Vui lòng kiểm tra console để biết chi tiết.");  // Thông báo chi tiết hơn
    } finally {
        resetForm();  // Reset form always
        await loadRecords(); // Reload records always
    }
});

function resetForm() {
    document.getElementById("record-id").value = "";
    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("disease").value = "";
    document.getElementById("description").value = "";
}

// Load danh sách hồ sơ
async function loadRecords(searchTerm = "") { // Thêm tham số searchTerm
    try {
        const baseURL = "/.netlify/functions/api"; // Base URL for Netlify Functions
        const response = await fetch(`${baseURL}/get-records`); // URL ĐẦY ĐỦ
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const records = await response.json();

        const recordsList = document.getElementById("records-list");
        recordsList.innerHTML = "";

        // Lọc các bản ghi dựa trên searchTerm
        const filteredRecords = records.filter(record => {
            const searchText = searchTerm.toLowerCase();
            return (
                record.name.toLowerCase().includes(searchText) ||
                record.description.toLowerCase().includes(searchText)
            );
        });

        filteredRecords.forEach((record, index) => {
            const li = document.createElement("li");
            li.innerHTML = `${record.name} <br>
                            - Tuổi: ${record.age} <br>
                            - Giờ hẹn: ${record.disease}<br>
                            - Mô tả: ${record.description}<br>
                            <button class="edit-btn" onclick="editRecord('${index}')">Sửa</button>  <!-- Truyền index dưới dạng string -->
                            <button class="delete-btn" onclick="deleteRecord('${index}')">Xóa</button>`;
            recordsList.appendChild(li);
        });
    } catch (error) {
        console.error("Lỗi khi tải hồ sơ:", error);
        alert("Không thể tải danh sách hồ sơ.");
    }
}

// Chỉnh sửa hồ sơ
async function editRecord(index) {
    try {
        const baseURL = "/.netlify/functions/api"; // Base URL for Netlify Functions
        const response = await fetch(`${baseURL}/get-records`); // URL ĐẦY ĐỦ
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const records = await response.json();
        const record = records[index];

        document.getElementById("record-id").value = index;  // Truyền index vào form (ID)
        document.getElementById("name").value = record.name;
        document.getElementById("age").value = record.age;
        document.getElementById("disease").value = record.disease;
        document.getElementById("description").value = record.description;
    } catch (error) {
        console.error("Lỗi khi chỉnh sửa hồ sơ:", error);
        alert("Không thể chỉnh sửa hồ sơ.");
    }
}

// Xóa hồ sơ
async function deleteRecord(index) {
    if (confirm("Bạn có chắc chắn muốn xóa hồ sơ này?")) {
        try {
            const baseURL = "/.netlify/functions/api"; // Base URL for Netlify Functions
            const response = await fetch(`${baseURL}/delete-record/${index}`, { method: "DELETE" }); // URL ĐẦY ĐỦ
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            alert("Hồ sơ đã được xóa!");
            await loadRecords();
        } catch (error) {
            console.error("Lỗi khi xóa hồ sơ:", error);
            alert("Không thể xóa hồ sơ.");
        }
    }
}

// Lắng nghe sự kiện nhập liệu vào ô tìm kiếm
document.getElementById("search-input").addEventListener("input", function() {
    const searchTerm = this.value;
    loadRecords(searchTerm); // Gọi loadRecords với từ khóa tìm kiếm
});

// Load initial records
loadRecords();