document.addEventListener("DOMContentLoaded", () => {
    // --------------------- 變數與初始化 ---------------------
    const list = document.querySelector(".list");
    const leftArrow = document.querySelector(".arrow:first-of-type");
    const rightArrow = document.querySelector(".arrow:last-of-type");
    const searchInput = document.querySelector("#search-input");
    const searchButton = document.querySelector("#search-button");
    const gridContainer = document.querySelector(".row-grid");
    const mrtListContainer = document.querySelector(".list");

    let observer;
    let nextPage = 0;
    let isLoading = false;

    // --------------------- Pop-up 訊息顯示工具 ---------------------
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

    const reserveButton = document.querySelector(".nav-reserve");
    reserveButton.addEventListener("click", () => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            window.location.href = "/booking";
        } else {
            dialogSignin.style.display = "block";
            dialogSignup.style.display = "none";
            dialogOverlay.classList.add("active");
        }
    });

    function homepage(className) {
        const button = document.querySelector(`.${className}`);
        if (button) {
            button.addEventListener("click", () => {
                window.location.href = "/";
            });
        }
    }
    homepage("nav-title");

    async function getUserInfo(token) {
        try {
            await fetch('/api/user/auth', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
        } catch (error) {
            console.error('取得使用者資訊失敗：', error);
        }
    }

    const loginButton = document.querySelector(".nav-login");
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

    loginButton.addEventListener("click", () => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            localStorage.removeItem('jwtToken');
            updateLoginStatus();
            window.location.reload();
        } else {
            dialogSignin.style.display = "block";
            dialogSignup.style.display = "none";
            dialogOverlay.classList.add("active");
        }
    });

    function validateEmail(email) {
        const regex = /^[^@]+@[^@]+$/;
        return regex.test(email);
    }

    async function userSignup(name, email, password) {
        if (!name || !email || !password) {
            displayMessage(dialogSignup, 'error', "請填寫完整的註冊資訊");
            return;
        }
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
                displayMessage(dialogSignup, 'error', "註冊錯誤：" + data.message);
            } else {
                displayMessage(dialogSignup, 'success', "註冊成功！");
                setTimeout(() => {
                    dialogSignup.style.display = "none";
                    dialogSignin.style.display = "block";
                }, 1000);
            }
        } catch (error) {
            console.error('註冊失敗：', error);
        }
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
            if (response.status === 400) {
                if (data.detail === "User not found") {
                    displayMessage(dialogSignin, 'error', "該帳號尚未註冊");
                } else if (data.detail === "Invalid credentials") {
                    displayMessage(dialogSignin, 'error', "請輸入正確的電子信箱或密碼");
                } else {
                    displayMessage(dialogSignin, 'error', "登入失敗，請稍後再試");
                }
            } else {
                localStorage.setItem('jwtToken', data.token);
                updateLoginStatus();
                window.location.href = "/";
            }
        } catch (error) {
            console.error('登入失敗：', error);
        }
    }

    const dialogOverlay = document.getElementById("dialog-overlay");
    const dialogCloseBtns = document.querySelectorAll(".dialog-close-btn");
    const dialogSignin = document.getElementById("dialog-signin");
    const dialogSignup = document.getElementById("dialog-signup");
    const toSignupBtn = document.getElementById("to-signup");
    const toSigninBtn = document.getElementById("to-signin");
    const signinInputs = dialogSignin.querySelectorAll(".input-group input");
    const signinBtn = dialogSignin.querySelector(".dialog-btn");
    const signupInputs = dialogSignup.querySelectorAll(".input-group input");
    const signupBtn = dialogSignup.querySelector(".dialog-btn");

    dialogCloseBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            dialogOverlay.classList.remove("active");
        });
    });

    toSignupBtn.addEventListener("click", () => {
        dialogSignin.style.display = "none";
        dialogSignup.style.display = "block";
    });

    toSigninBtn.addEventListener("click", () => {
        dialogSignin.style.display = "block";
        dialogSignup.style.display = "none";
    });

    if (signinBtn) {
        signinBtn.addEventListener("click", () => {
            const email = signinInputs[0].value.trim();
            const password = signinInputs[1].value.trim();
            userSignin(email, password);
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener("click", () => {
            const name = signupInputs[0].value.trim();
            const email = signupInputs[1].value.trim();
            const password = signupInputs[2].value.trim();
            userSignup(name, email, password);
        });
    }


    
        function addContinuousScroll(button, direction) {
            let isScrolling = false;
        
            // 根據螢幕大小設定滾動步長
            const screenWidth = window.innerWidth;
            const scrollStep = Math.max(5, Math.floor(screenWidth / 5)); 
        
            function scroll() {
                // 每一幀滾動的步長
                list.scrollLeft += direction === "left" ? -scrollStep : scrollStep;
        
                // 只要還在滾動就繼續呼叫 requestAnimationFrame
                if (isScrolling) {
                    requestAnimationFrame(scroll);
                }
            }
        
            button.addEventListener("mousedown", (e) => {
                if (!isScrolling) {
                    isScrolling = true;
                    // 開始滾動
                    requestAnimationFrame(scroll);
                }
            });
        
            button.addEventListener("mouseup", () => {
                isScrolling = false;
            });
        
            button.addEventListener("mouseleave", () => {
                isScrolling = false;
            });
        
            button.addEventListener("touchstart", (e) => {
                if (!isScrolling) {
                    isScrolling = true;
                    // 開始滾動
                    requestAnimationFrame(scroll);
                }
            });
        
            button.addEventListener("touchend", () => {
                isScrolling = false;
            });
        
            button.addEventListener("touchcancel", () => {
                isScrolling = false;
            });
        }
        
    
    addContinuousScroll(leftArrow, "left");
    addContinuousScroll(rightArrow, "right");

    function fetchData(url) {
        return fetch(url).then(res => res.json());
    }

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
        });
    }

    searchButton.addEventListener("click", () => searchAttractions(searchInput.value.trim(), false));
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") searchButton.click();
    });

    function searchAttractions(keyword, isMRTSearch = false) {
        nextPage = 0;
        gridContainer.innerHTML = '';
        loadAttractions(keyword, isMRTSearch);
    }

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
            observeLastImage(keyword, isMRTSearch);
        }).catch(error => {
            console.error("載入景點錯誤:", error);
            isLoading = false;
        });
    }

    function createAttractionCard(attraction) {
        const card = document.createElement("a");
        card.href = `/attraction/${attraction.id}`;
        card.classList.add("grid-item", "card-link");

        const imgContainer = document.createElement("div");
        imgContainer.classList.add("img-container");

        const img = document.createElement("img");
        img.src = attraction.images[0];
        img.alt = attraction.name;
        imgContainer.appendChild(img);

        const title = document.createElement("h3");
        title.textContent = attraction.name;
        title.classList.add("title-overlay");
        imgContainer.appendChild(title);

        const infoBar = document.createElement("div");
        infoBar.classList.add("info-bar");

        const mrt = document.createElement("span");
        mrt.textContent = attraction.mrt;
        mrt.classList.add("info-text");

        const category = document.createElement("span");
        category.textContent = attraction.category;
        category.classList.add("info-text");

        infoBar.appendChild(mrt);
        infoBar.appendChild(category);

        card.appendChild(imgContainer);
        card.appendChild(infoBar);

        return card;
    }

    function observeLastImage(keyword, isMRTSearch) {
        const cards = document.querySelectorAll(".grid-item img");
        const lastImage = cards[cards.length - 1];
        if (observer) observer.disconnect();

        if (lastImage) {
            observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && nextPage !== null && !isLoading) {
                        loadAttractions(keyword, isMRTSearch);
                    }
                });
            }, {
                root: null,
                rootMargin: "0px",
                threshold: 0.1
            });

            observer.observe(lastImage);
        }
    }

    // 初始載入
    loadMRTStations();
    loadAttractions('', false);
});
