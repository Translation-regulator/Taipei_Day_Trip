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
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      window.location.href = "/";
      return;
    }
  
    // --------------------- 取得預定行程資訊 ---------------------
    async function fetchBookingInfo() {
      try {
        const response = await fetch("/api/booking", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
          },
        });
  
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
  
        const data = await response.json();
        if (data.data) {
          updateBookingPage(data.data);
        } else {
          console.log("目前沒有任何預定行程");
  
          // 顯示空狀態畫面，隱藏其餘區塊
          document.querySelector(".booking-empty").style.display = "block";
          document.querySelector(".booking").style.display = "none";
          document.querySelector(".contact-info").style.display = "none";
          document.querySelector(".credit-card-info").style.display = "none";
          document.querySelector(".booking-terms").style.display = "none";
          document.querySelectorAll(".booking-hr").forEach((hr) => {
            hr.style.display = "none";
          });
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
      if (bookingTitle && bookingInfo.attraction.name) {
        bookingTitle.textContent = `台北一日遊：${bookingInfo.attraction.name}`;
      }
  
      // 時間
      const bookingTime = document.querySelector(".booking-time");
      if (bookingTime && bookingInfo.time) {
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
      if (bookingAddress && bookingInfo.attraction.address) {
        bookingAddress.innerHTML = `<span>地點：</span>${bookingInfo.attraction.address}`;
      }
  
      // 日期
      const bookingDate = document.querySelector(".booking-date");
      if (bookingDate && bookingInfo.date) {
        bookingDate.innerHTML = `<span>日期：</span>${bookingInfo.date}`;
      }
  
      // 圖片
      const bookingImage = document.querySelector(".booking-image");
      if (bookingImage && bookingInfo.attraction.image) {
        bookingImage.src = bookingInfo.attraction.image;
      }
  
      // 價格
      const bookingPrice = document.querySelector(".booking-price");
      if (bookingPrice && bookingInfo.price) {
        bookingPrice.innerHTML = `<span>費用：</span>新台幣${bookingInfo.price}元`;
      }
  
      // --------------------- 刪除預定行程功能 ---------------------
      const deleteIcon = document.querySelector(".delete-icon");
      if (deleteIcon) {
        deleteIcon.addEventListener("click", async () => {
          try {
            const response = await fetch("/api/booking", {
              method: "DELETE",
              headers: {
                Authorization: "Bearer " + token,
              },
            });
  
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
  
            const result = await response.json();
            if (result.ok) {
              // 清除畫面資訊
              document.querySelector(".booking").style.display = "none";
              sessionStorage.removeItem("bookingInfo");
  
              // 顯示空狀態頁面
              document.querySelector(".booking-empty").style.display = "block";
              document.querySelector(".contact-info").style.display = "none";
              document.querySelector(".credit-card-info").style.display = "none";
              document.querySelector(".booking-terms").style.display = "none";
              document.querySelectorAll(".booking-hr").forEach((hr) => {
                hr.style.display = "none";
              });
  
              console.log("預定行程已刪除");
            }
          } catch (error) {
            console.error("刪除預定行程失敗：", error);
          }
        });
      }
    }
  
    // --------------------- 從 sessionStorage 載入預定資訊（可選） ---------------------
    const bookingInfoStr = sessionStorage.getItem("bookingInfo");
    if (bookingInfoStr) {
      const bookingInfo = JSON.parse(bookingInfoStr);
      updateBookingPage(bookingInfo);
    }
  });
  