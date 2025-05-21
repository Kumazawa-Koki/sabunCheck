let images = []; //　画像情報を格納する配列
let zoomLevel = 100; //　ズームスライダーで調整する拡大率

// HTMLのオブジェクトの取得
// グローバル変数による取得のため、色々な関数内で使用可能
const dropArea = document.getElementById("drop-area");
const layerMenu = document.getElementById("layer-menu");
const zoomSlider = document.getElementById('zoom-slider');
const zoomValue = document.getElementById('zoom-value');
const resetButton = document.querySelector('.reset');
const dragToggleButton = document.getElementById('toggle-drag');
const selectAllButton = document.getElementById('select-all-button');
const diffCheckButton = document.getElementById('diffrent-check-button');
const dragCheckText = document.getElementById('dragCheck');
const helpMarker = document.querySelector('.help');

const canvasContainer = document.getElementById("canvas-container");
const canvasZoomSlider = document.getElementById("canvasZoomSlider");
const canvasZoomValue = document.getElementById("canvasZoomValue");

// ドラッグ機能の切り替え（ドラッグ切替ボタン）
let isDragEnabled = true;
dragToggleButton.addEventListener('click', () => {
    isDragEnabled = !isDragEnabled;
    toggleImageDrag();
    toggleLayerDrag();
    dragToggleButton.style.backgroundColor = isDragEnabled ? "#B2D3A5" : "#8BB174";
    dragCheckText.textContent = isDragEnabled ? "ドラッグ機能ON" : "ドラッグ機能OFF";
    dragCheckText.style.backgroundColor = isDragEnabled ? "#B2D3A5" : "#8BB174";
});

// 画像がドラッグできるかの切替
function toggleImageDrag() {
    const imgEls = dropArea.querySelectorAll('img');
    imgEls.forEach(img => {
        img.setAttribute('draggable', isDragEnabled ? 'true' : 'false');
    });
}

// レイヤーメニューのドラッグ切り替え
function toggleLayerDrag() {
    const layerEls = layerMenu.querySelectorAll('.layer-item');

    layerEls.forEach(layerEl => {
        const id = layerEl.getAttribute("data-id");
        const img = images.find(img => img.id === id);
        if (!img) return;

        layerEl.setAttribute('draggable', isDragEnabled ? 'true' : 'false');

        // レイヤーメニューがドラッグ可能か不可能かでUIの色を変更している
        if (img.locked) {
            layerEl.style.backgroundColor = img.visible ? "#e35b5b" : "#c7a3a3";
        } else {
            const isSelected = layerEl.getAttribute("data-selected") === "true";
            layerEl.style.backgroundColor = isDragEnabled
                ? (isSelected ? "#B2D3A5" : "#ccc")
                : (isSelected ? "#8BB174" : "#999");
        }
    });
}

// ズームスライダーのイベント
// スライダーの入力が変化した時にzoomLevelを更新
zoomSlider.addEventListener('input', (e) => {
    zoomLevel = parseInt(e.target.value);
    zoomValue.textContent = `${zoomLevel}%`;
    updateZoom();
});

// ズーム処理本体
function updateZoom() {
    const scrollLeft = dropArea.scrollLeft;
    const scrollTop = dropArea.scrollTop;
    const imgEls = document.querySelectorAll('#drop-area img');
    const dropAreaRect = dropArea.getBoundingClientRect(); // dropAreaの大きさを取得

    let needsScrollX = false;
    let needsScrollY = false;

    imgEls.forEach(img => {
        img.style.transform = `scale(${zoomLevel / 100})`; // ズームレベルに基づいて画像を拡大
        img.style.transformOrigin = 'top left'; // 拡大基準を左上に設定

        const imgRect = img.getBoundingClientRect();

        // 画像がdropAreaの幅を超えていたらスクロールXが必要
        if (imgRect.width > dropAreaRect.width) {
            needsScrollX = true;
        }

        // 画像がdropAreaの高さを超えていたらスクロールYが必要
        if (imgRect.height > dropAreaRect.height) {
            needsScrollY = true;
        }
    });

    // dropAreaのスクロール設定
    dropArea.style.overflowX = needsScrollX ? "auto" : "hidden";
    dropArea.style.overflowY = needsScrollY ? "auto" : "hidden";

    requestAnimationFrame(() => {
        dropArea.scrollLeft = scrollLeft;
        dropArea.scrollTop = scrollTop;
    });
}

