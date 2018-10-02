import { default as React, Component } from 'react';
import qwest from 'qwest';
import {sourceUrl, narrativesList} from './resolvers.js';

import Selector from './Selector';
import Instructions from './Instructions';

class SelectNarrative extends Component {
    constructor() {
        super();
        this.state = {
            selectedNarrative: '',
            narrativesList: null
        };

        this.selectNarrative = this.selectNarrative.bind(this);
    }

    componentDidMount() {
        let urlNarrative;

        //this is bound to be a problem
        if(this.props.location && this.props.location.pathname) {
            urlNarrative = parseInt(this.props.location.pathname.substring(1), 10);
            if (!isNaN(urlNarrative)) {
                this.setState({selectedNarrative: urlNarrative});
            }
        }

        //fetch list of narratives from API
        qwest.get(sourceUrl + narrativesList).then((xhr, response) => {
            this.setState({narrativesList: response.data.narratives});
        }).catch(function(e, xhr, response) {
            // Process the error in getting the json file
            console.log('DATA RETRIEVAL ERROR');
            console.log(e);
        });
    }

    selectNarrative(event) {
        let narrative = parseInt(event.target.value, 10);

        const location = {
            pathname: `/${narrative}`,
        };

        this.setState({selectedNarrative: narrative});
        this.props.history.push(location);
    }

    render() {
        return (
            <div className="narrativeSelect">

                <h3>Narrative:</h3>
                <Selector
                    selectedItem={this.state.selectedNarrative}
                    list={this.state.narrativesList}
                    action={this.selectNarrative}/>
                <Instructions/>
            </div>
        );
    }
}

export default SelectNarrative;
