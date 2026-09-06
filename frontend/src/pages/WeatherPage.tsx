import React, { useEffect, useState, useMemo } from 'react';
import { weatherService, habitationService } from '../services/api';
import { WeatherResponse, Habitation } from '../types';
import { 
  CloudRain, 
  CloudLightning, 
  Sun, 
  CloudDrizzle, 
  Wind, 
  Droplets, 
  Gauge, 
  Eye, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  MapPin, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Navigation,
  Crosshair,
  Building,
  Layers,
  Filter,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

interface DistrictRainfallItem {
  name: string;
  todayRainfallMm: number;
  rainfallCategory: 'Heavy' | 'Medium' | 'Light' | 'Clear';
  tempC: number;
  humidityPct: number;
  condition: string;
  conditionCode: string;
  hazardAlert: 'CRITICAL_RED' | 'ORANGE_WARNING' | 'MODERATE' | 'LOW';
}

interface StateData {
  stateName: string;
  districts: DistrictRainfallItem[];
}

const INDIAN_STATES_WEATHER_DATABASE: Record<string, StateData> = {
  'Uttarakhand': {
    stateName: 'Uttarakhand',
    districts: [
      { name: 'Chamoli', todayRainfallMm: 32.3, rainfallCategory: 'Medium', tempC: 28.1, humidityPct: 76, condition: 'Continuous Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Rudraprayag', todayRainfallMm: 68.5, rainfallCategory: 'Heavy', tempC: 25.4, humidityPct: 88, condition: 'Heavy Torrential Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Uttarkashi', todayRainfallMm: 54.2, rainfallCategory: 'Heavy', tempC: 24.8, humidityPct: 85, condition: 'Severe Monsoon Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Pithoragarh', todayRainfallMm: 45.0, rainfallCategory: 'Medium', tempC: 26.2, humidityPct: 80, condition: 'Moderate Rainfall', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Tehri Garhwal', todayRainfallMm: 28.4, rainfallCategory: 'Medium', tempC: 27.5, humidityPct: 74, condition: 'Intermittent Showers', conditionCode: 'showers', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Pauri Garhwal', todayRainfallMm: 18.2, rainfallCategory: 'Medium', tempC: 29.0, humidityPct: 70, condition: 'Passing Rain', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Dehradun', todayRainfallMm: 12.0, rainfallCategory: 'Light', tempC: 31.2, humidityPct: 65, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Bageshwar', todayRainfallMm: 58.0, rainfallCategory: 'Heavy', tempC: 23.5, humidityPct: 86, condition: 'Heavy Cloudburst Alert', conditionCode: 'thunderstorm', hazardAlert: 'CRITICAL_RED' },
      { name: 'Champawat', todayRainfallMm: 22.5, rainfallCategory: 'Medium', tempC: 27.0, humidityPct: 72, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'MODERATE' },
      { name: 'Nainital', todayRainfallMm: 14.5, rainfallCategory: 'Light', tempC: 24.0, humidityPct: 68, condition: 'Light Mountain Mist', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Haridwar', todayRainfallMm: 5.2, rainfallCategory: 'Light', tempC: 33.0, humidityPct: 58, condition: 'Partly Cloudy', conditionCode: 'sunny', hazardAlert: 'LOW' },
      { name: 'Udham Singh Nagar', todayRainfallMm: 3.0, rainfallCategory: 'Light', tempC: 34.1, humidityPct: 55, condition: 'Scattered Sunshine', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  },
  'Himachal Pradesh': {
    stateName: 'Himachal Pradesh',
    districts: [
      { name: 'Kullu (Manali)', todayRainfallMm: 78.4, rainfallCategory: 'Heavy', tempC: 21.0, humidityPct: 90, condition: 'Heavy Cloudburst & Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Mandi', todayRainfallMm: 62.1, rainfallCategory: 'Heavy', tempC: 23.4, humidityPct: 86, condition: 'Heavy Downpour Alert', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Shimla', todayRainfallMm: 42.0, rainfallCategory: 'Medium', tempC: 22.5, humidityPct: 82, condition: 'Continuous Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Kinnaur', todayRainfallMm: 55.6, rainfallCategory: 'Heavy', tempC: 18.2, humidityPct: 84, condition: 'Heavy Monsoon Storm', conditionCode: 'thunderstorm', hazardAlert: 'CRITICAL_RED' },
      { name: 'Lahaul & Spiti', todayRainfallMm: 12.0, rainfallCategory: 'Light', tempC: 14.0, humidityPct: 60, condition: 'Cold High Altitude Drizzle', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Chamba', todayRainfallMm: 38.5, rainfallCategory: 'Medium', tempC: 24.0, humidityPct: 78, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Kangra (Dharamshala)', todayRainfallMm: 48.2, rainfallCategory: 'Medium', tempC: 25.0, humidityPct: 80, condition: 'Heavy Showers', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Solan', todayRainfallMm: 24.0, rainfallCategory: 'Medium', tempC: 26.5, humidityPct: 72, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'MODERATE' },
      { name: 'Sirmaur', todayRainfallMm: 19.5, rainfallCategory: 'Medium', tempC: 27.2, humidityPct: 68, condition: 'Passing Showers', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Hamirpur', todayRainfallMm: 8.4, rainfallCategory: 'Light', tempC: 30.0, humidityPct: 62, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Una', todayRainfallMm: 4.2, rainfallCategory: 'Light', tempC: 32.5, humidityPct: 56, condition: 'Mostly Dry', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  },
  'Jammu & Kashmir': {
    stateName: 'Jammu & Kashmir',
    districts: [
      { name: 'Ramban', todayRainfallMm: 82.0, rainfallCategory: 'Heavy', tempC: 22.0, humidityPct: 92, condition: 'Heavy Landslide Trigger Rainfall', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Kishtwar', todayRainfallMm: 64.0, rainfallCategory: 'Heavy', tempC: 19.5, humidityPct: 88, condition: 'Torrential Thunderstorm', conditionCode: 'thunderstorm', hazardAlert: 'CRITICAL_RED' },
      { name: 'Doda', todayRainfallMm: 51.5, rainfallCategory: 'Heavy', tempC: 21.4, humidityPct: 85, condition: 'Heavy Mountain Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Poonch', todayRainfallMm: 58.2, rainfallCategory: 'Heavy', tempC: 23.0, humidityPct: 84, condition: 'Heavy Rainfall Alert', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Anantnag', todayRainfallMm: 46.5, rainfallCategory: 'Medium', tempC: 20.0, humidityPct: 78, condition: 'Moderate Continuous Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Baramulla', todayRainfallMm: 34.0, rainfallCategory: 'Medium', tempC: 21.2, humidityPct: 74, condition: 'Moderate Showers', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Reasi', todayRainfallMm: 38.0, rainfallCategory: 'Medium', tempC: 25.0, humidityPct: 76, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Srinagar', todayRainfallMm: 22.0, rainfallCategory: 'Medium', tempC: 22.8, humidityPct: 70, condition: 'Light to Moderate Rain', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Jammu', todayRainfallMm: 14.0, rainfallCategory: 'Light', tempC: 32.0, humidityPct: 62, condition: 'Light Rain', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'Kerala': {
    stateName: 'Kerala',
    districts: [
      { name: 'Wayanad', todayRainfallMm: 94.5, rainfallCategory: 'Heavy', tempC: 24.2, humidityPct: 95, condition: 'Extreme Monsoon Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Idukki', todayRainfallMm: 88.0, rainfallCategory: 'Heavy', tempC: 22.8, humidityPct: 94, condition: 'Heavy Hill Slope Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Kozhikode', todayRainfallMm: 65.2, rainfallCategory: 'Heavy', tempC: 27.5, humidityPct: 88, condition: 'Heavy Coastal Monsoon', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Malappuram', todayRainfallMm: 52.0, rainfallCategory: 'Heavy', tempC: 28.0, humidityPct: 86, condition: 'Heavy Rain Warning', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Pathanamthitta', todayRainfallMm: 42.5, rainfallCategory: 'Medium', tempC: 26.0, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Ernakulam (Kochi)', todayRainfallMm: 38.0, rainfallCategory: 'Medium', tempC: 29.0, humidityPct: 80, condition: 'Moderate Monsoon Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Thrissur', todayRainfallMm: 28.0, rainfallCategory: 'Medium', tempC: 28.5, humidityPct: 78, condition: 'Showers', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Palakkad', todayRainfallMm: 18.4, rainfallCategory: 'Medium', tempC: 30.0, humidityPct: 70, condition: 'Light Rain', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Thiruvananthapuram', todayRainfallMm: 12.0, rainfallCategory: 'Light', tempC: 30.5, humidityPct: 68, condition: 'Passing Rain', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'Meghalaya': {
    stateName: 'Meghalaya',
    districts: [
      { name: 'East Khasi Hills (Cherrapunji)', todayRainfallMm: 142.0, rainfallCategory: 'Heavy', tempC: 20.5, humidityPct: 98, condition: 'Extreme Record Torrential Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'West Jaintia Hills', todayRainfallMm: 98.4, rainfallCategory: 'Heavy', tempC: 21.0, humidityPct: 95, condition: 'Heavy Cloudburst Storm', conditionCode: 'thunderstorm', hazardAlert: 'CRITICAL_RED' },
      { name: 'Ri Bhoi', todayRainfallMm: 64.0, rainfallCategory: 'Heavy', tempC: 23.5, humidityPct: 90, condition: 'Heavy Monsoon Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'East Garo Hills', todayRainfallMm: 48.0, rainfallCategory: 'Medium', tempC: 25.0, humidityPct: 84, condition: 'Moderate Heavy Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'West Garo Hills', todayRainfallMm: 32.0, rainfallCategory: 'Medium', tempC: 26.8, humidityPct: 80, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'MODERATE' }
    ]
  },
  'Sikkim': {
    stateName: 'Sikkim',
    districts: [
      { name: 'North Sikkim (Mangan)', todayRainfallMm: 110.0, rainfallCategory: 'Heavy', tempC: 16.5, humidityPct: 96, condition: 'Severe Glacier Basin Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'East Sikkim (Gangtok)', todayRainfallMm: 68.0, rainfallCategory: 'Heavy', tempC: 19.2, humidityPct: 90, condition: 'Heavy Monsoon Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Pakyong', todayRainfallMm: 52.4, rainfallCategory: 'Heavy', tempC: 20.0, humidityPct: 88, condition: 'Heavy Rain Warning', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'South Sikkim (Namchi)', todayRainfallMm: 38.0, rainfallCategory: 'Medium', tempC: 21.5, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'West Sikkim (Gyalshing)', todayRainfallMm: 44.0, rainfallCategory: 'Medium', tempC: 18.5, humidityPct: 84, condition: 'Moderate Heavy Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' }
    ]
  },
  'Maharashtra': {
    stateName: 'Maharashtra',
    districts: [
      { name: 'Ratnagiri', todayRainfallMm: 92.4, rainfallCategory: 'Heavy', tempC: 27.0, humidityPct: 92, condition: 'Heavy Konkan Monsoon Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Raigad (Mahad)', todayRainfallMm: 85.0, rainfallCategory: 'Heavy', tempC: 26.5, humidityPct: 90, condition: 'Heavy Landslide Trigger Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Sindhudurg', todayRainfallMm: 78.0, rainfallCategory: 'Heavy', tempC: 27.5, humidityPct: 88, condition: 'Heavy Coastal Monsoon', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Satara (Mahabaleshwar)', todayRainfallMm: 54.0, rainfallCategory: 'Heavy', tempC: 22.0, humidityPct: 86, condition: 'Heavy Hill Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Pune (Ghats)', todayRainfallMm: 46.0, rainfallCategory: 'Medium', tempC: 25.8, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Mumbai', todayRainfallMm: 38.5, rainfallCategory: 'Medium', tempC: 29.5, humidityPct: 80, condition: 'Moderate Coastal Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Thane', todayRainfallMm: 42.0, rainfallCategory: 'Medium', tempC: 29.0, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Nagpur', todayRainfallMm: 12.0, rainfallCategory: 'Light', tempC: 33.5, humidityPct: 62, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'Assam': {
    stateName: 'Assam',
    districts: [
      { name: 'Dima Hasao (Haflong)', todayRainfallMm: 88.5, rainfallCategory: 'Heavy', tempC: 24.0, humidityPct: 94, condition: 'Heavy Landslide Hazard Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Cachar (Silchar)', todayRainfallMm: 76.0, rainfallCategory: 'Heavy', tempC: 26.0, humidityPct: 92, condition: 'Heavy Monsoon Flood Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Kamrup Metro (Guwahati)', todayRainfallMm: 34.0, rainfallCategory: 'Medium', tempC: 29.0, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Dibrugarh', todayRainfallMm: 42.0, rainfallCategory: 'Medium', tempC: 27.5, humidityPct: 84, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Jorhat', todayRainfallMm: 26.5, rainfallCategory: 'Medium', tempC: 28.0, humidityPct: 78, condition: 'Passing Showers', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Sonitpur', todayRainfallMm: 18.0, rainfallCategory: 'Medium', tempC: 30.0, humidityPct: 72, condition: 'Light Rain', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'Karnataka': {
    stateName: 'Karnataka',
    districts: [
      { name: 'Kodagu (Madikeri)', todayRainfallMm: 94.0, rainfallCategory: 'Heavy', tempC: 21.5, humidityPct: 95, condition: 'Heavy Western Ghats Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Uttara Kannada', todayRainfallMm: 82.0, rainfallCategory: 'Heavy', tempC: 26.0, humidityPct: 90, condition: 'Heavy Coastal Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Dakshina Kannada (Mangaluru)', todayRainfallMm: 78.0, rainfallCategory: 'Heavy', tempC: 27.2, humidityPct: 88, condition: 'Heavy Downpour Alert', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Chikmagalur', todayRainfallMm: 62.0, rainfallCategory: 'Heavy', tempC: 23.0, humidityPct: 86, condition: 'Heavy Hill Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Hassan', todayRainfallMm: 36.0, rainfallCategory: 'Medium', tempC: 25.5, humidityPct: 78, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Bengaluru', todayRainfallMm: 16.0, rainfallCategory: 'Light', tempC: 28.0, humidityPct: 65, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'West Bengal': {
    stateName: 'West Bengal',
    districts: [
      { name: 'Darjeeling', todayRainfallMm: 92.0, rainfallCategory: 'Heavy', tempC: 17.5, humidityPct: 94, condition: 'Heavy Hill Slope Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Kalimpong', todayRainfallMm: 86.4, rainfallCategory: 'Heavy', tempC: 18.2, humidityPct: 92, condition: 'Heavy Landslide Alert Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Jalpaiguri', todayRainfallMm: 58.0, rainfallCategory: 'Heavy', tempC: 27.0, humidityPct: 88, condition: 'Heavy Monsoon Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Alipurduar', todayRainfallMm: 64.0, rainfallCategory: 'Heavy', tempC: 26.5, humidityPct: 90, condition: 'Heavy Torrential Storm', conditionCode: 'thunderstorm', hazardAlert: 'CRITICAL_RED' },
      { name: 'Kolkata', todayRainfallMm: 18.0, rainfallCategory: 'Medium', tempC: 31.0, humidityPct: 75, condition: 'Light Rain', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'Tamil Nadu': {
    stateName: 'Tamil Nadu',
    districts: [
      { name: 'The Nilgiris (Ooty)', todayRainfallMm: 84.0, rainfallCategory: 'Heavy', tempC: 17.0, humidityPct: 92, condition: 'Heavy Western Ghats Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Kanyakumari', todayRainfallMm: 68.2, rainfallCategory: 'Heavy', tempC: 28.0, humidityPct: 88, condition: 'Heavy Coastal Monsoon', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Coimbatore', todayRainfallMm: 42.0, rainfallCategory: 'Medium', tempC: 27.5, humidityPct: 80, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Chennai', todayRainfallMm: 32.5, rainfallCategory: 'Medium', tempC: 32.0, humidityPct: 78, condition: 'Moderate Coastal Showers', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Madurai', todayRainfallMm: 14.0, rainfallCategory: 'Light', tempC: 34.0, humidityPct: 64, condition: 'Passing Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Salem', todayRainfallMm: 22.0, rainfallCategory: 'Medium', tempC: 31.0, humidityPct: 70, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'MODERATE' }
    ]
  },
  'Andhra Pradesh': {
    stateName: 'Andhra Pradesh',
    districts: [
      { name: 'Visakhapatnam', todayRainfallMm: 72.0, rainfallCategory: 'Heavy', tempC: 29.0, humidityPct: 86, condition: 'Heavy Bay of Bengal Monsoon', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Srikakulam', todayRainfallMm: 64.5, rainfallCategory: 'Heavy', tempC: 28.5, humidityPct: 88, condition: 'Heavy Downpour Warning', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'East Godavari', todayRainfallMm: 48.0, rainfallCategory: 'Medium', tempC: 30.0, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Chittoor (Tirupati)', todayRainfallMm: 28.0, rainfallCategory: 'Medium', tempC: 31.5, humidityPct: 74, condition: 'Intermittent Showers', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Vijayawada', todayRainfallMm: 18.0, rainfallCategory: 'Medium', tempC: 33.0, humidityPct: 70, condition: 'Light Rain', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'Telangana': {
    stateName: 'Telangana',
    districts: [
      { name: 'Adilabad', todayRainfallMm: 68.0, rainfallCategory: 'Heavy', tempC: 28.0, humidityPct: 88, condition: 'Heavy Torrential Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Khammam', todayRainfallMm: 52.4, rainfallCategory: 'Heavy', tempC: 29.0, humidityPct: 85, condition: 'Heavy Rain Warning', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Warangal', todayRainfallMm: 38.0, rainfallCategory: 'Medium', tempC: 30.2, humidityPct: 78, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Hyderabad', todayRainfallMm: 22.0, rainfallCategory: 'Medium', tempC: 31.0, humidityPct: 72, condition: 'Passing Urban Showers', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Karimnagar', todayRainfallMm: 16.5, rainfallCategory: 'Light', tempC: 32.5, humidityPct: 68, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'Gujarat': {
    stateName: 'Gujarat',
    districts: [
      { name: 'Gir Somnath (Junagadh)', todayRainfallMm: 88.0, rainfallCategory: 'Heavy', tempC: 27.5, humidityPct: 92, condition: 'Heavy Saurashtra Coastal Monsoon', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Dang (Saputara)', todayRainfallMm: 76.5, rainfallCategory: 'Heavy', tempC: 25.0, humidityPct: 90, condition: 'Heavy Hill Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Valsad', todayRainfallMm: 62.0, rainfallCategory: 'Heavy', tempC: 28.0, humidityPct: 86, condition: 'Heavy Rain Warning', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Surat', todayRainfallMm: 42.0, rainfallCategory: 'Medium', tempC: 30.0, humidityPct: 80, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Ahmedabad', todayRainfallMm: 12.0, rainfallCategory: 'Light', tempC: 33.5, humidityPct: 62, condition: 'Passing Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Kutch (Bhuj)', todayRainfallMm: 2.0, rainfallCategory: 'Clear', tempC: 35.0, humidityPct: 48, condition: 'Mostly Sunny', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  },
  'Rajasthan': {
    stateName: 'Rajasthan',
    districts: [
      { name: 'Sirohi (Mount Abu)', todayRainfallMm: 74.0, rainfallCategory: 'Heavy', tempC: 21.5, humidityPct: 90, condition: 'Heavy Aravalli Hill Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Udaipur', todayRainfallMm: 45.0, rainfallCategory: 'Medium', tempC: 28.0, humidityPct: 78, condition: 'Moderate Rainfall', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Kota', todayRainfallMm: 38.0, rainfallCategory: 'Medium', tempC: 30.5, humidityPct: 72, condition: 'Moderate Showers', conditionCode: 'rain', hazardAlert: 'MODERATE' },
      { name: 'Jaipur', todayRainfallMm: 14.0, rainfallCategory: 'Light', tempC: 33.0, humidityPct: 60, condition: 'Light Passing Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Jodhpur', todayRainfallMm: 4.0, rainfallCategory: 'Light', tempC: 36.0, humidityPct: 45, condition: 'Partly Sunny', conditionCode: 'sunny', hazardAlert: 'LOW' },
      { name: 'Jaisalmer', todayRainfallMm: 0.0, rainfallCategory: 'Clear', tempC: 38.2, humidityPct: 35, condition: 'Bright Desert Sun', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  },
  'Odisha': {
    stateName: 'Odisha',
    districts: [
      { name: 'Koraput', todayRainfallMm: 86.0, rainfallCategory: 'Heavy', tempC: 24.5, humidityPct: 94, condition: 'Heavy Tribal Belt Landslide Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Gajapati', todayRainfallMm: 78.4, rainfallCategory: 'Heavy', tempC: 25.8, humidityPct: 92, condition: 'Heavy Downpour Warning', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Mayurbhanj', todayRainfallMm: 58.0, rainfallCategory: 'Heavy', tempC: 27.0, humidityPct: 86, condition: 'Heavy Monsoon Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Puri', todayRainfallMm: 42.0, rainfallCategory: 'Medium', tempC: 29.5, humidityPct: 82, condition: 'Moderate Coastal Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Bhubaneswar', todayRainfallMm: 28.0, rainfallCategory: 'Medium', tempC: 31.0, humidityPct: 78, condition: 'Moderate Showers', conditionCode: 'rain', hazardAlert: 'MODERATE' }
    ]
  },
  'Bihar': {
    stateName: 'Bihar',
    districts: [
      { name: 'Kishanganj', todayRainfallMm: 82.5, rainfallCategory: 'Heavy', tempC: 26.0, humidityPct: 92, condition: 'Heavy Seemanchal Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'West Champaran', todayRainfallMm: 68.0, rainfallCategory: 'Heavy', tempC: 27.0, humidityPct: 88, condition: 'Heavy Foothills Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Muzaffarpur', todayRainfallMm: 38.0, rainfallCategory: 'Medium', tempC: 30.0, humidityPct: 80, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Patna', todayRainfallMm: 22.0, rainfallCategory: 'Medium', tempC: 32.0, humidityPct: 72, condition: 'Light to Moderate Rain', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Gaya', todayRainfallMm: 12.0, rainfallCategory: 'Light', tempC: 33.5, humidityPct: 65, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' }
    ]
  },
  'Jharkhand': {
    stateName: 'Jharkhand',
    districts: [
      { name: 'East Singhbhum (Jamshedpur)', todayRainfallMm: 64.0, rainfallCategory: 'Heavy', tempC: 27.5, humidityPct: 88, condition: 'Heavy Monsoon Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Ranchi', todayRainfallMm: 46.0, rainfallCategory: 'Medium', tempC: 26.0, humidityPct: 82, condition: 'Moderate Plateau Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Dhanbad', todayRainfallMm: 34.0, rainfallCategory: 'Medium', tempC: 29.0, humidityPct: 78, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'MODERATE' },
      { name: 'Hazaribagh', todayRainfallMm: 28.0, rainfallCategory: 'Medium', tempC: 27.2, humidityPct: 75, condition: 'Intermittent Showers', conditionCode: 'showers', hazardAlert: 'MODERATE' }
    ]
  },
  'Uttar Pradesh': {
    stateName: 'Uttar Pradesh',
    districts: [
      { name: 'Gorakhpur', todayRainfallMm: 68.0, rainfallCategory: 'Heavy', tempC: 28.0, humidityPct: 88, condition: 'Heavy Terai Monsoon Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Lakhimpur Kheri', todayRainfallMm: 56.5, rainfallCategory: 'Heavy', tempC: 27.5, humidityPct: 86, condition: 'Heavy Downpour Warning', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Varanasi', todayRainfallMm: 32.0, rainfallCategory: 'Medium', tempC: 31.0, humidityPct: 76, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Lucknow', todayRainfallMm: 22.0, rainfallCategory: 'Medium', tempC: 32.0, humidityPct: 70, condition: 'Passing Showers', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Kanpur', todayRainfallMm: 16.0, rainfallCategory: 'Light', tempC: 33.0, humidityPct: 66, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Agra', todayRainfallMm: 8.0, rainfallCategory: 'Light', tempC: 34.5, humidityPct: 58, condition: 'Mostly Cloudy', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  },
  'Punjab': {
    stateName: 'Punjab',
    districts: [
      { name: 'Pathankot', todayRainfallMm: 62.0, rainfallCategory: 'Heavy', tempC: 26.5, humidityPct: 86, condition: 'Heavy Foothill Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Hoshiarpur', todayRainfallMm: 44.0, rainfallCategory: 'Medium', tempC: 28.0, humidityPct: 80, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Amritsar', todayRainfallMm: 22.0, rainfallCategory: 'Medium', tempC: 31.0, humidityPct: 70, condition: 'Light to Moderate Rain', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Ludhiana', todayRainfallMm: 14.0, rainfallCategory: 'Light', tempC: 32.5, humidityPct: 65, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Jalandhar', todayRainfallMm: 10.0, rainfallCategory: 'Light', tempC: 33.0, humidityPct: 62, condition: 'Passing Cloud', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  },
  'Haryana': {
    stateName: 'Haryana',
    districts: [
      { name: 'Panchkula', todayRainfallMm: 58.0, rainfallCategory: 'Heavy', tempC: 27.0, humidityPct: 84, condition: 'Heavy Shivalik Foothill Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Ambala', todayRainfallMm: 36.0, rainfallCategory: 'Medium', tempC: 29.0, humidityPct: 78, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Gurgaon (Gurugram)', todayRainfallMm: 18.0, rainfallCategory: 'Medium', tempC: 32.0, humidityPct: 68, condition: 'Light Rain Showers', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Faridabad', todayRainfallMm: 12.0, rainfallCategory: 'Light', tempC: 33.0, humidityPct: 64, condition: 'Light Drizzle', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Hisar', todayRainfallMm: 4.0, rainfallCategory: 'Light', tempC: 35.0, humidityPct: 52, condition: 'Partly Sunny', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  },
  'Goa': {
    stateName: 'Goa',
    districts: [
      { name: 'North Goa (Panaji)', todayRainfallMm: 88.0, rainfallCategory: 'Heavy', tempC: 27.0, humidityPct: 92, condition: 'Heavy Coastal Monsoon Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'South Goa (Margao)', todayRainfallMm: 82.5, rainfallCategory: 'Heavy', tempC: 26.8, humidityPct: 90, condition: 'Heavy Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' }
    ]
  },
  'Arunachal Pradesh': {
    stateName: 'Arunachal Pradesh',
    districts: [
      { name: 'Tawang', todayRainfallMm: 95.0, rainfallCategory: 'Heavy', tempC: 15.0, humidityPct: 96, condition: 'Heavy High Altitude Landslide Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'West Kameng', todayRainfallMm: 84.0, rainfallCategory: 'Heavy', tempC: 18.0, humidityPct: 92, condition: 'Heavy Torrential Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Itanagar (Papum Pare)', todayRainfallMm: 62.0, rainfallCategory: 'Heavy', tempC: 24.5, humidityPct: 88, condition: 'Heavy Monsoon Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Changlang', todayRainfallMm: 48.0, rainfallCategory: 'Medium', tempC: 23.0, humidityPct: 85, condition: 'Moderate Heavy Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' }
    ]
  },
  'Manipur': {
    stateName: 'Manipur',
    districts: [
      { name: 'Churachandpur', todayRainfallMm: 88.0, rainfallCategory: 'Heavy', tempC: 22.0, humidityPct: 92, condition: 'Heavy Hill Slope Rainfall', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Tamenglong', todayRainfallMm: 92.4, rainfallCategory: 'Heavy', tempC: 21.0, humidityPct: 94, condition: 'Severe Landslide Hazard Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Ukhrul', todayRainfallMm: 64.0, rainfallCategory: 'Heavy', tempC: 20.0, humidityPct: 88, condition: 'Heavy Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Imphal West', todayRainfallMm: 34.0, rainfallCategory: 'Medium', tempC: 26.0, humidityPct: 80, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' }
    ]
  },
  'Mizoram': {
    stateName: 'Mizoram',
    districts: [
      { name: 'Lunglei', todayRainfallMm: 98.0, rainfallCategory: 'Heavy', tempC: 21.5, humidityPct: 96, condition: 'Extreme Hill Landslide Trigger Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Aizawl', todayRainfallMm: 82.0, rainfallCategory: 'Heavy', tempC: 22.5, humidityPct: 92, condition: 'Heavy Monsoon Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Champhai', todayRainfallMm: 68.0, rainfallCategory: 'Heavy', tempC: 20.0, humidityPct: 88, condition: 'Heavy Torrential Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' }
    ]
  },
  'Nagaland': {
    stateName: 'Nagaland',
    districts: [
      { name: 'Kohima', todayRainfallMm: 78.0, rainfallCategory: 'Heavy', tempC: 21.0, humidityPct: 92, condition: 'Heavy Hill Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Mokokchung', todayRainfallMm: 64.0, rainfallCategory: 'Heavy', tempC: 22.0, humidityPct: 88, condition: 'Heavy Monsoon Downpour', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Dimapur', todayRainfallMm: 38.0, rainfallCategory: 'Medium', tempC: 27.5, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' }
    ]
  },
  'Tripura': {
    stateName: 'Tripura',
    districts: [
      { name: 'Dhalai', todayRainfallMm: 82.0, rainfallCategory: 'Heavy', tempC: 25.0, humidityPct: 92, condition: 'Heavy Torrential Monsoon', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'South Tripura', todayRainfallMm: 68.5, rainfallCategory: 'Heavy', tempC: 26.0, humidityPct: 88, condition: 'Heavy Rain Alert', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'West Tripura (Agartala)', todayRainfallMm: 36.0, rainfallCategory: 'Medium', tempC: 28.5, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' }
    ]
  },
  'Chhattisgarh': {
    stateName: 'Chhattisgarh',
    districts: [
      { name: 'Bastar (Jagdalpur)', todayRainfallMm: 76.0, rainfallCategory: 'Heavy', tempC: 26.5, humidityPct: 90, condition: 'Heavy Forest Belt Monsoon', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Surguja', todayRainfallMm: 54.0, rainfallCategory: 'Heavy', tempC: 25.8, humidityPct: 86, condition: 'Heavy Rain Warning', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Raipur', todayRainfallMm: 32.0, rainfallCategory: 'Medium', tempC: 30.0, humidityPct: 78, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Bilaspur', todayRainfallMm: 24.0, rainfallCategory: 'Medium', tempC: 29.5, humidityPct: 76, condition: 'Intermittent Showers', conditionCode: 'showers', hazardAlert: 'MODERATE' }
    ]
  },
  'Madhya Pradesh': {
    stateName: 'Madhya Pradesh',
    districts: [
      { name: 'Narmadapuram (Pachmarhi)', todayRainfallMm: 78.0, rainfallCategory: 'Heavy', tempC: 22.0, humidityPct: 90, condition: 'Heavy Satpura Hill Torrential Rain', conditionCode: 'heavy_rain', hazardAlert: 'CRITICAL_RED' },
      { name: 'Jabalpur', todayRainfallMm: 48.0, rainfallCategory: 'Medium', tempC: 28.0, humidityPct: 82, condition: 'Moderate Rain', conditionCode: 'rain', hazardAlert: 'ORANGE_WARNING' },
      { name: 'Bhopal', todayRainfallMm: 26.0, rainfallCategory: 'Medium', tempC: 30.0, humidityPct: 74, condition: 'Light to Moderate Rain', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Indore', todayRainfallMm: 18.0, rainfallCategory: 'Medium', tempC: 29.5, humidityPct: 70, condition: 'Passing Showers', conditionCode: 'showers', hazardAlert: 'LOW' },
      { name: 'Gwalior', todayRainfallMm: 8.0, rainfallCategory: 'Light', tempC: 34.0, humidityPct: 60, condition: 'Mostly Cloudy', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  },
  'Ladakh': {
    stateName: 'Ladakh',
    districts: [
      { name: 'Kargil', todayRainfallMm: 14.0, rainfallCategory: 'Light', tempC: 15.0, humidityPct: 58, condition: 'Cold High Altitude Drizzle', conditionCode: 'showers', hazardAlert: 'MODERATE' },
      { name: 'Leh', todayRainfallMm: 4.0, rainfallCategory: 'Light', tempC: 16.5, humidityPct: 45, condition: 'High Altitude Cool Breeze', conditionCode: 'sunny', hazardAlert: 'LOW' }
    ]
  }
};

export const WeatherPage: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('Uttarakhand');
  const [district, setDistrict] = useState<string>('Chamoli');
  const [districtRainFilter, setDistrictRainFilter] = useState<'All' | 'Heavy' | 'Medium' | 'Light' | 'Clear'>('All');
  
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [selectedHabitationId, setSelectedHabitationId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadWeather = async (targetDistrict: string) => {
    setLoading(true);
    try {
      const data = await weatherService.getForecast(targetDistrict);
      setWeatherData(data);
    } catch (err) {
      console.error("Failed to load weather data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(district);
  }, [district]);

  useEffect(() => {
    const loadHabitations = async () => {
      try {
        const res = await habitationService.getAll({ limit: 100 });
        setHabitations(res);
      } catch (err) {
        console.error("Failed to load habitations:", err);
      }
    };
    loadHabitations();
  }, []);

  // When selected state changes, set default district to first district in that state
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const stateDb = INDIAN_STATES_WEATHER_DATABASE[newState];
    if (stateDb && stateDb.districts.length > 0) {
      const firstDist = stateDb.districts[0].name;
      setDistrict(firstDist);
      setSelectedHabitationId('');
    }
  };

  const [detectedLocationName, setDetectedLocationName] = useState<string>('');

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setDetectedCoords({ lat, lon });

        let placeName = '';
        let stateNameDetected = '';

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const geoData = await geoRes.json();
          if (geoData && geoData.address) {
            stateNameDetected = geoData.address.state || geoData.address.region || '';
            placeName = geoData.address.state_district || geoData.address.county || geoData.address.city || geoData.address.town || geoData.address.suburb || geoData.address.village || '';
          }
        } catch (errGeo) {
          console.warn("Reverse geocode lookup warning:", errGeo);
        }

        const displayLabel = placeName 
          ? `Your Location: ${placeName} (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`
          : `Your Location (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;

        setDetectedLocationName(placeName || `GPS (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`);

        try {
          const data = await weatherService.getByCoords(lat, lon, displayLabel);
          setWeatherData(data);
          setSelectedHabitationId('');
          setDistrict(displayLabel);
          
          // Smart State Auto-Match
          if (stateNameDetected) {
            const matchedKey = Object.keys(INDIAN_STATES_WEATHER_DATABASE).find(
              s => s.toLowerCase() === stateNameDetected.toLowerCase() || 
                   stateNameDetected.toLowerCase().includes(s.toLowerCase()) || 
                   s.toLowerCase().includes(stateNameDetected.toLowerCase())
            );
            if (matchedKey) {
              setSelectedState(matchedKey);
            }
          } else {
            // Coordinate Bounding Fallback Match
            if (lat > 29.5 && lat < 31.5 && lon > 77.5 && lon < 80.5) setSelectedState('Uttarakhand');
            else if (lat > 31.0 && lat < 33.5 && lon > 75.5 && lon < 79.0) setSelectedState('Himachal Pradesh');
            else if (lat > 8.0 && lat < 13.0 && lon > 76.0 && lon < 79.0) setSelectedState('Kerala');
            else if (lat > 8.0 && lat < 14.0 && lon > 77.0 && lon < 80.5) setSelectedState('Tamil Nadu');
            else if (lat > 15.0 && lat < 22.0 && lon > 72.5 && lon < 81.0) setSelectedState('Maharashtra');
            else if (lat > 21.5 && lat < 27.5 && lon > 85.5 && lon < 89.9) setSelectedState('West Bengal');
            else if (lat > 11.5 && lat < 18.5 && lon > 74.0 && lon < 78.5) setSelectedState('Karnataka');
          }
        } catch (err) {
          console.error("Failed to fetch GPS weather:", err);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.warn("Geolocation permission error or unavailable:", error);
        setDetectingLocation(false);
        alert("Location access was denied or unavailable. Showing Chamoli regional weather.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleHabitationSelect = async (habId: string) => {
    setSelectedHabitationId(habId);
    if (!habId) return;
    setLoading(true);
    try {
      const data = await weatherService.getHabitationWeather(habId);
      setWeatherData(data);
      if (data.district) {
        setDistrict(data.district);
      }
    } catch (err) {
      console.error("Failed to load localized habitation weather:", err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (code: string, className: string = "h-6 w-6") => {
    switch (code) {
      case 'thunderstorm':
        return <CloudLightning className={`${className} text-purple-400 animate-pulse`} />;
      case 'heavy_rain':
        return <CloudRain className={`${className} text-cyan-400 animate-bounce`} />;
      case 'rain':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'showers':
        return <CloudDrizzle className={`${className} text-teal-400`} />;
      case 'sunny':
        return <Sun className={`${className} text-amber-400`} />;
      default:
        return <Wind className={`${className} text-slate-400`} />;
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL_RED':
      case 'Red Alert':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-950/90 border border-red-800 px-2 py-0.5 text-[10px] font-black text-red-400 uppercase tracking-wider glow-red">
            <ShieldAlert className="h-3 w-3 text-red-400 animate-ping" />
            Red Alert (High Trigger)
          </span>
        );
      case 'ORANGE_WARNING':
      case 'Orange Warning':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-950/90 border border-orange-800 px-2 py-0.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
            <AlertTriangle className="h-3 w-3 text-orange-400" />
            Orange Warning
          </span>
        );
      case 'MODERATE':
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/90 border border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <TrendingUp className="h-3 w-3 text-amber-400" />
            Moderate Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/90 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Normal / Low Risk
          </span>
        );
    }
  };

  const activeStateData = useMemo(() => {
    return INDIAN_STATES_WEATHER_DATABASE[selectedState] || INDIAN_STATES_WEATHER_DATABASE['Uttarakhand'];
  }, [selectedState]);

  const filteredStateDistricts = useMemo(() => {
    if (districtRainFilter === 'All') return activeStateData.districts;
    return activeStateData.districts.filter((d) => d.rainfallCategory === districtRainFilter);
  }, [activeStateData, districtRainFilter]);

  const stateSummary = useMemo(() => {
    const heavyCount = activeStateData.districts.filter(d => d.rainfallCategory === 'Heavy').length;
    const mediumCount = activeStateData.districts.filter(d => d.rainfallCategory === 'Medium').length;
    const lightCount = activeStateData.districts.filter(d => d.rainfallCategory === 'Light').length;
    const totalStateRainfall = activeStateData.districts.reduce((acc, d) => acc + d.todayRainfallMm, 0);
    return { heavyCount, mediumCount, lightCount, totalStateRainfall };
  }, [activeStateData]);

  const current = weatherData?.current;
  const forecast = weatherData?.forecast || [];

  // Chart data formatting
  const chartData = forecast.map(f => ({
    day: f.day_name + ' ' + f.formatted_date,
    Rainfall_mm: f.rainfall_expected_mm,
    Precipitation_Prob: f.precipitation_probability_pct,
    Temp_Max: f.temp_max_c,
    Temp_Min: f.temp_min_c,
  }));

  return (
    <div className="space-y-6 p-6 pb-24">
      {/* Top Header Bar with Live Clock, GPS Detect Button, and State Selection */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 shadow-md">
              <CloudRain className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Weather & Atmospheric Telemetry Studio</h2>
            <span className="rounded-md bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              Multi-State Rainfall Prediction Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time atmospheric monitoring, GPS current location detection, state-wide medium/heavy district rainfall predictions, and 7-day forecast analytics.
          </p>
        </div>

        {/* Live Digital Clock Badge & GPS Detect Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Detect My Current Location Button */}
          <button
            onClick={handleDetectCurrentLocation}
            disabled={detectingLocation}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 disabled:opacity-50 ring-1 ring-white/20"
          >
            <Navigation className={`h-4 w-4 text-cyan-300 ${detectingLocation ? 'animate-spin' : ''}`} />
            <span>{detectingLocation ? 'Locating GPS Position...' : 'Detect My Location Weather'}</span>
          </button>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-xs text-slate-300 shadow-lg">
            <Clock className="h-4 w-4 text-cyan-400 animate-pulse-subtle" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live System Time</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-white text-xs">
                <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-cyan-400">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => loadWeather(district)}
            title="Refresh Telemetry"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Forecast</span>
          </button>
        </div>
      </div>

      {/* STATE SELECTOR & DISTRICT WEATHER TOOLBAR */}
      <div className="glass-card p-4 border border-slate-800/80 space-y-3">
        {/* State Selection Dropdown & Chips */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Select State Weather Region:</span>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="rounded-lg border border-cyan-500/40 bg-slate-950 px-3 py-1.5 text-xs font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none ring-1 ring-cyan-500/20"
            >
              {Object.keys(INDIAN_STATES_WEATHER_DATABASE).map((st) => (
                <option key={st} value={st}>{st} State</option>
              ))}
            </select>
          </div>

          {/* Quick State Chips */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto p-1 rounded-lg bg-slate-950/40 border border-slate-800/60 max-w-full lg:max-w-2xl">
            {Object.keys(INDIAN_STATES_WEATHER_DATABASE).map((st) => (
              <button
                key={st}
                onClick={() => handleStateChange(st)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all shrink-0 ${
                  selectedState === st
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Selected State District Buttons & Location Picker */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span>{selectedState} Districts:</span>
            </span>
            {activeStateData.districts.map((d) => (
              <button
                key={d.name}
                onClick={() => {
                  setSelectedHabitationId('');
                  setDistrict(d.name);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  district === d.name && !selectedHabitationId
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20 font-bold'
                    : 'bg-slate-950/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{d.name}</span>
                {d.rainfallCategory === 'Heavy' && (
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" title="Heavy Rain Alert" />
                )}
                {d.rainfallCategory === 'Medium' && (
                  <span className="h-2 w-2 rounded-full bg-orange-400" title="Medium Rain Warning" />
                )}
              </button>
            ))}
          </div>

          {/* Particular Location Search Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <Crosshair className="h-4 w-4 text-cyan-400" />
            <select
              value={selectedHabitationId}
              onChange={(e) => handleHabitationSelect(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-cyan-500 focus:outline-none max-w-xs"
            >
              <option value="">-- Choose Particular Village / Spot Weather --</option>
              {habitations.map((h) => (
                <option key={h.id} value={h.id}>
                  📍 {h.name} ({h.district} District - Elev. {h.elevation_m}m)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STATE-WIDE DISTRICT RAINFALL INTENSITY & HAZARD PREDICTION MATRIX */}
      <div className="glass-card p-6 border-l-4 border-l-cyan-500 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-extrabold text-white">
                {selectedState} State — Today's District Rainfall Prediction Matrix
              </h3>
              <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                {activeStateData.districts.length} Districts Analyzed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live district rain classification (Heavy, Medium, Light, Clear) to identify high-vulnerability hazard zones across {selectedState}.
            </p>
          </div>

          {/* Rain Intensity Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter Rain Level:</span>
            {[
              { id: 'All', label: 'All Districts' },
              { id: 'Heavy', label: '🔴 Heavy (>50mm)' },
              { id: 'Medium', label: '🟠 Medium (15-50mm)' },
              { id: 'Light', label: '🟡 Light (1-15mm)' },
              { id: 'Clear', label: '🟢 Clear (<1mm)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDistrictRainFilter(f.id as any)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                  districtRainFilter === f.id
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* State Summary Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-xl bg-slate-950 p-3 border border-red-900/50 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Heavy Rain Alert</span>
              <span className="text-lg font-black text-red-400">{stateSummary.heavyCount} Districts</span>
            </div>
            <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-orange-900/50 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Medium Rain Warning</span>
              <span className="text-lg font-black text-orange-400">{stateSummary.mediumCount} Districts</span>
            </div>
            <span className="h-3 w-3 rounded-full bg-orange-400" />
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Light Rain / Drizzle</span>
              <span className="text-lg font-black text-yellow-400">{stateSummary.lightCount} Districts</span>
            </div>
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">State Avg Rainfall</span>
              <span className="text-lg font-black text-cyan-400">{(stateSummary.totalStateRainfall / activeStateData.districts.length).toFixed(1)} mm</span>
            </div>
            <CloudRain className="h-5 w-5 text-cyan-400" />
          </div>
        </div>

        {/* District Matrix Cards Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredStateDistricts.map((item) => {
            const isSelected = district === item.name;
            return (
              <div
                key={item.name}
                onClick={() => {
                  setSelectedHabitationId('');
                  setDistrict(item.name);
                }}
                className={`rounded-2xl p-4 border cursor-pointer transition-all duration-200 hover:-translate-y-1 space-y-2.5 ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/80 via-slate-900 to-slate-950 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                    : item.rainfallCategory === 'Heavy'
                    ? 'bg-red-950/20 border-red-800/60 hover:border-red-500 hover:bg-red-900/30'
                    : item.rainfallCategory === 'Medium'
                    ? 'bg-orange-950/20 border-orange-800/60 hover:border-orange-500 hover:bg-orange-900/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                    </h4>
                    <span className="text-[10px] text-slate-400">{selectedState} State</span>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                      item.rainfallCategory === 'Heavy'
                        ? 'bg-red-950 text-red-400 border-red-700 animate-pulse'
                        : item.rainfallCategory === 'Medium'
                        ? 'bg-orange-950 text-orange-400 border-orange-700'
                        : item.rainfallCategory === 'Light'
                        ? 'bg-yellow-950 text-yellow-300 border-yellow-800'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}
                  >
                    {item.rainfallCategory} Rain
                  </span>
                </div>

                {/* Rain Amount Hero Metric */}
                <div className="flex items-baseline justify-between bg-slate-950/90 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px]">Today's Predicted Rain:</span>
                  <span
                    className={`text-base font-black ${
                      item.rainfallCategory === 'Heavy'
                        ? 'text-red-400'
                        : item.rainfallCategory === 'Medium'
                        ? 'text-orange-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {item.todayRainfallMm} mm
                  </span>
                </div>

                {/* Temp & Humidity */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-slate-900/60 p-1.5 rounded-lg text-center border border-slate-800">
                    <span className="text-slate-400 block">Temp</span>
                    <span className="font-bold text-amber-400">{item.tempC}°C</span>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg text-center border border-slate-800">
                    <span className="text-slate-400 block">Humidity</span>
                    <span className="font-bold text-purple-300">{item.humidityPct}%</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-300 truncate pt-1 border-t border-slate-800/60 flex items-center gap-1">
                  <CloudRain className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{item.condition}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Current Atmospheric Telemetry Cards */}
      {current && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Weather Card */}
          <div className="glass-card p-6 border-l-4 border-l-cyan-500 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-cyan-950/30 lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Atmospheric Telemetry</span>
                <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                  {current.district}
                </span>
                <span className="rounded-full bg-indigo-950 border border-indigo-800 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                  {selectedState} Region
                </span>
                {detectedCoords && (
                  <span className="rounded-full bg-gradient-to-r from-blue-900 to-cyan-900 border border-cyan-500/50 px-2.5 py-0.5 text-[10px] font-extrabold text-cyan-300 flex items-center gap-1 shadow-sm">
                    <Navigation className="h-3 w-3 text-cyan-300 animate-pulse" />
                    <span>GPS Active ({detectedCoords.lat.toFixed(3)}°N, {detectedCoords.lon.toFixed(3)}°E)</span>
                  </span>
                )}
              </div>
              <div>{getAlertBadge(current.hazard_alert_level)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-cyan-950/60 border border-cyan-800/60 shadow-inner">
                  {getWeatherIcon(current.condition_code, "h-12 w-12")}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tight text-white">{current.temp_c}°C</span>
                    <span className="text-xs text-slate-400 font-medium">Feels like {current.temp_feels_like_c}°C</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-cyan-300">{current.condition}</p>
                  <p className="text-[11px] text-slate-400">Recorded: {current.formatted_datetime}</p>
                </div>
              </div>

              {/* Quick Gauges Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase">24h Rainfall</span>
                  </div>
                  <span className="text-lg font-black text-white">{current.rainfall_24h_mm} mm</span>
                </div>

                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Gauge className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-[10px] font-bold uppercase">Humidity</span>
                  </div>
                  <span className="text-lg font-black text-white">{current.humidity_pct}%</span>
                </div>

                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Wind className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase">Wind Vector</span>
                  </div>
                  <span className="text-lg font-black text-white">{current.wind_speed_kmh} km/h {current.wind_direction}</span>
                </div>

                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Eye className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase">Atm. Pressure</span>
                  </div>
                  <span className="text-lg font-black text-white">{current.pressure_hpa} hPa</span>
                </div>
              </div>
            </div>

            {/* Soil Saturation Hazard Trigger Progress Bar */}
            <div className="border-t border-slate-800/80 pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Slope Soil Moisture Saturation Index:</span>
                <span className="font-bold text-cyan-300">{current.soil_saturation_pct}% Saturation</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    current.soil_saturation_pct >= 80
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : current.soil_saturation_pct >= 60
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                  }`}
                  style={{ width: `${current.soil_saturation_pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Weekly Summary Widget */}
          <div className="glass-card p-6 border border-slate-800/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">7-Day Monsoon Summary</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-950/90 p-3.5 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">7-Day Total Precipitation:</span>
                  <span className="text-xl font-black text-cyan-400">{weatherData?.weekly_total_rainfall_mm} mm</span>
                </div>

                <div className="rounded-xl bg-slate-950/90 p-3.5 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Critical Trigger Days:</span>
                  <span className="text-xl font-black text-red-400">{weatherData?.critical_hazard_days_count} Days</span>
                </div>

                <div className="rounded-xl bg-slate-950/90 p-3.5 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">UV Index & Visibility:</span>
                  <span className="font-bold text-white">UV {current.uv_index} | {current.visibility_km} km</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-cyan-950/40 p-3 border border-cyan-800/60 text-xs text-cyan-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <ShieldAlert className="h-4 w-4" />
                <span>Geological Advisory</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Slope soil saturation exceeding 75% coupled with continuous rainfall over 40mm/day elevates landslide susceptibility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Weekly Weather Forecast Grid */}
      <div className="glass-card p-6 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <span>7-Day Whole Week Weather Condition & Hazard Forecast ({district}, {selectedState})</span>
            </h3>
            <p className="text-xs text-slate-400">Daily forecast breakdown with expected rainfall mm, min/max temperatures, and landslide trigger alerts.</p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 border border-slate-700">
            {forecast.length} Days Outlook
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecast.map((day, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                day.is_today
                  ? 'bg-gradient-to-b from-cyan-950/80 via-slate-900 to-slate-950 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/90 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Day & Date Header */}
              <div className="text-center border-b border-slate-800/80 pb-2">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-extrabold text-white">{day.day_name}</span>
                  {day.is_today && (
                    <span className="rounded bg-cyan-600 px-1 py-0.2 text-[8px] font-black uppercase text-white">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">{day.formatted_date}</span>
              </div>

              {/* Weather Icon & Condition */}
              <div className="flex flex-col items-center text-center space-y-1 my-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
                  {getWeatherIcon(day.condition_code, "h-7 w-7")}
                </div>
                <span className="text-[11px] font-bold text-slate-200 line-clamp-2 min-h-[32px] flex items-center justify-center text-center" title={day.condition}>
                  {day.condition}
                </span>
              </div>

              {/* Temperature High / Low */}
              <div className="flex items-center justify-center gap-2 text-xs font-bold bg-slate-900/60 py-1.5 px-2 rounded-lg border border-slate-800/80">
                <span className="text-amber-400 font-extrabold">{day.temp_max_c}°C</span>
                <span className="text-slate-600">/</span>
                <span className="text-cyan-400 font-extrabold">{day.temp_min_c}°C</span>
              </div>

              {/* Expected Rainfall & Probability */}
              <div className="rounded-xl bg-slate-900/90 p-2 border border-slate-800 text-[10px] space-y-1">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Precipitation:</span>
                  <span className="font-bold text-cyan-400">{day.rainfall_expected_mm} mm</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Prob:</span>
                  <span className="font-bold text-purple-400">{day.precipitation_probability_pct}%</span>
                </div>
              </div>

              {/* Hazard Warning Badge */}
              <div className="text-center pt-1">
                {getAlertBadge(day.landslide_risk_level)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Rainfall & Temperature Trend Chart */}
      <div className="glass-card p-6 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <span>7-Day Rainfall Accumulation vs Temperature Trend ({district}, {selectedState})</span>
            </h3>
            <p className="text-xs text-slate-400">Comparative analysis of daily rainfall (mm) and temperature extremes over the upcoming week.</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="left" stroke="#06b6d4" fontSize={11} label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar yAxisId="left" dataKey="Rainfall_mm" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Expected Rainfall (mm)" />
              <Line yAxisId="right" type="monotone" dataKey="Temp_Max" stroke="#f59e0b" strokeWidth={2.5} name="Max Temp (°C)" dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="Temp_Min" stroke="#3b82f6" strokeWidth={2.5} name="Min Temp (°C)" dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
