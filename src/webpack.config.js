const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production', // Cambia a 'development' si estás desarrollando
  entry: './src/index.js', // Archivo de entrada (tu JS principal)
  output: {
    path: path.resolve(__dirname, 'dist'), // Carpeta de salida
    filename: '[name].[contenthash].js', // Genera un nombre único con un hash
    clean: true, // Limpia la carpeta 'dist' antes de cada build
  },
  module: {
    rules: [
      {
        test: /\.css$/, // Procesa archivos CSS
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Tu archivo HTML original
    }),
  ],
};
