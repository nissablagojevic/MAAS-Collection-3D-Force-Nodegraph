import { default as React, Component } from 'react';

import 'bootstrap/dist/css/bootstrap.css';

import { fetchQuery } from './actions';

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


    componentDidMount() {
        /**console.log("WORDPRESS");
         fetchQuery('https://nissablagojevic.dev/wp-json/wp/v2/pages/154?_embed', {method: 'GET'})
         .then(json => {
          console.log("JSON");
          console.log(json);
          if(typeof json === 'object') {
            this.setState({wordPress: json});
          }
          return json;
        });**/
    }

    handleErrors(response) {
        if (!response.ok) {
            console.log(
                'FETCH ERROR: ' + response.status + ' -- ' + response.statusText
            );
        }
        return response;
    }

    /**
    renderApp(wordpressObject) {

        var wP = '';

        if (typeof wordpressObject === 'object') {
            wP = <article id={"post-" + this.state.wordPress.id}>
                <a href="{this.state.wordPress.title.rendered}" className="">

                    <header className="entry-header">
                        <h1 className="entry-title">{this.state.wordPress.title.rendered}</h1>
                    </header>
                </a>
                {this.state.wordPress.content.rendered}
            </article>;
        }

        return wP;
    }**/

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
          {/** {this.renderApp(this.state.wordPress)}**/}
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
