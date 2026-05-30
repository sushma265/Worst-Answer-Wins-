const cors = require("cors");

app.use(
  cors({
    origin: "https://worst-answer-wins.vercel.app",
    credentials: true,
  })
);