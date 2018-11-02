import { default as React, Component } from 'react';
import { Selector, AccordionSection } from './';
import './SelectNarrative.css';

class SelectNarrative extends Component {
    constructor() {
        super();
        this.state = {
            selectedNarrative: ''
        };

        this.selectNarrative = this.selectNarrative.bind(this);
    }

    componentDidMount() {
        console.log("SELECT NARRATIVE");
        this.selectNarrative();
    }

    selectNarrative(event) {
        console.log(event);
        let narrative;
        let location;
        if (!event) {
            console.log(this.props);
            if (this.props.selectedNarrative) {
                narrative = this.props.selectedNarrative;
            } else {
                narrative = '';
            }
        } else {
            narrative = parseInt(event.target.value, 10);
            location = {
                pathname: `/${narrative}`,
            };

            this.props.history.push(location)
        }
        this.setState({selectedNarrative: narrative});
    }

  render() {
        let selectNarrative = <div>
                                  <h3>Narrative</h3>
                                  <Selector
                                    selectedItem={this.props.selectedNarrative}
                                    list={this.props.narrativesList}
                                    action={this.selectNarrative}/>
                                </div>;

        if (this.props.display === 'accordion') {
            const content = <Selector
              selectedItem={this.props.selectedNarrative}
              list={this.props.narrativesList}
              action={this.selectNarrative}/>;

              selectNarrative = <AccordionSection
                                  key="narrative"
                                  title="Narrative"
                                  content={content}
                                  isOpen={this.props.open}
                                />;
        }

        return selectNarrative;
    }
}

export default SelectNarrative;
