document.addEventListener("DOMContentLoaded", () => {
  // --------------------- 點擊「台北一日遊」返回首頁 ---------------------
  function homepage(className) {
    const button = document.querySelector(`.${className}`);
    if (button) {
      button.addEventListener("click", () => {
        window.location.href = "/";
      });
    } else {
      console.error(`Element with class "${className}" not found.`);
    }
  }
  homepage("nav-title");

  // --------------------- 登入/登出功能 ---------------------
  const loginButton = document.querySelector(".nav-login");
  function updateLoginStatus() {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      loginButton.textContent = "登出系統";
    } else {
      loginButton.textContent = "登入/註冊";
    }
  }
  updateLoginStatus();
  loginButton.addEventListener("click", () => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      // 登出流程：清除 token 並重新載入頁面
      localStorage.removeItem("jwtToken");
      updateLoginStatus();
      window.location.reload();
    } else {
      // 未登入，導向登入頁面
      window.location.href = "/login";
    }
  });

  // --------------------- 驗證登入狀態 ---------------------
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    // 沒有登入則導向首頁
    window.location.href = "/";
    return;
  }

  // --------------------- 取得預定行程資訊 ---------------------
  async function fetchBookingInfo() {
    try {
      const response = await fetch("/api/booking", {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();

      if (result.data) {
        // 存成全域，供後續付款流程使用
        window.bookingData = result.data;
        updateBookingPage(result.data);
      } else {
        // 無預定行程，顯示空狀態
        document.querySelector(".booking-empty").style.display = "block";
        document.querySelector(".booking").style.display = "none";
        document.querySelector(".contact-info").style.display = "none";
        document.querySelector(".credit-card-info").style.display = "none";
        document.querySelector(".booking-terms").style.display = "none";
        document.querySelectorAll(".booking-hr").forEach(hr => hr.style.display = "none");

        // 顯示使用者名稱
        const userRes = await fetch("/api/user/auth", {
          method: "GET",
          headers: { Authorization: "Bearer " + token },
        });
        if (userRes.ok) {
          const userJson = await userRes.json();
          const userName = userJson.data?.name || "使用者";
          const header = document.querySelector("header.section-container");
          if (header) {
            header.textContent = `您好，${userName}，目前沒有任何預定行程`;
          }
        }
      }
    } catch (error) {
      console.error("取得預定行程失敗：", error);
    }
  }
  fetchBookingInfo();

  // --------------------- 更新預定行程頁面 ---------------------
  function updateBookingPage(bookingInfo) {
    // 使用者名稱
    const header = document.querySelector("header.section-container");
    const userName = bookingInfo.userName || "使用者";
    if (header) {
      header.textContent = `您好，${userName}，待預定的行程如下：`;
    }

    // 景點名稱
    const bookingTitle = document.querySelector(".booking-title");
    if (bookingTitle) {
      bookingTitle.textContent = `台北一日遊：${bookingInfo.attraction.name}`;
    }

    // 時間
    const bookingTime = document.querySelector(".booking-time");
    if (bookingTime) {
      const timeText =
        bookingInfo.time === "morning"
          ? "早上9點到下午4點"
          : bookingInfo.time === "afternoon"
          ? "下午2點到晚上9點"
          : "全天";
      bookingTime.innerHTML = `<span>時間：</span>${timeText}`;
    }

    // 地址
    const bookingAddress = document.querySelector(".booking-address");
    if (bookingAddress) {
      bookingAddress.innerHTML = `<span>地點：</span>${bookingInfo.attraction.address}`;
    }

    // 日期
    const bookingDate = document.querySelector(".booking-date");
    if (bookingDate) {
      bookingDate.innerHTML = `<span>日期：</span>${bookingInfo.date}`;
    }

    // 圖片
    const bookingImage = document.querySelector(".booking-image");
    if (bookingImage) {
      bookingImage.src = bookingInfo.attraction.image;
    }

    // 費用
    const bookingPrice = document.querySelector(".booking-price");
    if (bookingPrice) {
      bookingPrice.innerHTML = `<span>費用：</span>新台幣${bookingInfo.price}元`;
    }

    // 總價
    const bookingFee = document.querySelector(".booking-fee");
    if (bookingFee) {
      bookingFee.textContent = `總價：新台幣${bookingInfo.price}元`;
    }

    // 刪除預定行程功能
    const deleteIcon = document.querySelector(".delete-icon");
    if (deleteIcon) {
      deleteIcon.addEventListener("click", async () => {
        try {
          const res = await fetch("/api/booking", {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token },
          });
          if (!res.ok) throw new Error("Network response was not ok");
          const json = await res.json();
          if (json.ok) {
            // 顯示空狀態
            document.querySelector(".booking").style.display = "none";
            document.querySelector(".booking-empty").style.display = "block";
            document.querySelector(".contact-info").style.display = "none";
            document.querySelector(".credit-card-info").style.display = "none";
            document.querySelector(".booking-terms").style.display = "none";
            document.querySelectorAll(".booking-hr").forEach(hr => hr.style.display = "none");
          }
        } catch (err) {
          console.error("刪除預定行程失敗：", err);
        }
      });
    }
  }

  // --------------------- 自動填入聯絡人姓名與 Email ---------------------
  async function fillContactInfo() {
    try {
      const res = await fetch("/api/user/auth", {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("無法取得使用者資訊");
      const json = await res.json();
      if (json.data) {
        document.getElementById("name").value = json.data.name || "";
        document.getElementById("email").value = json.data.email || "";
      }
    } catch (err) {
      console.error("載入使用者資料失敗：", err);
    }
  }
  fillContactInfo();

  // --------------------- TapPay SDK 初始化 ---------------------
  TPDirect.setupSDK(
    159804,
    'app_CD0K2pdI97CJ3LXcWxImJ7FSDQ0Zz3A9mtuAxEhJ5NgnDmoA9BGklR8jReWo',
    'sandbox'
  );
  TPDirect.card.setup({
    fields: {
      number: { element: '#card-number', placeholder: '**** **** **** ****' },
      expirationDate: { element: '#card-expiration', placeholder: 'MM / YY' },
      ccv: { element: '#card-cvv', placeholder: 'CVV' }
    },
    styles: {
      'input': { 'font-size': '16px' },
      '.valid': { 'color': 'green' },
      '.invalid': { 'color': 'red' }
    }
  });

  // --------------------- 確認訂購並付款 ---------------------
  const payBtn = document.querySelector('.pay-button');
  payBtn.addEventListener('click', () => {
    // 1. 檢查聯絡資訊
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    if (!name || !email || !phone) {
      alert('請填寫完整聯絡資訊');
      return;
    }

    // 2. 檢查 TapPay 欄位是否都 valid
    const tappayStatus = TPDirect.card.getTappayFieldsStatus();
    console.log("TapPay 欄位狀態：", tappayStatus);
    if (!tappayStatus.canGetPrime) {
      alert('請確認信用卡資訊是否輸入正確');
      return;
    }

    // 3. 取得 prime
    TPDirect.card.getPrime(async (result) => {
      console.log("getPrime result：", result);
      if (result.status !== 0) {
        alert('信用卡驗證失敗，請檢查卡號、到期日及安全碼');
        return;
      }
      const prime = result.card.prime;
      console.log("取得 prime：", prime);

      // 4. 組 order 資料
      const bookingInfo = window.bookingData;
      const body = {
        prime,
        order: {
          price: bookingInfo.price,
          trip: {
            attraction: bookingInfo.attraction,
            date: bookingInfo.date,
            time: bookingInfo.time
          },
          contact: { name, email, phone }
        }
      };

      // 5. 呼叫後端建立訂單並付款
      try {
        const resp = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(body)
        });
        const json = await resp.json();
        if (json.data && json.data.number) {
          // 6. 導向 thankyou 頁面
          window.location.href = `/thankyou?number=${json.data.number}`;
        } else {
          alert(json.message || '訂單建立失敗');
        }
      } catch (e) {
        console.error('建立訂單失敗：', e);
        alert('伺服器錯誤，請稍後再試');
      }
    });
  });
});
