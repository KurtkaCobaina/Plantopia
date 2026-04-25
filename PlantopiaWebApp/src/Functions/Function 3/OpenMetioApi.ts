import { fetchWeatherApi } from "openmeteo";

// Функция получения погоды, принимающая координаты из карты
// @ts-ignore
export async function getWeatherData(latitude, longitude) {
    const params = {
        latitude: latitude,
        longitude: longitude,
        hourly: [
            "temperature_2m",
            "precipitation_probability",
            "precipitation",
            "rain",
            "snowfall",
            "soil_temperature_0cm",
            "soil_temperature_6cm",
            "soil_temperature_18cm",
            "soil_temperature_54cm",
            "relative_humidity_2m",
            "wind_speed_10m",
            "wind_direction_10m",
            "soil_moisture_0_to_1cm",
            "soil_moisture_1_to_3cm",
            "soil_moisture_3_to_9cm",
            "soil_moisture_9_to_27cm",
            "soil_moisture_27_to_81cm",
            "et0_fao_evapotranspiration",
            "vapour_pressure_deficit",
            "evapotranspiration"
        ],
    };

    const url = "https://api.open-meteo.com/v1/forecast";

    try {
        const responses = await fetchWeatherApi(url, params);
        const response = responses[0];

        const utcOffsetSeconds = response.utcOffsetSeconds();
        const hourly = response.hourly();

        if (!hourly) return null;

        const weatherData = {
            hourly: {
                time: Array.from(
                    { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
                    (_ , i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
                ),
                temperature_2m: hourly.variables(0)?.valuesArray(),
                precipitation_probability: hourly.variables(1)?.valuesArray(),
                precipitation: hourly.variables(2)?.valuesArray(),
                rain: hourly.variables(3)?.valuesArray(),
                snowfall: hourly.variables(4)?.valuesArray(),
                soil_temperature_0cm: hourly.variables(5)?.valuesArray(),
                soil_temperature_6cm: hourly.variables(6)?.valuesArray(),
                soil_temperature_18cm: hourly.variables(7)?.valuesArray(),
                soil_temperature_54cm: hourly.variables(8)?.valuesArray(),
                relative_humidity_2m: hourly.variables(9)?.valuesArray(),
                wind_speed_10m: hourly.variables(10)?.valuesArray(),
                wind_direction_10m: hourly.variables(11)?.valuesArray(),
                soil_moisture_0_to_1cm: hourly.variables(12)?.valuesArray(),
                soil_moisture_1_to_3cm: hourly.variables(13)?.valuesArray(),
                soil_moisture_3_to_9cm: hourly.variables(14)?.valuesArray(),
                soil_moisture_9_to_27cm: hourly.variables(15)?.valuesArray(),
                soil_moisture_27_to_81cm: hourly.variables(16)?.valuesArray(),
                et0_fao_evapotranspiration: hourly.variables(17)?.valuesArray(),
                vapour_pressure_deficit: hourly.variables(18)?.valuesArray(),
                evapotranspiration: hourly.variables(19)?.valuesArray(),
            },
        };

        return weatherData;
    } catch (error) {
        console.error("Ошибка получения данных погоды:", error);
        return null;
    }
}