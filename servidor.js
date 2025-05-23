const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/info", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  let locationData = {};
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        locationData = {
          city: data.city,
          region: data.regionName,
          country_name: data.country
        };
      }
    }
  } catch (err) {
    console.error("Erro ao obter localização:", err);
  }

  // Enviar dados para Google Sheets
  const googleSheetsUrl = "https://script.google.com/macros/s/AKfycbwfjkrXSmTaez0AwFMjbbzAC3jl8JX-JYES2tWIOdZGmliO-l2mKLfVAktmytkIw9cI/exec";
  fetch(googleSheetsUrl, {
    method: "POST",
    body: JSON.stringify({
      ip,
      userAgent,
      city: locationData.city,
      region: locationData.regionName,
      country: locationData.country_name
    }),
    headers: { "Content-Type": "application/json" }
  }).catch(err => console.error("Erro ao enviar para Google Sheets:", err));

  res.json({
    ip,
    userAgent,
    location: locationData
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
