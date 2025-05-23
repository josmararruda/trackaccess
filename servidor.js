const fs = require("fs");
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  let locationData = {};
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    locationData = await response.json();
    const logLine = `[${new Date().toISOString()}] IP: ${ip}, Navegador: ${userAgent}, País: ${locationData.country_name || "desconhecido"}\n`;
    fs.appendFile("acessos.log", logLine, (err) => {
      if (err) console.error("Erro ao registrar acesso:", err);
    });

  } catch (err) {
    console.error("Erro ao obter localização:", err);
  }

  console.log("Novo acesso:");
  console.log("IP:", ip);
  console.log("Navegador:", userAgent);
  console.log("Localização:", locationData);

  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
