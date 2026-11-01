# 🌦️ Weather Dashboard

A modern, responsive Weather Dashboard built using **HTML5, CSS3, and JavaScript**. It provides real-time weather information, city search, current location detection, hourly and 7-day forecasts, air quality monitoring, and interactive temperature charts.

The application uses the **Open-Meteo API** to retrieve weather and air quality information without requiring an API key.

## 📸 Screenshots

### Weather Dashboard

| Dark Mode | Light Mode |
|---|---|
| ![Weather Dashboard Dark](screenshots/weather-dashboard-dark.png) | ![Weather Dashboard Light](screenshots/weather-dashboard-light.png) |

### Forecast and Settings

| Light Mode | Dark Mode |
|---|---|
| ![Forecast and Settings Light](screenshots/weather-forecast-settings-light.png) | ![Forecast and Settings Dark](screenshots/weather-forecast-settings-dark.png) |

## ✨ Features

- **Live Weather Updates** – Get current weather information for different cities.
- **City Search** – Search for cities using the Open-Meteo Geocoding API.
- **Current Location** – Detect your location using the browser's Geolocation API.
- **Hourly Forecast** – View upcoming hourly weather information.
- **7-Day Forecast** – Check weather predictions for the next seven days.
- **Air Quality Monitoring** – View European AQI and pollutants, including PM2.5, PM10, NO₂, and SO₂.
- **Interactive Temperature Chart** – Visualize temperature trends using Chart.js.
- **Temperature Conversion** – Switch between Celsius (°C) and Fahrenheit (°F).
- **Dark and Light Mode** – Change the dashboard theme.
- **Local Storage** – Save user preferences, including temperature unit, theme, and last searched city.
- **Responsive Design** – Optimized for desktop, tablet, and mobile devices.
- **Error Handling** – Displays appropriate messages when weather data cannot be retrieved.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling, layouts, animations, and responsive design |
| JavaScript (ES6+) | Application logic and API integration |
| Chart.js | Interactive temperature charts |
| Open-Meteo API | Weather forecast data |
| Open-Meteo Geocoding API | City search and location details |
| Open-Meteo Air Quality API | Air quality information |
| Browser Geolocation API | Current location detection |
| Local Storage | Saving user preferences |
| Git & GitHub | Version control and project hosting |

## 🌐 APIs Used

This project uses the following Open-Meteo services:

**1. Geocoding API**

Used to search for cities and retrieve their geographical coordinates.

https://geocoding-api.open-meteo.com/v1/search

**2. Weather Forecast API**

Used to retrieve current weather, hourly forecasts, and 7-day forecasts.

https://api.open-meteo.com/v1/forecast

**3. Air Quality API**

Used to retrieve air quality information and pollutant measurements.

https://air-quality-api.open-meteo.com/v1/air-quality

## 📂 Project Structure

```text
Weather-App/
│
├── assets/
│
├── screenshots/
│   ├── weather-dashboard-dark.png
│   ├── weather-dashboard-light.png
│   ├── weather-forecast-settings-light.png
│   └── weather-forecast-settings-dark.png
│
├── css/
│   └── style.css
│
├── js/
│   └── app.js
│
├── index.html
├── README.md
└── .gitignore
```

## 🚀 Getting Started

Follow these steps to run the project on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/Sunilgowda2003/Weather-App.git
```

### 2. Navigate to the Project Folder

```bash
cd Weather-App
```

### 3. Open the Project

Open the project folder in Visual Studio Code.

### 4. Run the Application

You can run the application using the **Live Server** extension in Visual Studio Code.

1. Install the Live Server extension if it is not already installed.
2. Open `index.html`.
3. Right-click inside the editor.
4. Select **Open with Live Server**.

The Weather Dashboard will open in your browser.

## ⚙️ Application Settings

The application uses browser Local Storage to save the following preferences:

- Temperature unit (Celsius or Fahrenheit).
- Theme preference (Dark or Light).
- Last searched city.

These settings are restored when the user opens the application again in the same browser.

## 📱 Responsive Design

The dashboard is designed to work across different screen sizes:

- Desktop computers
- Tablets
- Mobile devices

## 🎯 Project Objective

The main objective of this project is to develop a responsive weather application using core web technologies and real-world API integration.

This project helped me improve my understanding of:

- JavaScript DOM manipulation.
- Fetch API and asynchronous programming.
- Working with third-party REST APIs.
- JSON data handling.
- Browser Geolocation API.
- Local Storage.
- Dynamic UI updates.
- Responsive web design.
- Error handling and debugging.

## 👨‍💻 Author

**Sunil J S**

- GitHub: [@Sunilgowda2003](https://github.com/Sunilgowda2003)

## 📄 License

No license has been specified for this project.

---

⭐ If you find this project useful, consider giving it a star!