require('dotenv').config(); // Thêm dòng này đầu file
const app = require('./src/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Server also accessible via network IP: http://192.130.38.110:${PORT}`);
  console.log(`Swagger UI at http://localhost:${PORT}/api/docs`);
});


