const axios = require('axios');

const TIMEOUT = 15000;

module.exports = {

  url: 'https://flightxml.flightaware.com/json/FlightXML2/',
  username: 'rsteilberg',
  apiKey: '2b08f3fa6ae5e20afb32f41390b6122a5e13f563',

  queryCount: 0,

  res: [],

  init () {
    console.log(`Starting flight worker with a delay of ${TIMEOUT/1000} seconds`);
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
        username: this.username,
        password: this.apiKey
      },
      params: {
        query: '-belowAltitude 100 -latlong "38.76329 -77.19891 38.98460 -76.874127"'
      }
    }).then(response => {
      this.res = response.data.SearchResult.aircraft;
    }).catch(error => {
      return error;
    });
  }
};
