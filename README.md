# AQ Earth

[![Netlify Status](https://api.netlify.com/api/v1/badges/fe4729f7-5164-4b6f-a709-042cef9dc693/deploy-status)](https://app.netlify.com/sites/aqearth/deploys)

AQ Earth is a data visualization of the world's air quality plotted onto a 3D globe. The user can click on a random location to get more detailed information around that coordinate. Data is being fetched from three different APIs: Open Weather Maps, IQ Air & World AQI.

## Tech

- Three JS
- GSAP
- GLSL
- Express JS
- TypeScript
- Chart JS

## Env

```
OPEN_WEATHER_API=""
WAQI_API=""
IQ_AIR_API=""
GEOAPIFY=""
```

## Start

1. `npm run serve`
2. Then go to http://localhost:3000/

## Dev
1. `npm un dev`
2. Then go to http://localhost:5500/

## Preview

![AQ Earth](./public/assets/screenshot_1.png)