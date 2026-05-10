import app from "./app.js";
import { ENV } from "./config/env.js";

app.listen(ENV.PORT, () => {
  console.log(`🚀 API running on http://localhost:${ENV.PORT}`);
});
