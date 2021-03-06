function kmp(source, pattern) {
    let table = new Array(pattern.length).fill(0);

    {
        // i 表示开始匹配子串的位置
        let i = 1; j = 0;

        while (i < pattern.length) {
            if (pattern[i] === pattern[j]) {
                ++j, ++i;
                table[i] = j;
            } else {
                if (j > 0) {
                    j = table[j];
                } else {
                    ++i;
                }
            }
        }
        console.log(table);
    }
    {
        let i = 0; j = 0;

        while (i < source.length) {
            if (pattern[j] === source[i]) {
                ++j, ++i;
            } else {
                if (j > 0) {
                    j = table[j];
                } else {
                    ++i;
                }
            }
            if (j === pattern.length) {
                return true;
            }
        }
        return false;
    }

}

// console.log(kmp('ABC ABCDAB ABCDABCDABDE', 'ABCDABD'));
console.log(kmp('abcdabcdabce', 'abcdabce'))