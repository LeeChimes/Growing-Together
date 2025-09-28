import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind,
  Eye,
  Sunrise,
  Sunset,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const WeatherService = ({ compact = false }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      // In production, this would call a real weather API
      // For demo, using enhanced mock data
      const mockWeather = {
        location: "Stafford Road Allotment",
        current: {
          temperature: 22,
          feels_like: 24,
          condition: "Partly Cloudy",
          humidity: 65,
          wind_speed: 5,
          wind_direction: "NE", 
          pressure: 1013,
          visibility: 10,
          uv_index: 6,
          sunrise: "06:24",
          sunset: "19:45"
        },
        forecast: [
          { 
            day: "Today", 
            high: 24, 
            low: 15, 
            condition: "Sunny",
            precipitation: 0,
            wind: 5,
            humidity: 60
          },
          { 
            day: "Tomorrow", 
            high: 21, 
            low: 13, 
            condition: "Cloudy",
            precipitation: 20,
            wind: 8,
            humidity: 70
          },
          { 
            day: "Thursday", 
            high: 19, 
            low: 11, 
            condition: "Light Rain",
            precipitation: 80,
            wind: 12,
            humidity: 85
          },
          { 
            day: "Friday", 
            high: 23, 
            low: 14, 
            condition: "Partly Cloudy",
            precipitation: 10,
            wind: 6,
            humidity: 55
          },
          { 
            day: "Saturday", 
            high: 26, 
            low: 16, 
            condition: "Sunny",
            precipitation: 0,
            wind: 4,
            humidity: 50
          }
        ],
        alerts: [
          {
            type: "garden_tip",
            severity: "info",
            message: "Perfect weather for watering - low wind and moderate humidity"
          }
        ],
        garden_advice: {
          watering: "Good conditions for deep watering - low evaporation expected",
          planting: "Excellent planting weather with stable temperatures",
          harvest: "Ideal harvesting conditions - dry weather ahead"
        }
      };

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setWeatherData(mockWeather);
    } catch (err) {
      setError("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      "Sunny": Sun,
      "Partly Cloudy": Cloud,
      "Cloudy": Cloud,
      "Light Rain": CloudRain,
      "Rain": CloudRain,
      "Overcast": Cloud
    };
    return icons[condition] || Cloud;
  };

  const getTrendIcon = (current, next) => {
    if (current < next) return TrendingUp;
    if (current > next) return TrendingDown;
    return Minus;
  };

  const getUVSeverity = (uvIndex) => {
    if (uvIndex <= 2) return { level: "Low", color: "text-green-600" };
    if (uvIndex <= 5) return { level: "Moderate", color: "text-yellow-600" };
    if (uvIndex <= 7) return { level: "High", color: "text-orange-600" };
    if (uvIndex <= 10) return { level: "Very High", color: "text-red-600" };
    return { level: "Extreme", color: "text-purple-600" };
  };

  if (loading) {
    return (
      <Card className={compact ? "weather-card" : ""}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-2" size={24} />
          <p className="text-red-600 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="weather-card" data-testid="weather-widget-compact">
        <CardContent className="p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{weatherData.current.temperature}°C</h3>
              <p className="text-sm opacity-90">{weatherData.current.condition}</p>
            </div>
            <div className="text-right">
              {React.createElement(getWeatherIcon(weatherData.current.condition), { 
                size: 32, 
                className: "weather-icon" 
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const uvInfo = getUVSeverity(weatherData.current.uv_index);

  return (
    <div className="space-y-6" data-testid="weather-service-full">
      {/* Current Weather */}
      <Card className="weather-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Cloud size={24} />
            <span>Current Weather - {weatherData.location}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-white space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="weather-icon mb-2">
                {React.createElement(getWeatherIcon(weatherData.current.condition), { 
                  size: 48 
                })}
              </div>
              <p className="text-3xl font-bold">{weatherData.current.temperature}°C</p>
              <p className="text-sm opacity-90">Feels like {weatherData.current.feels_like}°C</p>
              <p className="text-sm opacity-90">{weatherData.current.condition}</p>
            </div>
            
            <div className="text-center">
              <Droplets size={32} className="mx-auto mb-2" />
              <p className="text-xl font-semibold">{weatherData.current.humidity}%</p>
              <p className="text-sm opacity-90">Humidity</p>
            </div>
            
            <div className="text-center">
              <Wind size={32} className="mx-auto mb-2" />
              <p className="text-xl font-semibold">{weatherData.current.wind_speed} mph</p>
              <p className="text-sm opacity-90">{weatherData.current.wind_direction}</p>
            </div>
            
            <div className="text-center">
              <Eye size={32} className="mx-auto mb-2" />
              <p className="text-xl font-semibold">{weatherData.current.visibility} km</p>
              <p className="text-sm opacity-90">Visibility</p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-sm opacity-75">Pressure</p>
              <p className="font-semibold">{weatherData.current.pressure} mb</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-75">UV Index</p>
              <p className={`font-semibold ${uvInfo.color}`}>{weatherData.current.uv_index} ({uvInfo.level})</p>
            </div>
            <div className="text-center">
              <Sunrise size={16} className="inline mr-1" />
              <p className="text-sm">{weatherData.current.sunrise}</p>
            </div>
            <div className="text-center">
              <Sunset size={16} className="inline mr-1" />
              <p className="text-sm">{weatherData.current.sunset}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <TrendingUp size={20} />
            <span>5-Day Forecast</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weatherData.forecast.map((day, index) => {
              const WeatherIcon = getWeatherIcon(day.condition);
              const nextDay = weatherData.forecast[index + 1];
              const TrendIcon = nextDay ? getTrendIcon(day.high, nextDay.high) : Minus;
              
              return (
                <div key={day.day} className="text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <h4 className="font-semibold text-gray-800 mb-2">{day.day}</h4>
                  <WeatherIcon size={32} className="mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600 mb-2">{day.condition}</p>
                  
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <span className="font-bold text-gray-800">{day.high}°</span>
                    <span className="text-gray-500">/{day.low}°</span>
                    <TrendIcon size={12} className="text-gray-400 ml-1" />
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center justify-center space-x-1">
                      <Droplets size={10} />
                      <span>{day.precipitation}%</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <Wind size={10} />
                      <span>{day.wind}mph</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Garden Advice */}
      {weatherData.alerts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center space-x-2">
              <AlertTriangle size={20} />
              <span>Weather Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherData.alerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Badge variant="secondary" className="bg-blue-200 text-blue-800 mt-1">
                  {alert.type.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-blue-800 flex-1">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Garden Advice */}
      <Card className="bg-gradient-to-br from-green-50 to-yellow-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">🌱 Garden Advice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-green-700 mb-1">💧 Watering</h4>
            <p className="text-gray-700 text-sm">{weatherData.garden_advice.watering}</p>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 mb-1">🌱 Planting</h4>
            <p className="text-gray-700 text-sm">{weatherData.garden_advice.planting}</p>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 mb-1">🥕 Harvesting</h4>
            <p className="text-gray-700 text-sm">{weatherData.garden_advice.harvest}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherService;