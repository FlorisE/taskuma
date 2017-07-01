import React, { Component } from 'react';
import './App.css';

window.socket = new WebSocket("ws://localhost:3001");

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
        return <li>{this.props.description} {this.props.hours}:{this.props.minutes} <a href="#done" onClick={this.done}>done!</a></li>; 
    }
}

class ParentTaskItem extends Component {
    render() { 
        return <li>
            { this.props.isDone ? 
                  <s>{this.props.description} {this.props.hours}:{this.props.minutes}</s>
                : <span>{this.props.description} {this.props.hours}:{this.props.minutes}</span> 
            }
        </li>; 
    }
}

class TaskList extends Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    render() {
        return (
            <ul>
                { this.props.tasks.map(
                    (taskItem) => this.props.isParent ?
                        <ParentTaskItem key={taskItem.description} description={taskItem.description} hours={taskItem.hours} minutes={taskItem.minutes} isDone={taskItem.isDone} />
                      : <ChildTaskItem key={taskItem.description} description={taskItem.description} hours={taskItem.hours} minutes={taskItem.minutes} removeTask={this.props.removeTask} />
                )}
            </ul>
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
            <div>
              <input type="text" name="task" value={this.state.description} onChange={this.handleTaskChange} />
              <input type="text" name="hours" value={this.state.hours} size="2" onChange={this.handleHoursChange} />
              <span>:</span>
              <input type="text" name="minutes" value={this.state.minutes} size="2" onChange={this.handleMinutesChange} />
              <button onClick={this.handleAddTask}>Add task</button>
            </div>
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
              <TaskList isParent={this.state.isParent} tasks={this.state.tasks} removeTask={this.markDone} />
              {this.state.isParent ? <AddField addTask={this.submitTask} /> : null}
              {this.state.isParent ? <a href="#toChild" onClick={this.toChild}>To child</a> : null}
            </div>
        );
    }
}

export default App;
