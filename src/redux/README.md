# Store structure

```js
{
  auth: {
    pending: false,
    user: {},
  },
  network: {
    pending: {
      [id] : { id, name, progress },
    },
    success: {},
    error: {},
    backlog: [ {contents of outdated pending, success, and errors} ],
  },
  preferences: {
    clusters: {
      pending: false,
      list: [
        { name, config, status }
      ],
      active: 0,
      presets: {
        [name]: { prop: value, ... }
      }
    },
    aws: {
      pending: false,
      list: [],
      active: 0,
    },
    statuses: {
      clusters: [ {...} ],
      ec2: [ {...} ],
    }
  },
  projects: {
    workflowNames: [{ label: 'Saturn', value: 'saturn' }, ...],
    list: [ '2345', '3456345' ],
    active: '2345', // or null
    mapById: {
      '2345' : {
        _id: 2345,
        name: 'sdfsdf',
        description: '',
      }
    },
    simulations: {
      [pid]: {
        list: ['2345', '567657'],
        active: '2345',
        mapById: {

        },
      }
    }
  },
}
```