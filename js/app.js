"use strict";

// ============================================
// WeatherApp - Complete JavaScript
// APIs: Open-Meteo Geocoding, Forecast, Air Quality
// ============================================

const $ = (selector) => document.querySelector(selector);

const state = {
  unit: "celsius",
  weather: null,
  location: null,
  chart: null,
  requestId: 0
};

// ============================================
// Persistent user preferences
// ============================================

const STORAGE_KEY = "weatherAppSettings";

const DEFAULT_SETTINGS = {
  unit: "celsius",
  darkMode: false,
  lastCity: "Bengaluru"
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(saved);

    return {
      unit: ["celsius", "fahrenheit"].includes(parsed.unit)
        ? parsed.unit
        : DEFAULT_SETTINGS.unit,

      darkMode: typeof parsed.darkMode === "boolean"
        ? parsed.darkMode
        : DEFAULT_SETTINGS.darkMode,

      lastCity:
        typeof parsed.lastCity === "string" && parsed.lastCity.trim()
          ? parsed.lastCity.trim()
          : DEFAULT_SETTINGS.lastCity
    };
  } catch (error) {
    console.warn("Could not read saved settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        unit: state.unit,
        darkMode: document.body.classList.contains("dark-mode"),
        lastCity: state.lastCity || DEFAULT_SETTINGS.lastCity
      })
    );
  } catch (error) {
    console.warn("Could not save settings:", error);
  }
}

const savedSettings = loadSettings();

state.unit = savedSettings.unit;
state.lastCity = savedSettings.lastCity;

document.body.classList.toggle(
  "dark-mode",
  savedSettings.darkMode
);

// ============================================
// API endpoints
// ============================================

const API = {
  geocoding: "https://geocoding-api.open-meteo.com/v1/search",
  forecast: "https://api.open-meteo.com/v1/forecast",
  airQuality: "https://air-quality-api.open-meteo.com/v1/air-quality"
};

// Common alternative spellings
const CITY_ALIASES = {
  "channapattana": "Channapatna",
  "channapatna town": "Channapatna",
  "bangalore": "Bengaluru",
  "mysore": "Mysuru",
  "mangalore": "Mangaluru",
  "belgaum": "Belagavi"
};

// ============================================
// Status and formatting helpers
// ============================================

function setStatus(message, isError = false) {
  const element = $("#status-message");

  if (!element) return;

  element.textContent = message;
  element.classList.toggle("error", isError);
}

function temperature(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "--";
  }

  const celsius = Number(value);

  const displayed = state.unit === "fahrenheit"
    ? (celsius * 9 / 5) + 32
    : celsius;

  return `${Math.round(displayed)}°`;
}

function unitLabel() {
  return state.unit === "celsius" ? "C" : "F";
}

function localDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateString, options = {}) {
  return localDate(dateString).toLocaleDateString("en-IN", options);
}

function formatTime(value) {
  if (!value) return "--";

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
  );

  if (!match) return "--";

  const [, year, month, day, hour, minute] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

// ============================================
// Weather descriptions and icons
// ============================================

