const path = require("path");

module.exports = {
  entry: {
    "sandbox-iframe": "./src/index.ts",
    "sandbox-iframe.min": "./src/index.ts",
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules)/,
        loader: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "umd",
    umdNamedDefine: true,
  },
  devtool: "source-map",
  optimization: {
    // minimizer: [
    //   new UglifyJsPlugin({
    //     parallel: true,
    //     sourceMap: true,
    //     include: /\.min\.js$/,
    //   }),
    // ],
  },
};