// 画像のドロップ処理
dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.style.background = "#eee";
});

dropArea.addEventListener("dragleave", () => {
    dropArea.style.background = "#cdd";
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.style.background = "#cdd";

    const files = [...e.dataTransfer.files];
    let hasDuplicate = false;

    files.forEach(file => {
        const fileType = file.type.split('/')[1]; // ドロップ時に画像ファイルを読み込みBase64に変換して配列に保存
        if (!['png', 'svg+xml', 'webp', 'jpeg'].includes(fileType)) {
            alert("対応していない形式のファイルです。png、svg、webp、jpg形式の画像のみがサポートされています。");
            return;
        }

        // 読み込んだ画像情報
        const imgId = file.name.replace(/\.[^/.]+$/, "");

        // すでに同じ名前が存在するかチェック
        const isDuplicate = images.some(img => img.id === imgId);
        if (isDuplicate) {
            hasDuplicate = true;
            return;
        }

        const imgURL = URL.createObjectURL(file);
        images.push({
            id: imgId,
            url: imgURL,
            visible: true,
            locked: false,
            isAltColor: false,
            altColor: "#ddd"
        });
    });

    // 一つでも重複があればアラートを出して、何も表示しない
    if (hasDuplicate) {
        alert("同じ名前の画像がすでに表示されています。別の名前に変更してください。");
        return;
    }

    // ドロップ時にドラッグ機能を無効にする
    isDragEnabled = true;
    toggleImageDrag();
    toggleLayerDrag();
    dragToggleButton.style.backgroundColor = "#B2D3A5";
    dragCheckText.textContent = "ドラッグ機能ON";
    dragCheckText.style.backgroundColor = "#B2D3A5";

    // 画像を表示
    renderImages();
    renderLayers();
});

let selectedImage = null;

// 初期状態ではボタン等のUI入力は受け付けない
function updateButtonState() {
    const hasImages = document.querySelectorAll('#drop-area img').length > 0;
    const hasLayers = document.querySelectorAll('.layer-item').length > 0;
    const isActive = hasImages || hasLayers;

    zoomSlider.disabled = !isActive;
    resetButton.disabled = !isActive;
    dragToggleButton.disabled = !isActive;
    selectAllButton.disabled = !isActive;
    diffCheckButton.disabled = !isActive;
}

// 画像表示（描画）関数
function renderImages() {
    const scrollLeft = dropArea.scrollLeft;
    const scrollTop = dropArea.scrollTop;

    dropArea.innerHTML = ""; // ドロップエリアを空にして全画像を一から描画し直す
    dropArea.style.position = "relative";

    images.forEach(img => {
        const imgEl = document.createElement("img");
        imgEl.src = img.url;
        imgEl.dataset.id = img.id;
        imgEl.style.maxWidth = "95%";
        imgEl.style.maxHeight = "95%";
        imgEl.style.objectFit = "contain";
        imgEl.style.position = "absolute";
        imgEl.style.top = "0";
        imgEl.style.left = "0";
        imgEl.style.right = "0";
        imgEl.style.bottom = "0";
        imgEl.style.margin = "auto";

        // 表示・非表示の切り替え
        imgEl.style.display = img.visible ? "block" : "none";
        imgEl.setAttribute("draggable", "false");

        dropArea.appendChild(imgEl);
    });
    // ズームの状態を反映
    updateButtonState();
    updateZoom();

    requestAnimationFrame(() => {
        dropArea.scrollLeft = scrollLeft;
        dropArea.scrollTop = scrollTop;
    });
}

