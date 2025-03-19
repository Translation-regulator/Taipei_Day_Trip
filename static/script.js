document.addEventListener("DOMContentLoaded", () => {
    // --------------------- 原有的左右箭頭與拖曳功能 ---------------------
    const list = document.querySelector(".list");
    const leftArrow = document.querySelector(".arrow:first-of-type");
    const rightArrow = document.querySelector(".arrow:last-of-type");
    const scrollAmount = 500; // 每次點擊滾動距離

    if (!list || !leftArrow || !rightArrow) {
        console.error("無法找到 `.list` 或 `.arrow`，請檢查 HTML 結構！");
        return;
    }

    // 封裝左右箭頭的連續滾動功能
    function addContinuousScroll(button, direction) {
        let timeoutId;
        let intervalId;

        button.addEventListener("mousedown", () => {
            // 短按立即滾動一步
            if (direction === "left") {
                list.scrollLeft -= scrollAmount;
            } else {
                list.scrollLeft += scrollAmount;
            }

            // 設定延遲 100 毫秒後開始持續滾動
            timeoutId = setTimeout(() => {
                intervalId = setInterval(() => {
                    if (direction === "left") {
                        list.scrollLeft -= 100; // 增加每次滾動的距離
                    } else {
                        list.scrollLeft += 100;
                    }
                }, 10); // 每 10 毫秒滾動一次
            }, 100); // 延遲開始連續滾動
        });

        // 釋放或離開按鈕時，清除定時器
        button.addEventListener("mouseup", () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        });
        button.addEventListener("mouseleave", () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        });
    }

    // 套用到左右箭頭
    addContinuousScroll(leftArrow, "left");
    addContinuousScroll(rightArrow, "right");

    // 列表區域的拖曳功能（移除滑鼠經過時的自動滾動）
    let isDragging = false;
    let dragStartX;
    let dragScrollStart;

    list.addEventListener("mousedown", (e) => {
        isDragging = false;
        dragStartX = e.pageX;
        dragScrollStart = list.scrollLeft;
        list.style.cursor = "grabbing";
    });

    list.addEventListener("mousemove", (e) => {
        if (isDragging) {
            const walk = (e.pageX - dragStartX) * 3; // 調整拖曳速度
            list.scrollLeft = dragScrollStart - walk;
        }
    });

    list.addEventListener("mouseup", () => {
        list.style.cursor = "grab";
        if (isDragging) return;
    });

    list.addEventListener("mouseleave", () => {
        list.style.cursor = "grab";
    });

    // --------------------- MRT站清單載入 ---------------------
    fetch('/api/mrts')
        .then(response => response.json())
        .then(data => {
            const mrtList = data.data;
            const listBar = document.querySelector('.list');  // 目標 div 位置

            // 清空現有的項目
            listBar.innerHTML = '';

            // 將每個捷運站名稱添加到 list-bar 中
            mrtList.forEach(mrt => {
                const mrtElement = document.createElement('div');
                mrtElement.textContent = mrt;
                listBar.appendChild(mrtElement);
            });
        })
        .catch(error => console.error('Error fetching MRT stations:', error));

    // --------------------- 景點資料載入與無限捲動 ---------------------
    console.log("初始化載入景點");

    const gridContainer = document.querySelector(".row-grid");
    let nextPage = 0; // 初始化第一頁
    let isLoading = false; // 防止重複請求
    let lastKnownScrollPosition = 0; // 最後一次滾動位置
    let ticking = false; // 防止重複觸發滾動事件

    // 加載景點數據
    function loadAttractions(page) {
        if (isLoading || nextPage === null) return;
        isLoading = true;

        fetch(`/api/attractions?page=${page}`)
            .then(response => response.json())
            .then(data => {
                console.log("API 回應:", data); // 確認 API 回應是否正確
                if (!data.data || data.data.length === 0) return;

                data.data.forEach(attraction => {
                    const card = document.createElement("div");
                    card.classList.add("grid-item");

                    // 圖片容器
                    const imgContainer = document.createElement("div");
                    imgContainer.classList.add("img-container");

                    // 圖片
                    const img = document.createElement("img");
                    img.src = attraction.image;
                    img.alt = attraction.name;

                    // 標題
                    const title = document.createElement("h3");
                    title.textContent = attraction.name;
                    title.classList.add("title-overlay");

                    // 資訊欄 (category + mrt)
                    const infoBar = document.createElement("div");
                    infoBar.classList.add("info-bar");

                    const category = document.createElement("span");
                    category.textContent = attraction.category;
                    category.classList.add("info-text");

                    const mrt = document.createElement("span");
                    mrt.textContent = attraction.mrt;
                    mrt.classList.add("info-text");

                    // 組合 DOM 元素
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(title);

                    infoBar.appendChild(mrt);
                    infoBar.appendChild(category);

                    card.appendChild(imgContainer);
                    card.appendChild(infoBar);

                    gridContainer.appendChild(card);
                });

                // 更新 nextPage
                nextPage = data.nextPage;
                console.log("下一頁:", nextPage);
                isLoading = false;
            })
            .catch(error => {
                console.error("載入景點錯誤:", error);
                isLoading = false;
            });
    }

    // 當滾動事件發生時，觸發加載新資料
    function handleScroll() {
        lastKnownScrollPosition = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                // 判斷是否滾動到達頁面底部，並且還有下一頁
                const bottom = document.documentElement.scrollHeight - window.innerHeight;
                if (lastKnownScrollPosition >= bottom - 200 && nextPage !== null && !isLoading) {
                    console.log("觸發無限滾動，加載下一頁:", nextPage);
                    loadAttractions(nextPage);
                }

                ticking = false;
            });

            ticking = true;
        }
    }

    // 設置滾動監聽器
    window.addEventListener("scroll", handleScroll);

    // 初始載入第一頁資料
    loadAttractions(0);

    // 檢查如果頁面已經滾動到底部，則自動載入下一頁
    const bottom = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= bottom - 200 && nextPage !== null && !isLoading) {
        console.log("頁面初次載入即已到達底部，自動加載下一頁");
        loadAttractions(nextPage);
    }
});
