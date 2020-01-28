import stubs from './stubs';

const axios = require('axios');

const TIMEOUT = 1; // in seconds
const QUERY_CEIL = 1; // max queries allowed per session
const STUB_API = process.env.STUB; // should we stub the actual API call to save $$$
const AIRPORT = 'DCA';

module.exports = {

  queryCount: 0,
  currBoard: {},

  init () {
    this.id = Math.floor(Math.random() * 1000000);
    console.log(`Starting flight API worker ${this.id} with a delay of ${TIMEOUT} seconds`);
    this.queryInterval();
  },

  /**
   * Kill the worker
   */
  stop () {
    console.log(`Stopping flight API worker ${this.id}`);
    clearTimeout(this.timer);
  },

  /**
   * Set a recurring timer that will query the API every TIMEOUT seconds
   */
  queryInterval () {
    this.getAirportBoard(AIRPORT).catch(e => {
      throw new Error(`Error: ${e}`);
    });
    this.timer = setTimeout(() => {
      if (this.queryCount < QUERY_CEIL) {
        this.queryInterval();
      }
    }, TIMEOUT * 1000);
  },

  /**
   * Query the raw data from the FlightAware API; perform no transformations
   */
  async getAirportBoard (airport) {
    if (typeof airport !== 'string') {
      throw new Error(`Airport code ${airport} must be a string`);
    }
    // TODO add check to ensure that env vars are defined
    let result;
    if (!STUB_API) {
      result = await axios.get(`${process.env.V3_URL}AirportBoards`, {
        auth: {
          username: process.env.FA_USERNAME,
          password: process.env.V3_API
        },
        params: {
          airport_code: airport
        }
      });
    } else {
      result = await new Promise((resolve, reject) => {
        return resolve(stubs.AirportBoards);
      });
    }
    this.queryCount++;
    console.log(`FlightAware API${STUB_API ? ' *STUB* ' : ' '}queried; total queries: ${this.queryCount}`);
    this.currBoard = result.data.AirportBoardsResult || {};
  },

  queryAirportBoard () {
    return this.currBoard;
  },
};
