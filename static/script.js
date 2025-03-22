document.addEventListener("DOMContentLoaded", () => {
    // --------------------- 變數與初始化 ---------------------
    const list = document.querySelector(".list");
    const leftArrow = document.querySelector(".arrow:first-of-type");
    const rightArrow = document.querySelector(".arrow:last-of-type");
    const searchInput = document.querySelector("#search-input");
    const searchButton = document.querySelector("#search-button");
    const gridContainer = document.querySelector(".row-grid");
    const mrtListContainer = document.querySelector(".list");

    const scrollAmount = 1;
    let nextPage = 0;
    let isLoading = false;
    let lastKnownScrollPosition = 0;
    let ticking = false;
    // --------------------- 點擊 "台北一日遊" 標題可以返回首頁 == 重新整理功能 ---------------------
    function homepage(className) {
        const button = document.querySelector(`.${className}`); // 選取 class 為 nav-title 的元素
        if (button) {
            button.addEventListener("click", () => {
                window.location.href = "/";
            });
        } else {
            console.error(`Element with class "${className}" not found.`);
        }
    }
    homepage("nav-title");
    

    // --------------------- 左右箭頭與拖曳功能 ---------------------
    function addContinuousScroll(button, direction) {
        let intervalId;
        button.addEventListener("mousedown", () => {
            // 立即滾動一次
            list.scrollLeft += direction === "left" ? -scrollAmount : scrollAmount;
            // 開始持續滾動
            intervalId = setInterval(() => {
                list.scrollLeft += direction === "left" ? -10 : 10;
            }, 10);
        });

        button.addEventListener("mouseup", () => clearInterval(intervalId));
        button.addEventListener("mouseleave", () => clearInterval(intervalId));
    }

    addContinuousScroll(leftArrow, "left");
    addContinuousScroll(rightArrow, "right");

    // --------------------- MRT清單與篩選功能 ---------------------
    function loadMRTStations() {
        fetchData('/api/mrts').then(data => {
            mrtListContainer.innerHTML = '';
            data.data.forEach(mrt => {
                const mrtElement = document.createElement('div');
                mrtElement.textContent = mrt;
                mrtElement.classList.add('mrt-item');
                mrtElement.addEventListener("click", () => {
                    searchInput.value = mrt;
                    searchAttractions(mrt, true);
                });
                mrtListContainer.appendChild(mrtElement);
            });
        }).catch(error => console.error('Error fetching MRT stations:', error));
    }

    // --------------------- 關鍵字搜尋功能 ---------------------
    searchButton.addEventListener("click", () => searchAttractions(searchInput.value.trim(), false));
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") searchButton.click();
    });

    function searchAttractions(keyword, isMRTSearch = false) {
        nextPage = 0;  
        gridContainer.innerHTML = '';  
        loadAttractions(keyword, isMRTSearch);
    }

    // --------------------- 加載景點數據 ---------------------
    function loadAttractions(keyword, isMRTSearch = false) {
        if (isLoading || nextPage === null) return;
        isLoading = true;

        fetchData(`/api/attractions?page=${nextPage}&keyword=${keyword}`).then(data => {
            if (!data.data || data.data.length === 0) {
                isLoading = false;
                return;
            }

            data.data.forEach(attraction => {
                if (isMRTSearch && attraction.mrt !== keyword) return;

                const card = createAttractionCard(attraction);
                gridContainer.appendChild(card);
            });

            nextPage = data.nextPage;
            isLoading = false;
        }).catch(error => {
            console.error("載入景點錯誤:", error);
            isLoading = false;
        });
    }

    function createAttractionCard(attraction) {
        const card = document.createElement("div");
        card.classList.add("grid-item");

        const imgContainer = document.createElement("div");
        imgContainer.classList.add("img-container");

        const img = document.createElement("img");
        img.src = attraction.images[0];
        img.alt = attraction.name;

        const title = document.createElement("h3");
        title.textContent = attraction.name;
        title.classList.add("title-overlay");

        const infoBar = document.createElement("div");
        infoBar.classList.add("info-bar");

        const category = document.createElement("span");
        category.textContent = attraction.category;
        category.classList.add("info-text");

        const mrt = document.createElement("span");
        mrt.textContent = attraction.mrt;
        mrt.classList.add("info-text");

        imgContainer.appendChild(img);
        imgContainer.appendChild(title);
        infoBar.appendChild(mrt);
        infoBar.appendChild(category);

        card.appendChild(imgContainer);
        card.appendChild(infoBar);

        return card;
    }

    // --------------------- 無限滾動 ---------------------
    function handleScroll() {
        lastKnownScrollPosition = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                const bottom = document.documentElement.scrollHeight - window.innerHeight;
                if (lastKnownScrollPosition >= bottom - 200 && nextPage !== null && !isLoading) {
                    loadAttractions(searchInput.value.trim(), false);
                }
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener("scroll", handleScroll);

    // --------------------- MRT 站滑動功能 ---------------------
    function scrollMRTList(direction) {
        const visibleWidth = list.clientWidth;
        list.scrollLeft += direction === "left" ? -visibleWidth * 0.5 : visibleWidth * 0.5;
    }

    leftArrow.addEventListener("click", () => scrollMRTList("left"));
    rightArrow.addEventListener("click", () => scrollMRTList("right"));

    // --------------------- 初始載入 ---------------------
    loadMRTStations();
    loadAttractions('');

    // 檢查頁面是否自動滾動到底部
    const bottom = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= bottom - 200 && nextPage !== null && !isLoading) {
        loadAttractions('');
    }

    // --------------------- 通用的 fetch 函數 ---------------------
    function fetchData(url) {
        return fetch(url)
            .then(response => response.json())
            .catch(error => {
                console.error('Request failed', error);
                throw error;
            });
    }
});
