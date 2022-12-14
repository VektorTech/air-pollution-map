const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  mode: "development",
  devtool: 'inline-source-map',
  output: {
    filename: "script.bundle.js",
    path: path.resolve(__dirname, "public"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.glsl$/i,
        use: ["raw-loader", "glslify-loader"],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devServer: {
    static: "./public",
    port: 3000,
    hot: true
  }
};
