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
  
    // --------------------- 驗證登入狀態 ---------------------
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      // 如果沒有登入，則導回首頁或者顯示登入提示
      window.location.href = "/";
      return;
    }
  
    // --------------------- 取得預定行程資訊 ---------------------
    async function fetchBookingInfo() {
        try {
          const response = await fetch("/api/booking", {
            headers: {
              "Authorization": "Bearer " + token
            },
            method: "GET"
          });
      
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
      
          const data = await response.json();
          if (data.data) {
            // 若有預定行程，渲染預定行程內容至頁面
            console.log("預定行程資料：", data.data);
            updateBookingPage(data.data);
          } else {
            console.log("目前沒有任何預定行程");
          }
        } catch (error) {
          console.error("取得預定行程失敗：", error);
        }
      }
      
      fetchBookingInfo();
      
  
    // --------------------- 讀取 sessionStorage 中的預定行程資訊 ---------------------
    const bookingInfoStr = sessionStorage.getItem("bookingInfo");
    if (bookingInfoStr) {
      const bookingInfo = JSON.parse(bookingInfoStr);
  
      // 更新預定行程頁面
      updateBookingPage(bookingInfo);
    }
  
    // --------------------- 更新預定行程頁面 ---------------------
    function updateBookingPage(bookingInfo) {
      // 更新 booking-title (對應 attraction-title)
      const bookingTitle = document.querySelector('.booking-title');
      if (bookingTitle && bookingInfo.attraction.name) {
        bookingTitle.textContent = bookingInfo.attraction.name;
      }
  
      // 更新 booking-address (對應 attraction-address)
      const bookingAddress = document.querySelector('.booking-address');
      if (bookingAddress && bookingInfo.attraction.address) {
        bookingAddress.innerHTML = `<span>地點：</span>${bookingInfo.attraction.address}`;
      }
  
      // 更新 booking-date (對應 date-picker-container)
      const bookingDate = document.querySelector('.booking-date');
      if (bookingDate && bookingInfo.date) {
        bookingDate.innerHTML = `<span>日期：</span>${bookingInfo.date}`;
      }
  
      // 更新 booking-time (對應 options-container 的上半天/下半天)
      const bookingTime = document.querySelector('.booking-time');
      if (bookingTime && bookingInfo.time) {
        bookingTime.innerHTML = `<span>時間：</span>${bookingInfo.time}`;
      }
  
      // 更新圖片來源（假設 booking.html 中有 booking-image 元素）
      const bookingImage = document.querySelector('.booking-image');
      if (bookingImage && bookingInfo.attraction.image) {
        bookingImage.src = bookingInfo.attraction.image;
      }
  
      // 更新費用資訊 (如果有需對應的欄位)
      const bookingPrice = document.querySelector('.booking-price');
      if (bookingPrice && bookingInfo.attraction.price) {
        bookingPrice.innerHTML = `<span>費用：</span>${bookingInfo.attraction.price}`;
      }
    }
  });
  