import React, { Component } from 'react';
import './App.css';

window.socket = new WebSocket("ws://localhost:3001");

class TaskItem extends Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value };
    this.removeTask = this.props.removeTask;
    this.done = this.done.bind(this);

  }

  done() {
    this.removeTask(this.props.value);
  }

  render() { 
    return <li>{this.state.value} <a href="#done" onClick={this.done}>done!</a></li>; 
  }
}

class AddField extends Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
    this.addTask = this.props.addTask;
    this.handleTaskChange = this.handleTaskChange.bind(this);
    this.handleAddTask = this.handleAddTask.bind(this);
  }

  handleAddTask(event) {
    this.addTask(this.state.value);
    this.setState({ value: '' });
  }

  handleTaskChange(event) {
    this.setState({
      value: event.target.value
    });
  }

  render() { 
    return (
      <div>
        <input type="text" name="task" value={this.state.value} onChange={this.handleTaskChange} />
        <button onClick={this.handleAddTask}>Add task</button>
      </div>
    );
  }

}

class App extends Component {

  constructor() {
    super();
    this.state = {
      tasks: []
    };
    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
  }

  componentDidMount() {
    window.socket.onmessage = (event) => {
      let taskToAdd = event.data;
      if (this.state.tasks.indexOf(taskToAdd) === -1)
        this.addTask(event.data);
    };
  }

  submitTask(task) {
    window.socket.send(task);
  }

  addTask(task) {
    if (task === '') return;
    this.setState(
      (prevState, props) => ({
        tasks: prevState.tasks.concat([task])
      })
    );
  }

  removeTask(task) {
    let findAndRemove = (item, list) => {
      let index = list.indexOf(item);
      if (index !== -1) {
        list.splice(index, 1);
      }
      return list;
    };
    this.setState(
      (prevState, props) => ({
        tasks: findAndRemove(task, prevState.tasks)
      })
    );
  }

  render() {
    const taskItems = this.state.tasks.map(
      (taskItem) => <TaskItem key={taskItem} value={taskItem} removeTask={this.removeTask} />
    );
    return (
      <div className="App">
        {taskItems}
        <AddField addTask={this.submitTask} />
      </div>
    );
  }
}

export default App;
