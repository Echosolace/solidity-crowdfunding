var DefaultBuilder = require("truffle-default-builder");

module.exports = {
  build: new DefaultBuilder({
    "index.html": "index.html",
    "app.js": [
      "javascripts/jquery-3.1.1.min.js",
      "javascripts/pickadate.picker.js",
      "javascripts/pickadate.picker.date.js",
      "javascripts/pickadate.picker.time.js",
      "javascripts/app.js"
    ],
    "app.css": [
      "stylesheets/pickadate.classic.css",
      "stylesheets/pickadate.classic.date.css",
      "stylesheets/pickadate.classic.time.css",
      "stylesheets/app.css"
    ]
  }),
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    }
}
};
