const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/weather", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const { data } = await axios.get(
      "https://api.openweathermap.org/data/2.5/forecast",
      {
        params: {
          lat,
          lon,
          appid: process.env.API_KEY,
          units: "metric", // or "imperial" based on your preference
        },
      },
    );

    // Log the data to verify the structure
    console.log(data);

    // Check for API errors
    if (data.cod !== "200") {
      throw new Error(data.message || "Error fetching weather data");
    }

    res.json({
      current: parseCurrentWeather(data.list[0]), // Use the first item for current weather
      daily: parseDailyWeather(data.list),
      hourly: parseHourlyWeather(data.list),
    });
  } catch (error) {
    console.error(
      "Error fetching weather data:",
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

function parseCurrentWeather(data) {
  // Extract necessary data from the current forecast item
  const { main, weather, wind } = data;

  return {
    currentTemp: Math.round(main.temp),
    highTemp: Math.round(main.temp_max),
    lowTemp: Math.round(main.temp_min),
    highFeelsLike: Math.round(main.feels_like),
    windSpeed: Math.round(wind.speed),
    icon: weather[0].icon,
    description: weather[0].description,
  };
}

function parseDailyWeather(data) {
  // This function can be enhanced to group the daily forecasts based on your needs
  const dailyData = data.reduce((acc, item) => {
    const date = new Date(item.dt_txt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  return Object.entries(dailyData).map(([date, forecasts]) => {
    const mainForecast = forecasts[0].main; // Use the first forecast for daily temp
    return {
      date: date,
      highTemp: Math.round(Math.max(...forecasts.map((f) => f.main.temp_max))),
      lowTemp: Math.round(Math.min(...forecasts.map((f) => f.main.temp_min))),
      icon: forecasts[0].weather[0].icon,
      description: forecasts[0].weather[0].description,
    };
  });
}

function parseHourlyWeather(data) {
  return data.map((item) => {
    return {
      timestamp: item.dt * 1000,
      icon: item.weather[0].icon,
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      windSpeed: Math.round(item.wind.speed),
      precip: Math.round(item.pop * 100),
    };
  });
}

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
