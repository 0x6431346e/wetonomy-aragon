import Aragon from '@aragon/client'
// import {Events, Methods} from './utils/membersContractWrapper'
// import {of} from './rxjs'
// import {range} from './utils/utility'
// import Member from './models/Member'

const INITIALIZATION_TRIGGER = 'INITIALIZATION_TRIGGER'

const app = new Aragon()

app.store((state, event) => {
  switch (event.event) {
    case 'HoursTracked':
      return { count: "Ioko" }
    default:
      return { count: "Laina" }
  }
})


/***********************
 * Event Handlers      *
 ***********************/



/***********************
 * Read Handles        *
 ***********************/
