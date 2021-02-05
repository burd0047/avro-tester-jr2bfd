import React, { Component } from 'react';
import { render } from 'react-dom';
import Hello from './Hello';
import './style.css';
import './avsc';
import Result from 'folktale/result';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {
  stubTrue,
  stubFalse
} from 'lodash/fp';

const log = console.log;


const jsonToBuffer = (json, schema) => {
  try {
    log("json:", json);
    log("schema:", schema);
    const type = avro.Type.forSchema(schema);
    const buf = type.toBuffer(json);
    return Result.Ok(buf);
  } catch (err) {
    return Result.Error(`schema validation failed: ${err}`);
  }
};

const inferSchema = json => {
  try {
    const type = avro.Type.forValue(json);
    return Result.Ok(type);
  } catch (err) {
    return Result.Error(err);
  }
};

const safeParseJSON = jsonString => {
  try {
    const result = JSON.parse(jsonString);
    return Result.Ok(result);
  } catch(err) {
    return Result.Error(`Failed to parse json: ${err}`);
  }
};

const inputFieldStyle = {
  minWidth: '400px'
};

const textAreaStyle = {
  color: 'rgba(0, 0, 0, 0.54)',
  display: 'block',
  fontSize: '14px',
  fontFamily: 'Roboto, sans-serif',
  minWidth: '394px'
};

const cardStyle = {
  maxWidth: '420px'
};

const linkButton = {
  textDecoration: 'underlined',
  color: '#00BCD4',
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: 'React'
    };
  }

  autoFill = () => {
    this.setState({
      schema: '{"type":"record","fields":[{"name":"kind","type":{"type":"enum","symbols":["CAT","DOG"]}},{"name":"name","type":"string"}]}',
      json: `{"kind": "CAT", "name": "Albert"}`
    });
  };

  handleSchemaChange = event => {
    this.setState({
      schema: event.target.value,
    });
  };

  handleJSONChange = event => {
    this.setState({
      json: event.target.value,
    });
  };

  validate = () => {
    log("schema:", this.state.schema);
    log("json:", this.state.json);
    const parseSchemaResult = safeParseJSON(this.state.schema);
    const parseJSONResult = safeParseJSON(this.state.json);
    const parseSchemaWorked = parseSchemaResult.matchWith({
      Error: stubFalse,
      Ok: stubTrue
    });
    const parseJSONWorked = parseJSONResult.matchWith({
      Error: stubFalse,
      Ok: stubTrue
    });
    if(parseSchemaWorked === true && parseJSONWorked === true) {
      const worked = jsonToBuffer(parseJSONResult.value, parseSchemaResult.value)
      .matchWith({
        Error: value => {
          this.setState({
            results: `Failed: ${value.value}`
          });
          return false;
        },
        Ok: value => {
          this.setState({
            results: 'AVRO Schema validated successfully'
          });
          return true;
        }
      });
      log("worked:", worked);
    } else {
      log("failed:", parseSchemaResult.value, parseJSONResult.value);
      this.setState({
        results: `schema: ${parseSchemaResult.value}\n
json: ${parseJSONResult.value}`
      });
    }
  };

  clearSchema = () => {
    this.setState({
      schema: ''
    })
  };

  clearJSON = () => {
    this.setState({
      json: ''
    })
  };

  inferSchemaFromJSON = () => {
    safeParseJSON(this.state.json)
    .chain(value => inferSchema(value))
    .matchWith({
      Error: ({value}) => {
        this.setState({
          results: `Failed to infer schema: ${value}`
        });
      },
      Ok: ({value}) => {
        this.setState({
          schema: JSON.stringify(value.toJSON()),
          results: 'Successfully inferred AVRO schema from JSON.'
        })
      }
    })
  };


  render() {
    return (
      <MuiThemeProvider>
      <Card style={cardStyle}>
        <CardHeader
          title="AVRO Schema Validator"
          subtitle="Paste your AVRO schema and JSON below to see if they validate against the schema."
        />
        <CardText>
          <b>Schema:</b><br />
          <TextField
            hintText="<Paste Schema Here>"
            multiLine={true}
            rows={1}
            rowsMax={2}
            style={inputFieldStyle}
            value={this.state.schema}
            onChange={this.handleSchemaChange}
          /><br />
          <a style={linkButton}
            onClick={this.clearSchema}>clear</a><br /><br />
          <b>JSON:</b><br />
          <TextField
            hintText="<Paste JSON Here>"
            multiLine={true}
            rows={1}
            rowsMax={2}
            style={inputFieldStyle}
            value={this.state.json}
            onChange={this.handleJSONChange}
          /><br />
          <a style={linkButton}
            onClick={this.clearJSON}>clear</a> |
          <a style={linkButton}
            onClick={this.inferSchemaFromJSON}> infer schema</a><br /><br />
          <b>Results:</b>
          <textarea name="textarea"
            rows="4"
            cols="40"
            style={textAreaStyle}
            value={this.state.results}></textarea>
        </CardText>
        <CardActions>
          <RaisedButton label="Validate"
            primary={true}
            onClick={this.validate} />
          <RaisedButton label="Auto-Fill"
            onClick={this.autoFill} />
        </CardActions>
      </Card>
      </MuiThemeProvider>
    );
  }
}

render(<App />, document.getElementById('root'));
