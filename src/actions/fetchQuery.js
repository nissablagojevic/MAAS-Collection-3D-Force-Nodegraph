import  serialize  from 'serialize-javascript';

function fetchQuery(url, options) {

    if (typeof options.method === 'undefined') {
        options.method = 'GET'
    }

    //@TODO: DRY this out
    if (options.method === 'POST') {

        console.log(serialize({query: options.query}, {isJSON: true}));
        return fetch(url, {
            method: options.method,
            headers: {
                'content-type': 'application/json'
            },
            body: serialize({query: options.query}, {isJSON: true}) || options.query
        })
            .then(response => {
                if (!response.ok) {
                    console.log(
                        'FETCH ERROR: ' + response.status + ' -- ' + response.statusText
                    );
                }
                return response.json();
            });
    }
    else {
        return fetch(url, {
            method: options.method,
            headers: {
                'content-type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    console.log(
                        'FETCH ERROR: ' + response.status + ' -- ' + response.statusText
                    );
                }
                return response.json();
            });
    }


}

export default fetchQuery;