function getWeatherInfo(code, isDay = true) {
  if (code === 0) {
    return {
      condition: "Clear Sky",
      icon: isDay ? "☀️" : "🌙"
    };
  }

  if (code === 1) {
    return {
      condition: "Mainly Clear",
      icon: isDay ? "🌤️" : "🌙"
    };
  }

  if (code === 2) {
    return {
      condition: "Partly Cloudy",
      icon: isDay ? "🌤️" : "☁️"
    };
  }

  if (code === 3) {
    return { condition: "Overcast", icon: "☁️" };
  }

  if ([45, 48].includes(code)) {
    return { condition: "Fog", icon: "🌫️" };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { condition: "Drizzle", icon: "🌦️" };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { condition: "Rain", icon: "🌧️" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { condition: "Snow", icon: "❄️" };
  }

  if ([95, 96, 99].includes(code)) {
    return { condition: "Thunderstorm", icon: "⛈️" };
  }

  return { condition: "Unknown Conditions", icon: "🌡️" };
}

// ============================================
// API helpers
// ============================================

async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather service returned HTTP ${response.status}.`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      data.reason || "The weather service rejected the request."
    );
  }

  return data;
}

// ============================================
// City search with aliases
// ============================================

async function searchCity(city) {
  const trimmed = city.trim().replace(/\s+/g, " ");
  const alias = CITY_ALIASES[trimmed.toLowerCase()];

  const candidates = [...new Set(
    [trimmed, alias].filter(Boolean)
  )];

  for (const candidate of candidates) {
    const params = new URLSearchParams({
      name: candidate,
      count: "10",
      language: "en",
      format: "json"
    });

    const data = await fetchJSON(
      `${API.geocoding}?${params}`
    );

    const results = data.results || [];

    if (results.length === 0) continue;

    const exactMatch = results.find(
      place => place.name.toLowerCase() === candidate.toLowerCase()
    );

    return exactMatch || results[0];
  }

  throw new Error(
    `No location found for "${city}". Check the spelling or try a nearby city.`
  );
}

// ============================================
// Fetch weather forecast
// ============================================

async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "auto",
    forecast_days: "7",
    wind_speed_unit: "kmh",
    temperature_unit: "celsius",

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "pressure_msl",
      "surface_pressure",
      "wind_speed_10m"
    ].join(","),

    hourly: [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
      "visibility",
      "wind_speed_10m"
    ].join(","),

    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset"
    ].join(",")
  });

  return fetchJSON(`${API.forecast}?${params}`);
}

// ============================================
// Fetch air quality
// ============================================

async function fetchAirQuality(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "auto",
    current: [
      "european_aqi",
      "pm2_5",
      "pm10",
      "nitrogen_dioxide",
      "sulphur_dioxide"
    ].join(",")
  });

  return fetchJSON(`${API.airQuality}?${params}`);
}

// ============================================
// Prepare weather data
// ============================================

function nearestHourlyIndex(hourly, currentTime) {
  const target = new Date(currentTime).getTime();

  let bestIndex = 0;
  let smallestDifference = Infinity;

  hourly.time.forEach((time, index) => {
    const difference = Math.abs(
      new Date(time).getTime() - target
    );

    if (difference < smallestDifference) {
      smallestDifference = difference;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function normalizeWeather(location, data) {
  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;

  const currentIndex = nearestHourlyIndex(
    hourly,
    current.time
  );

  const region = [
    location.admin1,
    location.country
  ]
    .filter(Boolean)
    .filter((value, index, array) =>
      array.indexOf(value) === index
    )
    .join(", ");

  return {
    location: {
      name: location.name || "Selected Location",
      region,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: data.timezone
    },

    current: {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      wind: current.wind_speed_10m,
      pressure: current.pressure_msl ?? current.surface_pressure,
      visibility: hourly.visibility?.[currentIndex],
      code: current.weather_code,
      isDay: current.is_day === 1,
      time: current.time
    },

    hourly,
    daily,
    currentIndex
  };
}

// ============================================
// Render current conditions
// ============================================

function renderCurrentWeather() {
  const weather = state.weather;

  if (!weather) return;

  const { location, current, daily } = weather;

  const info = getWeatherInfo(
    current.code,
    current.isDay
  );

  $("#city-name").textContent = location.region
    ? `${location.name}, ${location.region}`
    : location.name;

  $("#current-date").textContent =
    `${formatDate(current.time.slice(0, 10), {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    })} · ${formatTime(current.time)}`;

  $("#current-temp").textContent =
    temperature(current.temperature).replace("°", "");

  document.querySelectorAll(".unit-symbol").forEach(element => {
    element.textContent = unitLabel();
  });

  $("#feels-like").textContent =
    temperature(current.feelsLike).replace("°", "");

  $("#current-condition").textContent = info.condition;
  $("#current-icon").textContent = info.icon;

  $("#humidity").textContent =
    current.humidity == null ? "--" : `${current.humidity}%`;

  $("#wind-speed").textContent =
    current.wind == null ? "--" : `${Math.round(current.wind)} km/h`;

  $("#pressure").textContent =
    current.pressure == null ? "--" : `${Math.round(current.pressure)} hPa`;

  $("#visibility").textContent =
    current.visibility == null
      ? "--"
      : `${(current.visibility / 1000).toFixed(1)} km`;

  $("#max-temp").textContent =
    temperature(daily.temperature_2m_max[0]);

  $("#min-temp").textContent =
    temperature(daily.temperature_2m_min[0]);

  $("#sunrise").textContent = formatTime(daily.sunrise[0]);
  $("#sunset").textContent = formatTime(daily.sunset[0]);
}

// ============================================
// Render hourly forecast
// ============================================

function renderHourlyForecast() {
  const { hourly, currentIndex } = state.weather;

  const entries = hourly.time
    .map((time, index) => ({ time, index }))
    .filter(item => item.index >= currentIndex)
    .slice(0, 6);

  $("#hourly-list").innerHTML = entries.map(
    ({ time, index }, position) => {
      const hour = Number(time.slice(11, 13));

      const info = getWeatherInfo(
        hourly.weather_code[index],
        hour >= 6 && hour < 18
      );

      return `
        <article class="hourly-item">
          <span class="hour">
            ${position === 0 ? "Now" : formatTime(time)}
          </span>

          <span class="hour-icon" aria-hidden="true">
            ${info.icon}
          </span>

          <strong>
            ${temperature(hourly.temperature_2m[index])}
          </strong>
        </article>
      `;
    }
  ).join("");
}

// ============================================
// Render seven-day forecast
// ============================================

function renderDailyForecast() {
  const daily = state.weather.daily;

  $("#forecast-grid").innerHTML = daily.time.map(
    (date, index) => {
      const info = getWeatherInfo(
        daily.weather_code[index],
        true
      );

      return `
        <article class="forecast-day">
          <span class="day-name">
            ${formatDate(date, { weekday: "short" })}
          </span>

          <span class="day-date">
            ${formatDate(date, {
              day: "numeric",
              month: "short"
            })}
          </span>

          <span class="forecast-icon" aria-hidden="true">
            ${info.icon}
          </span>

          <span class="forecast-temp">
            ${temperature(daily.temperature_2m_max[index])}
            <span class="low">
              / ${temperature(daily.temperature_2m_min[index])}
            </span>
          </span>

          <span class="forecast-condition">
            ${info.condition}
          </span>
        </article>
      `;
    }
  ).join("");
}

// ============================================
// Render temperature chart
// ============================================

function renderTemperatureChart() {
  const canvas = $("#temperature-chart");

  if (!canvas || !state.weather) return;

  if (typeof Chart === "undefined") {
    console.warn("Chart.js did not load.");
    return;
  }

  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }

  const daily = state.weather.daily;

  const convert = value => Math.round(
    state.unit === "fahrenheit"
      ? value * 9 / 5 + 32
      : value
  );

  const dark = document.body.classList.contains("dark-mode");

  const labelColor = dark ? "#b8c6da" : "#64748b";

  const gridColor = dark
    ? "rgba(180,200,225,.12)"
    : "rgba(140,160,185,.17)";

  state.chart = new Chart(canvas, {
    type: "line",

    data: {
      labels: daily.time.map(date =>
        formatDate(date, { weekday: "short" })
      ),

      datasets: [
        {
          label: "Max Temp",
          data: daily.temperature_2m_max.map(convert),
          borderColor: "#f04444",
          backgroundColor: "#f04444",
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.35
        },

        {
          label: "Min Temp",
          data: daily.temperature_2m_min.map(convert),
          borderColor: "#1680ff",
          backgroundColor: "#1680ff",
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.35
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index"
      },

      plugins: {
        legend: { display: false },

        tooltip: {
          callbacks: {
            label: context =>
              `${context.dataset.label}: ${context.parsed.y}°${unitLabel()}`
          }
        }
      },

      scales: {
        y: {
          ticks: {
            maxTicksLimit: 5,
            color: labelColor,
            callback: value => `${value}°`
          },
          grid: { color: gridColor }
        },

        x: {
          ticks: { color: labelColor },
          grid: { display: false }
        }
      }
    }
  });
}

// ============================================
// Render AQI safely
// ============================================

function renderAirQuality(data) {
  const current = data?.current;

  const aqiValue = $("#aqi-value");
  const aqiLabel = $("#aqi-label");
  const aqiNote = $("#aqi-note");
  const aqiRing = $("#aqi-ring");

  if (!current || current.european_aqi == null) {
    if (aqiValue) aqiValue.textContent = "--";
    if (aqiLabel) aqiLabel.textContent = "Unavailable";

    if (aqiNote) {
      aqiNote.textContent =
        "Live air-quality data is unavailable for this location.";
    }

    ["#pm25", "#pm10", "#no2", "#so2"].forEach(selector => {
      const element = $(selector);
      if (element) element.textContent = "--";
    });

    return;
  }

  const aqi = Math.round(current.european_aqi);

  let label = "Good";
  let color = "#12c76a";

  if (aqi > 20) {
    label = "Fair";
    color = "#a3cf20";
  }

  if (aqi > 40) {
    label = "Moderate";
    color = "#f0b429";
  }

  if (aqi > 60) {
    label = "Poor";
    color = "#f97316";
  }

  if (aqi > 80) {
    label = "Very Poor";
    color = "#e5484d";
  }

  if (aqi > 100) {
    label = "Extremely Poor";
    color = "#9b4de0";
  }

  if (aqiValue) aqiValue.textContent = aqi;
  if (aqiLabel) aqiLabel.textContent = label;

  if (aqiRing) {
    const percentage = Math.max(0, Math.min(aqi, 100));

    aqiRing.style.background =
      `conic-gradient(${color} 0 ${percentage}%, #c9f3db ${percentage}% 100%)`;
  }

  const pollutantValues = {
    "#pm25": current.pm2_5,
    "#pm10": current.pm10,
    "#no2": current.nitrogen_dioxide,
    "#so2": current.sulphur_dioxide
  };

  Object.entries(pollutantValues).forEach(([selector, value]) => {
    const element = $(selector);

    if (element) {
      element.textContent =
        value == null ? "--" : Number(value).toFixed(1);
    }
  });

  if (aqiNote) {
    aqiNote.textContent =
      "Live Open-Meteo air-quality data · European AQI scale.";
  }
}