// ページのDOM（Document Object Model）が完全に読み込まれた時に実行されるコード
document.addEventListener("DOMContentLoaded", () => {

    const modal = document.querySelector('.modal');
    const closeBtn = document.querySelector('.close');

    // ページロード時にモーダルを表示
    modal.style.display = 'block';

    // ×ボタンをクリックでモーダルを非表示
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    const resetPopup = document.querySelector('.resettip');
    const dragTogglePopup = document.querySelector('.dragtip');
    const selectAllPopup = document.querySelector('.allSelecttip');
    const diffCheckPopup = document.querySelector('.diffChecktip')

    resetButton.addEventListener('mouseover', () => {
        resetPopup.style.display = 'block';
    });

    resetButton.addEventListener('mouseleave', () => {
        resetPopup.style.display = 'none';
    });

    dragToggleButton.addEventListener('mouseover', () => {
        dragTogglePopup.style.display = 'block';
    });

    dragToggleButton.addEventListener('mouseleave', () => {
        dragTogglePopup.style.display = 'none';
    });

    selectAllButton.addEventListener('mouseover', () => {
        selectAllPopup.style.display = 'block';
    });

    selectAllButton.addEventListener('mouseleave', () => {
        selectAllPopup.style.display = 'none';
    });

    diffCheckButton.addEventListener('mouseover', () => {
        diffCheckPopup.style.display = 'block';
    });

    diffCheckButton.addEventListener('mouseleave', () => {
        diffCheckPopup.style.display = 'none';
    });

    const helpButton = document.querySelector('.help');
    const helpModal = document.querySelector('.help-modal');
    const helpCloseBtn = document.querySelector('.help-close-btn');

    helpButton.addEventListener('click', () => {
        if (modal.style.display !== 'none') return;

        helpModal.classList.remove('hidden');
        helpButton.classList.add('disabled');
    });

    helpCloseBtn.addEventListener('click', () => {
        helpModal.classList.add('hidden');
        helpButton.classList.remove('disabled');
    });

    helpModal.addEventListener('click', (e) => {
        if (e.target.id === 'help-modal') {
            helpModal.classList.add('hidden');
            helpButton.classList.remove('disabled');
        }
    });
});

// ショートカット類
function resetZoom() {
    zoomLevel = 100;
    zoomSlider.value = zoomLevel;
    zoomValue.textContent = `${zoomLevel}%`;
    updateZoom();
}

function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 50, 1000); // 最大1000%まで、50ずつ増える
    zoomSlider.value = zoomLevel;
    zoomValue.textContent = `${zoomLevel}%`;
    updateZoom();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 50, 50); // 最小50%まで、50ずつ減る
    zoomSlider.value = zoomLevel;
    zoomValue.textContent = `${zoomLevel}%`;
    updateZoom();
}

function setupZoomShortcuts() {
    document.addEventListener('keydown', (e) => {
        const pileUp = document.getElementById('pileUp');
        const isVisible = pileUp && window.getComputedStyle(pileUp).display !== 'none';
        if (!isVisible) return;

        if (e.ctrlKey || e.metaKey) {
            const key = e.key;

            if (key === '0') {
                e.preventDefault();
                resetZoom();
            } else if (key === 'ArrowRight' || key === 'ArrowUp') {
                e.preventDefault();
                zoomIn();
            } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
                e.preventDefault();
                zoomOut();
            }
        }
    });
}
setupZoomShortcuts();

