import { default as React, Component } from 'react';

import 'bootstrap/dist/css/bootstrap.css';

import { BrowserRouter as Router, Route } from 'react-router-dom';

import { Navigation, About, Nodegraph } from './components';

import Helmet from 'react-helmet';

class App extends Component {
    constructor() {
        super();
        this.state = {
            development: '',
            wordPress: ''
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


    renderRoutes(env) {
        var prefix = '/';
        if (env === 'production') {
            prefix = '/maas/';
        }

        return (<div className="routes">
            <Route exact path={prefix} component={Nodegraph} />
            <Route path={prefix + 'about'} component={About} />
        </div>);

    }

    setEnv() {
        var currentUrl = window.location.host;
        var development = this.state.development;
        if (currentUrl.indexOf('nissablagojevic') >= 0) {
            development = 'production';
        }
        else {
            development = 'development';
        }
        return development;
    }

    render() {
        return (
            <div id="page">
                <Helmet
                    titleTemplate="%s | NodeGraph of Museum Collection"
                    meta={[
                        {
                            name: `viewport`,
                            content: `width=device-width, initial-scale=1`
                        },
                        {
                            name: `description`,
                            content: `maas api example application`
                        },
                        {
                            property: `og:type`,
                            content: `article`
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
                        <Navigation development={this.setEnv()}/>

                        {this.renderRoutes(this.setEnv())}
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
