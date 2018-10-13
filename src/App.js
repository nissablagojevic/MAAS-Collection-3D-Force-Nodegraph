import { default as React, Component } from 'react';

import 'bootstrap/dist/css/bootstrap.css';

import { BrowserRouter as Router, Route } from 'react-router-dom';

import { Navigation, About, Nodegraph, SelectNarrative } from './components';

import {sourceUrl, sourceQuery, mapData} from './components/resolvers.js';

import Helmet from 'react-helmet';

import qwest from 'qwest';

class App extends Component {
    constructor() {
        super();
        this.state = {
            narrative: null
        }

        this.getNarrative = this.getNarrative.bind(this);
    }

    componentDidMount() {
        let app = this;

        let urlNarrative;
        //this is bound to be a problem
        if(this.props.location && this.props.location.pathname) {
            urlNarrative = parseInt(this.props.location.pathname.substring(1), 10);
            console.log("URL NARRATIVE");
            console.log(urlNarrative);
        }

        var promise = new Promise(function(resolve, reject) {
            // do a thing, possibly async, then…
            app.getNarrative();

            if (app.state.narrative) {
                resolve("Stuff worked!");
            }
            else {
                reject(Error("It broke"));
            }
        });

        promise.then(function(result) {
            console.log(result); // "Stuff worked!"
        }, function(err) {
            console.log(err); // Error: "It broke"
        });
    }

    getNarrative() {
        //@TODO This should be handled in App.js so we're not repeating it in SelectorNarrative
        let urlNarrative;
        //this is bound to be a problem
        if(this.props.location && this.props.location.pathname) {
            urlNarrative = parseInt(this.props.location.pathname.substring(1), 10);
        }

        this.setState({ selectedNode: null});

        qwest.get(sourceUrl + sourceQuery(urlNarrative)).then((xhr, response) => {
            this.setState({narrative: urlNarrative, responseData: response.data, fetchingJson: false});
        }).catch(function (e, xhr, response) {
            // Process the error in getting the json file
            console.log('DATA RETRIEVAL ERROR');
            console.log(e);
        });
    }


    render() {
        return (
            <div id="page">
                <Helmet
                    titleTemplate="%s | Intercollectic Planetary"
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
                    <div>
                        <Navigation/>
                        <div style={{position: 'relative'}}>
                            <Route path="/" component={SelectNarrative}/>
                            <Route exact path="/about" component={About}/>
                            <Route exact path="/:id" component={Nodegraph} />
                        </div>
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
