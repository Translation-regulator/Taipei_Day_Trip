document.addEventListener("DOMContentLoaded", () => {
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

    list.addEventListener("mouseup", (e) => {
        list.style.cursor = "grab";
        if (isDragging) {
            return;
        }
    });

    list.addEventListener("mouseleave", () => {
        list.style.cursor = "grab";
    });

    // 增加點擊字體區域時，拖曳滾動
    list.addEventListener("mousedown", (e) => {
        const rect = list.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const direction = e.pageX < centerX ? "left" : "right";
        
        let timeoutId;
        let intervalId;

        // 點擊並按住滑鼠，開始滾動
        timeoutId = setTimeout(() => {
            intervalId = setInterval(() => {
                if (direction === "left") {
                    list.scrollLeft -= 50; // 可調整每次滾動的距離（原來的 10 增加五倍）
                } else {
                    list.scrollLeft += 50; // 可調整每次滾動的距離（原來的 10 增加五倍）
                }
            }, 10); // 每 10 毫秒滾動一次
        }, 100); // 延遲開始連續滾動

        // 停止滾動
        list.addEventListener("mouseup", () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        });
        list.addEventListener("mouseleave", () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        });
    });

    // 移動 console.log 到 DOMContentLoaded 裡，避免變數作用域錯誤
    console.log("左箭頭:", leftArrow);
    console.log("右箭頭:", rightArrow);
    console.log("列表:", list);
});

document.addEventListener('DOMContentLoaded', function () {
    // 呼叫後端 API，抓取捷運站列表
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
});

document.addEventListener("DOMContentLoaded", () => {
    const gridContainer = document.querySelector(".row-grid");

    // 從後端 API 獲取景點資訊
    fetch('/api/attractions')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.data) {
            console.error("No attractions data received.");
            return;
        }
            const attractions = data.data;

            // 清空 grid 容器
            gridContainer.innerHTML = '';

            // 生成圖片元素
            attractions.forEach(attraction => {
                const card = document.createElement("div");
                card.classList.add("grid-item");

                // 建立圖片元素
                const img = document.createElement("img");
                img.src = attraction.image;
                img.alt = attraction.name;

                // 建立標題
                const title = document.createElement("p");
                title.textContent = attraction.name;

                // 插入元素
                card.appendChild(img);
                card.appendChild(title);
                gridContainer.appendChild(card);
            });
        })
        .catch(error => console.error("Error loading attractions:", error));
});
