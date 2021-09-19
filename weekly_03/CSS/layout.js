function getStyle(element) {
    if (!element.style) {
        element.style = {};
    }
    for (let prop in element.computedStyle) {
        let p = element.computedStyle.value;

        element.style[prop] = element.computedStyle[prop].value;

        if (element.style[prop].toString().match(/px$/) || element.style[prop].toString().match(/^[0-9\.]+$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style;
}

function layout(element) {
    if (!element.computedStyle) {
        return;
    }
    let elementStyle = getStyle(element);

    if (elementStyle.display !== "flex") {
        return;
    }
    // 过滤不要文本节点
    let items = element.children.filter(e => e.type === "element");

    items.sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
    });

    let style = elementStyle;

    ["width", "height"].forEach(size => {
        if (style[size] === "auto" || style[size] === "") {
            style[size] = null;
        }
    });

    if (!style.flexDirection || style.flexDirection === "auto") {
        style.flexDirection = "row";
    }
    if (!style.alignItems || style.alignItems === "auto") {
        style.alignItems = "stretch";
    }
    if (!style.justifyContent || style.justifyContent === "auto") {
        style.justifyContent = "flex-start";
    }
    if (!style.flexWrap || style.flexWrap === "auto") {
        style.flexWrap = "nowarp";
    }
    if (!style.alignContent || style.alignContent === "auto") {
        style.alignContent = "stretch";
    }

    let mainSize, mainStart, mainEnd, mainSign, mainBase, crossSize, crossStart, crossEnd, crossSign, crossBase;

    if (style.flexDirection === "row") {
        mainSize = "width";
        mainStart = "left";
        mainEnd = "right";
        mainSign = +1;
        mainBase = 0;
        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }
    if (style.flexDirection === "row-reverse") {
        mainSize = "width";
        mainStart = "right";
        mainEnd = "left";
        mainSign = -1;
        mainBase = style.width;
        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }
    if (style.flexDirection === "column") {
        mainSize = "height";
        mainStart = "top";
        mainEnd = "bottom";
        mainSign = +1;
        mainBase = 0;
        crossSize = "width";
        crossStart = "left";
        crossEnd = "right";
    }
    if (style.flexDirection === "column-reverse") {
        mainSize = "height";
        mainStart = "bottom";
        mainEnd = "top";
        mainSign = -1;
        mainBase = style.width;
        crossSize = "width";
        crossStart = "left";
        crossEnd = "right";
    }
    if (style.flexDirection === "wrap-reverse") {
        let temp = crossStart;

        crossStart = crossEnd;
        crossEnd = temp;
        crossSign = -1;
    } else {
        crossBase = 0;
        crossSign = 1;
    }

    let isAutoMainSize = false;

    if (!style[mainSize]) {
        // auto sizing
        elementStyle[mainSize] = 0;
        items.forEach(item => {
            // let itemStyle = getStyle(item);
            let itemStyle = item.style;

            // @todo
            if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0)) {
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
            }
        })
        isAutoMainSize = true;
    }

    let flexLine = [];
    let flexLines = [flexLine];
    let mainSpace = elementStyle[mainSize];
    let crossSpace = 0;

    items.forEach(item => {
        let itemStyle = getStyle(item);

        if (itemStyle[mainSize === null]) {
            itemStyle[mainSize] = 0;
        }
        if (itemStyle.flex) {
            // 可伸缩的
            flexLine.push(item);
        } else if (style.flexWrap === "nowrap" && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize];
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item);
        } else {
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }
            if (mainSpace < itemStyle[mainSize]) {
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                // 创建新行
                flexLine = [item];
                flexLines.push(flexLine);
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else {
                flexLine.push(item);
            }
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            mainSpace -= itemStyle[mainSize];
        }
    });
    flexLine.mainSpace = mainSpace;

    if (style.flexWrap === "nowrap" || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    } else {
        flexLine.crossSpace = crossSpace;
    }

    if (mainSpace < 0) {
        // 单行
        // 根据主轴等比压缩
        let scale = style[mainSize] / (style[mainSize] - mainSpace);
        let currentMain = mainBase;

        items.forEach(item => {
            let itemStyle = getStyle(item);

            if (itemStyle.flex) {
                itemStyle[mainSize] = 0;
            }
            itemStyle[mainSize] = itemStyle[mainSize] * scale;
            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        });
    } else {
        // 多行
        flexLines.forEach(items => {
            let mainSpace = items.mainSpace;
            let flexTotal = 0;

            items.forEach(item => {
                let itemStyle = getStyle(item);

                if (itemStyle.flex !== null && itemStyle.flex !== (void 0)) {
                    flexTotal += itemStyle.flex;
                    return;
                }
            });
            if (flexTotal > 0) {
                let currentMain = mainBase;

                items.forEach(item => {
                    let itemStyle = getStyle(item);

                    if (itemStyle.flex) {
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                });
            } else {
                let currentMain = mainBase;
                let step = 0;

                if (style.justifyContent === "flex-start") {
                    // let currentMain = mainBase;
                    // let step = 0;
                }
                if (style.justifyContent === "flex-end") {
                    currentMain = mainSpace * mainSign + mainBase;
                    step = 0;
                }
                if (style.justifyContent === "center") {
                    currentMain = mainSpace / 2 * mainSign + mainBase;
                    step = 0;
                }
                if (style.justifyContent === "space-between") {
                    currentMain = mainBase;
                    step = mainSpace / (items.length - 1) * mainSign;
                }
                if (style.justifyContent === "space-around") {
                    currentMain = step / 2 + mainBase;
                    step = mainSpace / items.length * mainSign;
                }
                items.forEach(item => {
                    itemStyle[mainStart, currentMain];
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                });
            }
        });
    }

    // 计算交叉轴

    if (!style[crossSize]) {
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        flexLines.forEach(item => {
            elementStyle[crossSize] = elementStyle[crossSize] + item.crossSpace;
        });
    } else {
        // 如果有行高
        crossSpace = style[crossSize];
        flexLines.forEach(item => {
            crossSpace -= item.crossSpace;
        });
    }

    if (style.flexWrap === "wrap-reverse") {
        crossBase = style[crossSize];
    } else {
        crossBase = 0;
    }
    let lineSize = style[crossSize] / flexLines.length;
    let step;

    switch (style.alignContent) {
        case "flex-start":
            crossBase += 0;
            step = 0;
            break;
        case "flex-end":
            crossBase += crossSign * crossSpace;
            step = 0;
            break;
        case "center":
            crossBase += crossSign * crossSpace / 2;
            step = 0;
            break;
        case "space-between":
            crossBase += 0
            step = crossSpace / (flexLines.length - 1);
            break;
        case "space-around":
            crossBase += crossSign * step / 2;
            step = crossSpace / flexLines.length;
            break;
        case "stretch":
            crossBase += 0;
            step = 0;
            break;
    }
    flexLines.forEach(items => {
        let lineCrossSize = style.alignContent === "stretch" ? items.crossSpace + crossSpace / flexLines.length : items.crossSpace;

        items.forEach(item => {
            let itemStyle = getStyle(item);
            let align = itemStyle.alignSelf || style.alignItems;

            if (item === null) {
                itemStyle[crossSize] = (align === "stretch") ? lineCrossSize : 0;
            }
            switch (align) {
                case "flex-start":
                    itemStyle[crossStart] = crossBase;
                    itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
                    break;
                case "flex-end":
                    itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
                    itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                    break;
                case "center":
                    itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize] / 2);
                    itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
                    break;
                case "stretch":
                    itemStyle[crossStart] = crossBase;
                    itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)));
                    itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
                    break;
            }
        });
        crossBase += crossSign * (lineCrossSize + step);

    });
}

module.exports = layout;