// ============================================
// Render all dashboard sections
// ============================================

function renderDashboard() {
  if (!state.weather) return;

  renderCurrentWeather();
  renderHourlyForecast();
  renderDailyForecast();
  renderTemperatureChart();
}

// ============================================
// Load weather for a city
// ============================================

async function loadCityWeather(city) {
  const requestId = ++state.requestId;

  setStatus(`Searching for ${city}...`);

  try {
    const location = await searchCity(city);

    if (requestId !== state.requestId) return;

    setStatus(`Loading weather for ${location.name}...`);

    const [forecast, airQuality] = await Promise.all([
      fetchWeather(location.latitude, location.longitude),

      fetchAirQuality(location.latitude, location.longitude)
        .catch(error => {
          console.warn("Air-quality request failed:", error);
          return null;
        })
    ]);

    if (requestId !== state.requestId) return;

    state.location = location;
    state.weather = normalizeWeather(location, forecast);
    state.lastCity = location.name;

    renderDashboard();
    renderAirQuality(airQuality);

    const cityInput = $("#city-input");

    if (cityInput) {
      cityInput.value = location.name;
    }

    // Persist the last successfully loaded city.
    saveSettings();

    setStatus(
      `Live weather · ${state.weather.location.timezone || "Local time"} · Open-Meteo`
    );

  } catch (error) {
    if (requestId !== state.requestId) return;

    console.error("Unable to load weather:", error);

    setStatus(
      `${error.message} ${
        state.weather
          ? "Previous weather remains displayed."
          : ""
      }`.trim(),
      true
    );
  }
}

