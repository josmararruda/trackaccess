const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const basicAuth = require("basic-auth");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

const auth = (req, res, next) => {
  const user = basicAuth(req);
  const username = "admin";
  const password = "senha123";

  if (!user || user.name !== username || user.pass !== password) {
    res.set("WWW-Authenticate", 'Basic realm="Área restrita"');
    return res.status(401).send("Autenticação requerida.");
  }
  next();
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.get("/info", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  let locationData = {};
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    locationData = await response.json();
  } catch (err) {
    console.error("Erro ao obter localização:", err);
  }

  const logLine = `[${new Date().toISOString()}] IP: ${ip}, Navegador: ${userAgent}, País: ${locationData.country_name || "desconhecido"}\n`;
  fs.appendFile("acessos.log", logLine, (err) => {
    if (err) console.error("Erro ao registrar acesso:", err);
  });

  res.json({
    ip,
    userAgent,
    location: locationData
  });
});

app.get("/logs", auth, (req, res) => {
  const logPath = "acessos.log";
  if (fs.existsSync(logPath)) {
    res.sendFile(path.resolve(logPath));
  } else {
    res.status(404).send("Arquivo de logs não encontrado.");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
