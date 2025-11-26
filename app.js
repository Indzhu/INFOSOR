

import { getUserCoordinates, reverseGeocode } from "./geolocation.js";

const statusEl = document.getElementById("status");
const locationNameEl = document.getElementById("location-name");
const newsListEl = document.getElementById("news-list");
const refreshBtn = document.getElementById("refresh-location");


 
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


  if (data.DEFAULT && data.DEFAULT.length > 0) {
    return data.DEFAULT;
  }

  return [];
}


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


function setStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}


async function loadNewsForUser() {
  try {
    refreshBtn.disabled = true;
    setStatus("Определяем ваше местоположение...");
    locationNameEl.textContent = "вашего региона";

    
    const coords = await getUserCoordinates();

    
    setStatus("Определяем ваш город и страну...");
    const region = await reverseGeocode(coords);

    const countryCode = region.countryCode || "DEFAULT";
    const locationLabel =
      region.city || region.country || "вашего региона";

    locationNameEl.textContent = locationLabel;

    
    setStatus(`Загружаем новости для: ${countryCode}...`);
    const news = await fetchNews(countryCode);

    
    renderNews(news, locationLabel);
    setStatus("");
  } catch (error) {
    console.error("Ошибка при загрузке новостей по геолокации:", error);

    
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


function init() {
  
  loadNewsForUser();

  
  refreshBtn.addEventListener("click", () => {
    loadNewsForUser();
  });
}


document.addEventListener("DOMContentLoaded", init);