// ============================================
// Load weather using browser location
// ============================================

async function loadCurrentLocation() {
  if (!navigator.geolocation) {
    setStatus(
      "Location is not supported. Search for a city instead.",
      true
    );
    return;
  }

  const requestId = ++state.requestId;

  setStatus("Requesting your location...");

  navigator.geolocation.getCurrentPosition(
    async position => {
      if (requestId !== state.requestId) return;

      const { latitude, longitude } = position.coords;

      try {
        setStatus("Loading weather for your location...");

        const [forecast, airQuality] = await Promise.all([
          fetchWeather(latitude, longitude),
          fetchAirQuality(latitude, longitude).catch(() => null)
        ]);

        if (requestId !== state.requestId) return;

        const location = {
          name: "Your Location",
          latitude,
          longitude
        };

        state.location = location;
        state.weather = normalizeWeather(location, forecast);

        renderDashboard();
        renderAirQuality(airQuality);

        setStatus(
          `Live weather · ${state.weather.location.timezone || "Local time"} · Open-Meteo`
        );

      } catch (error) {
        if (requestId !== state.requestId) return;

        console.error(error);

        setStatus(
          "Could not load local weather. Search for a city instead.",
          true
        );
      }
    },

    error => {
      if (requestId !== state.requestId) return;

      setStatus(
        error.code === 1
          ? "Location permission denied. Search for a city instead."
          : "Unable to determine your location. Search for a city instead.",
        true
      );
    },

    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}

// ============================================
// Search form events
// ============================================

const searchForm = $("#search-form");

if (searchForm) {
  searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const cityInput = $("#city-input");
    const city = cityInput?.value.trim();

    if (!city) {
      setStatus("Enter a city name to search.", true);
      cityInput?.focus();
      return;
    }

    loadCityWeather(city);
  });
}

