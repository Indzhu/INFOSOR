// js/app.js
// Главная логика приложения GeoNews

import { getUserCoordinates, reverseGeocode } from "./geolocation.js";

const statusEl = document.getElementById("status");
const locationNameEl = document.getElementById("location-name");
const newsListEl = document.getElementById("news-list");
const refreshBtn = document.getElementById("refresh-location");

/**
 * Загружает новости из локального JSON-файла и возвращает массив новостей
 * для указанного countryCode (например, "KZ", "RU" или "DEFAULT").
 */
async function fetchNews(countryCode) {
  const response = await fetch("./data/news.json", {
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить локальные новости.");
  }

  const data = await response.json();

  if (data[countryCode] && data[countryCode].length > 0) {
    return data[countryCode];
  }

  // Если для страны нет новостей — берём DEFAULT
  if (data.DEFAULT && data.DEFAULT.length > 0) {
    return data.DEFAULT;
  }

  return [];
}

/**
 * Рендерит список карточек новостей.
 */
function renderNews(newsArray, locationLabel) {
  newsListEl.innerHTML = "";

  if (!newsArray || newsArray.length === 0) {
    const empty = document.createElement("div");
    empty.className = "news__empty";
    empty.textContent =
      "Пока нет новостей для вашего региона. Попробуйте обновить страницу позже.";
    newsListEl.appendChild(empty);
    return;
  }

  newsArray.forEach((item) => {
    const card = document.createElement("article");
    card.className = "news-card";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "news-card__image-wrapper";

    const img = document.createElement("img");
    img.className = "news-card__image";
    img.src = item.image || "https://via.placeholder.com/300x200?text=GeoNews";
    img.alt = item.title || "Новость";

    imageWrapper.appendChild(img);

    const content = document.createElement("div");
    content.className = "news-card__content";

    const title = document.createElement("h2");
    title.className = "news-card__title";
    title.textContent = item.title || "Без названия";

    const description = document.createElement("p");
    description.className = "news-card__description";
    description.textContent =
      item.description || "Описание новости временно недоступно.";

    const footer = document.createElement("div");
    footer.className = "news-card__footer";

    const badge = document.createElement("span");
    badge.className = "news-card__badge";
    badge.textContent = locationLabel || "Новости";

    const link = document.createElement("a");
    link.className = "news-card__link";
    link.href = item.link || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Читать полностью →";

    footer.appendChild(badge);
    footer.appendChild(link);

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(footer);

    card.appendChild(imageWrapper);
    card.appendChild(content);

    newsListEl.appendChild(card);
  });
}

/**
 * Универсальная функция показа статуса.
 */
function setStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

/**
 * Загружает и показывает новости на основе текущего местоположения пользователя.
 */
async function loadNewsForUser() {
  try {
    refreshBtn.disabled = true;
    setStatus("Определяем ваше местоположение...");
    locationNameEl.textContent = "вашего региона";

    // 1. Координаты
    const coords = await getUserCoordinates();

    // 2. Обратное геокодирование
    setStatus("Определяем ваш город и страну...");
    const region = await reverseGeocode(coords);

    const countryCode = region.countryCode || "DEFAULT";
    const locationLabel =
      region.city || region.country || "вашего региона";

    locationNameEl.textContent = locationLabel;

    // 3. Загрузка новостей
    setStatus(`Загружаем новости для: ${countryCode}...`);
    const news = await fetchNews(countryCode);

    // 4. Рендер
    renderNews(news, locationLabel);
    setStatus("");
  } catch (error) {
    console.error("Ошибка при загрузке новостей по геолокации:", error);

    // Fallback: показываем мировые новости
    locationNameEl.textContent = "Мира";
    setStatus(
      "Не удалось определить местоположение. Показываем мировые новости."
    );

    try {
      const news = await fetchNews("DEFAULT");
      renderNews(news, "Мир");
    } catch (innerError) {
      console.error("Ошибка при загрузке новостей по умолчанию:", innerError);
      newsListEl.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "news__empty";
      empty.textContent =
        "Произошла ошибка при загрузке новостей. Проверьте подключение к интернету.";
      newsListEl.appendChild(empty);
    }
  } finally {
    refreshBtn.disabled = false;
  }
}

/**
 * Инициализация приложения.
 */
function init() {
  // При первой загрузке сразу пробуем определить местоположение
  loadNewsForUser();

  // Кнопка ручного обновления местоположения
  refreshBtn.addEventListener("click", () => {
    loadNewsForUser();
  });
}

// Запускаем после загрузки DOM
document.addEventListener("DOMContentLoaded", init);