//レイヤーメニュー表示（描画）関数
function renderLayers() {
    layerMenu.innerHTML = "";// 画像ごとに「レイヤーアイテム」を生成

    images.forEach((img, index) => {
        // ボタンの生成（緑と灰色を切り替え）
        const layerEl = document.createElement("div");
        layerEl.classList.add("layer-item");
        layerEl.setAttribute("data-id", img.id);
        layerEl.setAttribute("data-selected", img.visible ? "true" : "false"); // その画像が表示されているか
        layerEl.style.position = "relative";

        // ロック状態によって背景色を決定
        if (img.locked) {
            layerEl.setAttribute("data-locked", true);

            if (img.visible) {
                layerEl.style.backgroundColor = "#e35b5b";  // 赤
            } else {
                layerEl.style.backgroundColor = "#c7a3a3";
            }
            // layerEl.style.mixBlendMode = "multiply";
        } else {
            // ロックされていなければ、表示状態に応じて緑や灰色に
            if (img.visible) {
                layerEl.style.backgroundColor = isDragEnabled ? "#B2D3A5" : "#8BB174"; // 緑系
            } else {
                layerEl.style.backgroundColor = isDragEnabled ? "#ccc" : "#999"; // 灰色系
            }
        }

        const label = document.createElement("span");
        label.textContent = img.id; // レイヤーの表示名として画像IDを表示
        layerEl.appendChild(label);

        layerEl.addEventListener("click", (e) => {
            const savedScrollLeft = dropArea.scrollLeft;
            const savedScrollTop = dropArea.scrollTop;

            const targetId = layerEl.getAttribute("data-id");
            const targetImg = images.find(img => img.id === targetId);

            if (e.altKey) {
                if (targetImg.locked) {
                    targetImg.locked = false;
                    layerEl.removeAttribute("data-locked");
                    const isSelected = layerEl.getAttribute("data-selected") === "true";
                    layerEl.style.backgroundColor = isSelected
                        ? (isDragEnabled ? "#B2D3A5" : "#8BB174")
                        : (isDragEnabled ? "#ccc" : "#999");
                    showTempMessage("画像のロックを解除しました");
                } else {
                    targetImg.locked = true;
                    layerEl.setAttribute("data-locked", true);

                    if (targetImg.visible) {
                        layerEl.style.backgroundColor = "#e35b5b";
                    } else {
                        layerEl.style.backgroundColor = "#c7a3a3";
                    }
                    showTempMessage("画像をロックしました");
                }
                return;
            }
            if (targetImg.locked) {
                return;
            }

            const isSelected = layerEl.getAttribute("data-selected") === "true";
            const newSelected = !isSelected;
            layerEl.setAttribute("data-selected", newSelected ? "true" : "false");

            if (newSelected) {
                layerEl.style.backgroundColor = isDragEnabled ? "#B2D3A5" : "#8BB174";
            } else {
                layerEl.style.backgroundColor = isDragEnabled ? "#ccc" : "#999";
            }

            if (targetImg) {
                targetImg.visible = newSelected;
            }
            renderImages();

            dropArea.scrollLeft = savedScrollLeft;
            dropArea.scrollTop = savedScrollTop;
        });

        let originalColor = "";
        layerEl.draggable = true;

        // ドラッグ開始
        layerEl.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index.toString());
            e.dataTransfer.effectAllowed = "move";
            layerEl.classList.add("dragging");
            originalColor = layerEl.style.backgroundColor;
            layerEl.style.transform = "scale(1.05)";
            layerEl.style.backgroundColor = "#e0a49b";
        });

        layerEl.addEventListener("dragover", (e) => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");
            if (dragging && dragging !== layerEl) {
                layerMenu.insertBefore(dragging, layerEl);
            }
        });

        // ドラッグ終了
        layerEl.addEventListener("dragend", () => {
            const savedScrollLeft = dropArea.scrollLeft;
            const savedScrollTop = dropArea.scrollTop;

            layerEl.classList.remove("dragging");
            layerEl.style.transform = "scale(1)";
            layerEl.style.backgroundColor = originalColor;

            updateImageOrder(); // 画像の順番を更新する関数
            renderImages();

            requestAnimationFrame(() => {
                dropArea.scrollLeft = savedScrollLeft;
                dropArea.scrollTop = savedScrollTop;
            });
        });
        const lockLabel = document.createElement("div");
        lockLabel.textContent = "画像の表示ロック中";
        lockLabel.style.position = "absolute";
        lockLabel.style.top = "50%";
        lockLabel.style.right = "5%";
        lockLabel.style.transform = "translate(-5%, -50%)";
        lockLabel.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
        lockLabel.style.color = "#333";
        lockLabel.style.padding = "4px 8px";
        lockLabel.style.borderRadius = "4px";
        lockLabel.style.fontSize = "18px";
        lockLabel.style.pointerEvents = "none";
        lockLabel.style.display = "none";
        layerEl.appendChild(lockLabel);

        layerEl.addEventListener("mouseenter", () => {
            if (img.locked) {
                lockLabel.textContent = img.visible ? "表示中 🔒" : "非表示 🔒";
                lockLabel.style.display = "block";
            }
        });

        layerEl.addEventListener("mouseleave", () => {
            lockLabel.style.display = "none";
        });

        layerMenu.appendChild(layerEl);
    });
    updateButtonState();
}

function showTempMessage(message, duration = 1000) {
    dragCheckText.textContent = message;
    dragCheckText.style.backgroundColor = "#e35b5b";
    dragCheckText.style.color = "#fff";
    dragCheckText.style.opacity = 1;

    clearTimeout(dragCheckText._timeout);
    dragCheckText._timeout = setTimeout(() => {
        dragCheckText.textContent = isDragEnabled ? "ドラッグ機能ON" : "ドラッグ機能OFF";
        dragCheckText.style.backgroundColor = isDragEnabled ? "#B2D3A5" : "#8bb174";
        dragCheckText.style.color = "#000";
    }, duration);
}

