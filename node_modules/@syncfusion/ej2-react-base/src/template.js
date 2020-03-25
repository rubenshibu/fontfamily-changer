/**
 * Template compiler for react
 */
import { setTemplateEngine, getTemplateEngine, detach, extend } from '@syncfusion/ej2-base';
import * as ReactDOM from 'react-dom';
// tslint:disable:no-any
var stringCompiler = getTemplateEngine();
export function compile(templateElement, helper) {
    if (typeof templateElement === 'string') {
        return stringCompiler(templateElement, helper);
    }
    else {
        return function (data) {
            var ele = document.createElement('div');
            document.body.appendChild(ele);
            var actTemplate = templateElement;
            var actData = data;
            if (typeof actTemplate === 'object') {
                actTemplate = templateElement.template;
                actData = extend({}, data, templateElement.data || {});
            }
            ReactDOM.render(actTemplate(actData), ele);
            detach(ele);
            return ele.children;
        };
    }
}
setTemplateEngine({ compile: compile });
