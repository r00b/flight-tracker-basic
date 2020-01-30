var express = require('express');
var router = express.Router();
var flightApi = require('./../services/flight-api');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json(flightApi.getClosestFlight());
});

module.exports = router;
