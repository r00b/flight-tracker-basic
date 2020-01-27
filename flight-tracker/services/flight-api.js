const axios = require('axios');

const TIMEOUT = 15000;

module.exports = {

  url: 'https://flightxml.flightaware.com/json/FlightXML2/',

  queryCount: 0,

  res: [ 'no results yet!' ],

  init () {
    console.log(`Starting flight worker with a delay of ${TIMEOUT / 1000} seconds`);
    this.start();
  },

  start () {
    this.queryApi();
    this.timer = setTimeout(() => {
      if (this.queryCount < 25) {
        this.start();
      }
    }, TIMEOUT);
  },

  kill () {
    clearTimeout(this.timer);
  },

  query (q) {
    let res = this.res;
    if (q.origin) {
      res = res.filter(flight => flight.origin === q.origin);
    }
    if (q.destination) {
      res = res.filter(flight => flight.destination === q.destination);
    }
    return res;
  },

  queryApi () {
    axios.get(`${this.url}Search`, {
      auth: {
        username: process.env.FLIGHTAWARE_USERNAME,
        password: process.env.FLIGHTAWARE_APIKEY
      },
      params: {
        query: '-belowAltitude 100 -latlong "38.76329 -77.19891 38.98460 -76.874127"'
      }
    }).then(response => {
      this.res = response.data.SearchResult.aircraft;
      this.queryCount++;
      // TODO calculate cost of this run
      console.log(`FlightAware API queried; total queries: ${this.queryCount}`);
    }).catch(error => {
      return error;
    });
  }
};
