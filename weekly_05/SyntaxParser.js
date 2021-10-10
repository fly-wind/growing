import { scan } from "./LexParser.js";

let syntax = {
    Program: [["StatementList", "EOF"]],
    StatementList: [
        ["Statement"],
        ["StatementList", "Statement"]
    ],
    Statement: [
        ["ExpressionStatement"],
        ["IfStatement"],
        ["VariableDeclaration"],
        ["FunctionDeclaration"]
    ],
    IfStatement: [
        ["if", "(", "Expression", ")", "Statement"]
    ],
    VariableDeclaration: [
        ["var", "Identifier", ";"],
        ["let", "Identifier", ";"],
    ],
    FunctionDeclaration: [
        ["function", "Identifier", "(", ")", "{", "StatementList", "}"]
    ],
    Expression: [
        ["AdditiveExpression"],
    ],
    ExpressionStatement: [
        ["Expression", ";"],
    ],
    AdditiveExpression: [
        ["MultiplicativeExpression"],
        ["AdditiveExpression", "+", "MultiplicativeExpression"],
        ["AdditiveExpression", "-", "MultiplicativeExpression"]
    ],
    MultiplicativeExpression: [
        ["PrimaryExpression"],
        ["MultiplicativeExpression", "*", "PrimaryExpression"],
        ["MultiplicativeExpression", "/", "PrimaryExpression"]
    ],
    PrimaryExpression: [
        ["(", "Expression", ")"],
        ["Literal"],
        ["Identifier"]
    ],
    Literal: [
        ["Number"],
        ["String"],
        ["Boolean"],
        ["Null"],
        ["RegularExpression"],
    ]
}

let hash = {

};

function closure(state) {
    hash[JSON.stringify(state)] = state;
    let queue = [];

    for (let symbol in state) {
        queue.push(symbol);
    }
    while (queue.length) {
        let symbol = queue.shift();

        if (syntax[symbol]) {
            for (let rule of syntax[symbol]) {
                if (!state[rule[0]]) {
                    queue.push(rule[0]);
                }
                let current = state;

                for (let part of rule) {
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
                current._reduceType = symbol;
                current._reduceLength = rule.length;
                // state[rule[0]] = true;
            }
        }
    }
    for (let symbol in state) {
        if (symbol.match(/^\_/)) {
            return;
        }
        if (hash[JSON.stringify(state[symbol])]) {
            state[symbol] = hash[JSON.stringify(state[symbol])];
        } else {
            closure(state[symbol]);
        }
    }
}

let end = {
    _isEnd: true
};
let start = {
    "Program": end
};

closure(start);

function parse(source) {
    let stack = [start];
    let symbolStack = [];

    function reduce() {
        let state = stack[stack.length - 1]

        console.log(state, 'state')
        if (state._reduceType) {
            let children = [];

            for (let i = 0; i < state._reduceLength; i++) {
                stack.pop();
                children.push(symbolStack.pop());
            }

            // create a non-terminal symbol and shift it 
            return {
                type: state._reduceType,
                children: children.reverse()
            }
        } else {
            throw new Error("unexpected token")
        }
    }

    function shift(symbol) {
        let state = stack[stack.length - 1];

        if (symbol.type in state) {
            stack.push(state[symbol.type]);
            symbolStack.push(symbol);
        } else {
            /*reduce to non-terminal symbols*/
            shift(reduce());
            shift(symbol);
        }
    }
    for (let symbol/*terminal symbols*/ of scan(source)) {
        shift(symbol);
    }
    return reduce()
}

let evaluator = {
    Program(node) {
        return evaluate(node.children[0])
    },
    StatementList(node) {
        if (node.children.length === 1) {
            return evaluate(node.children[0])
        } else {
            evaluate(node.children[0])
            return evaluate(node.children[1])
        }
    },
    Statement(node) {
        return evaluate(node.children[0])
    },
    VariableDeclaration(node) {
        console.log(node.children[1].name)
    },
    EOF() {
        return null;
    }
}

function evaluate(node) {
    if (evaluator[node.type]) {
        return evaluator[node.type](node);
    }
}

let source = `
    let a;
    let b;
`;

let tree = parse(source);

evaluate(tree);