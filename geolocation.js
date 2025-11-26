
export function getUserCoordinates() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      return reject(new Error("Геолокация не поддерживается этим браузером."));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}


export async function reverseGeocode({ latitude, longitude }) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
    latitude
  )}&longitude=${encodeURIComponent(
    longitude
  )}&localityLanguage=en`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Не удалось выполнить обратное геокодирование.");
  }

  const data = await response.json();

  const countryCode = data.countryCode || "DEFAULT";
  const city =
    data.city || data.locality || data.principalSubdivision || null;
  const country = data.countryName || null;

  return {
    countryCode,
    city,
    country,
  };
}
