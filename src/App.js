import { default as React, Component } from 'react';

import 'bootstrap/dist/css/bootstrap.css';

import { BrowserRouter as Router, Route } from 'react-router-dom';

import { Navigation, About} from './components';
import { NodegraphContainer } from './containers';

import Helmet from 'react-helmet';

class App extends Component {
    constructor() {
        super();
        this.state = {
        }
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
                        {/** @TODO: Fix routing **/}
                            <Route exact path="/about" render={() => <About/>}/>
                            <Route path="/:id" render={
                                (props) => {
                                    console.log("ROUTER");
                                    console.log(props);
                                    return <NodegraphContainer {...props}/>
                                }} />
                        </div>
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
