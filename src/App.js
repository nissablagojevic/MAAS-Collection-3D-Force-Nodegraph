import { default as React, Component } from 'react';

import 'bootstrap/dist/css/bootstrap.css';

import { BrowserRouter as Router, Route } from 'react-router-dom';

import { Navigation, About, Nodegraph, SelectNarrative } from './components';

import Helmet from 'react-helmet';

class App extends Component {
    constructor() {
        super();
        this.state = {
        }
    }

    handleErrors(response) {
        if (!response.ok) {
            console.log(
                'FETCH ERROR: ' + response.status + ' -- ' + response.statusText
            );
        }
        return response;
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
