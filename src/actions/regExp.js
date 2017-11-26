
function regExp(regex, string) {
    let m = regex.exec(string);
    var matches = [];

    while (m !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            matches.push(match);
        });
    }

    return matches;
}

export default regExp;