// すべて表示ボタン
selectAllButton.addEventListener('click', () => {
    const layerEls = layerMenu.querySelectorAll(".layer-item");

    const allSelectable = [...layerEls].filter((_, i) => !images[i].locked);
    const allSelected = allSelectable.every(el => el.getAttribute("data-selected") === "true");

    const zoom = dropArea.style.transform;
    const savedScrollLeft = dropArea.scrollLeft;
    const savedScrollTop = dropArea.scrollTop;

    layerEls.forEach((layerEl, index) => {
        const img = images[index];
        const newState = !allSelected;

        if (img.locked) {
            return;
        }

        layerEl.setAttribute("data-selected", newState ? "true" : "false");
        layerEl.style.backgroundColor = newState ? (isDragEnabled ? "#B2D3A5" : "#8BB174") : (isDragEnabled ? "#ccc" : "#999");
        img.visible = newState;
    });
    renderImages();
    requestAnimationFrame(() => {
        dropArea.style.transform = zoom;
        dropArea.scrollLeft = savedScrollLeft;
        dropArea.scrollTop = savedScrollTop;
    });
    toggleImageDrag();
    toggleLayerDrag();
});

diffCheckButton.addEventListener('click', () => {
    const visibleImages = images.filter(img => img.visible);

    if (visibleImages.length !== 2) {
        alert("このボタンは２枚の画像の差分を確認するボタンです。画像を２枚だけ表示してください。");
        return;
    }

    document.getElementById("canvasHelpOverlay").style.display = "none";

    currentMode = "2-up";

    document.querySelectorAll('input[name="modeChange"]').forEach(radio => {
        const labelText = radio.parentElement.textContent.trim();
        radio.checked = labelText === "2-up";
    });

    const pileUp = document.getElementById("pileUp");
    const pileUpVisible = window.getComputedStyle(pileUp).display !== "none";
    const canvasVisible = window.getComputedStyle(canvasContainer).display !== "none";

    pileUp.style.display = pileUpVisible ? "none" : "flex";
    canvasContainer.style.display = canvasVisible ? "none" : "block";

    const opacitySlider = document.getElementById("opacitySlider");
    const swipeSlider = document.getElementById("swipeSlider");
    opacitySlider.value = 100;
    onionSkinOpacity = 1;
    swipeSlider.value = 100;

    switchMode(currentMode);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            pileUp.style.display = "flex";
            canvasContainer.style.display = "none";
        }
    });
});

function drawImageToCanvas(div, imageUrl) {
    div.innerHTML = "";
    const img = new Image();

    img.onload = () => {
        const displayWidth = div.clientWidth;
        const displayHeight = div.clientHeight;

        const initialScale = Math.min(
            displayWidth / img.width,
            displayHeight / img.height,
            1
        );

        const drawWidth = img.width * initialScale;
        const drawHeight = img.height * initialScale;

        img.style.objectFit = "contain";
        img.style.position = "absolute";
        img.style.top = "0";
        img.style.left = "0";
        img.style.right = "0";
        img.style.bottom = "0";
        img.style.margin = "auto";

        div.appendChild(img);

        baseImageSizes.set(img, {
            width: drawWidth,
            height: drawHeight,
            container: div
        });

        updateCanvasZoom();
    };
    img.src = imageUrl;
}

function showTwoUp() {
    canvasZoomLevel = 0;
    const visibleImages = images.filter(img => img.visible);
    if (visibleImages.length !== 2) return;

    const div1 = document.getElementById("ccc1");
    const div2 = document.getElementById("ccc2");

    // div内に画像を描画
    drawImageToCanvas(div1, visibleImages[0].url);
    drawImageToCanvas(div2, visibleImages[1].url);
}

function showSwipe() {
    const visibleImages = images.filter(img => img.visible);
    if (visibleImages.length !== 2) return;

    const div = document.getElementById("swipeCanvas");
    div.innerHTML = "";
    baseImageSizes.clear();

    const imgA = new Image();
    const imgB = new Image();

    imgA.src = visibleImages[0].url;
    imgB.src = visibleImages[1].url;

    imgA.onload = () => {
        imgB.onload = () => {
            drawSwipeImages(div, imgA, imgB, swipeSlider.value);
        };
    };

    swipeSlider.style.display = "block";
    swipeSlider.oninput = () => {
        drawSwipeImages(div, imgA, imgB, swipeSlider.value);
    };
}

