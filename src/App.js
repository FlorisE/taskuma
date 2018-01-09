import React, { Component } from 'react';
import './App.css';

window.socket = new WebSocket("ws://192.168.11.2:3001");

class ChildTaskItem extends Component {
    constructor(props) {
        super(props);
        this.removeTask = this.props.removeTask;
        this.done = this.done.bind(this);
    }

    done() {
        this.removeTask(this.props.description);
    }
  
    render() { 
        return <tr width="50%">
          <td width="70%">{this.props.description}</td>
          <td witdth="15%">{this.props.hours}:{this.props.minutes}</td>
          <td width="15%"><a href="#done" onClick={this.done}>done!</a></td>
        </tr>; 
    }
}

class Logo extends Component {
    render() {
        return <img width="50%" src={(this.props.tasks.filter((task) => !task.isDone).length === 0) ? 'happy.jpg' : 'sad.jpg'} alt='logo' /> 
    }
}

class ParentTaskItem extends Component {
    render() { 
        return <tr>
          <td>
            { this.props.isDone ? 
                  <s>{this.props.description} {this.props.hours}:{this.props.minutes}</s>
                : <span>{this.props.description} {this.props.hours}:{this.props.minutes}</span> 
            }
          </td>
        </tr>; 
    }
}

class TaskList extends Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    render() {
        return (
            <table width='100%'>
                { this.props.tasks.map(
                    (taskItem) => this.props.isParent ?
                        <ParentTaskItem key={taskItem.description} description={taskItem.description} hours={taskItem.hours} minutes={taskItem.minutes} isDone={taskItem.isDone} />
                      : <ChildTaskItem key={taskItem.description} description={taskItem.description} hours={taskItem.hours} minutes={taskItem.minutes} removeTask={this.props.removeTask} />
                )}
            </table>
        );
    }
}

class AddField extends Component {
    constructor(props) {
        super(props);
        this.state = { description: '', hours: '', minutes: '' };
        this.addTask = this.props.addTask;
        this.handleTaskChange = this.handleTaskChange.bind(this);
        this.handleHoursChange = this.handleHoursChange.bind(this);
        this.handleMinutesChange = this.handleMinutesChange.bind(this);
        this.handleAddTask = this.handleAddTask.bind(this);
    }
  
    handleAddTask(event) {
        this.addTask({ 
            description: this.state.description,
            hours: this.state.hours, 
            minutes: this.state.minutes
        });
        this.setState({ description: '', hours: '', minutes: '' });
    }
  
    handleTaskChange(event) {
        this.setState({
            description: event.target.value
        });
    }
  
    handleHoursChange(event) {
        this.setState({
            hours: event.target.value
        });
    }
  
    handleMinutesChange(event) {
        this.setState({
            minutes: event.target.value
        });
    }
  
    render() { 
        return (
            <table>
              <tr>
                <th>Task</th>
                <th>HH</th>
                <th />
                <th>MM</th>
                <th />
              </tr>
              <tr>
                <td>
                  <input type="text" name="task" value={this.state.description} onChange={this.handleTaskChange} />
                </td>
                <td>
                  <input type="text" name="hours" value={this.state.hours} size="2" onChange={this.handleHoursChange} />
                </td>
                 <td>
                  <span>:</span>
                </td>
                <td>
                  <input type="text" name="minutes" value={this.state.minutes} size="2" onChange={this.handleMinutesChange} />
                </td>
                <td>
                  <button onClick={this.handleAddTask}>Add task</button>
                </td>
              </tr>
            </table>
        );
    }

}

class App extends Component {

    constructor() {
        super();
        this.state = {
            tasks: [],
            isParent: true // true = child, false = parent
        };
        this.addTask = this.addTask.bind(this);
        this.removeTask = this.removeTask.bind(this);
        this.toChild = this.toChild.bind(this);
        this.markDone = this.markDone.bind(this);
    }
  
    componentDidMount() {
        window.socket.onmessage = (event) => {
            let taskToAdd = JSON.parse(event.data);
            switch (taskToAdd.action) {
                case "add":
                    this.addTask(taskToAdd.description, taskToAdd.hours, taskToAdd.minutes);
                    break;
                case "done":
                    if (this.state.isParent) 
                        this.processMarkedDone(taskToAdd.description);
                    break;
                default: break;
            }
        };
    }
  
    submitTask(task) {
        task.action = "add";
        window.socket.send(JSON.stringify(task));
    }
  
    markDone(description) {
        this.removeTask(description);
        let task = {
            description: description,
            action: "done"
        }
        window.socket.send(JSON.stringify(task));
    }
  
    processMarkedDone(description) {
        let markTaskAsDone = (tasks, description) => {
            if (tasks.length === 0)
                return [];
            for (let task in tasks) {
                if (tasks[task].description === description) {
                    tasks[task].isDone = true;
                    return tasks;
                }
            }
        };
        this.setState(
            (prevState, props) => ({
                tasks: markTaskAsDone(prevState.tasks, description)
            })
        );
    } 
  
    addTask(description, hours, minutes) {
        this.setState(
            (prevState, props) => ({
                tasks: prevState.tasks.concat([
                    { description: description, hours: hours, minutes: minutes, isDone: false }
                ])
            })
        );
    }
  
    removeTask(description) {
        let findAndRemove = (item, list) => {
            let index = -1;
            for (let task in list) {
                if (list[task].description === description) {
                    index = task;
                    break;
                }
            }
            if (index !== -1) {
                list.splice(index, 1);
            }
            return list;
        };
        this.setState(
            (prevState, props) => ({
                tasks: findAndRemove(description, prevState.tasks)
            })
        );
    }
  
    toChild() {
        this.setState({
            isParent: false
        });
    }
  
    render() {
        return (
            <div className="App">
              <Logo tasks={this.state.tasks} />
              <TaskList isParent={this.state.isParent} tasks={this.state.tasks} removeTask={this.markDone} />
              {this.state.isParent ? <AddField addTask={this.submitTask} /> : null}
              {this.state.isParent ? <a href="#toChild" onClick={this.toChild}>To child</a> : null}
            </div>
        );
    }
}

export default App;
