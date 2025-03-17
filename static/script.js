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


document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.row-grid');

    // 透過 fetch 從 API 取得資料
    fetch('/api/attractions?page=0')
        .then(response => response.json())
        .then(data => {
            // 假設 data.data 是一個景點陣列，且每個景點的 images 為圖片 URL 陣列
            data.data.forEach(attraction => {
                // 取第一張圖片作為示例
                if (attraction.images && attraction.images.length > 0) {
                    const img = document.createElement('img');
                    img.src = attraction.images[0];
                    img.alt = attraction.name;
                    grid.appendChild(img);
                }
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});