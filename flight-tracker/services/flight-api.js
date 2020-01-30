import stubs from './stubs';

const axios = require('axios');
const _ = require('lodash');

const TIMEOUT = 1; // in seconds
const QUERY_CEIL = 1; // max queries allowed per session
// const STUB_API = process.env.STUB; // should we stub the actual API call to save $$$
const STUB_API = false;
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
    // this.timer = setTimeout(() => {
    //   if (this.queryCount < QUERY_CEIL) {
    //     this.queryInterval();
    //   }
    // }, TIMEOUT * 1000);
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
    this.currBoard = _.get(result, 'data.AirportBoardsResult') || {};
  },

  getClosestFlight () {
    // here, we will take currBoard and the current time in millis
    // and so some work with it
    const currTime = parseInt(Date.now().toString().substring(0,10));
    const board = this.currBoard;
    // here, logic determines if we want taking off or landing
    const enRoute = true;
    let flight;
    if (enRoute) {
      flight = this.nextInboundFlight(this.filterInvalidFlights(_.get(board, 'enroute.flights')), currTime);
    } else {
      flight = this.nextOutboundFlight(this.filterInvalidFlights(_.get(board, 'scheduled.flights')), currTime);
    }
    return flight || {}; // TODO -- should we really return this?
  },

  /**
   * Filter out any flights that have been:
   *  1. cancelled
   */
  filterInvalidFlights (flights) {
    return flights.filter(flight => {
      return (!flight.cancelled);
    });
  },

  nextInboundFlight (flights, time) {
    if (_.isEmpty(flights)) return {};
    // the API should only return flights enroute sorted by ascending arrival time,
    // but we won't always have the most up-to-date result, so calculate it on the
    // fly with the data we currently have
    // first, filter out any elapsed flights (could make this a bit more efficient)
    let airborneFlights = flights.filter(flight => {
      return flight.estimated_arrival_time.epoch > time;
    });
    // then, sort them to be sure we get the plane that is soonest to land
    airborneFlights = _.sortBy(airborneFlights, ['estimated_arrival_time.localtime']);
    const nextFlight = _.head(airborneFlights);
    if (nextFlight) {
      nextFlight.approx_time_visible = nextFlight.estimated_arrival_time.epoch - 120000;
    }
    return _.head(airborneFlights);
  },

  nextOutboundFlight (flights, time) {
    if (_.isEmpty(flights)) return {};
    // the API should only return scheduled flights sorted by ascending departure time,
    // but we won't always have the most up-to-date result, so calculate it on the
    // fly with the data we currently have


    let pendingFlights = flights.filter(flight => {
      // want all flights that have not taken off or passed the office
      // so this will be any flight with a departure time greater than the current time
      // or flights that have taken off but have less than 30 seconds of flight time (TODO)
      return flight.estimated_departure_time.epoch < time;
    });







    // then, sort them to be sure we get the plane that is about to fly over office
    pendingFlights = _.sortBy(pendingFlights, ['estimated_departure_time.localtime']);
    const nextFlight = _.head(pendingFlights);
    if (nextFlight) {
      nextFlight.approx_time_visible = nextFlight.estimated_departure_time.epoch;
    }
    return _.head(pendingFlights);
  }
};
