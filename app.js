function WeatherApp(apiKey) {
  this.apiKey = apiKey;
  this.apiUrl = "https://api.openweathermap.org/data/2.5/weather";
  this.forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";

  // DOM
  this.searchBtn = document.getElementById("search-btn");
  this.cityInput = document.getElementById("city-input");
  this.weatherDisplay = document.getElementById("weather-display");

  // recent searches DOM
  this.recentSearchesSection = document.getElementById("recent-searches-section");
  this.recentSearchesContainer = document.getElementById("recent-searches-container");
  this.clearHistoryBtn = document.getElementById("clear-history-btn");

  // state
  this.recentSearches = [];
  this.maxRecentSearches = 5;

  this.init();
}

/* ---------------- UI helpers ---------------- */

WeatherApp.prototype.showWelcome = function () {
  this.weatherDisplay.innerHTML = `
    <div class="welcome-message">
      <h3>🌤️ Welcome to SkyFetch!</h3>
      <p>Search for a city to get started. Try: London, Tokyo, Paris</p>
    </div>
  `;
};

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

/* ---------------- localStorage ---------------- */

WeatherApp.prototype.loadRecentSearches = function () {
  const saved = localStorage.getItem("recentSearches");
  if (saved) {
    try {
      this.recentSearches = JSON.parse(saved) || [];
    } catch {
      this.recentSearches = [];
    }
  }
  this.displayRecentSearches();
};

WeatherApp.prototype.saveRecentSearch = function (city) {
  const cityName =
    city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

  const index = this.recentSearches.indexOf(cityName);
  if (index > -1) this.recentSearches.splice(index, 1);

  this.recentSearches.unshift(cityName);

  if (this.recentSearches.length > this.maxRecentSearches) {
    this.recentSearches.pop();
  }

  localStorage.setItem("recentSearches", JSON.stringify(this.recentSearches));
  this.displayRecentSearches();
};

WeatherApp.prototype.displayRecentSearches = function () {
  this.recentSearchesContainer.innerHTML = "";

  if (this.recentSearches.length === 0) {
    this.recentSearchesSection.style.display = "none";
    return;
  }

  this.recentSearchesSection.style.display = "block";

  this.recentSearches.forEach(
    function (city) {
      const btn = document.createElement("button");
      btn.className = "recent-search-btn";
      btn.textContent = city;

      btn.addEventListener(
        "click",
        function () {
          this.cityInput.value = city;
          this.getWeather(city);
        }.bind(this)
      );

      this.recentSearchesContainer.appendChild(btn);
    }.bind(this)
  );
};

WeatherApp.prototype.loadLastCity = function () {
  const lastCity = localStorage.getItem("lastCity");
  if (lastCity && lastCity.trim().length >= 2) {
    this.getWeather(lastCity);
  } else {
    this.showWelcome();
  }
};

WeatherApp.prototype.clearHistory = function () {
  if (confirm("Clear all recent searches?")) {
    this.recentSearches = [];
    localStorage.removeItem("recentSearches");
    this.displayRecentSearches();
  }
};

/* ---------------- weather display ---------------- */

WeatherApp.prototype.displayWeather = function (data) {
  const cityName = data.name;
  const temperature = Math.round(data.main.temp);
  const description = data.weather[0].description;
  const icon = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  this.weatherDisplay.innerHTML = `
    <div class="weather-info">
      <h2 class="city-name">${cityName}</h2>
      <img src="${iconUrl}" alt="${description}" class="weather-icon" />
      <div class="temperature">${temperature}°C</div>
      <p class="description">${description}</p>
    </div>
  `;
};

WeatherApp.prototype.processForecastData = function (data) {
  const noonItems = data.list.filter((item) =>
    item.dt_txt.includes("12:00:00")
  );
  return noonItems.slice(0, 5);
};

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
        <img src="${iconUrl}" alt="${desc}" />
        <div class="temp">${temp}°C</div>
        <div class="desc">${desc}</div>
      </div>
    `;
  });

  forecastHTML += `</div>`;

  this.weatherDisplay.innerHTML += forecastHTML;
};

/* ---------------- fetching ---------------- */

WeatherApp.prototype.getForecast = async function (city) {
  const url = `${this.forecastUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
  const response = await axios.get(url);
  return this.processForecastData(response.data);
};

WeatherApp.prototype.getWeather = async function (city) {
  if (!city || city.trim().length < 2) {
    this.showError("Please enter a valid city name (at least 2 characters).");
    return;
  }

  this.showLoading();
  this.searchBtn.disabled = true;
  this.searchBtn.textContent = "Searching...";

  const currentUrl = `${this.apiUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;

  try {
    const [currentWeather, forecastData] = await Promise.all([
      axios.get(currentUrl),
      this.getForecast(city),
    ]);

    this.displayWeather(currentWeather.data);
    this.displayForecast(forecastData);

    // ✅ Save history only after successful fetch
    this.saveRecentSearch(city);
    localStorage.setItem("lastCity", city);
  } catch (error) {
    console.error("Error:", error);
    if (error.response && error.response.status === 404) {
      this.showError("City not found. Please check spelling and try again.");
    } else {
      this.showError("Something went wrong. Please try again later.");
    }
  } finally {
    this.searchBtn.disabled = false;
    this.searchBtn.textContent = "🔍 Search";
    this.cityInput.focus();
  }
};

/* ---------------- events ---------------- */

WeatherApp.prototype.handleSearch = function () {
  const city = this.cityInput.value.trim();
  if (!city) {
    this.showError("Please enter a city name.");
    return;
  }
  this.getWeather(city);
  this.cityInput.value = "";
};

WeatherApp.prototype.init = function () {
  this.searchBtn.addEventListener("click", this.handleSearch.bind(this));

  this.cityInput.addEventListener(
    "keypress",
    function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.handleSearch();
      }
    }.bind(this)
  );

  if (this.clearHistoryBtn) {
    this.clearHistoryBtn.addEventListener("click", this.clearHistory.bind(this));
  }

  this.loadRecentSearches();
  this.loadLastCity();
};

// ✅ Create app instance (use your key)
const app = new WeatherApp("e759c55d3e94712334291a1ac9da52e5");