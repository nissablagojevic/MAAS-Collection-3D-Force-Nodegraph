import { default as React, Component } from 'react';

import { BrowserRouter as Router, Route } from 'react-router-dom';

import { Intro } from './components';
import { NodegraphContainer } from './containers';

import Helmet from 'react-helmet';
import {narrativesList, sourceUrl} from "./components/resolvers";

class App extends Component {
    constructor() {
        super();
        this.state = {
          narrativesList: null,
        };

        this.getNarrativeList = this.getNarrativeList.bind(this);
    }

  componentDidMount() {
      this.getNarrativeList();
  }

  //get list of all narratives
  async getNarrativeList() {
    try {
      let response = await fetch(
        sourceUrl + narrativesList
      );
      let responseJson = await response.json();
      this.setState({narrativesList: responseJson.data.narratives});
      return responseJson;
    } catch(error) {
      console.error(error);
    }
  }


  render() {

        return (
            <div id="page">
                <Helmet
                    titleTemplate="%s | Intercollectic Planetary"
                    title="Intercollectic Planetary - A force directed graph of the MAAS Collection"
                    meta={[
                        {
                            name: `viewport`,
                            content: `width=device-width, initial-scale=1`
                        },
                        {
                            name: `description`,
                            content: `Force directed graph of the MAAS Collection`
                        },
                        {
                            property: `og:type`,
                            content: `website`
                        },
                        {
                            name: `theme-color`,
                            content: `#000000`
                        },
                        {
                            charset: `utf-8`
                        }
                    ]}
                />

                <Router>
                    <div id="routes">
                    {/** @TODO: Fix routing **/}
                        <Route exact path="/" render={(props) => <Intro {...props} getNarrativesList={this.getNarrativeList} narrativesList={this.state.narrativesList}/>}/>
                        <Route path="/:id" render={
                            (props) => {
                              let result = null;
                              if (props.match.params.id === parseInt(props.match.params.id,10).toString()) {
                                result = <NodegraphContainer
                                          {...props}
                                          getNarrativesList={this.getNarrativeList}
                                          narrativesList={this.state.narrativesList}
                                          />;
                              }
                              return result;
                            }} />
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
