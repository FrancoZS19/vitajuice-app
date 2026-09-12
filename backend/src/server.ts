import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Servidor VitaJuice API activo en el puerto ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});
