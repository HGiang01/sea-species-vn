const taxonParser = (str: string) => {
    if (!str) return { name: "", author: "" };

    const words = str.split(" ");
    const nameParts = [words[0]];
    let authorIndex = words.length;

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const firstChar = word[0];

        if (firstChar === "(") {
            if (nameParts.length === 1) {
                nameParts.push(word);
            } else {
                authorIndex = i;
                break;
            }
        } else if (firstChar !== firstChar.toLowerCase()) {
            authorIndex = i;
            break;
        } else {
            nameParts.push(word);
        }
    }

    const authorParts = words.slice(authorIndex);

    return {
        name: nameParts.join(" "),
        author: authorParts.join(" "),
    };
};

export default taxonParser;
