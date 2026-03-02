// WeatherApp constructor and prototype-based implementation
function WeatherApp(apiKey) {
  // config
  this.apiKey = apiKey;
  this.weatherUrl = "https://api.openweathermap.org/data/2.5/weather";
  this.forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";

  // cached DOM references
  this.weatherDisplay = document.getElementById("weather-display");
  this.searchBtn = document.getElementById("search-btn");
  this.cityInput = document.getElementById("city-input");

  // kick things off
  this.init();
}

/* --------------------------------------------------------------------------
                          initialization & helpers
   -------------------------------------------------------------------------- */

WeatherApp.prototype.init = function () {
  // event listeners
  this.searchBtn.addEventListener("click", this.handleSearch.bind(this));
  this.cityInput.addEventListener(
    "keypress",
    function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        this.searchBtn.click();
      }
    }.bind(this),
  );

  this.showWelcome();
};

WeatherApp.prototype.showWelcome = function () {
  this.weatherDisplay.innerHTML = `
        <div class="welcome-message">
            <h3>Welcome to SkyFetch!</h3>
            <p>Enter a city name above to get started.</p>
        </div>
    `;
};

// simple loading indicator
WeatherApp.prototype.showLoading = function () {
  this.weatherDisplay.innerHTML = `
        <div class="loading-container">
            <div class="spinner" aria-hidden="true"></div>
            <div class="loading-text">Loading...</div>
        </div>
    `;
};

WeatherApp.prototype.showError = function (message) {
  this.weatherDisplay.innerHTML = `
        <div class="error-message">
            <div class="error-emoji">❌</div>
            <div>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
};

/* --------------------------------------------------------------------------
                              search & fetching
   -------------------------------------------------------------------------- */

WeatherApp.prototype.handleSearch = function () {
  const city = this.cityInput.value.trim();
  if (!city) {
    this.showError("Please enter a city name.");
    return;
  }
  this.getWeather(city);
  this.cityInput.value = "";
};

// fetch current weather and forecast at the same time
WeatherApp.prototype.getWeather = async function (city) {
  if (!city || city.length < 2) {
    this.showError("Please enter a valid city name (at least 2 characters).");
    return;
  }

  const weatherRequest = axios.get(
    `${this.weatherUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`,
  );
  const forecastRequest = axios.get(
    `${this.forecastUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`,
  );

  // disable button & show loader
  this.searchBtn.disabled = true;
  this.searchBtn.textContent = "Searching...";
  this.showLoading();

  try {
    const [weatherResp, forecastResp] = await Promise.all([
      weatherRequest,
      forecastRequest,
    ]);
    console.log("Weather Data:", weatherResp.data);
    console.log("Forecast Data:", forecastResp.data);

    this.displayWeather(weatherResp.data);
    const daily = this.processForecastData(forecastResp.data);
    this.displayForecast(daily);
  } catch (err) {
    console.error("Error during fetch:", err);
    if (err.response && err.response.status === 404) {
      this.showError(
        "City not found. Please check the spelling and try again.",
      );
    } else {
      this.showError("Something went wrong. Please try again later.");
    }
  } finally {
    this.searchBtn.disabled = false;
    this.searchBtn.textContent = "🔍 Search";
  }
};

WeatherApp.prototype.processForecastData = function (data) {
  // keep one entry per day around noon
  const noonItems = data.list.filter((item) =>
    item.dt_txt.includes("12:00:00"),
  );
  // ensure we only have 5 days
  return noonItems.slice(0, 5);
};

/* --------------------------------------------------------------------------
                              display helpers
   -------------------------------------------------------------------------- */

WeatherApp.prototype.displayWeather = function (data) {
  const cityName = data.name;
  const temperature = Math.round(data.main.temp);
  const description = data.weather[0].description;
  const icon = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;

  this.weatherDisplay.innerHTML = weatherHTML;
};
const hello = "this is for a testing operation......";
WeatherApp.prototype.displayForecast = function (dailyData) {
  let forecastHTML = `<div class="forecast-container">`;

  dailyData.forEach((item) => {
    const date = new Date(item.dt_txt);
    const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
    const temp = Math.round(item.main.temp);
    const desc = item.weather[0].description;
    const icon = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    forecastHTML += `
            <div class="forecast-card">
                <div class="day">${dayName}</div>
                <img src="${iconUrl}" alt="${desc}">
                <div class="temp">${temp}°C</div>
                <div class="desc">${desc}</div>
            </div>
        `;
  });

  forecastHTML += `</div>`;

  // append to existing weatherDisplay
  this.weatherDisplay.innerHTML += forecastHTML;
};

// create instance with API key
const app = new WeatherApp("e759c55d3e94712334291a1ac9da52e5");
