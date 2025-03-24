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
  const { name, category, mrt, images: attractionImages } = attraction;
  const attractionTitle = document.querySelector('.attraction-title');
  const attractionCategoryMRT = document.querySelector('.attraction-category-mrt');

  attractionTitle.textContent = name;
  attractionCategoryMRT.innerHTML = `${category} <span>at ${mrt}</span>`;
  
  images = attractionImages;
  renderImageSlideshow();
}

function renderImageSlideshow() {
  // 設定第一張圖片
  imageContainer.style.backgroundImage = `url(${images[currentImageIndex]})`;

  // 建立箭頭 (插入到圖片容器內)
  imageNav.innerHTML = `
    <span class="arrow-left" title="上一張"></span>
    <span class="arrow-right" title="下一張"></span>
  `;
  imageContainer.appendChild(imageNav);

  // 建立點點，並用 title 提示目前第幾張
  imageDots.innerHTML = '';
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
  imageNav.querySelector('.arrow-left').addEventListener('click', () => changeImage(currentImageIndex - 1));
  imageNav.querySelector('.arrow-right').addEventListener('click', () => changeImage(currentImageIndex + 1));
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