// ============================================
// Celsius / Fahrenheit buttons
// ============================================

document.querySelectorAll(".unit-button").forEach(button => {
  button.addEventListener("click", () => {
    const selectedUnit = button.dataset.unit;

    if (!["celsius", "fahrenheit"].includes(selectedUnit)) {
      return;
    }

    state.unit = selectedUnit;

    document.querySelectorAll(".unit-button").forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.unit === state.unit
      );
    });

    const settingsUnit = $("#settings-unit");

    if (settingsUnit) {
      settingsUnit.value = state.unit;
    }

    renderDashboard();
    saveSettings();
  });
});

// ============================================
// Dark mode button
// ============================================

const themeButton = $("#theme-button");

if (themeButton) {
  themeButton.addEventListener("click", () => {
    const enabled = document.body.classList.toggle("dark-mode");

    themeButton.textContent = enabled ? "☀" : "☾";

    themeButton.setAttribute(
      "aria-label",
      enabled ? "Switch to light mode" : "Switch to dark mode"
    );

    const settingsDarkMode = $("#settings-dark-mode");

    if (settingsDarkMode) {
      settingsDarkMode.checked = enabled;
    }

    renderTemperatureChart();
    saveSettings();
  });
}

// ============================================
// Current location button
// ============================================

const locationButton = $("#location-button");

if (locationButton) {
  locationButton.addEventListener("click", loadCurrentLocation);
}

// ============================================
// Settings panel functionality
// ============================================

const settingsUnit = $("#settings-unit");
const settingsDarkMode = $("#settings-dark-mode");
const settingsRefresh = $("#settings-refresh");

function syncSettings() {
  if (settingsUnit) {
    settingsUnit.value = state.unit;
  }

  if (settingsDarkMode) {
    settingsDarkMode.checked =
      document.body.classList.contains("dark-mode");
  }

  document.querySelectorAll(".unit-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.unit === state.unit
    );
  });

  const currentThemeButton = $("#theme-button");
  const darkMode = document.body.classList.contains("dark-mode");

  if (currentThemeButton) {
    currentThemeButton.textContent = darkMode ? "☀" : "☾";

    currentThemeButton.setAttribute(
      "aria-label",
      darkMode ? "Switch to light mode" : "Switch to dark mode"
    );
  }
}

// Temperature unit setting
if (settingsUnit) {
  settingsUnit.addEventListener("change", () => {
    const selectedUnit = settingsUnit.value;

    if (!["celsius", "fahrenheit"].includes(selectedUnit)) {
      settingsUnit.value = state.unit;
      return;
    }

    state.unit = selectedUnit;

    renderDashboard();
    syncSettings();
    saveSettings();
  });
}

// Dark mode setting
if (settingsDarkMode) {
  settingsDarkMode.addEventListener("change", () => {
    const enabled = settingsDarkMode.checked;

    document.body.classList.toggle("dark-mode", enabled);

    syncSettings();
    renderTemperatureChart();
    saveSettings();
  });
}

// Refresh the currently selected city
if (settingsRefresh) {
  settingsRefresh.addEventListener("click", () => {
    const cityInput = $("#city-input");
    const city = cityInput?.value.trim();

    if (city) {
      loadCityWeather(city);
    } else {
      loadCityWeather(state.lastCity || DEFAULT_SETTINGS.lastCity);
    }
  });
}

// ============================================
// Initialize and start dashboard
// ============================================

syncSettings();

const initialCity = state.lastCity || DEFAULT_SETTINGS.lastCity;
const initialCityInput = $("#city-input");

if (initialCityInput) {
  initialCityInput.value = initialCity;
}

loadCityWeather(initialCity);