// スライダー位置に応じて画像を描画
function drawSwipeImages(div, imgA, imgB, sliderValue) {
    const scale = Math.min(
        div.clientWidth / imgA.width,
        div.clientHeight / imgA.height,
        1
    );

    const drawWidth = imgA.width * scale;
    const drawHeight = imgA.height * scale;
    const offsetX = (div.clientWidth - drawWidth) / 2;
    const offsetY = (div.clientHeight - drawHeight) / 2;

    // 画像Aのスタイル
    imgA.style.position = 'absolute';
    imgA.style.left = `${offsetX}px`;
    imgA.style.top = `${offsetY}px`;
    imgA.style.width = `${drawWidth}px`;
    imgA.style.height = `${drawHeight}px`;
    imgA.style.zIndex = 1;

    // 画像Bのスタイル
    imgB.style.position = 'absolute';
    imgB.style.left = `${offsetX}px`;
    imgB.style.top = `${offsetY}px`;
    imgB.style.width = `${drawWidth}px`;
    imgB.style.height = `${drawHeight}px`;
    imgB.style.zIndex = 2;

    // clip-path を使って画像Bを右から左にスライド表示
    const percentage = sliderValue; // スライダーの値
    imgB.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`; // 上 右 下 左（％）

    // 初回のみ追加（同じ画像を何度も追加しない）
    if (!div.contains(imgA)) div.appendChild(imgA);
    if (!div.contains(imgB)) div.appendChild(imgB);

    // 拡大スケールを反映させた画像サイズの保存
    baseImageSizes.set(imgA, { width: drawWidth, height: drawHeight, container: div });
    baseImageSizes.set(imgB, { width: drawWidth, height: drawHeight, container: div });
}

// onionSkinモードで画像を重ねて表示する関数
function showOnionSkin() {
    const visibleImages = images.filter(img => img.visible);
    if (visibleImages.length !== 2) return;

    const div = document.getElementById("onionSkinCanvas");
    div.innerHTML = "";
    baseImageSizes.clear();

    const sliderContainer = document.getElementById("opacitySliderContainer");
    sliderContainer.style.display = "block";  // スライダー表示

    const imgA = new Image();
    const imgB = new Image();

    imgA.src = visibleImages[0].url;
    imgB.src = visibleImages[1].url;

    imgA.onload = () => {
        imgB.onload = () => {
            if (!div.contains(imgA)) {
                drawOnionSkinImages(div, imgA, imgB);
            }
        };
    };
}

// Onion Skin表示用の描画関数
function drawOnionSkinImages(div, imgA, imgB) {
    const scale = Math.min(
        div.clientWidth / imgA.width,
        div.clientHeight / imgA.height,
        1
    );

    const drawWidth = imgA.width * scale;
    const drawHeight = imgA.height * scale;
    const offsetX = (div.clientWidth - drawWidth) / 2;
    const offsetY = (div.clientHeight - drawHeight) / 2;

    // 画像Aのスタイル
    imgA.style.position = 'absolute';
    imgA.style.left = `${offsetX}px`;
    imgA.style.top = `${offsetY}px`;
    imgA.style.width = `${drawWidth}px`;
    imgA.style.height = `${drawHeight}px`;
    imgA.style.zIndex = 1;

    // 画像Bのスタイル
    imgB.style.position = 'absolute';
    imgB.style.left = `${offsetX}px`;
    imgB.style.top = `${offsetY}px`;
    imgB.style.width = `${drawWidth}px`;
    imgB.style.height = `${drawHeight}px`;
    imgB.style.zIndex = 2;

    // 画像AとBがすでにdivに存在するか確認し、存在しなければ追加
    if (!div.contains(imgA)) div.appendChild(imgA);
    if (!div.contains(imgB)) div.appendChild(imgB);

    imgB.style.opacity = onionSkinOpacity;

    baseImageSizes.set(imgA, { width: drawWidth, height: drawHeight, container: div });
    baseImageSizes.set(imgB, { width: drawWidth, height: drawHeight, container: div });
}

// スライダーで不透明度を変更
document.getElementById("opacitySlider").addEventListener("input", (e) => {
    onionSkinOpacity = e.target.value / 100;

    // 再描画のみ（画像読み込みなし）
    const div = document.getElementById("onionSkinCanvas");
    const imgA = div.querySelector('img:nth-child(1)');
    const imgB = div.querySelector('img:nth-child(2)');

    if (imgA && imgB) {
        imgB.style.opacity = onionSkinOpacity;
    }
});

// Zoom機能
const baseImageSizes = new Map();
let canvasZoomLevel = 100;

canvasZoomSlider.addEventListener('input', (e) => {
    canvasZoomLevel = parseInt(e.target.value);
    canvasZoomValue.textContent = `${canvasZoomLevel}%`;
    updateCanvasZoom();
});

function CanvasResetZoom() {
    canvasZoomLevel = 0;
    canvasZoomSlider.value = canvasZoomLevel;
    canvasZoomValue.textContent = `${canvasZoomLevel}%`;
    updateCanvasZoom();
}

function CanvasZoomIn() {
    if (canvasZoomLevel < 200) {
        canvasZoomLevel += 10;
        canvasZoomSlider.value = canvasZoomLevel;
        canvasZoomValue.textContent = `${canvasZoomLevel}%`;
        updateCanvasZoom();
    }
}

function CanvasZoomOut() {
    if (canvasZoomLevel > 0) {
        canvasZoomLevel -= 10;
        canvasZoomSlider.value = canvasZoomLevel;
        canvasZoomValue.textContent = `${canvasZoomLevel}%`;
        updateCanvasZoom();
    }
}

function updateCanvasZoom() {
    const scale = 1 + canvasZoomLevel / 100;

    baseImageSizes.forEach((baseSize, img) => {
        img.style.transform = `scale(${scale})`;
        img.style.transformOrigin = "top left";

        // 画像の幅・高さを変更
        img.style.width = `${baseSize.width}px`;
        img.style.height = `${baseSize.height}px`;

        img.style.position = 'absolute';
    });
}

function setupCanvasZoomShortcuts() {
    document.addEventListener('keydown', (e) => {
        const canvasContainer = document.getElementById('canvas-container');
        const isVisible = canvasContainer && window.getComputedStyle(canvasContainer).display !== 'none';
        if (!isVisible) return;

        if (e.ctrlKey || e.metaKey) {
            const key = e.key;

            if (key === '0') {
                e.preventDefault();
                CanvasResetZoom();
            } else if (key === 'ArrowRight' || key === 'ArrowUp') {
                e.preventDefault();
                CanvasZoomIn();
            } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
                e.preventDefault();
                CanvasZoomOut();
            }
        }
    });
}

setupCanvasZoomShortcuts();

function updateVisibleCanvasOverflow() {
    const canvasWrappers = [
        document.getElementById('ccc1'),
        document.getElementById('ccc2'),
        document.getElementById('swipeCanvas'),
        document.getElementById('onionSkinCanvas'),
        document.getElementById('sabunCanvas'),
    ];

    canvasWrappers.forEach(wrapper => {
        if (window.getComputedStyle(wrapper).display !== 'none') {
            wrapper.style.overflow = 'auto';
        } else {
            wrapper.style.overflow = 'scroll';
        }
    });
}

const expTogetherToggle = document.getElementById('expTogetherToggle');

expTogetherToggle.addEventListener('change', () => {
    if (expTogetherToggle.checked) {
        const ccc1 = document.getElementById('ccc1');
        const ccc2 = document.getElementById('ccc2');

        // スクロール位置を統一
        const scrollLeft = Math.max(ccc1.scrollLeft, ccc2.scrollLeft);
        const scrollTop = Math.max(ccc1.scrollTop, ccc2.scrollTop);

        ccc1.scrollLeft = scrollLeft;
        ccc2.scrollLeft = scrollLeft;
        ccc1.scrollTop = scrollTop;
        ccc2.scrollTop = scrollTop;
    }
});

function syncScroll(from, to) {
    to.scrollLeft = from.scrollLeft;
    to.scrollTop = from.scrollTop;
}

function setupScrollSync() {
    const ccc1 = document.getElementById('ccc1');
    const ccc2 = document.getElementById('ccc2');

    ccc1.addEventListener('scroll', () => {
        if (expTogetherToggle.checked) syncScroll(ccc1, ccc2);
    });

    ccc2.addEventListener('scroll', () => {
        if (expTogetherToggle.checked) syncScroll(ccc2, ccc1);
    });
}

setupScrollSync();

const modeRadios = document.querySelectorAll('input[name="modeChange"]');
let currentMode = "2-up";

modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) {
            currentMode = radio.parentElement.textContent.trim();
            switchMode(currentMode);
        }
    });
});

function switchMode(mode) {
    const canvasArea = document.getElementById("canvas-area");
    const twoUpContainer = document.getElementById("canvasTwoUp");
    const swipeContainer = document.getElementById("canvasSwipe");

    const swipeCanvas = document.getElementById("swipeCanvas");
    const onionSkinCanvas = document.getElementById("onionSkinCanvas");

    const sliderContainer = document.getElementById("swipeSliderContainer");
    const opacitySliderContainer = document.getElementById("opacitySliderContainer");

    const canvasZoomSlider = document.getElementById("canvasZoomSlider");
    const expTogetherContainer = document.getElementById("expTogetherContainer");

    // 一旦すべて非表示
    twoUpContainer.style.display = "none";
    swipeContainer.style.display = "none";
    sliderContainer.style.display = "none";
    swipeCanvas.style.display = "none";
    onionSkinCanvas.style.display = "none";
    opacitySliderContainer.style.display = "none";
    expTogetherContainer.style.display = "none";

    if (canvasZoomSlider) {
        canvasZoomSlider.value = 0;
        canvasZoomValue.textContent = '0%';
    }

    if (mode === "2-up") {
        canvasArea.style.display = "flex";
        twoUpContainer.style.display = "flex";
        document.getElementById("ccc1").style.display = "block";
        document.getElementById("ccc2").style.display = "block";
        expTogetherContainer.style.display = "flex";
        requestAnimationFrame(() => {
            showTwoUp();
        });
    } else if (mode === "swipe") {
        canvasArea.style.display = "flex";
        swipeContainer.style.display = "block";
        swipeCanvas.style.display = "block";
        sliderContainer.style.display = "block";
        showSwipe();
    } else if (mode === "onionSkin") {
        canvasArea.style.display = "flex";
        onionSkinCanvas.style.display = "block";
        opacitySliderContainer.style.display = "block";
        showOnionSkin();
    }
    updateVisibleCanvasOverflow();
}

const canvasHelpButton = document.getElementById('canvasHelpButton');
const canvasHelpOverlay = document.getElementById('canvasHelpOverlay');
const closeCanvasHelp = document.getElementById('closeCanvasHelp');

canvasHelpButton.addEventListener('click', () => {
    canvasHelpOverlay.style.display = 'flex';
});

closeCanvasHelp.addEventListener('click', () => {
    canvasHelpOverlay.style.display = 'none';
});

canvasHelpOverlay.addEventListener('click', (e) => {
    if (e.target === canvasHelpOverlay) {
        canvasHelpOverlay.style.display = 'none';
    }
});

const backPileUp = document.getElementById("backPileUpButton");
backPileUp.addEventListener('click', () => {
    const pileUp = document.getElementById("pileUp");

    pileUp.style.display = "flex";
    canvasContainer.style.display = "none";
});

layerMenu.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");

    if (!dragging || !(dragging instanceof Node)) return;

    const afterElement = getDragAfterElement(layerMenu, e.clientY);
    if (afterElement == null) {
        layerMenu.appendChild(dragging);
    } else {
        layerMenu.insertBefore(dragging, afterElement);
    }
});

// ドラッグしている要素をどの位置に持っていくかを計算する関数
function getDragAfterElement(container, y) {
    // 今ドラッグ中じゃない「.layer-item」を全部取得
    const elements = [...container.querySelectorAll(".layer-item:not(.dragging)")];
    const closest = elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();

        // マウスのY座標と、各要素の中心との距離を計算（offset = マウスの位置 - layer-item要素の中央位置）
        const offset = y - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null });
    return closest.element;
}

// 画像順の更新
function updateImageOrder() {
    const newOrder = [...layerMenu.querySelectorAll(".layer-item")].map(el => el.getAttribute("data-id"));
    images.sort((a, b) => newOrder.indexOf(String(a.id)) - newOrder.indexOf(String(b.id)));
    renderImages();
}

// 全ての画像データを消して、表示もリセット
resetButton.addEventListener('click', (event) => {
    images = [];
    layerMenu.innerHTML = [];
    dropArea.innerHTML = [];

    dropArea.innerHTML = '<p>ここに画像をドラッグ＆ドロップ（png、svg、webp、jpgのみ対応）</p>';

    updateButtonState();

    const layerEls = layerMenu.querySelectorAll(".layer-item");
    layerEls.forEach(layerEl => {
        layerEl.draggable = true;
    });

    isDragEnabled = true;
    dragToggleButton.style.backgroundColor = "#B2D3A5";
});

updateButtonState();