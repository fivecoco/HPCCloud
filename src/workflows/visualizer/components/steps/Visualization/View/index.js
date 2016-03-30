import ButtonBar        from '../../../../../../panels/ButtonBar';
import JobMonitor       from '../../../../../../panels/JobMonitor';

import deepClone        from 'mout/src/lang/deepClone';
import merge            from 'mout/src/object/merge';
import React            from 'react';
// import TaskflowManager  from '../../../../../../network/TaskflowManager';

import { connect }      from 'react-redux';
import { dispatch }     from '../../../../../../redux';
import * as Actions     from '../../../../../../redux/actions/taskflows';
import * as SimActions  from '../../../../../../redux/actions/projects';

const ACTIONS = {
  terminate: { name: 'terminateTaskflow', label: 'Terminate', icon: '' },
  visualize: { name: 'visualizeTaskflow', label: 'Visualize', icon: '' },
  rerun: { name: 'deleteTaskflow', label: 'New visualization', icon: '' },
};

function getActions(actionsList, disabled) {
  return actionsList.map((action) => Object.assign({ disabled }, ACTIONS[action]));
}

const visualizationView = React.createClass({
  displayName: 'pvw/view-visualization',

  propTypes: {
    location: React.PropTypes.object,
    project: React.PropTypes.object,
    simulation: React.PropTypes.object,
    step: React.PropTypes.string,
    taskFlowName: React.PropTypes.string,
    view: React.PropTypes.string,

    onTerminateTaskflow: React.PropTypes.func,
    onDeleteTaskflow: React.PropTypes.func,
    onVisualizeTaskflow: React.PropTypes.func,
    onStatusChange: React.PropTypes.func,

    taskflowId: React.PropTypes.string,
    taskflow: React.PropTypes.object,
    error: React.PropTypes.string,
  },

  contextTypes: {
    router: React.PropTypes.object,
  },

  onAction(action) {
    this[action]();
  },

  visualizeTaskflow() {
    const location = {
      pathname: `View/Simulation/${this.props.simulation._id}/Visualization`,
      query: merge(this.props.location.query, { view: 'default' }),
      state: this.props.location.state,
    };
    const newSimState = deepClone(this.props.simulation);
    newSimState.steps.Visualization.metadata.dataDir = this.primaryJobOutput;
    newSimState.active = 'Visualization';
    newSimState.disabled = newSimState.disabled.filter(step => step !== 'Visualization');

    this.props.onVisualizeTaskflow(newSimState, location);
  },

  terminateTaskflow() {
    this.props.onTerminateTaskflow(this.props.taskflowId);
  },

  deleteTaskflow() {
    const simulationStep = {
      id: this.props.simulation._id,
      step: 'Visualization',
      data: {
        view: 'default',
        metadata: {},
      },
    };
    const location = {
      pathname: this.props.location.pathname,
      query: { view: 'default' },
      state: this.props.location.state,
    };

    this.props.onDeleteTaskflow(this.props.taskflowId, simulationStep, location);
  },

  render() {
    if (!this.props.taskflow) {
      return null;
    }

    const { taskflow, taskflowId, simulation, error } = this.props;
    const jobs = Object.keys(taskflow.jobMapById).map(id => taskflow.jobMapById[id]);
    const tasks = Object.keys(taskflow.taskMapById).map(id => taskflow.taskMapById[id]);
    const allComplete = jobs.every(job => job.status === 'complete') && tasks.every(task => task.status === 'complete');
    const actions = [];
    const simulationStatus = [simulation.metadata.status];

    // Extract meaningful information from props
    if (jobs.every(job => job.status === 'terminated')) {
      // every terminated -> rerun
      simulationStatus.push('terminated');
      actions.push('rerun');
    } else if (!allComplete && (jobs.length + tasks.length) > 0 && !jobs.some(job => job.status === 'terminating')) {
      // some running -> terminate
      simulationStatus.push('running');
      actions.push('terminate');
    // every job complete && task complete -> visualize
    } else if (allComplete) {
      simulationStatus.push('complete');
      actions.push('visualize');
    }

    return (
      <div>
          <JobMonitor taskFlowId={ taskflowId } />
          <section>
              <ButtonBar
                onAction={ this.onAction }
                actions={ getActions(actions, false)}
                error={error}
              />
          </section>
      </div>);
  },
});

export default connect(
  (state, props) => {
    var taskflowId = null;
    const activeProject = state.projects.active;
    const activeSimulation = activeProject ? state.projects.simulations[activeProject].active : null;

    if (activeSimulation) {
      const simulation = state.projects.simulations[activeProject].mapById[activeSimulation];
      taskflowId = simulation.steps.Visualization.metadata.taskflowId;
    }

    return {
      taskflowId,
      taskflow: taskflowId ? state.taskflows.mapById[taskflowId] : null,
      error: null,
    };
  },
  () => ({
    onStatusChange: (simulation, status) => dispatch(SimActions.saveSimulation(Object.assign({}, simulation, { status }))),
    onVisualizeTaskflow: (sim, location) => {
      dispatch(SimActions.saveSimulation(sim, null));
      const metadata = sim.steps.Visualization.metadata;
      dispatch(SimActions.updateSimulationStep(sim._id, 'Visualization', { metadata }, location));
    },
    onDeleteTaskflow: (id, simulationStep, location) => dispatch(Actions.deleteTaskflow(id, simulationStep, location)),
    onTerminateTaskflow: (id) => dispatch(Actions.terminateTaskflow(id)),
  })
)(visualizationView);
