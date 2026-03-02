// Your OpenWeatherMap API Key
const API_KEY = "e759c55d3e94712334291a1ac9da52e5";
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

// DOM references
const weatherDisplay = document.getElementById("weather-display");
const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");

// Show a loading state
function showLoading() {
  weatherDisplay.innerHTML = `
        <div class="loading-container">
            <div class="spinner" aria-hidden="true"></div>
            <div class="loading-text">Loading...</div>
        </div>
    `;
}

// Show user-friendly error
function showError(message) {
  weatherDisplay.innerHTML = `
        <div class="error-message">
            <div class="error-emoji">❌</div>
            <div>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
}

// Display weather data
function displayWeather(data) {
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

  weatherDisplay.innerHTML = weatherHTML;

  // Focus back to input for faster subsequent searches
  cityInput.focus();
}

// Async function to fetch weather
async function getWeather(city) {
  // Basic validation
  if (!city || city.trim().length < 2) {
    showError("Please enter a valid city name (at least 2 characters).");
    return;
  }

  const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  // Disable search button to prevent duplicate requests
  searchBtn.disabled = true;
  searchBtn.textContent = "Searching...";
  showLoading();

  try {
    const response = await axios.get(url);
    console.log("Weather Data:", response.data);
    displayWeather(response.data);
  } catch (error) {
    console.error("Error fetching weather:", error);
    if (error.response && error.response.status === 404) {
      showError("City not found. Please check the spelling and try again.");
    } else {
      showError("Something went wrong. Please try again later.");
    }
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "🔍 Search";
  }
}

// Event listeners for search
searchBtn.addEventListener("click", function () {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  getWeather(city);
  cityInput.value = "";
});

// Enter key support
cityInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    searchBtn.click();
  }
});

// Initial welcome message
weatherDisplay.innerHTML = `
    <div class="welcome-message">
        <h3>Welcome to SkyFetch!</h3>
        <p>Enter a city name above to get started.</p>
    </div>
`;
