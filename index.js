var details = [], ignoreEleList = ['script', 'style', 'link', 'br'];
function getFirstScreenTime() {
    return new Promise(function (resolve, reject) {
        // 5s之内先收集所有的dom变化，并以key（时间戳）、value（dom list）的结构存起来。
        var observeDom = new MutationObserver(function (mutations) {
            if (!mutations || !mutations.forEach)
                return;
            var detail = {
                time: performance.now(),
                roots: []
            };
            mutations.forEach(function (mutation) {
                if (!mutation || !mutation.addedNodes || !mutation.addedNodes.forEach)
                    return;
                mutation.addedNodes.forEach(function (ele) {
                    if (ele.nodeType === 1 && ignoreEleList.indexOf(ele.nodeName.toLocaleLowerCase()) === -1) {
                        if (!isEleInArray(ele, detail.roots)) {
                            detail.roots.push(ele);
                        }
                    }
                });
            });
            if (detail.roots.length) {
                details.push(detail);
            }
        });
        observeDom.observe(document, {
            childList: true,
            subtree: true
        });
        setTimeout(function () {
            observeDom.disconnect();
            resolve(details);
        }, 5000);
    }).then(function (details) {
        // 分析上面收集到的数据，返回最终的结果
        var result;
        details.forEach(function (detail) {
            for (var i = 0; i < detail.roots.length; i++) {
                if (isInFirstScreen(detail.roots[i])) {
                    result = detail.time;
                    break;
                }
            }
        });
        // 遍历当前请求的图片中，如果有开始请求时间在首屏dom渲染期间的，则表明该图片是首屏渲染中的一部分，
        // 所以dom渲染时间和图片返回时间中大的为首屏渲染时间
        window.performance.getEntriesByType('resource').forEach(function (resource) {
            if (resource.initiatorType === 'img' && (resource.fetchStart < result || resource.startTime < result) && resource.responseEnd > result) {
                result = resource.responseEnd;
            }
        });
        return result;
    });
}
function isEleInArray(target, arr) {
    if (!target || target === document.documentElement) {
        return false;
    }
    else if (arr.indexOf(target) !== -1) {
        return true;
    }
    else {
        return isEleInArray(target.parentElement, arr);
    }
}
function isInFirstScreen(target) {
    if (!target || !target.getBoundingClientRect)
        return false;
    var rect = target.getBoundingClientRect(), screenHeight = window.innerHeight, screenWidth = window.innerWidth;
    return rect.left >= 0
        && rect.left < screenWidth
        && rect.top >= 0
        && rect.top < screenHeight;
}
