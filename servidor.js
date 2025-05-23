// servidor.js
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
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
    } else {
      const errorText = await response.text();
      console.error("API retornou erro:", errorText);
    }
  } catch (err) {
    console.error("Erro ao obter localização:", err);
  }

  // Registrar dados em um log
  const logLine = `[${new Date().toISOString()}] IP: ${ip}, Navegador: ${userAgent}, Cidade: ${locationData.city || 'Desconhecida'}, Região: ${locationData.region || 'Desconhecida'}, País: ${locationData.country_name || 'Desconhecido'}\n`;
  fs.appendFile("acessos.log", logLine, (err) => {
    if (err) console.error("Erro ao registrar no log:", err);
  });

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

// public/index.html
/*
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página de Rastreamento</title>
</head>
<body>
  <h1>Bem-vindo!</h1>
  <p>Essa página registra seu acesso para fins de demonstração.</p>

  <h2>Suas informações:</h2>
  <ul id="info-list">
    <li>IP: carregando...</li>
    <li>Localização: carregando...</li>
    <li>Navegador: carregando...</li>
  </ul>

  <script>
    fetch('/info')
      .then(res => res.json())
      .then(data => {
        document.getElementById('info-list').innerHTML = `
          <li><strong>IP:</strong> ${data.ip}</li>
          <li><strong>Localização:</strong> ${data.location.city || 'Desconhecida'}, ${data.location.region || ''} - ${data.location.country_name || ''}</li>
          <li><strong>Navegador:</strong> ${data.userAgent}</li>
        `;
      })
      .catch(() => {
        document.getElementById('info-list').innerHTML = '<li>Erro ao carregar as informações.</li>';
      });
  </script>
</body>
</html>
*/
