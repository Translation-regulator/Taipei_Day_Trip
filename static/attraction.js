// 取用 DOM 元素
const dateInput = document.querySelector('#order');
const optionA = document.querySelector('#optionA');
const optionB = document.querySelector('#optionB');
const feeLabel = document.querySelector('.fee-label .currency');
const imageContainer = document.querySelector('.attraction-image');

// 用於儲存箭頭與點點的容器，直接插入圖片容器內
const imageNav = document.createElement('div');
imageNav.classList.add('image-nav');
const imageDots = document.createElement('div');
imageDots.classList.add('image-dots');

let currentImageIndex = 0;
let images = []; // 儲存景點圖片
let attractionId = window.location.pathname.split('/').pop();

// 點擊「台北一日遊」返回首頁
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

// 初始載入景點資料與事件
window.addEventListener('load', () => {
  fetchAttractionDetails(attractionId);
  setupEventListeners();
});

function setupEventListeners() {
  optionA.addEventListener('change', updateFee);
  optionB.addEventListener('change', updateFee);
}

function updateFee() {
  const fee = optionA.checked ? 2000 : 2500;
  feeLabel.textContent = `新台幣${fee}元`;
}

async function fetchAttractionDetails(attractionId) {
  try {
    const response = await fetch(`/api/attraction/${attractionId}`);
    const data = await response.json();
    if (data.data) {
      const attraction = data.data;
      renderAttractionDetails(attraction);
    } else {
      alert('無法載入景點資料');
    }
  } catch (error) {
    console.error('Error fetching attraction details:', error);
  }
}

function renderAttractionDetails(attraction) {
  const { name, category, mrt, description, address, transport, images: attractionImages } = attraction;
  
  const attractionTitle = document.querySelector('.attraction-title');
  const attractionCategoryMRT = document.querySelector('.attraction-category-mrt');
  const attractionDescription = document.querySelector('.attraction-description');
  const descriptionAddress = document.querySelector('.attraction-address');
  const descriptionTransport = document.querySelector('.attraction-transport');

  attractionTitle.textContent = name;
  attractionCategoryMRT.innerHTML = `${category} <span>at ${mrt}</span>`;
  attractionDescription.textContent = description;
  descriptionAddress.textContent = address;
  descriptionTransport.textContent = transport;

  images = attractionImages;
  renderImageSlideshow();
}

function renderImageSlideshow() {
  // 設定第一張圖片
  imageContainer.style.backgroundImage = `url(${images[currentImageIndex]})`;

  // 建立箭頭 (插入到圖片容器內)
  const arrowLeft = document.createElement('span');
  arrowLeft.classList.add('arrow-left');
  arrowLeft.title = "上一張";
  
  const arrowRight = document.createElement('span');
  arrowRight.classList.add('arrow-right');
  arrowRight.title = "下一張";

  imageNav.appendChild(arrowLeft);
  imageNav.appendChild(arrowRight);
  imageContainer.appendChild(imageNav);

  // 建立點點，並用 title 提示目前第幾張
  imageDots.innerHTML = ''; // 清空先前的點點
  images.forEach((img, index) => {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (index === currentImageIndex) dot.classList.add('active');
    dot.title = `第 ${index + 1} 張`;
    dot.addEventListener('click', () => changeImage(index));
    imageDots.appendChild(dot);
  });
  imageContainer.appendChild(imageDots);

  // 綁定箭頭事件
  arrowLeft.addEventListener('click', () => changeImage(currentImageIndex - 1));
  arrowRight.addEventListener('click', () => changeImage(currentImageIndex + 1));
}

function changeImage(index) {
  if (index < 0) {
    currentImageIndex = images.length - 1;
  } else if (index >= images.length) {
    currentImageIndex = 0;
  } else {
    currentImageIndex = index;
  }
  imageContainer.style.backgroundImage = `url(${images[currentImageIndex]})`;
  updateDotStyle();
}

function updateDotStyle() {
  const dots = imageDots.querySelectorAll('.dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentImageIndex);
  });
}

// --------------------- 以下為登入登出與註冊相關邏輯 ---------------------

// 1. 取得按鈕與 Dialog 元素
const loginButton = document.querySelector(".nav-login"); // 右上角「登入/註冊」按鈕
const dialogOverlay = document.getElementById("dialog-overlay");
const dialogCloseBtns = document.querySelectorAll(".dialog-close-btn");

// 取得表單切換的按鈕
const dialogSignin = document.getElementById("dialog-signin");
const dialogSignup = document.getElementById("dialog-signup");
const toSignupBtn = document.getElementById("to-signup");
const toSigninBtn = document.getElementById("to-signin");

// 取得登入與註冊表單中的輸入欄位與按鈕
const signinInputs = dialogSignin.querySelectorAll(".input-group input");
const signinBtn = dialogSignin.querySelector(".dialog-btn");

const signupInputs = dialogSignup.querySelectorAll(".input-group input");
const signupBtn = dialogSignup.querySelector(".dialog-btn");

// 2. 取得使用者資訊函式
async function getUserInfo(token) {
  try {
    const response = await fetch('/api/user/auth', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    // 可依需求在頁面上顯示使用者名稱或其他資訊
  } catch (error) {
    console.error('取得使用者資訊失敗：', error);
  }
}

// 3. 更新登入狀態
function updateLoginStatus() {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    loginButton.textContent = "登出系統";
    getUserInfo(token);
  } else {
    loginButton.textContent = "登入/註冊";
  }
}
updateLoginStatus();

// 4. 修改按鈕點擊行為：已登入則登出，未登入則開啟登入 pop-up
loginButton.addEventListener("click", () => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    // 登出流程
    localStorage.removeItem('jwtToken');
    updateLoginStatus();
    window.location.reload();
  } else {
    // 每次打開前，預設顯示「登入表單」，隱藏「註冊表單」
    dialogSignin.style.display = "block";
    dialogSignup.style.display = "none";
    // 加上 active 類
    dialogOverlay.classList.add("active");
  }
});

// 5. 關閉彈窗
dialogCloseBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    dialogOverlay.classList.remove("active");
  });
});

// (可選) 點擊遮罩區域也關閉
dialogOverlay.addEventListener("click", (event) => {
  if (event.target === dialogOverlay) {
    dialogOverlay.classList.remove("active");
  }
});

// 6. 切換表單
toSignupBtn.addEventListener("click", () => {
  dialogSignin.style.display = "none";
  dialogSignup.style.display = "block";
});
toSigninBtn.addEventListener("click", () => {
  dialogSignin.style.display = "block";
  dialogSignup.style.display = "none";
});

// 7. 登入功能：綁定登入按鈕事件
if (signinBtn) {
  signinBtn.addEventListener("click", () => {
    const email = signinInputs[0].value.trim();
    const password = signinInputs[1].value.trim();
    userSignin(email, password);
  });
}

async function userSignin(email, password) {
  if (!email || !password) {
    displayMessage(dialogSignin, 'error', "請填寫完整的登入資訊");
    return;
  }
  if (!validateEmail(email)) {
    displayMessage(dialogSignin, 'error', "請輸入符合格式的電子信箱");
    return;
  }
  try {
    const response = await fetch('/api/user/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.error) {
      displayMessage(dialogSignin, 'error', "請輸入正確的電子信箱或密碼");
    } else {
      localStorage.setItem('jwtToken', data.token);
      updateLoginStatus();
      window.location.href = `/attraction/${attractionId}`;
    }
  } catch (error) {
    console.error('登入失敗：', error);
  }
}

// 8. 註冊功能：綁定註冊按鈕事件
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const name = signupInputs[0].value.trim();
    const email = signupInputs[1].value.trim();
    const password = signupInputs[2].value.trim();
    userSignup(name, email, password);
  });
}

async function userSignup(name, email, password) {
  // 前端驗證：所有欄位必填
  if (!name || !email || !password) {
    displayMessage(dialogSignup, 'error', "請填寫完整的註冊資訊");
    return;
  }
  // 驗證電子信箱格式
  if (!validateEmail(email)) {
    displayMessage(dialogSignup, 'error', "請輸入符合格式的電子信箱");
    return;
  }
  try {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (data.error) {
      displayMessage(dialogSignup, 'error', data.message);
    } else {
      displayMessage(dialogSignup, 'success', "註冊成功！");
      // 註冊成功後，1秒後切換到登入的 popup
      setTimeout(() => {
        dialogSignup.style.display = "none";
        dialogSignin.style.display = "block";
      }, 1000);
    }
  } catch (error) {
    console.error('註冊失敗：', error);
  }
}

// 輔助函式：驗證電子信箱格式
function validateEmail(email) {
  const regex = /^[^@]+@[^@]+$/;
  return regex.test(email);
}

// 輔助函式：在對話框中顯示訊息
function displayMessage(dialog, type, message) {
  const container = dialog.querySelector('.dialog-inner-content');
  let messageEl = container.querySelector('.dialog-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.classList.add('dialog-message');
    const button = container.querySelector('.dialog-btn');
    container.insertBefore(messageEl, button);
  }
  messageEl.textContent = message;
  messageEl.style.color = type === 'error' ? 'red' : 'green';
}
